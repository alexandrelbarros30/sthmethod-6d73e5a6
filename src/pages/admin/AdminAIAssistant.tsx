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
import { Bot, Save, Send, Trash2, Sparkles, Webhook, Copy, Loader2, GraduationCap, Plus, Pencil, X, Paperclip, FileText, ImageIcon, Brain, BookOpen, Cpu, Wand2, ChevronDown, ChevronUp, Clock } from "lucide-react";
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
            <TabsTrigger value="hours" className="whitespace-nowrap"><Clock className="w-4 h-4 mr-1" />Horário</TabsTrigger>
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

        {/* BUSINESS HOURS */}
        <TabsContent value="hours">
          <BusinessHoursPanel />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

const VARS = [
  { k: "{nome}", desc: "Primeiro nome do contato" },
  { k: "{plano}", desc: "Plano atual" },
  { k: "{status}", desc: "active | expired | pending" },
  { k: "{vencimento}", desc: "Data de vencimento" },
  { k: "{site}", desc: "https://sthmethod.com.br" },
];

type RuleFormState = { label: string; keywords: string; reply: string; priority: number; enabled: boolean };
const EMPTY_FORM: RuleFormState = { label: "", keywords: "", reply: "", priority: 100, enabled: true };

async function uploadAttachmentFiles(files: FileList | null): Promise<Attachment[]> {
  if (!files || !files.length) return [];
  const added: Attachment[] = [];
  for (const file of Array.from(files)) {
    const isImg = /image\/(jpeg|jpg|png)/i.test(file.type);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isImg && !isPdf) { toast.error(`${file.name}: apenas JPG, PNG ou PDF`); continue; }
    if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name}: máx 20MB`); continue; }
    const ext = file.name.split(".").pop()?.toLowerCase() || (isPdf ? "pdf" : "jpg");
    const path = `training/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("ai-training-media").upload(path, file, {
      contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      upsert: false,
    });
    if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
    const { data: pub } = supabase.storage.from("ai-training-media").getPublicUrl(path);
    added.push({ url: pub.publicUrl, kind: isImg ? "image" : "document", name: file.name });
  }
  return added;
}

function RuleForm({
  form, setForm, attachments, setAttachments, onSave, onCancel, saving, editing,
}: {
  form: RuleFormState;
  setForm: (f: RuleFormState | ((p: RuleFormState) => RuleFormState)) => void;
  attachments: Attachment[];
  setAttachments: (a: Attachment[] | ((p: Attachment[]) => Attachment[])) => void;
  onSave: () => void;
  onCancel?: () => void;
  saving?: boolean;
  editing?: boolean;
}) {
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const insertVar = (token: string) => {
    const el = replyRef.current;
    if (!el) {
      setForm((f) => ({ ...f, reply: (f.reply || "") + token }));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    setForm((f) => ({ ...f, reply: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleUpload = async (files: FileList | null) => {
    setUploading(true);
    const added = await uploadAttachmentFiles(files);
    if (added.length) setAttachments((a) => [...a, ...added]);
    setUploading(false);
  };

  const suggestFromFile = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    const isImg = /image\/(jpeg|jpg|png)/i.test(file.type);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isImg && !isPdf) { toast.error("Apenas JPG, PNG ou PDF"); return; }
    setSuggesting(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || (isPdf ? "pdf" : "jpg");
      const path = `training-temp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ai-training-media").upload(path, file, {
        contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("ai-training-media").getPublicUrl(path);
      const { data, error } = await supabase.functions.invoke("ai-suggest-rule", {
        body: { fileUrl: pub.publicUrl, mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"), hint: form.label || undefined },
      });
      if (error) throw error;
      const s = data as any;
      if (s?.error) throw new Error(s.error);
      setForm((f) => ({
        ...f,
        label: s.label || f.label,
        keywords: Array.isArray(s.keywords) && s.keywords.length ? s.keywords.join(", ") : f.keywords,
        reply: s.reply || f.reply,
      }));
      toast.success("Regra sugerida pela IA — revise e salve");
    } catch (e: any) {
      toast.error("Falha ao sugerir: " + (e?.message || "erro"));
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {editing ? "Editar regra" : "Nova regra"}
        </Label>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => { suggestFromFile(e.target.files); e.currentTarget.value = ""; }}
          />
          <Button size="sm" variant="outline" disabled={suggesting} asChild>
            <span className="cursor-pointer">
              {suggesting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
              Importar via IA (JPG/PNG/PDF)
            </span>
          </Button>
        </label>
      </div>

      <div>
        <Label>Rótulo (intenção)</Label>
        <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="ex: horario_atendimento" className="mt-1" />
      </div>
      <div>
        <Label>Palavras-chave (separadas por vírgula)</Label>
        <Input value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="horario, funcionamento, atende, aberto" className="mt-1" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Resposta</Label>
          <div className="flex flex-wrap gap-1">
            {VARS.map((v) => (
              <Button key={v.k} type="button" size="sm" variant="outline"
                className="h-6 px-2 text-[10px] font-mono"
                title={v.desc}
                onClick={() => insertVar(v.k)}>
                {v.k}
              </Button>
            ))}
          </div>
        </div>
        <Textarea ref={replyRef} value={form.reply} onChange={(e) => setForm((f) => ({ ...f, reply: e.target.value }))} rows={6}
          placeholder={"Olá {nome}! Atendemos seg-sex, 9h-18h."} className="mt-1 text-sm" />
        <p className="text-[11px] text-muted-foreground mt-1">Clique nas variáveis acima para inseri-las na posição do cursor.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Prioridade</Label>
          <Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} className="mt-1" />
          <p className="text-[11px] text-muted-foreground mt-1">Menor = avaliada primeiro.</p>
        </div>
        <div className="flex items-end">
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
            <input type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" multiple className="hidden"
              onChange={(e) => { handleUpload(e.target.files); e.currentTarget.value = ""; }} />
            <Button size="sm" variant="outline" disabled={uploading} asChild>
              <span className="cursor-pointer">
                {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Adicionar JPG/PNG/PDF
              </span>
            </Button>
          </label>
        </div>
        {attachments.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Imagens e PDFs serão enviados junto da resposta no WhatsApp.</p>
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
                <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">{a.name || a.url}</a>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {editing ? "Atualizar regra" : "Adicionar regra"}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function TrainingCenter({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  // Novo
  const [newForm, setNewForm] = useState<RuleFormState>(EMPTY_FORM);
  const [newAtt, setNewAtt] = useState<Attachment[]>([]);
  const [savingNew, setSavingNew] = useState(false);
  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RuleFormState>(EMPTY_FORM);
  const [editAtt, setEditAtt] = useState<Attachment[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  // Teste local
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

  const saveNew = async () => {
    const label = newForm.label.trim();
    const reply = newForm.reply.trim();
    const keywords = newForm.keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (!label || !reply || keywords.length === 0) return toast.error("Preencha rótulo, palavras-chave e resposta.");
    setSavingNew(true);
    const { error } = await supabase.from("ai_assistant_training" as any).insert({
      label, reply, keywords,
      priority: Number(newForm.priority) || 100,
      enabled: newForm.enabled,
      attachments: newAtt,
      created_by: userId,
    });
    setSavingNew(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Regra criada");
    setNewForm(EMPTY_FORM);
    setNewAtt([]);
    qc.invalidateQueries({ queryKey: ["ai-training-rules"] });
  };

  const startEdit = (r: TrainingRule) => {
    if (editId === r.id) { setEditId(null); return; }
    setEditId(r.id);
    setEditForm({ label: r.label, keywords: r.keywords.join(", "), reply: r.reply, priority: r.priority, enabled: r.enabled });
    setEditAtt(r.attachments || []);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const label = editForm.label.trim();
    const reply = editForm.reply.trim();
    const keywords = editForm.keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (!label || !reply || keywords.length === 0) return toast.error("Preencha rótulo, palavras-chave e resposta.");
    setSavingEdit(true);
    const { error } = await supabase.from("ai_assistant_training" as any).update({
      label, reply, keywords,
      priority: Number(editForm.priority) || 100,
      enabled: editForm.enabled,
      attachments: editAtt,
    }).eq("id", editId);
    setSavingEdit(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Regra atualizada");
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["ai-training-rules"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta regra?")) return;
    const { error } = await supabase.from("ai_assistant_training" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida");
    if (editId === id) setEditId(null);
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
        body: { messages: [{ role: "user", content: testInput }], forceEngine: "local" },
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
    <Tabs defaultValue="trained" className="w-full">
      <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <TabsList className="inline-flex w-max">
          <TabsTrigger value="new" className="whitespace-nowrap"><Plus className="w-4 h-4 mr-1" />Regra Nova</TabsTrigger>
          <TabsTrigger value="trained" className="whitespace-nowrap"><BookOpen className="w-4 h-4 mr-1" />Regras Treinadas <Badge variant="secondary" className="ml-1.5 text-[10px]">{rules.length}</Badge></TabsTrigger>
          <TabsTrigger value="brain" className="whitespace-nowrap"><Brain className="w-4 h-4 mr-1" />IA Organismo</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="brain">
        <div className="space-y-4">
          <GeminiPanel />
          <LocalBrainEditor />
        </div>
      </TabsContent>

      <TabsContent value="new">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Criar nova regra
              </CardTitle>
              <p className="text-xs text-muted-foreground">Crie respostas fixas treinadas para o chat robô local. Use o botão de importar via IA para gerar a regra automaticamente a partir de um PDF, JPG ou PNG.</p>
            </CardHeader>
            <CardContent>
              <RuleForm
                form={newForm} setForm={setNewForm}
                attachments={newAtt} setAttachments={setNewAtt}
                onSave={saveNew} saving={savingNew} editing={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Testar conversa local (regras)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Conversa de teste isolada que força o motor local — perfeita para verificar se a regra que você acabou de criar está sendo disparada.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Digite uma mensagem como se fosse um lead..."
                  onKeyDown={(e) => e.key === "Enter" && runTest()}
                />
                <Button onClick={runTest} disabled={testing} size="icon">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {testOut ? (
                <div className="p-3 rounded-md border bg-muted/30 text-sm whitespace-pre-wrap">
                  <Badge variant="outline" className="mb-2">intent: {testOut.intent}</Badge>
                  <p>{testOut.reply}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">A resposta aparece aqui com o intent disparado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="trained">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Regras treinadas
              <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Clique no lápis para editar uma regra inline (sem sair desta tela). Variáveis podem ser inseridas com um toque.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Carregando...
              </div>
            ) : rules.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma regra ainda. Crie a primeira na aba <b>Regra Nova</b>.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((r) => {
                  const isOpen = editId === r.id;
                  return (
                    <div key={r.id} className={`rounded-md border ${r.enabled ? "bg-card" : "bg-muted/20 opacity-70"}`}>
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{r.label}</span>
                            <Badge variant="outline" className="text-[10px]">p{r.priority}</Badge>
                            {r.hits > 0 && <Badge variant="secondary" className="text-[10px]">{r.hits} usos</Badge>}
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
                          {!isOpen && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-wrap">{r.reply}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} />
                          <div className="flex gap-1">
                            <Button size="icon" variant={isOpen ? "default" : "ghost"} className="h-7 w-7" onClick={() => startEdit(r)}>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(r.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="border-t bg-muted/10 p-3">
                          <RuleForm
                            form={editForm} setForm={setEditForm}
                            attachments={editAtt} setAttachments={setEditAtt}
                            onSave={saveEdit} onCancel={() => setEditId(null)}
                            saving={savingEdit} editing
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
  const [model, setModel] = useState("gemini-flash-latest");
  const [fbModel, setFbModel] = useState("gemini-flash-lite-latest");
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
      setModel(c.gemini_model || "gemini-flash-latest");
      setFbModel(c.gemini_fallback_model || "gemini-flash-lite-latest");
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
        gemini_model: model.trim() || "gemini-flash-latest",
        gemini_fallback_model: fbModel.trim() || "gemini-flash-lite-latest",
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
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-flash-latest" className="mt-1 font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Sugestão: <code>gemini-flash-latest</code> ou <code>gemini-flash-latest</code>.</p>
              </div>
              <div>
                <Label>Modelo fallback</Label>
                <Input value={fbModel} onChange={(e) => setFbModel(e.target.value)} placeholder="gemini-flash-lite-latest" className="mt-1 font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Sugestão: <code>gemini-flash-lite-latest</code> (mais leve).</p>
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

// ============== BUSINESS HOURS PANEL ==============
const DAYS: { k: string; label: string }[] = [
  { k: "mon", label: "Segunda" },
  { k: "tue", label: "Terça" },
  { k: "wed", label: "Quarta" },
  { k: "thu", label: "Quinta" },
  { k: "fri", label: "Sexta" },
  { k: "sat", label: "Sábado" },
  { k: "sun", label: "Domingo" },
];

type DayHours = { enabled: boolean; open: string; close: string };
type BHours = { timezone: string } & Record<string, DayHours | string>;

const DEFAULT_HOURS: BHours = {
  timezone: "America/Sao_Paulo",
  mon: { enabled: true, open: "08:00", close: "20:00" },
  tue: { enabled: true, open: "08:00", close: "20:00" },
  wed: { enabled: true, open: "08:00", close: "20:00" },
  thu: { enabled: true, open: "08:00", close: "20:00" },
  fri: { enabled: true, open: "08:00", close: "20:00" },
  sat: { enabled: true, open: "09:00", close: "14:00" },
  sun: { enabled: false, open: "00:00", close: "00:00" },
};

function BusinessHoursPanel() {
  const qc = useQueryClient();
  const [enforce, setEnforce] = useState(false);
  const [hours, setHours] = useState<BHours>(DEFAULT_HOURS);
  const [offMsg, setOffMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_assistant_config")
        .select("business_hours, out_of_hours_message, enforce_business_hours")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        setEnforce(!!(data as any).enforce_business_hours);
        setOffMsg((data as any).out_of_hours_message || "");
        const bh = (data as any).business_hours;
        if (bh && typeof bh === "object") setHours({ ...DEFAULT_HOURS, ...bh });
      }
      setLoading(false);
    })();
  }, []);

  const setDay = (k: string, patch: Partial<DayHours>) => {
    setHours((prev) => ({ ...prev, [k]: { ...(prev[k] as DayHours), ...patch } }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("ai_assistant_config")
      .update({
        business_hours: hours as any,
        out_of_hours_message: offMsg,
        enforce_business_hours: enforce,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Horário salvo!");
    qc.invalidateQueries({ queryKey: ["ai-assistant-config"] });
  };

  if (loading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Carregando…</CardContent></Card>;

  const tzNow = new Intl.DateTimeFormat("pt-BR", {
    timeZone: hours.timezone || "America/Sao_Paulo",
    weekday: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" /> Horário de atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/30">
          <div>
            <p className="text-sm font-medium">
              {enforce ? "Horário ATIVO — fora do expediente responde mensagem padrão" : "Horário INATIVO — IA responde 24h"}
            </p>
            <p className="text-xs text-muted-foreground">Aplica-se ao WhatsApp e a todos os canais do CRM.</p>
          </div>
          <Switch checked={enforce} onCheckedChange={setEnforce} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Fuso horário</Label>
            <Input
              value={hours.timezone}
              onChange={(e) => setHours((p) => ({ ...p, timezone: e.target.value }))}
              className="mt-1.5 font-mono text-xs"
              placeholder="America/Sao_Paulo"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Agora no fuso configurado: <b>{tzNow}</b></p>
          </div>
        </div>

        <div className="rounded-md border divide-y">
          {DAYS.map((d) => {
            const day = (hours[d.k] as DayHours) || { enabled: false, open: "08:00", close: "18:00" };
            return (
              <div key={d.k} className="flex items-center gap-3 p-3 flex-wrap">
                <div className="w-24 text-sm font-medium">{d.label}</div>
                <Switch checked={day.enabled} onCheckedChange={(v) => setDay(d.k, { enabled: v })} />
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    type="time"
                    value={day.open}
                    onChange={(e) => setDay(d.k, { open: e.target.value })}
                    disabled={!day.enabled}
                    className="w-28"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={day.close}
                    onChange={(e) => setDay(d.k, { close: e.target.value })}
                    disabled={!day.enabled}
                    className="w-28"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <Label>Mensagem fora do horário</Label>
          <Textarea
            value={offMsg}
            onChange={(e) => setOffMsg(e.target.value)}
            rows={4}
            className="mt-1.5 text-sm"
            placeholder="Olá! Estamos fora do horário de atendimento…"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Enviada automaticamente ao contato quando ele escrever fora do expediente.</p>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar horário
        </Button>
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