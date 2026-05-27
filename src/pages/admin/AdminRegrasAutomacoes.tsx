import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Activity, Bot, CreditCard, Gift, HeartHandshake, Megaphone, MessageSquare, Pencil, Settings, ShieldCheck, Sparkles, Ticket, TrendingUp,
} from "lucide-react";

type OpTemplate = {
  id: string;
  channel: "sth_one" | "fale_nutri";
  category: string;
  title: string;
  body: string;
  active: boolean;
};

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
};

const BILLING_RULES = [
  { stage: 1, label: "1ª cobrança", gap: "No vencimento (D-0)" },
  { stage: 2, label: "2ª cobrança", gap: "+7 dias após a 1ª" },
  { stage: 3, label: "3ª cobrança", gap: "+8 dias (D+15)" },
  { stage: 4, label: "4ª cobrança", gap: "+15 dias (D+30)" },
  { stage: 5, label: "Encerramento", gap: "+30 dias (perda)" },
];

const ROUTING_RULES = [
  { tag: "Aluno ativo", outcome: "Canal Fale com o Nutri", color: "emerald" },
  { tag: "Sem assinatura ativa", outcome: "Canal STH One (comercial)", color: "cyan" },
  { tag: "Mensagem com sintoma/colateral", outcome: "Prioridade sensível (alerta vermelho)", color: "rose" },
  { tag: "Renovação / vence / pagamento", outcome: "Categoria renovação (média)", color: "amber" },
  { tag: "Treino / dieta / protocolo", outcome: "Categoria correspondente", color: "violet" },
];

const AUTOMATION_TRIGGERS = [
  { key: "new_lead", label: "Novo lead qualificado", desc: "Onboarding completo + sem assinatura ativa." },
  { key: "subscription_expiring", label: "Assinatura vencendo", desc: "Dispara N dias antes do vencimento (configurável)." },
  { key: "subscription_expired", label: "Assinatura vencida", desc: "Dispara N dias após o vencimento." },
  { key: "recurring", label: "Recorrente (dia + hora)", desc: "Roda nos dias da semana e horário definidos." },
];

function SectionCard({
  icon: Icon, title, subtitle, action, children,
}: { icon: any; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-white/10 bg-zinc-950/60 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export default function AdminRegrasAutomacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editingTpl, setEditingTpl] = useState<OpTemplate | null>(null);
  const [tplBody, setTplBody] = useState("");

  // master switch
  const { data: master } = useQuery({
    queryKey: ["billing-automation"],
    queryFn: async () => {
      const { data } = await supabase.from("billing_automation").select("enabled").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const { data: ops = [] } = useQuery({
    queryKey: ["op-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_op_templates").select("*").order("channel").order("category");
      return (data || []) as OpTemplate[];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["crm-campaigns-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_campaigns").select("id,name,status,sent_count,next_run_at,scheduled_at,created_at").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["crm-automations-list"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_automations").select("id,name,trigger_type,active,run_count,sent_count,last_run_at").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("id,code,discount_type,discount_value,max_uses,current_uses,active,expires_at").order("created_at", { ascending: false }).limit(12);
      return (data || []) as Coupon[];
    },
  });

  useEffect(() => { if (editingTpl) setTplBody(editingTpl.body); }, [editingTpl]);

  const toggleMaster = async (enabled: boolean) => {
    const { error } = await supabase.from("billing_automation").update({ enabled, updated_at: new Date().toISOString(), updated_by: user?.id }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Motor automático ATIVADO" : "Motor automático PAUSADO");
    qc.invalidateQueries({ queryKey: ["billing-automation"] });
  };

  const toggleOp = async (tpl: OpTemplate) => {
    const { error } = await supabase.from("crm_op_templates").update({ active: !tpl.active }).eq("id", tpl.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["op-templates"] });
  };

  const toggleAutomation = async (id: string, active: boolean) => {
    const { error } = await supabase.from("crm_automations").update({ active: !active }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["crm-automations-list"] });
  };

  const toggleCoupon = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["coupons-summary"] });
  };

  const saveTpl = async () => {
    if (!editingTpl) return;
    const { error } = await supabase.from("crm_op_templates").update({ body: tplBody }).eq("id", editingTpl.id);
    if (error) return toast.error(error.message);
    toast.success("Mensagem atualizada");
    setEditingTpl(null);
    qc.invalidateQueries({ queryKey: ["op-templates"] });
  };

  const groupedOps = useMemo(() => {
    const g: Record<string, OpTemplate[]> = { sth_one: [], fale_nutri: [] };
    ops.forEach((o) => g[o.channel]?.push(o));
    return g;
  }, [ops]);

  const enabled = !!master?.enabled;

  return (
    <DashboardLayout role="admin" title="Regras & Políticas de Automações" subtitle="Painel único — atendimento, comercial, cobrança, ofertas, cupons e apresentações">
      <div className="space-y-6">
        {/* Master */}
        <Card className={enabled ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${enabled ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />
              <div>
                <p className="text-sm font-semibold">{enabled ? "Motor de automações ATIVO" : "Motor de automações PAUSADO"}</p>
                <p className="text-xs text-muted-foreground">Controla TODOS os disparos: cobranças, campanhas, lembretes e recorrentes.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Global</span>
              <Switch checked={enabled} onCheckedChange={toggleMaster} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Atendimento — Roteamento */}
          <SectionCard
            icon={HeartHandshake}
            title="Atendimento — Roteamento Inbound"
            subtitle="Como mensagens recebidas viram tickets (STH One vs Fale com o Nutri)"
            action={<Link to="/admin/atendimento/configuracoes"><Button size="sm" variant="outline" className="gap-1"><Settings className="h-3.5 w-3.5" />APIs</Button></Link>}
          >
            <Table>
              <TableHeader><TableRow><TableHead>Gatilho</TableHead><TableHead>Resultado</TableHead></TableRow></TableHeader>
              <TableBody>
                {ROUTING_RULES.map((r) => (
                  <TableRow key={r.tag}>
                    <TableCell className="text-xs"><Badge variant="secondary">{r.tag}</Badge></TableCell>
                    <TableCell className="text-xs text-zinc-300">{r.outcome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          {/* Cobrança */}
          <SectionCard
            icon={CreditCard}
            title="Cobrança Automática — Régua"
            subtitle="Sequência de 5 estágios para assinaturas vencidas"
            action={<Link to="/admin/billing"><Button size="sm" variant="outline" className="gap-1"><Pencil className="h-3.5 w-3.5" />Editar</Button></Link>}
          >
            <Table>
              <TableHeader><TableRow><TableHead>Estágio</TableHead><TableHead>Quando dispara</TableHead></TableRow></TableHeader>
              <TableBody>
                {BILLING_RULES.map((r) => (
                  <TableRow key={r.stage}>
                    <TableCell className="text-xs"><Badge className="bg-emerald-500/15 text-emerald-300">{r.label}</Badge></TableCell>
                    <TableCell className="text-xs text-zinc-300">{r.gap}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>

        {/* Apresentação / Boas-vindas */}
        {(["sth_one", "fale_nutri"] as const).map((ch) => (
          <SectionCard
            key={ch}
            icon={ch === "sth_one" ? MessageSquare : Bot}
            title={ch === "sth_one" ? "Apresentação — STH One (Comercial)" : "Apresentação — Fale com o Nutri"}
            subtitle="Mensagens automáticas operacionais por categoria. Clique em editar para personalizar."
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Categoria</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="w-[120px]">Ativa</TableHead>
                    <TableHead className="w-[90px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedOps[ch].map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs"><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell className="max-w-md truncate text-xs text-zinc-300">{t.body}</TableCell>
                      <TableCell><Switch checked={t.active} onCheckedChange={() => toggleOp(t)} /></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTpl(t)} className="gap-1">
                          <Pencil className="h-3.5 w-3.5" />Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groupedOps[ch].length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-zinc-500">Sem mensagens configuradas.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        ))}

        {/* Comercial — Campanhas + Automações */}
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard
            icon={Megaphone}
            title="Comercial — Campanhas"
            subtitle="Envios em massa programados ou recorrentes"
            action={<Link to="/admin/crm"><Button size="sm" variant="outline" className="gap-1"><Pencil className="h-3.5 w-3.5" />Gerenciar</Button></Link>}
          >
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Enviadas</TableHead></TableRow></TableHeader>
              <TableBody>
                {campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{c.name}</TableCell>
                    <TableCell className="text-xs"><Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-right text-xs">{c.sent_count}</TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-xs text-zinc-500">Nenhuma campanha.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard
            icon={Sparkles}
            title="Automações por Gatilho"
            subtitle="Regras que disparam mensagens automaticamente conforme eventos"
            action={<Link to="/admin/crm"><Button size="sm" variant="outline" className="gap-1"><Pencil className="h-3.5 w-3.5" />Gerenciar</Button></Link>}
          >
            <div className="space-y-2">
              {AUTOMATION_TRIGGERS.map((t) => (
                <div key={t.key} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                  <p className="text-xs font-medium text-zinc-200">{t.label}</p>
                  <p className="text-[11px] text-zinc-500">{t.desc}</p>
                </div>
              ))}
            </div>
            {automations.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Gatilho</TableHead><TableHead className="w-[90px]">Ativa</TableHead></TableRow></TableHeader>
                <TableBody>
                  {automations.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.name}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline">{a.trigger_type}</Badge></TableCell>
                      <TableCell><Switch checked={a.active} onCheckedChange={() => toggleAutomation(a.id, a.active)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>

        {/* Cupons & Ofertas */}
        <SectionCard
          icon={Ticket}
          title="Cupons & Ofertas"
          subtitle="Códigos de desconto aplicáveis no checkout"
          action={<Link to="/admin/coupons"><Button size="sm" variant="outline" className="gap-1"><Pencil className="h-3.5 w-3.5" />Gerenciar</Button></Link>}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="w-[90px]">Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-mono">{c.code}</TableCell>
                    <TableCell className="text-xs">{c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{c.current_uses}/{c.max_uses}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><Switch checked={c.active} onCheckedChange={() => toggleCoupon(c)} /></TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-zinc-500">Nenhum cupom.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Outras automações relacionadas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/students"><Card className="border-white/10 bg-zinc-950/60 transition hover:border-emerald-500/40"><CardContent className="flex items-center gap-3 p-4"><TrendingUp className="h-5 w-5 text-emerald-400" /><div><p className="text-sm font-medium">Lembretes de Evolução</p><p className="text-[11px] text-zinc-500">Ciclo de 29 dias por aluno</p></div></CardContent></Card></Link>
          <Link to="/admin/billing"><Card className="border-white/10 bg-zinc-950/60 transition hover:border-emerald-500/40"><CardContent className="flex items-center gap-3 p-4"><Activity className="h-5 w-5 text-emerald-400" /><div><p className="text-sm font-medium">Reconciliação de Pagamentos</p><p className="text-[11px] text-zinc-500">Sincroniza Mercado Pago</p></div></CardContent></Card></Link>
          <Link to="/admin/atendimento/auditoria"><Card className="border-white/10 bg-zinc-950/60 transition hover:border-emerald-500/40"><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="h-5 w-5 text-emerald-400" /><div><p className="text-sm font-medium">Limpeza & Consolidação</p><p className="text-[11px] text-zinc-500">Auditoria do CRM</p></div></CardContent></Card></Link>
        </div>
      </div>

      {/* Edit modal */}
      <Dialog open={!!editingTpl} onOpenChange={(o) => !o && setEditingTpl(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar mensagem — {editingTpl?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Variáveis disponíveis: <code className="text-emerald-400">{"{protocolo}"}</code>, <code className="text-emerald-400">{"{nome}"}</code></p>
            <Textarea value={tplBody} onChange={(e) => setTplBody(e.target.value)} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTpl(null)}>Cancelar</Button>
            <Button onClick={saveTpl} className="bg-emerald-500 hover:bg-emerald-600">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}