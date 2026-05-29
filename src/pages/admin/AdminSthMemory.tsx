import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Brain, Flame, Clock, AlertTriangle, MessageSquare, RefreshCw, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type Memory = {
  id: string;
  phone: string;
  full_name: string | null;
  plan_name: string | null;
  plan_status: string | null;
  objective: string | null;
  current_weight: number | null;
  initial_weight: number | null;
  score: number;
  temperature: "frio" | "morno" | "quente" | "pronto";
  last_interaction_at: string | null;
  last_question: string | null;
  last_answer: string | null;
  preferred_tone: string | null;
  preferred_format: string | null;
  difficulties: string[] | null;
  preferences: string[] | null;
  photos_count: number;
};

const TEMP_COLOR: Record<Memory["temperature"], string> = {
  frio: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  morno: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  quente: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  pronto: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

type AreaRole = "admin" | "consultor";

export default function AdminSthMemory({ area = "admin" as AreaRole }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tempFilter, setTempFilter] = useState<"all" | Memory["temperature"]>("all");
  const [selected, setSelected] = useState<Memory | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [objections, setObjections] = useState<any[]>([]);
  const [learning, setLearning] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ event_type: "nota", event_title: "", event_description: "" });

  async function loadAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sth_memory")
      .select("*")
      .order("score", { ascending: false })
      .limit(500);
    if (error) toast.error("Falha ao carregar memórias");
    setMemories((data || []) as any);
    const { data: a } = await supabase
      .from("sth_memory_alerts")
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(100);
    setAlerts(a || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function openContact(m: Memory) {
    setSelected(m);
    const [{ data: t }, { data: o }, { data: l }] = await Promise.all([
      supabase.from("sth_memory_timeline").select("*").eq("memory_id", m.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("sth_memory_objections").select("*").eq("memory_id", m.id).order("created_at", { ascending: false }),
      supabase.from("sth_memory_learning").select("*").eq("memory_id", m.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setTimeline(t || []);
    setObjections(o || []);
    setLearning(l || []);
  }

  async function recalcScore(id: string) {
    const { error } = await supabase.rpc("sth_memory_recalc_score", { _memory_id: id });
    if (error) return toast.error(error.message);
    toast.success("Score recalculado");
    loadAll();
    if (selected?.id === id) {
      const { data } = await supabase.from("sth_memory").select("*").eq("id", id).maybeSingle();
      if (data) setSelected(data as any);
    }
  }

  async function addEvent() {
    if (!selected || !newEvent.event_title.trim()) return;
    const { error } = await supabase.from("sth_memory_timeline").insert({
      memory_id: selected.id,
      event_type: newEvent.event_type || "nota",
      event_title: newEvent.event_title,
      event_description: newEvent.event_description || null,
    });
    if (error) return toast.error(error.message);
    setNewEvent({ event_type: "nota", event_title: "", event_description: "" });
    toast.success("Evento adicionado à timeline");
    openContact(selected);
  }

  async function ackAlert(id: string) {
    const { error } = await supabase
      .from("sth_memory_alerts")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return memories.filter((m) => {
      if (tempFilter !== "all" && m.temperature !== tempFilter) return false;
      if (!q) return true;
      return (
        (m.full_name || "").toLowerCase().includes(q) ||
        (m.phone || "").includes(q) ||
        (m.objective || "").toLowerCase().includes(q)
      );
    });
  }, [memories, search, tempFilter]);

  const stats = useMemo(() => {
    return {
      total: memories.length,
      pronto: memories.filter((m) => m.temperature === "pronto").length,
      quente: memories.filter((m) => m.temperature === "quente").length,
      morno: memories.filter((m) => m.temperature === "morno").length,
      frio: memories.filter((m) => m.temperature === "frio").length,
      alerts: alerts.length,
    };
  }, [memories, alerts]);

  return (
    <DashboardLayout role={area} title="STH MEMORY" subtitle="Memória inteligente do STH One">
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-3">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">STH MEMORY</h1>
            <p className="text-sm text-muted-foreground">Memória inteligente — leads, alunos, histórico, score e alertas.</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={loadAll}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Pronto", value: stats.pronto, color: "text-emerald-400" },
            { label: "Quente", value: stats.quente, color: "text-orange-400" },
            { label: "Morno", value: stats.morno, color: "text-amber-400" },
            { label: "Frio", value: stats.frio, color: "text-slate-400" },
            { label: "Alertas", value: stats.alerts, color: "text-rose-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {alerts.length > 0 && (
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> Alertas abertos ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.message}</div>
                    <div className="text-xs text-muted-foreground">{a.alert_type} · {new Date(a.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => ackAlert(a.id)}>OK</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Buscar por nome, telefone ou objetivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
          <Tabs value={tempFilter} onValueChange={(v) => setTempFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pronto">Pronto</TabsTrigger>
              <TabsTrigger value="quente">Quente</TabsTrigger>
              <TabsTrigger value="morno">Morno</TabsTrigger>
              <TabsTrigger value="frio">Frio</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading && <div className="col-span-full text-sm text-muted-foreground">Carregando...</div>}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">Nenhuma memória encontrada. As memórias são criadas automaticamente quando o STH One conversa com leads/alunos.</div>
          )}
          {filtered.map((m) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openContact(m)}
              className="text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.full_name || "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">{m.phone}</div>
                </div>
                <Badge className={`border ${TEMP_COLOR[m.temperature]}`}>{m.temperature.toUpperCase()}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                Score {m.score}/100
                {m.plan_name && <span>· {m.plan_name}</span>}
              </div>
              {m.objective && <div className="mt-2 text-xs line-clamp-2 text-foreground/80">🎯 {m.objective}</div>}
              {m.last_question && (
                <div className="mt-2 text-xs italic line-clamp-2 text-muted-foreground">
                  "{m.last_question}"
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-400" />
                    {selected.full_name || selected.phone}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`border ${TEMP_COLOR[selected.temperature]}`}>{selected.temperature.toUpperCase()}</Badge>
                    <Badge variant="outline">Score {selected.score}/100</Badge>
                    {selected.plan_name && <Badge variant="outline">{selected.plan_name}</Badge>}
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => recalcScore(selected.id)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Recalcular score
                    </Button>
                  </div>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Telefone: </span>{selected.phone}</div>
                      <div><span className="text-muted-foreground">Status: </span>{selected.plan_status || "—"}</div>
                      <div><span className="text-muted-foreground">Peso inicial: </span>{selected.initial_weight ?? "—"}</div>
                      <div><span className="text-muted-foreground">Peso atual: </span>{selected.current_weight ?? "—"}</div>
                      <div><span className="text-muted-foreground">Tom: </span>{selected.preferred_tone || "—"}</div>
                      <div><span className="text-muted-foreground">Formato: </span>{selected.preferred_format || "—"}</div>
                      <div className="col-span-2"><span className="text-muted-foreground">Objetivo: </span>{selected.objective || "—"}</div>
                      {selected.last_question && (
                        <div className="col-span-2 rounded-lg bg-muted/40 p-2 text-xs">
                          <div className="text-muted-foreground">Última pergunta:</div>
                          <div>"{selected.last_question}"</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="timeline">
                    <TabsList className="w-full">
                      <TabsTrigger value="timeline" className="flex-1"><Clock className="h-3.5 w-3.5 mr-1" />Timeline</TabsTrigger>
                      <TabsTrigger value="objections" className="flex-1"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Objeções</TabsTrigger>
                      <TabsTrigger value="learning" className="flex-1"><BookOpen className="h-3.5 w-3.5 mr-1" />Aprendizado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="space-y-3">
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <Label className="text-xs">Adicionar evento</Label>
                          <Input
                            placeholder="Tipo (cadastro, dieta_enviada, dificuldade...)"
                            value={newEvent.event_type}
                            onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                          />
                          <Input
                            placeholder="Título"
                            value={newEvent.event_title}
                            onChange={(e) => setNewEvent({ ...newEvent, event_title: e.target.value })}
                          />
                          <Textarea
                            placeholder="Descrição (opcional)"
                            value={newEvent.event_description}
                            onChange={(e) => setNewEvent({ ...newEvent, event_description: e.target.value })}
                          />
                          <Button size="sm" onClick={addEvent}><Plus className="h-3.5 w-3.5" /> Registrar</Button>
                        </CardContent>
                      </Card>
                      <div className="space-y-2">
                        {timeline.length === 0 && <div className="text-xs text-muted-foreground">Sem eventos ainda.</div>}
                        {timeline.map((t) => (
                          <div key={t.id} className="rounded-lg border border-border/40 p-3">
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline">{t.event_type}</Badge>
                              <span className="text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="mt-1 font-medium text-sm">{t.event_title}</div>
                            {t.event_description && <div className="text-xs text-muted-foreground mt-1">{t.event_description}</div>}
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="objections" className="space-y-2">
                      {objections.length === 0 && <div className="text-xs text-muted-foreground">Sem objeções registradas.</div>}
                      {objections.map((o) => (
                        <div key={o.id} className="rounded-lg border border-border/40 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{o.objection_key}</Badge>
                            <Badge className={o.resolved ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}>
                              {o.resolved ? "Resolvida" : "Aberta"}
                            </Badge>
                          </div>
                          {o.raw_text && <div className="mt-2 text-xs italic">"{o.raw_text}"</div>}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="learning" className="space-y-2">
                      {learning.length === 0 && <div className="text-xs text-muted-foreground">Sem interações registradas.</div>}
                      {learning.map((l) => (
                        <div key={l.id} className="rounded-lg border border-border/40 p-3 text-sm space-y-1">
                          <div className="text-xs text-muted-foreground flex items-center justify-between">
                            <span><MessageSquare className="inline h-3 w-3 mr-1" />{l.engine || "ai"}{l.intent ? ` · ${l.intent}` : ""}</span>
                            <span>{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                          </div>
                          <div><b>P:</b> {l.question}</div>
                          {l.answer && <div className="text-muted-foreground"><b>R:</b> {l.answer}</div>}
                          {l.outcome && <Badge variant="outline" className="text-xs">{l.outcome}</Badge>}
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}