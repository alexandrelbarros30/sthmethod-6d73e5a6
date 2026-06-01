import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Sparkles, Copy, Check } from "lucide-react";

type ZapiCfg = { enabled: boolean; instance_id: string; instance_token: string; client_token: string; webhook: string };
type WapiCfg = { enabled: boolean; server_url: string; instance_id: string; token: string; client_token: string; webhook: string };
type AiMode = { mode: "copilot" | "auto" };

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function AdminCrmSettings() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [zapi, setZapi] = useState<ZapiCfg>({ enabled: false, instance_id: "", instance_token: "", client_token: "", webhook: "" });
  const [wapi, setWapi] = useState<WapiCfg>({ enabled: false, server_url: "https://api.w-api.app", instance_id: "", token: "", client_token: "", webhook: "" });
  const [aiMode, setAiMode] = useState<AiMode>({ mode: "copilot" });
  const [copied, setCopied] = useState<string | null>(null);

  const zapiWebhook = `${PROJECT_URL}/functions/v1/crm-inbound-webhook?provider=zapi`;
  const wapiWebhook = `${PROJECT_URL}/functions/v1/crm-inbound-webhook?provider=wapi`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("crm_settings").select("key,value").in("key", ["zapi","wapi","ai_mode"]);
      (data ?? []).forEach((r: any) => {
        if (r.key === "zapi") setZapi({ ...zapi, ...(r.value || {}) });
        if (r.key === "wapi") setWapi({ ...wapi, ...(r.value || {}) });
        if (r.key === "ai_mode") setAiMode({ mode: r.value?.mode || "copilot" });
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(key: string, value: any) {
    setSaving(key);
    const { error } = await supabase.from("crm_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(null);
    if (error) toast({ title: "Erro", description: error.message });
    else toast({ title: "Configuração salva" });
  }

  async function testConn(provider: "zapi" | "wapi") {
    setTesting(provider);
    try {
      const { data, error } = await supabase.functions.invoke("crm-test-whatsapp", { body: { provider } });
      if (error) throw error;
      if (data?.ok) toast({ title: "Conexão OK", description: provider.toUpperCase() + " respondeu com sucesso." });
      else toast({ title: "Conexão falhou", description: data?.error || JSON.stringify(data?.data || data).slice(0, 200) });
    } catch (e: any) {
      toast({ title: "Erro no teste", description: e?.message || String(e) });
    } finally {
      setTesting(null);
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar role="admin" />
        <div className={`${isMobile ? "pt-16" : "ml-60"} p-6 flex items-center justify-center`}>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="admin" />
      <div className={`${isMobile ? "pt-16" : "ml-60"} p-6 max-w-4xl mx-auto space-y-6`}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações de WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Integração operacional dos canais STH One (Z-API) e Fale com o Nutri (W-API).</p>
        </div>

        {/* Z-API */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold">STH One — Comercial (Z-API)</h2>
                <Badge variant={zapi.enabled ? "default" : "secondary"}>{zapi.enabled ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Captação de leads, planos, cadastro, conversão, renovação.</p>
            </div>
            <Switch checked={zapi.enabled} onCheckedChange={(v) => setZapi({ ...zapi, enabled: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Instance ID</Label><Input value={zapi.instance_id} onChange={(e) => setZapi({ ...zapi, instance_id: e.target.value })} /></div>
            <div className="space-y-1"><Label>Instance Token</Label><Input value={zapi.instance_token} onChange={(e) => setZapi({ ...zapi, instance_token: e.target.value })} type="password" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Client Token</Label><Input value={zapi.client_token} onChange={(e) => setZapi({ ...zapi, client_token: e.target.value })} type="password" /></div>
          </div>
          <div className="space-y-1">
            <Label>Webhook (configure este URL na Z-API)</Label>
            <div className="flex gap-2">
              <Input readOnly value={zapiWebhook} className="font-mono text-[11px]" />
              <Button variant="outline" size="icon" onClick={() => copy(zapiWebhook, "zapi-wh")}>
                {copied === "zapi-wh" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Inclua header <code>x-webhook-secret</code> com o valor do secret MP_WEBHOOK_SECRET.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save("zapi", zapi)} disabled={saving === "zapi"}>{saving === "zapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}</Button>
            <Button variant="outline" onClick={() => testConn("zapi")} disabled={testing === "zapi"}>
              {testing === "zapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testar Conexão"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">As credenciais reais ficam armazenadas como secrets do backend (ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN). Os campos acima servem para auditoria/operação.</p>
        </Card>

        {/* W-API */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-semibold">Fale com o Nutri (W-API)</h2>
                <Badge variant={wapi.enabled ? "default" : "secondary"}>{wapi.enabled ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Atendimento de alunos ativos: dieta, treino, protocolo, exames, atualização, prioridade.</p>
            </div>
            <Switch checked={wapi.enabled} onCheckedChange={(v) => setWapi({ ...wapi, enabled: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label>Server URL</Label><Input value={wapi.server_url} onChange={(e) => setWapi({ ...wapi, server_url: e.target.value })} /></div>
            <div className="space-y-1"><Label>Instance ID</Label><Input value={wapi.instance_id} onChange={(e) => setWapi({ ...wapi, instance_id: e.target.value })} /></div>
            <div className="space-y-1"><Label>Token</Label><Input value={wapi.token} onChange={(e) => setWapi({ ...wapi, token: e.target.value })} type="password" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Client Token (opcional)</Label><Input value={wapi.client_token} onChange={(e) => setWapi({ ...wapi, client_token: e.target.value })} type="password" /></div>
          </div>
          <div className="space-y-1">
            <Label>Webhook (configure este URL na W-API)</Label>
            <div className="flex gap-2">
              <Input readOnly value={wapiWebhook} className="font-mono text-[11px]" />
              <Button variant="outline" size="icon" onClick={() => copy(wapiWebhook, "wapi-wh")}>
                {copied === "wapi-wh" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save("wapi", wapi)} disabled={saving === "wapi"}>{saving === "wapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}</Button>
            <Button variant="outline" onClick={() => testConn("wapi")} disabled={testing === "wapi"}>
              {testing === "wapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testar Conexão"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Credenciais reais: secrets WAPI_INSTANCE_ID, WAPI_TOKEN, WAPI_CLIENT_TOKEN.</p>
        </Card>

        {/* IA */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-semibold">IA Operacional</h2>
            <Badge variant="outline">{aiMode.mode === "copilot" ? "Copiloto" : "Automático"}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Modo Copiloto</p>
              <p className="text-xs text-muted-foreground">IA classifica, aplica tags e sugere resposta. Humano aprova antes de enviar.</p>
            </div>
            <Switch checked={aiMode.mode === "copilot"} onCheckedChange={(v) => setAiMode({ mode: v ? "copilot" : "auto" })} />
          </div>
          <Button onClick={() => save("ai_mode", aiMode)} disabled={saving === "ai_mode"}>
            {saving === "ai_mode" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar modo"}
          </Button>
        </Card>
      </div>
    </div>
  );
}