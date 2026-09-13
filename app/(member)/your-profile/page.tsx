import { toggleTodoAction } from "@/app/actions";
import { CopyCard, NmePage } from "@/components/nme/page";
import { DateFeedbackMatrix } from "@/components/pairings/date-feedback-matrix";
import { getUserSessionId } from "@/lib/auth";
import { syncDateFeedbackCompletions } from "@/lib/date-feedback";
import { getLiveDateAssignments, getLiveFeedbackPairs } from "@/lib/member-date-data";
import { pairingKey } from "@/lib/pairings";
import { prisma } from "@/lib/prisma";
import { getTodoTasks } from "@/lib/todos";

export default async function YourProfile() {
  await syncDateFeedbackCompletions();
  const userId = await getUserSessionId();
  const [todos, user] = await Promise.all([getTodoTasks(), userId ? prisma.user.findUnique({ where: { id: userId }, include: { todoCompletions: true, rosterMember: true } }) : null]);
  if (!user) return null;
  const sourceName = user.rosterMember?.dateSheetName ?? user.name;
  const [assignments, feedbackPairs] = await Promise.all([getLiveDateAssignments(sourceName), getLiveFeedbackPairs(sourceName)]);
  const done = new Set(user.todoCompletions.map((item) => item.taskKey));
  const matrix = assignments.map((item) => ({ ...item, complete: feedbackPairs.has(pairingKey(sourceName, item.partner)) }));
  const feedbackTasks = matrix.filter((item) => !item.complete);
  const outstanding = todos.filter((task) => !done.has(task.key)).length + feedbackTasks.length;

  return <NmePage title="Your Profile"><div className="grid gap-6 lg:grid-cols-2"><CopyCard title="To-do list">{todos.map(({ key, label, href }) => <div key={key} className="flex items-center gap-3 border-b border-[#f0e7e8] py-3 last:border-0"><form action={toggleTodoAction.bind(null, key, !done.has(key))}><button aria-label={`Mark ${label} as ${done.has(key) ? "incomplete" : "complete"}`} className={`flex h-5 w-5 items-center justify-center rounded border ${done.has(key) ? "bg-[#7d1d2b] text-white" : "border-[#b99ba1]"}`}>{done.has(key) ? "✓" : ""}</button></form>{href ? <a href={href} target="_blank" rel="noreferrer" className={`text-left ${done.has(key) ? "text-[#9b858a] line-through" : "font-semibold text-[#7d1d2b] underline"}`}>{label}</a> : <span className={`text-left ${done.has(key) ? "text-[#9b858a] line-through" : "font-semibold text-[#4a3036]"}`}>{label}</span>}</div>)}{feedbackTasks.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-[#f0e7e8] py-3"><span className="flex h-5 w-5 shrink-0 rounded border border-[#b99ba1]" /><a href="https://forms.gle/A2Fw2Po2JUe3b6As7" target="_blank" rel="noreferrer" className="font-semibold text-[#7d1d2b] underline">Submit feedback: Week {item.week} with {item.partner}</a></div>)}<div className={`mt-5 rounded-xl border p-4 ${outstanding ? "border-[#e5c4ca] bg-[#fff3f5] text-[#681b2d]" : "border-[#c9dfca] bg-[#eef8ef] text-[#2f6a42]"}`}><p className="text-xs font-bold uppercase tracking-[.14em]">Task check-in</p><p className="mt-1 font-serif text-3xl font-semibold leading-none">{outstanding ? `${outstanding} outstanding task${outstanding === 1 ? "" : "s"}` : "You are all caught up!"}</p></div></CopyCard><CopyCard title="Sister-date status"><p className="text-sm text-[#806d72]">Assignments and submitted feedback are synced from the Date Assignment and Date Feedback sheets.</p>{matrix.length ? <><div className="mt-4 space-y-3">{matrix.map((item) => <div key={item.id}><b>{item.partner}</b><p className="text-sm">Week {item.week} · {item.complete ? "Feedback submitted" : "Feedback needed"}</p></div>)}</div><DateFeedbackMatrix assignments={matrix} /></> : <p className="mt-4">No sister dates have been assigned to you yet.</p>}</CopyCard></div></NmePage>;
}
