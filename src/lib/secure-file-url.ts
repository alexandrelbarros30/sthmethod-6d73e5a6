import { supabase } from "@/integrations/supabase/client";

/**
 * Helper para Fase 1 da migração de buckets privados.
 *
 * Estratégia:
 * - Se receber um `storage_path` (caminho puro tipo "userId/arquivo.jpg"),
 *   gera uma signed URL com validade configurável.
 * - Se receber apenas a URL pública antiga, retorna como está (compatibilidade).
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
  if (storagePath) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);
    if (!error && data?.signedUrl) return data.signedUrl;
  }
  return fallbackUrl ?? null;
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
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}
