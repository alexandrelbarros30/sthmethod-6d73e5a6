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
import { Plus, Send, Calendar, Pause, Play, Trash2, Megaphone, Repeat, Clock, CheckCircle2, XCircle, Loader2, Pencil, StopCircle, MessageSquareX } from "lucide-react";
import { Eye } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", segment_id: "", template_id: "", media_id: "",
    scheduled_at: "", recurrence_enabled: false, recurrence_days: 7,
  });
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    open: boolean;
    loading: boolean;
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    recipients: number;
    segmentName?: string;
    confirmLabel?: string;
    onConfirm?: () => void | Promise<void>;
  }>({ open: false, loading: false, title: "", content: "", recipients: 0 });

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

  const renderVars = (content: string) => {
    const sample: Record<string, string> = {
      nome: "Maria",
      plano: "Premium",
      dias_vencido: "3",
      cupom: "STH10",
      link: "https://sthmethod.com.br",
      objetivo: "Hipertrofia",
    };
    return content.replace(/\{(\w+)\}/g, (_, k) => sample[k] ?? `{${k}}`);
  };

  const classify = (profile: any, sub: any): "active" | "expiring" | "expired" | "lead" | "tool_user" => {
    if (sub) {
      const days = Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000);
      if (days < 0) return "expired";
      if (days <= 7) return "expiring";
      return "active";
    }
    return profile?.onboarding_complete ? "lead" : "tool_user";
  };

  const estimateRecipients = async (segmentId: string | null, snapshot: any) => {
    let filters: any = {};
    if (segmentId) {
      const { data: seg } = await supabase.from("crm_segments").select("filters").eq("id", segmentId).single();
      filters = (seg?.filters as any) || {};
    } else if (snapshot) {
      filters = snapshot.filters || {};
    }
    const { data: profiles } = await supabase.from("profiles").select("user_id, phone, gender, objective, onboarding_complete").limit(5000);
    const userIds = (profiles || []).map((p: any) => p.user_id);
    const { data: subs } = await supabase.from("subscriptions").select("user_id, end_date, status").in("user_id", userIds);
    const latest = new Map<string, any>();
    (subs || []).forEach((s: any) => {
      const ex = latest.get(s.user_id);
      if (!ex || new Date(s.end_date) > new Date(ex.end_date)) latest.set(s.user_id, s);
    });
    return (profiles || []).filter((p: any) => {
      const phone = (p.phone || "").replace(/\D/g, "");
      if (!phone) return false;
      const sub = latest.get(p.user_id);
      const status = classify(p, sub);
      if (filters.status && filters.status !== "all") {
        if (filters.status === "inactive") {
          // inativo = vencido há mais de 30 dias
          if (status !== "expired") return false;
          const days = sub ? Math.floor((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : 0;
          if (days > -30) return false;
        } else if (status !== filters.status) return false;
      }
      const gender = (p.gender || "").toLowerCase();
      if (filters.gender && filters.gender !== "all" && gender !== filters.gender) return false;
      if (filters.objective && !(p.objective || "").toLowerCase().includes(String(filters.objective).toLowerCase())) return false;
      return true;
    }).length;
  };

  const openPreviewFromForm = async () => {
    if (!form.template_id || !form.segment_id) {
      toast.error("Selecione segmento e template para pré-visualizar");
      return;
    }
    setPreview((p) => ({ ...p, open: true, loading: true, title: form.name || "Pré-visualização", content: "", recipients: 0 }));
    const [{ data: tpl }, { data: seg }, mediaRow] = await Promise.all([
      supabase.from("crm_templates").select("title, content").eq("id", form.template_id).single(),
      supabase.from("crm_segments").select("name").eq("id", form.segment_id).single(),
      form.media_id ? supabase.from("crm_media").select("url, media_type").eq("id", form.media_id).single() : Promise.resolve({ data: null } as any),
    ]);
    const count = await estimateRecipients(form.segment_id, null);
    setPreview({
      open: true, loading: false,
      title: form.name || tpl?.title || "Pré-visualização",
      content: renderVars(tpl?.content || ""),
      mediaUrl: mediaRow?.data?.url, mediaType: mediaRow?.data?.media_type,
      recipients: count, segmentName: seg?.name,
    });
  };

  const openPreviewFromCampaign = async (c: Campaign, withConfirm = false) => {
    setPreview((p) => ({ ...p, open: true, loading: true, title: c.name, content: "", recipients: 0 }));
    const [{ data: tpl }, segRow, mediaRow] = await Promise.all([
      c.template_id
        ? supabase.from("crm_templates").select("title, content").eq("id", c.template_id).single()
        : Promise.resolve({ data: null } as any),
      c.segment_id
        ? supabase.from("crm_segments").select("name").eq("id", c.segment_id).single()
        : Promise.resolve({ data: null } as any),
      c.media_ids?.[0]
        ? supabase.from("crm_media").select("url, media_type").eq("id", c.media_ids[0]).single()
        : Promise.resolve({ data: null } as any),
    ]);
    const count = await estimateRecipients(c.segment_id, null);
    setPreview({
      open: true, loading: false,
      title: c.name, content: renderVars(tpl?.content || ""),
      mediaUrl: mediaRow?.data?.url, mediaType: mediaRow?.data?.media_type,
      recipients: count, segmentName: segRow?.data?.name,
      confirmLabel: withConfirm ? "Confirmar e disparar" : undefined,
      onConfirm: withConfirm ? () => dispatch(c.id) : undefined,
    });
  };

  const reset = () => setForm({
    name: "", description: "", segment_id: "", template_id: "", media_id: "",
    scheduled_at: "", recurrence_enabled: false, recurrence_days: 7,
  });

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    const local = c.scheduled_at
      ? new Date(new Date(c.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";
    setForm({
      name: c.name || "",
      description: c.description || "",
      segment_id: c.segment_id || "",
      template_id: c.template_id || "",
      media_id: c.media_ids?.[0] || "",
      scheduled_at: local,
      recurrence_enabled: !!c.recurrence?.enabled,
      recurrence_days: c.recurrence?.interval_days || 7,
    });
    setOpen(true);
  };

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
    };
    let savedId = editingId;
    if (editingId) {
      const { error } = await supabase.from("crm_campaigns").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(sendNow ? "Campanha salva — confirme na prévia" : "Campanha atualizada");
    } else {
      const { data, error } = await supabase
        .from("crm_campaigns")
        .insert({ ...payload, scope: "admin", created_by: user.id })
        .select("id").single();
      if (error) { toast.error(error.message); return; }
      savedId = data?.id ?? null;
      toast.success(sendNow ? "Campanha salva — confirme na prévia" : "Campanha criada");
    }
    setOpen(false);
    setEditingId(null);
    reset();
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
    if (sendNow && savedId) {
      // Load fresh campaign and open preview with confirm
      const { data: fresh } = await supabase.from("crm_campaigns").select("*").eq("id", savedId).single();
      if (fresh) openPreviewFromCampaign(fresh as Campaign, true);
    }
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

  const interruptSending = async (c: Campaign) => {
    if (!confirm(`Interromper o envio em andamento de "${c.name}"? Mensagens já enviadas não serão revertidas.`)) return;
    const { error } = await supabase.from("crm_campaigns")
      .update({ status: "paused", next_run_at: null, scheduled_at: null })
      .eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Disparo interrompido. O envio para em até 5s.");
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta campanha? O histórico será removido.")) return;
    await supabase.from("crm_campaigns").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
  };

  const [deletingWa, setDeletingWa] = useState<string | null>(null);
  const deleteWhatsAppMessages = async (c: Campaign) => {
    if (!confirm(
      `Apagar do WhatsApp as mensagens já enviadas em "${c.name}"?\n\n` +
      `O WhatsApp só permite apagar mensagens enviadas nas últimas ~48h e que ainda não foram visualizadas no celular do destinatário.`
    )) return;
    setDeletingWa(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-delete-messages", {
        body: { campaign_id: c.id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao apagar");
      toast.success(`${data.deleted} apagadas no WhatsApp • ${data.failed} falharam (${data.total} elegíveis)`);
      qc.invalidateQueries({ queryKey: ["crm-campaigns"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao apagar do WhatsApp");
    } finally {
      setDeletingWa(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Campanhas</h2>
          <p className="text-xs text-muted-foreground">Crie, agende e dispare ondas de mensagens.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Nova campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar campanha" : "Nova campanha"}</DialogTitle>
            </DialogHeader>
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
              <Button variant="outline" onClick={openPreviewFromForm} className="gap-2">
                <Eye className="h-4 w-4" /> Pré-visualizar
              </Button>
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

      <Dialog open={preview.open} onOpenChange={(v) => setPreview((p) => ({ ...p, open: v }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" /> Pré-visualização
            </DialogTitle>
          </DialogHeader>
          {preview.loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                  {preview.recipients} destinatários
                </Badge>
                {preview.segmentName && (
                  <Badge variant="outline" className="border-border/60 text-muted-foreground">
                    {preview.segmentName}
                  </Badge>
                )}
              </div>
              <div className="rounded-2xl bg-[#0b141a] p-3">
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-3 text-sm text-white shadow">
                  {preview.mediaUrl && (preview.mediaType || "").startsWith("image/") && (
                    <img src={preview.mediaUrl} alt="" className="mb-2 max-h-60 w-full rounded-lg object-cover" />
                  )}
                  {preview.mediaUrl && (preview.mediaType || "").includes("pdf") && (
                    <a href={preview.mediaUrl} target="_blank" rel="noreferrer"
                       className="mb-2 flex items-center gap-2 rounded-lg bg-black/30 p-2 text-xs underline">
                      📎 Anexo PDF
                    </a>
                  )}
                  <p className="whitespace-pre-wrap break-words">{preview.content || "—"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Variáveis renderizadas com dados de exemplo (nome=Maria, plano=Premium...).
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreview((p) => ({ ...p, open: false }))}>Fechar</Button>
            {preview.onConfirm && (
              <Button
                className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
                onClick={async () => {
                  const fn = preview.onConfirm!;
                  setPreview((p) => ({ ...p, open: false, onConfirm: undefined, confirmLabel: undefined }));
                  await fn();
                }}
              >
                <Send className="h-4 w-4" /> {preview.confirmLabel || "Confirmar e disparar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Button size="sm" variant="ghost" onClick={() => openPreviewFromCampaign(c, false)} className="gap-1">
                    <Eye className="h-3.5 w-3.5" /> Prévia
                  </Button>
                  {["draft", "scheduled", "paused", "failed"].includes(c.status) && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {c.status === "sending" ? (
                    <Button size="sm" variant="outline"
                      onClick={() => interruptSending(c)}
                      className="gap-1 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                      <StopCircle className="h-3.5 w-3.5" /> Interromper
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={dispatching === c.id}
                      onClick={() => openPreviewFromCampaign(c, true)} className="gap-1">
                      {dispatching === c.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />} Disparar
                    </Button>
                  )}
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