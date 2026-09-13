"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearUserSession, createUserSession, getUserSessionId, requireUserAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finishPasswordReset, PasswordResetError, setTemporaryPassword } from "@/lib/password-reset";
import type { ProfileFormState } from "@/types";

export async function resetMemberPassword(memberId: string, _: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const actor = await requireUserAdmin();
  try {
    await setTemporaryPassword(prisma, actor.id, memberId, String(form.get("password") || ""), String(form.get("confirmPassword") || ""));
  } catch (error) {
    return { errors: { form: error instanceof PasswordResetError ? error.message : "Could not reset the password. Please try again." } };
  }
  revalidatePath("/profile-management");
  return { success: "Temporary password saved. Share it privately with this member. They must choose a new password when they sign in." };
}

export async function changeRequiredPassword(_: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const id = await getUserSessionId(true);
  if (!id) redirect("/");
  try {
    await finishPasswordReset(prisma, id, String(form.get("password") || ""), String(form.get("confirmPassword") || ""));
  } catch (error) {
    return { errors: { form: error instanceof PasswordResetError ? error.message : "Could not save your password. Please try again." } };
  }
  await clearUserSession();
  await createUserSession(id);
  redirect("/welcome");
}
