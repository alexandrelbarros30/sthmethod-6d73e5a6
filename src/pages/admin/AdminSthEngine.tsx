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
import { toast } from "sonner";
import { Cpu, Save, Sparkles, MessageSquare, AlertCircle } from "lucide-react";

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
          Escolha qual IA gera os rascunhos do atendimento e configure as saudações automáticas.
        </p>
      </header>

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
    </div>
  );
}