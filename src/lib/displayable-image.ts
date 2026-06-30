/**
 * Utilities to make older iPhone HEIC/HEIF photos displayable in browsers/PWA.
 * Some legacy files were saved as `.jpg` while the real payload is HEIC.
 */

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

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
  const converted = await heic2any({ blob, toType: "image/jpeg", quality });
  return Array.isArray(converted) ? converted[0] : converted;
}

function probeImage(objectUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_decode_failed"));
    img.src = objectUrl;
  });
}

export async function createDisplayableImageObjectUrl(blob: Blob, sourceNameOrUrl = ""): Promise<string> {
  if (await isHeicLikeBlob(blob, sourceNameOrUrl)) {
    const jpeg = await convertHeicBlobToJpeg(blob);
    return URL.createObjectURL(jpeg);
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    await probeImage(objectUrl);
    return objectUrl;
  } catch {
    URL.revokeObjectURL(objectUrl);
    const jpeg = await convertHeicBlobToJpeg(blob);
    return URL.createObjectURL(jpeg);
  }
}

export async function createDisplayableImageObjectUrlFromUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`image_download_failed_${res.status}`);
  const blob = await res.blob();
  return createDisplayableImageObjectUrl(blob, url);
}
