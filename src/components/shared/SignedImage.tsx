import { ImgHTMLAttributes, ReactNode, useEffect, useMemo, useState } from "react";
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
  const signedExpiresIn = useMemo(() => expiresIn ?? 3600, [expiresIn]);
  const { url, loading, error } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  useEffect(() => {
    setReloadToken(0);
    setImageFailed(false);
  }, [url]);
  const placeholder = (
    <div
      className={
        (className || "") +
        " flex flex-col items-center justify-center bg-muted text-muted-foreground text-[10px] gap-1 p-1"
      }
      title={error || imageFailed ? `Imagem indisponível (${error || "load_failed"})` : `Carregando imagem segura (${signedExpiresIn}s)...`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageOff className="w-3 h-3" />}
      <span>{loading ? "..." : "indisponível"}</span>
    </div>
  );
  if (url) {
    if (imageFailed) return fallback ? <>{fallback}</> : placeholder;
    return (
      <img
        src={reloadToken ? `${url}${url.includes("?") ? "&" : "?"}r=${reloadToken}` : url}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={() => setReloadToken((v) => {
          if (v >= 2) {
            setImageFailed(true);
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
