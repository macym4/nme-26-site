"use server";

import { revalidatePath } from "next/cache";
import { requireUserAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignmentKey, MASTER_KEY, validateMasterAssignments } from "@/lib/assignment-master";
import { masterVersion } from "@/lib/assignment-master-data";

export async function saveAssignmentMaster(input: unknown, version: string) {
  await requireUserAdmin();
  try {
    const dates = validateMasterAssignments(input);
    await prisma.$transaction(async (tx) => {
      const saved = await tx.dateAssignment.findMany();
      const marker = await tx.siteContent.findUnique({ where: { key: MASTER_KEY } });
      if (masterVersion(saved, Boolean(marker)) !== version) throw new Error("Assignments changed since you opened this page. Reload before saving to avoid overwriting another edit.");
      const keep = new Set(dates.map(assignmentKey));
      const existing = new Map<string, typeof saved[number]>();
      const removed: string[] = [];
      for (const date of saved) {
        const key = assignmentKey(date);
        if (!keep.has(key) || existing.has(key)) removed.push(date.id);
        else existing.set(key, date);
      }
      await tx.dateFeedbackCompletion.deleteMany({ where: { assignmentId: { in: removed } } });
      await tx.dateAssignment.deleteMany({ where: { id: { in: removed } } });
      for (const date of dates) {
        if (!existing.has(assignmentKey(date))) await tx.dateAssignment.create({ data: date });
      }
      await tx.siteContent.upsert({ where: { key: MASTER_KEY }, create: { key: MASTER_KEY, title: "Date assignment master", body: "Assignments are managed on the Date Assignment page." }, update: { body: "Assignments are managed on the Date Assignment page." } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    console.error("Master assignment save failed.", error);
    return { error: error instanceof Error && !error.message.includes("prisma") ? error.message : "Could not save assignments. Reload and try again." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
