import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { saveUploadedFile } from "@/lib/uploads";
import type { ProfileInput } from "@/lib/validation";
import type {
  CustomFieldRecord,
  ImageRecord,
  ProfileRecord,
  ProfileTagRecord,
} from "@/types";

export type ProfileTagWithTag = ProfileTagRecord;

export type ProfileWithRelations = ProfileRecord & {
  images: ImageRecord[];
  profileTags: ProfileTagWithTag[];
  customFields: CustomFieldRecord[];
};

async function buildUniqueSlug(name: string, profileId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.profile.findFirst({
      where: {
        slug,
        ...(profileId ? { NOT: { id: profileId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return slug;
    }

    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export async function createProfileRecord(input: ProfileInput, formData: FormData) {
  const slug = await buildUniqueSlug(input.name);
  const mainImageFile = formData.get("mainImageFile");
  const galleryFiles = formData
    .getAll("galleryImages")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const mainImage =
    mainImageFile instanceof File && mainImageFile.size > 0
      ? await saveUploadedFile(mainImageFile, slug, "main")
      : null;

  const galleryImages = await Promise.all(
    galleryFiles.map((file, index) => saveUploadedFile(file, slug, `gallery-${index + 1}`)),
  );

  await prisma.profile.create({
    data: {
      name: input.name,
      slug,
      shortBio: input.shortBio,
      fullBio: input.fullBio,
      category: input.category,
      featured: input.featured,
      email: input.email,
      instagram: input.instagram,
      website: input.website,
      mainImage,
      images: {
        create: galleryImages
          .filter((url): url is string => Boolean(url))
          .map((url, index) => ({
            url,
            alt: `${input.name} gallery image ${index + 1}`,
            sortOrder: index,
          })),
      },
      customFields: {
        create: input.customFields.map((field, index) => ({
          label: field.label,
          value: field.value,
          sortOrder: index,
        })),
      },
      profileTags: {
        create: normalizeTags(input.tags).map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { slug: slugify(tag) },
              create: {
                name: tag,
                slug: slugify(tag),
              },
            },
          },
        })),
      },
    },
  });
}

export async function updateProfileRecord(profileId: string, input: ProfileInput, formData: FormData) {
  const existing = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      images: true,
    },
  });

  if (!existing) {
    throw new Error("Profile not found.");
  }

  const slug = await buildUniqueSlug(input.name, profileId);
  const mainImageFile = formData.get("mainImageFile");
  const galleryFiles = formData
    .getAll("galleryImages")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const mainImage =
    mainImageFile instanceof File && mainImageFile.size > 0
      ? await saveUploadedFile(mainImageFile, slug, "main")
      : formData.get("clearMainImage") === "on"
        ? null
        : existing.mainImage;

  const uploadedGalleryUrls = await Promise.all(
    galleryFiles.map((file, index) => saveUploadedFile(file, slug, `gallery-${index + 1}`)),
  );

  const keptGalleryUrls = input.existingGalleryImages.filter(
    (url) => !input.removedGalleryImages.includes(url),
  );
  const finalGalleryUrls = [...keptGalleryUrls, ...uploadedGalleryUrls.filter((url): url is string => Boolean(url))];

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      name: input.name,
      slug,
      shortBio: input.shortBio,
      fullBio: input.fullBio,
      category: input.category,
      featured: input.featured,
      email: input.email,
      instagram: input.instagram,
      website: input.website,
      mainImage,
      images: {
        deleteMany: {},
        create: finalGalleryUrls.map((url, index) => ({
          url,
          alt: `${input.name} gallery image ${index + 1}`,
          sortOrder: index,
        })),
      },
      customFields: {
        deleteMany: {},
        create: input.customFields.map((field, index) => ({
          label: field.label,
          value: field.value,
          sortOrder: index,
        })),
      },
      profileTags: {
        deleteMany: {},
        create: normalizeTags(input.tags).map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { slug: slugify(tag) },
              create: {
                name: tag,
                slug: slugify(tag),
              },
            },
          },
        })),
      },
    },
  });
}
