import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "sthai_workout_reminder_";

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Dispara um lembrete (notificação do sistema + prompt na tela) no horário
 * do treino, uma única vez por dia, enquanto o check-in não estiver marcado.
 */
export function useWorkoutReminder({
  time = "18:00",
  enabled,
  alreadyDone,
  dateISO,
  onRemind,
}: {
  time?: string;
  enabled: boolean;
  alreadyDone: boolean;
  dateISO: string;
  onRemind: () => void;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || alreadyDone) return;
    const key = `${STORAGE_PREFIX}${dateISO}`;
    if (localStorage.getItem(key) === "1") return;

    const [h, m] = time.split(":").map(Number);
    const target = (h || 0) * 60 + (m || 0);

    const check = () => {
      if (fired.current) return;
      if (nowMinutes() < target) return;
      fired.current = true;
      localStorage.setItem(key, "1");
      onRemind();
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Hora do treino", {
            body: "Conclua sua sessão e marque como realizado no STH AI.",
          });
        }
      } catch {
        /* notificações indisponíveis no ambiente */
      }
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, alreadyDone, dateISO, time, onRemind]);
}

/** Pede permissão de notificação de forma silenciosa (sem quebrar em webviews). */
export async function ensureNotificationPermission() {
  try {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}