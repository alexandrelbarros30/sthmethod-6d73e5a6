import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Risk = "baixo" | "medio" | "alto";
type Action = "manter" | "consolidar" | "ocultar" | "remover";
type Status = "pendente" | "em_andamento" | "concluido" | "ignorado";
type ItemType = "tela" | "tabela" | "campo" | "componente" | "rota" | "fluxo" | "edge_function";

interface AuditItem {
  id: string;
  title: string;
  types: ItemType[];
  duplication: string;
  recommendation: Action;
  risk: Risk;
  note: string;
  affected: string[];
}

const ITEMS: AuditItem[] = [
  {
    id: "DUP-01",
    title: "AdminAtendimento vs AdminFaleNutri",
    types: ["tela", "fluxo", "tabela"],
    duplication:
      "Duas caixas de entrada paralelas para o mesmo número do canal Fale com o Nutri: AdminFaleNutri usa nutri_conversations/nutri_messages (legado); AdminAtendimento já tem o canal fale_nutri com crm_tickets/crm_ticket_messages.",
    recommendation: "remover",
    risk: "alto",
    note: "Migrar histórico nutri_messages → crm_ticket_messages antes de remover. Portar seletor de engine (personal/template/gemini/hybrid) para AdminMotorRespostaApis. Sidebar já marca como '(antigo)'.",
    affected: ["/admin/fale-nutri", "nutri_conversations", "nutri_messages", "nutri_templates"],
  },
  {
    id: "DUP-02",
    title: "Três webhooks de inbound WhatsApp",
    types: ["edge_function", "fluxo"],
    duplication:
      "crm-inbound (novo, multi-provider), wapi-inbound-nutri (legado → nutri_*) e whatsapp-inbound-ai (Z-API → auto-reply Gemini) recebem mensagens em paralelo, gravando em tabelas diferentes.",
    recommendation: "consolidar",
    risk: "alto",
    note: "Unificar em crm-inbound. Exige atualizar URLs nos painéis W-API, Z-API e Evolution — qualquer erro causa perda de mensagens.",
    affected: ["crm-inbound", "wapi-inbound-nutri", "whatsapp-inbound-ai"],
  },
  {
    id: "DUP-03",
    title: "Quatro funções de envio WhatsApp",
    types: ["edge_function"],
    duplication:
      "send-whatsapp (Z-API), send-wapi (W-API), crm-send (multi-provider) e evolution-whatsapp coexistem. send-whatsapp e send-wapi têm contrato quase idêntico.",
    recommendation: "consolidar",
    risk: "medio",
    note: "Migrar callers de send-whatsapp/send-wapi para crm-send. Manter evolution-whatsapp para gestão de instância (não envio produtivo).",
    affected: ["send-whatsapp", "send-wapi", "crm-send", "billing-auto-dispatch", "AdminBilling", "AdminFaleNutri"],
  },
  {
    id: "DUP-04",
    title: "Quatro sistemas de templates de mensagem",
    types: ["tabela", "tela"],
    duplication:
      "crm_templates (campanhas), crm_op_templates (respostas rápidas), nutri_templates (legado) e message_templates/message_categories (envio manual) — quatro CRUDs independentes.",
    recommendation: "consolidar",
    risk: "medio",
    note: "Consolidar em 2: crm_templates (campanhas/automações) + crm_op_templates (respostas de ticket). Mapear schemas e variáveis dinâmicas ({nome}, {plano}).",
    affected: ["crm_templates", "crm_op_templates", "nutri_templates", "message_templates"],
  },
  {
    id: "DUP-05",
    title: "AdminWhatsApp vs AdminMotorRespostaApis",
    types: ["tela", "rota"],
    duplication:
      "AdminWhatsApp é uma tela exclusiva de pareamento QR da Evolution. AdminMotorRespostaApis já gerencia canais (inclusive Evolution) com QR, credenciais e status via api_channels.",
    recommendation: "remover",
    risk: "baixo",
    note: "Sem dados próprios, rota já órfã na sidebar. Integrar bloco de QR/pairing como modal dentro de AdminMotorRespostaApis. AdminWhatsApp usa hardcode INSTANCE='atendimento'.",
    affected: ["/admin/whatsapp", "evolution-whatsapp"],
  },
  {
    id: "DUP-06",
    title: "AdminQueue vs Kanban dentro de AdminAtendimento",
    types: ["tela", "componente", "fluxo"],
    duplication:
      "Ambos são chamados de 'fila de atendimento' pelo usuário. ServiceQueue (alunos por prioridade de rotina) ≠ KanbanPanel (tickets CRM por status).",
    recommendation: "manter",
    risk: "baixo",
    note: "Objetos distintos — manter ambos. Renomear AdminQueue para 'Agenda Operacional' e documentar a distinção.",
    affected: ["/admin/queue", "/admin/atendimento"],
  },
  {
    id: "DUP-07",
    title: "Toggle de automação compartilhado billing/CRM",
    types: ["tabela", "fluxo"],
    duplication:
      "crm-scheduler e billing-auto-dispatch leem o mesmo billing_automation.enabled. Pausar cobranças pausa também campanhas CRM, sem feedback visível.",
    recommendation: "consolidar",
    risk: "medio",
    note: "Adicionar colunas separadas crm_enabled e billing_enabled na tabela (ou renomear para automation_control). Risco: bug silencioso.",
    affected: ["billing_automation", "crm-scheduler", "billing-auto-dispatch"],
  },
  {
    id: "DUP-08",
    title: "AdminMessages vs AdminCRM (disparo manual)",
    types: ["tela", "fluxo"],
    duplication:
      "AdminMessages envia mensagens individuais/massa com templates próprios. AdminCRM faz campanhas em massa com templates próprios. Ambos gravam em message_history. O usuário tem dois caminhos para a mesma ação.",
    recommendation: "consolidar",
    risk: "medio",
    note: "Absorver AdminMessages como aba 'Disparo Manual' do AdminCRM. Avaliar antes: role admin_viewer só tem acesso a AdminMessages na sidebar.",
    affected: ["/admin/messages", "/admin/crm", "message_history"],
  },
  {
    id: "DUP-09",
    title: "Dois+ motores de IA para resposta WhatsApp",
    types: ["edge_function", "fluxo"],
    duplication:
      "whatsapp-inbound-ai (Z-API → Gemini via Lovable Gateway), nutri-ai-reply (W-API → Gemini direto) e AdminAIAssistant (ai_assistant_config) — três conjuntos de prompts e tabelas distintos.",
    recommendation: "consolidar",
    risk: "alto",
    note: "Após DUP-01 resolvido: crm-inbound → lê config do canal em api_channels → chama ai-assistant-chat com super-prompt único. Deprecar nutri-ai-reply e whatsapp-inbound-ai.",
    affected: ["nutri-ai-reply", "whatsapp-inbound-ai", "ai-assistant-chat", "ai_assistant_config"],
  },
  {
    id: "DUP-10",
    title: "AdminTeleatendimento órfão",
    types: ["tela", "rota"],
    duplication:
      "Rota /admin/teleatendimento existe mas não aparece em nenhuma sidebar (admin, consultor, financeiro). Página inacessível por navegação normal.",
    recommendation: "ocultar",
    risk: "baixo",
    note: "Definir destino: adicionar link de sidebar se vai a produção, ou ocultar/remover se incompleto. Há StudentConsultas no lado aluno.",
    affected: ["/admin/teleatendimento"],
  },
];

const riskMeta: Record<Risk, { label: string; classes: string; Icon: any }> = {
  baixo: { label: "Risco baixo", classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", Icon: ShieldCheck },
  medio: { label: "Risco médio", classes: "border-amber-500/30 bg-amber-500/10 text-amber-400", Icon: AlertTriangle },
  alto: { label: "Risco alto", classes: "border-rose-500/30 bg-rose-500/10 text-rose-400", Icon: AlertOctagon },
};

const actionMeta: Record<Action, { label: string; classes: string }> = {
  manter: { label: "Manter", classes: "bg-muted text-foreground" },
  consolidar: { label: "Consolidar", classes: "bg-primary/15 text-primary border border-primary/30" },
  ocultar: { label: "Ocultar", classes: "bg-amber-500/10 text-amber-400 border border-amber-500/30" },
  remover: { label: "Remover", classes: "bg-rose-500/10 text-rose-400 border border-rose-500/30" },
};

const statusMeta: Record<Status, { label: string; classes: string }> = {
  pendente: { label: "Pendente", classes: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em andamento", classes: "bg-primary/15 text-primary" },
  concluido: { label: "Concluído", classes: "bg-emerald-500/15 text-emerald-400" },
  ignorado: { label: "Ignorado", classes: "bg-zinc-700/40 text-zinc-400" },
};

const typeLabel: Record<ItemType, string> = {
  tela: "Tela",
  tabela: "Tabela",
  campo: "Campo",
  componente: "Componente",
  rota: "Rota",
  fluxo: "Fluxo",
  edge_function: "Edge Function",
};

const STORAGE_KEY = "sth_crm_audit_state_v1";

type RowState = { status: Status; obs: string };

function loadState(): Record<string, RowState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(state: Record<string, RowState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const AdminCrmAuditoria = () => {
  const [state, setState] = useState<Record<string, RowState>>(() => loadState());
  const [filterRisk, setFilterRisk] = useState<"all" | Risk>("all");
  const [filterAction, setFilterAction] = useState<"all" | Action>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const update = (id: string, patch: Partial<RowState>) => {
    setState((prev) => {
      const base: RowState = { status: "pendente", obs: "" };
      const next: Record<string, RowState> = { ...prev, [id]: { ...base, ...(prev[id] || {}), ...patch } };
      saveState(next);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return ITEMS.filter((it) => {
      if (filterRisk !== "all" && it.risk !== filterRisk) return false;
      if (filterAction !== "all" && it.recommendation !== filterAction) return false;
      if (!s) return true;
      return [it.title, it.duplication, it.note, it.id, ...it.affected].some((t) => t.toLowerCase().includes(s));
    });
  }, [filterRisk, filterAction, search]);

  const counts = useMemo(() => {
    const total = ITEMS.length;
    const byRisk = { alto: 0, medio: 0, baixo: 0 } as Record<Risk, number>;
    const byAction = { manter: 0, consolidar: 0, ocultar: 0, remover: 0 } as Record<Action, number>;
    let done = 0;
    for (const it of ITEMS) {
      byRisk[it.risk]++;
      byAction[it.recommendation]++;
      if ((state[it.id]?.status || "pendente") === "concluido") done++;
    }
    return { total, byRisk, byAction, done };
  }, [state]);

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Limpeza e Consolidação do CRM", "");
    lines.push(`Total: ${counts.total} · Concluídos: ${counts.done}`, "");
    lines.push("| ID | Item | Tipo | Ação | Risco | Status | Observação |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const it of ITEMS) {
      const st = state[it.id] || { status: "pendente", obs: "" };
      lines.push(
        `| ${it.id} | ${it.title} | ${it.types.map((t) => typeLabel[t]).join(", ")} | ${actionMeta[it.recommendation].label} | ${riskMeta[it.risk].label} | ${statusMeta[st.status].label} | ${(st.obs || "").replace(/\|/g, "\\|")} |`,
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "limpeza-consolidacao-crm.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin" title="Limpeza e Consolidação do CRM" subtitle="Auditoria de duplicidades">
      <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Auditoria interna
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mt-1">
              Limpeza e Consolidação do CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Mapa de duplicidades de telas, tabelas, edge functions e fluxos do módulo de atendimento.
              Nada é removido automaticamente — registre a decisão por item e exporte para acompanhar.
            </p>
          </div>
          <Button variant="outline" onClick={exportMarkdown}>Exportar relatório (.md)</Button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Itens analisados" value={counts.total} />
          <StatCard label="Risco alto" value={counts.byRisk.alto} tone="rose" />
          <StatCard label="A consolidar" value={counts.byAction.consolidar} tone="primary" />
          <StatCard label="Concluídos" value={counts.done} tone="emerald" />
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-base">Itens</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-44"
                />
                <Select value={filterRisk} onValueChange={(v: any) => setFilterRisk(v)}>
                  <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Risco" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os riscos</SelectItem>
                    <SelectItem value="alto">Risco alto</SelectItem>
                    <SelectItem value="medio">Risco médio</SelectItem>
                    <SelectItem value="baixo">Risco baixo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAction} onValueChange={(v: any) => setFilterAction(v)}>
                  <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Ação" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="manter">Manter</SelectItem>
                    <SelectItem value="consolidar">Consolidar</SelectItem>
                    <SelectItem value="ocultar">Ocultar</SelectItem>
                    <SelectItem value="remover">Remover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {filtered.map((it) => {
              const st = state[it.id] || { status: "pendente" as Status, obs: "" };
              const open = expanded[it.id];
              const Risk = riskMeta[it.risk].Icon;
              return (
                <div key={it.id} className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [it.id]: !e[it.id] }))}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
                  >
                    <div className="pt-0.5">
                      {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{it.id}</span>
                        <span className="font-medium text-sm md:text-base">{it.title}</span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{it.duplication}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {it.types.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{typeLabel[t]}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border", riskMeta[it.risk].classes)}>
                        <Risk className="w-3 h-3" /> {riskMeta[it.risk].label}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", actionMeta[it.recommendation].classes)}>
                        {actionMeta[it.recommendation].label}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", statusMeta[st.status].classes)}>
                        {statusMeta[st.status].label}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 bg-background/40">
                      <div className="pt-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Duplicidade encontrada</div>
                        <p className="text-sm">{it.duplication}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Observação técnica</div>
                        <p className="text-sm text-muted-foreground">{it.note}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Afetados</div>
                        <div className="flex flex-wrap gap-1.5">
                          {it.affected.map((a) => (
                            <code key={a} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground/80">{a}</code>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[180px,1fr] gap-3 pt-2 border-t border-border/40">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</div>
                          <Select value={st.status} onValueChange={(v: Status) => update(it.id, { status: v })}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em_andamento">Em andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="ignorado">Ignorado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Observações da equipe</div>
                          <Textarea
                            value={st.obs}
                            onChange={(e) => update(it.id, { obs: e.target.value })}
                            placeholder="Decisão tomada, responsável, data prevista..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhum item para os filtros atuais.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Regras de preservação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1.5">
            <p>• Tickets, mensagens, contatos, logs e credenciais sensíveis nunca devem ser apagados sem confirmação.</p>
            <p>• Campos com dados existentes precisam ser migrados antes de qualquer remoção.</p>
            <p>• Em caso de dúvida ou risco de quebra, apenas <strong>ocultar</strong> a tela/função — não excluir.</p>
            <p>• Fluxo principal a preservar: WhatsApp → API → Webhook → CRM → Ticket → Fila/Kanban → Atendimento → Logs.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "rose" | "primary" | "emerald" }) => {
  const tones: Record<string, string> = {
    default: "text-foreground",
    rose: "text-rose-400",
    primary: "text-primary",
    emerald: "text-emerald-400",
  };
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn("text-2xl font-semibold mt-1 font-display", tones[tone])}>{value}</div>
      </CardContent>
    </Card>
  );
};

export default AdminCrmAuditoria;