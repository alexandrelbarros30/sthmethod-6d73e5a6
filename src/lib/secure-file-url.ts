import { supabase } from "@/integrations/supabase/client";

/**
 * Helper para Fase 1 da migração de buckets privados.
 *
 * Estratégia:
 * - Se receber um `storage_path` (caminho puro tipo "userId/arquivo.jpg"),
 *   gera uma signed URL com validade configurável.
 * - Se receber apenas uma URL antiga do Storage, extrai o caminho e assina.
 *
 * Quando os buckets virarem privados (Fase 3), apenas o caminho puro funcionará.
 */

const DEFAULT_EXPIRES_IN = 60 * 60; // 1 hora

export interface SecureUrlOptions {
  bucket: "body-images" | "documents";
  storagePath?: string | null;
  fallbackUrl?: string | null;
  expiresIn?: number;
}

export async function getSecureFileUrl({
  bucket,
  storagePath,
  fallbackUrl,
  expiresIn = DEFAULT_EXPIRES_IN,
}: SecureUrlOptions): Promise<string | null> {
  const path = storagePath || extractStoragePath(fallbackUrl, bucket);
  if (path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (!error && data?.signedUrl) return data.signedUrl;

    try {
      await supabase.auth.refreshSession();
      const retry = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (!retry.error && retry.data?.signedUrl) return retry.data.signedUrl;
    } catch {
      // keep fallback below
    }

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-sign-files", {
        body: { bucket, paths: [path], expiresIn },
      });
      const signedUrl = fnData?.data?.[0]?.signedUrl || fnData?.data?.[0]?.signedURL;
      if (!fnError && signedUrl) return signedUrl;
    } catch {
      // keep fallback below
    }
  }

  return fallbackUrl && !isStorageObjectUrl(fallbackUrl) ? fallbackUrl : null;
}

/**
 * Extrai o `storage_path` a partir de uma URL pública do Supabase Storage.
 * Útil para backfill retroativo de URLs já salvas no banco.
 *
 * Ex.: https://xxx.supabase.co/storage/v1/object/public/body-images/abc/foto.jpg
 *      -> "abc/foto.jpg"
 */
export function extractStoragePath(
  publicUrl: string | null | undefined,
  bucket: string
): string | null {
  if (!publicUrl) return null;

  const clean = publicUrl.split("?")[0];
  const marker = `/storage/v1/object/`;
  const idx = clean.indexOf(marker);
  if (idx === -1) {
    return clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
  }

  const objectPath = clean.slice(idx + marker.length);
  const bucketMarker = `/${bucket}/`;
  const bucketIdx = objectPath.indexOf(bucketMarker);
  if (bucketIdx === -1) return null;
  return decodeURIComponent(objectPath.slice(bucketIdx + bucketMarker.length));
}

export function isStorageObjectUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("/storage/v1/object/");
}
