import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Loader2, Send, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeSearch } from "@/lib/utils";

type Student = { user_id: string; full_name?: string | null; status?: string | null };

type Audience = "active" | "inactive" | "all" | "custom";
type TemplateKey = "renovacao" | "promocao" | "novo_conteudo" | "lembrete_evolucao" | "custom";

const TEMPLATES: Record<Exclude<TemplateKey, "custom">, { label: string; title: string; body: string; url: string }> = {
  renovacao: {
    label: "Renovação de plano",
    title: "{{nome}}, hora de renovar seu {{plano}} ⚡",
    body: "Seu acesso vence em {{vencimento}}. Renove agora e mantenha sua evolução sem pausas.",
    url: "/dashboard/renovar",
  },
  promocao: {
    label: "Promoção especial",
    title: "{{nome}}, oferta STH METHOD por tempo limitado 🔥",
    body: "Aproveite condições exclusivas para acelerar seus resultados. Confira agora.",
    url: "/dashboard",
  },
  novo_conteudo: {
    label: "Novo conteúdo disponível",
    title: "{{nome}}, novo conteúdo liberado ✨",
    body: "Abra o app para conferir as novidades preparadas para você.",
    url: "/dashboard",
  },
  lembrete_evolucao: {
    label: "Lembrete de evolução",
    title: "{{nome}}, bora atualizar sua evolução? 📸",
    body: "Registre peso e fotos para acompanharmos sua jornada de perto.",
    url: "/dashboard/atualizacao",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  students: Student[];
}

export default function SendPushDialog({ open, onOpenChange, students }: Props) {
  const [audience, setAudience] = useState<Audience>("active");
  const [tpl, setTpl] = useState<TemplateKey>("renovacao");
  const [title, setTitle] = useState(TEMPLATES.renovacao.title);
  const [body, setBody] = useState(TEMPLATES.renovacao.body);
  const [url, setUrl] = useState(TEMPLATES.renovacao.url);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [useVars, setUseVars] = useState(true);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [previewSample, setPreviewSample] = useState<{ nome: string; plano: string; vencimento: string } | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const activeIds = useMemo(() => students.filter((s) => s.status === "active").map((s) => s.user_id), [students]);
  const inactiveIds = useMemo(() => students.filter((s) => s.status !== "active").map((s) => s.user_id), [students]);
  const allIds = useMemo(() => students.map((s) => s.user_id), [students]);

  const filteredForCustom = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return students;
    return students.filter((s) => normalizeSearch(s.full_name || "").includes(q));
  }, [students, search]);

  const targetIds = useMemo(() => {
    switch (audience) {
      case "active": return activeIds;
      case "inactive": return inactiveIds;
      case "all": return allIds;
      case "custom": return Array.from(selectedIds);
    }
  }, [audience, activeIds, inactiveIds, allIds, selectedIds]);

  function applyTemplate(k: TemplateKey) {
    setTpl(k);
    if (k !== "custom") {
      const t = TEMPLATES[k];
      setTitle(t.title); setBody(t.body); setUrl(t.url);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function loadPreviewSample() {
    if (targetIds.length === 0) {
      toast.error("Selecione ao menos um destinatário para pré-visualizar.");
      return;
    }
    setLoadingSample(true);
    try {
      const sampleId = targetIds[0];
      const [{ data: prof }, { data: subs }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", sampleId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("end_date, plans:plan_id(name)")
          .eq("user_id", sampleId)
          .order("end_date", { ascending: false })
          .limit(1),
      ]);
      const s = subs?.[0] as any;
      const first = String(prof?.full_name || "").trim().split(/\s+/)[0] || "aluno(a)";
      setPreviewSample({
        nome: first,
        plano: s?.plans?.name || "seu plano",
        vencimento: s?.end_date ? new Date(s.end_date).toLocaleDateString("pt-BR") : "em breve",
      });
    } catch (e: any) {
      toast.error("Não foi possível carregar exemplo real.");
    } finally {
      setLoadingSample(false);
    }
  }

  function applyVars(str: string, vars: { nome: string; plano: string; vencimento: string }) {
    return str
      .replace(/\{\{\s*nome\s*\}\}/gi, vars.nome)
      .replace(/\{\{\s*plano\s*\}\}/gi, vars.plano)
      .replace(/\{\{\s*vencimento\s*\}\}/gi, vars.vencimento);
  }

  const previewVars = previewSample || { nome: "Maria", plano: "Plano Turbo 30D", vencimento: "15/08/2026" };
  const previewTitle = useVars ? applyVars(title, previewVars) : title;
  const previewBody = useVars ? applyVars(body, previewVars) : body;

  async function send() {
    if (!title.trim()) { toast.error("Informe um título."); return; }
    if (targetIds.length === 0) { toast.error("Nenhum destinatário selecionado."); return; }
    if (scheduleMode === "later") {
      if (!scheduledAt) { toast.error("Informe a data/hora do agendamento."); return; }
      if (new Date(scheduledAt).getTime() <= Date.now() + 30_000) {
        toast.error("Agende para pelo menos 1 minuto no futuro.");
        return;
      }
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-push-campaign", {
        body: {
          title: title.trim(),
          body: body.trim() || undefined,
          url: url.trim() || "/dashboard",
          audience_type: audience,
          audience_user_ids: audience === "custom" ? targetIds : undefined,
          use_variables: useVars,
          scheduled_at: scheduleMode === "later" ? new Date(scheduledAt).toISOString() : null,
        },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || "Falha no envio");
      if (data?.scheduled) {
        toast.success("Campanha agendada", {
          description: `Envio programado para ${new Date(scheduledAt).toLocaleString("pt-BR")} · ${targetIds.length} alvo(s).`,
        });
      } else {
        toast.success("Push enviado", {
          description: `${data?.sent || 0} entregues · ${data?.failed || 0} falhas · ${data?.total || 0} inscrições alcançadas (de ${targetIds.length} alvo).`,
        });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao enviar push", { description: e?.message || String(e) });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Enviar notificação push
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Audiência</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Alunos ativos ({activeIds.length})</SelectItem>
                  <SelectItem value="inactive">Inativos / vencidos ({inactiveIds.length})</SelectItem>
                  <SelectItem value="all">Todos os cadastrados ({allIds.length})</SelectItem>
                  <SelectItem value="custom">Selecionar alguns…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Template</Label>
              <Select value={tpl} onValueChange={(v) => applyTemplate(v as TemplateKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Mensagem personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {audience === "custom" && (
            <div className="border rounded-md p-2 space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Buscar aluno…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
                <Badge variant="outline" className="text-[10px]">{selectedIds.size} selecionados</Badge>
                <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
              </div>
              <ScrollArea className="h-48 border rounded">
                <div className="p-1">
                  {filteredForCustom.map((s) => (
                    <label key={s.user_id} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/40 rounded cursor-pointer">
                      <Checkbox checked={selectedIds.has(s.user_id)} onCheckedChange={() => toggleId(s.user_id)} />
                      <span className="flex-1 truncate">{s.full_name || "—"}</span>
                      <Badge variant="outline" className="text-[9px]">{s.status || "none"}</Badge>
                    </label>
                  ))}
                  {filteredForCustom.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhum aluno encontrado.</p>}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Mensagem</Label>
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={240} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Link ao clicar (opcional)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/dashboard" />
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Personalizar por aluno</Label>
                <p className="text-[11px] text-muted-foreground">
                  Use <code>{"{{nome}}"}</code>, <code>{"{{plano}}"}</code> e <code>{"{{vencimento}}"}</code> — resolvidos por destinatário.
                </p>
              </div>
              <Switch checked={useVars} onCheckedChange={setUseVars} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase text-muted-foreground">Quando enviar</Label>
              <div className="flex gap-1">
                <Button size="sm" variant={scheduleMode === "now" ? "default" : "outline"} className="h-7 text-[11px]" onClick={() => setScheduleMode("now")}>Agora</Button>
                <Button size="sm" variant={scheduleMode === "later" ? "default" : "outline"} className="h-7 text-[11px]" onClick={() => setScheduleMode("later")}>
                  <Clock className="w-3 h-3 mr-1" /> Agendar
                </Button>
              </div>
            </div>
            {scheduleMode === "later" && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                className="h-9 text-xs"
              />
            )}
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p><b>Prévia</b> {useVars && <span className="text-[10px] text-muted-foreground">(exemplo: {previewVars.nome} · {previewVars.plano} · {previewVars.vencimento})</span>}</p>
              {useVars && (
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={loadPreviewSample} disabled={loadingSample || targetIds.length === 0}>
                  {loadingSample ? <Loader2 className="w-3 h-3 animate-spin" /> : "Usar aluno real"}
                </Button>
              )}
            </div>
            <div className="rounded border bg-background p-2">
              <p className="font-semibold">{previewTitle || "Título"}</p>
              <p className="text-muted-foreground">{previewBody || "Mensagem…"}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Alvo: <b>{targetIds.length}</b> aluno(s). Apenas alunos com push ativado receberão a notificação.
              {targetIds.length > 5000 && <span className="text-red-400"> · Máximo permitido: 5000.</span>}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={send} disabled={sending || targetIds.length === 0 || targetIds.length > 5000}>
            {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            {scheduleMode === "later" ? `Agendar para ${targetIds.length}` : `Enviar para ${targetIds.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}