import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE_MB = 1;
const MAX_DIMENSION = 1000;

/**
 * Detect content type from blob/file
 */
function getContentType(blob: Blob): string {
  if (blob.type && blob.type.startsWith("image/")) return blob.type;
  return "image/jpeg";
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
      console.warn("[image-upload] Could not decode image, uploading original");
      return file;
    }
  }

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("[image-upload] Canvas context unavailable, uploading original");
    return file;
  }

  ctx.drawImage(drawSource, 0, 0, width, height);
  if ("close" in drawSource) (drawSource as ImageBitmap).close();

  return new Promise((resolve) => {
    let quality = 0.85;
    const tryCompress = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn("[image-upload] canvas.toBlob returned null, uploading original");
            resolve(file);
            return;
          }
          if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
            quality -= 0.15;
            tryCompress();
          } else {
            resolve(blob);
          }
        },
        "image/jpeg",
        quality,
      );
    };
    tryCompress();
  });
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
      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType,
        upsert: true,
      });
      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
      }
      console.warn(`[image-upload] Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
    } catch (err) {
      if (attempt === retries) throw err;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
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
export function validateImageFile(file: File, maxSizeMB = 15): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/jpg", ""];
  const allowedExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i;

  if (!allowedTypes.includes(file.type) && !allowedExt.test(file.name)) {
    return "Apenas arquivos de imagem são aceitos (JPG, PNG, WEBP).";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Arquivo muito grande. Máximo ${maxSizeMB}MB.`;
  }
  return null;
}
