import { DraftTextMessages } from "@/components/nme/draft-text-messages";
import { CopyCard, NmePage } from "@/components/nme/page";
import { AssignmentMaster } from "@/components/pairings/assignment-master";
import { requireUserAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAssignmentMaster } from "@/lib/assignment-master-data";
import { getFormFeedbackResponses } from "@/lib/date-feedback";
import { feedbackKey } from "@/lib/pairings";
import { normalizeMemberName } from "@/lib/roster";

export default async function DateAssignment() {
  await requireUserAdmin();
  const [master, accounts, feedback] = await Promise.all([
    getAssignmentMaster(),
    prisma.user.findMany({ where: { accessStatus: "approved", email: { not: "calendar@aphi.local" } }, orderBy: { name: "asc" }, select: { id: true, name: true, pledgeClass: true, rosterMemberId: true } }),
    getFormFeedbackResponses().then((responses) => ({ responses, available: true })).catch((error) => {
      console.error("Could not refresh assignment feedback.", error);
      return { responses: [], available: false };
    }),
  ]);
  const aliases = new Map<string, string>();
  for (const member of master.roster) {
    for (const name of [member.canonicalName, member.dateSheetName, ...JSON.parse(member.aliases) as string[]]) aliases.set(normalizeMemberName(name), member.canonicalName);
  }
  for (const account of accounts) {
    const member = master.roster.find((item) => item.id === account.rosterMemberId);
    if (member) aliases.set(normalizeMemberName(account.name), member.canonicalName);
  }
  const resolve = (name: string) => aliases.get(normalizeMemberName(name)) ?? name;
  const members = new Map(master.roster.map((member) => [member.canonicalName, { name: member.canonicalName, pledgeClass: member.pledgeClass }]));
  for (const account of accounts) {
    const name = resolve(account.name);
    if (!members.has(name)) members.set(name, { name, pledgeClass: account.pledgeClass ?? "" });
  }
  for (const date of master.assignments) {
    for (const name of [date.memberOne, date.memberTwo]) if (!members.has(name)) members.set(name, { name, pledgeClass: "" });
  }
  const responses = feedback.responses.map((response) => feedbackKey(resolve(response.member), resolve(response.partner)));
  return <NmePage title="Date Assignment" subtitle="Manage every sister date in one place, with response status for both people.">
    <AssignmentMaster aliases={Object.fromEntries([...aliases, ...[...members.keys()].map((name) => [normalizeMemberName(name), name])])} key={master.version} assignments={master.assignments} members={[...members.values()].sort((a, b) => a.name.localeCompare(b.name))} responses={responses} feedbackAvailable={feedback.available} checkedAt={new Date().toISOString()} version={master.version} available={master.available} initialized={master.initialized} />
    <div className="mt-8"><CopyCard title="Draft Text Messages"><DraftTextMessages members={accounts.map((account) => ({ ...account, name: resolve(account.name) }))} assignments={master.assignments} /></CopyCard></div>
  </NmePage>;
}
