import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AiOffer {
  id: string;
  kind: "upgrade" | "winback" | "renewal" | "trial" | string;
  plan: string;
  discount_pct: number;
  reason: string | null;
  status: string;
  expires_at: string;
}

export interface AiInsightSignals {
  streak?: number;
  adherence7?: number;
  adherence14?: number;
  diet_days_14?: number;
  workout_days_14?: number;
  mood_avg_14?: number | null;
  weight_kg_per_week?: number | null;
  waist_cm_per_week?: number | null;
  plateau?: boolean;
  current_weight?: number | null;
  projection_30d?: number | null;
  measurements_count?: number;
}

export interface AiInsight {
  id: string;
  kind: string;
  content: string;
  signals: AiInsightSignals;
  valid_until: string;
  created_at: string;
}

const OFFER_LABEL: Record<string, string> = {
  upgrade: "Upgrade recomendado",
  winback: "Bem-vindo de volta",
  renewal: "Renovação antecipada",
  trial: "Primeira ativação",
};

export function offerLabel(kind: string) {
  return OFFER_LABEL[kind] ?? "Oferta personalizada";
}

/** Fase 7 — oferta personalizada calculada no servidor a partir do uso real. */
export function useAiOffer() {
  const { user } = useAuth();
  const [offer, setOffer] = useState<AiOffer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-growth", { body: { action: "offers" } });
      if (error) throw error;
      setOffer(((data as any)?.offer as AiOffer) ?? null);
    } catch {
      setOffer(null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = useCallback(async () => {
    if (!offer) return;
    setOffer(null);
    await supabase.from("ai_app_offers").update({ status: "dismissed" }).eq("id", offer.id);
  }, [offer]);

  return { offer, loading, reload: load, dismiss };
}

/** Fase 8 — leitura preditiva (platô, tendência e ajustes sugeridos). */
export function useAiInsight() {
  const { user } = useAuth();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase.functions.invoke("sth-ai-growth", {
          body: { action: "insights", force },
        });
        if (err) throw err;
        if ((data as any)?.error) throw new Error((data as any).error);
        setInsight(((data as any)?.insight as AiInsight) ?? null);
      } catch (e) {
        setError((e as Error)?.message || "Não foi possível gerar a leitura preditiva.");
      }
      setLoading(false);
    },
    [user?.id],
  );

  const loadCached = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("ai_app_insights")
      .select("id, kind, content, signals, valid_until, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setInsight(data as unknown as AiInsight);
  }, [user?.id]);

  useEffect(() => {
    loadCached();
  }, [loadCached]);

  return { insight, loading, error, generate: load };
}
