import { cache } from "react";
import { getFormFeedbackResponses, type FormFeedbackResponse } from "@/lib/date-feedback";
import { prisma } from "@/lib/prisma";
import { normalizeMemberName } from "@/lib/roster";

export type MemberDateStatus = { id: string; week: number; partner: string; complete: boolean };

export function datesForMember(names: string[], assignments: { id: string; week: number; memberOne: string; memberTwo: string }[], completed: Set<string>): MemberDateStatus[] {
  const knownNames = new Set(names.map(normalizeMemberName));
  return assignments.filter((date) => knownNames.has(normalizeMemberName(date.memberOne)) || knownNames.has(normalizeMemberName(date.memberTwo)))
    .map((date) => ({ id: date.id, week: date.week, partner: knownNames.has(normalizeMemberName(date.memberOne)) ? date.memberTwo : date.memberOne, complete: completed.has(date.id) }))
    .sort((one, two) => one.week - two.week || one.partner.localeCompare(two.partner));
}

const getFeedbackSnapshot = cache(async () => {
  try {
    return { available: true, responses: await getFormFeedbackResponses() };
  } catch (error) {
    console.error("Could not refresh sister-date feedback; using saved progress.", error);
    return { available: false, responses: [] as FormFeedbackResponse[] };
  }
});

export const getFeedbackSyncStatus = cache(async () => (await getFeedbackSnapshot()).available);

type FeedbackRosterMember = { canonicalName: string; dateSheetName: string; aliases: string };

export function applyLiveFeedback(names: string[], dates: MemberDateStatus[], responses: Pick<FormFeedbackResponse, "member" | "partner">[], roster: FeedbackRosterMember[]): MemberDateStatus[] {
  const aliases = new Map(roster.flatMap((member) =>
    [member.canonicalName, member.dateSheetName, ...JSON.parse(member.aliases) as string[]]
      .map((name) => [normalizeMemberName(name), normalizeMemberName(member.canonicalName)] as const)));
  const resolve = (name: string) => aliases.get(normalizeMemberName(name)) ?? normalizeMemberName(name);
  const memberNames = new Set(names.map(resolve));
  const submitted = new Set(responses.filter((response) => memberNames.has(resolve(response.member)))
    .map((response) => resolve(response.partner)));
  return dates.map((date) => ({ ...date, complete: submitted.has(resolve(date.partner)) }));
}

export const getMemberDateStatus = cache(async (userId: string) => {
  const [feedback, user, assignments, completions, roster] = await Promise.all([
    getFeedbackSnapshot(),
    prisma.user.findUnique({ where: { id: userId }, include: { rosterMember: true } }),
    prisma.dateAssignment.findMany({ orderBy: [{ week: "asc" }, { assignedAt: "asc" }] }),
    prisma.dateFeedbackCompletion.findMany({ where: { userId } }),
    prisma.rosterMember.findMany({ select: { canonicalName: true, dateSheetName: true, aliases: true } }),
  ]);
  if (!user) return [];
  const names = [user.name];
  if (user.rosterMember) names.push(user.rosterMember.canonicalName, user.rosterMember.dateSheetName, ...JSON.parse(user.rosterMember.aliases) as string[]);
  const dates = datesForMember(names, assignments, new Set(completions.map((item) => item.assignmentId)));
  return feedback.available ? applyLiveFeedback(names, dates, feedback.responses, roster) : dates;
});
