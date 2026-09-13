import { CopyCard, NmePage } from "@/components/nme/page";
import { PairingsDashboard } from "@/components/pairings/pairings-dashboard";
import { hasDateFeedbackAccess, requireUserAdmin } from "@/lib/auth";
import { getExistingWeekPairings, getPairingFeedback, getWeekSixRecommendations } from "@/lib/pairing-data";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PossiblePairings() {
  const admin = await requireUserAdmin();
  if (!await hasDateFeedbackAccess()) redirect("/date-feedback-unlock");
  await prisma.accessAudit.create({ data: { userId: admin.id, actorId: admin.id, action: "POSSIBLE_PAIRINGS_VIEWED" } });
  const [recommendations, existing, feedback] = await Promise.all([getWeekSixRecommendations(), getExistingWeekPairings(), getPairingFeedback()]);
  return <NmePage title="Possible Pairings" subtitle="PC 25 and PC 26 sister-date pairings, using feedback from the current Form Responses sheet."><PairingsDashboard recommendations={recommendations} existing={existing} feedback={feedback} /><div className="mt-6"><CopyCard title="How Week 6 suggestions are formed"><p>Regular suggestions exclude past dates and hard no entries. Requests are included unless marked hard no. PC 24 partners remain visible in assigned dates but are not added to the suggestion pool.</p><p>Feedback comes from the raw Form Responses tab, including both pledge-class sections. Colors use the listed member?s own comfort and conversation scores. The current workbook has no similarity matrix, so that input stays neutral and available matches are balanced by assignment load.</p></CopyCard></div></NmePage>;
}
