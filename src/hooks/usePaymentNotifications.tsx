import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const WELCOME_TEMPLATE_ID = "c6aefbd6-049c-4d8e-aa55-ebece3b638ca";

const openWhatsAppWelcome = async (userId: string) => {
  try {
    const [profileRes, templateRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("user_id", userId).single(),
      supabase.from("message_templates").select("content").eq("id", WELCOME_TEMPLATE_ID).single(),
    ]);

    const profile = profileRes.data;
    const template = templateRes.data;
    if (!profile?.phone || !template?.content) return;

    const firstName = profile.full_name?.split(" ")[0] || "Aluno";
    let message = template.content
      .replace(/\{nome\}/g, firstName)
      .replace(/\{nome_completo\}/g, profile.full_name || "Aluno")
      .replace(/\{email\}/g, "")
      .replace(/\{telefone\}/g, profile.phone || "");

    const phone = profile.phone.replace(/\D/g, "");
    if (!phone) return;

    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("message_history").insert({
        user_id: userId,
        content: message,
        recipient_phone: profile.phone,
        recipient_name: profile.full_name,
        template_id: WELCOME_TEMPLATE_ID,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Error opening WhatsApp welcome:", err);
  }
};

const openWhatsAppAdminNotification = async (payment: any, studentName: string, planName: string) => {
  try {
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("value")
      .eq("key", "admin_notification_phone")
      .single();

    const adminPhone = settings?.value?.replace(/\D/g, "");
    if (!adminPhone) return;

    const fullPhone = adminPhone.startsWith("55") ? adminPhone : `55${adminPhone}`;
    const amount = Number(payment.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const methodLabels: Record<string, string> = { pix: "PIX", credit: "Crédito", debit: "Débito" };
    const actionLabels: Record<string, string> = { new: "Novo plano", upgrade: "Atualização", renewal: "Renovação" };

    const message =
      `✅ *Pagamento Aprovado - ST&H*\n\n` +
      `👤 Aluno: ${studentName}\n` +
      `📋 Ação: ${actionLabels[payment.action_type] || payment.action_type}\n` +
      `📦 Plano: ${planName}\n` +
      `💰 Valor: ${amount}\n` +
      `💳 Método: ${methodLabels[payment.method] || payment.method}\n` +
      `📅 Data: ${new Date().toLocaleDateString("pt-BR")}`;

    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  } catch (err) {
    console.error("Error opening WhatsApp admin notification:", err);
  }
};

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
          const prevPayment = payload.old as any;
          if (payment.status !== "approved" && payment.status !== "pending") return;

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

          const statusLabel = payment.status === "approved" ? "✅ Aprovado" : "⏳ Pendente";
          const actionLabel = payment.action_type === "new" ? "Novo plano" : payment.action_type === "upgrade" ? "Atualização" : "Renovação";

          toast({
            title: `${statusLabel} — ${studentName}`,
            description: `${actionLabel} • ${planName} • ${amount}`,
            duration: 12000,
          });

          if (payment.status === "approved") {
            setTimeout(() => {
              toast({
                title: `📋 Lembrete — Atualizar STCoach`,
                description: `Atualize os dados de ${studentName} no STCoach (${actionLabel}).`,
                duration: 15000,
              });
            }, 1500);
          }

          // Auto-open WhatsApp welcome when payment transitions to approved
          if (payment.status === "approved" && prevPayment?.status !== "approved") {
            openWhatsAppWelcome(payment.user_id);
            // Also notify admin via WhatsApp
            openWhatsAppAdminNotification(payment, studentName, planName);
          }
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

          const actionLabel = payment.action_type === "new" ? "Novo plano" : payment.action_type === "upgrade" ? "Atualização" : "Renovação";

          toast({
            title: `💰 Novo pagamento — ${studentName}`,
            description: `${actionLabel} • ${planName} • ${amount} • ${payment.method?.toUpperCase()}`,
            duration: 12000,
          });

          setTimeout(() => {
            toast({
              title: `📋 Lembrete — Atualizar STCoach`,
              description: `Cadastre/atualize ${studentName} no STCoach (${actionLabel}).`,
              duration: 15000,
            });
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);
};
