export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[var(--soft-ink)] sm:flex-row sm:items-center sm:justify-between">
        <p>Custom directory app built with Next.js, Prisma, SQLite, and Tailwind CSS.</p>
        <p>Designed for easy local updates and a future PostgreSQL switch.</p>
      </div>
    </footer>
  );
}
