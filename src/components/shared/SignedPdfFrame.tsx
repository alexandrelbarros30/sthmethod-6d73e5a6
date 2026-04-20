import { useSignedUrl } from "@/hooks/useSignedUrl";
import { ReactNode } from "react";

interface Props {
  bucket: "body-images" | "documents";
  storagePath?: string | null;
  publicUrl?: string | null;
  className?: string;
  title?: string;
  expiresIn?: number;
  fallback?: ReactNode;
}

/**
 * Iframe que carrega um PDF via signed URL (para buckets privados).
 */
export const SignedPdfFrame = ({
  bucket,
  storagePath,
  publicUrl,
  className,
  title = "PDF",
  expiresIn,
  fallback,
}: Props) => {
  const { url, loading } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  if (loading && !url) {
    return <div className={className} aria-busy="true" />;
  }
  if (!url) return <>{fallback ?? null}</>;
  return <iframe src={url} className={className} title={title} />;
};

export default SignedPdfFrame;
