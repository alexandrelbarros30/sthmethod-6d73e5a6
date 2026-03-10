import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload, X, CheckCircle2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminBodyImageUploadProps {
  userId: string;
  onComplete: () => void;
}

const IMAGE_TYPES = [
  { key: "front", label: "Frente", icon: "🧍" },
  { key: "back", label: "Costas", icon: "🔙" },
  { key: "profile", label: "Perfil", icon: "👤" },
] as const;

const MAX_SIZE_MB = 2;
const MAX_DIMENSION = 1200;

async function compressImage(file: File, maxSizeMB = MAX_SIZE_MB, maxDim = MAX_DIMENSION): Promise<Blob> {
  let width: number, height: number;
  let drawSource: ImageBitmap | HTMLImageElement;

  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    drawSource = bitmap;
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Formato de imagem não suportado."));
        i.src = objectUrl;
      });
      width = img.width;
      height = img.height;
      drawSource = img;
    } catch (e) {
      URL.revokeObjectURL(objectUrl);
      throw e;
    }
    URL.revokeObjectURL(objectUrl);
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

async function uploadWithRetry(bucket: string, path: string, blob: Blob, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (!error) return;
    if (attempt === retries) throw error;
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

const AdminBodyImageUpload = ({ userId, onComplete }: AdminBodyImageUploadProps) => {
  const [images, setImages] = useState<Record<string, { file: File; preview: string }>>({});
  const [uploading, setUploading] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Default to current date/time in local timezone
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const defaultDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [customDateTime, setCustomDateTime] = useState(defaultDateTime);

  const handleFileSelect = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected
    e.target.value = "";
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/jpg", ""];
    const allowedExt = /\.(jpg|jpeg|png|webp|heic|heif)$/i;
    if (!allowedTypes.includes(file.type) && !allowedExt.test(file.name)) {
      toast.error("Apenas arquivos de imagem são aceitos (JPG, PNG).");
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
    if (images[type]?.preview) URL.revokeObjectURL(images[type].preview);
    setImages((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const hasAnyImage = Object.keys(images).length > 0;

  const handleUpload = async () => {
    if (!hasAnyImage) {
      toast.error("Selecione ao menos uma imagem para adicionar.");
      return;
    }

    setUploading(true);
    try {
      const uploadedAt = new Date(customDateTime).toISOString();

      for (const { key } of IMAGE_TYPES) {
        const img = images[key];
        if (!img?.file) continue;

        const compressed = await compressImage(img.file);
        const path = `${userId}/${key}_${Date.now()}.jpg`;
        await uploadWithRetry("body-images", path, compressed);
        const { data: urlData } = supabase.storage.from("body-images").getPublicUrl(path);

        await supabase.from("body_images").insert({
          user_id: userId,
          type: key,
          image_url: urlData.publicUrl,
          is_current: false,
          uploaded_at: uploadedAt,
        });
      }

      toast.success("Imagens adicionadas à galeria!");
      setImages({});
      onComplete();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar imagens: " + (err.message || "Tente novamente."));
    }
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Camera className="w-4 h-4" /> Adicionar Imagens à Galeria
        </CardTitle>
        <p className="text-xs text-muted-foreground">As imagens serão adicionadas sem substituir as existentes.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Editable date/time */}
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
          <Label className="text-xs whitespace-nowrap">Data/Hora:</Label>
          <Input
            type="datetime-local"
            value={customDateTime}
            onChange={(e) => setCustomDateTime(e.target.value)}
            className="h-8 text-xs max-w-[220px]"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {IMAGE_TYPES.map(({ key, label, icon }) => {
            const img = images[key];
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-body flex items-center gap-1">
                  <span>{icon}</span> {label}
                </Label>
                <div
                  className={`relative aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                    img ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/50 bg-muted/30"
                  }`}
                  onClick={() => fileRefs.current[key]?.click()}
                >
                  {img ? (
                    <>
                      <img src={img.preview} alt={label} className="w-full h-full object-cover" />
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
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px]">Opcional</span>
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

        <Button className="w-full" size="sm" onClick={handleUpload} disabled={uploading || !hasAnyImage}>
          {uploading ? "Enviando..." : "Adicionar à Galeria"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminBodyImageUpload;
