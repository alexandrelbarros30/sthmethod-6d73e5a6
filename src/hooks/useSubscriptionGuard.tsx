import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptionGuard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-guard", user?.id],
    queryFn: async () => {
      const [{ data: sub }, { data: profile }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("preview_unlocked")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      const previewUnlocked = !!(profile as any)?.preview_unlocked;

      if (!sub) return { active: false, subscription: null, previewUnlocked };
      const isExpired = new Date(sub.end_date) < new Date();
      return {
        active: sub.status === "active" && !isExpired,
        subscription: sub,
        previewUnlocked,
      };
    },
    enabled: !!user?.id,
  });

  return {
    isActive: data?.active ?? false,
    isLoading,
    subscription: data?.subscription,
    previewUnlocked: data?.previewUnlocked ?? false,
  };
};
