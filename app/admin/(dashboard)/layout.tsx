import Link from "next/link";

import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-[var(--line)] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--soft-ink)]">Admin dashboard</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--ink)]">Directory management</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]" href="/admin">
            Profiles
          </Link>
          <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]" href="/admin/profiles/new">
            New profile
          </Link>
          <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]" href="/admin/about">
            Edit about
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
export const dynamic = "force-dynamic";
