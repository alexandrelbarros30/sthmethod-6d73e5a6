import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Zap, Heart, Brain, DollarSign, RefreshCw, Send, Check, X, Plus, AlertTriangle, Clock, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const ENGINE_META: Record<string, { icon: any; label: string; color: string }> = {
  rapida: { icon: Zap, label: "Rápida", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
  humanizada: { icon: Heart, label: "Humanizada", color: "text-pink-400 border-pink-500/40 bg-pink-500/10" },
  consultor: { icon: Brain, label: "Consultor", color: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
  conversao: { icon: DollarSign, label: "Conversão", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  retencao: { icon: RefreshCw, label: "Retenção", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  renovacao: { icon: Sparkles, label: "Renovação", color: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10" },
};

const INTENT_OPTIONS = ["dieta","treino","protocolo","exames","atualizacao","pagamento","renovacao","cancelamento","duvida_geral","conversao"];

type Draft = any;
type Template = any;

export default function AdminSthAiEngine({ area = "admin" as "admin" | "consultor" }) {
  const [stats, setStats] = useState<any>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [unsolved, setUnsolved] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [editText, setEditText] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ phone: "", inbound_text: "", engine: "" as string });
  const [tplOpen, setTplOpen] = useState<Template | null>(null);

  async function loadAll() {
    setLoading(true);
    const [{ data: s }, { data: d }, { data: t }, { data: u }] = await Promise.all([
      supabase.rpc("sth_ai_engine_stats"),
      supabase.from("sth_ai_drafts").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("sth_ai_templates").select("*").order("uses_count", { ascending: false }).limit(200),
      supabase.from("sth_ai_unsolved").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(50),
    ]);
    setStats(s);
    setDrafts(d || []);
    setTemplates(t || []);
    setUnsolved(u || []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const filteredDrafts = useMemo(() => drafts.filter(d => statusFilter === "all" || d.status === statusFilter), [drafts, statusFilter]);

  async function callEngine(payload: any) {
    const { data, error } = await supabase.functions.invoke("sth-ai-engine", { body: payload });
    if (error) { toast.error(error.message); return null; }
    if (data?.ok === false) { toast.error(data.error || "Falha"); return null; }
    return data;
  }

  async function handleGenerate() {
    if (!genForm.phone || !genForm.inbound_text) return toast.error("Telefone e mensagem são obrigatórios");
    toast.loading("Gerando rascunho...", { id: "gen" });
    const r = await callEngine({ action: "generate", ...genForm, engine: genForm.engine || undefined });
    toast.dismiss("gen");
    if (r) { toast.success("Rascunho criado"); setGenOpen(false); setGenForm({ phone: "", inbound_text: "", engine: "" }); loadAll(); }
  }

  async function handleApprove(d: Draft, edited?: string) {
    const r = await callEngine({ action: "approve", draft_id: d.id, final_text: edited });
    if (r) { toast.success(edited ? "Rascunho editado e aprovado" : "Aprovado"); setSelected(null); loadAll(); }
  }
  async function handleReject(d: Draft) {
    const reason = prompt("Motivo da rejeição (opcional)") || undefined;
    const r = await callEngine({ action: "reject", draft_id: d.id, reason });
    if (r) { toast.success("Rejeitado"); setSelected(null); loadAll(); }
  }
  async function handleSend(d: Draft) {
    if (!confirm("Enviar agora via WhatsApp?")) return;
    const r = await callEngine({ action: "send", draft_id: d.id });
    if (r) { toast.success("Mensagem enviada"); setSelected(null); loadAll(); }
  }

  async function saveTemplate(t: Partial<Template>) {
    const payload = {
      name: t.name, category: t.category, engine: t.engine || "humanizada",
      body: t.body, active: t.active ?? true, tags: t.tags || [],
    };
    if (t.id) {
      const { error } = await supabase.from("sth_ai_templates").update(payload).eq("id", t.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("sth_ai_templates").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Template salvo");
    setTplOpen(null);
    loadAll();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Excluir template?")) return;
    const { error } = await supabase.from("sth_ai_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  }

  async function ackUnsolved(id: string) {
    await supabase.from("sth_ai_unsolved").update({ resolved: true }).eq("id", id);
    loadAll();
  }

  return (
    <DashboardLayout role={area} title="STH AI ENGINE" subtitle="Motor de respostas inteligentes — aprovação humana sempre">
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-3">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">STH AI ENGINE</h1>
            <p className="text-sm text-muted-foreground">Gemini AI + CRM + Memória. Cada resposta passa por aprovação humana.</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black"><Plus className="h-4 w-4" /> Novo rascunho</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Gerar resposta IA</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input value={genForm.phone} onChange={(e) => setGenForm({ ...genForm, phone: e.target.value })} placeholder="21998496289" />
                  </div>
                  <div>
                    <Label>Mensagem recebida</Label>
                    <Textarea rows={4} value={genForm.inbound_text} onChange={(e) => setGenForm({ ...genForm, inbound_text: e.target.value })} placeholder="Cole aqui a pergunta do contato..." />
                  </div>
                  <div>
                    <Label>Motor (opcional — auto-detecta)</Label>
                    <Select value={genForm.engine} onValueChange={(v) => setGenForm({ ...genForm, engine: v })}>
                      <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENGINE_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleGenerate}><Sparkles className="h-4 w-4" /> Gerar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Aguardando", value: stats?.pending ?? "—", color: "text-amber-400" },
            { label: "Enviadas hoje", value: stats?.sent_today ?? "—", color: "text-emerald-400" },
            { label: "Enviadas 30d", value: stats?.sent_30d ?? "—", color: "text-foreground" },
            { label: "Rejeitadas 30d", value: stats?.rejected_30d ?? "—", color: "text-rose-400" },
            { label: "Latência média", value: stats?.avg_latency_ms ? `${stats.avg_latency_ms}ms` : "—", color: "text-cyan-400" },
            { label: "Sem solução", value: stats?.unsolved_open ?? "—", color: "text-rose-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="drafts">
          <TabsList>
            <TabsTrigger value="drafts"><MessageSquare className="h-3.5 w-3.5 mr-1" />Rascunhos</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="h-3.5 w-3.5 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="insights"><Brain className="h-3.5 w-3.5 mr-1" />Insights</TabsTrigger>
            <TabsTrigger value="unsolved"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Sem solução</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {["pending","approved","edited","sent","rejected","all"].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>{s}</Button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {loading && <div className="text-sm text-muted-foreground col-span-full">Carregando...</div>}
              {!loading && filteredDrafts.length === 0 && <div className="text-sm text-muted-foreground col-span-full">Nenhum rascunho no filtro selecionado.</div>}
              {filteredDrafts.map((d) => {
                const M = ENGINE_META[d.engine] || ENGINE_META.humanizada;
                const Icon = M.icon;
                return (
                  <motion.button key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => { setSelected(d); setEditText(d.final_text || d.draft_text); }}
                    className="text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-emerald-500/40 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={`border ${M.color}`}><Icon className="h-3 w-3 mr-1" />{M.label}</Badge>
                        {d.intent && <Badge variant="outline" className="text-xs">{d.intent}</Badge>}
                        {d.contact_type && <Badge variant="outline" className="text-xs">{d.contact_type}</Badge>}
                      </div>
                      <Badge variant={d.status === "pending" ? "default" : "outline"} className="text-xs">{d.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm font-medium truncate">{d.contact_name || d.phone}</div>
                    <div className="mt-1 text-xs text-muted-foreground italic line-clamp-2">"{d.inbound_text}"</div>
                    <div className="mt-2 text-sm line-clamp-3">{d.final_text || d.draft_text}</div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(d.created_at).toLocaleString("pt-BR")}
                      {d.latency_ms && <span>· {d.latency_ms}ms</span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-3 mt-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setTplOpen({ name: "", category: "duvida_geral", engine: "humanizada", body: "", active: true })}>
                <Plus className="h-4 w-4" /> Novo template
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((t) => {
                const M = ENGINE_META[t.engine] || ENGINE_META.humanizada;
                return (
                  <Card key={t.id} className="border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate">{t.name}</div>
                        <Badge className={`border ${M.color}`}>{M.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.category} · usos: {t.uses_count} · sucesso: {t.success_count}</div>
                      <div className="text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">{t.body}</div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setTplOpen(t)}>Editar</Button>
                        <Button size="sm" variant="outline" onClick={() => saveTemplate({ ...t, active: !t.active })}>{t.active ? "Desativar" : "Ativar"}</Button>
                        <Button size="sm" variant="outline" className="ml-auto text-rose-400" onClick={() => deleteTemplate(t.id)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top intenções (30d)</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {(stats?.top_intents || []).length === 0 && <div className="text-xs text-muted-foreground">Sem dados ainda.</div>}
                  {(stats?.top_intents || []).map((i: any) => (
                    <div key={i.intent} className="flex justify-between text-sm">
                      <span>{i.intent}</span><span className="text-muted-foreground">{i.count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Templates mais usados</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {(stats?.top_templates || []).length === 0 && <div className="text-xs text-muted-foreground">Sem dados ainda.</div>}
                  {(stats?.top_templates || []).map((t: any) => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{t.name}</span>
                      <span className="text-muted-foreground">{t.uses} usos · {t.success} ✓</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="unsolved" className="space-y-2 mt-3">
            {unsolved.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma mensagem sem solução.</div>}
            {unsolved.map((u) => (
              <Card key={u.id} className="border-rose-500/30 bg-rose-500/5">
                <CardContent className="p-3 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{u.phone}</div>
                    <div className="text-sm italic">"{u.question}"</div>
                    {u.reason && <div className="text-xs text-muted-foreground mt-1">Motivo: {u.reason}</div>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => ackUnsolved(u.id)}>Marcar resolvida</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Draft drawer */}
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-400" /> Rascunho IA
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selected.engine}</Badge>
                    {selected.intent && <Badge variant="outline">{selected.intent}</Badge>}
                    {selected.contact_type && <Badge variant="outline">{selected.contact_type}</Badge>}
                    <Badge variant="outline">{selected.status}</Badge>
                  </div>
                  <div className="text-sm"><b>Contato:</b> {selected.contact_name || "—"} ({selected.phone})</div>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs">Mensagem recebida</CardTitle></CardHeader>
                    <CardContent className="text-sm italic">"{selected.inbound_text}"</CardContent>
                  </Card>
                  <div>
                    <Label className="text-xs">Resposta (editável)</Label>
                    <Textarea rows={8} value={editText} onChange={(e) => setEditText(e.target.value)} className="font-mono text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black" onClick={() => handleApprove(selected, editText !== selected.draft_text ? editText : undefined)}>
                          <Check className="h-4 w-4" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(selected)}>
                          <X className="h-4 w-4" /> Rejeitar
                        </Button>
                      </>
                    )}
                    {["approved","edited","pending"].includes(selected.status) && (
                      <Button size="sm" variant="outline" className="ml-auto" onClick={() => handleSend({ ...selected, final_text: editText })}>
                        <Send className="h-4 w-4" /> Enviar WhatsApp
                      </Button>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Modelo: {selected.model} · {selected.latency_ms}ms · tokens {selected.tokens_in || 0}/{selected.tokens_out || 0}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Template editor */}
        <Dialog open={!!tplOpen} onOpenChange={(o) => !o && setTplOpen(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{tplOpen?.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
            {tplOpen && (
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={tplOpen.name || ""} onChange={(e) => setTplOpen({ ...tplOpen, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={tplOpen.category || "duvida_geral"} onValueChange={(v) => setTplOpen({ ...tplOpen, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{INTENT_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Motor</Label>
                    <Select value={tplOpen.engine || "humanizada"} onValueChange={(v) => setTplOpen({ ...tplOpen, engine: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ENGINE_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Corpo</Label>
                  <Textarea rows={8} value={tplOpen.body || ""} onChange={(e) => setTplOpen({ ...tplOpen, body: e.target.value })} placeholder="Texto do template (pode incluir variáveis como {nome})" />
                </div>
                <Button className="w-full" onClick={() => saveTemplate(tplOpen)}>Salvar</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}