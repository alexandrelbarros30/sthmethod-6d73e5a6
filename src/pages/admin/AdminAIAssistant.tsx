import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Save, Send, Trash2, Sparkles, Webhook, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (rápido, recomendado)" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (mais barato)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (mais inteligente)" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { id: "openai/gpt-5", label: "GPT-5 (premium)" },
];

export default function AdminAIAssistant() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [autoReply, setAutoReply] = useState(false);
  const [saving, setSaving] = useState(false);

  const [chat, setChat] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [contextPhone, setContextPhone] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: config } = useQuery({
    queryKey: ["ai-assistant-config"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_assistant_config").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setPrompt(config.system_prompt || "");
      setModel(config.model || "google/gemini-2.5-flash");
      setAutoReply(!!config.auto_reply_enabled);
    }
  }, [config]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, sending]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_assistant_config")
      .update({
        system_prompt: prompt,
        model,
        auto_reply_enabled: autoReply,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Configuração salva!");
    qc.invalidateQueries({ queryKey: ["ai-assistant-config"] });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...chat, { role: "user", content: text }];
    setChat(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant-chat", {
        body: { messages: next, contextPhone: contextPhone || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setChat([...next, { role: "assistant", content: (data as any)?.reply || "(sem resposta)" }]);
    } catch (e: any) {
      toast.error(e?.message || "Falha na IA");
      setChat(next);
    } finally {
      setSending(false);
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-inbound-ai`;

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada");
  };

  return (
    <DashboardLayout role="admin" title="Assistente IA" subtitle="Concierge inteligente da STH METHOD para WhatsApp.">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat"><Sparkles className="w-4 h-4 mr-1" />Chat de Teste</TabsTrigger>
          <TabsTrigger value="prompt"><Bot className="w-4 h-4 mr-1" />Super Prompt</TabsTrigger>
          <TabsTrigger value="auto"><Webhook className="w-4 h-4 mr-1" />Auto-Resposta</TabsTrigger>
        </TabsList>

        {/* CHAT */}
        <TabsContent value="chat">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Conversar com o assistente
              </CardTitle>
              <div className="flex flex-wrap gap-2 items-center pt-2">
                <Input
                  placeholder="Telefone para simular memória do CRM (opcional)"
                  value={contextPhone}
                  onChange={(e) => setContextPhone(e.target.value)}
                  className="max-w-xs"
                />
                <Badge variant="outline">{model}</Badge>
                {chat.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setChat([])} className="ml-auto">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={scrollRef}
                className="h-[400px] overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-3 mb-3"
              >
                {chat.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    Envie uma mensagem para testar como o assistente responderia no WhatsApp.
                  </p>
                )}
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2 bg-card border flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> pensando...
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Escreva como se fosse um aluno/lead no WhatsApp..."
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={send} disabled={sending || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROMPT */}
        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" /> Super Prompt da STH METHOD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Modelo de IA</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instruções do assistente</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={22}
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Esse texto é enviado como system prompt em todas as conversas (chat de teste e auto-resposta no WhatsApp).
                </p>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUTO REPLY */}
        <TabsContent value="auto">
          <Card className={autoReply ? "border-emerald-500/40" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="w-4 h-4" /> Auto-resposta no WhatsApp (Z-API)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/30">
                <div>
                  <p className="text-sm font-medium">
                    {autoReply ? "Auto-resposta ATIVA" : "Auto-resposta PAUSADA"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quando ativa, toda mensagem recebida no WhatsApp é respondida automaticamente pelo assistente.
                  </p>
                </div>
                <Switch checked={autoReply} onCheckedChange={setAutoReply} />
              </div>

              <div>
                <Label>URL do webhook (configurar na Z-API)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyWebhook}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cole esta URL em <b>Z-API → Webhooks → Ao receber mensagem</b>. O assistente só responderá quando o toggle acima estiver ativo.
                </p>
              </div>

              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}