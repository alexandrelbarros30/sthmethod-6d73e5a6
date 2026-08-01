import { Capacitor } from "@capacitor/core";

/** Amostra diária agregada vinda do Health Connect / Apple Saúde. */
export interface NativeHealthDay {
  day: string;
  steps: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
}

type HealthPlugin = typeof import("capacitor-health")["Health"];

let cached: HealthPlugin | null = null;

export function isNativeHealthPlatform() {
  return Capacitor?.isNativePlatform?.() === true;
}

async function plugin(): Promise<HealthPlugin | null> {
  if (!isNativeHealthPlatform()) return null;
  if (cached) return cached;
  try {
    const mod = await import("capacitor-health");
    cached = mod.Health;
    return cached;
  } catch {
    return null;
  }
}

export async function healthAvailable() {
  const p = await plugin();
  if (!p) return false;
  try {
    const { available } = await p.isHealthAvailable();
    return available;
  } catch {
    return false;
  }
}

export async function requestHealthPermissions() {
  const p = await plugin();
  if (!p) return false;
  const permissions = ["READ_STEPS", "READ_ACTIVE_CALORIES", "READ_HEART_RATE", "READ_WORKOUTS"] as const;
  try {
    const res = await p.requestHealthPermissions({ permissions: [...permissions] as never });
    const granted = res?.permissions ?? [];
    if (Array.isArray(granted) && granted.length > 0) {
      return granted.some((entry) => Object.values(entry).some(Boolean));
    }
    return true;
  } catch {
    return false;
  }
}

export async function openHealthSettings() {
  const p = await plugin();
  if (!p) return;
  try {
    if (Capacitor.getPlatform() === "ios") await p.openAppleHealthSettings();
    else await p.openHealthConnectSettings();
  } catch {
    /* noop */
  }
}

export async function openHealthConnectStore() {
  const p = await plugin();
  try {
    await p?.showHealthConnectInPlayStore();
  } catch {
    /* noop */
  }
}

const iso = (d: Date) => d.toISOString();
const dayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

/**
 * Lê os últimos `days` dias de passos, calorias ativas e FC de repouso
 * (menor média de treino do dia) e devolve linhas prontas para o banco.
 */
export async function readNativeHealthDays(days = 30): Promise<NativeHealthDay[]> {
  const p = await plugin();
  if (!p) return [];

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const rows = new Map<string, NativeHealthDay>();
  const touch = (day: string) => {
    if (!rows.has(day)) rows.set(day, { day, steps: null, active_kcal: null, resting_hr: null });
    return rows.get(day)!;
  };

  const aggregate = async (dataType: "steps" | "active-calories", field: "steps" | "active_kcal") => {
    try {
      const res = await p.queryAggregated({ startDate: iso(start), endDate: iso(end), dataType, bucket: "day" });
      for (const sample of res?.aggregatedData ?? []) {
        if (!Number.isFinite(sample.value) || sample.value <= 0) continue;
        touch(dayKey(sample.startDate))[field] = Math.round(sample.value);
      }
    } catch {
      /* permissão ausente para esse tipo */
    }
  };

  await aggregate("steps", "steps");
  await aggregate("active-calories", "active_kcal");

  try {
    const res = await p.queryWorkouts({
      startDate: iso(start),
      endDate: iso(end),
      includeHeartRate: true,
      includeRoute: false,
      includeSteps: false,
    });
    for (const w of res?.workouts ?? []) {
      const hr = (w.heartRate ?? []).map((s) => s.bpm).filter((n) => Number.isFinite(n) && n > 0);
      if (hr.length === 0) continue;
      const row = touch(dayKey(w.startDate));
      const low = Math.round(Math.min(...hr));
      row.resting_hr = row.resting_hr == null ? low : Math.min(row.resting_hr, low);
    }
  } catch {
    /* sem permissão de FC */
  }

  return [...rows.values()].sort((a, b) => a.day.localeCompare(b.day));
}
