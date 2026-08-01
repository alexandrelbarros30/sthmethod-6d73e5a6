import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HealthDay {
  id: string;
  day: string;
  steps: number | null;
  active_kcal: number | null;
  sleep_minutes: number | null;
  resting_hr: number | null;
  weight_kg: number | null;
  provider: string;
}

export interface HealthSource {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
}

export const HEALTH_PROVIDERS = [
  { id: "apple_health", label: "Apple Saúde", hint: "iPhone e Apple Watch", icon: "" },
  { id: "google_fit", label: "Google Fit / Health Connect", hint: "Android e Wear OS", icon: "🤖" },
  { id: "garmin", label: "Garmin Connect", hint: "Relógios Garmin", icon: "⌚" },
  { id: "manual", label: "Registro manual", hint: "Você digita seus dados", icon: "✍️" },
] as const;

export function useAiHealth() {
  const { user } = useAuth();
  const [days, setDays] = useState<HealthDay[]>([]);
  const [sources, setSources] = useState<HealthSource[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase
        .from("ai_app_health_days")
        .select("id, day, steps, active_kcal, sleep_minutes, resting_hr, weight_kg, provider")
        .eq("user_id", user.id)
        .order("day", { ascending: false })
        .limit(60),
      supabase
        .from("ai_app_health_sources")
        .select("id, provider, status, last_sync_at")
        .eq("user_id", user.id),
    ]);
    setDays((d ?? []) as HealthDay[]);
    setSources((s ?? []) as HealthSource[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(
    async (provider: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("ai_app_health_sources")
        .upsert(
          { user_id: user.id, provider, status: "connected", last_sync_at: new Date().toISOString() },
          { onConflict: "user_id,provider" },
        );
      if (error) throw error;
      await refresh();
    },
    [user?.id, refresh],
  );

  const disconnect = useCallback(
    async (provider: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("ai_app_health_sources")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider);
      if (error) throw error;
      await refresh();
    },
    [user?.id, refresh],
  );

  const saveDay = useCallback(
    async (row: Partial<HealthDay> & { day: string }) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("ai_app_health_days")
        .upsert({ ...row, user_id: user.id, provider: row.provider ?? "manual" }, { onConflict: "user_id,day" });
      if (error) throw error;
      await refresh();
    },
    [user?.id, refresh],
  );

  const importRows = useCallback(
    async (rows: (Partial<HealthDay> & { day: string })[], provider: string) => {
      if (!user?.id || rows.length === 0) return 0;
      const payload = rows.map((r) => ({ ...r, user_id: user.id, provider }));
      const { error } = await supabase.from("ai_app_health_days").upsert(payload, { onConflict: "user_id,day" });
      if (error) throw error;
      await supabase
        .from("ai_app_health_sources")
        .upsert(
          { user_id: user.id, provider, status: "connected", last_sync_at: new Date().toISOString() },
          { onConflict: "user_id,provider" },
        );
      await refresh();
      return rows.length;
    },
    [user?.id, refresh],
  );

  return { user, loading, days, sources, refresh, connect, disconnect, saveDay, importRows };
}

/** Converte CSV simples em linhas de saúde. Cabeçalho aceito: day,steps,active_kcal,sleep_minutes,resting_hr,weight_kg */
export function parseHealthCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const header = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const num = (v?: string) => {
    const n = Number((v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) && (v ?? "").trim() !== "" ? n : null;
  };
  const out: (Partial<HealthDay> & { day: string })[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(/[,;]/);
    const rawDay = (cols[idx("day") >= 0 ? idx("day") : 0] ?? "").trim();
    const day = /^\d{4}-\d{2}-\d{2}$/.test(rawDay) ? rawDay : null;
    if (!day) continue;
    out.push({
      day,
      steps: idx("steps") >= 0 ? (num(cols[idx("steps")]) as number | null) : null,
      active_kcal: idx("active_kcal") >= 0 ? (num(cols[idx("active_kcal")]) as number | null) : null,
      sleep_minutes: idx("sleep_minutes") >= 0 ? (num(cols[idx("sleep_minutes")]) as number | null) : null,
      resting_hr: idx("resting_hr") >= 0 ? (num(cols[idx("resting_hr")]) as number | null) : null,
      weight_kg: idx("weight_kg") >= 0 ? (num(cols[idx("weight_kg")]) as number | null) : null,
    });
  }
  return out;
}
