import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Cpu, Save, Sparkles, MessageSquare, AlertCircle, Send, Bot, User, Trash2, FlaskConical, Search, UserCheck, UserX, UserPlus, HelpCircle, Globe, ExternalLink } from "lucide-react";

const PROVIDERS = [
  { value: "lovable_gemini", label: "Lovable Gemini (recomendado)", desc: "Usa o Lovable AI Gateway com Google Gemini. Sem chave própria, sem custo extra." },
  { value: "lovable_gpt",    label: "Lovable GPT (OpenAI via gateway)", desc: "Usa o Lovable AI Gateway com modelos OpenAI. Sem chave própria." },
  { value: "custom_prompt",  label: "Prompt customizado (Lovable AI)", desc: "Usa o gateway Lovable, mas substitui o system prompt pelo seu prompt customizado." },
  { value: "gemini_direct",  label: "API Gemini direta (chave própria)", desc: "Conecta direto à API Google Gemini usando GEMINI_API_KEY." },
  { value: "openai_direct",  label: "API ChatGPT direta (chave própria)", desc: "Conecta direto à API OpenAI usando OPENAI_API_KEY." },
];

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  lovable_gemini: ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "google/gemini-2.5-pro", "google/gemini-3-flash-preview"],
  lovable_gpt:    ["openai/gpt-5-mini", "openai/gpt-5", "openai/gpt-5-nano"],
  custom_prompt:  ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini"],
  gemini_direct:  ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
  openai_direct:  ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
};

type Greeting = { id: string; classification: string; label: string; message: string; enabled: boolean };
type Config = { provider: string; model: string; custom_system_prompt: string | null; temperature: number; auto_greeting_enabled: boolean };

type SimMsg = {
  role: "user" | "assistant";
  text: string;
  meta?: {
    intent?: string; engine?: string; contact_type?: string;
    latency_ms?: number; draft_id?: string; sent?: boolean;
    web_grounded?: boolean;
    web_sources?: { title: string; uri: string }[];
  };
};

type Identity = {
  phone: string;
  known: boolean;
  contact_type: string;
  suggested_engine: string;
  full_name: string | null;
  email: string | null;
  user_id: string | null;
  plan_name: string | null;
  plan_status: string | null;
  end_date: string | null;
  days_remaining: number | null;
  has_active_subscription: boolean;
  objective: string | null;
  memory_score: number | null;
  temperature: string | null;
  summary: string;
};

const CONTACT_TYPE_STYLE: Record<string, { color: string; Icon: any; label: string }> = {
  aluno_ativo:   { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", Icon: UserCheck, label: "Aluno ativo" },
  renovacao:     { color: "bg-amber-500/15 text-amber-300 border-amber-500/40",     Icon: UserCheck, label: "Renovação" },
  aluno_inativo: { color: "bg-rose-500/15 text-rose-300 border-rose-500/40",        Icon: UserX,     label: "Aluno inativo" },
  lead:          { color: "bg-sky-500/15 text-sky-300 border-sky-500/40",           Icon: UserPlus,  label: "Lead" },
  tool_user:     { color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/40",        Icon: HelpCircle, label: "Desconhecido" },
};

function IdentityCard({ data }: { data: Identity }) {
  const style = CONTACT_TYPE_STYLE[data.contact_type] || CONTACT_TYPE_STYLE.tool_user;
  const Icon = style.Icon;
  return (
    <div className={`rounded-md border p-3 space-y-2 ${style.color}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5">{style.label}</Badge>
            {data.has_active_subscription && <Badge variant="outline" className="text-[10px] h-5">Assinatura ativa</Badge>}
            {!data.known && <Badge variant="outline" className="text-[10px] h-5">Sem registro</Badge>}
            {data.temperature && <Badge variant="outline" className="text-[10px] h-5">{data.temperature}</Badge>}
          </div>
          <p className="text-sm font-medium mt-1">{data.summary}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            <div><strong className="text-foreground">Nome:</strong> {data.full_name || "—"}</div>
            <div><strong className="text-foreground">Plano:</strong> {data.plan_name || "—"}</div>
            <div><strong className="text-foreground">Objetivo:</strong> {data.objective || "—"}</div>
            <div><strong className="text-foreground">Dias restantes:</strong> {data.days_remaining ?? "—"}</div>
            <div><strong className="text-foreground">Score memória:</strong> {data.memory_score ?? 0}/100</div>
            <div><strong className="text-foreground">Motor sugerido:</strong> {data.suggested_engine}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CLASSIFICATIONS = [
  { value: "auto", label: "Auto (deixar IA detectar)" },
  { value: "aluno_ativo", label: "Aluno ativo" },
  { value: "renovacao", label: "Renovação (vencendo)" },
  { value: "aluno_inativo", label: "Aluno inativo" },
  { value: "lead", label: "Lead (possível cliente)" },
  { value: "tool_user", label: "Novo / desconhecido" },
];

export default function AdminSthEngine() {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [greetings, setGreetings] = useState<Greeting[]>([]);

  const { data: cfgData } = useQuery({
    queryKey: ["sth-engine-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sth_engine_config").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as Config;
    },
  });

  const { data: grData } = useQuery({
    queryKey: ["sth-greetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sth_greeting_templates")
        .select("id, classification, label, message, enabled")
        .order("classification");
      if (error) throw error;
      return data as Greeting[];
    },
  });

  useEffect(() => { if (cfgData) setCfg(cfgData); }, [cfgData]);
  useEffect(() => { if (grData) setGreetings(grData); }, [grData]);

  const saveConfig = async () => {
    if (!cfg) return;
    const { error } = await supabase.from("sth_engine_config").update({
      provider: cfg.provider,
      model: cfg.model,
      custom_system_prompt: cfg.custom_system_prompt,
      temperature: cfg.temperature,
      auto_greeting_enabled: cfg.auto_greeting_enabled,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Motor de resposta atualizado");
    qc.invalidateQueries({ queryKey: ["sth-engine-config"] });
  };

  const saveGreeting = async (g: Greeting) => {
    const { error } = await supabase.from("sth_greeting_templates").update({
      message: g.message, enabled: g.enabled, updated_at: new Date().toISOString(),
    }).eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success(`Saudação "${g.label}" salva`);
  };

  if (!cfg) return <div className="p-6 text-muted-foreground">Carregando…</div>;

  const providerInfo = PROVIDERS.find(p => p.value === cfg.provider);
  const needsOwnKey = cfg.provider === "openai_direct" || cfg.provider === "gemini_direct";

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" /> Motor de Resposta STH
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha qual IA gera os rascunhos, configure saudações e teste a conversa em modo treino.
        </p>
      </header>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config"><Cpu className="h-4 w-4 mr-2" /> Configuração</TabsTrigger>
          <TabsTrigger value="greetings"><MessageSquare className="h-4 w-4 mr-2" /> Saudações</TabsTrigger>
          <TabsTrigger value="simulator"><FlaskConical className="h-4 w-4 mr-2" /> Simulador</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Provedor de IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v, model: MODELS_BY_PROVIDER[v]?.[0] || cfg.model })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {providerInfo && <p className="text-xs text-muted-foreground">{providerInfo.desc}</p>}
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select value={cfg.model} onValueChange={(v) => setCfg({ ...cfg, model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(MODELS_BY_PROVIDER[cfg.provider] || []).map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cfg.provider === "custom_prompt" && (
            <div className="space-y-2">
              <Label>Prompt customizado (system)</Label>
              <Textarea
                rows={8}
                placeholder="Você é o atendente STH METHOD. Tom direto, técnico, sem prometer cura..."
                value={cfg.custom_system_prompt || ""}
                onChange={(e) => setCfg({ ...cfg, custom_system_prompt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Esse prompt substitui o padrão STH. O contexto (memória, CRM, KB) continua sendo injetado automaticamente.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Temperatura ({cfg.temperature})</Label>
            <Input
              type="range" min="0" max="1" step="0.1"
              value={cfg.temperature}
              onChange={(e) => setCfg({ ...cfg, temperature: parseFloat(e.target.value) })}
            />
          </div>

          {needsOwnKey && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Esse provedor usa sua chave própria. Garanta que a secret <code className="font-mono">
                  {cfg.provider === "gemini_direct" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"}
                </code> esteja configurada em Lovable Cloud.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-3">
              <Switch
                checked={cfg.auto_greeting_enabled}
                onCheckedChange={(v) => setCfg({ ...cfg, auto_greeting_enabled: v })}
              />
              <span className="text-sm">Saudação automática ao iniciar conversa</span>
            </div>
            <Button onClick={saveConfig}><Save className="h-4 w-4 mr-2" /> Salvar motor</Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="greetings" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Saudações por classificação
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Variáveis disponíveis: <code>{"{nome}"}</code>, <code>{"{plano}"}</code>, <code>{"{dias_restantes}"}</code>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {greetings.map((g, idx) => (
            <div key={g.id} className="space-y-2 p-3 rounded-md border border-border/40">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{g.classification}</Badge>
                  <span className="text-sm font-medium">{g.label}</span>
                </div>
                <Switch
                  checked={g.enabled}
                  onCheckedChange={(v) => {
                    const next = [...greetings]; next[idx] = { ...g, enabled: v }; setGreetings(next);
                  }}
                />
              </div>
              <Textarea
                rows={3}
                value={g.message}
                onChange={(e) => {
                  const next = [...greetings]; next[idx] = { ...g, message: e.target.value }; setGreetings(next);
                }}
              />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => saveGreeting(g)}>
                  <Save className="h-3.5 w-3.5 mr-2" /> Salvar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <SimulatorPanel currentProvider={cfg.provider} currentModel={cfg.model} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SimulatorPanel({ currentProvider, currentModel }: { currentProvider: string; currentModel: string }) {
  const [phone, setPhone] = useState("5511999990000");
  const [classification, setClassification] = useState("auto");
  const [sendReal, setSendReal] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<SimMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [identity, setIdentity] = useState<any | null>(null);
  const [webGrounding, setWebGrounding] = useState(true);

  const identify = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) return toast.error("Informe um telefone válido (DDI+DDD+número)");
    setIdentifying(true);
    setIdentity(null);
    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-engine", {
        body: { action: "identify", phone: cleanPhone },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao identificar");
      setIdentity(data.identification);
      toast.success(data.identification?.summary || "Identificação concluída");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao identificar contato");
    } finally {
      setIdentifying(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) return toast.error("Informe um telefone válido (DDI+DDD+número)");

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-engine", {
        body: {
          action: "generate",
          phone: cleanPhone,
          inbound_text: text,
          web_grounding: webGrounding,
          ...(classification !== "auto" ? { force_classification: classification } : {}),
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao gerar resposta");

      const draft = data.draft;
      const reply = draft?.draft_text || "(sem resposta)";
      const meta = {
        intent: data.intent,
        engine: data.engine,
        contact_type: data.contact_type,
        latency_ms: data.latency_ms,
        draft_id: draft?.id,
        sent: false,
        web_grounded: data.web_grounded,
        web_sources: data.web_sources || [],
      };

      setMessages((m) => [...m, { role: "assistant", text: reply, meta }]);

      if (sendReal && draft?.id) {
        const { data: sd, error: serr } = await supabase.functions.invoke("sth-ai-engine", {
          body: { action: "send", draft_id: draft.id },
        });
        if (serr || !sd?.ok) {
          toast.error(`Falha no envio real: ${serr?.message || sd?.error || "erro"}`);
        } else {
          toast.success("Mensagem enviada via WhatsApp");
          setMessages((m) => m.map((x) => (x.meta?.draft_id === draft.id ? { ...x, meta: { ...x.meta, sent: true } } : x)));
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao chamar o motor");
    } finally {
      setLoading(false);
    }
  };

  const rateDraft = async (draftId: string, action: "approve" | "reject") => {
    const { error } = await supabase.functions.invoke("sth-ai-engine", {
      body: { action, draft_id: draftId, ...(action === "reject" ? { reason: "Treino: resposta ruim" } : {}) },
    });
    if (error) return toast.error(error.message);
    toast.success(action === "approve" ? "Marcada como boa ✅" : "Marcada como ruim — vai pro aprendizado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" /> Simulador de Conversa
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Converse como se fosse um contato. Cada mensagem usa o motor ativo ({currentProvider} · {currentModel}) e fica salva como draft em <code>sth_ai_drafts</code> para aprendizado.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Telefone simulado</Label>
            <div className="flex gap-2">
              <Input value={phone} onChange={(e) => { setPhone(e.target.value); setIdentity(null); }} placeholder="5511999990000" />
              <Button variant="secondary" size="sm" onClick={identify} disabled={identifying}>
                <Search className="h-4 w-4 mr-1" /> {identifying ? "…" : "Identificar"}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Classificação</Label>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Envio real (WhatsApp)</Label>
            <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input">
              <Switch checked={sendReal} onCheckedChange={setSendReal} />
              <span className="text-xs text-muted-foreground">
                {sendReal ? "Vai disparar de verdade!" : "Apenas simulação"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Buscar na web</Label>
            <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-input">
              <Switch checked={webGrounding} onCheckedChange={setWebGrounding} />
              <span className="text-xs text-muted-foreground">
                {webGrounding ? "Grounding ativo (Gemini)" : "Só contexto interno"}
              </span>
            </div>
          </div>
        </div>

        {identity && <IdentityCard data={identity} />}

        <div className="h-[460px] overflow-y-auto rounded-md border border-border/40 bg-muted/20 p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-12">
              Envie a primeira mensagem como se fosse o contato.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && <Bot className="h-5 w-5 text-primary mt-1 shrink-0" />}
              <div className={`max-w-[80%] space-y-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border/60 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "assistant" && m.meta && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    {m.meta.contact_type && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{m.meta.contact_type}</Badge>}
                    {m.meta.intent && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{m.meta.intent}</Badge>}
                    {m.meta.engine && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{m.meta.engine}</Badge>}
                    {typeof m.meta.latency_ms === "number" && <span>{m.meta.latency_ms}ms</span>}
                    {m.meta.sent && <Badge className="text-[10px] h-4 px-1.5">enviado</Badge>}
                    {m.meta.web_grounded && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-500/40 text-emerald-300">
                        <Globe className="h-2.5 w-2.5 mr-0.5" /> web
                      </Badge>
                    )}
                    {m.meta.draft_id && (
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => rateDraft(m.meta!.draft_id!, "approve")} className="hover:text-primary">👍</button>
                        <button onClick={() => rateDraft(m.meta!.draft_id!, "reject")} className="hover:text-destructive">👎</button>
                      </div>
                    )}
                  </div>
                )}
                {m.role === "assistant" && m.meta?.web_sources && m.meta.web_sources.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Fontes consultadas</p>
                    {m.meta.web_sources.slice(0, 5).map((s, idx) => (
                      <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-sky-400 hover:underline truncate">
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && <User className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-4 w-4 animate-pulse" /> gerando resposta…
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Digite como se fosse o contato…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4 mr-2" /> Enviar
          </Button>
          <Button variant="outline" onClick={() => setMessages([])} disabled={loading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}