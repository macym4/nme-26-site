import Link from "next/link";

import { cn } from "@/lib/utils";

export function TagPill({
  label,
  href,
  active = false,
}: {
  label: string;
  href?: string;
  active?: boolean;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "border-[var(--line)] bg-white text-[var(--soft-ink)]",
      )}
    >
      {label}
    </span>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
