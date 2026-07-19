import { supabase } from "@/integrations/supabase/client";

export type SystemTemplateKey =
  | "payment_welcome"
  | "student_update_received"
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
  | "content_all_ready"
  | "lab_analysis_ready"
  | "renewal_soft"
  | "renewal_objective"
  | "renewal_recovery"
  | "renewal_last_contact"
  | "renewal_reactivation";

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
  plan_id?: string | null;
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
    msg = msg.replace(/\{data_vencimento\}/g, d.toLocaleDateString("pt-BR"));
    const diff = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
    msg = msg.replace(/\{dias_restantes\}/g, String(diff));
    const overdueDays = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    msg = msg.replace(/\{dias_vencido\}/g, String(overdueDays));
  } else {
    msg = msg.replace(/\{vencimento\}/g, "—");
    msg = msg.replace(/\{data_vencimento\}/g, "—");
    msg = msg.replace(/\{dias_restantes\}/g, "—");
    msg = msg.replace(/\{dias_vencido\}/g, "—");
  }
  const link = ctx.user_id 
    ? `${window.location.origin}/dashboard/renew?uid=${ctx.user_id}${ctx.plan_id ? `&pid=${ctx.plan_id}` : ''}` 
    : "";
  msg = msg.replace(/\{link\}/g, link);
  msg = msg.replace(/\{link_renovacao\}/g, link);
  msg = msg.replace(/\{cupom\}/g, (ctx as any).cupom || "VOLTASTH");
  msg = msg.replace(/\{update_label\}/g, (ctx as any).update_label || "uma atualização");
  return msg;
};

/** Build a wa.me URL with a properly normalized WhatsApp phone number. */
export const buildWhatsAppUrl = (phone: string, message: string): string | null => {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const fullPhone = raw.startsWith("+")
    ? digits
    : digits.startsWith("00") && digits.length > 11
      ? digits.slice(2)
      : digits.startsWith("55")
        ? digits
        : digits.length > 11 && !digits.startsWith("0")
          ? digits
          : `55${digits}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

/** Resolve, render and open WhatsApp. Returns true on success. */
export const sendSystemTemplate = async (
  key: SystemTemplateKey,
  ctx: TemplateContext,
  options?: { logHistory?: boolean; mode?: "auto" | "manual"; silent?: boolean }
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

  // Algumas mensagens devem sair pela linha "Fale com o Nutri" (W-API),
  // não pelo canal comercial Z-API. Mantém Z-API como padrão para o resto.
  const NUTRI_CHANNEL_KEYS: SystemTemplateKey[] = [
    "payment_welcome",
    "student_update_received",
    "diet_updated",
    "training_updated",
    "protocol_updated",
    "plan_updated",
    "content_all_ready",
    "lab_analysis_ready",
  ];

  // Override editável pelo admin: crm_settings.auto_channel_map = { [system_key]: 'zapi'|'wapi' }
  let resolvedChannel: "zapi" | "wapi" | "wapi_sucesso" =
    NUTRI_CHANNEL_KEYS.includes(key) ? "wapi" : "zapi";
  try {
    const { data: cfg } = await supabase
      .from("crm_settings").select("value").eq("key", "auto_channel_map").maybeSingle();
    const map = (cfg?.value || {}) as Record<string, "zapi" | "wapi" | "wapi_sucesso">;
    if (map[key]) resolvedChannel = map[key];
  } catch { /* fallback ao default */ }
  const fnName = resolvedChannel === "wapi_sucesso" ? "send-wapi-sucesso" : (resolvedChannel === "wapi" ? "send-wapi" : "send-whatsapp");

  // Try automatic send via the chosen channel edge function
  let autoOk = false;
  try {
    const { data, error } = await supabase.functions.invoke(fnName, {
      body: { phone: ctx.phone, message: finalMessage, image_url: tpl.image_url || null },
    });
    if (error) throw error;
    if (data?.ok) autoOk = true;
    else deliveryError = data?.error || "Falha no envio automático";
  } catch (err: any) {
    deliveryError = err?.message || String(err);
  }

  // Fallback to wa.me if automatic failed or explicit manual mode
  if ((!autoOk && !options?.silent) || options?.mode === "manual") {
    const fallbackMsg = tpl.image_url ? `${finalMessage}\n\n${tpl.image_url}` : finalMessage;
    const url = buildWhatsAppUrl(ctx.phone, fallbackMsg);
    if (url) window.open(url, "_blank");
    if (!autoOk) deliveryStatus = "failed";
  }
  if (!autoOk && options?.silent) {
    deliveryStatus = "failed";
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

  return {
    ok: options?.silent ? autoOk : true,
    templateId: tpl.id,
    message: finalMessage,
    reason: deliveryError || undefined,
  };
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
      "Olá {nome}! 🎉\n\nSeu pagamento foi aprovado e seu acesso ao *Programa de Acompanhamento STH METHOD* está liberado pelo prazo determinado do *{plano}* (até {vencimento}).\n\nDurante esse período, sua equipe técnica acompanha sua evolução pela plataforma.\n\nBora começar! 💪",
  },
  {
    key: "student_update_received",
    label: "Confirmação de atualização do aluno (automático)",
    description: "Enviado ao próprio aluno ativo quando ele envia novas fotos, documentos clínicos ou atualiza peso/medidas pela plataforma. Sai pelo canal Fale com o Nutri.",
    defaultContent:
      "Olá, {nome}! 👋\n\nRecebemos {update_label} na plataforma STH METHOD. ✅\n\nSeu nutri já foi avisado e fará contato em breve para falar sobre essa atualização.\n\nObrigado por manter sua evolução em dia! 💪",
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
      "Olá {nome}! ⏰\n\nSeu Programa de Acompanhamento STH METHOD encerra em {dias_restantes} dias ({vencimento}).\n\nPara manter o acesso à plataforma após a vigência, inicie um novo ciclo pelo link seguro:\n👉 {link}",
  },
  {
    key: "renewal_reminder",
    label: "Lembrete de Renovação (3 dias antes)",
    description: "Sugerido pelos Lembretes Inteligentes quando faltam 3 dias para o vencimento.",
    defaultContent:
      "{nome},\n\n👀 *Seu Programa está encerrando…*\n\nO prazo determinado do seu plano termina em {dias_restantes} dias ({vencimento}). Encerrada a vigência, o acesso à plataforma é encerrado automaticamente.\n\n👉 *Renove o ciclo agora:*\n{link_renovacao}\n\nBora manter o progresso ativo. 🚀",
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
      "Olá {nome}! Recebi seu cadastro 👍\n\nAssim que o pagamento do Programa de Acompanhamento for confirmado, libero seu acesso à plataforma pelo prazo determinado do plano escolhido.",
  },
  {
    key: "diet_updated",
    label: "Dieta atualizada (automático)",
    description: "Disparado automaticamente quando o admin salva/edita uma dieta para o aluno (se notificações estiverem ativas no perfil).",
    defaultContent:
      "🥗 Dieta pronta 👊\n\nAcesse a plataforma e siga conforme planejado em sthmethod.com.br",
  },
  {
    key: "training_updated",
    label: "Treino atualizado (automático)",
    description: "Disparado automaticamente quando o admin define/atualiza o treino ativo do aluno.",
    defaultContent:
      "Olá, {nome}!\n\nSeu treino de musculação já está liberado 💪\n\n📲 *App STH METHOD* — acompanhe seu treino, dieta, protocolo e evolução direto no seu celular:\n🤖 Android (APK): https://sthmethod.com.br/baixar-app\n🍏 iPhone: instale como *WebApp* pelo Safari em https://sthmethod.com.br/baixar-app (toque em *Compartilhar → Adicionar à Tela de Início*)\n\n🏋️ Para executar o treino com vídeos e cronômetro, use também o *App ST Coach*:\n📱 Android: https://play.google.com/store/apps/details?id=com.appsupercoach.app\n🍏 Apple: https://apps.apple.com/us/app/st-coach/id1537125272\n\n🔐 Acesso (todos):\nLogin: {email}\nSenha: 123456 ou a senha cadastrada\n\nConte Comigo!\nBora pra cima 🚀",
  },
  {
    key: "protocol_updated",
    label: "Protocolo atualizado (automático)",
    description: "Disparado automaticamente quando o admin salva/edita um protocolo para o aluno.",
    defaultContent:
      "🔥 Seu protocolo liberado 👊\n\n📲 Já pode acessar e iniciar sua execução em sthmethod.com.br",
  },
  {
    key: "plan_updated",
    label: "Plano atualizado (automático)",
    description: "Disparado quando o plano/assinatura do aluno é atualizado.",
    defaultContent:
      "Olá {nome}! ✨\n\nSeu *plano foi atualizado* na plataforma STH METHOD.\n\n👉 Acesse a plataforma para ver as novidades disponíveis no seu acesso.\n\nBons treinos! 💚",
  },
  {
    key: "content_all_ready",
    label: "Dieta + Treino + Protocolo prontos (automático)",
    description: "Mensagem combinada quando dieta, treino e protocolo são liberados juntos.",
    defaultContent:
      "🔥 Dieta, treino e protocolo prontos 👊\n\n📲 Acesse a plataforma e o app para iniciar sua execução em sthmethod.com.br\n\nBaixe App ST Coach (Treino)\nAndroid: https://play.google.com/store/apps/details?id=com.appsupercoach.app\niPhone: https://apps.apple.com/us/app/st-coach/id1537125272#?platform=iphone\n\n🔐 Login: seu e-mail\nSenha: 123456 ou a cadastrada 👊",
  },
  {
    key: "lab_analysis_ready",
    label: "Análise laboratorial liberada (automático)",
    description:
      "Disparado automaticamente quando o admin libera (Visível = sim) uma análise na Central de Análise.",
    defaultContent:
      "{nome},\n\nSua análise laboratorial já pode ser acessada pela plataforma STH METHOD. 🧪\n\n📲 Acesse:\n🌐 sthmethod.com.br\n\n👉 Vá até a área:\n*Central de Análise*\n\n⚠️ Importante:\nDependendo das informações identificadas nos exames, seu protocolo poderá ser atualizado de forma estratégica.\n\nCaso isso aconteça, você será notificado pela plataforma. 👊",
  },
  {
    key: "renewal_soft",
    label: "1ª cobrança — Amigável (D+0)",
    description: "Primeiro contato de renovação. Tom leve, acolhedor. Sempre com link de renovação.",
    defaultContent:
      "Oi {nome}! 👋\n\nO prazo determinado do seu Programa STH METHOD chegou ao fim há {dias_vencido} dias e o acesso à plataforma foi encerrado conforme o Termo de Adesão.\n\nQuer iniciar um novo ciclo e retomar o acompanhamento? 💪\n\n👉 Link seguro:\n{link_renovacao}",
  },
  {
    key: "renewal_objective",
    label: "2ª cobrança — Retorno leve (D+7)",
    description: "7 dias após a 1ª cobrança. Reforço de continuidade com link.",
    defaultContent:
      "Oi {nome}, tudo bem?\n\nSeu plano segue pausado há {dias_vencido} dias. Cada semana parada é evolução perdida — bora retomar?\n\n👉 Renove em 1 clique:\n{link_renovacao}",
  },
  {
    key: "renewal_recovery",
    label: "3ª cobrança — Cupom oportunidade (D+15)",
    description: "15 dias após o vencimento. Oferta com cupom + link.",
    defaultContent:
      "{nome}, separei algo especial pra você. 🎁\n\nUse o cupom *{cupom}* na sua renovação e volte com tudo pra STH METHOD.\n\n👉 Link de renovação com cupom já aplicado:\n{link_renovacao}",
  },
  {
    key: "renewal_last_contact",
    label: "4ª cobrança — Último contato (D+30)",
    description: "30 dias após o vencimento. Última abordagem direta.",
    defaultContent:
      "{nome}, este é nosso último contato ativo sobre sua renovação. 🙏\n\nSe quiser retomar sua evolução, é só clicar:\n👉 {link_renovacao}\n\nCaso prefira parar por aqui, sem problemas — sucesso na sua jornada. 💚",
  },
  {
    key: "renewal_reactivation",
    label: "5ª cobrança — Reativação (D+60)",
    description: "60 dias após o vencimento. Reaquece aluno antigo sem pressão.",
    defaultContent:
      "{nome}, muita coisa evoluiu aqui na STH METHOD nos últimos meses. ✨\n\nNovas estratégias, novas ferramentas, novos protocolos. Quer dar uma olhada no que está disponível agora?\n\n👉 Acesse e veja:\n{link_renovacao}",
  },
];
