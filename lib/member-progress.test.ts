import assert from "node:assert/strict";
import test from "node:test";
import { applyLiveFeedback, datesForMember, getFeedbackSyncStatus, getMemberDateStatus } from "./member-progress";
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
  mockPrisma(prisma.rosterMember, "findMany", async () => []);

  assert.equal(await getFeedbackSyncStatus(), false);
  assert.deepEqual(await getMemberDateStatus("member"), [
    { id: "one", week: 1, partner: "Parker Yates", complete: true },
  ]);
});

test("recognizes all three of Addison's live submissions without saved completion records", () => {
  const partners = ["Divya Krishna", "Parker Yates", "Kiara Figueras"];
  const assignments = partners.map((partner, index) => ({ id: String(index), week: 1, partner, complete: false }));
  const responses = partners.map((partner) => ({ member: "Addison Yurchak", partner }));
  assert.ok(applyLiveFeedback(["Addison Yurchak"], assignments, responses, []).every((date) => date.complete));
  assert.ok(applyLiveFeedback(["Addison Yurchak"], assignments, partners.map((member) => ({ member, partner: "Addison Yurchak" })), []).every((date) => !date.complete));
});

test("uses roster aliases for partners without accounts and replaces stale saved completion", () => {
  const roster = [{ canonicalName: "Kiara Figueras", dateSheetName: "Kiara Figueras", aliases: '["Kiara F."]' }];
  const dates = [{ id: "one", week: 1, partner: "Kiara F.", complete: false }, { id: "two", week: 1, partner: "Parker Yates", complete: true }];
  assert.deepEqual(applyLiveFeedback(["Addison Yurchak"], dates, [{ member: "Addison Yurchak", partner: "Kiara Figueras" }], roster).map((date) => date.complete), [true, false]);
});

test("both Addison accounts get live status even when saved completions belong to only one account", async (t) => {
  const replace = (model: object, method: string, value: unknown) => {
    const target = model as Record<string, unknown>, original = target[method];
    target[method] = value;
    t.after(() => { target[method] = original; });
  };
  const partners = ["Divya Krishna", "Parker Yates", "Kiara Figueras"];
  t.mock.method(globalThis, "fetch", async () => new Response("Respondee,Date Name\n" + partners.map((partner) => `Addison Yurchak,${partner}`).join("\n")));
  replace(prisma.user, "findUnique", async () => ({ name: "Addison Yurchak", rosterMember: null }));
  replace(prisma.dateAssignment, "findMany", async () => partners.map((partner, index) => ({ id: String(index), week: 1, memberOne: "Addison Yurchak", memberTwo: partner })));
  replace(prisma.rosterMember, "findMany", async () => []);
  replace(prisma.dateFeedbackCompletion, "findMany", async ({ where }: { where: { userId: string } }) => where.userId === "second-account" ? partners.map((_, index) => ({ assignmentId: String(index) })) : []);
  for (const id of ["first-account", "second-account"]) {
    const status = await getMemberDateStatus(id);
    assert.equal(status.length, 3);
    assert.ok(status.every((date) => date.complete));
  }
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
