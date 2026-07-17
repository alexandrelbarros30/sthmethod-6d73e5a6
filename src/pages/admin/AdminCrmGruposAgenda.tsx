import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Send, Users, Image as ImageIcon, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert } from "lucide-react";
import { Eye, Megaphone, FileText, Trash2 } from "lucide-react";

const ONESHOT_DEFAULT_MESSAGE = `🔬 Requisição de Exames Laboratoriais

O acompanhamento por exames é uma etapa fundamental para quem utiliza protocolos personalizados, permitindo decisões mais seguras e precisas.

A requisição de exames auxilia em:
• Controle de danos e segurança biológica;
• Calibração e ajuste do protocolo, conforme sua evolução;
• Monitoramento da resposta aos peptídeos e demais estratégias terapêuticas;
• Planejamento de TPC (Terapia Pós Ciclo) ou Cruises, quando aplicável.

💳 Valor promocional: R$ 120,00
• Pagamento via Pix ou em até 2x sem juros.

📲 Para solicitar sua requisição de exames, entre em contato pelo WhatsApp (21) 99144-6811.`;

const ONESHOT_DEFAULT_IMAGE = "https://api.freelovable.com.br/storage/v1/object/public/anexos/577e938d-582a-4522-9e6c-ec4509b052b6.png";

// Templates de "Envio único" salvos no navegador (localStorage).
// Permite ao admin manter múltiplas mensagens prontas e trocar rapidamente.
interface OneshotTemplate {
  id: string;
  name: string;
  message: string;
  image_url: string;
  text_first: boolean;
}
const ONESHOT_TEMPLATES_KEY = "crm_oneshot_templates_v1";
const DEFAULT_TEMPLATES: OneshotTemplate[] = [
  {
    id: "requisicao_exames",
    name: "🔬 Requisição de Exames",
    message: ONESHOT_DEFAULT_MESSAGE,
    image_url: ONESHOT_DEFAULT_IMAGE,
    text_first: false,
  },
];
function loadOneshotTemplates(): OneshotTemplate[] {
  try {
    const raw = localStorage.getItem(ONESHOT_TEMPLATES_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_TEMPLATES;
    return arr as OneshotTemplate[];
  } catch {
    return DEFAULT_TEMPLATES;
  }
}
function saveOneshotTemplates(list: OneshotTemplate[]) {
  try { localStorage.setItem(ONESHOT_TEMPLATES_KEY, JSON.stringify(list)); } catch {}
}

interface Row {
  id: string;
  key: string;
  label: string;
  weekday: number;
  hour_brt: number;
  message_body: string;
  image_urls: string[];
  text_first: boolean;
  group_ids: string[];
  active: boolean;
  last_sent_at: string | null;
}

const WEEKDAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

interface ZapiGroup { id: string; name: string; image?: string | null }

export default function AdminCrmGruposAgenda() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Partial<Row>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [groupsCache, setGroupsCache] = useState<ZapiGroup[] | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [search, setSearch] = useState("");
  const [killSwitch, setKillSwitch] = useState<boolean>(true);
  const [killBusy, setKillBusy] = useState(false);

  // Envio único (ad-hoc) para todos os grupos
  const [oneshotOpen, setOneshotOpen] = useState(false);
  const [oneshotMessage, setOneshotMessage] = useState<string>(ONESHOT_DEFAULT_MESSAGE);
  const [oneshotImage, setOneshotImage] = useState<string>(ONESHOT_DEFAULT_IMAGE);
  const [oneshotTextFirst, setOneshotTextFirst] = useState<boolean>(false);
  const [oneshotGroups, setOneshotGroups] = useState<ZapiGroup[]>([]);
  const [oneshotSelected, setOneshotSelected] = useState<Set<string>>(new Set());
  const [oneshotLoading, setOneshotLoading] = useState(false);
  const [oneshotSending, setOneshotSending] = useState(false);
  const [oneshotUploading, setOneshotUploading] = useState(false);
  const [oneshotPreview, setOneshotPreview] = useState(false);
  const [oneshotResult, setOneshotResult] = useState<any>(null);

  // Biblioteca de mensagens prontas (localStorage) para o Envio Único.
  const [oneshotTemplates, setOneshotTemplates] = useState<OneshotTemplate[]>(() => loadOneshotTemplates());
  const [oneshotTemplateId, setOneshotTemplateId] = useState<string>(() => loadOneshotTemplates()[0]?.id || "");

  function applyOneshotTemplate(id: string) {
    const t = oneshotTemplates.find((x) => x.id === id);
    if (!t) return;
    setOneshotTemplateId(id);
    setOneshotMessage(t.message);
    setOneshotImage(t.image_url);
    setOneshotTextFirst(!!t.text_first);
  }
  function persistTemplates(list: OneshotTemplate[]) {
    setOneshotTemplates(list);
    saveOneshotTemplates(list);
  }
  function updateCurrentTemplate() {
    if (!oneshotTemplateId) return;
    const list = oneshotTemplates.map((t) => t.id === oneshotTemplateId
      ? { ...t, message: oneshotMessage, image_url: oneshotImage, text_first: oneshotTextFirst }
      : t);
    persistTemplates(list);
    toast({ title: "Template atualizado" });
  }
  function createTemplateFromCurrent() {
    const name = window.prompt("Nome do novo template:", "Novo template")?.trim();
    if (!name) return;
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const t: OneshotTemplate = {
      id, name, message: oneshotMessage, image_url: oneshotImage, text_first: oneshotTextFirst,
    };
    const list = [...oneshotTemplates, t];
    persistTemplates(list);
    setOneshotTemplateId(id);
    toast({ title: "Template salvo", description: name });
  }
  function deleteCurrentTemplate() {
    if (!oneshotTemplateId) return;
    const t = oneshotTemplates.find((x) => x.id === oneshotTemplateId);
    if (!t) return;
    if (!confirm(`Excluir template "${t.name}"?`)) return;
    const list = oneshotTemplates.filter((x) => x.id !== oneshotTemplateId);
    const fallback = list[0];
    persistTemplates(list.length ? list : DEFAULT_TEMPLATES);
    if (fallback) applyOneshotTemplate(fallback.id);
    else applyOneshotTemplate(DEFAULT_TEMPLATES[0].id);
  }

  async function openOneshot() {
    setOneshotOpen(true);
    setOneshotResult(null);
    if (oneshotGroups.length === 0) {
      setOneshotLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("crm-zapi-list-groups");
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Falha ao listar grupos");
        const gs: ZapiGroup[] = data.groups || [];
        setOneshotGroups(gs);
        setOneshotSelected(new Set(gs.map((g) => g.id)));
      } catch (e: any) {
        toast({ title: "Erro ao listar grupos", description: e?.message || String(e) });
      } finally { setOneshotLoading(false); }
    }
  }

  function toggleOneshotGroup(id: string) {
    setOneshotSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function dispatchOneshot() {
    const ids = Array.from(oneshotSelected);
    if (ids.length === 0) { toast({ title: "Selecione ao menos 1 grupo" }); return; }
    // Z-API precisa baixar a imagem por HTTP público. Se a URL estiver quebrada,
    // o envio da mídia falha silenciosamente e só chega o texto.
    if (oneshotImage) {
      try {
        const head = await fetch(oneshotImage, { method: "HEAD" });
        if (!head.ok) {
          toast({
            title: "Imagem inacessível",
            description: `A URL retornou ${head.status}. Faça upload de um novo arquivo antes de disparar.`,
            variant: "destructive" as any,
          });
          return;
        }
      } catch {
        toast({
          title: "Não foi possível validar a imagem",
          description: "Verifique a URL ou faça upload de um novo arquivo.",
          variant: "destructive" as any,
        });
        return;
      }
    }
    setOneshotSending(true);
    setOneshotResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("crm-group-broadcast-oneshot", {
        body: {
          message: oneshotMessage,
          image_url: oneshotImage || undefined,
          group_ids: ids,
          text_first: oneshotTextFirst,
        },
      });
      console.log("[oneshot] response", { data, error });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha no disparo");
      setOneshotResult(data);
      const totalOk = (data.results || []).filter((r: any) => (r.steps || []).every((s: any) => s.ok !== false)).length;
      toast({ title: "Disparo enviado", description: `${totalOk}/${data.total} grupos concluídos.` });
    } catch (e: any) {
      console.error("[oneshot] erro", e);
      toast({ title: "Erro no disparo", description: e?.message || String(e), variant: "destructive" as any });
    } finally { setOneshotSending(false); }
  }

  async function uploadOneshotImage(file: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" as any });
      return;
    }
    setOneshotUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `oneshot/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("crm-media").upload(path, file, {
        contentType: file.type, upsert: true,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("crm-media").getPublicUrl(path);
      setOneshotImage(pub.publicUrl);
      toast({ title: "Imagem enviada", description: "URL pública atualizada." });
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e?.message || String(e), variant: "destructive" as any });
    } finally { setOneshotUploading(false); }
  }

  async function fetchGroups(force = false) {
    if (!force && groupsCache) return;
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-zapi-list-groups");
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha ao listar grupos");
      setGroupsCache(data.groups || []);
    } catch (e: any) {
      toast({ title: "Erro ao listar grupos", description: e?.message || String(e) });
    } finally { setLoadingGroups(false); }
  }

  function openPicker(id: string) {
    setPickerOpen(id);
    fetchGroups(false);
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_group_broadcasts")
      .select("*")
      .order("weekday").order("hour_brt");
    if (error) toast({ title: "Erro ao carregar", description: error.message });
    setRows((data ?? []) as Row[]);
    const { data: ks } = await supabase.from("crm_settings").select("value").eq("key", "group_broadcasts").maybeSingle();
    setKillSwitch(((ks?.value as any)?.enabled ?? true) === true);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleKillSwitch(v: boolean) {
    if (!v && !confirm("PARAR todos os disparos automáticos em grupos? Nenhuma mensagem será enviada até você reativar.")) return;
    setKillBusy(true);
    const { error } = await supabase.from("crm_settings").upsert({ key: "group_broadcasts", value: { enabled: v } }, { onConflict: "key" });
    setKillBusy(false);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setKillSwitch(v);
    toast({ title: v ? "Disparos ATIVADOS" : "Disparos PARADOS", description: v ? "O cron volta a enviar normalmente." : "Nada será enviado até reativar." });
  }

  function patch(id: string, p: Partial<Row>) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...p } }));
  }
  function merged(r: Row): Row { return { ...r, ...(draft[r.id] || {}) }; }

  async function save(r: Row) {
    const m = merged(r);
    setSaving(r.id);
    const { error } = await supabase.from("crm_group_broadcasts").update({
      message_body: m.message_body,
      image_urls: m.image_urls,
      text_first: m.text_first,
      group_ids: m.group_ids,
      active: m.active,
      weekday: m.weekday,
      hour_brt: m.hour_brt,
    }).eq("id", r.id);
    setSaving(null);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; });
    toast({ title: "Salvo" });
    load();
  }

  async function toggleActive(r: Row, v: boolean) {
    const { error } = await supabase.from("crm_group_broadcasts").update({ active: v }).eq("id", r.id);
    if (error) { toast({ title: "Erro", description: error.message }); return; }
    setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, active: v } : x));
  }

  async function dispatchNow(r: Row) {
    if (!confirm(`Disparar AGORA "${r.label}" para ${(merged(r).group_ids || []).length} grupo(s)?`)) return;
    setTesting(r.id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-group-broadcast-tick", { body: { force_id: r.id } });
      if (error) throw error;
      toast({ title: "Disparo enviado", description: "Confira no WhatsApp dos grupos." });
      console.log("dispatch result", data);
      load();
    } catch (e: any) {
      toast({ title: "Erro no disparo", description: e?.message || String(e) });
    } finally { setTesting(null); }
  }

  function addGroup(r: Row) {
    const v = (newGroup[r.id] || "").trim();
    if (!v) return;
    const cur = merged(r).group_ids || [];
    if (cur.includes(v)) return;
    patch(r.id, { group_ids: [...cur, v] });
    setNewGroup((s) => ({ ...s, [r.id]: "" }));
  }
  function removeGroup(r: Row, gid: string) {
    const cur = merged(r).group_ids || [];
    patch(r.id, { group_ids: cur.filter((x) => x !== gid) });
  }

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Disparos em Grupos" subtitle="Agendamento semanal — Z-API Comercial">
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Disparos em Grupos" subtitle="Agendamento semanal — Z-API Comercial (21 99849-6289)">
      <Card className={`p-4 mb-4 ${killSwitch ? "bg-emerald-500/5 border-emerald-500/40" : "bg-red-500/10 border-red-500/50"}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-5 h-5 ${killSwitch ? "text-emerald-500" : "text-red-500"}`} />
            <div>
              <p className="font-semibold text-sm">
                {killSwitch ? "Disparos automáticos ATIVADOS" : "⛔ Disparos automáticos PARADOS"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Botão de segurança global. Quando desligado, o cron NÃO envia nenhuma mensagem em grupo (disparo manual com "Disparar agora" continua funcionando).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{killSwitch ? "Ligado" : "Parado"}</span>
            <Switch checked={killSwitch} disabled={killBusy} onCheckedChange={toggleKillSwitch} />
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-4 bg-primary/5 border-primary/40">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Envio único em massa</p>
              <p className="text-[11px] text-muted-foreground">Compose uma mensagem (com imagem opcional) e dispare AGORA para todos os grupos cadastrados. Preview obrigatório antes do envio.</p>
            </div>
          </div>
          <Button size="sm" onClick={openOneshot}>
            <Megaphone className="w-3.5 h-3.5 mr-1" /> Abrir envio único
          </Button>
        </div>
      </Card>

      <Card className="p-3 mb-4 bg-amber-500/5 border-amber-500/30">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Cole os IDs dos grupos no formato <code>12036xxxxxxxxx@g.us</code> (ou só a parte numérica). O cron roda a cada hora e dispara automaticamente no dia/horário configurado (horário de Brasília).
        </p>
      </Card>

      <div className="space-y-3">
        {rows.map((r) => {
          const m = merged(r);
          const dirty = !!draft[r.id];
          return (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{r.label}</h3>
                    <Badge variant="outline" className="text-[10px]">{WEEKDAYS[m.weekday]} · {String(m.hour_brt).padStart(2,"0")}h BRT</Badge>
                    {r.last_sent_at && (
                      <Badge variant="outline" className="text-[10px]">Último: {new Date(r.last_sent_at).toLocaleString("pt-BR")}</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{r.key}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-muted-foreground">Dia</label>
                      <Select value={String(m.weekday)} onValueChange={(v) => patch(r.id, { weekday: Number(v) })}>
                        <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WEEKDAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-muted-foreground">Hora BRT</label>
                      <Select value={String(m.hour_brt)} onValueChange={(v) => patch(r.id, { hour_brt: Number(v) })}>
                        <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-[260px]">
                          {Array.from({ length: 24 }).map((_, h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2,"0")}h</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{r.active ? "Ativa" : "Pausada"}</span>
                    <Switch checked={r.active} onCheckedChange={(v) => toggleActive(r, v)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => dispatchNow(r)} disabled={testing === r.id || (m.group_ids?.length ?? 0) === 0}>
                    {testing === r.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />} Disparar agora
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Mensagem</label>
                  <Textarea
                    rows={12}
                    value={m.message_body}
                    onChange={(e) => patch(r.id, { message_body: e.target.value })}
                    className="font-mono text-xs"
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={!!m.text_first} onCheckedChange={(v) => patch(r.id, { text_first: v })} />
                    Enviar texto sozinho primeiro, depois as imagens (sem caption)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Quando desmarcado: a 1ª imagem leva o texto como caption; demais imagens vão sem caption.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Artes ({m.image_urls?.length ?? 0})
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(m.image_urls || []).map((url, i) => (
                        <div key={url + i} className="relative group">
                          <img src={url} alt="" className="w-full h-24 object-cover rounded border border-border" />
                          <button
                            type="button"
                            onClick={() => patch(r.id, { image_urls: m.image_urls.filter((_, j) => j !== i) })}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded">{i+1}</span>
                        </div>
                      ))}
                    </div>
                    <Input
                      placeholder="Colar URL de nova arte e Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (v) {
                            patch(r.id, { image_urls: [...(m.image_urls || []), v] });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                      className="mt-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Grupos ({m.group_ids?.length ?? 0})
                    </label>
                    <div className="space-y-1 mt-2">
                      {(m.group_ids || []).map((g) => (
                        <div key={g} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                          <code className="flex-1 truncate font-mono">{g}</code>
                          <button onClick={() => removeGroup(r, g)} className="text-muted-foreground hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Input
                        placeholder="ID do grupo (ex: 12036xxx@g.us)"
                        value={newGroup[r.id] || ""}
                        onChange={(e) => setNewGroup((s) => ({ ...s, [r.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") addGroup(r); }}
                        className="text-xs"
                      />
                      <Button size="sm" variant="outline" onClick={() => addGroup(r)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => openPicker(r.id)}>
                      <Users className="w-3.5 h-3.5 mr-1" /> Escolher dos meus grupos
                    </Button>
                  </div>
                </div>
              </div>

              {dirty && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <Button size="sm" variant="ghost" onClick={() => setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; })}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => save(r)} disabled={saving === r.id}>
                    {saving === r.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Salvar alterações
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!pickerOpen} onOpenChange={(v) => !v && setPickerOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Meus grupos (Z-API)</span>
              <Button size="sm" variant="ghost" onClick={() => fetchGroups(true)} disabled={loadingGroups}>
                {loadingGroups ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Buscar grupo por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
          <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2 space-y-1">
            {loadingGroups && !groupsCache && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Loader2 className="w-4 h-4 mx-auto animate-spin mb-2" /> Buscando grupos na Z-API…
              </div>
            )}
            {groupsCache && groupsCache.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum grupo encontrado. A instância precisa estar conectada ao WhatsApp e participar de pelo menos 1 grupo.</p>
            )}
            {(groupsCache || [])
              .filter((g) => !search.trim() || g.name.toLowerCase().includes(search.toLowerCase()))
              .map((g) => {
                const row = pickerOpen ? rows.find((x) => x.id === pickerOpen) : null;
                const cur = row ? (draft[row.id]?.group_ids ?? row.group_ids) : [];
                const already = cur.includes(g.id) || cur.includes(`${g.id}@g.us`);
                return (
                  <button
                    key={g.id}
                    disabled={already}
                    onClick={() => {
                      if (!pickerOpen || !row) return;
                      patch(row.id, { group_ids: [...cur, g.id] });
                      toast({ title: "Grupo adicionado", description: g.name });
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded border text-left transition ${
                      already ? "border-emerald-500/40 bg-emerald-500/5 cursor-default" : "border-border hover:bg-accent/40"
                    }`}
                  >
                    {g.image ? (
                      <img src={g.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{g.id}</p>
                    </div>
                    {already && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                );
              })}
          </div>
          <p className="text-[10px] text-muted-foreground">Não esqueça de clicar em <b>Salvar alterações</b> depois de escolher.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={oneshotOpen} onOpenChange={(v) => { if (!oneshotSending) setOneshotOpen(v); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Envio único em massa — Grupos WhatsApp
            </DialogTitle>
          </DialogHeader>

          {!oneshotPreview ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Escolher mensagem pronta
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={oneshotTemplateId} onValueChange={applyOneshotTemplate}>
                    <SelectTrigger className="h-8 text-xs min-w-[220px] flex-1">
                      <SelectValue placeholder="Selecione um template…" />
                    </SelectTrigger>
                    <SelectContent>
                      {oneshotTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={updateCurrentTemplate} disabled={!oneshotTemplateId} title="Salvar edições no template selecionado">
                    <Save className="w-3.5 h-3.5 mr-1" /> Atualizar
                  </Button>
                  <Button size="sm" variant="outline" onClick={createTemplateFromCurrent} title="Salvar a mensagem/imagem atuais como um novo template">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Nova
                  </Button>
                  <Button size="sm" variant="ghost" onClick={deleteCurrentTemplate} disabled={!oneshotTemplateId} title="Excluir template selecionado">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Selecione uma mensagem existente para carregar, edite abaixo e clique em <b>Atualizar</b> — ou salve como <b>Nova</b> para criar um novo template.
                </p>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Mensagem</label>
                <Textarea rows={14} value={oneshotMessage} onChange={(e) => setOneshotMessage(e.target.value)} className="text-sm mt-1" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">URL da imagem (opcional)</label>
                <Input value={oneshotImage} onChange={(e) => setOneshotImage(e.target.value)} placeholder="https://…" className="mt-1 text-xs" />
                {oneshotImage && (
                  <img src={oneshotImage} alt="Prévia" className="mt-2 max-h-48 rounded border border-border object-contain bg-muted/30" />
                )}
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={oneshotTextFirst} onCheckedChange={setOneshotTextFirst} />
                Enviar texto sozinho primeiro e depois a imagem (sem legenda). Desmarcado: imagem já vai com a legenda.
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> Grupos ({oneshotSelected.size}/{oneshotGroups.length})
                  </label>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setOneshotSelected(new Set(oneshotGroups.map((g) => g.id)))}>Todos</Button>
                    <Button size="sm" variant="ghost" onClick={() => setOneshotSelected(new Set())}>Nenhum</Button>
                    <Button size="sm" variant="ghost" onClick={openOneshot} disabled={oneshotLoading}>
                      {oneshotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded p-2">
                  {oneshotLoading && <div className="text-center text-xs text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Carregando grupos…</div>}
                  {!oneshotLoading && oneshotGroups.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum grupo encontrado.</p>}
                  {oneshotGroups.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-xs px-2 py-1 hover:bg-muted/40 rounded cursor-pointer">
                      <input type="checkbox" checked={oneshotSelected.has(g.id)} onChange={() => toggleOneshotGroup(g.id)} />
                      <span className="flex-1 truncate">{g.name}</span>
                      <code className="text-[10px] text-muted-foreground truncate max-w-[140px]">{g.id}</code>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" onClick={() => setOneshotOpen(false)}>Cancelar</Button>
                <Button onClick={() => setOneshotPreview(true)} disabled={oneshotSelected.size === 0 || (!oneshotMessage.trim() && !oneshotImage)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Visualizar antes de enviar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Prévia de como a mensagem chegará no WhatsApp. Confira antes de disparar para <strong>{oneshotSelected.size}</strong> grupo(s).
              </p>
              <div className="rounded-lg p-4" style={{ background: "#0b141a" }}>
                <div className="max-w-sm mx-auto rounded-lg overflow-hidden shadow-xl" style={{ background: "#005c4b" }}>
                  {oneshotImage && (
                    <img src={oneshotImage} alt="" className="w-full max-h-80 object-cover" />
                  )}
                  {oneshotMessage && (
                    <div className="px-3 py-2 text-white text-[13px] whitespace-pre-wrap font-sans leading-snug">
                      {oneshotMessage}
                    </div>
                  )}
                  <div className="px-3 pb-2 text-[10px] text-white/60 text-right">agora ✓✓</div>
                </div>
                {oneshotImage && oneshotTextFirst && (
                  <p className="text-center text-[10px] text-white/60 mt-2">A imagem chegará em uma segunda mensagem, sem legenda.</p>
                )}
              </div>

              {oneshotResult && (
                <div className="rounded border border-border p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold mb-1">Resultado do disparo</p>
                  <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(oneshotResult, null, 2)}</pre>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" onClick={() => setOneshotPreview(false)} disabled={oneshotSending}>← Voltar e editar</Button>
                <Button onClick={dispatchOneshot} disabled={oneshotSending}>
                  {oneshotSending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                  Confirmar e enviar agora ({oneshotSelected.size})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}