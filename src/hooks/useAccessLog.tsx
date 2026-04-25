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
    if (loading) return;

    const sessionId = getSessionId();
    startRef.current = Date.now();
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = (attempt: number) => {
      if (!user?.id || attempt >= AUTH_RETRY_DELAYS_MS.length || cancelled) return;
      retryTimeout = setTimeout(() => {
        void insertLog(attempt + 1);
      }, AUTH_RETRY_DELAYS_MS[attempt]);
    };

    const insertLog = async (attempt = 0) => {
      if (cancelled) return;

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
          user_id: user?.id || null,
          session_id: sessionId,
          page_path: location.pathname,
          is_free: !user,
        } as any)
        .select("id")
        .single();

      if (error) {
        console.warn("[access_logs] insert failed", error.message);
        scheduleRetry(attempt);
      }

      if (data && !cancelled) logIdRef.current = (data as any).id;
    };

    void insertLog();

    const updateDuration = () => {
      if (!logIdRef.current) return;
      const dur = Math.round((Date.now() - startRef.current) / 1000);
      supabase
        .from("access_logs" as any)
        .update({ logged_out_at: new Date().toISOString(), duration_seconds: dur } as any)
        .eq("id", logIdRef.current)
        .then();
    };

    const handleVisChange = () => {
      if (document.visibilityState === "hidden") updateDuration();
    };

    document.addEventListener("visibilitychange", handleVisChange);
    window.addEventListener("beforeunload", updateDuration);

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      updateDuration();
      document.removeEventListener("visibilitychange", handleVisChange);
      window.removeEventListener("beforeunload", updateDuration);
      logIdRef.current = null;
    };
  }, [user?.id, location.pathname, loading]);
}
