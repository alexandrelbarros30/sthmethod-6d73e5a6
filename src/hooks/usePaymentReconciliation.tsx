import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_ATTEMPTS = 15;

export const usePaymentReconciliation = (enabled: boolean) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toastStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !user?.id) return;

    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get("status");
    const isSubscriptionRoute = location.pathname === "/dashboard/subscription";
    const shouldPoll = isSubscriptionRoute || paymentStatus === "approved" || paymentStatus === "pending";

    let cancelled = false;
    let pollAttempts = 0;
    let timeoutId: number | null = null;

    const refreshStudentPaymentState = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-subscription", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["student-profile-onboard", user.id] }),
      ]);
    };

    const clearStatusParam = () => {
      if (!paymentStatus) return;
      const params = new URLSearchParams(location.search);
      params.delete("status");
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : "",
        },
        { replace: true }
      );
    };

    const showReturnToast = () => {
      if (!paymentStatus || toastStateRef.current === paymentStatus) return;

      if (paymentStatus === "approved") {
        toast.success("Pagamento recebido. Confirmando e atualizando seu plano...");
      } else if (paymentStatus === "pending") {
        toast.info("Pagamento em processamento. Vamos confirmar automaticamente.");
      } else if (paymentStatus === "failed") {
        toast.error("O pagamento não foi concluído.");
      }

      toastStateRef.current = paymentStatus;
    };

    const reconcilePayments = async () => {
      if (cancelled) return;

      const { data, error } = await supabase.functions.invoke("reconcile-payments", {
        body: {},
      });

      if (cancelled) return;

      if (error) {
        console.error("Payment reconciliation error:", error);
        return;
      }

      if (data?.changed_count > 0 || data?.approved_count > 0) {
        await refreshStudentPaymentState();
      }

      if (data?.approved_count > 0) {
        toast.success("Pagamento confirmado e plano atualizado automaticamente.");
        clearStatusParam();
        return;
      }

      if (shouldPoll && data?.pending_count > 0 && pollAttempts < MAX_POLL_ATTEMPTS) {
        pollAttempts += 1;
        timeoutId = window.setTimeout(reconcilePayments, POLL_INTERVAL_MS);
        return;
      }

      if (paymentStatus === "approved" && (data?.pending_count ?? 0) === 0) {
        toast.success("Pagamento confirmado e plano atualizado automaticamente.");
      }

      if (paymentStatus && (data?.pending_count ?? 0) === 0) {
        await refreshStudentPaymentState();
        clearStatusParam();
      }
    };

    showReturnToast();
    reconcilePayments();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [enabled, user?.id, location.pathname, location.search, navigate, queryClient]);
};