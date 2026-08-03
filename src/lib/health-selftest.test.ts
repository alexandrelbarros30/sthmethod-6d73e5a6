import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/health-connect", () => ({
  isNativeHealthPlatform: vi.fn(() => true),
  sthHealthAvailable: vi.fn(async () => true),
  missingHealthPermissions: vi.fn(async () => [] as string[]),
  readNativeHealthDays: vi.fn(async () => [] as any[]),
}));

import { runHealthSelfTest } from "@/lib/health-selftest";
import * as hc from "@/lib/health-connect";

const day = (over: Partial<Record<string, number | null>> = {}) => ({
  day: "2026-08-01",
  steps: 8000,
  active_kcal: 520,
  resting_hr: 58,
  sleep_minutes: 430,
  weight_kg: 84.2,
  ...over,
});

describe("runHealthSelfTest", () => {
  beforeEach(() => {
    vi.mocked(hc.isNativeHealthPlatform).mockReturnValue(true);
    vi.mocked(hc.sthHealthAvailable).mockResolvedValue(true);
    vi.mocked(hc.missingHealthPermissions).mockResolvedValue([]);
    vi.mocked(hc.readNativeHealthDays).mockResolvedValue([day()] as never);
  });

  it("aprova quando sono, peso, FC de repouso e calorias vêm válidos", async () => {
    const res = await runHealthSelfTest(7);
    expect(res.ok).toBe(true);
    const byKey = Object.fromEntries(res.checks.map((c) => [c.key, c.status]));
    expect(byKey.sleep_minutes).toBe("ok");
    expect(byKey.weight_kg).toBe("ok");
    expect(byKey.resting_hr).toBe("ok");
    expect(byKey.active_kcal).toBe("ok");
  });

  it("marca métrica sem dados como vazia", async () => {
    vi.mocked(hc.readNativeHealthDays).mockResolvedValue([day({ sleep_minutes: null })] as never);
    const res = await runHealthSelfTest(7);
    expect(res.checks.find((c) => c.key === "sleep_minutes")?.status).toBe("empty");
    expect(res.ok).toBe(true);
  });

  it("reprova valores fora da faixa fisiológica", async () => {
    vi.mocked(hc.readNativeHealthDays).mockResolvedValue([day({ weight_kg: 0.5, resting_hr: 900 })] as never);
    const res = await runHealthSelfTest(7);
    expect(res.ok).toBe(false);
    expect(res.checks.find((c) => c.key === "weight_kg")?.status).toBe("invalid");
    expect(res.checks.find((c) => c.key === "resting_hr")?.status).toBe("invalid");
  });

  it("aponta permissão bloqueada", async () => {
    vi.mocked(hc.missingHealthPermissions).mockResolvedValue(["sleep"]);
    const res = await runHealthSelfTest(7);
    expect(res.checks.find((c) => c.key === "sleep_minutes")?.status).toBe("blocked");
    expect(res.ok).toBe(false);
  });

  it("não roda no navegador", async () => {
    vi.mocked(hc.isNativeHealthPlatform).mockReturnValue(false);
    const res = await runHealthSelfTest();
    expect(res.code).toBe("web");
  });

  it("avisa quando o módulo nativo não está presente", async () => {
    vi.mocked(hc.sthHealthAvailable).mockResolvedValue(false);
    const res = await runHealthSelfTest();
    expect(res.code).toBe("no-native-module");
  });
});
