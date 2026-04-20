import { useEffect, useState } from "react";
import { getSecureFileUrl, extractStoragePath } from "@/lib/secure-file-url";

type Bucket = "body-images" | "documents";

/**
 * Hook que resolve uma URL segura (signed URL) a partir de um `storage_path`
 * ou, como fallback, extrai o path de uma URL pública antiga.
 *
 * Mantém compatibilidade total: se nenhum dos dois funcionar, devolve a URL original.
 */
export function useSignedUrl(
  bucket: Bucket,
  storagePath?: string | null,
  publicUrl?: string | null,
  expiresIn = 3600
) {
  const [url, setUrl] = useState<string | null>(publicUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const path = storagePath || extractStoragePath(publicUrl, bucket);

    if (!path) {
      setUrl(publicUrl ?? null);
      return;
    }

    setLoading(true);
    getSecureFileUrl({ bucket, storagePath: path, fallbackUrl: publicUrl, expiresIn })
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bucket, storagePath, publicUrl, expiresIn]);

  return { url, loading };
}
