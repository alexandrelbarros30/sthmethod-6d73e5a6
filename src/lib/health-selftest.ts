import {
  isNativeHealthPlatform,
  missingHealthPermissions,
  readNativeHealthDays,
  sthHealthAvailable,
  type NativeHealthDay,
} from "@/lib/health-connect";

export type MetricKey = "sleep_minutes" | "weight_kg" | "resting_hr" | "active_kcal" | "steps";

export type CheckStatus = "ok" | "empty" | "invalid" | "blocked";

export interface MetricCheck {
  key: MetricKey;
  label: string;
  status: CheckStatus;
  days: number;
  lastValue: number | null;
  detail: string;
}

export interface HealthSelfTestResult {
  ok: boolean;
  code: "web" | "no-native-module" | "ran";
  summary: string;
  checks: MetricCheck[];
  sampleDays: number;
}

const METRICS: { key: MetricKey; label: string; permission: string; min: number; max: number }[] = [
  { key: "sleep_minutes", label: "Sono", permission: "sleep", min: 1, max: 24 * 60 },
  { key: "weight_kg", label: "Peso", permission: "weight", min: 20, max: 400 },
  { key: "resting_hr", label: "FC de repouso", permission: "resting_hr", min: 25, max: 150 },
  { key: "active_kcal", label: "Calorias (ativas/totais)", permission: "active_kcal", min: 1, max: 20000 },
  { key: "steps", label: "Passos", permission: "steps", min: 1, max: 200000 },
];

/**
 * Verificação automática do módulo nativo Android (`sth-health`): confirma que
 * sono, peso, FC de repouso e calorias chegam com valores plausíveis.
 */
export async function runHealthSelfTest(days = 7): Promise<HealthSelfTestResult> {
  if (!isNativeHealthPlatform()) {
    return {
      ok: false,
      code: "web",
      summary: "Teste indisponível no navegador — rode dentro do aplicativo Android.",
      checks: [],
      sampleDays: 0,
    };
  }
  if (!(await sthHealthAvailable())) {
    return {
      ok: false,
      code: "no-native-module",
      summary: "Módulo nativo STH Health não está ativo nesta versão do app (sono/peso/FC de repouso ficam indisponíveis).",
      checks: [],
      sampleDays: 0,
    };
  }

  const missing = new Set(await missingHealthPermissions());
  let rows: NativeHealthDay[] = [];
  try {
    rows = await readNativeHealthDays(days);
  } catch {
    rows = [];
  }

  const checks = METRICS.map(({ key, label, permission, min, max }): MetricCheck => {
    if (missing.has(permission)) {
      return { key, label, status: "blocked", days: 0, lastValue: null, detail: "Permissão não concedida no Health Connect." };
    }
    const values = rows
      .map((r) => r[key])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (values.length === 0) {
      return { key, label, status: "empty", days: 0, lastValue: null, detail: `Nenhum dado nos últimos ${days} dias.` };
    }
    const invalid = values.filter((v) => v < min || v > max);
    const last = values[values.length - 1];
    if (invalid.length > 0) {
      return { key, label, status: "invalid", days: values.length, lastValue: last, detail: `Valores fora da faixa esperada (${min}–${max}).` };
    }
    return { key, label, status: "ok", days: values.length, lastValue: last, detail: `${values.length} dia(s) com leitura válida.` };
  });

  const failures = checks.filter((c) => c.status === "blocked" || c.status === "invalid");
  const empties = checks.filter((c) => c.status === "empty");
  const ok = failures.length === 0 && empties.length < checks.length;

  const summary = ok
    ? empties.length > 0
      ? `Leitura nativa OK. Sem dados recentes para: ${empties.map((c) => c.label).join(", ")}.`
      : "Leitura nativa OK em sono, peso, FC de repouso, calorias e passos."
    : failures.length > 0
      ? `Falhas em: ${failures.map((c) => c.label).join(", ")}.`
      : "O módulo nativo respondeu, mas não retornou nenhum dado.";

  return { ok, code: "ran", summary, checks, sampleDays: rows.length };
}
