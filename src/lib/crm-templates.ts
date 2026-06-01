import { supabase } from "@/integrations/supabase/client";

export interface TemplateContext {
  nome?: string | null;
  plano?: string | null;
  vencimento?: string | null; // dd/mm/yyyy
  valor?: string | null;
  dias_restantes?: number | string | null;
  link_renovacao?: string | null;
  email?: string | null;
  telefone?: string | null;
  [k: string]: any;
}

/** Substitui {variavel} (case-insensitive) pelos valores do contexto. */
export function renderTemplate(body: string, ctx: TemplateContext): string {
  if (!body) return "";
  return body.replace(/\{([a-z0-9_]+)\}/gi, (_m, key) => {
    const v = ctx?.[String(key).toLowerCase()];
    if (v === null || v === undefined || v === "") return "";
    return String(v);
  });
}

/** Carrega contexto padrão a partir do user_id (profile + assinatura ativa). */
export async function buildContextFromUser(userId: string): Promise<TemplateContext> {
  const ctx: TemplateContext = {};
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile) {
    ctx.nome = (profile as any).full_name?.split(" ")?.[0] || (profile as any).full_name || "";
    ctx.email = (profile as any).email || "";
    ctx.telefone = (profile as any).phone || "";
  }
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("end_date, plan_id, plans:plan_id(name, price)")
    .eq("user_id", userId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sub) {
    const end = new Date((sub as any).end_date);
    ctx.vencimento = end.toLocaleDateString("pt-BR");
    const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
    ctx.dias_restantes = days;
    const plan = (sub as any).plans;
    if (plan) {
      ctx.plano = plan.name;
      if (plan.price != null)
        ctx.valor = Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
  }
  ctx.link_renovacao = `${window.location.origin}/aluno/renovar`;
  return ctx;
}

export const TEMPLATE_CATEGORIES = [
  { value: "saudacao", label: "Saudação" },
  { value: "planos", label: "Apresentação de planos" },
  { value: "como_funciona", label: "Como funciona" },
  { value: "duvidas", label: "Dúvidas" },
  { value: "campanha", label: "Campanha" },
  { value: "cobranca", label: "Cobrança" },
  { value: "renovacao", label: "Renovação" },
  { value: "oferta", label: "Oferta" },
  { value: "tarefa", label: "Tarefa" },
  { value: "lembrete_vencimento", label: "Lembrete de vencimento" },
  { value: "lembrete_ciclo", label: "Lembrete de ciclo" },
  { value: "automacao", label: "Automação" },
  { value: "outro", label: "Outro" },
] as const;

export const AVAILABLE_VARIABLES = [
  { key: "nome", desc: "Primeiro nome do aluno" },
  { key: "plano", desc: "Nome do plano atual" },
  { key: "vencimento", desc: "Data de vencimento (dd/mm/aaaa)" },
  { key: "valor", desc: "Preço do plano (R$)" },
  { key: "dias_restantes", desc: "Dias até vencer" },
  { key: "link_renovacao", desc: "Link de renovação" },
  { key: "email", desc: "E-mail do aluno" },
  { key: "telefone", desc: "Telefone do aluno" },
];