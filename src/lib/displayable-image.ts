/**
 * Utilities to make older iPhone HEIC/HEIF photos displayable in browsers/PWA.
 * Some legacy files were saved as `.jpg` while the real payload is HEIC.
 */

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];
const IMAGE_PROBE_TIMEOUT_MS = 8000;
const IMAGE_FETCH_TIMEOUT_MS = 12000;
const HEIC_CONVERSION_TIMEOUT_MS = 18000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timer));
  });
}

export async function hasHeicSignature(blob: Blob): Promise<boolean> {
  try {
    const header = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
    const text = Array.from(header)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : " "))
      .join("")
      .toLowerCase();
    return text.includes("ftyp") && HEIC_BRANDS.some((brand) => text.includes(brand));
  } catch {
    return false;
  }
}

export async function isHeicLikeBlob(blob: Blob, sourceNameOrUrl = ""): Promise<boolean> {
  const type = (blob.type || "").toLowerCase();
  const source = sourceNameOrUrl.toLowerCase().split("?")[0];
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    /\.(heic|heif)$/i.test(source) ||
    (await hasHeicSignature(blob))
  );
}

export async function convertHeicBlobToJpeg(blob: Blob, quality = 0.9): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const converted = await withTimeout(
    heic2any({ blob, toType: "image/jpeg", quality }) as Promise<Blob | Blob[]>,
    HEIC_CONVERSION_TIMEOUT_MS,
    "heic_conversion"
  );
  return Array.isArray(converted) ? converted[0] : converted;
}

function probeImage(objectUrl: string): Promise<void> {
  return withTimeout(new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_decode_failed"));
    img.src = objectUrl;
  }), IMAGE_PROBE_TIMEOUT_MS, "image_probe");
}

export async function createDisplayableImageObjectUrl(blob: Blob, sourceNameOrUrl = ""): Promise<string> {
  const { objectUrl } = await resolveDisplayableImage(blob, sourceNameOrUrl);
  return objectUrl;
}

export async function resolveDisplayableImage(
  blob: Blob,
  sourceNameOrUrl = "",
): Promise<{ objectUrl: string; blob: Blob; converted: boolean }> {
  if (await isHeicLikeBlob(blob, sourceNameOrUrl)) {
    const jpeg = await convertHeicBlobToJpeg(blob);
    return { objectUrl: URL.createObjectURL(jpeg), blob: jpeg, converted: true };
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    await probeImage(objectUrl);
    return { objectUrl, blob, converted: false };
  } catch {
    URL.revokeObjectURL(objectUrl);
    const jpeg = await convertHeicBlobToJpeg(blob);
    return { objectUrl: URL.createObjectURL(jpeg), blob: jpeg, converted: true };
  }
}

export async function createDisplayableImageObjectUrlFromUrl(url: string): Promise<string> {
  const { objectUrl } = await resolveDisplayableImageFromUrl(url);
  return objectUrl;
}

export async function resolveDisplayableImageFromUrl(
  url: string,
): Promise<{ objectUrl: string; blob: Blob; converted: boolean }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  let blob: Blob;
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`image_download_failed_${res.status}`);
    blob = await res.blob();
  } finally {
    window.clearTimeout(timeout);
  }
  return resolveDisplayableImage(blob, url);
}
