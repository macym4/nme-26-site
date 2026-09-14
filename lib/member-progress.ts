import { cache } from "react";
import { syncDateFeedbackCompletions } from "@/lib/date-feedback";
import { prisma } from "@/lib/prisma";
import { normalizeMemberName } from "@/lib/roster";

export type MemberDateStatus = { id: string; week: number; partner: string; complete: boolean };

export function datesForMember(names: string[], assignments: { id: string; week: number; memberOne: string; memberTwo: string }[], completed: Set<string>): MemberDateStatus[] {
  const knownNames = new Set(names.map(normalizeMemberName));
  return assignments.filter((date) => knownNames.has(normalizeMemberName(date.memberOne)) || knownNames.has(normalizeMemberName(date.memberTwo)))
    .map((date) => ({ id: date.id, week: date.week, partner: knownNames.has(normalizeMemberName(date.memberOne)) ? date.memberTwo : date.memberOne, complete: completed.has(date.id) }))
    .sort((one, two) => one.week - two.week || one.partner.localeCompare(two.partner));
}

export const getFeedbackSyncStatus = cache(async () => {
  try {
    await syncDateFeedbackCompletions();
    return true;
  } catch (error) {
    console.error("Could not refresh sister-date feedback; using saved progress.", error);
    return false;
  }
});

export const getMemberDateStatus = cache(async (userId: string) => {
  await getFeedbackSyncStatus();
  const [user, assignments, completions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { rosterMember: true } }),
    prisma.dateAssignment.findMany({ orderBy: [{ week: "asc" }, { assignedAt: "asc" }] }),
    prisma.dateFeedbackCompletion.findMany({ where: { userId } }),
  ]);
  if (!user) return [];
  const names = [user.name];
  if (user.rosterMember) names.push(user.rosterMember.canonicalName, user.rosterMember.dateSheetName, ...JSON.parse(user.rosterMember.aliases) as string[]);
  return datesForMember(names, assignments, new Set(completions.map((item) => item.assignmentId)));
});
