import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { phoneCandidates, normalizePhone } from "@/lib/phone";

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
  checkins: Array<{ checkin_date: string; mood: number; energy: number }>;
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
        checkins: [],
      };
      if (!candidates.length) return empty;

      // 1. find profile — phones can be stored with mask like "(21) 97678-0642"
      //    so we search by the last 8 digits and rank the best match in memory.
      const target = normalizePhone(phone);
      const last8 = target.slice(-8);
      const { data: rawProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, objective, weight, height, gender, avatar_url")
        .ilike("phone", `%${last8}%`)
        .limit(50);
      const scored = (rawProfiles || [])
        .map((p: any) => {
          const d = (p.phone || "").replace(/\D+/g, "");
          let score = 0;
          if (d === target) score = 100;
          else if (d.slice(-11) === target.slice(-11) && target.length >= 11) score = 95;
          else if (d.slice(-10) === target.slice(-10) && target.length >= 10) score = 90;
          else if (d.slice(-8) === last8) score = 80;
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      const profile = scored[0]?.p;
      if (!profile) return empty;

      const uid = profile.user_id;

      // 2. parallel fetches
      const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const [subRes, payRes, weightRes, dietRes, trainRes, protRes, docCount, imgCount, wlCount, checkinsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, plan_id, start_date, end_date, status").eq("user_id", uid).order("end_date", { ascending: false }).limit(1),
        supabase.from("payments").select("id, amount, status, method, action_type, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
        supabase.from("weight_logs").select("weight, logged_at").eq("user_id", uid).order("logged_at", { ascending: false }).limit(1),
        supabase.from("student_diets").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("student_trainings").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("student_protocols").select("updated_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1),
        supabase.from("clinical_documents").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("body_images").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("weight_logs").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("daily_checkins").select("checkin_date, mood, energy").eq("user_id", uid).gte("checkin_date", since).order("checkin_date", { ascending: true }),
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
        checkins: (checkinsRes.data as any[]) ?? [],
      };
    },
  });
}