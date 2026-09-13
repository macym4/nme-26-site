import Link from "next/link";
import { redirect } from "next/navigation";

import { NmePage } from "@/components/nme/page";
import { hasDateFeedbackAccess, requireUserAdmin } from "@/lib/auth";
import { syncDateFeedbackCompletions } from "@/lib/date-feedback";
import { feedbackKey } from "@/lib/pairings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const weeks = [1, 2, 3, 4, 5];
const dateSlots = [1, 2, 3, 4];

function feedbackColor(comfort: number, conversation: number) {
  if (!comfort || !conversation) return "bg-[#e5e5e5] text-[#5c5c5c]";
  if (comfort === 5 && conversation === 5) return "bg-[#bfdbfe] text-[#1e3a8a]";
  if (comfort <= 2 || conversation <= 2) return "bg-[#fecaca] text-[#991b1b]";
  if (comfort > 3 && conversation > 4) return "bg-[#bbf7d0] text-[#166534]";
  return "bg-[#fef3c7] text-[#854d0e]";
}

export default async function DateFeedbackResults({ searchParams }: { searchParams: Promise<{ pledgeClass?: string }> }) {
  const admin = await requireUserAdmin();
  if (!await hasDateFeedbackAccess()) redirect("/date-feedback-unlock");

  await prisma.accessAudit.create({ data: { userId: admin.id, actorId: admin.id, action: "DATE_FEEDBACK_RESULTS_VIEWED" } });

  const { pledgeClass } = await searchParams;
  const selectedClass = pledgeClass === "pc26" ? "PC 26" : "PC 25";
  const [responses, roster, accessLog] = await Promise.all([
    syncDateFeedbackCompletions(),
    prisma.rosterMember.findMany({ where: { pledgeClass: selectedClass }, orderBy: { canonicalName: "asc" } }),
    prisma.accessAudit.findMany({ where: { action: { in: ["DATE_FEEDBACK_UNLOCKED", "DATE_FEEDBACK_UNLOCK_DENIED", "DATE_FEEDBACK_RESULTS_VIEWED", "POSSIBLE_PAIRINGS_VIEWED"] } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  const accessUsers = accessLog.length ? await prisma.user.findMany({ where: { id: { in: [...new Set(accessLog.map((item) => item.actorId))] } }, select: { id: true, name: true, email: true } }) : [];
  const accessUserById = new Map(accessUsers.map((user) => [user.id, user]));
  const feedbackByPair = new Map(responses.map((response) => [feedbackKey(response.member, response.partner), feedbackColor(response.comfort, response.conversation)]));
  const rosterNames = roster.map((member) => member.dateSheetName);
  const assignments = roster.length ? await prisma.dateAssignment.findMany({ where: { OR: [{ memberOne: { in: rosterNames } }, { memberTwo: { in: rosterNames } }], week: { in: weeks } }, orderBy: [{ week: "asc" }, { assignedAt: "asc" }] }) : [];
  const assignmentsByMember = new Map(roster.map((member) => [member.dateSheetName, weeks.map((week) => assignments.filter((assignment) => (assignment.memberOne === member.dateSheetName || assignment.memberTwo === member.dateSheetName) && assignment.week === week).map((assignment) => assignment.memberOne === member.dateSheetName ? assignment.memberTwo : assignment.memberOne).slice(0, 4))]));

  return <NmePage title="Date Feedback Results" subtitle={`${selectedClass} sister-date feedback, synchronized from the Form Responses sheet.`}>
    <section className="overflow-x-auto rounded-2xl border border-[#eadfe1] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eadfe1] p-5"><div><h2 className="text-xl font-bold text-[#4a3036]">Color-coded feedback view</h2><p className="mt-2 text-sm text-[#806d72]">Gray: not filled out · Blue: two 5s · Green: comfort above 3 and conversation above 4 · Red: a 1 or 2 · Yellow: all other feedback.</p></div><div className="flex rounded-lg bg-[#f6eaed] p-1 text-sm font-bold"><Link href="/date-feedback-results" className={`rounded-md px-3 py-2 ${selectedClass === "PC 25" ? "bg-white text-[#7d1d2b] shadow-sm" : "text-[#806d72]"}`}>PC 25</Link><Link href="/date-feedback-results?pledgeClass=pc26" className={`rounded-md px-3 py-2 ${selectedClass === "PC 26" ? "bg-white text-[#7d1d2b] shadow-sm" : "text-[#806d72]"}`}>PC 26</Link></div></div>
      <table className="min-w-[1900px] border-collapse text-left text-xs"><thead className="bg-[#7d1d2b] text-white"><tr><th rowSpan={2} className="sticky left-0 z-20 border-r border-white/20 bg-[#7d1d2b] px-4 py-3 text-sm">{selectedClass}</th>{weeks.map((week) => <th key={week} colSpan={4} className="border-l border-white/20 px-3 py-3 text-center text-sm">Week {week}</th>)}</tr><tr>{weeks.flatMap((week) => dateSlots.map((slot) => <th key={`${week}-${slot}`} className="border-l border-white/15 px-2 py-2 text-center font-semibold">Date {slot}</th>))}</tr></thead><tbody>{roster.map((member) => { const memberAssignments = assignmentsByMember.get(member.dateSheetName) ?? []; return <tr key={member.id} className="border-t border-[#f0e7e8]"><th className="sticky left-0 z-10 whitespace-nowrap border-r border-[#eadfe1] bg-white px-4 py-3 text-sm font-bold text-[#4a3036]">{member.canonicalName}</th>{memberAssignments.flatMap((weekAssignments, weekIndex) => dateSlots.map((slot, slotIndex) => { const partner = weekAssignments[slotIndex]; const status = partner ? feedbackByPair.get(feedbackKey(member.dateSheetName, partner)) ?? "bg-[#e5e5e5] text-[#5c5c5c]" : "bg-[#e5e5e5] text-[#8a8a8a]"; return <td key={`${weekIndex}-${slot}`} className="border-l border-[#f0e7e8] p-1.5"><div className={`min-h-14 min-w-24 rounded-lg p-2 font-semibold leading-4 ${status}`}>{partner || "—"}</div></td>; }))}</tr>; })}</tbody></table>
    </section>
    <section className="mt-6 rounded-2xl border border-[#eadfe1] bg-white p-5 shadow-sm"><h2 className="font-serif text-2xl font-semibold text-[#4a3036]">Confidential access log</h2><p className="mt-1 text-sm text-[#806d72]">Every successful view and password attempt is recorded.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#eadfe1] text-xs uppercase tracking-wide text-[#806d72]"><tr><th className="pb-2">Time</th><th className="pb-2">Admin</th><th className="pb-2">Activity</th></tr></thead><tbody>{accessLog.map((entry) => { const user = accessUserById.get(entry.actorId); return <tr key={entry.id} className="border-b border-[#f2ebec] last:border-0"><td className="py-3 text-[#806d72]">{entry.createdAt.toLocaleString()}</td><td className="py-3 font-semibold text-[#4a3036]">{user?.name ?? "Former account"}<span className="ml-2 text-xs font-normal text-[#806d72]">{user?.email}</span></td><td className="py-3 text-[#681b2d]">{entry.action === "DATE_FEEDBACK_RESULTS_VIEWED" ? "Viewed feedback results" : entry.action === "POSSIBLE_PAIRINGS_VIEWED" ? "Viewed possible pairings" : entry.action === "DATE_FEEDBACK_UNLOCKED" ? "Unlocked confidential pages" : "Incorrect password attempt"}</td></tr>; })}</tbody></table></div></section>
  </NmePage>;
}
