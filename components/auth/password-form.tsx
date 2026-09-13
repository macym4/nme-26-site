"use client";

import { useActionState, useId } from "react";
import type { ProfileFormState } from "@/types";

export function PasswordForm({ action, temporary = false }: { action: (state: ProfileFormState, form: FormData) => Promise<ProfileFormState>; temporary?: boolean }) {
  const [state, submit, pending] = useActionState(action, {});
  const helpId = useId();
  return <form action={submit} className="space-y-4">
    <p id={helpId} className="text-sm text-[#675f64]">{temporary ? "Set a temporary password and share it privately with this member. Their current sessions will end, and they must choose a new password at their next sign-in." : "Choose a new password to finish signing in. It must be different from your temporary password."} Use at least 8 characters.</p>
    {state.errors?.form && <p role="alert" className="text-sm text-red-700">{state.errors.form}</p>}
    {state.success ? <p role="status" className="text-sm text-green-800">{state.success}</p> : <>
      {["password", "confirmPassword"].map((name) => <label key={name} className="block text-sm font-semibold text-[#604a50]">{name === "confirmPassword" ? "Confirm password" : temporary ? "Temporary password" : "New password"}<input aria-describedby={helpId} name={name} type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-[#dfd3d5] bg-white px-3 py-2" /></label>)}
      <button disabled={pending} className="rounded-lg bg-[#7d1d2b] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving..." : temporary ? "Reset password" : "Save new password"}</button>
    </>}
  </form>;
}
