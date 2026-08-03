import { CopyCard, NmePage } from "@/components/nme/page";
import { PairingsDashboard } from "@/components/pairings/pairings-dashboard";
import { getExistingWeekPairings, getWeekSixRecommendations } from "@/lib/pairings";
import { requireUserAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PossiblePairings() {
  await requireUserAdmin();
  const [recommendations, existing] = await Promise.all([getWeekSixRecommendations(), getExistingWeekPairings()]);
  return <NmePage title="Possible Pairings" subtitle="Week 6 sister-date recommendations, refreshed from the live pairing and feedback spreadsheets."><PairingsDashboard recommendations={recommendations} existing={existing} /><div className="mt-6"><CopyCard title="How Week 6 suggestions are formed"><p>Past dates and hard no’s are removed before ranking. Mandatory requests always stay in the list.</p><div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded bg-[#f1e2e5] px-2 py-1">Feedback</span><span>→</span><span className="rounded bg-[#eeeaf8] px-2 py-1">Similarity preference</span><span>→</span><span className="rounded bg-[#e5f3ea] px-2 py-1">New Week 6 date</span></div></CopyCard></div></NmePage>;
}
