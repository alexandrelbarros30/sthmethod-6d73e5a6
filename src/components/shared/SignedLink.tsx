import { ReactNode } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface Props {
  bucket: "body-images" | "documents";
  storagePath?: string | null;
  publicUrl?: string | null;
  className?: string;
  children: ReactNode;
  expiresIn?: number;
  download?: string;
}

/**
 * Anchor que abre/baixa um arquivo via signed URL (para buckets privados).
 */
export const SignedLink = ({
  bucket,
  storagePath,
  publicUrl,
  className,
  children,
  expiresIn,
  download,
}: Props) => {
  const { url } = useSignedUrl(bucket, storagePath, publicUrl, expiresIn);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} download={download}>
      {children}
    </a>
  );
};

export default SignedLink;
