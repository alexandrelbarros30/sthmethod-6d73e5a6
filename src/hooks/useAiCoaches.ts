import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AiCoach {
  id: string;
  user_id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  price_month: number | null;
  city: string | null;
  avatar_url: string | null;
  contact_whatsapp: string | null;
  rating: number | null;
}

export interface AiCoachRequest {
  id: string;
  coach_id: string;
  user_id: string;
  status: string;
  goal: string | null;
  message: string | null;
  created_at: string;
}

export interface AiCoachMessage {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const REQUEST_LABEL: Record<string, string> = {
  pending: "Aguardando o coach",
  accepted: "Acompanhamento ativo",
  declined: "Recusada",
  closed: "Encerrada",
};

export function useAiCoaches() {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<AiCoach[]>([]);
  const [requests, setRequests] = useState<AiCoachRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const coachQuery = supabase
      .from("ai_app_coaches")
      .select("id, user_id, display_name, headline, bio, specialties, price_month, city, avatar_url, contact_whatsapp, rating")
      .eq("is_active", true)
      .eq("is_approved", true)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(50);

    if (!user?.id) {
      const { data } = await coachQuery;
      setCoaches((data ?? []) as AiCoach[]);
      setRequests([]);
      setLoading(false);
      return;
    }
    const [{ data: c }, { data: r }] = await Promise.all([
      coachQuery,
      supabase
        .from("ai_app_coach_requests")
        .select("id, coach_id, user_id, status, goal, message, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setCoaches((c ?? []) as AiCoach[]);
    setRequests((r ?? []) as AiCoachRequest[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestCoach = useCallback(
    async (coachId: string, goal: string, message: string) => {
      if (!user?.id) throw new Error("auth");
      const { error } = await supabase
        .from("ai_app_coach_requests")
        .insert({ coach_id: coachId, user_id: user.id, goal, message, status: "pending" });
      if (error) throw error;
      await refresh();
    },
    [user?.id, refresh],
  );

  const cancelRequest = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("ai_app_coach_requests").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  return { user, coaches, requests, loading, refresh, requestCoach, cancelRequest };
}

export async function fetchCoachMessages(requestId: string) {
  const { data } = await supabase
    .from("ai_app_coach_messages")
    .select("id, request_id, sender_id, body, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return (data ?? []) as AiCoachMessage[];
}

export async function sendCoachMessage(requestId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("ai_app_coach_messages")
    .insert({ request_id: requestId, sender_id: senderId, body });
  if (error) throw error;
}
