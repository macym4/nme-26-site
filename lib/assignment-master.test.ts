import assert from "node:assert/strict";
import test from "node:test";
import { assignmentKey, memberWeekDates, specialPartnerDates, validateMasterAssignments } from "./assignment-master";
import { parseFormFeedbackResponses } from "./date-feedback";
import { buildPairingData } from "./pairing-data";
import { feedbackKey } from "./pairings";

test("both row orientations refer to the same editable assignment", () => {
  const dates = [{ memberOne: "Older Member", memberTwo: "New Member", week: 2 }];
  assert.equal(memberWeekDates(dates, "Older Member", 2)[0].index, memberWeekDates(dates, "New Member", 2)[0].index);
  assert.equal(memberWeekDates(dates, "New Member", 2)[0].partner, "Older Member");
  assert.deepEqual(memberWeekDates(dates, "Older Member", 1), []);
});

test("special dates retain named partners without accounts and identify the member on either side", () => {
  const dates = [
    { memberOne: "Andrea Cummings", memberTwo: "Julia Cherchever", week: 1 },
    { memberOne: "Taylor McAndrew", memberTwo: "Shanti Visurakapalli", week: 1 },
    { memberOne: "Jadyn Grant", memberTwo: "Andrea Cummings", week: 1 },
  ];
  const members = [{ name: "Andrea Cummings", pledgeClass: "PC 26" }, { name: "Shanti Visurakapalli", pledgeClass: "PC 26" }, { name: "Jadyn Grant", pledgeClass: "PC 25" }];
  const special = specialPartnerDates(dates, members);
  assert.deepEqual(special.map(({ member, partner }) => ({ member, partner })), [
    { member: "Andrea Cummings", partner: "Julia Cherchever" },
    { member: "Shanti Visurakapalli", partner: "Taylor McAndrew" },
  ]);
  assert.equal(memberWeekDates(dates, "Andrea Cummings", 1)[0].partner, "Julia Cherchever");
});

test("matches the live form's partner-first sections and special-partner section independently", () => {
  const headers = ["Timestamp", "Who did you go on a sister date with?", "First & Last Name", "How did conversation flow?", "Who did you go on a sister date with?", "First & Last Name", "How did conversation flow?", "First & Last Name", "Who did you go on a sister date with?", "How did conversation flow?"];
  const responses = parseFormFeedbackResponses([headers,
    ["today", "Andrea Cummings", "Jadyn Grant", "3", "", "", "", "", "", ""],
    ["today", "", "", "", "Julia Cherchever", "Andrea Cummings", "4", "", "", ""],
    ["today", "", "", "", "", "", "", "Shanti Visurakapalli", "Taylor McAndrew", "5"],
  ]);
  assert.deepEqual(responses.map(({ member, partner, conversation }) => ({ member, partner, conversation })), [
    { member: "Jadyn Grant", partner: "Andrea Cummings", conversation: 3 },
    { member: "Andrea Cummings", partner: "Julia Cherchever", conversation: 4 },
    { member: "Shanti Visurakapalli", partner: "Taylor McAndrew", conversation: 5 },
  ]);
});

test("rejects reversed duplicates, self dates, and invalid weeks", () => {
  const date = { memberOne: "One", memberTwo: "Two", week: 1 };
  assert.throws(() => validateMasterAssignments([date, { ...date, memberOne: "Two", memberTwo: "One" }]), /more than once/);
  assert.throws(() => validateMasterAssignments([{ ...date, memberTwo: "one" }]), /different members/);
  for (const week of [0, -1, 1.5, 53]) assert.throws(() => validateMasterAssignments([{ ...date, week }]));
  assert.equal(validateMasterAssignments([date, { ...date, week: 2 }]).length, 2);
  assert.equal(assignmentKey(date), assignmentKey({ ...date, memberOne: "Two", memberTwo: "One" }));
});

test("master edits override old Google assignments and preserve later weeks", () => {
  const roster = [
    { canonicalName: "Older", dateSheetName: "Older", aliases: "[]", pledgeClass: "PC 25" },
    { canonicalName: "New", dateSheetName: "New", aliases: "[]", pledgeClass: "PC 26" },
  ];
  const sheets = [[["PC 25", "Week #1 Dates", "Pairing #1"], ["Older", "1", "New"]], [["PC 26"]]];
  const saved = [{ memberOne: "Older", memberTwo: "New", week: 7 }];
  const legacy = buildPairingData(roster, saved, sheets, []);
  assert.equal(legacy.assignments.length, 2);
  const master = buildPairingData(roster, saved, sheets, [], true);
  assert.deepEqual(master.assignments, saved);
  assert.deepEqual(master.existing.pc25[1][0].partners, []);
  assert.deepEqual(master.existing.pc25[7][0].partners, ["New"]);
  assert.deepEqual(master.existing.pc26[7][0].partners, ["Older"]);
});

test("response receipt stays directional and resolves roster aliases", () => {
  const roster = [{ canonicalName: "Older Member", dateSheetName: "Older Alias", aliases: "[]", pledgeClass: "PC 25" }];
  const data = buildPairingData(roster, [], [[["PC 25"]], [["PC 26"]]], [{ member: "Older Alias", partner: "New", comfort: 4, conversation: 5, enjoy: "", anotherDate: "", concerns: "", bondedOver: "", futureDates: "", thoughts: "" }]);
  assert.ok(data.feedback[feedbackKey("Older Member", "New")]);
  assert.equal(data.feedback[feedbackKey("New", "Older Member")], undefined);
});
