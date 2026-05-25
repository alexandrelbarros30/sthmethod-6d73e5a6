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
import { Bot, Save, Send, Trash2, Sparkles, Webhook, Copy, Loader2, GraduationCap, Plus, Pencil, X, Paperclip, FileText, ImageIcon, Brain, BookOpen, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

type TrainingRule = {
  id: string;
  label: string;
  keywords: string[];
  reply: string;
  priority: number;
  enabled: boolean;
  hits: number;
  attachments?: Attachment[];
};

type Attachment = { url: string; kind: "image" | "document"; name?: string };

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
  const [engine, setEngine] = useState<"local" | "ai" | "gemini">("local");
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
      setEngine(((config as any).engine as "local" | "ai" | "gemini") || "local");
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
        engine,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      } as any)
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
        <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="chat" className="whitespace-nowrap"><Sparkles className="w-4 h-4 mr-1" />Chat de Teste</TabsTrigger>
            <TabsTrigger value="prompt" className="whitespace-nowrap"><Bot className="w-4 h-4 mr-1" />Super Prompt</TabsTrigger>
            <TabsTrigger value="auto" className="whitespace-nowrap"><Webhook className="w-4 h-4 mr-1" />Auto-Resposta</TabsTrigger>
            <TabsTrigger value="training" className="whitespace-nowrap"><GraduationCap className="w-4 h-4 mr-1" />Centro de Treinamento</TabsTrigger>
          </TabsList>
        </div>

        {/* Engine selector — always visible above tabs content */}
        <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Motor de respostas: {engine === "local" ? "🟢 Local (gratuito)" : engine === "gemini" ? "🟣 Gemini (sua chave Google AI Studio)" : "🔵 IA Lovable (consome créditos)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {engine === "local"
                  ? "Respostas baseadas em regras inteligentes da STH METHOD. Sem custo por mensagem."
                  : engine === "gemini"
                  ? "Usa Google AI Studio com sua GEMINI_API_KEY (tier gratuito do Google). Fallback automático se a chave principal falhar."
                  : "Usa o Lovable AI Gateway. Cada mensagem consome créditos."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={engine} onValueChange={(v) => setEngine(v as any)}>
                <SelectTrigger className="w-[170px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">🟢 Local (gratuito)</SelectItem>
                  <SelectItem value="gemini">🟣 Gemini (sua chave)</SelectItem>
                  <SelectItem value="ai">🔵 IA Lovable</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={save} disabled={saving} className="ml-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* TRAINING CENTER */}
        <TabsContent value="training">
          <TrainingCenter userId={user?.id} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function TrainingCenter({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TrainingRule | null>(null);
  const [form, setForm] = useState({ label: "", keywords: "", reply: "", priority: 100, enabled: true });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOut, setTestOut] = useState<{ reply: string; intent: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["ai-training-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_assistant_training" as any)
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TrainingRule[];
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ label: "", keywords: "", reply: "", priority: 100, enabled: true });
    setAttachments([]);
  };

  const startEdit = (r: TrainingRule) => {
    setEditing(r);
    setForm({
      label: r.label,
      keywords: r.keywords.join(", "),
      reply: r.reply,
      priority: r.priority,
      enabled: r.enabled,
    });
    setAttachments(r.attachments || []);
  };

  const save = async () => {
    const label = form.label.trim();
    const reply = form.reply.trim();
    const keywords = form.keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (!label || !reply || keywords.length === 0) {
      toast.error("Preencha rótulo, palavras-chave e resposta.");
      return;
    }
    const payload = {
      label, reply, keywords,
      priority: Number(form.priority) || 100,
      enabled: form.enabled,
      attachments,
    };
    const { error } = editing
      ? await supabase.from("ai_assistant_training" as any).update(payload).eq("id", editing.id)
      : await supabase.from("ai_assistant_training" as any).insert({ ...payload, created_by: userId });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success(editing ? "Regra atualizada" : "Regra criada");
    resetForm();
    qc.invalidateQueries({ queryKey: ["ai-training-rules"] });
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      const isImg = /image\/(jpeg|jpg|png)/i.test(file.type);
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (!isImg && !isPdf) {
        toast.error(`${file.name}: apenas JPG, PNG ou PDF`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: máx 20MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || (isPdf ? "pdf" : "jpg");
      const path = `training/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("ai-training-media").upload(path, file, {
        contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        upsert: false,
      });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("ai-training-media").getPublicUrl(path);
      added.push({ url: pub.publicUrl, kind: isImg ? "image" : "document", name: file.name });
    }
    setAttachments((a) => [...a, ...added]);
    setUploading(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((a) => a.filter((_, i) => i !== idx));
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta regra?")) return;
    const { error } = await supabase.from("ai_assistant_training" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida");
    qc.invalidateQueries({ queryKey: ["ai-training-rules"] });
  };

  const toggle = async (r: TrainingRule) => {
    const { error } = await supabase.from("ai_assistant_training" as any).update({ enabled: !r.enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ai-training-rules"] });
  };

  const runTest = async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant-chat", {
        body: { messages: [{ role: "user", content: testInput }] },
      });
      if (error) throw error;
      setTestOut({ reply: (data as any)?.reply || "", intent: (data as any)?.intent || "—" });
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Tabs defaultValue="rules" className="w-full">
      <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <TabsList className="inline-flex w-max">
          <TabsTrigger value="rules" className="whitespace-nowrap"><BookOpen className="w-4 h-4 mr-1" />Regras</TabsTrigger>
          <TabsTrigger value="brain" className="whitespace-nowrap"><Brain className="w-4 h-4 mr-1" />IA Organismo</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="brain">
        <div className="space-y-4">
          <GeminiPanel />
          <LocalBrainEditor />
        </div>
      </TabsContent>

      <TabsContent value="rules">
        <div className="grid lg:grid-cols-5 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editing ? "Editar regra" : "Nova regra"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Rótulo (intenção)</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="ex: horario_atendimento"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Palavras-chave (separadas por vírgula)</Label>
            <Input
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="horario, funcionamento, atende, aberto"
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Se a mensagem do aluno contiver qualquer uma destas palavras, esta resposta será usada.
            </p>
          </div>
          <div>
            <Label>Resposta</Label>
            <Textarea
              value={form.reply}
              onChange={(e) => setForm((f) => ({ ...f, reply: e.target.value }))}
              rows={6}
              placeholder={"Olá {nome}! Atendemos de seg a sex, 9h às 18h.\nPlano atual: {plano} (vence em {vencimento})."}
              className="mt-1 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Variáveis disponíveis: <code>{"{nome}"}</code> <code>{"{plano}"}</code> <code>{"{status}"}</code> <code>{"{vencimento}"}</code> <code>{"{site}"}</code>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Menor = avaliada primeiro.</p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
                <span className="text-sm">Ativa</span>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-3 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" /> Anexos premium ({attachments.length})
              </Label>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => { uploadFiles(e.target.files); e.currentTarget.value = ""; }}
                />
                <Button size="sm" variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                    Adicionar JPG/PNG/PDF
                  </span>
                </Button>
              </label>
            </div>
            {attachments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Imagens e PDFs serão enviados automaticamente junto da resposta no WhatsApp — ideal para tabelas, fichas e materiais visuais.
              </p>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border bg-card text-xs">
                    {a.kind === "image" ? (
                      <img src={a.url} alt={a.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                      {a.name || a.url}
                    </a>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeAttachment(i)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} className="flex-1">
              <Save className="w-4 h-4 mr-1" />
              {editing ? "Atualizar" : "Adicionar"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="border-t pt-3 mt-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Testar motor local</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Digite uma mensagem do aluno..."
                onKeyDown={(e) => e.key === "Enter" && runTest()}
              />
              <Button onClick={runTest} disabled={testing} size="icon">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {testOut && (
              <div className="mt-2 p-3 rounded-md border bg-muted/30 text-sm whitespace-pre-wrap">
                <Badge variant="outline" className="mb-2">intent: {testOut.intent}</Badge>
                <p>{testOut.reply}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Regras treinadas
            <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            O motor local consulta primeiro estas regras. Quanto mais regras você criar, mais rápido e preciso o chat robô responde — sem consumir créditos de IA.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma regra ainda. Crie a primeira ao lado.
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-md border ${r.enabled ? "bg-card" : "bg-muted/20 opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.label}</span>
                        <Badge variant="outline" className="text-[10px]">p{r.priority}</Badge>
                        {r.hits > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{r.hits} usos</Badge>
                        )}
                        {(r.attachments?.length || 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />{r.attachments!.length}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {r.keywords.slice(0, 8).map((k, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">{k}</Badge>
                        ))}
                        {r.keywords.length > 8 && (
                          <Badge variant="outline" className="text-[10px]">+{r.keywords.length - 8}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-wrap">
                        {r.reply}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} />
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(r.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

const DEFAULT_STH_ONE_PROMPT = `# IDENTIDADE OFICIAL DA IA

Nome oficial: STH One

Apresentação:
"Olá 👋 Eu sou o STH One. Seu assistente inteligente oficial da STH METHOD."

O STH One atua como concierge premium, central de relacionamento, suporte estratégico, assistente operacional, SDR inteligente e IA de acompanhamento contínuo.

# PERSONALIDADE
- Humano, calmo, acolhedor, estratégico, elegante, premium.
- Nunca robótico.

# REGRA ABSOLUTA Nº1
Nunca tratar mal, ironizar, provocar, discutir ou responder com agressividade. Mesmo diante de clientes irritados, mensagens ofensivas ou críticas, permanecer respeitoso, educado, amigável, empático.
Resposta ideal: "Entendo sua situação. Vamos resolver isso da melhor forma possível."

# ORGANISMO VIVO
Aprender com conversas, interpretar padrões, melhorar respostas, adaptar linguagem, reconhecer intenções e otimizar a experiência continuamente.

# BASE DE CONHECIMENTO
Site oficial: https://sthmethod.com.br — fonte oficial de planos, fluxos, estratégia, serviços e diferenciais.

# MEMÓRIA EVOLUTIVA
Lembrar contexto recente, manter continuidade, evitar repetição, adaptar respostas ao perfil.
Ex.: "Você estava analisando o plano 90D anteriormente."

# EXPERIÊNCIA PREMIUM
Sensação Apple.com — "Existe alguém realmente acompanhando minha evolução."

# TOM DE VOZ
Natural, humano, premium, elegante, objetivo, estratégico. Evitar excesso de emojis e respostas frias.

# OBJETIVO FINAL
EXPERIÊNCIA HUMANA + CONTEXTO + CONTINUIDADE + RESPEITO.`;

function GeminiPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<any>(null);
  const [model, setModel] = useState("gemini-1.5-flash");
  const [fbModel, setFbModel] = useState("gemini-1.5-flash-8b");
  const [temp, setTemp] = useState("0.4");
  const [maxTok, setMaxTok] = useState("600");

  const reload = async () => {
    const { data } = await supabase
      .from("ai_assistant_config")
      .select("engine, gemini_model, gemini_fallback_model, gemini_temperature, gemini_max_tokens, gemini_last_status, gemini_last_error, gemini_last_used_at")
      .eq("id", 1)
      .maybeSingle();
    const c = data as any;
    setCfg(c);
    if (c) {
      setModel(c.gemini_model || "gemini-1.5-flash");
      setFbModel(c.gemini_fallback_model || "gemini-1.5-flash-8b");
      setTemp(String(c.gemini_temperature ?? 0.4));
      setMaxTok(String(c.gemini_max_tokens ?? 600));
    }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_assistant_config")
      .update({
        gemini_model: model.trim() || "gemini-1.5-flash",
        gemini_fallback_model: fbModel.trim() || "gemini-1.5-flash-8b",
        gemini_temperature: Number(temp) || 0.4,
        gemini_max_tokens: Number(maxTok) || 600,
      } as any)
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuração Gemini salva");
    reload();
  };

  const status = cfg?.gemini_last_status || "unknown";
  const statusLabel =
    status === "online" ? { txt: "🟢 Online (chave principal)", cls: "text-emerald-500" } :
    status === "fallback" ? { txt: "🟡 Fallback ativo", cls: "text-amber-500" } :
    status === "offline" ? { txt: "🔴 Offline (ambas chaves falharam)", cls: "text-red-500" } :
    { txt: "⚪ Ainda não usado", cls: "text-muted-foreground" };

  return (
    <Card className="border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-500" /> Motor Gemini (Google AI Studio)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Use sua própria chave do Google AI Studio (tier gratuito). As chaves <code>GEMINI_API_KEY</code> e <code>GEMINI_API_KEY_FALLBACK</code> ficam apenas em variável de ambiente segura — nunca no front-end.
          Quando a principal falhar por 429, quota ou timeout, o sistema usa a chave fallback automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-md border bg-muted/30">
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs text-muted-foreground">Status do motor</p>
                <p className={`text-sm font-medium ${statusLabel.cls}`}>{statusLabel.txt}</p>
                {cfg?.gemini_last_used_at && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Último uso: {new Date(cfg.gemini_last_used_at).toLocaleString("pt-BR")}
                  </p>
                )}
                {cfg?.gemini_last_error && (
                  <p className="text-[11px] text-red-500 mt-0.5 truncate">Erro: {cfg.gemini_last_error}</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={reload}>
                <Loader2 className="w-3.5 h-3.5 mr-1" /> Atualizar
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Modelo principal</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-1.5-flash" className="mt-1 font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Sugestão: <code>gemini-1.5-flash</code> ou <code>gemini-2.0-flash</code>.</p>
              </div>
              <div>
                <Label>Modelo fallback</Label>
                <Input value={fbModel} onChange={(e) => setFbModel(e.target.value)} placeholder="gemini-1.5-flash-8b" className="mt-1 font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Sugestão: <code>gemini-1.5-flash-8b</code> (mais leve).</p>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Input type="number" min="0" max="1" step="0.05" value={temp} onChange={(e) => setTemp(e.target.value)} className="mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">0.4 = humano e estável.</p>
              </div>
              <div>
                <Label>Máximo de tokens</Label>
                <Input type="number" min="100" max="4000" step="50" value={maxTok} onChange={(e) => setMaxTok(e.target.value)} className="mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">600 = resposta curta/média estilo WhatsApp.</p>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground border-t pt-3">
              <p><strong>Segurança:</strong> chaves armazenadas como variável de ambiente no servidor. O front-end nunca chama a API do Gemini diretamente — sempre via endpoint interno.</p>
              <p className="mt-1"><strong>Para ativar:</strong> selecione "🟣 Gemini (sua chave)" no seletor de motor acima e salve.</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar configuração Gemini
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LocalBrainEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("STH One");
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_assistant_config")
        .select("local_prompt, assistant_name")
        .eq("id", 1)
        .maybeSingle();
      const cfg = data as any;
      setName(cfg?.assistant_name || "STH One");
      setText(cfg?.local_prompt || "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_assistant_config")
      .update({ local_prompt: text, assistant_name: name.trim() || "STH One" } as any)
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cérebro do STH One atualizado");
  };

  const loadDefault = () => {
    setText(DEFAULT_STH_ONE_PROMPT);
    toast.message("Prompt padrão STH One carregado — revise e salve.");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4" /> Cérebro do Chat Robô Local
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Este é o organismo vivo do motor local. Editável a qualquer momento — fica salvo no banco e é carregado sempre que o STH One responde.
          Não consome créditos de IA. Use para reforçar identidade, tom de voz, regras absolutas e contexto da marca.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando...
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label>Nome do assistente</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="STH One"
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Usado nas saudações e apresentação oficial.
                </p>
              </div>
              <div className="md:col-span-2 flex md:items-end justify-end gap-2">
                <Button variant="outline" size="sm" onClick={loadDefault}>
                  <Sparkles className="w-4 h-4 mr-1" /> Carregar prompt STH One
                </Button>
              </div>
            </div>

            <div>
              <Label>Prompt do cérebro local</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={22}
                placeholder="Cole aqui o super prompt do STH One..."
                className="mt-1 font-mono text-xs leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {text.length.toLocaleString("pt-BR")} caracteres. Atualize sempre que quiser deixar o assistente mais inteligente.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar cérebro
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}