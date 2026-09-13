import { DraftTextMessages } from "@/components/nme/draft-text-messages";
import { CopyCard, NmePage } from "@/components/nme/page";
import { DateAssignmentImporter } from "@/components/pairings/date-assignment-importer";
import { requireUserAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DateAssignment() {
  await requireUserAdmin();
  const [members, assignments] = await Promise.all([
    prisma.user.findMany({ where: { accessStatus: "approved", email: { not: "calendar@aphi.local" } }, orderBy: { name: "asc" }, select: { id: true, name: true, pledgeClass: true } }),
    prisma.dateAssignment.findMany({ orderBy: { week: "asc" } }),
  ]);
  return <NmePage title="Date Assignment" subtitle="Paste CSV pairings, review them, then drag and drop to confirm each batch."><DateAssignmentImporter /><div className="mt-8"><CopyCard title="Draft Text Messages"><DraftTextMessages members={members} assignments={assignments} /></CopyCard></div></NmePage>;
}
