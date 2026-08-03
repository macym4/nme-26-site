import Link from "next/link";
import { notFound } from "next/navigation";

import { NmePage, CopyCard } from "@/components/nme/page";
import { getExistingWeekPairings } from "@/lib/pairings";

export const dynamic = "force-dynamic";

export default async function MemberProfile({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params; const name = decodeURIComponent(encodedName); const pairings = await getExistingWeekPairings();
  const allRows = Object.values(pairings.pc29).flat().concat(Object.values(pairings.pc28).flat()); const found = allRows.some((row) => row.primary === name || row.partners.includes(name)); if (!found) notFound();
  const weeks = Object.entries(pairings.pc29).map(([week, rows]) => ({ week, partners: rows.find((row) => row.primary === name)?.partners || rows.filter((row) => row.partners.includes(name)).map((row) => row.primary) })).filter((item) => item.partners.length);
  return <NmePage title={name} subtitle="Member profile generated from the live sister-date pairing sheets."><CopyCard title="Sister-date history"><p>This profile shows the dates recorded in the Pairings spreadsheet. It refreshes when the source sheet changes.</p><div className="mt-4 space-y-3">{weeks.map((item) => <div key={item.week} className="rounded-xl bg-[#fcf5f6] p-4"><p className="font-bold text-[#4a3036]">Week {item.week}</p><div className="mt-2 flex flex-wrap gap-2">{item.partners.map((partner) => <Link key={partner} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#7d1d2b] hover:underline" href={`/member/${encodeURIComponent(partner)}`}>{partner}</Link>)}</div></div>)}</div></CopyCard></NmePage>;
}
