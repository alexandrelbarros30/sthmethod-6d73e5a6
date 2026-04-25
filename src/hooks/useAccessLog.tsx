import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const SESSION_KEY = "access_log_session_id";
const AUTH_RETRY_DELAYS_MS = [600, 1500, 3000];

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function useAccessLog() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const logIdRef = useRef<string | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (loading || document.visibilityState === "hidden") return;

    const sessionId = getSessionId();
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const closeLog = async () => {
      const currentLogId = logIdRef.current;
      if (!currentLogId) return;

      const dur = Math.max(0, Math.round((Date.now() - startRef.current) / 1000));
      let query = supabase
        .from("access_logs" as any)
        .update({ logged_out_at: new Date().toISOString(), duration_seconds: dur } as any)
        .eq("id", currentLogId);

      query = user?.id
        ? query.eq("user_id", user.id)
        : query.is("user_id", null).eq("is_free", true);

      const { error } = await query;
      if (error) {
        console.warn("[access_logs] update failed", error.message);
        return;
      }

      logIdRef.current = null;
    };

    const scheduleRetry = (attempt: number) => {
      if (!user?.id || attempt >= AUTH_RETRY_DELAYS_MS.length || cancelled) return;
      retryTimeout = setTimeout(() => {
        void insertLog(attempt + 1);
      }, AUTH_RETRY_DELAYS_MS[attempt]);
    };

    const insertLog = async (attempt = 0, nextLogId = crypto.randomUUID()) => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") return;

      if (user?.id) {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData.session?.user?.id;

        if (sessionUserId !== user.id) {
          scheduleRetry(attempt);
          return;
        }
      }

      const { data, error } = await supabase
        .from("access_logs" as any)
        .insert({
          id: nextLogId,
          user_id: user?.id || null,
          session_id: sessionId,
          page_path: location.pathname,
          is_free: !user,
        } as any)
        ;

      if (error) {
        console.warn("[access_logs] insert failed", error.message);
        scheduleRetry(attempt);
        return;
      }

      if (!cancelled) {
        logIdRef.current = nextLogId;
        startRef.current = Date.now();
      }
    };

    void insertLog();

    const handleVisChange = () => {
      if (document.visibilityState === "hidden") {
        void closeLog();
        return;
      }

      if (!logIdRef.current) {
        void insertLog();
      }
    };

    const handleBeforeUnload = () => {
      void closeLog();
    };

    document.addEventListener("visibilitychange", handleVisChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      void closeLog();
      document.removeEventListener("visibilitychange", handleVisChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user?.id, location.pathname, loading]);
}
