// Motor de respostas LOCAL da STH METHOD — gratuito, sem IA paga.
// Detecta intenção por palavras-chave e devolve resposta padronizada.

export type LocalContext = {
  name?: string | null;
  status?: string | null;        // active | expired | lead | pending ...
  planName?: string | null;
  endDate?: string | null;
  phone?: string | null;
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

function planosBlock(): string {
  return [
    "*Planos STH METHOD*",
    "",
    "• *30D* — Destravar. Organizar. Acelerar.",
    "• *90D* — Evolução estruturada e resultados sustentáveis.",
    "• *6M* — Transformação completa por fases.",
    "",
    `Veja valores e contrate em: ${SITE}`,
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
    reply: (c) =>
      `${hi(c)} Sou o assistente da *STH METHOD*. Posso te ajudar com:\n` +
      `• Planos e valores\n• Cadastro e pagamento\n• Renovação\n• Envio de exames\n• Suporte da plataforma\n\nO que você precisa agora?`,
  },
  {
    intent: "valores_planos",
    match: (t) =>
      /\b(valor|valores|preco|precos|quanto custa|plano|planos|investimento|mensalidade)\b/.test(t),
    reply: () => planosBlock(),
  },
  {
    intent: "cupom",
    match: (t) => /\b(cupom|desconto|promocao|promo)\b/.test(t),
    reply: () =>
      `Temos cupons ativos em campanhas específicas. Acesse ${SITE}, escolha o plano e aplique o cupom na finalização. Posso te ajudar a escolher o plano ideal?`,
  },
  {
    intent: "cadastro",
    match: (t) => /\b(cadastro|cadastrar|criar conta|me inscrever|inscricao)\b/.test(t),
    reply: () =>
      `Para começar: acesse ${SITE}, escolha seu plano e finalize o cadastro. Em seguida você receberá acesso à plataforma e ao onboarding.`,
  },
  {
    intent: "pagamento",
    match: (t) => /\b(pagamento|pagar|pix|cartao|boleto|comprovante|paguei)\b/.test(t),
    reply: () =>
      `Aceitamos *Pix* (aprovação imediata) e *cartão* (até 12x em planos elegíveis). Se já efetuou o pagamento, envie o comprovante por aqui que validamos em instantes.`,
  },
  {
    intent: "renovacao",
    match: (t) => /\b(renov|renovar|renovacao|continuar|continuidade)\b/.test(t),
    reply: (c) => {
      if (c.status === "expired") {
        return `${hi(c)} Identifiquei que seu plano (${c.planName || "—"}) está *vencido*. Você pode renovar agora com cupom de retorno em ${SITE}/student/renew — quer que eu te envie o link direto?`;
      }
      if (c.endDate) {
        return `${hi(c)} Seu plano *${c.planName || ""}* vence em *${c.endDate}*. A renovação pode ser feita a qualquer momento em ${SITE}/student/renew.`;
      }
      return `A renovação é feita em ${SITE}/student/renew. Posso te enviar o link com cupom ativo, se quiser.`;
    },
  },
  {
    intent: "exames",
    match: (t) => /\b(exame|exames|laboratorio|sangue|resultado|hormonio|hormonios)\b/.test(t),
    reply: () =>
      `Para enviar exames:\n1. Acesse ${SITE}\n2. Menu *Atualização* → *Dados Clínicos*\n3. Faça upload do *PDF completo*\n\nSe o exame ainda estiver incompleto, aguarde a liberação total antes de enviar.`,
  },
  {
    intent: "treino",
    match: (t) => /\b(treino|treinos|musculacao|academia|ficha de treino|guiado)\b/.test(t),
    reply: () =>
      `Seu treino guiado fica em *Plataforma → Treino*. Cada exercício tem vídeo, séries e repetições. Dúvidas específicas posso encaminhar ao time técnico.`,
  },
  {
    intent: "dieta",
    match: (t) => /\b(dieta|cardapio|alimentacao|refeicao|refeicoes|nutricao|nutri)\b/.test(t),
    reply: () =>
      `Sua dieta personalizada fica em *Plataforma → Dieta*, com macros, refeições e substituições. Atualizações são feitas via *Atualização de Rotina*.`,
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
      `Sinto muito por essa intenção. Antes de cancelar, posso oferecer um *cupom de retenção* e revisar sua estratégia. Quer tentar?`,
  },
  {
    intent: "humano",
    match: (t) => /\b(humano|atendente|pessoa|falar com alguem|suporte humano)\b/.test(t),
    reply: () =>
      `Claro! Vou registrar seu pedido e a equipe humana retorna em instantes. Pode adiantar o assunto?`,
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

export function localRespond(
  userText: string,
  ctx: LocalContext,
  customRules: CustomRule[] = [],
): { reply: string; intent: string; ruleId?: string; attachments?: Attachment[] } {
  const t = norm(userText || "");

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

  // Fallback inteligente
  const fallback =
    `${hi(ctx)} Recebi sua mensagem. Para te ajudar melhor, posso te orientar sobre:\n\n` +
    `• *Planos e valores*\n• *Cadastro e pagamento*\n• *Renovação*\n• *Envio de exames*\n• *Treino e dieta*\n\n` +
    `Me diz com qual desses tópicos posso começar — ou acesse ${SITE}.`;
  return { reply: fallback, intent: "fallback" };
}