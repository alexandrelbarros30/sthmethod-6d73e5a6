import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BodyImageUploadProps {
  userId: string;
  existingImages?: { type: string; image_url: string; id: string }[];
  onComplete: () => void;
  required?: boolean;
}

const IMAGE_TYPES = [
  { key: "front", label: "Frente", icon: "🧍" },
  { key: "back", label: "Costas", icon: "🔙" },
  { key: "profile", label: "Perfil", icon: "👤" },
] as const;

const MAX_SIZE_MB = 2; // Compress to max 2MB for reliable mobile uploads
const MAX_DIMENSION = 1200;

/**
 * Compress an image file using canvas.
 * Returns a Blob (JPEG) that is <= maxSizeMB.
 */
async function compressImage(file: File, maxSizeMB = MAX_SIZE_MB, maxDim = MAX_DIMENSION): Promise<Blob> {
  // Try createImageBitmap first (faster, better mobile support), fallback to FileReader+Image
  let width: number, height: number;
  let drawSource: ImageBitmap | HTMLImageElement;

  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    drawSource = bitmap;
  } catch {
    // Fallback: FileReader → data URL → Image
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Formato de imagem não suportado. Use JPG ou PNG."));
      i.src = dataUrl;
    });
    width = img.width;
    height = img.height;
    drawSource = img;
  }

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(drawSource, 0, 0, width, height);

  // Close bitmap to free memory
  if ("close" in drawSource) (drawSource as ImageBitmap).close();

  return new Promise((resolve, reject) => {
    let quality = 0.85;
    const tryCompress = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Falha ao comprimir imagem"));
          if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
            quality -= 0.15;
            tryCompress();
          } else {
            resolve(blob);
          }
        },
        "image/jpeg",
        quality,
      );
    };
    tryCompress();
  });
}

/**
 * Upload with retry logic for flaky mobile connections.
 */
async function uploadWithRetry(
  bucket: string,
  path: string,
  blob: Blob,
  retries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (!error) return;
    console.warn(`Upload attempt ${attempt} failed:`, error.message);
    if (attempt === retries) throw error;
    // Wait before retry (exponential backoff)
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

const BodyImageUpload = ({ userId, existingImages = [], onComplete, required = false }: BodyImageUploadProps) => {
  const [images, setImages] = useState<Record<string, { file?: File; preview?: string; url?: string }>>(() => {
    const initial: Record<string, any> = {};
    IMAGE_TYPES.forEach(({ key }) => {
      const existing = existingImages.find((i) => i.type === key);
      if (existing) initial[key] = { url: existing.image_url };
    });
    return initial;
  });
  const [uploading, setUploading] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type) && 
        !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      toast.error("Apenas arquivos de imagem são aceitos.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 15MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setImages((prev) => ({ ...prev, [type]: { file, preview } }));
  };

  const removeImage = (type: string) => {
    if (images[type]?.preview) URL.revokeObjectURL(images[type].preview!);
    setImages((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const allUploaded = IMAGE_TYPES.every(({ key }) => images[key]?.file || images[key]?.url);

  const handleUpload = async () => {
    // Verify authentication before upload
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    if (!allUploaded) {
      toast.error("Envie as 3 imagens obrigatórias.");
      return;
    }

    setUploading(true);
    try {
      // Mark old images as not current
      await supabase.from("body_images").update({ is_current: false }).eq("user_id", userId).eq("is_current", true);

      for (const { key } of IMAGE_TYPES) {
        const img = images[key];
        if (img?.file) {
          toast.info(`Comprimindo imagem: ${key}...`);
          const compressed = await compressImage(img.file);
          const path = `${userId}/${key}_${Date.now()}.jpg`;
          
          toast.info(`Enviando imagem: ${key}...`);
          await uploadWithRetry("body-images", path, compressed);
          
          const { data: urlData } = supabase.storage.from("body-images").getPublicUrl(path);

          await supabase.from("body_images").insert({
            user_id: userId,
            type: key,
            image_url: urlData.publicUrl,
            is_current: true,
          });
        } else if (img?.url) {
          // Re-mark existing as current
          const existing = existingImages.find((i) => i.type === key);
          if (existing) {
            await supabase.from("body_images").update({ is_current: true }).eq("id", existing.id);
          }
        }
      }

      toast.success("Imagens salvas com sucesso!");
      onComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar imagens: " + (err.message || "Verifique sua conexão e tente novamente."));
    }
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Camera className="w-4 h-4" /> Imagens Corporais {required && <span className="text-destructive">*</span>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Envie fotos de frente, costas e perfil (.jpg ou .png)</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {IMAGE_TYPES.map(({ key, label, icon }) => {
            const img = images[key];
            const src = img?.preview || img?.url;

            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-body flex items-center gap-1">
                  <span>{icon}</span> {label}
                </Label>
                <div
                  className={`relative aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                    src ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/50 bg-muted/30"
                  }`}
                  onClick={() => fileRefs.current[key]?.click()}
                >
                  {src ? (
                    <>
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                        onClick={(e) => { e.stopPropagation(); removeImage(key); }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Enviar</span>
                    </div>
                  )}
                  <input
                    ref={(el) => { fileRefs.current[key] = el; }}
                    type="file"
                    accept="image/*"
                    
                    className="hidden"
                    onChange={(e) => handleFileSelect(key, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button className="w-full mt-4" onClick={handleUpload} disabled={uploading || (required && !allUploaded)}>
          {uploading ? "Enviando..." : "Salvar Imagens"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BodyImageUpload;
