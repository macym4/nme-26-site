import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  if (!email) throw new Error("Set INITIAL_ADMIN_EMAIL before running this script.");
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { role: "admin", accessStatus: "approved", approvedAt: new Date(), approvedBy: "setup-script" } });
  console.log(`Approved administrator: ${email}`);
}

main().finally(() => prisma.$disconnect());
