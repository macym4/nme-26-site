import sharp from "sharp";

export async function profilePhotoDataUrl(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 512 * 1024) throw new Error("Your photo is too large to submit. Refresh the page and choose it again, or continue without a photo.");
  if (!file.type.startsWith("image/")) throw new Error("Profile photo must be an image file.");
  try {
    const image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16000000 })
      .rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    // Keep the small avatar in PostgreSQL; production servers cannot persist public/uploads.
    return `data:image/jpeg;base64,${image.toString("base64")}`;
  } catch { throw new Error("This photo could not be opened. Try a JPG or PNG photo, or continue without one."); }
}
