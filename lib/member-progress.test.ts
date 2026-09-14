import assert from "node:assert/strict";
import test from "node:test";
import { datesForMember, getFeedbackSyncStatus, getMemberDateStatus } from "./member-progress";
import { prisma } from "./prisma";

const dates = [
  { id: "one", week: 1, memberOne: "Addison Yurchak", memberTwo: "Parker Yates" },
  { id: "two", week: 5, memberOne: "Divya Krishna", memberTwo: "Addison Y." },
  { id: "other", week: 1, memberOne: "Another Member", memberTwo: "Parker Yates" },
];

test("keeps saved member progress available when the feedback fetch fails", async (t) => {
  const mockPrisma = (model: object, method: string, replacement: () => Promise<unknown>) => {
    const target = model as Record<string, unknown>;
    const original = target[method];
    target[method] = replacement;
    t.after(() => { target[method] = original; });
  };
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  t.mock.method(console, "error", () => {});
  mockPrisma(prisma.user, "findMany", async () => []);
  mockPrisma(prisma.user, "findUnique", async () => ({ name: "Addison Yurchak", rosterMember: null }));
  mockPrisma(prisma.dateAssignment, "findMany", async () => dates);
  mockPrisma(prisma.dateFeedbackCompletion, "findMany", async () => [{ assignmentId: "one" }]);

  assert.equal(await getFeedbackSyncStatus(), false);
  assert.deepEqual(await getMemberDateStatus("member"), [
    { id: "one", week: 1, partner: "Parker Yates", complete: true },
  ]);
});

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
