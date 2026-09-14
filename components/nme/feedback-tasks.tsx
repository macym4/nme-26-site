import type { MemberDateStatus } from "@/lib/member-progress";

export function FeedbackTasks({ assignments }: { assignments: MemberDateStatus[] }) {
  const pending = assignments.filter((date) => !date.complete);
  return <div className="mt-4"><p className="text-sm font-bold text-[#604a50]">Sister-date feedback to-dos</p>{pending.length ? pending.map((date) => <p key={date.id} className="border-b border-[#f0e7e8] py-3 text-sm text-[#7d1d2b]">Submit feedback: Week {date.week} with {date.partner}</p>) : <p className="mt-2 text-sm text-[#806d72]">No outstanding sister-date feedback.</p>}</div>;
}
