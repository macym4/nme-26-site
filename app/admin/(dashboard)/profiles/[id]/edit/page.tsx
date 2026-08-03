import { notFound } from "next/navigation";

import { updateProfileAction } from "@/app/actions";
import { ProfileEditor } from "@/components/admin/profile-editor";
import { prisma } from "@/lib/prisma";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      profileTags: {
        include: {
          tag: true,
        },
      },
      customFields: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">Edit profile</p>
        <h2 className="font-serif text-4xl text-[var(--ink)]">{profile.name}</h2>
      </div>
      <ProfileEditor action={updateProfileAction.bind(null, profile.id)} profile={profile} />
    </div>
  );
}
