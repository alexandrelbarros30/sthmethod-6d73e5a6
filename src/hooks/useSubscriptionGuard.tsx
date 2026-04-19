import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePreviewAs } from "@/hooks/usePreviewAs";

export const useSubscriptionGuard = () => {
  const { user } = useAuth();
  const { effectiveUserId, isPreviewing } = usePreviewAs();
  const targetId = effectiveUserId || user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-guard", targetId, isPreviewing],
    queryFn: async () => {
      const [{ data: sub }, { data: profile }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("user_id", targetId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("preview_unlocked")
          .eq("user_id", targetId!)
          .maybeSingle(),
      ]);

      const previewUnlocked = !!(profile as any)?.preview_unlocked;

      // When previewing as student, force-show the real student experience
      // (treat as active so the full meal/protocol UI renders, regardless of payment).
      if (isPreviewing) {
        return { active: true, subscription: sub, previewUnlocked: true };
      }

      if (!sub) return { active: false, subscription: null, previewUnlocked };
      const isExpired = new Date(sub.end_date) < new Date();
      return {
        active: sub.status === "active" && !isExpired,
        subscription: sub,
        previewUnlocked,
      };
    },
    enabled: !!targetId,
  });

  return {
    isActive: data?.active ?? false,
    isLoading,
    subscription: data?.subscription,
    previewUnlocked: data?.previewUnlocked ?? false,
  };
};
