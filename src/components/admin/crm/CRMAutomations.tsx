import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Zap, Clock, Play, Trash2, Repeat, Calendar, AlertTriangle, UserPlus, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TRIGGER_TYPES = [
  { value: "recurring", label: "Recorrente (dia + hora)", icon: Repeat, description: "Ex: toda segunda às 10h" },
  { value: "subscription_expiring", label: "Plano vencendo em X dias", icon: AlertTriangle, description: "Aviso pré-vencimento" },
  { value: "subscription_expired", label: "Plano vencido há X dias", icon: Calendar, description: "Reativação automática" },
  { value: "new_lead", label: "Novo lead sem plano", icon: UserPlus, description: "Boas-vindas automáticas" },
] as const;

const WEEKDAYS = [
  { value: 0, label: "Dom" }, { value: 1, label: "Seg" }, { value: 2, label: "Ter" },
  { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" },
];

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: any;
  template_id: string | null;
  segment_id: string | null;
  media_ids: string[];
  active: boolean;
  last_run_at: string | null;
  run_count: number;
  sent_count: number;
}

const initialForm = {
  name: "", description: "", trigger_type: "recurring",
  template_id: "", segment_id: "", media_id: "",
  weekdays: [1] as number[],
  hour: 10, minute: 0,
  days_before: 3, days_after: 1,
  audience_status: "all",
};

export default function CRMAutomations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [running, setRunning] = useState<string | null>(null);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["crm-automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_automations" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Automation[];
    },
    refetchInterval: 15000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["crm-templates-list-auto"],
    queryFn: async () => (await supabase.from("crm_templates").select("id, title")).data || [],
  });
  const { data: segments = [] } = useQuery({
    queryKey: ["crm-segments-list-auto"],
    queryFn: async () => (await supabase.from("crm_segments").select("id, name")).data || [],
  });
  const { data: media = [] } = useQuery({
    queryKey: ["crm-media-list-auto"],
    queryFn: async () => (await supabase.from("crm_media").select("id, title")).data || [],
  });

  const toggleWeekday = (d: number) => {
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(d) ? f.weekdays.filter((x) => x !== d) : [...f.weekdays, d],
    }));
  };

  const buildConfig = () => {
    switch (form.trigger_type) {
      case "recurring":
        return { weekdays: form.weekdays, hour: form.hour, minute: form.minute, audience_status: form.audience_status };
      case "subscription_expiring":
        return { days_before: form.days_before };
      case "subscription_expired":
        return { days_after: form.days_after };
      default:
        return {};
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.template_id) {
      toast.error("Nome e template são obrigatórios");
      return;
    }
    if (form.trigger_type === "recurring" && form.weekdays.length === 0) {
      toast.error("Selecione ao menos um dia da semana");
      return;
    }
    if (!user?.id) return;
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      trigger_type: form.trigger_type,
      trigger_config: buildConfig(),
      template_id: form.template_id,
      segment_id: form.segment_id || null,
      media_ids: form.media_id ? [form.media_id] : [],
      active: true,
      scope: "admin",
      created_by: user.id,
    };
    const { error } = await supabase.from("crm_automations" as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Automação criada");
    setOpen(false);
    setForm(initialForm);
    qc.invalidateQueries({ queryKey: ["crm-automations"] });
  };

  const toggleActive = async (a: Automation) => {
    await supabase.from("crm_automations" as any).update({ active: !a.active }).eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["crm-automations"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta automação?")) return;
    await supabase.from("crm_automations" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-automations"] });
  };

  const runNow = async (id: string) => {
    setRunning(id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-automation-runner", {
        body: { automation_id: id },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r?.error) toast.error(r.error);
      else toast.success(`Compatíveis: ${r?.matched ?? 0} • Enviadas: ${r?.sent ?? 0} • Falhas: ${r?.failed ?? 0}`);
      qc.invalidateQueries({ queryKey: ["crm-automations"] });
    } catch (e: any) {
      toast.error(e.message || "Falha ao rodar");
    } finally {
      setRunning(null);
    }
  };

  const triggerLabel = (t: string) => TRIGGER_TYPES.find((x) => x.value === t)?.label || t;
  const TriggerIcon = ({ t }: { t: string }) => {
    const Icon = TRIGGER_TYPES.find((x) => x.value === t)?.icon || Zap;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Automação</h2>
          <p className="text-xs text-muted-foreground">Gatilhos inteligentes e jornadas recorrentes.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(initialForm); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Nova automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova automação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome (ex: Renovação semanal)" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Descrição" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <div>
                <label className="text-xs text-muted-foreground">Tipo de gatilho</label>
                <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {TRIGGER_TYPES.find((t) => t.value === form.trigger_type)?.description}
                </p>
              </div>

              {form.trigger_type === "recurring" && (
                <div className="space-y-3 rounded-lg border border-border/40 p-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Dias da semana</label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((d) => {
                        const active = form.weekdays.includes(d.value);
                        return (
                          <button key={d.value} type="button" onClick={() => toggleWeekday(d.value)}
                            className={`rounded-md border px-3 py-1 text-xs transition ${
                              active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                     : "border-border/60 text-muted-foreground hover:border-border"
                            }`}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Horário (UTC)</span>
                    <Input type="number" min={0} max={23} className="w-20" value={form.hour}
                      onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })} />
                    <span>:</span>
                    <Input type="number" min={0} max={59} className="w-20" value={form.minute}
                      onChange={(e) => setForm({ ...form, minute: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Público</label>
                    <Select value={form.audience_status} onValueChange={(v) => setForm({ ...form, audience_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="expiring">Vencendo</SelectItem>
                        <SelectItem value="expired">Vencidos</SelectItem>
                        <SelectItem value="inactive">Inativos (vencidos +30d)</SelectItem>
                        <SelectItem value="lead">Leads qualificados</SelectItem>
                        <SelectItem value="tool_user">Visitantes de ferramentas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form.trigger_type === "subscription_expiring" && (
                <div className="flex items-center gap-2 rounded-lg border border-border/40 p-3">
                  <span className="text-xs text-muted-foreground">Disparar</span>
                  <Input type="number" min={1} className="w-20" value={form.days_before}
                    onChange={(e) => setForm({ ...form, days_before: Number(e.target.value) })} />
                  <span className="text-xs text-muted-foreground">dias antes do vencimento</span>
                </div>
              )}

              {form.trigger_type === "subscription_expired" && (
                <div className="flex items-center gap-2 rounded-lg border border-border/40 p-3">
                  <span className="text-xs text-muted-foreground">Disparar</span>
                  <Input type="number" min={1} className="w-20" value={form.days_after}
                    onChange={(e) => setForm({ ...form, days_after: Number(e.target.value) })} />
                  <span className="text-xs text-muted-foreground">dias após o vencimento</span>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">Template</label>
                <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Segmento (opcional)</label>
                <Select value={form.segment_id || "none"} onValueChange={(v) => setForm({ ...form, segment_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem segmento extra</SelectItem>
                    {segments.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Mídia (opcional)</label>
                <Select value={form.media_id || "none"} onValueChange={(v) => setForm({ ...form, media_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem mídia</SelectItem>
                    {media.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-emerald-500 text-black hover:bg-emerald-400">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : automations.length === 0 ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="rounded-2xl bg-emerald-500/10 p-3"><Zap className="h-6 w-6 text-emerald-400" /></div>
            <p className="text-sm font-medium">Nenhuma automação ativa</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Crie gatilhos inteligentes — renovação semanal, aviso de vencimento, boas-vindas a leads.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {automations.map((a) => (
            <Card key={a.id} className="border-border/40">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                    <TriggerIcon t={a.trigger_type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{a.name}</p>
                      <Badge variant="outline" className={
                        a.active ? "border-emerald-500/30 text-emerald-400" : "border-border/60 text-muted-foreground"
                      }>
                        {a.active ? "Ativa" : "Pausada"}
                      </Badge>
                      <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">
                        {triggerLabel(a.trigger_type)}
                      </Badge>
                    </div>
                    {a.description && <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {a.run_count} execuções</span>
                      <span>{a.sent_count} enviadas</span>
                      {a.last_run_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          última {formatDistanceToNow(new Date(a.last_run_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                  <Button variant="outline" size="sm" className="gap-1" disabled={running === a.id} onClick={() => runNow(a.id)}>
                    <Play className="h-3.5 w-3.5" /> {running === a.id ? "Rodando..." : "Rodar"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}