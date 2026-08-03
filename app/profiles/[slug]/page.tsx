import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TagPill } from "@/components/site/tag-pill";
import { prisma } from "@/lib/prisma";
import type { ProfileTagWithTag, ProfileWithRelations } from "@/lib/profile-service";
import type { CustomFieldRecord, ImageRecord } from "@/types";

type ProfileMetadataRecord = {
  name: string;
  shortBio: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile: ProfileMetadataRecord | null = await prisma.profile.findUnique({
    where: { slug },
    select: {
      name: true,
      shortBio: true,
    },
  });

  if (!profile) {
    return {
      title: "Profile not found | Profile Atlas",
    };
  }

  return {
    title: `${profile.name} | Profile Atlas`,
    description: profile.shortBio,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile: ProfileWithRelations | null = await prisma.profile.findUnique({
    where: { slug },
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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link className="text-sm font-semibold text-[var(--ink)]" href="/directory">
        ← Back to directory
      </Link>

      <section className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-[var(--muted)]">
            {profile.mainImage ? (
              <Image alt={profile.name} className="h-full w-full object-cover" fill priority src={profile.mainImage} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--soft-ink)]">No image yet</div>
            )}
          </div>

          {profile.images.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.images.map((image: ImageRecord) => (
                <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[var(--muted)]">
                  <Image alt={image.alt ?? `${profile.name} gallery image`} className="h-full w-full object-cover" fill src={image.url} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6 rounded-[2.5rem] border border-[var(--line)] bg-white p-7">
          <div className="space-y-4">
            <TagPill label={profile.category} />
            <h1 className="font-serif text-5xl leading-tight text-[var(--ink)]">{profile.name}</h1>
            <p className="text-lg leading-8 text-[var(--soft-ink)]">{profile.shortBio}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">Overview</h2>
            <p className="text-base leading-8 text-[var(--ink)]">{profile.fullBio}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {profile.profileTags.map(({ tag }: ProfileTagWithTag) => (
                <TagPill key={tag.id} href={`/directory?tag=${tag.slug}`} label={tag.name} />
              ))}
            </div>
          </div>

          {(profile.email || profile.instagram || profile.website) && (
            <div className="space-y-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">Contact</h2>
              <div className="grid gap-2 text-sm text-[var(--ink)]">
                {profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : null}
                {profile.website ? (
                  <a href={profile.website} rel="noreferrer" target="_blank">
                    Website
                  </a>
                ) : null}
                {profile.instagram ? (
                  <a href={profile.instagram} rel="noreferrer" target="_blank">
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {profile.customFields.length ? (
            <div className="space-y-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">Details</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {profile.customFields.map((field: CustomFieldRecord) => (
                  <div key={field.id} className="rounded-[1.5rem] bg-[var(--muted)] px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-[var(--soft-ink)]">{field.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--ink)]">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
