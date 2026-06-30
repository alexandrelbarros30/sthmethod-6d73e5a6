import { useEffect, useState } from "react";
import { extractStoragePath } from "@/lib/secure-file-url";
import { supabase } from "@/integrations/supabase/client";

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
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path = storagePath || extractStoragePath(publicUrl, bucket);

    if (!path) {
      setUrl(publicUrl ?? null);
      return;
    }

    const sign = async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      return { data, error };
    };

    setLoading(true);
    setError(null);
    (async () => {
      let res = await sign();
      // Retry once after refreshing the auth session — handles stale tokens
      // on long PWA sessions where storage RLS denies and returns 404.
      if (res.error || !res.data?.signedUrl) {
        try { await supabase.auth.refreshSession(); } catch {}
        res = await sign();
      }
      if (cancelled) return;
      if (res.data?.signedUrl) {
        setUrl(res.data.signedUrl);
      } else {
        // Do NOT fall back to the (now private) public URL — it would render
        // as a broken image. Surface null so callers can show a placeholder.
        setUrl(null);
        setError(res.error?.message || "not_found");
        if (typeof console !== "undefined") {
          console.warn("[useSignedUrl] failed to sign", { bucket, path, error: res.error });
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
