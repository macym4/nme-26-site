import { cache } from "react";
import { getFeedbackSheetRows } from "@/lib/feedback-sheet";
import { prisma } from "@/lib/prisma";
import { pairingKey } from "@/lib/pairings";
import { normalizeMemberName } from "@/lib/roster";

export type FormFeedbackResponse = {
  member: string;
  partner: string;
  comfort: number;
  conversation: number;
  enjoy: string;
  anotherDate: string;
  concerns: string;
  bondedOver: string;
  futureDates: string;
  thoughts: string;
};

export function parseFormFeedbackResponses([headers = [], ...rows]: string[][]): FormFeedbackResponse[] {
  const normalizedHeaders = headers.map(normalizeMemberName);
  const names = normalizedHeaders.flatMap((header, index) => header.includes("first last name") ? [index] : []);
  if (!names.length || !normalizedHeaders.some((header) => header.includes("who did you go on a sister date with"))) {
    throw new Error("The Form Responses sheet is missing its name or date-partner columns.");
  }
  return rows.flatMap((row) => names.flatMap((start, section) => {
    const end = names[section + 1] ?? headers.length;
    const get = (term: string) => {
      const column = normalizedHeaders.findIndex((header, index) => index >= start && index < end && header.includes(term));
      return column < 0 ? "" : row[column]?.trim() || "";
    };
    const member = row[start]?.trim(), partner = get("who did you go on a sister date with");
    return member && partner ? [{
      member, partner,
      comfort: Number(get("comfortable did you feel")) || 0,
      conversation: Number(get("conversation flow")) || 0,
      enjoy: get("did you enjoy"),
      anotherDate: get("another date"),
      concerns: get("concerns or red flags"),
      bondedOver: get("talk about or bond over"),
      futureDates: get("looking for in future dates"),
      thoughts: get("any other thoughts"),
    }] : [];
  }));
}

export const getFormFeedbackResponses = cache(async () => parseFormFeedbackResponses(await getFeedbackSheetRows("Raw Form Responses")));

export async function syncDateFeedbackCompletions() {
  const [responses, assignments, users] = await Promise.all([
    getFormFeedbackResponses(),
    prisma.dateAssignment.findMany(),
    prisma.user.findMany({ include: { rosterMember: true } }),
  ]);
  const assignmentByPair = new Map(assignments.map((assignment) => [pairingKey(assignment.memberOne, assignment.memberTwo), assignment]));
  const userByName = new Map(users.flatMap((user) => [[normalizeMemberName(user.name), user], user.rosterMember ? [normalizeMemberName(user.rosterMember.dateSheetName), user] : []] as const).filter((entry): entry is [string, typeof users[number]] => Boolean(entry[0])));
  const upserts = responses.flatMap((response) => {
    const assignment = assignmentByPair.get(pairingKey(response.member, response.partner));
    const user = userByName.get(normalizeMemberName(response.member));
    return assignment && user ? [prisma.dateFeedbackCompletion.upsert({ where: { assignmentId_userId: { assignmentId: assignment.id, userId: user.id } }, update: { completedAt: new Date() }, create: { assignmentId: assignment.id, userId: user.id } })] : [];
  });
  await prisma.$transaction(upserts);
  return responses;
}
