import { supabase } from "@/integrations/supabase/client";

export type SystemTemplateKey =
  | "payment_welcome"
  | "evolution_update_reminder"
  | "renewal_link"
  | "renewal_reminder"
  | "awaiting_payment"
  | "service_queue_first_contact"
  | "diet_adjustment_reminder"
  | "diet_updated"
  | "training_updated"
  | "protocol_updated"
  | "plan_updated"
  | "lab_analysis_ready";

export interface ResolvedTemplate {
  id: string;
  title: string;
  content: string;
  system_key: string;
  image_url?: string | null;
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
    .select("id, title, content, image_url, system_key")
    .eq("system_key", key)
    .maybeSingle();
  if (error || !data) {
    const def = SYSTEM_TEMPLATE_DEFINITIONS.find((d) => d.key === key);
    if (!def) return null;
    return {
      id: `default:${key}`,
      title: def.label,
      content: def.defaultContent,
      system_key: key,
      image_url: null,
    };
  }
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
  options?: { logHistory?: boolean; mode?: "auto" | "manual" }
): Promise<{ ok: boolean; reason?: string; templateId?: string; message?: string }> => {
  const tpl = await getSystemTemplate(key);
  if (!tpl) return { ok: false, reason: "Template do sistema não encontrado. Cadastre em Mensagens → Automáticos." };
  if (!ctx.phone) return { ok: false, reason: "Aluno sem telefone cadastrado." };

  const message = renderTemplate(tpl.content, ctx);
  const AUTO_FOOTER =
    "\n\n———\n🔔 Comunicação automática STH METHOD\nMensagem enviada automaticamente pelo sistema.\nNão é necessário responder.";
  const finalMessage = message.includes("Comunicação automática STH METHOD")
    ? message
    : `${message}${AUTO_FOOTER}`;
  let deliveryStatus: "sent" | "failed" = "sent";
  let deliveryError: string | null = null;

  // Try automatic send via Z-API edge function
  let autoOk = false;
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { phone: ctx.phone, message: finalMessage, image_url: tpl.image_url || null },
    });
    if (error) throw error;
    if (data?.ok) autoOk = true;
    else deliveryError = data?.error || "Falha no envio automático";
  } catch (err: any) {
    deliveryError = err?.message || String(err);
  }

  // Fallback to wa.me if automatic failed or explicit manual mode
  if (!autoOk || options?.mode === "manual") {
    const fallbackMsg = tpl.image_url ? `${finalMessage}\n\n${tpl.image_url}` : finalMessage;
    const url = buildWhatsAppUrl(ctx.phone, fallbackMsg);
    if (url) window.open(url, "_blank");
    if (!autoOk) deliveryStatus = "failed";
  }

  if (options?.logHistory && ctx.user_id) {
    try {
      await supabase.from("message_history").insert({
        user_id: ctx.user_id,
        content: finalMessage,
        recipient_phone: ctx.phone,
        recipient_name: ctx.full_name || null,
        template_id: tpl.id,
        image_url: tpl.image_url || null,
        status: deliveryStatus,
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to log message_history:", err);
    }
  }

  return { ok: true, templateId: tpl.id, message: finalMessage, reason: deliveryError || undefined };
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
      "{nome},\n\n👀 *Seu plano está encerrando…*\n\nPra não perder o ritmo e continuar evoluindo:\n\n👉 *Renove agora:*\n{link_renovacao}\n\n---\n\nSeu resultado depende da continuidade.\nParar agora é retroceder.\n\nBora manter o progresso ativo. 🚀",
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
  {
    key: "diet_updated",
    label: "Dieta atualizada (automático)",
    description: "Disparado automaticamente quando o admin salva/edita uma dieta para o aluno (se notificações estiverem ativas no perfil).",
    defaultContent:
      "Olá {nome}! 🍽️\n\nSua *nova dieta* já está disponível na plataforma STH METHOD.\n\n👉 Acesse o menu DIETA para conferir refeições, macros e hidratação.\n\nBora seguir firme! 💪",
  },
  {
    key: "training_updated",
    label: "Treino atualizado (automático)",
    description: "Disparado automaticamente quando o admin define/atualiza o treino ativo do aluno.",
    defaultContent:
      "Olá {nome}! 🏋️\n\nSeu *novo treino* já está disponível na plataforma STH METHOD.\n\n👉 Acesse o menu TREINO para ver os exercícios, séries e repetições.\n\nVamos com tudo! 🚀",
  },
  {
    key: "protocol_updated",
    label: "Protocolo atualizado (automático)",
    description: "Disparado automaticamente quando o admin salva/edita um protocolo para o aluno.",
    defaultContent:
      "Olá {nome}! 📋\n\nSeu *novo protocolo* já está disponível na plataforma STH METHOD.\n\n👉 Acesse o menu PROTOCOLO para conferir todas as orientações.\n\nQualquer dúvida, estamos por aqui! 🤝",
  },
  {
    key: "plan_updated",
    label: "Plano atualizado (automático)",
    description: "Disparado quando o plano/assinatura do aluno é atualizado.",
    defaultContent:
      "Olá {nome}! ✨\n\nSeu *plano foi atualizado* na plataforma STH METHOD.\n\n👉 Acesse a plataforma para ver as novidades disponíveis no seu acesso.\n\nBons treinos! 💚",
  },
  {
    key: "lab_analysis_ready",
    label: "Análise laboratorial liberada (automático)",
    description:
      "Disparado automaticamente quando o admin libera (Visível = sim) uma análise na Central de Análise.",
    defaultContent:
      "{nome},\n\nSua análise laboratorial já pode ser acessada pela plataforma STH METHOD. 🧪\n\n📲 Acesse:\n🌐 sthmethod.com.br\n\n👉 Vá até a área:\n*Central de Análise*\n\n⚠️ Importante:\nDependendo das informações identificadas nos exames, seu protocolo poderá ser atualizado de forma estratégica.\n\nCaso isso aconteça, você será notificado pela plataforma. 👊",
  },
];
