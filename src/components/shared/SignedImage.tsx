import { ImgHTMLAttributes, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ImageOff, Loader2 } from "lucide-react";
import { resolveDisplayableImageFromUrl } from "@/lib/displayable-image";
import { supabase } from "@/integrations/supabase/client";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  bucket: "body-images" | "documents";
  storagePath?: string | null;
  publicUrl?: string | null;
  expiresIn?: number;
  fallback?: ReactNode;
}

/**
 * Componente <img> que resolve automaticamente para signed URL
 * a partir do `storage_path` (ou da URL pública antiga, via extração).
 */
export const SignedImage = ({
  bucket,
  storagePath,
  publicUrl,
  expiresIn,
  fallback,
  alt = "",
  className,
  onLoad,
  onError,
  ...rest
}: Props) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);
  const nativeLoadedRef = useRef(false);
  const conversionInFlightRef = useRef(false);
  const conversionAttemptedRef = useRef(false);
  const activeUrlRef = useRef<string | null>(null);
  const signedExpiresIn = useMemo(() => expiresIn ?? 3600, [expiresIn]);
  const { url, loading, error } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  useEffect(() => {
    activeUrlRef.current = url;
    setReloadToken(0);
    setImageFailed(false);
    setConverting(false);
    nativeLoadedRef.current = false;
    conversionInFlightRef.current = false;
    conversionAttemptedRef.current = false;
    if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
    convertedUrlRef.current = null;
    setConvertedUrl(null);
  }, [url]);

  useEffect(() => {
    return () => {
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = null;
    };
  }, []);

  const resolveBlobImage = async (signedUrl: string) => {
    if (conversionInFlightRef.current || conversionAttemptedRef.current || convertedUrlRef.current) return;
    conversionInFlightRef.current = true;
    conversionAttemptedRef.current = true;
    setConverting(true);
    try {
      const result = await resolveDisplayableImageFromUrl(signedUrl);
      if (activeUrlRef.current !== signedUrl) {
        URL.revokeObjectURL(result.objectUrl);
        return;
      }
      const objectUrl = result.objectUrl;
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = objectUrl;
      setConvertedUrl(objectUrl);
      setImageFailed(false);

      if (result.converted && storagePath) {
        void supabase.storage.from(bucket).update(storagePath, result.blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        }).then(({ error }) => {
          if (error) console.warn("[SignedImage] auto-repair upload failed", error.message);
        });
      }
    } catch (err) {
      console.warn("[SignedImage] secure image conversion failed", err);
      setImageFailed(true);
    } finally {
      setConverting(false);
      conversionInFlightRef.current = false;
    }
  };

  const placeholder = (
    <div
      className={
        (className || "") +
        " flex flex-col items-center justify-center bg-muted text-muted-foreground text-[10px] gap-1 p-1"
      }
      title={error || imageFailed ? `Imagem indisponível (${error || "load_failed"})` : `Carregando imagem segura (${signedExpiresIn}s)...`}
    >
      {loading || converting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageOff className="w-3 h-3" />}
      <span>{loading || converting ? "..." : "indisponível"}</span>
    </div>
  );
  if (convertedUrl) {
    return <img src={convertedUrl} alt={alt} className={className} loading="lazy" decoding="async" {...rest} />;
  }
  if (url) {
    if (converting) return placeholder;
    if (imageFailed) return fallback ? <>{fallback}</> : placeholder;
    return (
      <img
        src={reloadToken ? `${url}${url.includes("?") ? "&" : "?"}r=${reloadToken}` : url}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onLoad={(event) => {
          nativeLoadedRef.current = true;
          onLoad?.(event);
        }}
        onError={(event) => {
          onError?.(event);
          if (reloadToken < 1) {
            setReloadToken((v) => Math.max(v + 1, 1));
            return;
          }
          void resolveBlobImage(url);
        }}
        {...rest}
      />
    );
  }
  if (fallback && !loading && error) return <>{fallback}</>;
  return placeholder;
};

export default SignedImage;
