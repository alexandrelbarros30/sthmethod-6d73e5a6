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
import { Bell, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeSearch } from "@/lib/utils";

type Student = { user_id: string; full_name?: string | null; status?: string | null };

type Audience = "active" | "inactive" | "all" | "custom";
type TemplateKey = "renovacao" | "promocao" | "novo_conteudo" | "lembrete_evolucao" | "custom";

const TEMPLATES: Record<Exclude<TemplateKey, "custom">, { label: string; title: string; body: string; url: string }> = {
  renovacao: {
    label: "Renovação de plano",
    title: "Hora de renovar seu plano ⚡",
    body: "Continue sua evolução sem pausas. Renove agora e mantenha seu acesso ativo.",
    url: "/dashboard/renovar",
  },
  promocao: {
    label: "Promoção especial",
    title: "Oferta STH METHOD por tempo limitado 🔥",
    body: "Aproveite condições exclusivas para acelerar seus resultados. Confira agora.",
    url: "/dashboard",
  },
  novo_conteudo: {
    label: "Novo conteúdo disponível",
    title: "Novo conteúdo liberado ✨",
    body: "Abra o app para conferir as novidades preparadas para você.",
    url: "/dashboard",
  },
  lembrete_evolucao: {
    label: "Lembrete de evolução",
    title: "Bora atualizar sua evolução? 📸",
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

  async function send() {
    if (!title.trim()) { toast.error("Informe um título."); return; }
    if (targetIds.length === 0) { toast.error("Nenhum destinatário selecionado."); return; }
    setSending(true);
    try {
      // dispara em lotes de 200 user_ids para evitar payloads gigantes
      const CHUNK = 200;
      let sent = 0, failed = 0, total = 0;
      for (let i = 0; i < targetIds.length; i += CHUNK) {
        const chunk = targetIds.slice(i, i + CHUNK);
        const { data, error } = await supabase.functions.invoke("send-push", {
          body: {
            user_ids: chunk,
            payload: {
              title: title.trim(),
              body: body.trim() || undefined,
              url: url.trim() || "/dashboard",
              tag: `admin-broadcast-${Date.now()}`,
            },
          },
        });
        if (error) throw error;
        sent += Number(data?.sent || 0);
        failed += Number(data?.failed || 0);
        total += Number(data?.total || 0);
      }
      toast.success(`Push enviado`, {
        description: `${sent} entregues · ${failed} falhas · ${total} inscrições alcançadas (de ${targetIds.length} alunos alvo).`,
      });
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

          <div className="rounded-md border bg-muted/30 p-3 text-xs">
            <p><b>Prévia:</b></p>
            <p className="font-semibold mt-1">{title || "Título"}</p>
            <p className="text-muted-foreground">{body || "Mensagem…"}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Alvo: <b>{targetIds.length}</b> aluno(s). Apenas alunos com push ativado receberão a notificação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={send} disabled={sending || targetIds.length === 0}>
            {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Enviar para {targetIds.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}