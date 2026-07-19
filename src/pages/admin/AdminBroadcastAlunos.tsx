import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Send, Trash2, Plus, Eye, Users, History } from "lucide-react";

interface Template {
  id: string;
  name: string;
  message: string;
  image_url: string | null;
  text_first: boolean;
}
interface Run {
  id: string; audience: string; total: number; sent: number; failed: number; skipped: number;
  status: string; dry_run: boolean; created_at: string; finished_at: string | null;
}

export default function AdminBroadcastAlunos() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplId, setTplId] = useState<string>("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audience, setAudience] = useState<"active" | "all">("active");
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);

  const current = useMemo(() => templates.find((t) => t.id === tplId) || null, [templates, tplId]);

  async function loadAll() {
    setLoading(true);
    const [{ data: tpls }, { count }, { data: rs }] = await Promise.all([
      supabase.from("broadcast_templates").select("*").order("updated_at", { ascending: false }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("broadcast_runs").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    setTemplates((tpls as any) || []);
    setActiveCount(count || 0);
    setRuns((rs as any) || []);
    if ((tpls as any)?.length && !tplId) applyTemplate((tpls as any)[0]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  function applyTemplate(t: Template) {
    setTplId(t.id); setName(t.name); setMessage(t.message);
    setImageUrl(t.image_url || "");
  }
  function newTemplate() {
    setTplId(""); setName("Novo template"); setMessage(""); setImageUrl("");
  }
  async function saveTemplate() {
    if (!name.trim() || !message.trim()) { toast({ title: "Nome e mensagem obrigatórios" }); return; }
    setSaving(true);
    try {
      if (tplId) {
        const { error } = await supabase.from("broadcast_templates")
          .update({ name, message, image_url: imageUrl || null, updated_at: new Date().toISOString() })
          .eq("id", tplId);
        if (error) throw error;
        toast({ title: "Template atualizado" });
      } else {
        const { data, error } = await supabase.from("broadcast_templates")
          .insert({ name, message, image_url: imageUrl || null }).select("*").single();
        if (error) throw error;
        setTplId((data as any).id);
        toast({ title: "Template criado" });
      }
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message || String(e) });
    } finally { setSaving(false); }
  }
  async function deleteTemplate() {
    if (!tplId) return;
    if (!confirm(`Excluir template "${name}"?`)) return;
    const { error } = await supabase.from("broadcast_templates").delete().eq("id", tplId);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    newTemplate(); await loadAll();
  }
  async function doPreview() {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("broadcast-alunos", {
        body: { audience, message, image_url: imageUrl || null, template_id: tplId || null, dry_run: true },
      });
      if (error) throw error;
      setPreview(data);
    } catch (e: any) {
      toast({ title: "Erro no preview", description: e.message || String(e) });
    } finally { setSending(false); }
  }
  async function doSend() {
    setSending(true); setConfirmOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke("broadcast-alunos", {
        body: { audience, message, image_url: imageUrl || null, template_id: tplId || null, dry_run: false },
      });
      if (error) throw error;
      toast({
        title: "Disparo iniciado",
        description: `${data?.total || 0} destinatários. Acompanhe no histórico abaixo.`,
      });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erro no disparo", description: e.message || String(e) });
    } finally { setSending(false); }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Disparo em massa — Alunos</h1>
            <p className="text-sm text-muted-foreground">
              Envia mensagem individual via canal Fale com o Nutri (W-API) para todos os alunos ativos.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Users className="w-3 h-3 mr-1" /> {activeCount} alunos ativos
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            <Card className="p-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <div>
                  <label className="text-xs font-medium">Template salvo</label>
                  <Select value={tplId} onValueChange={(id) => {
                    const t = templates.find((x) => x.id === id); if (t) applyTemplate(t);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione um template…" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="self-end"><Button variant="outline" size="sm" onClick={newTemplate}>
                  <Plus className="w-4 h-4 mr-1" /> Novo
                </Button></div>
                <div className="self-end"><Button variant="outline" size="sm" onClick={saveTemplate} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {tplId ? "Atualizar" : "Salvar"}
                </Button></div>
                <div className="self-end"><Button variant="ghost" size="sm" onClick={deleteTemplate} disabled={!tplId}>
                  <Trash2 className="w-4 h-4" />
                </Button></div>
              </div>

              <div>
                <label className="text-xs font-medium">Nome do template</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium">
                  Mensagem <span className="text-muted-foreground">(use {"{nome}"} para primeiro nome)</span>
                </label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={12} />
              </div>

              <div>
                <label className="text-xs font-medium">URL da imagem (opcional)</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs font-medium">Audiência</label>
                  <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Alunos ativos ({activeCount})</SelectItem>
                      <SelectItem value="all">Todos os cadastrados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <Button variant="outline" onClick={doPreview} disabled={sending}>
                  <Eye className="w-4 h-4 mr-1" /> Pré-visualizar
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={sending || !message.trim()}>
                  <Send className="w-4 h-4 mr-1" /> Disparar
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                <h2 className="font-semibold">Últimos disparos</h2>
              </div>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum disparo registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {runs.map((r) => (
                    <div key={r.id} className="text-sm border rounded-md p-2 flex flex-wrap gap-3 items-center">
                      <Badge variant={r.status === "finished" ? "outline" : "default"}>{r.status}</Badge>
                      {r.dry_run && <Badge variant="secondary">preview</Badge>}
                      <span>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                      <span className="text-muted-foreground">audiência: {r.audience}</span>
                      <span>total: {r.total}</span>
                      <span className="text-emerald-600">enviadas: {r.sent}</span>
                      <span className="text-red-600">falhas: {r.failed}</span>
                      <span className="text-muted-foreground">puladas: {r.skipped}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Preview modal */}
        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Pré-visualização</DialogTitle></DialogHeader>
            {preview && (
              <div className="space-y-3">
                <p className="text-sm">Serão disparados <b>{preview.total}</b> mensagens.</p>
                <div className="space-y-2">
                  {(preview.preview || []).map((p: any, i: number) => (
                    <div key={i} className="border rounded p-2 text-sm">
                      <div className="font-medium">{p.name} · {p.phone}</div>
                      <pre className="whitespace-pre-wrap text-xs mt-1">{p.rendered}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm modal */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirmar disparo</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p>Isso enviará a mensagem para <b>{activeCount}</b> alunos ativos via W-API (Fale com o Nutri), com espaçamento de 2s entre mensagens.</p>
              <p className="text-muted-foreground">O envio roda em segundo plano. Acompanhe o progresso na tabela de histórico.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                <Button onClick={doSend} disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Confirmar disparo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
