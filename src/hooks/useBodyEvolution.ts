import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BodyImage {
  id: string;
  url: string;
  angle: "front" | "side" | "back";
  weight_kg: number | null;
  created_at: string;
}

export function useBodyEvolution() {
  const { user } = useAuth();
  const [images, setImages] = useState<BodyImage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    // As imagens corporais no STH Method são armazenadas na tabela student_body_images
    // vinculada ao perfil do aluno.
    const { data, error } = await supabase
      .from("student_body_images")
      .select("id, image_url, angle, weight_at_time, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setImages(data.map(img => ({
        id: img.id,
        url: img.image_url,
        angle: img.angle as any,
        weight_kg: img.weight_at_time,
        created_at: img.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  return { images, loading, refresh };
}
