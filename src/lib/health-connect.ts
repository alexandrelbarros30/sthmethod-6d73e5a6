import { Capacitor, registerPlugin } from "@capacitor/core";

/** Amostra diária agregada vinda do Health Connect / Apple Saúde. */
export interface NativeHealthDay {
  day: string;
  steps: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
  sleep_minutes: number | null;
  weight_kg: number | null;
}

/**
 * Ponte nativa própria do STH (módulo Android `sth-health`). Cobre sono, peso,
 * FC de repouso e calorias totais — tipos que o plugin capacitor-health não lê.
 */
interface SthHealthPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  checkHealthPermissions(): Promise<{ available: boolean; missing: string[] }>;
  requestHealthPermissions(): Promise<{ granted: boolean }>;
  openSettings(): Promise<void>;
  readDays(options: { days: number }): Promise<{ days: Partial<NativeHealthDay>[] }>;
}

const SthHealth = registerPlugin<SthHealthPlugin>("SthHealth");

let sthNativeOk: boolean | null = null;

/** Diz se o módulo nativo próprio está presente e com Health Connect ativo. */
export async function sthHealthAvailable() {
  if (!isNativeHealthPlatform() || Capacitor.getPlatform() !== "android") return false;
  if (sthNativeOk != null) return sthNativeOk;
  try {
    const res = await SthHealth.isAvailable();
    sthNativeOk = res?.available === true;
  } catch {
    sthNativeOk = false;
  }
  return sthNativeOk;
}

type HealthPlugin = typeof import("capacitor-health")["Health"];

/** Permissões que o plugin realmente suporta (sono/peso não existem nele). */
const PERMISSIONS = ["READ_STEPS", "READ_ACTIVE_CALORIES", "READ_TOTAL_CALORIES", "READ_HEART_RATE", "READ_WORKOUTS"] as const;

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
  if (await sthHealthAvailable()) {
    try {
      const res = await SthHealth.requestHealthPermissions();
      if (res?.granted) return true;
    } catch {
      /* cai para o plugin padrão */
    }
  }
  const p = await plugin();
  if (!p) return false;
  try {
    const res = await p.requestHealthPermissions({ permissions: [...PERMISSIONS] as never });
    const granted = res?.permissions ?? [];
    if (Array.isArray(granted) && granted.length > 0) {
      return granted.some((entry) => Object.values(entry).some(Boolean));
    }
    return true;
  } catch {
    return false;
  }
}

/** Lista as permissões de saúde ainda não concedidas (Android/Health Connect). */
export async function missingHealthPermissions(): Promise<string[]> {
  if (await sthHealthAvailable()) {
    try {
      const res = await SthHealth.checkHealthPermissions();
      return res?.missing ?? [];
    } catch {
      return [];
    }
  }
  const p = await plugin();
  if (!p) return [];
  try {
    const res = await p.checkHealthPermissions({ permissions: [...PERMISSIONS] as never });
    const entries = res?.permissions ?? [];
    const state: Record<string, boolean> = {};
    for (const entry of entries) Object.assign(state, entry);
    return PERMISSIONS.filter((perm) => state[perm] === false);
  } catch {
    return [];
  }
}

const PERMISSION_LABEL: Record<string, string> = {
  READ_STEPS: "Passos",
  READ_ACTIVE_CALORIES: "Calorias ativas",
  READ_TOTAL_CALORIES: "Calorias totais",
  READ_HEART_RATE: "Frequência cardíaca",
  READ_WORKOUTS: "Treinos",
  steps: "Passos",
  active_kcal: "Calorias ativas",
  total_kcal: "Calorias totais",
  sleep: "Sono",
  weight: "Peso",
  resting_hr: "Frequência cardíaca de repouso",
  heart_rate: "Frequência cardíaca",
};

/** Diagnóstico legível do porquê a sincronização do relógio não está disponível. */
export async function healthDiagnostics() {
  if (!isNativeHealthPlatform()) {
    return { code: "web" as const, message: "Você está no navegador. A sincronização automática só existe no aplicativo Android do STH AI." };
  }
  const p = await plugin();
  if (!p) {
    return { code: "plugin" as const, message: "O módulo de saúde não está disponível nesta versão do app. Atualize o aplicativo." };
  }
  try {
    const { available } = await p.isHealthAvailable();
    if (!available) {
      return { code: "hc-missing" as const, message: "O app Health Connect não está instalado ou está desatualizado neste celular." };
    }
  } catch {
    return { code: "hc-missing" as const, message: "Não foi possível falar com o Health Connect neste celular." };
  }
  const missing = await missingHealthPermissions();
  if (missing.length > 0) {
    return {
      code: "permissions" as const,
      message: `Faltam permissões no Health Connect: ${missing.map((m) => PERMISSION_LABEL[m] ?? m).join(", ")}. Toque em Permissões e libere para o STH.`,
    };
  }
  return { code: "ready" as const, message: "Health Connect disponível." };
}

export async function openHealthSettings() {
  if (await sthHealthAvailable()) {
    try {
      await SthHealth.openSettings();
      return;
    } catch {
      /* cai para o plugin padrão */
    }
  }
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

/** Chave YYYY-MM-DD no fuso do aparelho (o plugin devolve LocalDateTime sem offset). */
const dayKey = (value: string) => {
  const local = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (local && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return tzAdjusted.toISOString().slice(0, 10);
};

/**
 * Lê os últimos `days` dias de passos, calorias ativas e FC de repouso
 * (menor média de treino do dia) e devolve linhas prontas para o banco.
 */
export async function readNativeHealthDays(days = 30): Promise<NativeHealthDay[]> {
  const p = await plugin();
  if (!p) return [];

  const end = new Date();
  // Alinha o início à meia-noite local: sem isso o Health Connect fatia os
  // "dias" a partir da hora atual e mistura passos de dois dias no mesmo balde.
  const start = new Date(end.getTime() - days * 86_400_000);
  start.setHours(0, 0, 0, 0);
  const rows = new Map<string, NativeHealthDay>();
  const touch = (day: string) => {
    if (!rows.has(day))
      rows.set(day, { day, steps: null, active_kcal: null, resting_hr: null, sleep_minutes: null, weight_kg: null });
    return rows.get(day)!;
  };

  const aggregate = async (
    dataType: "steps" | "active-calories" | "total-calories",
    field: "steps" | "active_kcal",
  ) => {
    try {
      const res = await p.queryAggregated({
        startDate: iso(start),
        endDate: iso(end),
        dataType: dataType as never,
        bucket: "day",
      });
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
  // Alguns Galaxy Watch só expõem calorias totais; usamos como reserva.
  if ([...rows.values()].every((r) => r.active_kcal == null)) {
    await aggregate("total-calories", "active_kcal");
  }

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
