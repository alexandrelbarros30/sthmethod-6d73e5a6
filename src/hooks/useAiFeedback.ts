import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AiKind } from "@/hooks/useAiApp";

export interface AiFeedback {
  id: string;
  generation_id: string | null;
  kind: AiKind;
  rating: number;
  difficulty: number | null;
  energy: number | null;
  adherence_pct: number | null;
  worked: string[];
  blocked: string[];
  comment: string | null;
  created_at: string;
}

export interface AiFeedbackInput {
  generation_id: string | null;
  kind: AiKind;
  rating: number;
  difficulty?: number | null;
  energy?: number | null;
  adherence_pct?: number | null;
  worked?: string[];
  blocked?: string[];
  comment?: string | null;
}

/** Tags estruturadas — vocabulário fechado para a IA conseguir aprender padrões. */
export const FEEDBACK_TAGS: Record<AiKind, { worked: string[]; blocked: string[] }> = {
  diet: {
    worked: ["Saciedade boa", "Fácil de preparar", "Sabor agradável", "Encaixou na rotina", "Digestão tranquila", "Custo viável"],
    blocked: ["Muita fome", "Tempo de preparo", "Custo alto", "Enjoou dos alimentos", "Desconforto digestivo", "Rotina atrapalhou"],
  },
  workout: {
    worked: ["Boa conexão muscular", "Duração adequada", "Progrediu nas cargas", "Recuperação boa", "Motivação alta", "Equipamentos disponíveis"],
    blocked: ["Treino muito longo", "Volume excessivo", "Dor articular", "Faltou equipamento", "Cansaço/recuperação ruim", "Falta de tempo"],
  },
  analysis: {
    worked: ["Clareza das orientações", "Metas realistas", "Ajudou na decisão", "Linguagem compreensível"],
    blocked: ["Muito genérico", "Metas difíceis", "Faltou detalhe", "Não refletiu minha realidade"],
  },
};

export function useAiFeedback(kind?: AiKind) {
  const { user } = useAuth();
  const [items, setItems] = useState<AiFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("ai_app_feedback")
      .select("id, generation_id, kind, rating, difficulty, energy, adherence_pct, worked, blocked, comment, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (kind) q = q.eq("kind", kind);
    const { data } = await q;
    setItems(((data ?? []) as unknown) as AiFeedback[]);
    setLoading(false);
  }, [user?.id, kind]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (input: AiFeedbackInput) => {
      if (!user?.id) throw new Error("Sessão expirada.");
      const { error } = await supabase.from("ai_app_feedback").insert({
        user_id: user.id,
        generation_id: input.generation_id,
        kind: input.kind,
        rating: input.rating,
        difficulty: input.difficulty ?? null,
        energy: input.energy ?? null,
        adherence_pct: input.adherence_pct ?? null,
        worked: input.worked ?? [],
        blocked: input.blocked ?? [],
        comment: input.comment?.trim() ? input.comment.trim().slice(0, 800) : null,
      });
      if (error) throw error;
      await refresh();
    },
    [user?.id, refresh],
  );

  return { items, loading, refresh, submit };
}

export function feedbackForGeneration(items: AiFeedback[], generationId?: string | null) {
  if (!generationId) return null;
  return items.find((f) => f.generation_id === generationId) ?? null;
}
