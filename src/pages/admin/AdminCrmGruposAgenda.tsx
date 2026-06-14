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
    </DashboardLayout>
  );
}