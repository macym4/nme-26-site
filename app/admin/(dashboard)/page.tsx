import Link from "next/link";

import { deleteProfileAction } from "@/app/actions";
import { EmptyState } from "@/components/site/empty-state";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { ProfileRecord, TagRecord } from "@/types";

type AdminDashboardProfile = ProfileRecord & {
  profileTags: {
    profileId: string;
    tagId: string;
    tag: TagRecord;
  }[];
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;
  const profiles: AdminDashboardProfile[] = await prisma.profile.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      profileTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {success ? (
        <div className="rounded-2xl border border-[#b6dfc8] bg-[#eef9f1] px-4 py-3 text-sm text-[#1f6a3d]">
          Profile {success}.
        </div>
      ) : null}

      {profiles.length ? (
        <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--muted)] text-[var(--soft-ink)]">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Featured</th>
                <th className="px-5 py-4 font-medium">Updated</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[var(--ink)]">{profile.name}</div>
                    <div className="mt-1 text-xs text-[var(--soft-ink)]">{profile.slug}</div>
                  </td>
                  <td className="px-5 py-4 text-[var(--soft-ink)]">{profile.category}</td>
                  <td className="px-5 py-4 text-[var(--soft-ink)]">{profile.featured ? "Yes" : "No"}</td>
                  <td className="px-5 py-4 text-[var(--soft-ink)]">{formatDate(profile.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-full border border-[var(--line)] px-3 py-1.5 font-semibold text-[var(--ink)]"
                        href={`/profiles/${profile.slug}`}
                      >
                        View
                      </Link>
                      <Link
                        className="rounded-full border border-[var(--line)] px-3 py-1.5 font-semibold text-[var(--ink)]"
                        href={`/admin/profiles/${profile.id}/edit`}
                      >
                        Edit
                      </Link>
                      <form action={deleteProfileAction.bind(null, profile.id)}>
                        <button
                          className="rounded-full bg-[#b9392c] px-3 py-1.5 font-semibold text-white"
                          type="submit"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/profiles/new"
          actionLabel="Create the first profile"
          body="The database is empty. Add a profile to populate the public directory and the homepage."
          title="No profiles yet"
        />
      )}
    </div>
  );
}
