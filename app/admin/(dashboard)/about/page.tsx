import { AboutEditor } from "@/components/admin/about-editor";
import { prisma } from "@/lib/prisma";

export default async function AdminAboutPage() {
  const about = await prisma.siteContent.findUnique({
    where: { key: "about" },
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">About page</p>
        <h2 className="font-serif text-4xl text-[var(--ink)]">Edit public About content</h2>
      </div>
      <AboutEditor about={about} />
    </div>
  );
}
