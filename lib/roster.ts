import { prisma } from "@/lib/prisma";

export function normalizeMemberName(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

export async function findVerifiedRosterMatch(name: string) {
  const normalizedName = normalizeMemberName(name);
  const roster = await prisma.rosterMember.findMany();

  return roster.find((member) => {
    const aliases = JSON.parse(member.aliases) as string[];
    return [member.canonicalName, member.dateSheetName, ...aliases].some((candidate) => normalizeMemberName(candidate) === normalizedName);
  }) ?? null;
}
