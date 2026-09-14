import assert from "node:assert/strict";
import test from "node:test";
import { importWeeklyAssignments } from "./weekly-assignment-import";

test("weekly paste resolves names, skips reverse duplicates, and preserves other dates", () => {
  const existing = [{ memberOne: "Alice", memberTwo: "Bea", week: 1 }];
  const result = importWeeklyAssignments("PC 26\tPartner 1\tPartner 2\nal\tBea\tCara\nBea\tAlice", 6, existing, { al: "Alice", alice: "Alice" });
  assert.deepEqual(result, [...existing, { memberOne: "Bea", memberTwo: "Alice", week: 6 }, { memberOne: "Alice", memberTwo: "Cara", week: 6 }]);
});

test("invalid weeks, empty input and self dates are rejected before saving", () => {
  assert.throws(() => importWeeklyAssignments("Alice,Bea", 0, [], {}));
  assert.throws(() => importWeeklyAssignments("", 1, [], {}));
  assert.throws(() => importWeeklyAssignments("Alice,alice", 1, [], {}));
});
