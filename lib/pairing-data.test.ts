import assert from "node:assert/strict";
import test from "node:test";

import { parseFormFeedbackResponses, type FormFeedbackResponse } from "@/lib/date-feedback";
import { csvRows } from "@/lib/feedback-sheet";
import { buildPairingData } from "@/lib/pairing-data";
import { feedbackKey } from "@/lib/pairings";

const member = (canonicalName: string, pledgeClass: string, aliases = "[]") => ({ canonicalName, dateSheetName: canonicalName, pledgeClass, aliases });
const roster = [member("Adelyn Wyndham", "PC 25"), member("Ava Illingworth", "PC 25"), member("Carley Chen", "PC 25"), member("Addison Yurchak", "PC 26", '["Addison Y."]')];
const sheets = [
  [["Hard Nos", "Requests", "PC 25", "# Dates this Week", "Week #1 Dates", "Pairing #1", "Pairing #2", "Pairing #3"]],
  [["Hard Nos", "Requests", "PC 26", "# Dates this Week", "Week #1 Dates", "Pairing #1", "Pairing #2", "Pairing #3"]],
];
const response = (member: string, partner: string, comfort: number): FormFeedbackResponse => ({ member, partner, comfort, conversation: comfort, enjoy: "Yes", anotherDate: "Yes", concerns: "", bondedOver: "", futureDates: "", thoughts: "" });

test("accepts the Raw Form Responses tab before any feedback is submitted", () => {
  assert.deepEqual(parseFormFeedbackResponses([["Timestamp", "Email Address", "Pledge Class?", "First & Last Name", "Who did you go on a sister date with?", "First & Last Name", "Who did you go on a sister date with?"]]), []);
});

test("summary sheets use week counts only as boundaries and preserve all four pairing columns", () => {
  const headers = ["Hard Nos", "Requests", "PC 25", "Week #1 Dates", "Pairing #1", "Pairing #2", "Pairing #3", "Pairing #4", "Week #2 Dates", "Pairing #1"];
  const data = buildPairingData(roster, [], [
    [headers, ["", "", "Adelyn Wyndham", "4", "Addison Yurchak", "Partner Two", "Partner Three", "Partner Four", "0", ""]],
    [["PC 26", "Week #1 Dates", "Pairing #1", "Pairing #2", "Pairing #3"], ["Addison Yurchak", "1", "Adelyn Wyndham", "", ""]],
  ], []);
  assert.deepEqual(data.existing.pc25[1][0].partners, ["Addison Yurchak", "Partner Two", "Partner Three", "Partner Four"]);
  assert.deepEqual(data.existing.pc26[1][0].partners, ["Adelyn Wyndham"]);
  assert.deepEqual(data.existing.pc25[2][0].partners, []);
});

test("reads either raw form branch without moving scores across pledge classes", () => {
  const headers = ["Timestamp", "First & Last Name", "Who did you go on a sister date with?", "How comfortable did you feel being yourself around them?", "How did conversation flow?", "First & Last Name", "Who did you go on a sister date with?", "How comfortable did you feel being yourself around her?", "How did conversation flow?"];
  const parsed = parseFormFeedbackResponses([headers, ["today", "", "", "", "", "Addison Yurchak", "Adelyn Wyndham", "5", "4"], ["today", "Adelyn Wyndham", "Addison Yurchak", "2", "3"]]);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed.map(({ member, comfort, conversation }) => ({ member, comfort, conversation })), [{ member: "Addison Yurchak", comfort: 5, conversation: 4 }, { member: "Adelyn Wyndham", comfort: 2, conversation: 3 }]);
  assert.deepEqual(csvRows('"Name","Comments"\n"Addison","a comma, and\na newline"'), [["Name", "Comments"], ["Addison", "a comma, and\na newline"]]);
  assert.throws(() => parseFormFeedbackResponses([["PC 25", "Requests"]]), /missing/);
});

test("keeps real PC 26 names and PC 24 assignments without accounts or generated exceptions", () => {
  const data = buildPairingData(roster, [{ memberOne: "PC 24 Partner", memberTwo: "Addison Y.", week: 1 }], [sheets[0], [...sheets[1], ["", "", "Name #1", "", "", "Adelyn Wyndham"]]], []);
  assert.deepEqual(data.existing.pc26[1], [{ primary: "Addison Yurchak", partners: ["PC 24 Partner"] }]);
  assert.equal(data.existing.pc25[1].length, 3);
  assert.equal(data.recommendations.length, 1);
  assert.ok(data.recommendations[0].matches.every((match) => roster.some((member) => member.canonicalName === match.name && member.pledgeClass === "PC 25")));
  assert.deepEqual(data.feedback, {});
});

test("preserves requests and hard nos from current tabs, deduplicates manual dates", () => {
  const pc26 = [...sheets[1], ["Carley Chen", "Adelyn Wyndham; Carley Chen", "Addison Yurchak", "2", "", "Ava Illingworth"]];
  const data = buildPairingData(roster, [{ memberOne: "Ava Illingworth", memberTwo: "Addison Yurchak", week: 1 }], [sheets[0], pc26], []);
  assert.deepEqual(data.existing.pc26[1][0].partners, ["Ava Illingworth"]);
  assert.deepEqual(data.recommendations[0].matches.map(({ name, mandatory }) => ({ name, mandatory })), [{ name: "Adelyn Wyndham", mandatory: true }]);
});

test("feedback colors stay directional and submitted dates are excluded", () => {
  const data = buildPairingData(roster, [], sheets, [response("Addison Y.", "Adelyn Wyndham", 5), response("Adelyn Wyndham", "Addison Yurchak", 2)]);
  assert.equal(data.feedback[feedbackKey("Addison Yurchak", "Adelyn Wyndham")].comfort, 5);
  assert.equal(data.feedback[feedbackKey("Adelyn Wyndham", "Addison Yurchak")].comfort, 2);
  assert.ok(data.recommendations[0].matches.every((match) => match.name !== "Adelyn Wyndham"));
});
