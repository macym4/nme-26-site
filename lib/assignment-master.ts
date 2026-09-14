import { feedbackKey, pairingKey } from "./pairings";

export type MasterAssignment = { memberOne: string; memberTwo: string; week: number };
export type AssignmentMember = { name: string; pledgeClass: string };
export const MASTER_KEY = "date-assignment-master";

export function isClassMember(member?: AssignmentMember) {
  return member?.pledgeClass === "PC 25" || member?.pledgeClass === "PC 26";
}

export function specialPartnerDates(dates: MasterAssignment[], members: AssignmentMember[]) {
  const rosterNames = new Set(members.filter(isClassMember).map((member) => member.name));
  return dates.flatMap((date, index) => {
    const one = rosterNames.has(date.memberOne), two = rosterNames.has(date.memberTwo);
    if (one && two) return [];
    return [{ ...date, index, member: two ? date.memberTwo : date.memberOne, partner: two ? date.memberOne : date.memberTwo, hasClassMember: one || two }];
  });
}

export function assignmentKey(date: MasterAssignment) {
  return `${date.week}:${pairingKey(date.memberOne, date.memberTwo)}`;
}

export function validateMasterAssignments(input: unknown): MasterAssignment[] {
  if (!Array.isArray(input) || input.length > 5000) throw new Error("The master sheet must contain at most 5,000 dates.");
  const keys = new Set<string>();
  return input.map((row) => {
    if (!row || typeof row.memberOne !== "string" || typeof row.memberTwo !== "string" || !Number.isInteger(row.week) || row.week < 1 || row.week > 52) {
      throw new Error("Each date needs two names and a week between 1 and 52.");
    }
    const date = { memberOne: row.memberOne.trim(), memberTwo: row.memberTwo.trim(), week: row.week };
    if (!date.memberOne || !date.memberTwo || date.memberOne.length > 150 || date.memberTwo.length > 150 || feedbackKey(date.memberOne, date.memberTwo) === feedbackKey(date.memberTwo, date.memberOne)) {
      throw new Error("Choose two different members for every date.");
    }
    const key = assignmentKey(date);
    if (keys.has(key)) throw new Error(`Week ${date.week}: ${date.memberOne} and ${date.memberTwo} are assigned more than once.`);
    keys.add(key);
    return date;
  });
}

export function memberWeekDates(dates: MasterAssignment[], name: string, week: number) {
  return dates.flatMap((date, index) => date.week === week && (date.memberOne === name || date.memberTwo === name)
    ? [{ ...date, index, partner: date.memberOne === name ? date.memberTwo : date.memberOne }] : []);
}
