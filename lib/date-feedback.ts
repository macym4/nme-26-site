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
  const starts = names.map((index) => normalizedHeaders[index - 1]?.includes("who did you go on a sister date with") ? index - 1 : index);
  return rows.flatMap((row) => names.flatMap((nameColumn, section) => {
    const start = starts[section];
    const end = starts[section + 1] ?? headers.length;
    const get = (term: string) => {
      const column = normalizedHeaders.findIndex((header, index) => index >= start && index < end && header.includes(term));
      return column < 0 ? "" : row[column]?.trim() || "";
    };
    const member = row[nameColumn]?.trim(), partner = get("who did you go on a sister date with");
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

export function parseParsedFeedbackResponses([headers = [], ...rows]: string[][]): FormFeedbackResponse[] {
  const columns = headers.map(normalizeMemberName);
  const memberColumn = columns.indexOf("respondee");
  const partnerColumn = columns.indexOf("date name");
  if (memberColumn < 0 || partnerColumn < 0) {
    throw new Error("The Parsed Responses sheet is missing its Respondee or Date Name columns.");
  }
  return rows.flatMap((row) => {
    const get = (header: string) => row[columns.indexOf(header)]?.trim() ?? "";
    const member = row[memberColumn]?.trim(), partner = row[partnerColumn]?.trim();
    if (!member || !partner || member.startsWith("#") || partner.startsWith("#")) return [];
    return [{ member, partner, comfort: Number(get("comfort")) || 0, conversation: Number(get("flow")) || 0,
      enjoy: get("enjoy"), anotherDate: get("second date"), concerns: get("red flags"),
      bondedOver: get("what talk about"), futureDates: get("future dates"), thoughts: get("other thoughts") }];
  });
}

export const getFormFeedbackResponses = cache(async () => parseParsedFeedbackResponses(await getFeedbackSheetRows("Parsed Responses")));

export async function syncDateFeedbackCompletions() {
  const [responses, assignments, users] = await Promise.all([
    getFormFeedbackResponses(),
    prisma.dateAssignment.findMany(),
    prisma.user.findMany({ include: { rosterMember: true } }),
  ]);
  const userByName = new Map(users.flatMap((user) => {
    const roster = user.rosterMember;
    const names = [user.name, ...(roster ? [roster.canonicalName, roster.dateSheetName, ...JSON.parse(roster.aliases) as string[]] : [])];
    return names.map((name) => [normalizeMemberName(name), user] as const);
  }));
  const resolve = (name: string) => {
    const user = userByName.get(normalizeMemberName(name));
    return user?.rosterMember?.dateSheetName ?? user?.name ?? name;
  };
  const assignmentByPair = new Map(assignments.map((assignment) => [pairingKey(resolve(assignment.memberOne), resolve(assignment.memberTwo)), assignment]));
  const upserts = responses.flatMap((response) => {
    const assignment = assignmentByPair.get(pairingKey(resolve(response.member), resolve(response.partner)));
    const user = userByName.get(normalizeMemberName(response.member));
    return assignment && user ? [prisma.dateFeedbackCompletion.upsert({ where: { assignmentId_userId: { assignmentId: assignment.id, userId: user.id } }, update: { completedAt: new Date() }, create: { assignmentId: assignment.id, userId: user.id } })] : [];
  });
  await prisma.$transaction(upserts);
  return responses;
}
