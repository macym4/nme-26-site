import Link from "next/link";
import { notFound } from "next/navigation";

import { NmePage, CopyCard } from "@/components/nme/page";
import { DateFeedbackMatrix } from "@/components/pairings/date-feedback-matrix";
import { getLiveDateAssignments, getLiveFeedbackPairs } from "@/lib/member-date-data";
import { getExistingWeekPairings } from "@/lib/pairing-data";
import { pairingKey } from "@/lib/pairings";

export const dynamic = "force-dynamic";

export default async function MemberProfile({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params; const name = decodeURIComponent(encodedName); const pairings = await getExistingWeekPairings();
  const allRows = Object.values(pairings.pc26).flat().concat(Object.values(pairings.pc25).flat()); const found = allRows.some((row) => row.primary === name || row.partners.includes(name)); if (!found) notFound();
  const [assignments, feedbackPairs] = await Promise.all([getLiveDateAssignments(name), getLiveFeedbackPairs(name)]);
  const matrix = assignments.map((item) => ({ ...item, complete: feedbackPairs.has(pairingKey(name, item.partner)) }));
  return <NmePage title={name} subtitle="Member profile generated from the live sister-date pairing sheets."><CopyCard title="Sister-date feedback"><p>This chart tracks each assigned date by week. Gray boxes still need a feedback form; green boxes have a submitted response.</p><DateFeedbackMatrix assignments={matrix} /></CopyCard><CopyCard title="Sister-date history"><div className="mt-1 space-y-3">{assignments.map((item) => <div key={item.id} className="rounded-xl bg-[#fcf5f6] p-4"><p className="font-bold text-[#4a3036]">Week {item.week}</p><Link className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#7d1d2b] hover:underline" href={`/member/${encodeURIComponent(item.partner)}`}>{item.partner}</Link></div>)}</div></CopyCard></NmePage>;
}
