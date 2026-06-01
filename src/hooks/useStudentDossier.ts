import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { phoneCandidates } from "@/lib/phone";

export interface StudentDossier {
  matched: boolean;
  profile: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    objective: string | null;
    weight: number | null;
    height: number | null;
    gender: string | null;
    avatar_url: string | null;
  } | null;
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string | null;
    start_date: string;
    end_date: string;
    status: string;
    days_remaining: number;
  } | null;
  payment: {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    action_type: string | null;
    created_at: string;
  } | null;
  lastWeight: {
    weight: number;
    logged_at: string;
  } | null;
  lastUpdates: {
    diet_at: string | null;
    training_at: string | null;
    protocol_at: string | null;
  };
  counts: {
    documents: number;
    body_images: number;
    weight_logs: number;
  };
}

export function useStudentDossier(phone: string | null | undefined) {
  return useQuery<StudentDossier>({
    queryKey: ["crm-dossier", phone],
    enabled: !!phone,
    queryFn: async (): Promise<StudentDossier> => {
      const candidates = phoneCandidates(phone);
      const empty: StudentDossier = {
        matched: false,
        profile: null,
        subscription: null,
        payment: null,
        lastWeight: null,
        lastUpdates: { diet_at: null, training_at: null, protocol_at: null },
        counts: { documents: 0, body_images: 0, weight_logs: 0 },
      };
      if (!candidates.length) return empty;

      // 1. find profile by any phone variant
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, objective, weight, height, gender, avatar_url")
        .in("phone", candidates)
        .limit(1);
      const profile = profiles?.[0];
      if (!profile) return empty;

      const uid = profile.user_id;

      // 2. parallel fetches
      const [subRes, payRes, weightRes, dietRes, trainRes, protRes, docCount, imgCount, wlCount] = await Promise.all([
        supabase.from("subscriptions").select("id, plan_id, start_date, end_date, status").eq("user_id", uid).order("end_date", { ascending: false }).limit(1),
        supabase.from("payments").select("id, amount, status, method, action_type, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
        supabase.from("weight_logs").select("weight, logged_at").eq("user_id", uid).order("logged_at", { ascending: false }).limit(1),
        supabase.from("student_diets").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("student_trainings").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("student_protocols").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("clinical_documents").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("body_images").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("weight_logs").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);

      const sub = subRes.data?.[0];
      let planName: string | null = null;
      if (sub?.plan_id) {
        const { data: plan } = await supabase.from("plans").select("name").eq("id", sub.plan_id).maybeSingle();
        planName = plan?.name ?? null;
      }

      return {
        matched: true,
        profile,
        subscription: sub
          ? {
              id: sub.id,
              plan_id: sub.plan_id,
              plan_name: planName,
              start_date: sub.start_date,
              end_date: sub.end_date,
              status: sub.status,
              days_remaining: Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000),
            }
          : null,
        payment: payRes.data?.[0] ?? null,
        lastWeight: weightRes.data?.[0] ?? null,
        lastUpdates: {
          diet_at: dietRes.data?.[0]?.updated_at ?? null,
          training_at: trainRes.data?.[0]?.updated_at ?? null,
          protocol_at: protRes.data?.[0]?.updated_at ?? null,
        },
        counts: {
          documents: docCount.count ?? 0,
          body_images: imgCount.count ?? 0,
          weight_logs: wlCount.count ?? 0,
        },
      };
    },
  });
}