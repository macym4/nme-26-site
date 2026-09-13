import type { ReactNode } from "react";

export function NmePage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><section className="border-b-4 border-[#b9b6b9] bg-[#6f1935] px-7 py-12 text-white sm:px-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/70">MIT Alpha Phi, Zeta Phi Chapter</p><h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[.9] tracking-tight sm:text-6xl">{title}</h1>{subtitle && <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">{subtitle}</p>}</section><div className="bg-white p-5 sm:p-9">{children}</div></div>;
}

export function CopyCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="relative border border-[#dedbdd] bg-white p-6"><div className="h-px w-12 bg-[#6f1935]" /><h2 className="mt-4 font-serif text-3xl font-semibold leading-none tracking-tight text-[#3a3337]">{title}</h2><div className="mt-4 space-y-4 text-[15px] leading-7 text-[#655e63]">{children}</div></section>;
}
