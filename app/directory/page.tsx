import type { Metadata } from "next";

import { DirectoryFilters } from "@/components/site/directory-filters";
import { EmptyState } from "@/components/site/empty-state";
import { ProfileCard } from "@/components/site/profile-card";
import { TagPill } from "@/components/site/tag-pill";
import { getAllTags, getDirectoryProfiles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Directory | Profile Atlas",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const sort = params.sort === "alphabetical" ? "alphabetical" : "newest";

  const [profiles, tags] = await Promise.all([
    getDirectoryProfiles({ search, tag, sort }),
    getAllTags(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--soft-ink)]">Directory</p>
          <h1 className="font-serif text-5xl text-[var(--ink)]">Browse every profile</h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--soft-ink)]">
            Search by name, narrow the list with tags, and sort the full directory by newest additions or
            alphabetical order.
          </p>
        </div>

        <DirectoryFilters search={search} sort={sort} tag={tag} tagOptions={tags} />

        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            <TagPill active={!tag} href="/directory" label="All" />
            {tags.map((item) => (
              <TagPill
                key={item.id}
                active={tag === item.slug}
                href={`/directory?tag=${item.slug}${search ? `&search=${encodeURIComponent(search)}` : ""}&sort=${sort}`}
                label={item.name}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        {profiles.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/admin"
            actionLabel="Create a profile"
            body="No profiles matched the current search or filters. Try adjusting the filters or add a new profile from the admin area."
            title="No matching profiles"
          />
        )}
      </section>
    </div>
  );
}
