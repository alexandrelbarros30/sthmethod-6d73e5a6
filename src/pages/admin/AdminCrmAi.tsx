import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Run { id: string; prompt: string | null; response: string | null; model: string | null; created_at: string; }
type Engine = "openai" | "lovable" | "gemini_api" | "local";
const PROMPT_KEYS = [
  { key: "ai_prompt_comercial", label: "Comercial (Leads / WhatsApp Comercial)" },
  { key: "ai_prompt_sucesso", label: "Sucesso do Aluno (WhatsApp pós-venda)" },
  { key: "ai_prompt_aluno", label: "Chat dentro do App (Aluno autenticado)" },
] as const;

export default function AdminCrmAi() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [engine, setEngine] = useState<Engine>("openai");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    const [{ data: runsData }, { data: settings }] = await Promise.all([
      supabase
      .from("crm_ai_runs")
      .select("id, prompt, response, model, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
      supabase.from("crm_settings").select("key,value").in("key", ["ai_engine", ...PROMPT_KEYS.map(p => p.key)]),
    ]);
    setRuns((runsData ?? []) as Run[]);
    const map: Record<string, string> = {};
    let eng: Engine = "openai";
    (settings || []).forEach((s: any) => {
      if (s.key === "ai_engine") {
        const e = s.value?.engine;
        if (e === "openai" || e === "lovable" || e === "gemini_api" || e === "local") eng = e;
      } else {
        map[s.key] = s.value?.prompt || "";
      }
    });
    setEngine(eng);
    setPrompts(map);
  }
  useEffect(() => { load(); }, []);

  async function saveEngine(next: Engine) {
    setEngine(next);
    const { error } = await supabase.from("crm_settings").upsert({ key: "ai_engine", value: { engine: next } as any }, { onConflict: "key" });
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Engine atualizado", description: `Agora usando: ${next}` });
  }

  async function savePrompt(key: string) {
    setSavingKey(key);
    const { error } = await supabase.from("crm_settings").upsert({ key, value: { prompt: prompts[key] || "" } as any }, { onConflict: "key" });
    setSavingKey(null);
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Prompt salvo" });
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

      <div className="grid gap-3 mb-6">
        {PROMPT_KEYS.map(({ key, label }) => (
          <Card key={key} className="p-4 space-y-2">
            <Label className="text-xs">{label}</Label>
            <Textarea rows={5} value={prompts[key] || ""} onChange={(e) => setPrompts((p) => ({ ...p, [key]: e.target.value }))} />
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
            <p className="text-sm whitespace-pre-wrap">{r.response}</p>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}