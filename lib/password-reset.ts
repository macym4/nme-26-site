import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export class PasswordResetError extends Error {}

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) throw new PasswordResetError("Use at least 8 characters and no more than 72 bytes.");
  if (password !== confirmation) throw new PasswordResetError("Passwords do not match.");
}

export async function setTemporaryPassword(db: PrismaClient, actorId: string, memberId: string, password: string, confirmation: string) {
  validateNewPassword(password, confirmation);
  const actor = await db.user.findUnique({ where: { id: actorId } });
  if (actor?.role !== "admin" || actor.accessStatus !== "approved" || actor.mustChangePassword) throw new PasswordResetError("Administrator access is required.");
  if (actorId === memberId) throw new PasswordResetError("Use this feature to reset another member's password.");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction([
    db.user.update({ where: { id: memberId }, data: { passwordHash, mustChangePassword: true, sessionVersion: { increment: 1 } } }),
    db.accessAudit.create({ data: { userId: memberId, actorId, action: "ADMIN_PASSWORD_RESET" } }),
  ]);
}

export async function finishPasswordReset(db: PrismaClient, userId: string, password: string, confirmation: string) {
  validateNewPassword(password, confirmation);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.mustChangePassword) throw new PasswordResetError("No password change is pending. Sign in again.");
  if (await bcrypt.compare(password, user.passwordHash)) throw new PasswordResetError("Choose a password different from your temporary password.");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async (tx) => {
    const result = await tx.user.updateMany({ where: { id: userId, sessionVersion: user.sessionVersion, mustChangePassword: true }, data: { passwordHash, mustChangePassword: false, sessionVersion: { increment: 1 } } });
    if (!result.count) throw new PasswordResetError("Your password changed elsewhere. Sign in again.");
    await tx.accessAudit.create({ data: { userId, actorId: userId, action: "PASSWORD_CHANGE_COMPLETED" } });
  });
}
