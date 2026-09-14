import { parsePairings } from "./date-assignment-import";
import { assignmentKey, validateMasterAssignments, type MasterAssignment } from "./assignment-master";
import { normalizeMemberName } from "./roster";

export function importWeeklyAssignments(source: string, week: number, existing: MasterAssignment[], aliases: Record<string, string>) {
  if (!Number.isInteger(week) || week < 1 || week > 52) throw new Error("Choose a week between 1 and 52.");
  const pairs = parsePairings(source);
  if (!pairs.length) throw new Error("Paste a member and at least one partner on each row, separated by tabs, commas, or semicolons.");
  const resolve = (name: string) => aliases[normalizeMemberName(name)] ?? name.trim();
  const dates = new Map(existing.map((date) => [assignmentKey(date), date]));
  for (const pair of pairs) {
    const date = { memberOne: resolve(pair.one), memberTwo: resolve(pair.two), week };
    validateMasterAssignments([date]);
    dates.set(assignmentKey(date), date);
  }
  return validateMasterAssignments([...dates.values()]);
}
