import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodoTasks } from "@/lib/todos";
import { getMemberDateStatus } from "@/lib/member-progress";
import { SisterDateStatus } from "@/components/pairings/sister-date-status";
import { FeedbackTasks } from "@/components/nme/feedback-tasks";
import { notFound } from "next/navigation";

import { NmePage, CopyCard } from "@/components/nme/page";
import { DateFeedbackMatrix } from "@/components/pairings/date-feedback-matrix";
import { getLiveDateAssignments, getLiveFeedbackPairs } from "@/lib/member-date-data";
import { getExistingWeekPairings } from "@/lib/pairing-data";
import { pairingKey } from "@/lib/pairings";

export const dynamic = "force-dynamic";

export default async function MemberProfile({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params; const name = decodeURIComponent(encodedName);
  const account = await prisma.user.findFirst({ where: { OR: [{ name }, { rosterMember: { canonicalName: name } }, { rosterMember: { dateSheetName: name } }] }, select: { id: true, todoCompletions: true } });
  if (account) {
    const viewer = await getCurrentUser();
    const canViewTasks = viewer?.id === account.id || viewer?.role === "admin";
    const dates = await getMemberDateStatus(account.id);
    const todos = canViewTasks ? await getTodoTasks() : [];
    const done = new Set(account.todoCompletions.map((item) => item.taskKey));
    return <NmePage title={name}><div className="space-y-6"><SisterDateStatus assignments={dates} title="Sister-date status" showFeedbackLink={viewer?.id === account.id} />{canViewTasks && <CopyCard title="To-do list">{todos.map((task) => <p key={task.key} className="border-b border-[#f0e7e8] py-3"><span className={done.has(task.key) ? "text-[#806d72] line-through" : "font-semibold text-[#7d1d2b]"}>{task.label}</span><span className="ml-2 text-xs">{done.has(task.key) ? "Completed" : "To do"}</span></p>)}<FeedbackTasks assignments={dates} />{viewer?.role === "admin" && <Link href={`/profile-management?member=${account.id}`} className="text-sm font-bold text-[#7d1d2b] underline">Manage this profile</Link>}</CopyCard>}</div></NmePage>;
  }
  const pairings = await getExistingWeekPairings();
  const allRows = Object.values(pairings.pc26).flat().concat(Object.values(pairings.pc25).flat());
  if (!allRows.some((row) => row.primary === name || row.partners.includes(name))) notFound();
  const [assignments, feedbackPairs] = await Promise.all([getLiveDateAssignments(name), getLiveFeedbackPairs(name)]);
  const matrix = assignments.map((item) => ({ ...item, complete: feedbackPairs.has(pairingKey(name, item.partner)) }));
  return <NmePage title={name} subtitle="Member profile generated from the live sister-date pairing sheets."><CopyCard title="Sister-date feedback"><p>This chart tracks each assigned date by week. Gray boxes still need a feedback form; green boxes have a submitted response.</p><DateFeedbackMatrix assignments={matrix} /></CopyCard><CopyCard title="Sister-date history"><div className="mt-1 space-y-3">{assignments.map((item) => <div key={item.id} className="rounded-xl bg-[#fcf5f6] p-4"><p className="font-bold text-[#4a3036]">Week {item.week}</p><Link className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#7d1d2b] hover:underline" href={`/member/${encodeURIComponent(item.partner)}`}>{item.partner}</Link></div>)}</div></CopyCard></NmePage>;
}
