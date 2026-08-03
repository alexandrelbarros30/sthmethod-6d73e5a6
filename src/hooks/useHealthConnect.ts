import { useCallback, useEffect, useRef, useState } from "react";
import {
  healthAvailable,
  isNativeHealthPlatform,
  openHealthConnectStore,
  openHealthSettings,
  readNativeHealthDays,
  requestHealthPermissions,
  sthHealthAvailable,
} from "@/lib/health-connect";
import type { NativeHealthDay } from "@/lib/health-connect";
import type { HealthDay } from "@/hooks/useAiHealth";

type Status = "checking" | "unsupported" | "unavailable" | "ready";

const LAST_SYNC_KEY = "sth_ai_hc_last_sync";
/** Intervalo mínimo entre sincronizações automáticas (evita loop/piscar na tela). */
const AUTO_SYNC_MIN_MS = 5 * 60 * 1000;
/** Leitura ao vivo (somente memória, sem gravar no servidor). */
const LIVE_POLL_MS = 30 * 1000;

export interface SyncReport {
  read: number;
  imported: number;
  error: string | null;
  at: string;
}

/**
 * Sincroniza o Galaxy Watch (Samsung Health → Health Connect) dentro do app
 * nativo. No navegador o status vira "unsupported" e a UI cai para o CSV.
 */
export function useHealthConnect(
  importRows: (rows: (Partial<HealthDay> & { day: string })[], provider: string) => Promise<number>,
) {
  const [status, setStatus] = useState<Status>("checking");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem(LAST_SYNC_KEY));
  const [report, setReport] = useState<SyncReport | null>(null);
  const [live, setLive] = useState<NativeHealthDay | null>(null);
  const [liveAt, setLiveAt] = useState<string | null>(null);
  const autoRan = useRef(false);
  const lastAutoRef = useRef(0);
  const syncingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isNativeHealthPlatform()) {
        if (alive) setStatus("unsupported");
        return;
      }
      // O módulo nativo próprio (sth-health) responde mesmo quando o plugin
      // capacitor-health falha; qualquer um dos dois já habilita a sincronização.
      const ok = (await sthHealthAvailable()) || (await healthAvailable());
      if (alive) setStatus(ok ? "ready" : "unavailable");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sync = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isNativeHealthPlatform()) return 0;
      if (syncingRef.current) return 0;
      syncingRef.current = true;
      setSyncing(true);
      let read = 0;
      let imported = 0;
      let error: string | null = null;
      try {
        const granted = await requestHealthPermissions();
        if (!granted && !opts?.silent) throw new Error("permission");
        const rows = await readNativeHealthDays(30);
        read = rows.length;
        const latest = [...rows].sort((a, b) => a.day.localeCompare(b.day)).at(-1) ?? null;
        if (latest) {
          setLive(latest);
          setLiveAt(new Date().toISOString());
        }
        const useful = rows.filter(
          (r) =>
            r.steps != null ||
            r.active_kcal != null ||
            r.resting_hr != null ||
            r.sleep_minutes != null ||
            r.weight_kg != null,
        );
        if (useful.length > 0) {
          try {
            await importRows(useful, "samsung_health");
            imported = useful.length;
          } catch (e) {
            error = `Falha ao salvar no servidor: ${(e as Error)?.message ?? "erro desconhecido"}`;
            throw e;
          }
        }
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, now);
        setLastSync(now);
        return imported;
      } catch (e) {
        if (!error) error = (e as Error)?.message ?? "erro desconhecido";
        throw e;
      } finally {
        setReport({ read, imported, error, at: new Date().toISOString() });
        setSyncing(false);
        syncingRef.current = false;
      }
    },
    [importRows],
  );

  /** Leitura ao vivo do relógio sem gravar nada (não dispara re-render da lista). */
  const readLive = useCallback(async () => {
    if (!isNativeHealthPlatform()) return;
    try {
      const rows = await readNativeHealthDays(1);
      const latest = [...rows].sort((a, b) => a.day.localeCompare(b.day)).at(-1) ?? null;
      if (latest) {
        setLive(latest);
        setLiveAt(new Date().toISOString());
      }
    } catch {
      /* silencioso */
    }
  }, []);

  // Auto-sync ao abrir a tela e quando o app volta do background (com throttle).
  useEffect(() => {
    if (status !== "ready") return;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastAutoRef.current < AUTO_SYNC_MIN_MS) return;
      lastAutoRef.current = now;
      sync({ silent: true }).catch(() => undefined);
    };
    if (!autoRan.current) {
      autoRan.current = true;
      run();
    }
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, [status, sync]);

  // Tempo real: espelha o relógio a cada 30s enquanto a tela estiver visível.
  useEffect(() => {
    if (status !== "ready") return;
    void readLive();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void readLive();
    }, LIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [status, readLive]);

  return {
    status,
    syncing,
    lastSync,
    report,
    live,
    liveAt,
    sync,
    readLive,
    openHealthSettings,
    openHealthConnectStore,
  };
}
