import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | Profile Atlas",
};

export default async function AboutPage() {
  const about = await prisma.siteContent.findUnique({
    where: {
      key: "about",
    },
  });
  const paragraphs = (about?.body ?? "Add your about page copy in the admin dashboard.").split("\n");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-[2.5rem] border border-[var(--line)] bg-white p-8 md:p-12">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--soft-ink)]">About</p>
        <h1 className="mt-4 font-serif text-5xl text-[var(--ink)]">{about?.title ?? "About this directory"}</h1>
        <div className="mt-8 space-y-5 text-base leading-8 text-[var(--soft-ink)]">
          {paragraphs.map((paragraph: string) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
