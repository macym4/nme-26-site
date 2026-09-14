import assert from "node:assert/strict";
import test from "node:test";
import { datesForMember } from "./member-progress";

const dates = [
  { id: "one", week: 1, memberOne: "Addison Yurchak", memberTwo: "Parker Yates" },
  { id: "two", week: 5, memberOne: "Divya Krishna", memberTwo: "Addison Y." },
  { id: "other", week: 1, memberOne: "Another Member", memberTwo: "Parker Yates" },
];

test("uses published dates for either side of a pair, including roster aliases and later weeks", () => {
  assert.deepEqual(datesForMember(["Addison Yurchak", "Addison Y."], dates, new Set(["one"])), [
    { id: "one", week: 1, partner: "Parker Yates", complete: true },
    { id: "two", week: 5, partner: "Divya Krishna", complete: false },
  ]);
});

test("keeps feedback completion specific to the selected member and assignment", () => {
  assert.deepEqual(datesForMember(["Parker Yates"], [dates[0]], new Set()), [{ id: "one", week: 1, partner: "Addison Yurchak", complete: false }]);
  assert.deepEqual(datesForMember(["Unknown Member"], dates, new Set(["one"])), []);
});
