import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export async function saveUploadedFile(file: File, slug: string, prefix: string) {
  if (!file || file.size === 0) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name) || ".bin";
  const fileName = `${prefix}-${Date.now()}-${sanitizeFileName(path.basename(file.name, extension))}${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "runtime", slug);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), bytes);

  return `/uploads/runtime/${slug}/${fileName}`;
}
