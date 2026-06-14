import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Zap, MessageSquare, AlertCircle } from "lucide-react";

type Channel = "zapi" | "wapi" | "wapi_sucesso";

interface AutomationDef {
  key: string;
  title: string;
  rule: string;
  trigger: "saudacao" | "horario" | "agendado" | "evento";
}

const CHANNELS: { id: Channel; label: string; phone: string; color: string }[] = [
  { id: "zapi", label: "Comercial", phone: "21 99849-6289", color: "#25D366" },
  { id: "wapi", label: "Fale com o Nutri", phone: "21 99898-4153", color: "#10b981" },
  { id: "wapi_sucesso", label: "Sucesso do Aluno", phone: "—", color: "#a78bfa" },
];

// Catálogo das automações reais que rodam hoje no sistema.
// Cada item aponta para uma row em crm_message_templates (por key).
const CATALOG: Record<Channel, AutomationDef[]> = {
  zapi: [
    { key: "saudacao_boas_vindas", title: "Saudação — primeira mensagem", rule: "Disparada quando o lead manda a 1ª mensagem no Comercial.", trigger: "saudacao" },
    { key: "automacao_pagamento_comercial", title: "Pós-pagamento — agradecimento Comercial", rule: "Disparada após pagamento aprovado (Mercado Pago webhook) no canal Comercial.", trigger: "evento" },
    { key: "evolution_close_pre_5d", title: "Fechamento de Evolução — D-5", rule: "5 dias antes do fim da consultoria. Lembra o aluno de registrar evolução final (peso, medidas, fotos).", trigger: "agendado" },
    { key: "renewal_pre_3d", title: "Renovação — D-3", rule: "3 dias antes do vencimento do plano.", trigger: "agendado" },
    { key: "cycle_update_d_minus_1", title: "Atualização de ciclo — D-1", rule: "1 dia antes de cada ciclo de 30/60/90 dias desde o início do plano (peso e fotos).", trigger: "agendado" },
    { key: "renewal_d1", title: "Cobrança — D+1", rule: "1 dia após o vencimento.", trigger: "agendado" },
    { key: "renewal_d7", title: "Cobrança — D+7", rule: "7 dias após o vencimento.", trigger: "agendado" },
    { key: "renewal_d15", title: "Cobrança — D+15 (cupom RETOMA10)", rule: "15 dias após o vencimento, com cupom.", trigger: "agendado" },
    { key: "renewal_d30", title: "Cobrança — D+30 (último contato)", rule: "30 dias após o vencimento. Último disparo automático.", trigger: "agendado" },
    { key: "encerramento_expediente", title: "Encerramento de expediente", rule: "Fora do horário comercial, ao receber mensagem nos canais.", trigger: "horario" },
  ],
  wapi: [
    { key: "nutri_saudacao", title: "Saudação — primeira mensagem", rule: "Disparada quando o aluno escreve no Fale com o Nutri.", trigger: "saudacao" },
    { key: "automacao_pagamento_aprovado_novo", title: "Boas-vindas — novo aluno", rule: "Pagamento aprovado de aluno novo (1ª adesão).", trigger: "evento" },
    { key: "automacao_pagamento_aprovado_renovacao", title: "Boas-vindas — renovação", rule: "Pagamento aprovado de renovação contínua.", trigger: "evento" },
    { key: "automacao_pagamento_reativacao", title: "Boas-vindas — reativação", rule: "Pagamento aprovado de aluno que voltou após pausa.", trigger: "evento" },
    { key: "automacao_pagamento_aprovado", title: "Pós-pagamento — fallback", rule: "Fallback genérico de pagamento aprovado.", trigger: "evento" },
    { key: "automacao_pagamento_renovacao", title: "Pós-pagamento renovação — fallback", rule: "Fallback de renovação aprovada.", trigger: "evento" },
    { key: "encerramento_expediente", title: "Encerramento de expediente", rule: "Fora do horário comercial, ao receber mensagem nos canais.", trigger: "horario" },
  ],
  wapi_sucesso: [
    { key: "sucesso_saudacao", title: "Saudação — primeira mensagem", rule: "Disparada quando o aluno escreve no Sucesso do Aluno.", trigger: "saudacao" },
    { key: "sucesso_onboarding", title: "Onboarding e prazos", rule: "Resposta automática para dúvidas iniciais e prazos.", trigger: "saudacao" },
    { key: "sucesso_atualizacao", title: "Fluxo de atualização", rule: "Resposta automática para pedidos de atualização.", trigger: "saudacao" },
    { key: "sucesso_renovacao", title: "Renovação antecipada", rule: "Sugestão de renovação antecipada (desativada por padrão).", trigger: "evento" },
    { key: "encerramento_expediente", title: "Encerramento de expediente", rule: "Fora do horário comercial, ao receber mensagem nos canais.", trigger: "horario" },
  ],
};

interface Tpl {
  id: string;
  key: string;
  name: string;
  body: string;
  channel: string;
  active: boolean;
  silent_dispatch: boolean;
}

function TriggerBadge({ t }: { t: AutomationDef["trigger"] }) {
  const map = {
    saudacao: { label: "Saudação", icon: MessageSquare, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
    horario: { label: "Horário", icon: Clock, color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
    agendado: { label: "Agendado", icon: Clock, color: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
    evento: { label: "Evento", icon: Zap, color: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  }[t];
  const Ico = map.icon;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${map.color}`}>
      <Ico className="w-3 h-3" />
      {map.label}
    </Badge>
  );
}

export default function AdminCrmAutomations() {
  const [channel, setChannel] = useState<Channel>("zapi");
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const allKeys = Array.from(new Set(Object.values(CATALOG).flat().map((a) => a.key)));
    const { data } = await supabase
      .from("crm_message_templates")
      .select("id, key, name, body, channel, active, silent_dispatch")
      .in("key", allKeys);
    setTemplates((data ?? []) as Tpl[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const byKey = useMemo(() => {
    const m = new Map<string, Tpl>();
    templates.forEach((t) => m.set(t.key, t));
    return m;
  }, [templates]);

  const items = CATALOG[channel];

  async function saveBody(tpl: Tpl) {
    const body = drafts[tpl.id] ?? tpl.body;
    setSaving(tpl.id);
    const { error } = await supabase.from("crm_message_templates").update({ body }).eq("id", tpl.id);
    setSaving(null);
    if (error) { toast({ title: "Erro ao salvar", description: error.message }); return; }
    toast({ title: "Mensagem atualizada" });
    setTemplates((prev) => prev.map((p) => (p.id === tpl.id ? { ...p, body } : p)));
    setDrafts((d) => { const n = { ...d }; delete n[tpl.id]; return n; });
  }

  async function toggleActive(tpl: Tpl, active: boolean) {
    const { error } = await supabase.from("crm_message_templates").update({ active }).eq("id", tpl.id);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setTemplates((prev) => prev.map((p) => (p.id === tpl.id ? { ...p, active } : p)));
    toast({ title: active ? "Automação ativada" : "Automação pausada" });
  }

  return (
    <DashboardLayout role="admin" title="Centro de Automação" subtitle="Mensagens automáticas por canal — regras, títulos e edição">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {CHANNELS.map((c) => {
          const isActive = c.id === channel;
          const total = CATALOG[c.id].length;
          return (
            <button
              key={c.id}
              onClick={() => { setChannel(c.id); setOpenKey(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive ? "text-white border-transparent shadow-sm" : "text-muted-foreground border-border hover:bg-accent/40"
              }`}
              style={isActive ? { background: c.color } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "#fff" : c.color }} />
              {c.label}
              <span className={`text-[10px] ${isActive ? "text-white/80" : "text-muted-foreground"}`}>· {total}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando automações…
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((auto) => {
            const tpl = byKey.get(auto.key);
            const isOpen = openKey === auto.key;
            const missing = !tpl;
            return (
              <Card key={auto.key} className="overflow-hidden">
                <div className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{auto.title}</p>
                      <TriggerBadge t={auto.trigger} />
                      {tpl?.silent_dispatch && (
                        <Badge variant="outline" className="text-[10px]">Silencioso</Badge>
                      )}
                      {missing && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40 gap-1">
                          <AlertCircle className="w-3 h-3" /> Template ausente
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{auto.rule}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">key: {auto.key}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {tpl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{tpl.active ? "Ativa" : "Pausada"}</span>
                        <Switch checked={tpl.active} onCheckedChange={(v) => toggleActive(tpl, v)} />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={isOpen ? "secondary" : "outline"}
                      onClick={() => setOpenKey(isOpen ? null : auto.key)}
                      disabled={missing}
                    >
                      {isOpen ? "Fechar" : "Editar mensagem"}
                    </Button>
                  </div>
                </div>
                {isOpen && tpl && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground">
                      Variáveis: <code>{"{nome}"}</code>, <code>{"{plano}"}</code>, <code>{"{vencimento}"}</code>, <code>{"{valor}"}</code>, <code>{"{dias_restantes}"}</code>, <code>{"{link_renovacao}"}</code>
                    </p>
                    <Textarea
                      rows={8}
                      value={drafts[tpl.id] ?? tpl.body}
                      onChange={(e) => setDrafts((d) => ({ ...d, [tpl.id]: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setDrafts((d) => { const n = { ...d }; delete n[tpl.id]; return n; })}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => saveBody(tpl)} disabled={saving === tpl.id}>
                        {saving === tpl.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}