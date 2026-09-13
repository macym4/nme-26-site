import Image from "next/image";
import Link from "next/link";

import { toggleMemberPreviewAction, userLogoutAction } from "@/app/actions";
import { MemberMenu } from "@/components/site/member-menu";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodoTasks } from "@/lib/todos";

export const dynamic = "force-dynamic";

const resources: [string, string][] = [["NME Slides", "/nme-slides"], ["Health & Education", "/health-education"], ["Academic & Career", "/academic-career"], ["Chapter Information", "/chapter-information"]];
const management: [string, string][] = [["Profile Management", "/profile-management"], ["Date Assignment", "/date-assignment"], ["Date Feedback Results", "/date-feedback-results"], ["Possible Pairings", "/possible-pairings"]];

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApprovedUser();
  const [tasks, completedTasks] = await Promise.all([getTodoTasks(), prisma.todoCompletion.count({ where: { userId: user.id } })]);
  const outstandingTasks = Math.max(0, tasks.length - completedTasks);

  return <main className="portal-canvas min-h-screen text-[#292629]">
    <header className="relative z-[100] overflow-visible border-b border-[#dedbdd] bg-white">
      <div className="border-b border-[#e8e5e5] bg-[#f4f1ee] px-5 py-2 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] font-bold uppercase tracking-[.16em] text-[#6f1935]"><span>MIT Alpha Phi, Zeta Phi Chapter</span><span className="hidden sm:inline">Massachusetts Institute of Technology</span></div></div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5 sm:px-8">
        <Link href="/welcome" className="flex items-center gap-3 text-[#6f1935]"><span className="font-serif text-3xl font-semibold leading-none">ΑΦ</span><span><span className="block font-serif text-2xl font-semibold leading-none">Alpha Phi</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.18em] text-[#80646b]">MIT · Zeta Phi Chapter</span></span></Link>
        <nav className="order-3 z-[110] flex w-full items-center gap-1 overflow-visible pb-1 text-sm font-semibold text-[#6e5a5e] lg:order-none lg:w-auto lg:flex-1 lg:pb-0"><Link href="/welcome" className="whitespace-nowrap px-3 py-2 transition hover:text-[#6f1935]">Home</Link><Link href="/big-little-process" className="whitespace-nowrap px-3 py-2 transition hover:text-[#6f1935]">Big/Little</Link><Link href="/finance" className="whitespace-nowrap px-3 py-2 transition hover:text-[#6f1935]">Finance</Link><MemberMenu label="Resources" items={resources} />{user.role === "admin" && <><MemberMenu label="Administration" items={management} /><Link href="/access-management" className="whitespace-nowrap px-3 py-2 transition hover:text-[#6f1935]">Access</Link></>}</nav>
        <div className="ml-auto flex flex-col items-end gap-2 text-right"><div className="flex items-center gap-3"><div className="hidden sm:block"><p className="text-sm font-bold text-[#4a3036]">{user.name}</p><form action={userLogoutAction}><button className="text-xs font-medium text-[#8e777c] transition hover:text-[#6f1935]">Sign out</button></form></div><Link href="/your-profile" aria-label="View your profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#f1edef] bg-[#6f1935] text-sm font-bold text-white">{user.profileImage ? <Image src={user.profileImage} alt="" width={40} height={40} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}</Link></div>{outstandingTasks > 0 && <Link href="/your-profile" className="bg-[#6f1935] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-sm transition hover:bg-[#4d1025]">{outstandingTasks} task{outstandingTasks === 1 ? "" : "s"} left</Link>}</div>
      </div>
    </header>
    {user.isActualAdmin && <div className="border-b border-[#dedbdd] bg-[#f4f1ee] px-5 py-3 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-[#6f1935]">{user.isMemberPreview ? "Previewing non-admin view" : "Admin view"}</p><form action={toggleMemberPreviewAction}><button type="submit" aria-pressed={user.isMemberPreview} className="rounded border border-[#6f1935] px-4 py-2 text-sm font-bold text-[#6f1935] transition hover:bg-[#6f1935] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f1935]">{user.isMemberPreview ? "Return to admin view" : "Preview non-admin view"}</button></form></div></div>}
    {children}
  </main>;
}
