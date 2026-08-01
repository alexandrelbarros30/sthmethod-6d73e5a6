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
  { id: "samsung_health", label: "Samsung Health (Galaxy Watch)", hint: "Galaxy Watch 4/5/6/7 e Ultra via Health Connect", icon: "⌚" },
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

/** Aliases de cabeçalho aceitos (inclui exportações do Samsung Health / Health Connect). */
const HEADER_ALIASES: Record<keyof Omit<HealthDay, "id" | "provider">, string[]> = {
  day: ["day", "date", "data", "start_time", "create_time", "com.samsung.health.step_count.create_time"],
  steps: ["steps", "passos", "step_count", "count", "com.samsung.health.step_count.count", "total_steps"],
  active_kcal: ["active_kcal", "calorie", "calories", "active_calorie", "com.samsung.health.step_count.calorie", "kcal"],
  sleep_minutes: ["sleep_minutes", "sleep", "sono", "duration_min", "com.samsung.health.sleep.duration"],
  resting_hr: ["resting_hr", "heart_rate", "fc", "com.samsung.health.heart_rate.heart_rate", "resting_heart_rate"],
  weight_kg: ["weight_kg", "weight", "peso", "com.samsung.health.weight.weight"],
};

/** Converte CSV simples em linhas de saúde. Cabeçalho aceito: day,steps,active_kcal,sleep_minutes,resting_hr,weight_kg */
export function parseHealthCsv(text: string) {
  let lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  // Samsung Health exporta uma primeira linha de metadados antes do cabeçalho real.
  if (lines.length > 1 && !/day|date|data|steps|count|weight|heart|sleep/i.test(lines[0])) lines = lines.slice(1);
  if (lines.length < 2) return [];
  const header = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const idx = (key: keyof typeof HEADER_ALIASES) => {
    for (const alias of HEADER_ALIASES[key]) {
      const i = header.indexOf(alias);
      if (i >= 0) return i;
    }
    return -1;
  };
  const num = (v?: string) => {
    const n = Number((v ?? "").replace(/"/g, "").replace(",", ".").trim());
    return Number.isFinite(n) && (v ?? "").trim() !== "" ? n : null;
  };
  const toDay = (raw: string) => {
    const v = raw.replace(/"/g, "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return null;
  };
  const out: (Partial<HealthDay> & { day: string })[] = [];
  const dayIdx = idx("day");
  for (const line of lines.slice(1)) {
    const cols = line.split(/[,;]/);
    const day = toDay(cols[dayIdx >= 0 ? dayIdx : 0] ?? "");
    if (!day) continue;
    const pick = (key: keyof typeof HEADER_ALIASES) => {
      const i = idx(key);
      return i >= 0 ? (num(cols[i]) as number | null) : null;
    };
    const sleepRaw = pick("sleep_minutes");
    out.push({
      day,
      steps: pick("steps"),
      active_kcal: pick("active_kcal"),
      // valores acima de 24h vêm em milissegundos (padrão Samsung Health)
      sleep_minutes: sleepRaw != null && sleepRaw > 1440 ? Math.round(sleepRaw / 60000) : sleepRaw,
      resting_hr: pick("resting_hr"),
      weight_kg: pick("weight_kg"),
    });
  }
  return out;
}
