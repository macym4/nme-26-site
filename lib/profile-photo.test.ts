import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { profilePhotoDataUrl } from "./profile-photo";

test("creates a persistent small JPEG avatar without writing to the filesystem", async () => {
  const png = await sharp({ create: { width: 1400, height: 1000, channels: 3, background: "#6f1935" } }).png().toBuffer();
  const result = await profilePhotoDataUrl(new File([new Uint8Array(png)], "photo.png", { type: "image/png" }));
  assert.ok(result?.startsWith("data:image/jpeg;base64,"));
  const bytes = Buffer.from(result!.split(",")[1], "base64");
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 512);
  assert.ok(metadata.height! <= 512);
  assert.ok(bytes.length < 512 * 1024);
  assert.equal(metadata.exif, undefined);
});

test("allows signup without a photo", async () => {
  assert.equal(await profilePhotoDataUrl(null), null);
  assert.equal(await profilePhotoDataUrl(new File([], "")), null);
});

test("rejects oversized, mislabeled, and corrupt photos before account creation", async () => {
  await assert.rejects(profilePhotoDataUrl(new File([new Uint8Array(512 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })), /too large/);
  await assert.rejects(profilePhotoDataUrl(new File(["text"], "text.txt", { type: "text/plain" })), /image file/);
  await assert.rejects(profilePhotoDataUrl(new File(["not an image"], "fake.jpg", { type: "image/jpeg" })), /could not be opened/);
});
