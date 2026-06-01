import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, Loader2, Variable, Zap, MessageSquare, Stethoscope, Bot } from "lucide-react";
import { TEMPLATE_CATEGORIES, AVAILABLE_VARIABLES, renderTemplate } from "@/lib/crm-templates";
import { SYSTEM_TEMPLATE_DEFINITIONS, type SystemTemplateKey } from "@/lib/system-templates";

type Channel = "zapi" | "wapi" | "both";
type AutoChannel = "zapi" | "wapi";

// Default channel for each system automation key (matches NUTRI_CHANNEL_KEYS in system-templates.ts)
const NUTRI_DEFAULTS: SystemTemplateKey[] = [
  "payment_welcome", "diet_updated", "training_updated", "protocol_updated",
  "plan_updated", "content_all_ready", "lab_analysis_ready",
];
const defaultChannel = (k: SystemTemplateKey): AutoChannel =>
  NUTRI_DEFAULTS.includes(k) ? "wapi" : "zapi";

interface Template {
  id: string;
  key: string;
  name: string;
  category: string;
  channel: Channel;
  body: string;
  media_url: string | null;
  active: boolean;
  is_automatic: boolean;
  automation_trigger: string | null;
  variables: string[];
  description: string | null;
}

const EMPTY: Partial<Template> = {
  key: "",
  name: "",
  category: "outro",
  channel: "zapi",
  body: "",
  media_url: "",
  active: true,
  is_automatic: false,
  automation_trigger: "",
  variables: [],
  description: "",
};

const PREVIEW_CTX = {
  nome: "Carlos",
  plano: "Premium",
  vencimento: "15/06/2026",
  valor: "R$ 397,00",
  dias_restantes: 7,
  link_renovacao: "https://sthmethod.com.br/aluno/renovar",
  email: "aluno@exemplo.com",
  telefone: "(21) 99999-9999",
};

export default function AdminCrmTemplates() {
  const { user } = useAuth();
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [tab, setTab] = useState<"zapi" | "wapi">("zapi");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Template>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [autoMap, setAutoMap] = useState<Record<string, AutoChannel>>({});
  const [autoOpen, setAutoOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSaving, setAiSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data, error }, cfg, ai] = await Promise.all([
      supabase
      .from("crm_message_templates")
      .select("*")
      .order("category")
      .order("name"),
      supabase.from("crm_settings").select("value").eq("key", "auto_channel_map").maybeSingle(),
      supabase.from("crm_settings").select("value").eq("key", "ai_prompt_comercial").maybeSingle(),
    ]);
    if (error) toast({ title: "Erro ao carregar", description: error.message });
    setItems((data ?? []) as Template[]);
    setAutoMap(((cfg.data?.value || {}) as Record<string, AutoChannel>) || {});
    setAiPrompt((ai.data?.value as any)?.prompt || "");
    setLoading(false);
  }

  async function saveAiPrompt() {
    setAiSaving(true);
    const { error } = await supabase
      .from("crm_settings")
      .upsert(
        { key: "ai_prompt_comercial", value: { prompt: aiPrompt }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    setAiSaving(false);
    if (error) toast({ title: "Erro ao salvar prompt", description: error.message });
    else {
      toast({ title: "Prompt da IA salvo" });
      setAiOpen(false);
    }
  }

  async function saveAutoMap(next: Record<string, AutoChannel>) {
    setAutoMap(next);
    const { error } = await supabase
      .from("crm_settings")
      .upsert({ key: "auto_channel_map", value: next, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) toast({ title: "Erro ao salvar canal", description: error.message });
    else toast({ title: "Canal de automação atualizado" });
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing({ ...EMPTY });
    setOpen(true);
  }

  function openEdit(t: Template) {
    setEditing({ ...t, media_url: t.media_url || "" });
    setOpen(true);
  }

  async function save() {
    if (!editing.key?.trim() || !editing.name?.trim() || !editing.body?.trim()) {
      toast({ title: "Preencha chave, nome e mensagem" });
      return;
    }
    setSaving(true);
    const payload: any = {
      key: editing.key!.trim(),
      name: editing.name!.trim(),
      category: editing.category || "outro",
      channel: editing.channel || "zapi",
      body: editing.body!,
      media_url: editing.media_url?.trim() || null,
      active: !!editing.active,
      is_automatic: !!editing.is_automatic,
      automation_trigger: editing.is_automatic ? (editing.automation_trigger?.trim() || null) : null,
      variables: detectVars(editing.body || ""),
      description: editing.description?.trim() || null,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("crm_message_templates").update(payload).eq("id", editing.id));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("crm_message_templates").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message });
      return;
    }
    toast({ title: editing.id ? "Template atualizado" : "Template criado" });
    setOpen(false);
    load();
  }

  function askRemove(t: Template) {
    setDeleteTarget(t);
    setDeleteConfirm("");
  }

  async function confirmRemove() {
    if (!deleteTarget) return;
    if (deleteConfirm.trim().toUpperCase() !== "DELETAR") {
      toast({ title: "Confirmação inválida", description: "Digite DELETAR para confirmar." });
      return;
    }
    setDeleting(true);
    const { error } = await supabase
      .from("crm_message_templates")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro", description: error.message });
      return;
    }
    toast({ title: "Template excluído" });
    setDeleteTarget(null);
    setDeleteConfirm("");
    load();
  }

  async function duplicate(t: Template) {
    const { error } = await supabase.from("crm_message_templates").insert({
      key: `${t.key}_copia_${Date.now()}`,
      name: `${t.name} (cópia)`,
      category: t.category,
      channel: t.channel,
      body: t.body,
      media_url: t.media_url,
      active: false,
      is_automatic: false,
      automation_trigger: null,
      variables: t.variables,
      description: t.description,
      created_by: user?.id,
    });
    if (error) toast({ title: "Erro", description: error.message });
    else {
      toast({ title: "Template duplicado" });
      load();
    }
  }

  function insertVariable(v: string) {
    setEditing((e) => ({ ...e, body: (e.body || "") + ` {${v}}` }));
  }

  const byChannel = items.filter((i) => i.channel === tab || i.channel === "both");
  const filtered = filter === "all" ? byChannel : byChannel.filter((i) => i.category === filter);

  const channelMeta = {
    zapi: {
      label: "STH One — Comercial",
      desc: "Captação, planos, cadastro, conversão, renovação e recuperação. Linha: +55 21 99849-6289.",
      icon: MessageSquare,
      color: "text-emerald-400",
    },
    wapi: {
      label: "Fale com o Nutri",
      desc: "Atendimento de alunos ativos: dieta, treino, protocolo, exames, atualização de ciclo. Linha: +55 21 99898-4153.",
      icon: Stethoscope,
      color: "text-cyan-400",
    },
  } as const;
  const meta = channelMeta[tab];
  const Icon = meta.icon;

  return (
    <DashboardLayout role="admin" title="Templates de Mensagens" subtitle="Mensagens reutilizáveis (manuais e automáticas) com variáveis do banco">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="zapi" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> STH One
          </TabsTrigger>
          <TabsTrigger value="wapi" className="gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" /> Fale com o Nutri
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between mb-3">
        <div />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAiOpen(true)} className="gap-1.5">
            <Bot className="w-3.5 h-3.5 text-emerald-400" /> Prompt IA — Comercial
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAutoOpen(true)} className="gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Canais dos disparos automáticos
          </Button>
        </div>
      </div>

      <Card className="p-3 mb-4 flex items-start gap-3 bg-muted/30">
        <Icon className={`w-4 h-4 mt-0.5 ${meta.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{meta.label}</p>
          <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {byChannel.length} templates
        </Badge>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {TEMPLATE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => { setEditing({ ...EMPTY, channel: tab }); setOpen(true); }} size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum template neste canal.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label || t.category}</Badge>
                    {t.is_automatic && (
                      <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
                        <Zap className="w-2.5 h-2.5" /> Automática
                      </Badge>
                    )}
                    {!t.active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativa</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">chave: <code>{t.key}</code></p>
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line line-clamp-3">{t.body}</p>
                  {t.is_automatic && t.automation_trigger && (
                    <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/5 p-2">
                      <p className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Como dispara automaticamente
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.automation_trigger}</p>
                    </div>
                  )}
                  {t.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.variables.map((v) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"><code>{`{${v}}`}</code></span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(t)}><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => askRemove(t)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Chave (identificador único)</Label>
                <Input value={editing.key || ""} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="ex: cobranca_vencido" />
              </div>
              <div>
                <Label className="text-xs">Nome amigável</Label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="ex: Cobrança vencido" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Canal</Label>
                <Select value={editing.channel || "zapi"} onValueChange={(v) => setEditing({ ...editing, channel: v as Channel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zapi">STH One — Comercial (Z-API)</SelectItem>
                    <SelectItem value="wapi">Fale com o Nutri (W-API)</SelectItem>
                    <SelectItem value="both">Ambos os canais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={editing.category || "outro"} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea rows={6} value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="Use {nome}, {plano}, etc." />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Variable className="w-3 h-3" /> Inserir variável</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Button key={v.key} type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => insertVariable(v.key)} title={v.desc}>
                    {`{${v.key}}`}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">URL de mídia (opcional)</Label>
              <Input value={editing.media_url || ""} onChange={(e) => setEditing({ ...editing, media_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">Descrição interna</Label>
              <Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.active} onCheckedChange={(c) => setEditing({ ...editing, active: c })} />
                <Label className="text-xs">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.is_automatic} onCheckedChange={(c) => setEditing({ ...editing, is_automatic: c })} />
                <Label className="text-xs flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Disparo automático</Label>
              </div>
            </div>
            {editing.is_automatic && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                <Label className="text-xs flex items-center gap-1 text-amber-600">
                  <Zap className="w-3 h-3" /> Como esta mensagem dispara automaticamente
                </Label>
                <Textarea
                  rows={2}
                  value={editing.automation_trigger || ""}
                  onChange={(e) => setEditing({ ...editing, automation_trigger: e.target.value })}
                  placeholder="ex: Disparado 3 dias antes do vencimento do plano para todos os alunos ativos."
                  className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">
                  Descreva quando e para quem o sistema envia. Esta descrição aparece no card do template e na auditoria de envios automáticos.
                </p>
              </div>
            )}
            {editing.body && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Pré-visualização (dados de exemplo)</p>
                <p className="text-xs whitespace-pre-line">{renderTemplate(editing.body, PREVIEW_CTX)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={autoOpen} onOpenChange={setAutoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Canal de cada disparo automático
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">
            Escolha por qual linha cada mensagem automática do sistema será enviada. Use <b>Fale com o Nutri</b> para
            comunicação de aluno ativo (dieta, treino, protocolo, exames) e <b>STH One</b> para comercial
            (cobrança, renovação, recuperação).
          </p>
          <div className="space-y-2">
            {SYSTEM_TEMPLATE_DEFINITIONS.map((def) => {
              const current = autoMap[def.key] || defaultChannel(def.key);
              return (
                <div key={def.key} className="flex items-center gap-3 p-2.5 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{def.description}</p>
                    <code className="text-[10px] text-muted-foreground/70">{def.key}</code>
                  </div>
                  <Select
                    value={current}
                    onValueChange={(v) => saveAutoMap({ ...autoMap, [def.key]: v as AutoChannel })}
                  >
                    <SelectTrigger className="w-52 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zapi">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-emerald-400" /> STH One — Comercial
                        </span>
                      </SelectItem>
                      <SelectItem value="wapi">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3 h-3 text-cyan-400" /> Fale com o Nutri
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirm(""); } }}>
        {/* placeholder anchor */}
      </AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-500">Excluir template permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <b>{deleteTarget?.name}</b> (<code>{deleteTarget?.key}</code>).
              Esta ação é <b>irreversível</b>. Para confirmar, digite <b>DELETAR</b> abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Digite DELETAR para confirmar"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRemove(); }}
              disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETAR"}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function detectVars(body: string): string[] {
  const set = new Set<string>();
  const re = /\{([a-z0-9_]+)\}/gi;
  let m;
  while ((m = re.exec(body))) set.add(m[1].toLowerCase());
  return Array.from(set);
}