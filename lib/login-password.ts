import bcrypt from "bcryptjs";

export async function checkLoginPassword(password: string, accountHash: string, recoveryHash?: string): Promise<"account" | "recovery" | null> {
  if (await bcrypt.compare(password, accountHash)) return "account";
  if (recoveryHash && await bcrypt.compare(password, recoveryHash)) return "recovery";
  return null;
}
