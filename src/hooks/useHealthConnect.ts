import { useCallback, useEffect, useRef, useState } from "react";
import {
  healthAvailable,
  isNativeHealthPlatform,
  openHealthConnectStore,
  openHealthSettings,
  readNativeHealthDays,
  requestHealthPermissions,
} from "@/lib/health-connect";
import type { HealthDay } from "@/hooks/useAiHealth";

type Status = "checking" | "unsupported" | "unavailable" | "ready";

const LAST_SYNC_KEY = "sth_ai_hc_last_sync";

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
  const autoRan = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isNativeHealthPlatform()) {
        if (alive) setStatus("unsupported");
        return;
      }
      const ok = await healthAvailable();
      if (alive) setStatus(ok ? "ready" : "unavailable");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sync = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isNativeHealthPlatform()) return 0;
      setSyncing(true);
      try {
        const granted = await requestHealthPermissions();
        if (!granted && !opts?.silent) throw new Error("permission");
        const rows = await readNativeHealthDays(30);
        const useful = rows.filter(
          (r) =>
            r.steps != null ||
            r.active_kcal != null ||
            r.resting_hr != null ||
            r.sleep_minutes != null ||
            r.weight_kg != null,
        );
        if (useful.length > 0) await importRows(useful, "samsung_health");
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, now);
        setLastSync(now);
        return useful.length;
      } finally {
        setSyncing(false);
      }
    },
    [importRows],
  );

  // Auto-sync ao abrir a tela e sempre que o app volta do background.
  useEffect(() => {
    if (status !== "ready") return;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      sync({ silent: true }).catch(() => undefined);
    };
    if (!autoRan.current) {
      autoRan.current = true;
      run();
    }
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, [status, sync]);

  return { status, syncing, lastSync, sync, openHealthSettings, openHealthConnectStore };
}
