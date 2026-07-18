import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

const IDLE_MS = 30 * 60 * 1000; // 30 min
const WARN_MS = 60 * 1000; // 1 min warning
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

/**
 * Signs the user out after IDLE_MS of inactivity. Skips native apps
 * (Capacitor) because those keep long-lived sessions by design.
 */
export function useIdleLogout(enabled: boolean) {
  const timerRef = useRef<number | null>(null);
  const warnRef = useRef<number | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (Capacitor?.isNativePlatform?.()) return;

    const clear = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (warnRef.current) window.clearTimeout(warnRef.current);
      timerRef.current = null;
      warnRef.current = null;
    };

    const logout = async () => {
      clear();
      try {
        await supabase.auth.signOut();
      } catch {}
      toast.warning("Sessão encerrada por inatividade (30 min).", { duration: 8000 });
      // Redirect to login preserving return path could be added; keep simple:
      window.location.replace("/login");
    };

    const reset = () => {
      warnedRef.current = false;
      clear();
      warnRef.current = window.setTimeout(() => {
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast("Você será desconectado em 1 minuto por inatividade.", { duration: 8000 });
        }
      }, IDLE_MS - WARN_MS);
      timerRef.current = window.setTimeout(logout, IDLE_MS);
    };

    EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    document.addEventListener("visibilitychange", reset);
    reset();

    return () => {
      clear();
      EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener("visibilitychange", reset);
    };
  }, [enabled]);
}