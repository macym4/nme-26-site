"use client";

import { useActionState } from "react";

import { updateAboutAction } from "@/app/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SiteContentRecord } from "@/types";

export function AboutEditor({ about }: { about: SiteContentRecord | null }) {
  const [state, formAction] = useActionState(updateAboutAction, {});

  return (
    <form action={formAction} className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-white p-6">
      <FormMessage error={state.errors?.form} success={state.success} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor="title">
          Title
        </label>
        <Input defaultValue={about?.title ?? ""} id="title" name="title" />
        <p className="text-xs text-[#b9392c]">{state.errors?.title}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--ink)]" htmlFor="body">
          Body
        </label>
        <Textarea defaultValue={about?.body ?? ""} id="body" name="body" />
        <p className="text-xs text-[#b9392c]">{state.errors?.body}</p>
      </div>
      <SubmitButton label="Save about page" pendingLabel="Saving..." />
    </form>
  );
}
