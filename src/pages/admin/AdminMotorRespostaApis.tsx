import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Activity, Copy, Eye, EyeOff, KeyRound, Plug, RefreshCw, ShieldAlert,
  Power, Save, History, Cpu, Settings2,
} from "lucide-react";
import MotoresGlobaisPanel from "@/components/admin/MotoresGlobaisPanel";

type Channel = {
  id: string;
  name: string;
  channel_type: "comercial" | "atendimento_personalizado";
  whatsapp_number: string | null;
  provider: "wapi" | "zapi" | "evolution" | "cloud";
  instance_id: string | null;
  instance_name: string | null;
  base_url: string | null;
  webhook_url: string | null;
  status: "ativo" | "inativo" | "manutencao";
  is_active: boolean;
  responsible_user_id: string | null;
  description: string | null;
  connection_status: "connected" | "disconnected" | "pending" | "error";
  connected_number: string | null;
  qr_code: string | null;
  last_sync_at: string | null;
  slug: string | null;
};

type Credentials = {
  id?: string;
  channel_id: string;
  api_key_encrypted: string | null;
  token_encrypted: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  client_id_encrypted: string | null;
  client_secret_encrypted: string | null;
  token_expires_at: string | null;
};

type Engine = {
  id?: string;
  channel_id: string;
  ai_enabled: boolean;
  human_enabled: boolean;
  auto_reply_enabled: boolean;
  business_hours: any;
  after_hours_message: string | null;
  max_auto_replies: number;
  handoff_to_human_after_minutes: number;
  ai_model: string;
  main_prompt: string | null;
  safety_prompt: string | null;
  fallback_prompt: string | null;
  temperature: number;
};

type ApiLog = {
  id: string;
  channel_id: string | null;
  provider: string | null;
  event_type: string;
  event_description: string | null;
  status: "success" | "error" | "info";
  error_message: string | null;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  ativo: "bg-primary/15 text-primary border-primary/30",
  inativo: "bg-muted text-muted-foreground border-border/50",
  manutencao: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};
const CONN_COLOR: Record<string, string> = {
  connected: "bg-primary/15 text-primary border-primary/30",
  disconnected: "bg-muted text-muted-foreground border-border/50",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};
const PROVIDER_LABEL: Record<string, string> = {
  wapi: "W-API",
  zapi: "Z-API",
  evolution: "Evolution API",
  cloud: "WhatsApp Cloud API",
};

function SecretField({
  label, value, onChange, name,
}: { label: string; value: string | null; onChange: (v: string) => void; name: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          type={show ? "text" : "password"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={show ? "" : "••••••••"}
          autoComplete="off"
          name={name}
        />
        <Button type="button" size="icon" variant="outline" onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={async () => {
            if (!value) return;
            await navigator.clipboard.writeText(value);
            toast({ title: "Copiado" });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const PROVIDER_FIELDS: Record<Channel["provider"], Array<keyof Credentials>> = {
  wapi: ["token_encrypted", "client_id_encrypted"],
  zapi: ["token_encrypted", "client_id_encrypted"],
  evolution: ["api_key_encrypted"],
  cloud: ["access_token_encrypted", "refresh_token_encrypted", "client_id_encrypted", "client_secret_encrypted"],
};
const FIELD_LABEL: Partial<Record<keyof Credentials, string>> = {
  api_key_encrypted: "API Key",
  token_encrypted: "Token",
  access_token_encrypted: "Access Token",
  refresh_token_encrypted: "Refresh Token",
  client_id_encrypted: "Client ID / Client Token",
  client_secret_encrypted: "Client Secret",
};

export default function AdminMotorRespostaApis() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Credentials>>({});
  const [engines, setEngines] = useState<Record<string, Engine>>({});
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: chs }, { data: cs }, { data: es }, { data: lg }] = await Promise.all([
      supabase.from("api_channels").select("*").order("created_at"),
      supabase.from("api_credentials").select("*"),
      supabase.from("response_engine_settings").select("*"),
      supabase.from("api_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const chList = (chs as Channel[]) ?? [];
    setChannels(chList);
    setCredentials(Object.fromEntries((cs ?? []).map((c: any) => [c.channel_id, c])));
    setEngines(Object.fromEntries((es ?? []).map((e: any) => [e.channel_id, e])));
    setLogs((lg as ApiLog[]) ?? []);
    if (!activeChannelId && chList.length) setActiveChannelId(chList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  );

  const updateChannel = (patch: Partial<Channel>) => {
    if (!activeChannel) return;
    setChannels((prev) => prev.map((c) => (c.id === activeChannel.id ? { ...c, ...patch } : c)));
  };

  const saveChannel = async () => {
    if (!activeChannel) return;
    const { id, ...rest } = activeChannel;
    const { error } = await supabase.from("api_channels").update(rest).eq("id", id);
    if (error) return toast({ title: "Erro ao salvar canal", description: error.message, variant: "destructive" });
    await supabase.from("api_logs").insert({
      channel_id: id, provider: activeChannel.provider,
      event_type: "api_configured", event_description: "Dados do canal atualizados", status: "success",
    });
    toast({ title: "Canal salvo" });
    loadAll();
  };

  const toggleActive = async (ch: Channel, value: boolean) => {
    const { error } = await supabase
      .from("api_channels")
      .update({ is_active: value, status: value ? "ativo" : "inativo" })
      .eq("id", ch.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await supabase.from("api_logs").insert({
      channel_id: ch.id, provider: ch.provider,
      event_type: value ? "channel_enabled" : "channel_disabled",
      event_description: value ? "Canal ativado" : "Canal desativado",
      status: "success",
    });
    toast({ title: value ? "Canal ativado" : "Canal desativado" });
    loadAll();
  };

  const saveCredentials = async () => {
    if (!activeChannel) return;
    const c = credentials[activeChannel.id] ?? { channel_id: activeChannel.id } as Credentials;
    const { error } = await supabase
      .from("api_credentials")
      .upsert({ ...c, channel_id: activeChannel.id }, { onConflict: "channel_id" });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await supabase.from("api_logs").insert({
      channel_id: activeChannel.id, provider: activeChannel.provider,
      event_type: "token_updated", event_description: "Credenciais atualizadas", status: "success",
    });
    toast({ title: "Credenciais salvas" });
    loadAll();
  };

  const saveEngine = async () => {
    if (!activeChannel) return;
    const e = engines[activeChannel.id];
    if (!e) return;
    const { id, ...rest } = e;
    const { error } = await supabase
      .from("response_engine_settings")
      .upsert({ ...rest, channel_id: activeChannel.id }, { onConflict: "channel_id" });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Motor de resposta salvo" });
    loadAll();
  };

  const testConnection = async (ch: Channel) => {
    setTesting(ch.id);
    const { data, error } = await supabase.functions.invoke("crm-test-connection", {
      body: { channel_id: ch.id },
    });
    setTesting(null);
    if (error) return toast({ title: "Falha no teste", description: error.message, variant: "destructive" });
    if (data?.ok) toast({ title: "Conectado", description: data.number ? `Número: ${data.number}` : "OK" });
    else toast({ title: "Não conectado", description: data?.detail ?? "Verifique credenciais", variant: "destructive" });
    loadAll();
  };

  const channelTabs = (
    <div className="flex flex-wrap gap-2">
      {channels.map((c) => (
        <button
          key={c.id}
          onClick={() => setActiveChannelId(c.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium tracking-tight border transition-colors ${
            activeChannelId === c.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout role="admin" title="Motor de Resposta & APIs" subtitle="Configurações dos canais de WhatsApp">
      <div className="space-y-6 pb-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Motor de Resposta & APIs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure, habilite e monitore os canais de WhatsApp do CRM STH METHOD.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <ShieldAlert className="h-3 w-3 mr-1" /> Acesso restrito ao Admin
          </Badge>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando…</CardContent></Card>
        ) : (
          <>
            <MotoresGlobaisPanel />

            <div className="grid gap-4 sm:grid-cols-2">
              {channels.map((c) => (
                <Card key={c.id} className="border-border/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                    <div>
                      <CardTitle className="text-lg tracking-tight">{c.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.channel_type === "comercial" ? "Canal comercial" : "Atendimento personalizado"} ·{" "}
                        {PROVIDER_LABEL[c.provider]}
                      </p>
                    </div>
                    <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive(c, v)} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={STATUS_COLOR[c.status]}>{c.status}</Badge>
                      <Badge variant="outline" className={CONN_COLOR[c.connection_status]}>
                        <Activity className="h-3 w-3 mr-1" />
                        {c.connection_status}
                      </Badge>
                      {c.connected_number && (
                        <Badge variant="outline" className="border-border/40">{c.connected_number}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Última sincronização: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString("pt-BR") : "—"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => testConnection(c)} disabled={testing === c.id}>
                        <Plug className="h-3.5 w-3.5 mr-1" />
                        {testing === c.id ? "Testando…" : "Testar conexão"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => testConnection(c)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reconectar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveChannelId(c.id)}>
                        <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar
                      </Button>
                      {c.is_active && (
                        <Button size="sm" variant="outline" onClick={() => toggleActive(c, false)}>
                          <Power className="h-3.5 w-3.5 mr-1" /> Desativar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {activeChannel && (
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="text-lg tracking-tight">Configuração detalhada</CardTitle>
                    {channelTabs}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="canal">
                    <TabsList className="bg-muted/30">
                      <TabsTrigger value="canal">Dados do canal</TabsTrigger>
                      <TabsTrigger value="api">API & Credenciais</TabsTrigger>
                      <TabsTrigger value="motor">Motor de resposta</TabsTrigger>
                      <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>

                    {/* CANAL */}
                    <TabsContent value="canal" className="space-y-4 pt-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Nome do canal</Label>
                          <Input value={activeChannel.name} onChange={(e) => updateChannel({ name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Tipo do canal</Label>
                          <Select
                            value={activeChannel.channel_type}
                            onValueChange={(v: any) => updateChannel({ channel_type: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comercial">Comercial</SelectItem>
                              <SelectItem value="atendimento_personalizado">Atendimento personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Número de WhatsApp</Label>
                          <Input
                            value={activeChannel.whatsapp_number ?? ""}
                            onChange={(e) => updateChannel({ whatsapp_number: e.target.value })}
                            placeholder="+55 21 99999-0000"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Status</Label>
                          <Select
                            value={activeChannel.status}
                            onValueChange={(v: any) => updateChannel({ status: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                              <SelectItem value="manutencao">Em manutenção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Responsável principal (user id)</Label>
                          <Input
                            value={activeChannel.responsible_user_id ?? ""}
                            onChange={(e) => updateChannel({ responsible_user_id: e.target.value || null })}
                            placeholder="uuid"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label>Descrição interna</Label>
                          <Textarea
                            value={activeChannel.description ?? ""}
                            onChange={(e) => updateChannel({ description: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button onClick={saveChannel} className="bg-primary text-primary-foreground">
                        <Save className="h-4 w-4 mr-1" /> Salvar canal
                      </Button>
                    </TabsContent>

                    {/* API */}
                    <TabsContent value="api" className="space-y-4 pt-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Provedor</Label>
                          <Select
                            value={activeChannel.provider}
                            onValueChange={(v: any) => updateChannel({ provider: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wapi">W-API</SelectItem>
                              <SelectItem value="zapi">Z-API</SelectItem>
                              <SelectItem value="evolution">Evolution API</SelectItem>
                              <SelectItem value="cloud">WhatsApp Cloud API</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Instance ID</Label>
                          <Input
                            value={activeChannel.instance_id ?? ""}
                            onChange={(e) => updateChannel({ instance_id: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Instance Name</Label>
                          <Input
                            value={activeChannel.instance_name ?? ""}
                            onChange={(e) => updateChannel({ instance_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Base URL da API</Label>
                          <Input
                            value={activeChannel.base_url ?? ""}
                            onChange={(e) => updateChannel({ base_url: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label>Webhook URL</Label>
                          <Input
                            value={activeChannel.webhook_url ?? ""}
                            onChange={(e) => updateChannel({ webhook_url: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/40 p-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <KeyRound className="h-4 w-4 text-primary" />
                          <span className="font-medium tracking-tight">Credenciais (ocultas por padrão)</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {PROVIDER_FIELDS[activeChannel.provider].map((field) => (
                            <SecretField
                              key={field}
                              name={field}
                              label={FIELD_LABEL[field] ?? field}
                              value={(credentials[activeChannel.id]?.[field] as string) ?? ""}
                              onChange={(v) =>
                                setCredentials((prev) => ({
                                  ...prev,
                                  [activeChannel.id]: {
                                    ...(prev[activeChannel.id] ?? { channel_id: activeChannel.id } as any),
                                    [field]: v,
                                  },
                                }))
                              }
                            />
                          ))}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Expiração do token</Label>
                            <Input
                              type="datetime-local"
                              value={
                                credentials[activeChannel.id]?.token_expires_at
                                  ? new Date(credentials[activeChannel.id]!.token_expires_at!)
                                      .toISOString().slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                setCredentials((prev) => ({
                                  ...prev,
                                  [activeChannel.id]: {
                                    ...(prev[activeChannel.id] ?? { channel_id: activeChannel.id } as any),
                                    token_expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={saveCredentials} className="bg-primary text-primary-foreground">
                          <Save className="h-4 w-4 mr-1" /> Salvar credenciais
                        </Button>
                        <Button variant="outline" onClick={() => testConnection(activeChannel)}>
                          <Plug className="h-4 w-4 mr-1" /> Testar conexão
                        </Button>
                        <Button variant="outline" onClick={() => testConnection(activeChannel)}>
                          <RefreshCw className="h-4 w-4 mr-1" /> Reconectar
                        </Button>
                        <Button variant="outline" onClick={() => toggleActive(activeChannel, false)}>
                          <Power className="h-4 w-4 mr-1" /> Desativar canal
                        </Button>
                      </div>
                    </TabsContent>

                    {/* MOTOR */}
                    <TabsContent value="motor" className="space-y-4 pt-6">
                      {(() => {
                        const e = engines[activeChannel.id];
                        if (!e) return <p className="text-sm text-muted-foreground">Sem configuração ainda.</p>;
                        const set = (patch: Partial<Engine>) =>
                          setEngines((prev) => ({ ...prev, [activeChannel.id]: { ...prev[activeChannel.id], ...patch } }));
                        return (
                          <>
                            <div className="grid sm:grid-cols-3 gap-4">
                              <label className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                                <span className="text-sm">IA ativa</span>
                                <Switch checked={e.ai_enabled} onCheckedChange={(v) => set({ ai_enabled: v })} />
                              </label>
                              <label className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                                <span className="text-sm">Atendimento humano</span>
                                <Switch checked={e.human_enabled} onCheckedChange={(v) => set({ human_enabled: v })} />
                              </label>
                              <label className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                                <span className="text-sm">Resposta automática</span>
                                <Switch checked={e.auto_reply_enabled} onCheckedChange={(v) => set({ auto_reply_enabled: v })} />
                              </label>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label>Modelo de IA</Label>
                                <Select value={e.ai_model} onValueChange={(v) => set({ ai_model: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                    <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Temperatura ({e.temperature})</Label>
                                <Input
                                  type="number" step="0.1" min={0} max={2}
                                  value={e.temperature}
                                  onChange={(ev) => set({ temperature: Number(ev.target.value) })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Máx. respostas automáticas</Label>
                                <Input
                                  type="number" min={0}
                                  value={e.max_auto_replies}
                                  onChange={(ev) => set({ max_auto_replies: Number(ev.target.value) })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Transferir para humano após (min)</Label>
                                <Input
                                  type="number" min={0}
                                  value={e.handoff_to_human_after_minutes}
                                  onChange={(ev) => set({ handoff_to_human_after_minutes: Number(ev.target.value) })}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label>Mensagem fora do horário</Label>
                              <Textarea
                                rows={2}
                                value={e.after_hours_message ?? ""}
                                onChange={(ev) => set({ after_hours_message: ev.target.value })}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="flex items-center gap-1"><Cpu className="h-3.5 w-3.5" /> Prompt principal</Label>
                              <Textarea rows={5} value={e.main_prompt ?? ""} onChange={(ev) => set({ main_prompt: ev.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Prompt de segurança</Label>
                              <Textarea rows={4} value={e.safety_prompt ?? ""} onChange={(ev) => set({ safety_prompt: ev.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Prompt de fallback</Label>
                              <Textarea rows={3} value={e.fallback_prompt ?? ""} onChange={(ev) => set({ fallback_prompt: ev.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Horário de atendimento (JSON)</Label>
                              <Textarea
                                rows={5}
                                value={JSON.stringify(e.business_hours, null, 2)}
                                onChange={(ev) => {
                                  try { set({ business_hours: JSON.parse(ev.target.value) }); } catch {}
                                }}
                              />
                            </div>

                            <Button onClick={saveEngine} className="bg-primary text-primary-foreground">
                              <Save className="h-4 w-4 mr-1" /> Salvar motor de resposta
                            </Button>
                          </>
                        );
                      })()}
                    </TabsContent>

                    {/* LOGS */}
                    <TabsContent value="logs" className="pt-6">
                      <div className="rounded-xl border border-border/40 overflow-hidden">
                        <div className="max-h-[60vh] overflow-auto divide-y divide-border/40">
                          {logs.filter((l) => !activeChannel || l.channel_id === activeChannel.id).length === 0 && (
                            <div className="p-6 text-center text-sm text-muted-foreground">Nenhum log ainda.</div>
                          )}
                          {logs
                            .filter((l) => !activeChannel || l.channel_id === activeChannel.id)
                            .map((l) => (
                              <div key={l.id} className="p-3 text-xs flex items-start gap-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    l.status === "success"
                                      ? "border-primary/30 text-primary"
                                      : l.status === "error"
                                      ? "border-destructive/30 text-destructive"
                                      : "border-border/40 text-muted-foreground"
                                  }
                                >
                                  {l.event_type}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <div className="text-foreground truncate">{l.event_description || "—"}</div>
                                  {l.error_message && (
                                    <div className="text-destructive truncate">{l.error_message}</div>
                                  )}
                                  <div className="text-muted-foreground">
                                    {new Date(l.created_at).toLocaleString("pt-BR")} · {l.provider ?? "—"}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button variant="outline" size="sm" onClick={loadAll}>
                          <History className="h-3.5 w-3.5 mr-1" /> Recarregar
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}