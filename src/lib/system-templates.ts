import { supabase } from "@/integrations/supabase/client";

export type SystemTemplateKey =
  | "payment_welcome"
  | "evolution_update_reminder"
  | "renewal_link"
  | "renewal_reminder"
  | "awaiting_payment"
  | "service_queue_first_contact"
  | "diet_adjustment_reminder";

export interface ResolvedTemplate {
  id: string;
  title: string;
  content: string;
  system_key: string;
}

export interface TemplateContext {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  user_id?: string | null;
  plan_name?: string | null;
  plan_price?: string | null;
  end_date?: string | null;
  amount?: string | null;
}

/** Resolve a system template from message_templates by its system_key. */
export const getSystemTemplate = async (key: SystemTemplateKey): Promise<ResolvedTemplate | null> => {
  const { data, error } = await supabase
    .from("message_templates")
    .select("id, title, content, system_key")
    .eq("system_key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data as ResolvedTemplate;
};

/** Replace {variables} in template content using the provided context. */
export const renderTemplate = (content: string, ctx: TemplateContext): string => {
  const firstName = ctx.full_name?.split(" ")[0] || "Aluno";
  const fullName = ctx.full_name || "Aluno";
  let msg = content;
  msg = msg.replace(/\{nome\}/g, firstName);
  msg = msg.replace(/\{nome_completo\}/g, fullName);
  msg = msg.replace(/\{email\}/g, ctx.email || "");
  msg = msg.replace(/\{telefone\}/g, ctx.phone || "");
  msg = msg.replace(/\{plano\}/g, ctx.plan_name || "—");
  msg = msg.replace(/\{valor\}/g, ctx.amount || ctx.plan_price || "—");
  if (ctx.end_date) {
    const d = new Date(ctx.end_date);
    msg = msg.replace(/\{vencimento\}/g, d.toLocaleDateString("pt-BR"));
    const diff = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
    msg = msg.replace(/\{dias_restantes\}/g, String(diff));
  } else {
    msg = msg.replace(/\{vencimento\}/g, "—");
    msg = msg.replace(/\{dias_restantes\}/g, "—");
  }
  const link = ctx.user_id ? `${window.location.origin}/dashboard/renew?uid=${ctx.user_id}` : "";
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  return msg;
};

/** Build a wa.me URL with a properly normalized BR phone number. */
export const buildWhatsAppUrl = (phone: string, message: string): string | null => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const fullPhone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

/** Resolve, render and open WhatsApp. Returns true on success. */
export const sendSystemTemplate = async (
  key: SystemTemplateKey,
  ctx: TemplateContext,
  options?: { logHistory?: boolean }
): Promise<{ ok: boolean; reason?: string; templateId?: string; message?: string }> => {
  const tpl = await getSystemTemplate(key);
  if (!tpl) return { ok: false, reason: "Template do sistema não encontrado. Cadastre em Mensagens → Automáticos." };
  if (!ctx.phone) return { ok: false, reason: "Aluno sem telefone cadastrado." };

  const message = renderTemplate(tpl.content, ctx);
  const url = buildWhatsAppUrl(ctx.phone, message);
  if (!url) return { ok: false, reason: "Telefone inválido." };

  window.open(url, "_blank");

  if (options?.logHistory && ctx.user_id) {
    try {
      await supabase.from("message_history").insert({
        user_id: ctx.user_id,
        content: message,
        recipient_phone: ctx.phone,
        recipient_name: ctx.full_name || null,
        template_id: tpl.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to log message_history:", err);
    }
  }

  return { ok: true, templateId: tpl.id, message };
};

export const SYSTEM_TEMPLATE_DEFINITIONS: Array<{
  key: SystemTemplateKey;
  label: string;
  description: string;
  defaultContent: string;
}> = [
  {
    key: "payment_welcome",
    label: "Boas-vindas após pagamento aprovado",
    description: "Aberto automaticamente quando um pagamento é aprovado (via webhook ou confirmação manual).",
    defaultContent:
      "Olá {nome}! 🎉\n\nSeu pagamento foi aprovado e seu acesso à STH Method está liberado.\n\nVamos juntos nessa jornada! 💪",
  },
  {
    key: "evolution_update_reminder",
    label: "Lembrete de Atualização de Evolução",
    description: "Enviado pelo botão WhatsApp do popup de Lembrete de Evolução (ciclos de 29 dias).",
    defaultContent:
      "Olá, {nome}! 👋📸\n\nChegou o momento de atualizarmos sua evolução.\n\nAcesse a plataforma no menu ATUALIZAÇÃO e envie:\n📷 FOTO FRONTAL\n📷 FOTO LATERAL\n📷 FOTO COSTAS\n⚖️ PESO ATUAL\n\nVamos juntos! 💪🚀",
  },
  {
    key: "service_queue_first_contact",
    label: "Primeiro contato — Fila de Atendimento",
    description: "Enviado pelo botão WhatsApp da Fila de Atendimento.",
    defaultContent: "Olá {nome}, tudo bem? Aqui é da equipe STH Method. 👋",
  },
  {
    key: "renewal_link",
    label: "Renovação com link seguro",
    description: "Lembrete de renovação enviado via central de mensagens / lembretes inteligentes.",
    defaultContent:
      "Olá {nome}! ⏰\n\nSeu plano vence em {dias_restantes} dias ({vencimento}). Renove agora pelo link: {link}",
  },
  {
    key: "renewal_reminder",
    label: "Lembrete de Renovação (3 dias antes)",
    description: "Sugerido pelos Lembretes Inteligentes quando faltam 3 dias para o vencimento.",
    defaultContent:
      "Olá {nome}! Seu plano vence em {dias_restantes} dias. Vamos renovar? 🚀\n\n👉 {link}",
  },
  {
    key: "diet_adjustment_reminder",
    label: "Ajuste de Dieta (recorrência 30 dias)",
    description: "Sugerido pelos Lembretes Inteligentes a cada 30 dias para ajuste de dieta.",
    defaultContent:
      "Olá {nome}! 🍽️\n\nFaz 30 dias desde seu último ajuste. Vamos revisar sua dieta para manter os resultados? Me envie peso atual e como está se sentindo.",
  },
  {
    key: "awaiting_payment",
    label: "Cadastro completo aguardando pagamento",
    description: "Para alunos com cadastro completo mas sem pagamento confirmado.",
    defaultContent:
      "Olá {nome}! Recebi seu cadastro 👍 Estamos aguardando a confirmação do pagamento para liberar seu acesso à plataforma.",
  },
];
