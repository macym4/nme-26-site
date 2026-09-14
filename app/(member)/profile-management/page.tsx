import Link from "next/link";
import { getMemberDateStatus } from "@/lib/member-progress";
import { SisterDateStatus } from "@/components/pairings/sister-date-status";
import { FeedbackTasks } from "@/components/nme/feedback-tasks";
import { resetMemberPassword } from "@/app/password-actions";
import { PasswordForm } from "@/components/auth/password-form";

import { updateMemberProfileAction } from "@/app/actions";
import { TodoManager } from "@/components/nme/todo-manager";
import { CopyCard, NmePage } from "@/components/nme/page";
import { requireUserAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodoTasks } from "@/lib/todos";

export default async function ProfileManagement({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const actor = await requireUserAdmin();
  const { member: selectedId } = await searchParams;
  const members = await prisma.user.findMany({ where: { accessStatus: "approved", email: { not: "calendar@aphi.local" } }, orderBy: { name: "asc" }, include: { todoCompletions: true } });
  const member = members.find((item) => item.id === selectedId) ?? members[0];
  if (!member) return <NmePage title="Profile Management"><p>No approved member accounts yet.</p></NmePage>;
  const dates = await getMemberDateStatus(member.id);
  const [todos, done] = [await getTodoTasks(), new Set(member.todoCompletions.map((item) => item.taskKey))];

  return <NmePage title="Profile Management" subtitle="View and update individual member accounts and to-do progress."><div className="grid gap-6 lg:grid-cols-[280px_1fr]"><CopyCard title="Select a sister"><form action="/profile-management" className="space-y-3"><label className="block text-sm font-semibold text-[#604a50]">Member<select name="member" defaultValue={member.id} className="mt-1.5 w-full rounded-lg border border-[#dfd3d5] bg-white px-3 py-2 text-sm">{members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="w-full rounded-lg bg-[#7d1d2b] px-3 py-2 text-sm font-bold text-white">View profile</button></form><div className="mt-4 space-y-1 text-sm">{members.map((item) => <Link key={item.id} href={`/profile-management?member=${item.id}`} className={`block rounded-lg px-3 py-2 ${item.id === member.id ? "bg-[#f4e5e7] font-bold text-[#7d1d2b]" : "hover:bg-[#fcf5f6]"}`}>{item.name}</Link>)}</div></CopyCard><div className="min-w-0 space-y-6"><CopyCard title={member.name}><form action={updateMemberProfileAction.bind(null, member.id)} className="grid gap-3 sm:grid-cols-2"><Field label="Name" name="name" defaultValue={member.name} /><Field label="Phone" name="phone" defaultValue={member.phone} /><Field label="Email" name="email" type="email" defaultValue={member.email} /><label className="block text-sm font-semibold text-[#604a50]">Pledge class<select name="pledgeClass" defaultValue={member.pledgeClass ?? ""} className="mt-1.5 w-full rounded-lg border border-[#dfd3d5] bg-white px-3 py-2 text-sm"><option value="">Not assigned</option><option value="PC 25">PC 25</option><option value="PC 26">PC 26</option></select></label><div className="flex items-end"><button className="w-full rounded-lg bg-[#7d1d2b] px-3 py-2 text-sm font-bold text-white">Save account details</button></div></form></CopyCard>{member.id !== actor.id && <CopyCard title={`Reset password for ${member.name}`}><PasswordForm key={member.id} temporary action={resetMemberPassword.bind(null, member.id)} /></CopyCard>}<SisterDateStatus assignments={dates} title={`${member.name}’s sister dates`} showFeedbackLink={false} /><CopyCard title="To-do list"><TodoManager memberId={member.id} completed={done} tasks={todos} /><FeedbackTasks assignments={dates} /></CopyCard></div></div></NmePage>;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-sm font-semibold text-[#604a50]">{label}<input {...props} required className="mt-1.5 w-full rounded-lg border border-[#dfd3d5] bg-white px-3 py-2 text-sm" /></label>;
}
