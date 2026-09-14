import { cache } from "react";

import { getFormFeedbackResponses, type FormFeedbackResponse } from "@/lib/date-feedback";
import { getFeedbackSheetRows } from "@/lib/feedback-sheet";
import { feedbackKey, pairingKey, type ExistingPairings, type PairingFeedback, type PairingRecommendation } from "@/lib/pairings";
import { prisma } from "@/lib/prisma";
import { normalizeMemberName } from "@/lib/roster";

type RosterMember = { canonicalName: string; dateSheetName: string; pledgeClass: string; aliases: string };
type Assignment = { memberOne: string; memberTwo: string; week: number };
const weeks = [1, 2, 3, 4, 5];

function responseScore(response: FormFeedbackResponse) {
  const yesMaybe = (value: string) => /^yes$/i.test(value) ? 1 : /^(somewhat|maybe)$/i.test(value) ? .5 : 0;
  return (yesMaybe(response.enjoy) + yesMaybe(response.anotherDate) + response.comfort / 5 + response.conversation / 5 - (response.concerns ? 1 : 0)) / 6;
}

export function buildPairingData(roster: RosterMember[], savedAssignments: Assignment[], classSheets: string[][][], responses: FormFeedbackResponse[], masterAssignments = false) {
  const aliases = new Map<string, string>();
  for (const member of roster) {
    for (const name of [member.canonicalName, member.dateSheetName, ...JSON.parse(member.aliases) as string[]]) {
      aliases.set(normalizeMemberName(name), member.canonicalName);
    }
  }
  const resolve = (name: string) => aliases.get(normalizeMemberName(name)) ?? name.trim();
  const oldNames = roster.filter((member) => member.pledgeClass === "PC 25").map((member) => member.canonicalName);
  const newNames = roster.filter((member) => member.pledgeClass === "PC 26").map((member) => member.canonicalName);
  const assignments = new Map<string, Assignment>();
  const addAssignment = (memberOne: string, memberTwo: string, week: number) => {
    const one = resolve(memberOne), two = resolve(memberTwo);
    if (!one || !two || one === two) return;
    assignments.set(`${week}:${pairingKey(one, two)}`, { memberOne: one, memberTwo: two, week });
  };
  savedAssignments.forEach((assignment) => addAssignment(assignment.memberOne, assignment.memberTwo, assignment.week));
  const hardNos = new Set<string>(), mandatory = new Set<string>();
  classSheets.forEach(([headers = [], ...rows], classIndex) => {
    const normalized = headers.map(normalizeMemberName);
    const memberColumn = normalized.indexOf(classIndex === 0 ? "pc 25" : "pc 26");
    if (memberColumn < 0) throw new Error(`The PC ${classIndex === 0 ? 25 : 26} sheet is missing its member column.`);
    const classNames = classIndex === 0 ? oldNames : newNames;
    const hardColumn = normalized.indexOf("hard nos"), requestColumn = normalized.indexOf("requests");
    for (const row of rows) {
      const member = resolve(row[memberColumn] || "");
      // Placeholder rows never stand in for a real roster member.
      if (!classNames.includes(member)) continue;
      const addRules = (value: string, target: Set<string>) => value.split(/[;,\n]+/).map(resolve).filter(Boolean).forEach((partner) => target.add(pairingKey(member, partner)));
      addRules(row[hardColumn] || "", hardNos);
      addRules(row[requestColumn] || "", mandatory);
      for (const week of masterAssignments ? [] : weeks) {
        const start = normalized.findIndex((header) => header === `week ${week} dates` || header === `week ${week} pairings`);
        if (start < 0) continue;
        const next = normalized.findIndex((header, index) => index > start && /^week \d+ /.test(header));
        const end = next < 0 ? headers.length : next;
        for (let column = start + 1; column < end; column += 1) {
          if (/^pairing \d+$/.test(normalized[column]) && row[column]?.trim()) {
            addAssignment(member, row[column], week);
          }
        }
      }
    }
  });
  const allAssignments = [...assignments.values()];
  const visibleWeeks = [...new Set([...weeks, ...allAssignments.map((assignment) => assignment.week)])].sort((a, b) => a - b);
  const rowsFor = (names: string[]) => Object.fromEntries(visibleWeeks.map((week) => [week, names.map((primary) => ({
    primary,
    partners: allAssignments.filter((assignment) => assignment.week === week && (assignment.memberOne === primary || assignment.memberTwo === primary))
      .map((assignment) => assignment.memberOne === primary ? assignment.memberTwo : assignment.memberOne),
  }))]));
  const existing: ExistingPairings = { pc25: rowsFor(oldNames), pc26: rowsFor(newNames) };
  const feedback: PairingFeedback = {};
  const normalizedResponses = responses.map((response) => ({ ...response, member: resolve(response.member), partner: resolve(response.partner) }));
  for (const response of normalizedResponses) {
    feedback[feedbackKey(response.member, response.partner)] = { comfort: response.comfort, conversation: response.conversation };
  }
  const pastPairs = new Set(allAssignments.map((assignment) => pairingKey(assignment.memberOne, assignment.memberTwo)));
  normalizedResponses.forEach((response) => pastPairs.add(pairingKey(response.member, response.partner)));
  const oldLoad = new Map(oldNames.map((name) => [name, 0]));
  const recommendations: PairingRecommendation[] = newNames.map((newMember) => {
    const priorFeedback = normalizedResponses.filter((response) => response.member === newMember && oldNames.includes(response.partner));
    const feedbackScore = priorFeedback.length ? priorFeedback.reduce((sum, response) => sum + responseScore(response), 0) / priorFeedback.length : .5;
    // The current raw workbook has no similarity matrix. Keep that input neutral
    // instead of importing traits or scores from the previous cohort's workbook.
    const candidates = oldNames.filter((older) => !hardNos.has(pairingKey(newMember, older)) && (!pastPairs.has(pairingKey(newMember, older)) || mandatory.has(pairingKey(newMember, older))))
      .map((name) => ({ name, score: .5 * .7 + feedbackScore * .3, mandatory: mandatory.has(pairingKey(newMember, name)), reason: "Balanced suggestion among available PC 25 members; no current similarity data is available." }))
      .sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || b.score - a.score || (oldLoad.get(a.name) || 0) - (oldLoad.get(b.name) || 0) || a.name.localeCompare(b.name));
    const matches = candidates.filter((candidate) => candidate.mandatory);
    for (const candidate of candidates) {
      if (matches.length < 2 && !matches.some((match) => match.name === candidate.name)) matches.push(candidate);
    }
    matches.forEach((match) => oldLoad.set(match.name, (oldLoad.get(match.name) || 0) + 1));
    return { newMember, matches, notes: [
      "Hard no entries are excluded. Requests are included unless marked hard no.",
      "Previously assigned dates and submitted date responses are excluded from regular suggestions.",
      priorFeedback.length ? "Feedback comes from the current Form Responses sheet; similarity is neutral because no current matrix exists." : "No PC 26 feedback has been submitted for this member yet; suggestions are balanced by assignment load.",
    ] };
  });
  return { recommendations, existing, feedback, assignments: allAssignments };
}

const getCurrentPairingData = cache(async () => {
  const [roster, assignments, pc25, pc26, responses, master] = await Promise.all([
    prisma.rosterMember.findMany({ where: { pledgeClass: { in: ["PC 25", "PC 26"] } }, orderBy: { canonicalName: "asc" } }),
    prisma.dateAssignment.findMany({ orderBy: [{ week: "asc" }, { assignedAt: "asc" }] }),
    getFeedbackSheetRows("PC 25 Summary Sheet"), getFeedbackSheetRows("PC 26 Summary Sheet"), getFormFeedbackResponses(),
    prisma.siteContent.findUnique({ where: { key: "date-assignment-master" } }),
  ]);
  return buildPairingData(roster, assignments, [pc25, pc26], responses, Boolean(master));
});

export async function getExistingWeekPairings() {
  const master = await prisma.siteContent.findUnique({ where: { key: "date-assignment-master" } });
  if (!master) return (await getCurrentPairingData()).existing;
  const [roster, assignments] = await Promise.all([
    prisma.rosterMember.findMany(),
    prisma.dateAssignment.findMany({ orderBy: { week: "asc" } }),
  ]);
  return buildPairingData(roster, assignments, [[["PC 25"]], [["PC 26"]]], [], true).existing;
}
export async function getPairingFeedback() { return (await getCurrentPairingData()).feedback; }
export async function getWeekSixRecommendations() { return (await getCurrentPairingData()).recommendations; }
