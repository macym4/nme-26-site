import { FeedbackRefresh } from "@/components/pairings/feedback-refresh";
import { toggleTodoAction } from "@/app/actions";
import { CopyCard, NmePage } from "@/components/nme/page";
import { SisterDateStatus } from "@/components/pairings/sister-date-status";
import { getUserSessionId } from "@/lib/auth";
import { getFeedbackSyncStatus, getMemberDateStatus } from "@/lib/member-progress";
import { prisma } from "@/lib/prisma";
import { getTodoTasks } from "@/lib/todos";

export default async function YourProfile() {
  const userId = await getUserSessionId();
  const [todos, user] = await Promise.all([getTodoTasks(), userId ? prisma.user.findUnique({ where: { id: userId }, include: { todoCompletions: true, rosterMember: true } }) : null]);
  if (!user) return null;
  const matrix = await getMemberDateStatus(user.id);
  const feedbackAvailable = await getFeedbackSyncStatus();
  const done = new Set(user.todoCompletions.map((item) => item.taskKey));
  const feedbackTasks = matrix.filter((item) => !item.complete);
  const outstanding = todos.filter((task) => !done.has(task.key)).length + feedbackTasks.length;

  return <NmePage title="Your Profile"><FeedbackRefresh available={feedbackAvailable} /><div className="grid gap-6 lg:grid-cols-[minmax(0,.6fr)_minmax(0,1.4fr)]"><CopyCard title="To-do list">{todos.map(({ key, label, href }) => <div key={key} className="flex items-center gap-3 border-b border-[#f0e7e8] py-3 last:border-0"><form action={toggleTodoAction.bind(null, key, !done.has(key))}><button aria-label={`Mark ${label} as ${done.has(key) ? "incomplete" : "complete"}`} className={`flex h-5 w-5 items-center justify-center rounded border ${done.has(key) ? "bg-[#7d1d2b] text-white" : "border-[#b99ba1]"}`}>{done.has(key) ? "✓" : ""}</button></form>{href ? <a href={href} target="_blank" rel="noreferrer" className={`text-left ${done.has(key) ? "text-[#9b858a] line-through" : "font-semibold text-[#7d1d2b] underline"}`}>{label}</a> : <span className={`text-left ${done.has(key) ? "text-[#9b858a] line-through" : "font-semibold text-[#4a3036]"}`}>{label}</span>}</div>)}{feedbackTasks.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-[#f0e7e8] py-3"><span className="flex h-5 w-5 shrink-0 rounded border border-[#b99ba1]" /><a href="https://forms.gle/A2Fw2Po2JUe3b6As7" target="_blank" rel="noreferrer" className="font-semibold text-[#7d1d2b] underline">Submit feedback: Week {item.week} with {item.partner}</a></div>)}<div className={`mt-5 rounded-xl border p-4 ${outstanding ? "border-[#e5c4ca] bg-[#fff3f5] text-[#681b2d]" : "border-[#c9dfca] bg-[#eef8ef] text-[#2f6a42]"}`}><p className="text-xs font-bold uppercase tracking-[.14em]">Task check-in</p><p className="mt-1 font-serif text-3xl font-semibold leading-none">{outstanding ? `${outstanding} outstanding task${outstanding === 1 ? "" : "s"}` : "You are all caught up!"}</p></div></CopyCard><SisterDateStatus assignments={matrix} title="Sister-date status" /></div></NmePage>;
}
