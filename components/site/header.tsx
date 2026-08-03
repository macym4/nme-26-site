import Link from "next/link";

import { isAuthenticated } from "@/lib/auth";

export async function SiteHeader() {
  const authenticated = await isAuthenticated();

  return (
    <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="font-serif text-xl font-semibold tracking-tight text-[var(--ink)]" href="/">
          Profile Atlas
        </Link>

        <nav className="flex items-center gap-5 text-sm text-[var(--soft-ink)]">
          <Link className="transition hover:text-[var(--ink)]" href="/directory">
            Directory
          </Link>
          <Link className="transition hover:text-[var(--ink)]" href="/about">
            About
          </Link>
          <Link className="transition hover:text-[var(--ink)]" href={authenticated ? "/admin" : "/admin/login"}>
            {authenticated ? "Admin" : "Login"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
