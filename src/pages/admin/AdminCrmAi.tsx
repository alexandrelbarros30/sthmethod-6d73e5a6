import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Run { id: string; prompt: string | null; response: string | null; model: string | null; created_at: string; }
type Engine = "openai" | "lovable" | "gemini_api" | "local";
type AiMode = "off" | "auto" | "ai_only";
const PROMPT_KEYS = [
  { key: "ai_prompt_comercial", label: "Comercial (Leads / WhatsApp Comercial)" },
  { key: "ai_prompt_sucesso", label: "Sucesso do Aluno (WhatsApp pós-venda)" },
  { key: "ai_prompt_aluno", label: "Chat dentro do App (Aluno autenticado)" },
  { key: "ai_prompt_treino", label: "STHIA — Elite Coach (Módulo de Treinos)" },
] as const;

export default function AdminCrmAi() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [engine, setEngine] = useState<Engine>("openai");
  const [aiMode, setAiMode] = useState<AiMode>("auto");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [promptEnabled, setPromptEnabled] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [templatesEnabled, setTemplatesEnabled] = useState(true);
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingRun, setSavingRun] = useState(false);

  async function load() {
    const [{ data: runsData }, { data: settings }] = await Promise.all([
      supabase
      .from("crm_ai_runs")
      .select("id, prompt, response, model, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
      supabase.from("crm_settings").select("key,value").in("key", [
        "ai_engine", "ai_mode", "ai_prompt_global", "ai_prompt_global_enabled", "ai_templates_enabled",
        ...PROMPT_KEYS.map(p => p.key),
        ...PROMPT_KEYS.map(p => `${p.key}_enabled`),
      ]),
    ]);
    setRuns((runsData ?? []) as Run[]);
    const map: Record<string, string> = {};
    const enabledMap: Record<string, boolean> = {};
    PROMPT_KEYS.forEach(p => { enabledMap[p.key] = true; }); // default ON
    let eng: Engine = "openai";
    (settings || []).forEach((s: any) => {
      if (s.key === "ai_engine") {
        const e = s.value?.engine;
        if (e === "openai" || e === "lovable" || e === "gemini_api" || e === "local") eng = e;
      } else if (s.key === "ai_mode") {
        const m = s.value?.mode;
        if (m === "off" || m === "auto" || m === "ai_only") setAiMode(m);
      } else if (s.key === "ai_prompt_global") {
        setGlobalPrompt(s.value?.prompt || "");
      } else if (s.key === "ai_prompt_global_enabled") {
        setGlobalEnabled(s.value?.enabled === true);
      } else if (s.key === "ai_templates_enabled") {
        setTemplatesEnabled(s.value?.enabled !== false);
      } else if (s.key.endsWith("_enabled")) {
        const base = s.key.replace(/_enabled$/, "");
        enabledMap[base] = s.value?.enabled !== false;
      } else {
        map[s.key] = s.value?.prompt || "";
      }
    });
    setEngine(eng);
    setPrompts(map);
    setPromptEnabled(enabledMap);
  }
  useEffect(() => { load(); }, []);

  async function saveEngine(next: Engine) {
    setEngine(next);
    const { error } = await supabase.from("crm_settings").upsert({ key: "ai_engine", value: { engine: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Engine atualizado", description: `Agora usando: ${next}` });
  }

  async function saveMode(next: AiMode) {
    setAiMode(next);
    const { error } = await supabase.from("crm_settings").upsert({ key: "ai_mode", value: { mode: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else {
      const label = next === "off" ? "Atendimento 100% humano (IA desligada)" : next === "ai_only" ? "IA Global responde TUDO (fluxos desligados)" : "Fluxo + IA como fallback";
      toast({ title: "Modo de atendimento atualizado", description: label });
    }
  }

  async function savePrompt(key: string) {
    setSavingKey(key);
    const { error } = await supabase.from("crm_settings").upsert({ key, value: { prompt: prompts[key] || "" } as any }, { onConflict: "key" });
    setSavingKey(null);
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Prompt salvo" });
  }

  async function saveGlobal() {
    setSavingGlobal(true);
    const { error } = await supabase.from("crm_settings").upsert([
      { key: "ai_prompt_global", value: { prompt: globalPrompt || "" } as any },
      { key: "ai_prompt_global_enabled", value: { enabled: globalEnabled } as any },
    ], { onConflict: "key" });
    setSavingGlobal(false);
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: globalEnabled ? "Prompt global ativo" : "Prompt global salvo (desativado)" });
  }

  async function toggleGlobal(next: boolean) {
    setGlobalEnabled(next);
    const { error } = await supabase.from("crm_settings").upsert({ key: "ai_prompt_global_enabled", value: { enabled: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: next ? "Prompt global ativado — substituirá os 3 canais" : "Prompt global desativado — voltando aos prompts por canal" });
  }

  async function togglePromptEnabled(key: string, next: boolean) {
    setPromptEnabled(p => ({ ...p, [key]: next }));
    const { error } = await supabase.from("crm_settings").upsert({ key: `${key}_enabled`, value: { enabled: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: next ? "Prompt deste canal ativado" : "Prompt deste canal suspenso" });
  }

  async function toggleTemplates(next: boolean) {
    setTemplatesEnabled(next);
    const { error } = await supabase.from("crm_settings").upsert({ key: "ai_templates_enabled", value: { enabled: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: next ? "Templates integrados como base da IA" : "Templates desconectados da IA" });
  }

  function startEditRun(r: Run) {
    setEditingRunId(r.id);
    setEditingText(r.response || "");
  }

  async function saveEditRun() {
    if (!editingRunId) return;
    setSavingRun(true);
    const { error } = await supabase.from("crm_ai_runs").update({ response: editingText }).eq("id", editingRunId);
    setSavingRun(false);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    toast({ title: "Resposta atualizada" });
    setEditingRunId(null);
    setEditingText("");
    load();
  }

  async function saveRunAsTemplate(r: Run) {
    const body = (editingRunId === r.id ? editingText : r.response) || "";
    if (!body.trim()) { toast({ title: "Vazio", description: "Nada para salvar" }); return; }
    const key = `ai_run_${r.id.slice(0, 8)}`;
    const name = (r.prompt || "Resposta IA").slice(0, 60);
    const { error } = await supabase.from("crm_message_templates").insert({
      key, name, body, category: "automacao", channel: "both", active: true, created_by: user?.id,
    });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Template criado e integrado à IA", description: name });
  }

  async function ask() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ai-suggest", { body: { prompt: prompt.trim() } });
      if (error) throw error;
      await supabase.from("crm_ai_runs").insert({ prompt: prompt.trim(), response: data?.response || "", model: data?.model || null, created_by: user?.id });
      setPrompt("");
      load();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao consultar IA" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout role="admin" title="Motor de Resposta IA" subtitle="ChatGPT / Gemini para os 3 canais (Comercial, Sucesso, App do Aluno)">
      <Card className="p-4 space-y-3 mb-4 border-primary/40">
        <Label>Forma de atendimento (WhatsApp Comercial / Sucesso / Nutri)</Label>
        <Select value={aiMode} onValueChange={(v) => saveMode(v as AiMode)}>
          <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Apenas fluxo + humano (IA desligada)</SelectItem>
            <SelectItem value="auto">Fluxo primeiro, IA como fallback (padrão)</SelectItem>
            <SelectItem value="ai_only">IA Global responde TUDO (ignora fluxo/menus) — modo de teste</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {aiMode === "ai_only" && "⚠️ A IA assumirá todas as conversas de WhatsApp. Menus, identificação de aluno e mensagens de ausência são ignorados. Atendimento humano (handoff) continua tendo prioridade."}
          {aiMode === "auto" && "Comportamento atual: o fluxo automatizado responde primeiro; quando não há resposta de fluxo, a IA assume."}
          {aiMode === "off" && "Apenas o fluxo automatizado (menus, ausência, handoff humano) — nenhuma chamada à IA será feita."}
        </p>
      </Card>

      <Card className="p-4 space-y-3 mb-4">
        <Label>Motor de IA usado em todos os canais</Label>
        <Select value={engine} onValueChange={(v) => saveEngine(v as Engine)}>
          <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI ChatGPT (gpt-4o-mini) — usa sua OPENAI_API_KEY</SelectItem>
            <SelectItem value="lovable">Lovable AI (Gemini 2.5 Flash) — sem chave</SelectItem>
            <SelectItem value="gemini_api">Gemini API direta (GEMINI_API_KEY)</SelectItem>
            <SelectItem value="local">Regras locais (fallback simples)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Aplica-se ao webhook do WhatsApp, sugestões no painel e chat do aluno.</p>
      </Card>

      <Card className="p-4 space-y-3 mb-6 border-primary/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm">Prompt global único</Label>
            <p className="text-[11px] text-muted-foreground mt-1">Quando ativado, este prompt substitui os prompts por canal (Comercial, Sucesso e Chat do Aluno) em todas as conversas.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{globalEnabled ? "Ativo" : "Inativo"}</span>
            <Switch checked={globalEnabled} onCheckedChange={toggleGlobal} />
          </div>
        </div>
        <Textarea rows={8} placeholder="Escreva aqui o prompt único que será usado em TODOS os canais quando o toggle estiver ativo..." value={globalPrompt} onChange={(e) => setGlobalPrompt(e.target.value)} />
        <div>
          <Button size="sm" variant="outline" onClick={saveGlobal} disabled={savingGlobal}>
            {savingGlobal ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
            Salvar prompt global
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2 mb-6 border-primary/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm">Templates como base de conhecimento da IA</Label>
            <p className="text-[11px] text-muted-foreground mt-1">Quando ativado, todos os templates ATIVOS de mensagens são enviados como referência ao motor de IA (Comercial recebe templates zapi/both, Sucesso recebe wapi/both, Chat do Aluno recebe both). Isso gera fluidez e mantém a IA alinhada à linguagem oficial.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{templatesEnabled ? "Integrado" : "Desligado"}</span>
            <Switch checked={templatesEnabled} onCheckedChange={toggleTemplates} />
          </div>
        </div>
      </Card>

      <div className="grid gap-3 mb-6">
        {PROMPT_KEYS.map(({ key, label }) => (
          <Card key={key} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">
                {label}
                {globalEnabled
                  ? (promptEnabled[key] ? " (auxiliar — soma ao prompt global)" : " (suspenso — apenas global opera)")
                  : (promptEnabled[key] ? "" : " (suspenso)")}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{promptEnabled[key] ? "Ativo" : "Suspenso"}</span>
                <Switch checked={promptEnabled[key] ?? true} onCheckedChange={(v) => togglePromptEnabled(key, v)} />
              </div>
            </div>
            <Textarea rows={5} value={prompts[key] || ""} onChange={(e) => setPrompts((p) => ({ ...p, [key]: e.target.value }))} disabled={!promptEnabled[key]} />
            <div>
              <Button size="sm" variant="outline" onClick={() => savePrompt(key)} disabled={savingKey === key}>
                {savingKey === key ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                Salvar prompt
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3">
        <Label className="text-xs">Teste rápido (gera uma sugestão usando o engine selecionado)</Label>
        <Textarea rows={4} placeholder="Ex: gere uma mensagem cordial pedindo o peso atual do aluno" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button size="sm" onClick={ask} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
          Gerar
        </Button>
      </Card>

      <div className="mt-6 space-y-3">
        {runs.map((r) => (
          <Card key={r.id} className="p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")} · {r.model || "—"}</p>
            <p className="text-xs text-muted-foreground"><b>Prompt:</b> {r.prompt}</p>
            {editingRunId === r.id ? (
              <Textarea rows={6} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{r.response}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {editingRunId === r.id ? (
                <>
                  <Button size="sm" variant="default" onClick={saveEditRun} disabled={savingRun}>
                    {savingRun ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Salvar edição
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingRunId(null); setEditingText(""); }}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEditRun(r)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar resposta
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => saveRunAsTemplate(r)}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Salvar como template (integra à IA)
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}