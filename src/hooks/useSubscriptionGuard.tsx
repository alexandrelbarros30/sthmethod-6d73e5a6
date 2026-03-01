import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptionGuard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-guard", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return { active: false, subscription: null };
      const isExpired = new Date(data.end_date) < new Date();
      return {
        active: data.status === "active" && !isExpired,
        subscription: data,
      };
    },
    enabled: !!user?.id,
  });

  return {
    isActive: data?.active ?? false,
    isLoading,
    subscription: data?.subscription,
  };
};
