import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const usePaymentNotifications = () => {
  const { user, role } = useAuth();

  useEffect(() => {
    if (!user || (role !== "admin" && role !== "consultor")) return;

    const channel = supabase
      .channel("payment-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
        },
        async (payload) => {
          const payment = payload.new as any;
          if (payment.status !== "approved" && payment.status !== "pending") return;

          // For consultors, check if the student is linked
          if (role === "consultor") {
            const { data: link } = await supabase
              .from("consultant_students")
              .select("id")
              .eq("consultant_id", user.id)
              .eq("student_id", payment.user_id)
              .maybeSingle();
            if (!link) return;
          }

          // Fetch student name and plan
          const [profileRes, planRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("user_id", payment.user_id).single(),
            supabase.from("plans").select("name").eq("id", payment.plan_id).single(),
          ]);

          const studentName = profileRes.data?.full_name || "Aluno";
          const planName = planRes.data?.name || "Plano";
          const amount = Number(payment.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          const statusLabel = payment.status === "approved" ? "✅ Aprovado" : "⏳ Pendente";

          toast({
            title: `${statusLabel} — ${studentName}`,
            description: `${planName} • ${amount}`,
            duration: 8000,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payments",
        },
        async (payload) => {
          const payment = payload.new as any;

          if (role === "consultor") {
            const { data: link } = await supabase
              .from("consultant_students")
              .select("id")
              .eq("consultant_id", user.id)
              .eq("student_id", payment.user_id)
              .maybeSingle();
            if (!link) return;
          }

          const [profileRes, planRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("user_id", payment.user_id).single(),
            supabase.from("plans").select("name").eq("id", payment.plan_id).single(),
          ]);

          const studentName = profileRes.data?.full_name || "Aluno";
          const planName = planRes.data?.name || "Plano";
          const amount = Number(payment.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          toast({
            title: `💰 Novo pagamento — ${studentName}`,
            description: `${planName} • ${amount} • ${payment.method?.toUpperCase()}`,
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);
};
