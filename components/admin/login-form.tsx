"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_20px_70px_rgba(18,38,32,0.06)]">
      <FormMessage error={state.errors?.form} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor="username">
          Username
        </label>
        <Input id="username" name="username" />
        <p className="text-xs text-[#b9392c]">{state.errors?.username}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" />
        <p className="text-xs text-[#b9392c]">{state.errors?.password}</p>
      </div>
      <SubmitButton className="w-full" label="Sign in" pendingLabel="Signing in..." />
    </form>
  );
}
