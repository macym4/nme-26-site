import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="rounded-[2rem] border border-[var(--line)] bg-white p-8 text-center">
        <h1 className="font-serif text-4xl text-[var(--ink)]">Page not found</h1>
        <p className="mt-3 text-sm text-[var(--soft-ink)]">
          The page you requested does not exist or may have been moved.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
          href="/"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
