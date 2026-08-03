import Image from "next/image";
import Link from "next/link";

import type { ProfileWithRelations } from "@/lib/profile-service";

import { TagPill } from "@/components/site/tag-pill";

export function ProfileCard({ profile }: { profile: ProfileWithRelations }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_20px_70px_rgba(18,38,32,0.06)] transition hover:-translate-y-1">
      <Link href={`/profiles/${profile.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--muted)]">
          {profile.mainImage ? (
            <Image
              alt={profile.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              src={profile.mainImage}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--soft-ink)]">
              No image yet
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <Link className="inline-block" href={`/profiles/${profile.slug}`}>
            <h3 className="font-serif text-2xl text-[var(--ink)]">{profile.name}</h3>
          </Link>
          <p className="text-sm leading-6 text-[var(--soft-ink)]">{profile.shortBio}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TagPill label={profile.category} />
          {profile.profileTags.slice(0, 2).map(({ tag }) => (
            <TagPill key={tag.id} label={tag.name} />
          ))}
        </div>
      </div>
    </article>
  );
}
