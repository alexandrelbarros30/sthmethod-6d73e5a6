import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AiKind = "diet" | "workout" | "analysis";

export interface AiProfile {
  user_id: string;
  full_name: string | null;
  age: number | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  training_level: string | null;
  answers: Record<string, unknown>;
  step: number;
  phase1_complete: boolean;
  phase2_complete: boolean;
}

export interface AiSubscription {
  id: string;
  plan: string;
  status: string;
  expires_at: string | null;
}

export interface AiGeneration {
  id: string;
  kind: AiKind;
  content: string;
  revisions: number;
  cycle_start: string;
  created_at: string;
  updated_at: string;
}

export const AI_PLANS = [
  { id: "mensal", label: "Mensal", price: "R$ 39,90", note: "cobrado todo mês" },
  { id: "trimestral", label: "Trimestral", price: "R$ 99,90", note: "ciclo biológico completo" },
  { id: "semestral", label: "Semestral", price: "R$ 179,90", note: "6 meses de evolução" },
  { id: "anual", label: "Anual", price: "R$ 299,90", note: "melhor custo por mês" },
] as const;

export const AI_MODULES: Record<AiKind, { title: string; short: string; cycleDays: number; icon: string }> = {
  diet: { title: "Cardápio Inteligente", short: "Planejamento alimentar de 30 dias", cycleDays: 30, icon: "🥗" },
  workout: { title: "Treino Inteligente", short: "Programa periodizado de 30 dias", cycleDays: 30, icon: "🏋️" },
  analysis: { title: "Central de Análise", short: "Relatório de evolução a cada 60 dias", cycleDays: 60, icon: "🧠" },
};

export function useAiApp() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AiProfile | null>(null);
  const [subscription, setSubscription] = useState<AiSubscription | null>(null);
  const [generations, setGenerations] = useState<AiGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: s }, { data: g }] = await Promise.all([
      supabase.from("ai_app_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("ai_app_subscriptions")
        .select("id, plan, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_app_generations")
        .select("id, kind, content, revisions, cycle_start, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setProfile((p as unknown as AiProfile) ?? null);
    const active = s && s.expires_at && new Date(s.expires_at) > new Date() ? (s as AiSubscription) : null;
    setSubscription(active);
    setGenerations(((g ?? []) as unknown) as AiGeneration[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, profile, subscription, generations, loading, refresh, setProfile };
}

export function latestOf(generations: AiGeneration[], kind: AiKind) {
  return generations.find((g) => g.kind === kind) ?? null;
}

export function daysLeftInCycle(gen: AiGeneration | null, cycleDays: number) {
  if (!gen) return 0;
  const start = new Date(`${gen.cycle_start}T00:00:00`);
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.max(0, cycleDays - elapsed);
}