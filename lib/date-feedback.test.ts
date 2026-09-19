import assert from "node:assert/strict";
import test from "node:test";
import { parseParsedFeedbackResponses, syncDateFeedbackCompletions } from "./date-feedback";
import { prisma } from "./prisma";

const headers = ["Respondee", "Date Name", "Enjoy?", "Second Date?", "Comfort?", "Flow?", "What talk about?", "Red flags?", "Future dates?", "Other thoughts?"];

test("parses live Parsed Responses headers and ignores empty or formula-error rows", () => {
  const responses = parseParsedFeedbackResponses([headers, ["Alice", "Beth", "Yes", "Yes", "5", "4", "Classes", "None", "Coffee", "Fun"], [], ["Alice"], ["#N/A", "#N/A"]]);
  assert.deepEqual(responses, [{ member: "Alice", partner: "Beth", enjoy: "Yes", anotherDate: "Yes", comfort: 5, conversation: 4, bondedOver: "Classes", concerns: "None", futureDates: "Coffee", thoughts: "Fun" }]);
  assert.deepEqual(parseParsedFeedbackResponses([headers]), []);
  assert.throws(() => parseParsedFeedbackResponses([["Wrong tab"]]), /missing/);
});

test("reads Parsed Responses without caching and credits only the submitter through roster aliases", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(new URL(String(url)).searchParams.get("sheet"), "Parsed Responses");
    assert.equal(options?.cache, "no-store");
    return new Response(`${headers.join(",")}\nAlice A.,Beth,Yes,Yes,5,4`);
  });
  const replace = (model: object, method: string, value: unknown) => {
    const target = model as Record<string, unknown>, original = target[method];
    target[method] = value;
    t.after(() => { target[method] = original; });
  };
  replace(prisma.user, "findMany", async () => [
    { id: "alice", name: "Alice Account", rosterMember: { canonicalName: "Alice Adams", dateSheetName: "Alice", aliases: '["Alice A."]' } },
    { id: "beth", name: "Beth", rosterMember: null },
  ]);
  replace(prisma.dateAssignment, "findMany", async () => [{ id: "date", memberOne: "Beth", memberTwo: "Alice Adams" }]);
  const credited: unknown[] = [];
  replace(prisma.dateFeedbackCompletion, "upsert", (args: { create: unknown }) => { credited.push(args.create); return Promise.resolve(); });
  replace(prisma, "$transaction", async (queries: Promise<unknown>[]) => Promise.all(queries));
  await syncDateFeedbackCompletions();
  assert.deepEqual(credited, [{ assignmentId: "date", userId: "alice" }]);
});
