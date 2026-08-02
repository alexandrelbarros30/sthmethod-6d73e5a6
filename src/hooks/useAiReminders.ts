import { useEffect, useRef } from "react";
import { showLocalNotification } from "@/lib/local-notifications";

export type ReminderItem = {
  /** Identificador único por dia (ex.: "workout", "meal-Refeição 1"). */
  id: string;
  /** Horário no formato HH:MM. */
  time: string;
  title: string;
  body: string;
  url?: string;
  /** Minutos de antecedência para o aviso prévio (0 = sem aviso prévio). */
  leadMinutes?: number;
  /** Callback opcional para o prompt in-app. */
  onFire?: (kind: "lead" | "start") => void;
};

const PREFIX = "sthai_reminder_";

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
};

/**
 * Dispara notificações push locais (e prompts in-app) nos horários registrados:
 * um pouco antes e no início de cada compromisso (treino e refeições).
 */
export function useAiReminders(items: ReminderItem[], { enabled = true, dateISO }: { enabled?: boolean; dateISO: string }) {
  const ref = useRef(items);
  ref.current = items;

  useEffect(() => {
    if (!enabled) return;

    const fireOnce = (key: string, run: () => void) => {
      const storageKey = `${PREFIX}${dateISO}_${key}`;
      if (localStorage.getItem(storageKey) === "1") return;
      localStorage.setItem(storageKey, "1");
      run();
    };

    const check = () => {
      const now = nowMinutes();
      for (const item of ref.current) {
        const target = toMin(item.time);
        if (target == null) continue;
        const lead = item.leadMinutes ?? 15;

        if (lead > 0 && now >= target - lead && now < target) {
          fireOnce(`${item.id}_lead`, () => {
            void showLocalNotification(item.title, {
              body: `Faltam ~${Math.max(1, target - now)} min. ${item.body}`,
              tag: `${item.id}-lead`,
              url: item.url,
            });
            item.onFire?.("lead");
          });
        }

        if (now >= target && now < target + 90) {
          fireOnce(`${item.id}_start`, () => {
            void showLocalNotification(item.title, {
              body: item.body,
              tag: `${item.id}-start`,
              url: item.url,
            });
            item.onFire?.("start");
          });
        }
      }
    };

    check();
    const id = window.setInterval(check, 60_000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, dateISO]);
}
