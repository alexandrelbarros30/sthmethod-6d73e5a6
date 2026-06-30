// Motor de respostas LOCAL da STH METHOD — gratuito, sem IA paga.
// Detecta intenção por palavras-chave e devolve resposta padronizada.

export type LocalContext = {
  name?: string | null;
  status?: string | null;        // active | expired | lead | pending ...
  planName?: string | null;
  endDate?: string | null;
  phone?: string | null;
  recentHistory?: Array<{ role: 'user' | 'assistant'; content: string; intent?: string | null }>;
  lastIntent?: string | null;
  assistantName?: string | null;
  contactType?: 'aluno_ativo' | 'aluno_inativo' | 'novo_cliente';
  fallbackEnabled?: boolean;
  fallbackMessage?: string | null;
  /** Templates operacionais do CRM (tabela crm_op_templates) injetados pelo caller.
   *  Chave: `${channel}:${category}` (ex: "sth_one:boas_vindas", "both:ausencia").
   *  Quando presente, sobrepõe textos hardcoded de saudação/fallback. */
  opTemplates?: Record<string, string>;
};

export type Attachment = { url: string; kind: 'image' | 'document'; name?: string };

export type CustomRule = {
  id?: string;
  label?: string;
  keywords: string[];
  reply: string;
  priority?: number;
  attachments?: Attachment[];
};

const SITE = "https://sthmethod.com.br";
const CADASTRO = `${SITE}/cadastro`;
const RENEW = `${SITE}/student/renew`;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function hi(ctx: LocalContext): string {
  if (ctx.name) {
    const first = ctx.name.split(/\s+/)[0];
    return `Olá, ${first}!`;
  }
  return "Olá!";
}

/** Procura um template operacional na ordem: canal específico → 'both'. */
export function pickOpTemplate(
  ctx: LocalContext,
  category: string,
  preferChannel: 'sth_one' | 'fale_nutri' = 'sth_one',
): string | null {
  const m = ctx.opTemplates || {};
  return m[`${preferChannel}:${category}`] || m[`both:${category}`] || null;
}

function assistantName(ctx: LocalContext): string {
  return (ctx.assistantName || 'STH One').trim() || 'STH One';
}

// Detecta sentimento negativo (frustração/impaciência) para reduzir venda e priorizar acolhimento
function detectNegativeSentiment(t: string): boolean {
  return /\b(nao funciona|nao consigo|absurdo|demor|cade|caralh|porra|merda|horrivel|pessim|raiva|irritad|cansad|impacien|reclam|insatisf|decepcion|furios|desisti|pelo amor)\b/.test(t);
}

// Detecta se o aluno já recebeu apresentação recente (evita repetir)
function alreadyGreeted(ctx: LocalContext): boolean {
  return (ctx.recentHistory || []).some(
    (m) => m.role === 'assistant' && /STH METHOD funciona de forma estrat/.test(m.content),
  );
}

function statusLine(ctx: LocalContext): string {
  if (ctx.status === 'active') return `Seu plano *${ctx.planName || ''}* segue ativo${ctx.endDate ? ` até *${ctx.endDate}*` : ''}.`;
  if (ctx.status === 'expired') return `Seu plano *${ctx.planName || ''}* está vencido — conseguimos retomar exatamente de onde parou.`;
  if (ctx.status === 'pending') return `Identifiquei uma pendência no seu plano *${ctx.planName || ''}*. Posso te ajudar a regularizar agora.`;
  return '';
}

function planosBlock(): string {
  return [
    "*Planos STH METHOD*",
    "",
    "• *30D* — Plano ideal para destravar, organizar e acelerar.",
    "• *90D* — Estrutura mais ampla para evolução contínua.",
    "• *6M* — Transformação completa com estratégia por fases.",
    "",
    "Todos incluem: dieta, treino guiado, protocolo, suporte ativo e análise de exames trazidos pelo aluno.",
    "",
    "⚠️ A *requisição (pedido) de exames* é um serviço adicional com custo à parte — não está incluída em nenhum plano e, no momento, está *temporariamente suspensa*.",
    "",
    `Acesse e contrate em: ${SITE}`,
  ].join("\n");
}

type Rule = {
  intent: string;
  match: (t: string) => boolean;
  reply: (ctx: LocalContext) => string;
};

const RULES: Rule[] = [
  {
    intent: "saudacao",
    match: (t) => /\b(oi|ola|bom dia|boa tarde|boa noite|hey|opa|e ai)\b/.test(t),
    reply: (c) => {
      if (alreadyGreeted(c)) {
        return `${hi(c)} Sigo por aqui. O que você precisa agora?`;
      }
      // Template operacional do CRM (boas_vindas) — sobrepõe hardcoded
      const preferChan = c.contactType === 'aluno_ativo' ? 'fale_nutri' : 'sth_one';
      const tpl = pickOpTemplate(c, 'boas_vindas', preferChan);
      if (tpl) return renderTemplate(tpl, c);
      if (c.status === 'active') {
        return `${hi(c)} ${statusLine(c)}\n\nSe precisar de atualização, ajustes, exames ou suporte — é só me chamar.`;
      }
      if (c.status === 'expired') {
        return `${hi(c)} ${statusLine(c)}\n\nQuer que eu te envie as condições de retorno?`;
      }
      if (c.name) {
        return `${hi(c)} Sou o assistente da *STH METHOD*. Posso te ajudar com planos, cadastro, exames ou suporte — por onde começamos?`;
      }
      return [
        `${hi(c)} 👋`,
        ``,
        `Eu sou o *${assistantName(c)}*, assistente inteligente oficial da *STH METHOD*.`,
        ``,
        `Você recebe:`,
        `• Dieta personalizada`,
        `• Treino guiado`,
        `• Protocolo estratégico`,
        `• Suporte ativo`,
        `• Análise de exames`,
        ``,
        `Tudo organizado pela própria plataforma: ${SITE}`,
      ].join('\n');
    },
  },
  {
    intent: "valores_planos",
    match: (t) =>
      /\b(valor|valores|preco|precos|quanto custa|plano|planos|investimento|mensalidade)\b/.test(t),
    reply: (c) => {
      const continuity = c.lastIntent === 'valores_planos' ? `Você estava analisando os planos. ` : '';
      return `${continuity}${planosBlock()}`;
    },
  },
  {
    intent: "cupom",
    match: (t) => /\b(cupom|desconto|promocao|promo)\b/.test(t),
    reply: () =>
      `Cupons ativos no momento:\n\n• *STH15*\n• *DESFOCADOS30*\n• *DESFOCADOS90*\n\nVálidos para pagamento via *Pix*. Aplique na finalização em ${SITE}.`,
  },
  {
    intent: "cadastro",
    match: (t) => /\b(cadastro|cadastrar|criar conta|me inscrever|inscricao)\b/.test(t),
    reply: () =>
      `Você pode iniciar pelo cadastro oficial:\n\n${CADASTRO}\n\nEtapas:\n1. Dados básicos\n2. Rotina\n3. Objetivos\n4. Fotos\n5. Exames\n6. Pagamento`,
  },
  {
    intent: "pagamento",
    match: (t) => /\b(pagamento|pagar|pix|cartao|boleto|comprovante|paguei)\b/.test(t),
    reply: () =>
      `Aceitamos *Pix* (aprovação imediata) e *cartão* (até 12x em planos elegíveis). Se já efetuou o pagamento, envie o comprovante por aqui que validamos em instantes.`,
  },
  {
    intent: "cobranca",
    match: (t) => /\b(cobranca|pendencia|pendente|em aberto|inadimplen|fatura|boleto vencido)\b/.test(t),
    reply: (c) =>
      `Identificamos uma pendência no plano atual${c.planName ? ` (*${c.planName}*)` : ''}. Posso te ajudar a regularizar agora — prefere via Pix ou cartão?`,
  },
  {
    intent: "renovacao",
    match: (t) => /\b(renov|renovar|renovacao|continuar|continuidade)\b/.test(t),
    reply: (c) => {
      if (c.status === "expired") {
        return `${hi(c)} Seu acesso (${c.planName || "—"}) expirou — mas conseguimos continuar exatamente de onde parou.\n\nRenove em: ${RENEW}`;
      }
      if (c.endDate) {
        return `${hi(c)} Seu acompanhamento *${c.planName || ""}* está próximo do vencimento (*${c.endDate}*).\n\nSe desejar continuar sua evolução, posso te enviar as condições atuais: ${RENEW}`;
      }
      return `A renovação é feita em ${RENEW}. Posso te enviar o link com cupom ativo, se quiser.`;
    },
  },
  {
    intent: "exames",
    match: (t) => /\b(exame|exames|laboratorio|sangue|resultado|hormonio|hormonios)\b/.test(t),
    reply: () =>
      `Sobre exames:\n\n• *Análise dos seus exames* — incluída no plano. Envie em ${SITE} → *Atualização* → *Dados Clínicos* (PDF), com o laudo completo.\n• *Requisição (pedido) de exames* — é um *serviço adicional*, com *custo à parte*, e *não* faz parte de nenhum plano.\n\n⚠️ No momento, o serviço adicional de *requisição de exames está temporariamente suspenso* e não está disponível para contratação. Sem previsão de retorno — assim que reabrir, avisaremos por aqui.`,
  },
  {
    intent: "treino",
    match: (t) => /\b(treino|treinos|musculacao|academia|ficha de treino|guiado)\b/.test(t),
    reply: () =>
      `O treino fica disponível no *app com execução guiada e vídeos*. Acesse em *Plataforma → Treino*.`,
  },
  {
    intent: "dieta",
    match: (t) => /\b(dieta|cardapio|alimentacao|refeicao|refeicoes|nutricao|nutri)\b/.test(t),
    reply: () =>
      `Sua dieta personalizada fica em *Plataforma → Dieta*, com macros, refeições e substituições. Atualizações são feitas via *Atualização de Rotina*.`,
  },
  {
    intent: "protocolo",
    match: (t) => /\b(protocolo|estrategia|estrategico|fases|fase)\b/.test(t),
    reply: () =>
      `Seu protocolo estratégico fica em *Plataforma → Protocolo*, organizado por fases e pilares. Cada fase tem orientações específicas e check-in.`,
  },
  {
    intent: "atualizacao",
    match: (t) => /\b(atualizacao|atualizar rotina|update|mudar rotina|mudei|mudou)\b/.test(t),
    reply: () =>
      `Atualizações de rotina (peso, treino, alimentação) são feitas em *Plataforma → Atualização de Rotina*. Vou verificar isso rapidamente assim que você enviar.`,
  },
  {
    intent: "tirzepatida",
    match: (t) => /\b(tirzepatida|mounjaro|ozempic|glp|semaglutida|peptide|peptideo|peptideos)\b/.test(t),
    reply: () =>
      `Trabalhamos protocolos estratégicos com acompanhamento individual. *Não fazemos prescrição por mensagem.* Quer que eu te encaminhe ao Nutri Alexandre para uma avaliação?`,
  },
  {
    intent: "cancelar",
    match: (t) => /\b(cancelar|cancelamento|desistir|sair|encerrar)\b/.test(t),
    reply: () =>
      `Entendo. Antes de encerrar, posso revisar sua estratégia e oferecer um *cupom de retenção*. Vamos conversar?`,
  },
  {
    intent: "humano",
    match: (t) => /\b(humano|atendente|pessoa|falar com alguem|suporte humano|consultor|alexandre)\b/.test(t),
    reply: () =>
      `Vou direcionar isso para o consultor responsável. Pode me adiantar o assunto enquanto te conecto?`,
  },
  {
    intent: "agradecimento",
    match: (t) => /\b(obrigad|valeu|grato|grata|show|perfeito|otimo)\b/.test(t),
    reply: () => `Eu que agradeço! Qualquer coisa, é só chamar. 💪`,
  },
];

function renderTemplate(tpl: string, ctx: LocalContext): string {
  const first = ctx.name ? ctx.name.split(/\s+/)[0] : "";
  return tpl
    .replace(/\{nome\}/gi, first || "")
    .replace(/\{plano\}/gi, ctx.planName || "—")
    .replace(/\{status\}/gi, ctx.status || "—")
    .replace(/\{vencimento\}/gi, ctx.endDate || "—")
    .replace(/\{site\}/gi, SITE);
}

export { renderTemplate };

export function localRespond(
  userText: string,
  ctx: LocalContext,
  customRules: CustomRule[] = [],
): { reply: string; intent: string; ruleId?: string; attachments?: Attachment[] } {
  const t = norm(userText || "");

  // [exposed below as matchCustomRule for híbrido Gemini]

  // 0) Sentimento negativo — acolhimento antes de qualquer venda
  if (detectNegativeSentiment(t)) {
    const empath = `${hi(ctx)} Entendo, vamos resolver isso primeiro. Me conta rapidamente o que aconteceu para eu te ajudar da melhor forma.`;
    return { reply: empath, intent: 'sentimento_negativo' };
  }

  // 1) Regras customizadas (Centro de Treinamento) — prioridade menor = mais alta
  const sorted = [...customRules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const r of sorted) {
    const kws = (r.keywords || []).map((k) => norm(k)).filter(Boolean);
    if (kws.length === 0) continue;
    if (kws.some((k) => t.includes(k))) {
      return {
        reply: renderTemplate(r.reply, ctx),
        intent: r.label || "custom",
        ruleId: r.id,
        attachments: r.attachments || [],
      };
    }
  }

  for (const r of RULES) {
    if (r.match(t)) {
      return { reply: r.reply(ctx), intent: r.intent };
    }
  }

  // Fallback inteligente — contextualizado pelo status do contato
  // Se admin desligou o fallback, devolvemos silêncio (caller decide o que fazer)
  if (ctx.fallbackEnabled === false) {
    return { reply: '', intent: 'silent' };
  }
  // Mensagem customizada do admin tem prioridade sobre o menu fixo
  if (ctx.fallbackMessage && ctx.fallbackMessage.trim().length > 0) {
    return { reply: renderTemplate(ctx.fallbackMessage, ctx), intent: 'fallback_custom' };
  }
  let fallback: string;
  if (ctx.status === 'active') {
    fallback = `${hi(ctx)} ${statusLine(ctx)}\n\nMe conta rapidamente o que precisa: *atualização*, *exames*, *treino*, *dieta* ou *suporte*?`;
  } else if (ctx.status === 'expired') {
    fallback = `${hi(ctx)} ${statusLine(ctx)}\n\nQuer que eu te envie o link de renovação?`;
  } else if (ctx.name) {
    fallback = `${hi(ctx)} Já localizei seu cadastro. Posso te orientar sobre *planos*, *pagamento*, *exames* ou *suporte* — por onde começamos?`;
  } else {
    fallback = `${hi(ctx)} Recebi sua mensagem. Posso te orientar sobre:\n\n• *Planos e valores*\n• *Cadastro e pagamento*\n• *Renovação*\n• *Envio de exames*\n• *Treino e dieta*\n\nMe diz por onde começar — ou acesse ${SITE}.`;
  }
  return { reply: fallback, intent: "fallback" };
}

// Tenta casar APENAS regras customizadas (sem fallback genérico).
// Usado no motor Gemini para garantir respostas fixas com anexos quando há match.
export function matchCustomRule(
  userText: string,
  ctx: LocalContext,
  customRules: CustomRule[] = [],
): { reply: string; intent: string; ruleId?: string; attachments?: Attachment[] } | null {
  const t = norm(userText || "");
  const sorted = [...customRules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const r of sorted) {
    const kws = (r.keywords || []).map((k) => norm(k)).filter(Boolean);
    if (kws.length === 0) continue;
    if (kws.some((k) => t.includes(k))) {
      return {
        reply: renderTemplate(r.reply, ctx),
        intent: r.label || "custom",
        ruleId: r.id,
        attachments: r.attachments || [],
      };
    }
  }
  return null;
}