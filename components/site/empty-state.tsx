import Link from "next/link";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[var(--line)] bg-white/70 px-6 py-12 text-center">
      <h2 className="font-serif text-2xl text-[var(--ink)]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--soft-ink)]">{body}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
