import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>;

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--muted)]",
        variant === "ghost" && "text-[var(--ink)] hover:bg-[var(--muted)]",
        variant === "danger" && "bg-[#b9392c] text-white hover:bg-[#a53124]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
