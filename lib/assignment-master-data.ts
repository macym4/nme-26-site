import { createHash } from "node:crypto";
import { prisma } from "./prisma";
import { getFeedbackSheetRows } from "./feedback-sheet";
import { buildPairingData } from "./pairing-data";
import { MASTER_KEY } from "./assignment-master";

export function masterVersion(assignments: { id: string; memberOne: string; memberTwo: string; week: number }[], initialized: boolean) {
  return createHash("sha256").update(JSON.stringify({ initialized, rows: assignments.map(({ id, memberOne, memberTwo, week }) => ({ id, memberOne, memberTwo, week })).sort((a, b) => a.id.localeCompare(b.id)) })).digest("hex");
}

export async function getAssignmentMaster() {
  const [roster, saved, marker] = await Promise.all([
    prisma.rosterMember.findMany({ orderBy: { canonicalName: "asc" } }),
    prisma.dateAssignment.findMany({ orderBy: { week: "asc" } }),
    prisma.siteContent.findUnique({ where: { key: MASTER_KEY } }),
  ]);
  let assignments = saved.map(({ memberOne, memberTwo, week }) => ({ memberOne, memberTwo, week }));
  let available = true;
  if (!marker) {
    try {
      const sheets = await Promise.all([getFeedbackSheetRows("PC 25 Summary Sheet"), getFeedbackSheetRows("PC 26 Summary Sheet")]);
      assignments = buildPairingData(roster, assignments, sheets, []).assignments;
    } catch (error) {
      console.error("Could not load existing assignments for the master sheet.", error);
      available = false;
    }
  }
  return { roster, assignments, available, initialized: Boolean(marker), version: masterVersion(saved, Boolean(marker)) };
}
