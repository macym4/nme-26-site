// Resize before calling the Server Action so phone photos stay below its 1 MB limit.
export async function prepareProfilePhoto(file: File): Promise<File> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose a profile photo that is 5 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image for your profile photo.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error("This photo could not be opened. Try a JPG, PNG, or WebP photo, or continue without one."); }
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare your photo. Please continue without one.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size > 512 * 1024) throw new Error("Unable to shrink this photo. Try a smaller image or continue without one.");
    return new File([blob], "profile.jpg", { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
