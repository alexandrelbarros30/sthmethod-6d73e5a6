import { supabase } from "@/integrations/supabase/client";
import { convertHeicBlobToJpeg, hasHeicSignature } from "@/lib/displayable-image";

const MAX_SIZE_MB = 1;
const MAX_DIMENSION = 1000;
const MIN_DIMENSION = 480;
const UPLOAD_TIMEOUT_MS = 30000;

/**
 * Detect HEIC/HEIF file by extension or MIME type (iPhone native format).
 */
function isHeic(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  return t.includes("heic") || t.includes("heif") || /\.(heic|heif)$/i.test(n);
}

/**
 * Convert HEIC/HEIF (iPhone native format) to JPEG using heic2any (WASM).
 * Browsers other than Safari cannot decode HEIC natively.
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  console.log("[image-upload] Converting HEIC → JPEG…");
  const blob = await convertHeicBlobToJpeg(file, 0.9);
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Detect content type from blob/file
 */
function getContentType(blob: Blob): string {
  if (blob.type && blob.type.startsWith("image/")) return blob.type;
  return "image/jpeg";
}

function canUploadOriginalImage(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  return ["image/jpeg", "image/jpg", "image/png", "image/webp", ""].includes(type)
    || /\.(jpg|jpeg|png|webp)$/i.test(name);
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

/**
 * Load image with multiple fallback strategies for maximum mobile compatibility.
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  // Strategy 1: Object URL
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("objectUrl failed"));
      i.src = objectUrl;
    });
    return img;
  } catch {
    URL.revokeObjectURL(objectUrl);
  }

  // Strategy 2: FileReader data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("dataUrl failed"));
    i.src = dataUrl;
  });
}

/**
 * Compress an image file using canvas.
 * Returns a Blob (JPEG) that is <= maxSizeMB.
 * If compression fails entirely, returns the original file.
 */
export async function compressImage(
  file: File,
  maxSizeMB = MAX_SIZE_MB,
  maxDim = MAX_DIMENSION,
): Promise<Blob> {
  // iPhone HEIC/HEIF: convert to JPEG first (browsers cannot decode HEIC natively)
  if (isHeic(file) || await hasHeicSignature(file)) {
    try {
      file = await convertHeicToJpeg(file);
    } catch (err) {
      console.error("[image-upload] HEIC conversion failed:", err);
      throw new Error(
        "Não foi possível converter a foto HEIC do iPhone. " +
        "Tire um print da imagem ou mude Ajustes → Câmera → Formatos → 'Mais Compatível'."
      );
    }
  }

  let width: number, height: number;
  let drawSource: ImageBitmap | HTMLImageElement;

  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    drawSource = bitmap;
  } catch {
    try {
      const img = await loadImage(file);
      width = img.width;
      height = img.height;
      drawSource = img;
    } catch {
      if (canUploadOriginalImage(file)) {
        console.warn("[image-upload] Could not decode image for compression, uploading original file");
        return file;
      }

      console.warn("[image-upload] Could not decode image (likely HEIC/HEIF)");
      throw new Error(
        "Formato de imagem não suportado. Use JPG, PNG ou WEBP."
      );
    }
  }

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("[image-upload] Canvas context unavailable, uploading original");
    return file;
  }

  let currentWidth = width;
  let currentHeight = height;
  let quality = 0.78;
  let passes = 0;
  const maxBytes = maxSizeMB * 1024 * 1024;
  let lastBlob: Blob | null = null;

  while (passes < 8) {
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(drawSource, 0, 0, currentWidth, currentHeight);

    const blob = await canvasToJpegBlob(canvas, quality);
    if (!blob) {
      console.warn("[image-upload] canvas.toBlob returned null, uploading original");
      if ("close" in drawSource) (drawSource as ImageBitmap).close();
      return file;
    }

    lastBlob = blob;
    console.log(`[image-upload] Compression pass ${passes + 1}: ${currentWidth}x${currentHeight} @ ${quality.toFixed(2)} = ${(blob.size / 1024).toFixed(0)}KB`);

    if (blob.size <= maxBytes) {
      if ("close" in drawSource) (drawSource as ImageBitmap).close();
      return blob;
    }

    if (quality > 0.42) {
      quality = Math.max(0.42, quality - 0.12);
    } else {
      const nextWidth = Math.max(MIN_DIMENSION, Math.round(currentWidth * 0.82));
      const nextHeight = Math.max(MIN_DIMENSION, Math.round(currentHeight * 0.82));

      if (nextWidth === currentWidth && nextHeight === currentHeight) {
        break;
      }

      currentWidth = nextWidth;
      currentHeight = nextHeight;
      quality = 0.72;
    }

    passes += 1;
  }

  if ("close" in drawSource) (drawSource as ImageBitmap).close();
  console.warn("[image-upload] Max compression passes reached, uploading last compressed version");
  return lastBlob || file;
}

/**
 * Upload with retry logic for flaky mobile connections.
 * Automatically detects content type from the blob.
 */
export async function uploadWithRetry(
  bucket: string,
  path: string,
  blob: Blob,
  retries = 3,
): Promise<string> {
  const contentType = getContentType(blob);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[image-upload] Upload attempt ${attempt}/${retries}, size: ${(blob.size / 1024).toFixed(0)}KB`);

      const uploadPromise = supabase.storage.from(bucket).upload(path, blob, {
        contentType,
        upsert: true,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Upload timeout")), UPLOAD_TIMEOUT_MS);
      });

      const { error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
      }
      console.warn(`[image-upload] Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn(`[image-upload] Attempt ${attempt} exception:`, msg);
      if (attempt === retries) {
        if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.toLowerCase().includes("timeout")) {
          throw new Error(
            "Falha de rede ao enviar. Verifique sua conexão (Wi-Fi/4G) e tente novamente. " +
            "Se o problema persistir, a imagem pode estar muito grande — use JPG/PNG."
          );
        }
        throw err;
      }
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error("Upload failed after retries");
}

/**
 * Full pipeline: validate → compress → upload → return public URL.
 */
export async function processAndUpload(
  file: File,
  bucket: string,
  path: string,
): Promise<string> {
  console.log(`[image-upload] Processing ${file.name} (${(file.size / 1024).toFixed(0)}KB, type: ${file.type || "unknown"})`);

  const compressed = await compressImage(file);
  console.log(`[image-upload] Compressed to ${(compressed.size / 1024).toFixed(0)}KB`);

  const url = await uploadWithRetry(bucket, path, compressed);
  console.log(`[image-upload] Upload complete: ${url.substring(0, 60)}...`);

  return url;
}

/**
 * Validates a file for image upload.
 * Returns error message or null if valid.
 */
export function validateImageFile(file: File, maxSizeMB = 50): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/jpg", ""];
  const allowedExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i;
  const normalizedType = (file.type || "").toLowerCase();
  const isGenericRasterImage = normalizedType.startsWith("image/") && normalizedType !== "image/svg+xml";

  if (!allowedTypes.includes(normalizedType) && !isGenericRasterImage && !allowedExt.test(file.name)) {
    return "Apenas arquivos de imagem são aceitos (JPG, PNG, WEBP).";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Arquivo muito grande. Máximo ${maxSizeMB}MB.`;
  }
  return null;
}
