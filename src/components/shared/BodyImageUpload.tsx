import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";
import SignedImage from "@/components/shared/SignedImage";
import { notifyStudentSelfUpdate } from "@/lib/notify-student-self-update";
import { clearFileDrafts, loadFileDrafts, saveFileDrafts } from "@/lib/file-draft-storage";
import { createDisplayableImageObjectUrl } from "@/lib/displayable-image";

interface BodyImageUploadProps {
  userId: string;
  existingImages?: { type: string; image_url: string; id: string; storage_path?: string | null }[];
  onComplete: () => void;
  required?: boolean;
  canDeleteExisting?: boolean;
  draftKey?: string;
}

const IMAGE_TYPES = [
  { key: "front", label: "Frente", icon: "🧍" },
  { key: "back", label: "Costas", icon: "🔙" },
  { key: "profile", label: "Lado", icon: "👤" },
] as const;

const BodyImageUpload = ({ userId, existingImages = [], onComplete, required = false, canDeleteExisting = true, draftKey }: BodyImageUploadProps) => {
  const [images, setImages] = useState<Record<string, { file?: File; preview?: string; url?: string; storagePath?: string | null }>>(() => {
    const initial: Record<string, any> = {};
    IMAGE_TYPES.forEach(({ key }) => {
      const existing = existingImages.find((i) => i.type === key);
      if (existing) initial[key] = { url: existing.image_url, storagePath: existing.storage_path };
    });
    return initial;
  });
  const [uploading, setUploading] = useState(false);
  const [draftReady, setDraftReady] = useState(!draftKey);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;

    if (!draftKey) {
      setDraftReady(true);
      return;
    }

    setDraftReady(false);
    loadFileDrafts(draftKey)
      .then((files) => {
        if (cancelled) return;
        const restored = Object.entries(files).reduce<Record<string, { file: File; preview: string }>>((acc, [type, file]) => {
          acc[type] = { file, preview: URL.createObjectURL(file) };
          return acc;
        }, {});
        if (Object.keys(restored).length > 0) {
          setImages((prev) => ({ ...prev, ...restored }));
        }
      })
      .catch((err) => console.warn("[body-upload-draft] restore failed", err))
      .finally(() => {
        if (!cancelled) setDraftReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftReady) return;
    const files = Object.fromEntries(
      IMAGE_TYPES.flatMap(({ key }) => (images[key]?.file ? [[key, images[key].file as File]] : []))
    );
    saveFileDrafts(draftKey, files).catch((err) => console.warn("[body-upload-draft] save failed", err));
  }, [draftKey, draftReady, images]);

  useEffect(() => {
    return () => {
      Object.values(images).forEach((img) => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const handleFileSelect = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }

    const preview = URL.createObjectURL(file);
    setImages((prev) => ({ ...prev, [type]: { file, preview } }));
    createDisplayableImageObjectUrl(file, file.name)
      .then((displayPreview) => {
        URL.revokeObjectURL(preview);
        setImages((prev) => ({ ...prev, [type]: { file, preview: displayPreview } }));
      })
      .catch(() => {});
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
  const hasAnyNew = IMAGE_TYPES.some(({ key }) => images[key]?.file);

  const handleUpload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    if (required && !allUploaded) {
      toast.error("Envie as 3 imagens obrigatórias.");
      return;
    }

    if (!hasAnyNew) {
      toast.info("Nenhuma imagem nova selecionada.");
      return;
    }

    setUploading(true);
    try {
      // Upload new images WITHOUT deleting previous ones
      // Old images are sempre preservadas no histórico
      const uploadedImages: Record<string, { url: string; storagePath: string | null }> = {};
      for (const { key } of IMAGE_TYPES) {
        const img = images[key];
        if (img?.file) {
          // Mark only this type as not current before inserting new
          await supabase.from("body_images").update({ is_current: false })
            .eq("user_id", userId).eq("type", key).eq("is_current", true);

          toast.info(`Enviando imagem: ${key}...`);
          const path = `${userId}/${key}_${Date.now()}.jpg`;
          const publicUrl = await processAndUpload(img.file, "body-images", path);
          uploadedImages[key] = { url: publicUrl, storagePath: path };

          const { error } = await supabase.from("body_images").insert({
            user_id: userId,
            type: key,
            image_url: publicUrl,
            storage_path: path,
            is_current: true,
          });
          if (error) throw error;
        }
        // Existing images that weren't replaced keep their is_current status
      }

      if (draftKey) await clearFileDrafts(draftKey);
      setImages((prev) => {
        const next = { ...prev };
        Object.entries(uploadedImages).forEach(([key, uploaded]) => {
          if (next[key]?.preview) URL.revokeObjectURL(next[key].preview!);
          next[key] = { url: uploaded.url, storagePath: uploaded.storagePath };
        });
        return next;
      });
      toast.success("Imagens salvas! As anteriores foram preservadas no histórico.");
      void notifyStudentSelfUpdate(userId, "photos");
      onComplete();
    } catch (err: any) {
      console.error("[body-upload] Error:", err);
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
            const localSrc = img?.preview;
            const hasExisting = !localSrc && (img?.url || img?.storagePath);

            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-body flex items-center gap-1">
                  <span>{icon}</span> {label}
                </Label>
                <div
                  className={`relative aspect-[3/4] rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
                    (localSrc || hasExisting) ? "border-foreground/20 bg-foreground/5" : "border-border hover:border-foreground/50 bg-muted/30"
                  }`}
                  onClick={() => fileRefs.current[key]?.click()}
                >
                  {localSrc ? (
                    <>
                      <img src={localSrc} alt={label} className="w-full h-full object-cover" />
                      {(img?.file || canDeleteExisting) && (
                        <button
                          className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                          onClick={(e) => { e.stopPropagation(); removeImage(key); }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="absolute bottom-1 left-1">
                        <CheckCircle2 className="w-4 h-4 text-foreground" />
                      </div>
                    </>
                  ) : hasExisting ? (
                    <>
                      <SignedImage
                        bucket="body-images"
                        storagePath={img?.storagePath}
                        publicUrl={img?.url}
                        alt={label}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="w-6 h-6" />
                            <span className="text-xs">Substituir</span>
                          </div>
                        }
                      />
                      {(img?.file || canDeleteExisting) && (
                        <button
                          className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                          onClick={(e) => { e.stopPropagation(); removeImage(key); }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="absolute bottom-1 left-1">
                        <CheckCircle2 className="w-4 h-4 text-foreground" />
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

        <p className="text-xs text-muted-foreground mt-3 text-center">
          📂 As imagens anteriores são sempre preservadas no histórico.
        </p>
        <Button className="w-full mt-2" onClick={handleUpload} disabled={uploading || (required && !allUploaded) || (!required && !hasAnyNew)}>
          {uploading ? "Enviando..." : "Salvar Imagens"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BodyImageUpload;
