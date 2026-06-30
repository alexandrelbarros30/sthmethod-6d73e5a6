import { useEffect, useState } from "react";
import { extractStoragePath, getSecureFileUrl, isStorageObjectUrl } from "@/lib/secure-file-url";

type Bucket = "body-images" | "documents";

/**
 * Hook que resolve uma URL segura (signed URL) a partir de um `storage_path`
 * ou, como fallback, extrai o path de uma URL pública antiga.
 *
 * Mantém compatibilidade com URLs externas, mas nunca renderiza URL pública antiga
 * de bucket privado como fallback, pois isso gera ícone de imagem quebrada.
 */
export function useSignedUrl(
  bucket: Bucket,
  storagePath?: string | null,
  publicUrl?: string | null,
  expiresIn = 3600
) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = storagePath || extractStoragePath(publicUrl, bucket);

    if (!path) {
      setUrl(publicUrl && !isStorageObjectUrl(publicUrl) ? publicUrl : null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    (async () => {
      let signedUrl: string | null = null;
      try {
        signedUrl = await getSecureFileUrl({ bucket, storagePath: path, fallbackUrl: publicUrl, expiresIn });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "sign_failed");
      }
      if (cancelled) return;
      if (signedUrl) {
        setUrl(signedUrl);
      } else {
        setUrl(null);
        setError("not_found");
        if (typeof console !== "undefined") {
          console.warn("[useSignedUrl] failed to sign", { bucket, path });
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bucket, storagePath, publicUrl, expiresIn]);

  return { url, loading, error };
}
