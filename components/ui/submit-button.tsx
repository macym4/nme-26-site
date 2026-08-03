"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel ?? "Saving..." : label}
    </Button>
  );
}
