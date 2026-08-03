import type { ReactNode } from "react";

export function NmePage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) { return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><section className="rounded-2xl bg-[#7d1d2b] px-7 py-8 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f3dce0]">Alpha Phi Zeta Phi 2026</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{subtitle && <p className="mt-2 text-white/85">{subtitle}</p>}</section><div className="mt-8">{children}</div></div>; }

export function CopyCard({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-2xl border border-[#eadfe1] bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-[#4a3036]">{title}</h2><div className="mt-4 space-y-4 text-[15px] leading-7 text-[#655258]">{children}</div></section>; }
