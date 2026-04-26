import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { sendSystemTemplate } from "@/lib/system-templates";

const notifyAdminWhatsApp = async (
  studentName: string,
  planName: string,
  amount: string,
  actionLabel: string,
  method: string
) => {
  try {
    const { data: setting } = await supabase
      .from("payment_settings")
      .select("value")
      .eq("key", "admin_whatsapp")
      .single();

    let adminPhone = setting?.value;

    if (!adminPhone) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);

      if (adminRoles?.[0]) {
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", adminRoles[0].user_id)
          .single();
        adminPhone = adminProfile?.phone;
      }
    }

    if (!adminPhone) return;

    const phone = adminPhone.replace(/\D/g, "");
    if (!phone) return;
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;

    const message = `💰 *Pagamento Aprovado!*\n\n👤 Aluno: ${studentName}\n📋 ${actionLabel}\n📦 Plano: ${planName}\n💵 Valor: ${amount}\n💳 Método: ${method?.toUpperCase() || "N/A"}\n⏰ ${new Date().toLocaleString("pt-BR")}`;

    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  } catch (err) {
    console.error("Error notifying admin via WhatsApp:", err);
  }
};

const openWhatsAppWelcome = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("user_id", userId)
      .single();
    if (!profile?.phone) return;
    await sendSystemTemplate(
      "payment_welcome",
      {
        full_name: profile.full_name,
        phone: profile.phone,
        email: profile.email,
        user_id: userId,
      },
      { logHistory: true }
    );
  } catch (err) {
    console.error("Error opening WhatsApp welcome:", err);
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
            // Notify admin via WhatsApp
            notifyAdminWhatsApp(studentName, planName, amount, actionLabel, payment.method);
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

          // Notify admin via WhatsApp for new payments
          if (payment.status === "approved") {
            notifyAdminWhatsApp(studentName, planName, amount, actionLabel, payment.method);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);
};
