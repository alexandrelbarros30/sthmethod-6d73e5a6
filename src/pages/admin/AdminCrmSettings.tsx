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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Sparkles, Copy, Check, Clock, BellOff, ImageIcon, Upload, X, Workflow } from "lucide-react";

type ZapiCfg = { enabled: boolean; instance_id: string; instance_token: string; client_token: string; webhook: string };
type WapiCfg = { enabled: boolean; server_url: string; instance_id: string; token: string; client_token: string; webhook: string };
type AiMode = { mode: "copilot" | "auto" };
type Hours = { tz: string; mon_fri: { start: string; end: string } | null; sat: { start: string; end: string } | null; sun: { start: string; end: string } | null };
const DEFAULT_HOURS: Hours = { tz: "America/Sao_Paulo", mon_fri: { start: "09:00", end: "19:00" }, sat: { start: "09:00", end: "14:00" }, sun: null };

type FlowTpl = { message: string; image_url?: string | null };

const FLOW_KEYS = [
  { key: "comercial_id_active",         label: "Saudação — Aluno Ativo",          hasImage: true,  defaultMsg: "Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você possui um *acompanhamento ativo* na STH METHOD.\n\nPara assuntos sobre *dieta, treino, protocolo, exames ou evolução*, utilize uma das opções abaixo:\n\n🟢 Digite *NUTRI*\nou\n🟢 Clique em *Fale com o Nutri*:\n👉 https://wa.me/5521998984153" },
  { key: "comercial_id_expired",        label: "Saudação — Aluno Vencido (menu)", hasImage: true,  defaultMsg: "Olá{nomeSep}{nome}! 👋\n\nIdentificamos que você já fez parte da STH METHOD.\n\nComo podemos ajudar?\n\n1️⃣ Conhecer os planos\n2️⃣ Formas de pagamento\n3️⃣ Falar com um consultor" },
  { key: "comercial_id_lead",           label: "Lead — Pedido de Nome",            hasImage: true,  defaultMsg: "Olá! 👋\n\nSeja bem-vindo(a) à *STH METHOD*.\n\nQual é o seu *nome*?" },
  { key: "comercial_lead_menu",         label: "Lead — Menu após nome",            hasImage: false, defaultMsg: "Prazer, {nome}.\n\nComo posso ajudar?\n\n1️⃣ Como funciona\n2️⃣ Conhecer os planos\n3️⃣ Falar com um consultor" },
  { key: "comercial_menu_2_como_funciona", label: "Como funciona a STH METHOD",    hasImage: false, defaultMsg: "*Como funciona a STH METHOD* 🧬\n\nA STH METHOD é uma consultoria em performance, saúde e transformação corporal, baseada em ciência e estratégia.\n\n✅ *Plano Alimentar Personalizado*\n✅ *Treino Personalizado*\n✅ *Protocolo Inteligente*\n✅ *Análise de Exames*\n✅ *Acompanhamento Contínuo*\n✅ *Avaliação Mensal*" },
  { key: "comercial_formas_pagamento",  label: "Formas de Pagamento",              hasImage: false, defaultMsg: "*Formas de pagamento* 💳\n\n💳 Cartão de Crédito\n📲 PIX\n💰 Parcelamento disponível conforme o plano\n\n1️⃣ Ver Planos\n2️⃣ Falar com consultor\n0️⃣ Voltar" },
  { key: "comercial_handoff_consultor", label: "Transferência para Consultor",     hasImage: false, defaultMsg: "Perfeito.\n\nVou encaminhar você para um *consultor* da equipe STH METHOD.\n\nAguarde alguns instantes. 🙏" },
  { key: "comercial_lista_planos",      label: "Lista de Planos (imagem opcional)", hasImage: true, defaultMsg: "" },
] as const;

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
  const [hoursCom, setHoursCom] = useState<Hours>(DEFAULT_HOURS);
  const [hoursNutri, setHoursNutri] = useState<Hours>({ ...DEFAULT_HOURS, mon_fri: { start: "09:00", end: "18:00" } });
  const [awayComLead, setAwayComLead] = useState("");
  const [awayComActive, setAwayComActive] = useState("");
  const [awayComExpired, setAwayComExpired] = useState("");
  const [awayNutriActive, setAwayNutriActive] = useState("");
  const [awayNutriInactive, setAwayNutriInactive] = useState("");
  const [flowTpls, setFlowTpls] = useState<Record<string, FlowTpl>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const zapiWebhook = `${PROJECT_URL}/functions/v1/crm-inbound-webhook?provider=zapi`;
  const wapiWebhook = `${PROJECT_URL}/functions/v1/crm-inbound-webhook?provider=wapi`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("crm_settings").select("key,value").in("key", [
        "zapi","wapi","ai_mode",
        "business_hours_comercial","business_hours_nutri",
        "comercial_away_lead","comercial_away_active","comercial_away_expired",
        "nutri_away_active","nutri_away_inactive",
        ...FLOW_KEYS.map(k => k.key),
      ]);
      const tpls: Record<string, FlowTpl> = {};
      (data ?? []).forEach((r: any) => {
        if (r.key === "zapi") setZapi({ ...zapi, ...(r.value || {}) });
        if (r.key === "wapi") setWapi({ ...wapi, ...(r.value || {}) });
        if (r.key === "ai_mode") setAiMode({ mode: r.value?.mode || "copilot" });
        if (r.key === "business_hours_comercial" && r.value) setHoursCom({ ...DEFAULT_HOURS, ...r.value });
        if (r.key === "business_hours_nutri" && r.value) setHoursNutri({ ...DEFAULT_HOURS, ...r.value });
        if (r.key === "comercial_away_lead") setAwayComLead(r.value?.message || "");
        if (r.key === "comercial_away_active") setAwayComActive(r.value?.message || "");
        if (r.key === "comercial_away_expired") setAwayComExpired(r.value?.message || "");
        if (r.key === "nutri_away_active") setAwayNutriActive(r.value?.message || "");
        if (r.key === "nutri_away_inactive") setAwayNutriInactive(r.value?.message || "");
        const fk = FLOW_KEYS.find(k => k.key === r.key);
        if (fk) tpls[r.key] = { message: r.value?.message ?? fk.defaultMsg, image_url: r.value?.image_url ?? null };
      });
      FLOW_KEYS.forEach(k => { if (!tpls[k.key]) tpls[k.key] = { message: k.defaultMsg, image_url: null }; });
      setFlowTpls(tpls);
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
      if (data?.ok) {
        toast({ title: "Conexão OK", description: data?.message || `${provider.toUpperCase()} conectada (fonte: ${data?.source || "—"}).` });
      } else {
        const desc = data?.error || data?.data?.error || JSON.stringify(data?.data || data).slice(0, 250);
        toast({ title: "Conexão falhou", description: desc, variant: "destructive" as any });
      }
    } catch (e: any) {
      toast({ title: "Erro no teste", description: e?.message || String(e) });
    } finally {
      setTesting(null);
    }
  }

  async function saveAndTest(key: "zapi" | "wapi", value: any) {
    await save(key, value);
    await testConn(key);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  async function uploadFlowImage(key: string, file: File) {
    if (!file.type.startsWith("image/")) { toast({ title: "Selecione uma imagem" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Máximo 5MB" }); return; }
    setUploadingKey(key);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `flow-templates/${key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("crm-media").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("crm-media").getPublicUrl(path);
      const next: FlowTpl = { ...(flowTpls[key] || { message: "" }), image_url: data.publicUrl };
      setFlowTpls(prev => ({ ...prev, [key]: next }));
      await save(key, next);
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e?.message || String(e), variant: "destructive" as any });
    } finally {
      setUploadingKey(null);
    }
  }

  async function removeFlowImage(key: string) {
    const next: FlowTpl = { ...(flowTpls[key] || { message: "" }), image_url: null };
    setFlowTpls(prev => ({ ...prev, [key]: next }));
    await save(key, next);
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
            <Button variant="secondary" onClick={() => saveAndTest("zapi", zapi)} disabled={saving === "zapi" || testing === "zapi"}>
              {(saving === "zapi" || testing === "zapi") ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar e Testar"}
            </Button>
            <Button variant="outline" onClick={() => testConn("zapi")} disabled={testing === "zapi"}>
              {testing === "zapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testar Conexão"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Os valores acima são a <b>fonte oficial</b> usada pelos envios e pelo teste de conexão. Atualize o Client-Token aqui sempre que regenerar no painel Z-API.</p>
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
            <Button variant="secondary" onClick={() => saveAndTest("wapi", wapi)} disabled={saving === "wapi" || testing === "wapi"}>
              {(saving === "wapi" || testing === "wapi") ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar e Testar"}
            </Button>
            <Button variant="outline" onClick={() => testConn("wapi")} disabled={testing === "wapi"}>
              {testing === "wapi" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testar Conexão"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Os valores acima são a <b>fonte oficial</b> usada pelos envios e testes. Não é mais necessário mexer em secrets do backend.</p>
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

        {/* Horários de atendimento */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold">Horários de atendimento</h2>
          </div>
          <p className="text-xs text-muted-foreground">Fora destes horários cada canal envia automaticamente sua mensagem de ausência (1x por sessão).</p>

          {[
            { key: "business_hours_comercial", label: "STH One — Comercial (Z-API)", state: hoursCom, set: setHoursCom },
            { key: "business_hours_nutri", label: "Fale com o Nutri (W-API)", state: hoursNutri, set: setHoursNutri },
          ].map(({ key, label, state, set }) => (
            <div key={key} className="space-y-3 border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Button size="sm" onClick={() => save(key, state)} disabled={saving === key}>
                  {saving === key ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
              {(["mon_fri","sat","sun"] as const).map((d) => (
                <div key={d} className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-2">
                  <Label className="text-xs">{d === "mon_fri" ? "Seg–Sex" : d === "sat" ? "Sábado" : "Domingo"}</Label>
                  <Input
                    type="time"
                    value={state[d]?.start ?? ""}
                    disabled={!state[d]}
                    onChange={(e) => set({ ...state, [d]: { start: e.target.value, end: state[d]?.end ?? "18:00" } } as Hours)}
                  />
                  <Input
                    type="time"
                    value={state[d]?.end ?? ""}
                    disabled={!state[d]}
                    onChange={(e) => set({ ...state, [d]: { start: state[d]?.start ?? "09:00", end: e.target.value } } as Hours)}
                  />
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={!!state[d]}
                      onCheckedChange={(v) => set({ ...state, [d]: v ? { start: "09:00", end: "18:00" } : null } as Hours)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>

        {/* Mensagens de ausência */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-semibold">Mensagens de ausência (fora do expediente)</h2>
          </div>
          <p className="text-xs text-muted-foreground">Disparadas automaticamente na 1ª mensagem de cada sessão fora do horário. Variáveis: <code>{"{nome}"}</code> e <code>{"{nomeSep}"}</code>.</p>

          {[
            { key: "comercial_away_lead", label: "Comercial — Lead", value: awayComLead, set: setAwayComLead },
            { key: "comercial_away_active", label: "Comercial — Aluno ativo", value: awayComActive, set: setAwayComActive },
            { key: "comercial_away_expired", label: "Comercial — Aluno vencido", value: awayComExpired, set: setAwayComExpired },
            { key: "nutri_away_active", label: "Nutri — Aluno ativo", value: awayNutriActive, set: setAwayNutriActive },
            { key: "nutri_away_inactive", label: "Nutri — Lead/Vencido", value: awayNutriInactive, set: setAwayNutriInactive },
          ].map(({ key, label, value, set }) => (
            <div key={key} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <Button size="sm" onClick={() => save(key, { message: value })} disabled={saving === key}>
                  {saving === key ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
              <Textarea value={value} onChange={(e) => set(e.target.value)} rows={5} className="text-xs font-mono" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}