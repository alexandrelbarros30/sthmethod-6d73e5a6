import { ImgHTMLAttributes } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ImageOff, Loader2 } from "lucide-react";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  bucket: "body-images" | "documents";
  storagePath?: string | null;
  publicUrl?: string | null;
  expiresIn?: number;
  fallback?: React.ReactNode;
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
  const { url, loading, error } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  if (url) return <img src={url} alt={alt} className={className} {...rest} />;
  if (fallback) return <>{fallback}</>;
  return (
    <div
      className={
        (className || "") +
        " flex flex-col items-center justify-center bg-muted text-muted-foreground text-[10px] gap-1 p-1"
      }
      title={error ? `Imagem indisponível (${error})` : "Carregando imagem..."}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageOff className="w-3 h-3" />}
      <span>{loading ? "..." : "indisponível"}</span>
    </div>
  );
};

export default SignedImage;
