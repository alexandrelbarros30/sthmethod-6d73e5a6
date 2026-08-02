import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AiCheckin {
  id: string;
  checkin_date: string;
  diet_done: boolean;
  workout_done: boolean;
  water_done: boolean;
  mood: number | null;
  energy: number | null;
  note: string | null;
}

export interface AiMeasurement {
  id: string;
  measured_on: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

/** Sequência de dias consecutivos até hoje (ou ontem, se hoje ainda não houve check-in). */
export function computeStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date(`${todayISO()}T00:00:00`);
  if (!set.has(todayISO())) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useAiProgress() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<AiCheckin[]>([]);
  const [measurements, setMeasurements] = useState<AiMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase
        .from("ai_app_checkins")
        .select("id, checkin_date, diet_done, workout_done, water_done, mood, energy, note")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(120),
      supabase
        .from("ai_app_measurements")
        .select("id, measured_on, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, notes")
        .eq("user_id", user.id)
        .order("measured_on", { ascending: false })
        .limit(60),
    ]);
    setCheckins((c ?? []) as unknown as AiCheckin[]);
    setMeasurements((m ?? []) as unknown as AiMeasurement[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const streak = useMemo(() => computeStreak(checkins.map((c) => c.checkin_date)), [checkins]);
  const today = useMemo(() => checkins.find((c) => c.checkin_date === todayISO()) ?? null, [checkins]);
  const last7 = useMemo(() => {
    const days: { iso: string; done: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${todayISO()}T00:00:00`);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ iso, done: checkins.some((c) => c.checkin_date === iso) });
    }
    return days;
  }, [checkins]);

  const saveCheckin = useCallback(
    async (payload: Partial<AiCheckin>) => {
      if (!user?.id) return;
      await supabase
        .from("ai_app_checkins")
        .upsert(
          { user_id: user.id, checkin_date: todayISO(), ...payload },
          { onConflict: "user_id,checkin_date" },
        );
      await refresh();
    },
    [user?.id, refresh],
  );

  const saveMeasurement = useCallback(
    async (payload: Partial<AiMeasurement>) => {
      if (!user?.id) return;
      await supabase
        .from("ai_app_measurements")
        .insert({ user_id: user.id, measured_on: todayISO(), ...payload });
      await refresh();
    },
    [user?.id, refresh],
  );

  /** Marca/desmarca o treino como realizado em uma data específica do histórico. */
  const setWorkoutDone = useCallback(
    async (dateISO: string, value: boolean) => {
      if (!user?.id) return;
      const existing = checkins.find((c) => c.checkin_date === dateISO);
      await supabase.from("ai_app_checkins").upsert(
        {
          user_id: user.id,
          checkin_date: dateISO,
          diet_done: existing?.diet_done ?? false,
          water_done: existing?.water_done ?? false,
          workout_done: value,
        },
        { onConflict: "user_id,checkin_date" },
      );
      await refresh();
    },
    [user?.id, checkins, refresh],
  );

  return {
    user,
    checkins,
    measurements,
    streak,
    today,
    last7,
    loading,
    refresh,
    saveCheckin,
    saveMeasurement,
    setWorkoutDone,
  };
}
