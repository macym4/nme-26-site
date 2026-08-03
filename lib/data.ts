import { prisma } from "@/lib/prisma";
import type { ProfileWithRelations } from "@/lib/profile-service";
import type { TagRecord } from "@/types";

export const profileListInclude = {
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
} as const;

export type DirectoryTag = TagRecord;

export async function getFeaturedProfiles(): Promise<ProfileWithRelations[]> {
  return prisma.profile.findMany({
    where: { featured: true },
    include: profileListInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });
}

export async function getAllTags(): Promise<DirectoryTag[]> {
  return prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDirectoryProfiles({
  search,
  tag,
  sort,
}: {
  search?: string;
  tag?: string;
  sort?: "alphabetical" | "newest";
}): Promise<ProfileWithRelations[]> {
  return prisma.profile.findMany({
    where: {
      AND: [
        search
          ? {
              name: {
                contains: search,
              },
            }
          : {},
        tag
          ? {
              profileTags: {
                some: {
                  tag: {
                    slug: tag,
                  },
                },
              },
            }
          : {},
      ],
    },
    include: profileListInclude,
    orderBy:
      sort === "alphabetical"
        ? {
            name: "asc",
          }
        : {
            createdAt: "desc",
          },
  });
}
