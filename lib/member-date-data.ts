import { getFormFeedbackResponses } from "@/lib/date-feedback";
import { getExistingWeekPairings } from "@/lib/pairing-data";
import { pairingKey } from "@/lib/pairings";
import { normalizeMemberName } from "@/lib/roster";

export type LiveDateAssignment = { id: string; week: number; partner: string; memberOne: string; memberTwo: string };

export async function getLiveDateAssignments(memberName: string): Promise<LiveDateAssignment[]> {
  const name = normalizeMemberName(memberName);
  const pairings = await getExistingWeekPairings();
  const assignments = Object.values(pairings).flatMap((weeks) => Object.entries(weeks).flatMap(([week, rows]) => rows.flatMap((row) => {
    if (normalizeMemberName(row.primary) === name) return row.partners.map((partner) => ({ id: `sheet-${week}-${pairingKey(row.primary, partner)}`, week: Number(week), partner, memberOne: memberName, memberTwo: partner }));
    return row.partners.filter((partner) => normalizeMemberName(partner) === name).map(() => ({ id: `sheet-${week}-${pairingKey(row.primary, memberName)}`, week: Number(week), partner: row.primary, memberOne: memberName, memberTwo: row.primary }));
  })));
  return [...new Map(assignments.map((assignment) => [assignment.id, assignment])).values()].sort((left, right) => left.week - right.week || left.partner.localeCompare(right.partner));
}

export async function getLiveFeedbackPairs(memberName: string) {
  const responses = await getFormFeedbackResponses();
  return new Set(responses.filter((response) => normalizeMemberName(response.member) === normalizeMemberName(memberName)).map((response) => pairingKey(memberName, response.partner)));
}
