// phone photos are 3-8mb — far too big to post as json, so they get scaled down
// in the browser and stored as a data url. no upload bucket to run for the demo
export const MAX_PHOTOS = 6;
const MAX_EDGE_PX = 1280;
const QUALITY = 0.82;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

// scaled to fit inside a square of MAX_EDGE_PX, keeping aspect ratio
function fit(width: number, height: number): { w: number; h: number } {
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE_PX) return { w: width, h: height };
  const scale = MAX_EDGE_PX / longest;
  return { w: Math.round(width * scale), h: Math.round(height * scale) };
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (!isImageFile(file)) throw new Error(`${file.name} isn't an image`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name} is too big`);

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`couldn't read ${file.name}`);
  });
  const { w, h } = fit(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("couldn't process that image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

// http(s), a data url we made ourselves, or a bundled /listings path — mirrors the server
export function isUsableImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith("data:image/") || src.startsWith("/");
}
