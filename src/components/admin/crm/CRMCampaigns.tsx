import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Send, Calendar, Pause, Play, Trash2, Megaphone, Repeat, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  segment_id: string | null;
  template_id: string | null;
  media_ids: string[] | null;
  status: string;
  scheduled_at: string | null;
  next_run_at: string | null;
  recurrence: any;
  sent_count: number;
  failed_count: number;
  last_run_at: string | null;
  created_at: string;
}

const statusStyle: Record<string, string> = {
  draft: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  sending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho", scheduled: "Agendada", sending: "Enviando",
  sent: "Enviada", paused: "Pausada", failed: "Falhou", cancelled: "Cancelada",
};

export default function CRMCampaigns() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", segment_id: "", template_id: "", media_id: "",
    scheduled_at: "", recurrence_enabled: false, recurrence_days: 7,
  });
  const [dispatching, setDispatching] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["crm-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Campaign[];
    },
    refetchInterval: 10000,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["crm-segments-list"],
    queryFn: async () => (await supabase.from("crm_segments").select("id, name")).data || [],
  });
  const { data: templates = [] } = useQuery({
    queryKey: ["crm-templates-list"],
    queryFn: async () => (await supabase.from("crm_templates").select("id, title, category")).data || [],
  });
  const { data: media = [] } = useQuery({
    queryKey: ["crm-media-list"],
    queryFn: async () => (await supabase.from("crm_media").select("id, title").order("created_at", { ascending: false })).data || [],
  });

  const reset = () => setForm({
    name: "", description: "", segment_id: "", template_id: "", media_id: "",
    scheduled_at: "", recurrence_enabled: false, recurrence_days: 7,
  });

  const save = async (sendNow: boolean) => {
    if (!form.name.trim() || !form.template_id || !form.segment_id) {
      toast.error("Nome, segmento e template são obrigatórios");
      return;
    }
    if (!user?.id) return;
    const status = sendNow ? "draft" : form.scheduled_at ? "scheduled" : "draft";
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      segment_id: form.segment_id,
      template_id: form.template_id,
      media_ids: form.media_id ? [form.media_id] : [],
      status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      next_run_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      recurrence: form.recurrence_enabled ? { enabled: true, interval_days: form.recurrence_days } : null,
      scope: "admin",
      created_by: user.id,
    };
    const { data, error } = await supabase.from("crm_campaigns").insert(payload).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success(sendNow ? "Disparando campanha..." : "Campanha criada");
    setOpen(false);
    reset();
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
    if (sendNow && data?.id) dispatch(data.id);
  };

  const dispatch = async (id: string) => {
    setDispatching(id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-dispatch-campaign", {
        body: { campaign_id: id, trigger_type: "manual", triggered_by: user?.id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha no envio");
      toast.success(`${data.sent} enviadas • ${data.failed} falharam (${data.total} no total)`);
      qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
      qc.invalidateQueries({ queryKey: ["crm-runs"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao disparar");
    } finally {
      setDispatching(null);
    }
  };

  const togglePause = async (c: Campaign) => {
    const newStatus = c.status === "paused" ? "scheduled" : "paused";
    await supabase.from("crm_campaigns").update({ status: newStatus }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta campanha? O histórico será removido.")) return;
    await supabase.from("crm_campaigns").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Campanhas</h2>
          <p className="text-xs text-muted-foreground">Crie, agende e dispare ondas de mensagens.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Nova campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome da campanha" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Descrição (opcional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <div>
                <label className="text-xs text-muted-foreground">Público (segmento)</label>
                <Select value={form.segment_id} onValueChange={(v) => setForm({ ...form, segment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um segmento" /></SelectTrigger>
                  <SelectContent>
                    {segments.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Template</label>
                <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title} <span className="text-muted-foreground">({t.category})</span></SelectItem>
                    ))}
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

              <div>
                <label className="text-xs text-muted-foreground">Agendar para (opcional)</label>
                <Input type="datetime-local" value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Repeat className="h-4 w-4 text-emerald-400" />
                  <span>Repetir automaticamente</span>
                </div>
                <Switch checked={form.recurrence_enabled}
                  onCheckedChange={(v) => setForm({ ...form, recurrence_enabled: v })} />
              </div>
              {form.recurrence_enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">A cada</span>
                  <Input type="number" min={1} className="w-20" value={form.recurrence_days}
                    onChange={(e) => setForm({ ...form, recurrence_days: Number(e.target.value) })} />
                  <span className="text-xs text-muted-foreground">dias</span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="outline" onClick={() => save(false)} className="gap-2">
                <Calendar className="h-4 w-4" /> Salvar {form.scheduled_at ? "agendada" : "rascunho"}
              </Button>
              <Button onClick={() => save(true)} className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
                <Send className="h-4 w-4" /> Disparar agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="border-border/40 transition hover:border-emerald-500/30">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${statusStyle[c.status]}`}>{statusLabel[c.status]}</Badge>
                    {c.recurrence?.enabled && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-violet-500/30 text-violet-400">
                        <Repeat className="h-3 w-3" /> a cada {c.recurrence.interval_days}d
                      </Badge>
                    )}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" />{c.sent_count} enviadas</span>
                    <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-rose-400" />{c.failed_count} falhas</span>
                    {c.next_run_at && (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />
                        próximo {formatDistanceToNow(new Date(c.next_run_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={dispatching === c.id || c.status === "sending"}
                    onClick={() => dispatch(c.id)} className="gap-1">
                    {dispatching === c.id || c.status === "sending"
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />} Disparar
                  </Button>
                  {(c.status === "scheduled" || c.status === "paused") && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePause(c)}>
                      {c.status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-400" onClick={() => remove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
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