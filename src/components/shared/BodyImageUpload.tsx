import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processAndUpload, validateImageFile } from "@/lib/image-upload";

interface BodyImageUploadProps {
  userId: string;
  existingImages?: { type: string; image_url: string; id: string }[];
  onComplete: () => void;
  required?: boolean;
  canDeleteExisting?: boolean;
}

const IMAGE_TYPES = [
  { key: "front", label: "Frente", icon: "🧍" },
  { key: "back", label: "Costas", icon: "🔙" },
  { key: "profile", label: "Perfil", icon: "👤" },
] as const;

const BodyImageUpload = ({ userId, existingImages = [], onComplete, required = false, canDeleteExisting = true }: BodyImageUploadProps) => {
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
    e.target.value = "";
    if (!file) return;

    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }

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
      await supabase.from("body_images").update({ is_current: false }).eq("user_id", userId).eq("is_current", true);

      for (const { key } of IMAGE_TYPES) {
        const img = images[key];
        if (img?.file) {
          toast.info(`Enviando imagem: ${key}...`);
          const path = `${userId}/${key}_${Date.now()}.jpg`;
          const publicUrl = await processAndUpload(img.file, "body-images", path);

          const { error } = await supabase.from("body_images").insert({
            user_id: userId,
            type: key,
            image_url: publicUrl,
            is_current: true,
          });
          if (error) throw error;
        } else if (img?.url) {
          const existing = existingImages.find((i) => i.type === key);
          if (existing) {
            await supabase.from("body_images").update({ is_current: true }).eq("id", existing.id);
          }
        }
      }

      toast.success("Imagens salvas com sucesso!");
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
                      {(img?.file || canDeleteExisting) && (
                        <button
                          className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full text-white hover:bg-destructive"
                          onClick={(e) => { e.stopPropagation(); removeImage(key); }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
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
