"use client";

import { useActionState } from "react";

import { unlockDateFeedbackAction } from "@/app/actions";

export function DateFeedbackUnlockForm() {
  const [state, action, pending] = useActionState(unlockDateFeedbackAction, {});

  return <form action={action} className="max-w-md rounded-2xl border border-[#eadfe1] bg-white p-6 shadow-sm"><label className="block text-sm font-semibold text-[#604a50]">Results password<input name="password" type="password" required autoComplete="current-password" className="mt-1.5 w-full rounded-lg border border-[#dfd3d5] px-3 py-2" /></label>{state.errors?.form && <p className="mt-3 text-sm text-red-700">{state.errors.form}</p>}<button disabled={pending} className="mt-4 rounded-lg bg-[#7d1d2b] px-4 py-2 text-sm font-bold text-white">{pending ? "Unlocking…" : "Unlock results"}</button></form>;
}
