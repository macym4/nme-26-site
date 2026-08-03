import { profileSchema, type ProfileInput } from "@/lib/validation";

function getList(values: FormDataEntryValue[]) {
  return values
    .map((value) => value.toString().trim())
    .filter(Boolean);
}

export function parseProfileFormData(formData: FormData): ProfileInput {
  const rawCustomLabels = formData.getAll("customFieldLabel").map((value) => value.toString().trim());
  const rawCustomValues = formData.getAll("customFieldValue").map((value) => value.toString().trim());

  const customFields = Array.from({ length: Math.max(rawCustomLabels.length, rawCustomValues.length) }, (_, index) => ({
    label: rawCustomLabels[index] ?? "",
    value: rawCustomValues[index] ?? "",
  }))
    .filter((field) => field.label || field.value);

  return profileSchema.parse({
    name: formData.get("name")?.toString(),
    shortBio: formData.get("shortBio")?.toString(),
    fullBio: formData.get("fullBio")?.toString(),
    category: formData.get("category")?.toString(),
    featured: formData.get("featured") === "on",
    email: formData.get("email")?.toString(),
    instagram: formData.get("instagram")?.toString(),
    website: formData.get("website")?.toString(),
    tags: getList(formData.getAll("tags")),
    customFields,
    existingGalleryImages: getList(formData.getAll("existingGalleryImages")),
    removedGalleryImages: getList(formData.getAll("removedGalleryImages")),
  });
}
