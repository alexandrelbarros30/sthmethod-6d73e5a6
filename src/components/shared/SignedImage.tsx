import { ImgHTMLAttributes } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

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
  ...rest
}: Props) => {
  const { url } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  if (!url) return <>{fallback ?? null}</>;
  return <img src={url} alt={alt} {...rest} />;
};

export default SignedImage;
