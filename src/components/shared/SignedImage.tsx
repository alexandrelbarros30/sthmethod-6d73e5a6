import { ImgHTMLAttributes, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ImageOff, Loader2 } from "lucide-react";

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
  ...rest
}: Props) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);
  const signedExpiresIn = useMemo(() => expiresIn ?? 3600, [expiresIn]);
  const { url, loading, error } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  useEffect(() => {
    setReloadToken(0);
    setImageFailed(false);
    setConverting(false);
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
    if (converting || convertedUrl) return;
    setConverting(true);
    try {
      const res = await fetch(signedUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("download_failed");
      const blob = await res.blob();
      let objectUrl = URL.createObjectURL(blob);
      try {
        await new Promise<void>((resolve, reject) => {
          const probe = new Image();
          probe.onload = () => resolve();
          probe.onerror = () => reject(new Error("blob_decode_failed"));
          probe.src = objectUrl;
        });
      } catch {
        URL.revokeObjectURL(objectUrl);
        const { default: heic2any } = await import("heic2any");
        const result = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
        const jpeg = Array.isArray(result) ? result[0] : result;
        objectUrl = URL.createObjectURL(jpeg);
      }
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = objectUrl;
      setConvertedUrl(objectUrl);
      setImageFailed(false);
    } catch (err) {
      console.warn("[SignedImage] secure image conversion failed", err);
      setImageFailed(true);
    } finally {
      setConverting(false);
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
        onError={() => setReloadToken((v) => {
          if (v >= 1) {
            void resolveBlobImage(url);
            return v;
          }
          return v + 1;
        })}
        {...rest}
      />
    );
  }
  if (fallback && !loading && error) return <>{fallback}</>;
  return placeholder;
};

export default SignedImage;
