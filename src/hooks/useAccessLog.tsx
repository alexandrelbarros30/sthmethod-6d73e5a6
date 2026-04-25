import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const SESSION_KEY = "access_log_session_id";

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
    // Wait until auth has resolved to avoid logging an authenticated user as anonymous
    if (loading) return;

    const sessionId = getSessionId();
    startRef.current = Date.now();

    const insertLog = async () => {
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
      }
      if (data) logIdRef.current = (data as any).id;
    };

    insertLog();

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
      updateDuration();
      document.removeEventListener("visibilitychange", handleVisChange);
      window.removeEventListener("beforeunload", updateDuration);
      logIdRef.current = null;
    };
  }, [user?.id, location.pathname, loading]);
}
