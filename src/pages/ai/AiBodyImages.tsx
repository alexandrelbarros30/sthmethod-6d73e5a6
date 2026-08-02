import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import BodyImageUpload from "@/components/shared/BodyImageUpload";
import EvolutionImageHistory from "@/components/student/EvolutionImageHistory";
import { Camera, Loader2, Sparkles } from "lucide-react";

interface BodyImage {
  id: string;
  type: string;
  image_url: string;
  storage_path?: string | null;
  is_current: boolean;
  uploaded_at: string;
}

export default function AiBodyImages() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<BodyImage[]>([]);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("body_images")
      .select("id, type, image_url, storage_path, is_current, uploaded_at")
      .eq("user_id", uid)
      .order("uploaded_at", { ascending: false });
    setImages((data as BodyImage[]) ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        navigate("/ai/login?next=/ai/app/imagens");
        return;
      }
      setUserId(session.user.id);
      await load(session.user.id);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [navigate, load]);

  if (loading || !userId) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const current = images.filter((i) => i.is_current);
  const isFirstTime = images.length === 0;

  return (
    <AiShell
      title="Imagens corporais"
      subtitle="Registre suas fotos para comparação de evolução ao longo dos ciclos."
    >
      {isFirstTime && (
        <Card className="mb-4 flex items-start gap-3 border-primary/30 bg-primary/5 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Primeiro registro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie suas fotos de frente, costas e lado agora. Elas ficam guardadas com segurança e serão a base
              de comparação da sua evolução nos próximos ciclos.
            </p>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{isFirstTime ? "Enviar fotos iniciais" : "Atualizar fotos"}</h2>
        </div>
        <BodyImageUpload
          userId={userId}
          existingImages={current.map((i) => ({ id: i.id, type: i.type, image_url: i.image_url, storage_path: i.storage_path }))}
          draftKey={`ai-body-images-${userId}`}
          uploadButtonLabel={isFirstTime ? "Enviar fotos" : "Salvar novas fotos"}
          confirmBeforeUpload
          canDeleteExisting={false}
          onComplete={() => load(userId)}
        />
      </Card>

      {images.length > 0 && (
        <div className="mt-4">
          <EvolutionImageHistory allImages={images} />
        </div>
      )}
    </AiShell>
  );
}
