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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, Loader2, Variable } from "lucide-react";
import { TEMPLATE_CATEGORIES, AVAILABLE_VARIABLES, renderTemplate } from "@/lib/crm-templates";

interface Template {
  id: string;
  key: string;
  name: string;
  category: string;
  body: string;
  media_url: string | null;
  active: boolean;
  is_automatic: boolean;
  variables: string[];
  description: string | null;
}

const EMPTY: Partial<Template> = {
  key: "",
  name: "",
  category: "outro",
  body: "",
  media_url: "",
  active: true,
  is_automatic: false,
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Template>>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_message_templates")
      .select("*")
      .order("category")
      .order("name");
    if (error) toast({ title: "Erro ao carregar", description: error.message });
    setItems((data ?? []) as Template[]);
    setLoading(false);
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
      body: editing.body!,
      media_url: editing.media_url?.trim() || null,
      active: !!editing.active,
      is_automatic: !!editing.is_automatic,
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

  async function remove(id: string) {
    if (!confirm("Excluir este template?")) return;
    const { error } = await supabase.from("crm_message_templates").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message });
    else load();
  }

  async function duplicate(t: Template) {
    const { error } = await supabase.from("crm_message_templates").insert({
      key: `${t.key}_copia_${Date.now()}`,
      name: `${t.name} (cópia)`,
      category: t.category,
      body: t.body,
      media_url: t.media_url,
      active: false,
      is_automatic: false,
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

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <DashboardLayout role="admin" title="Templates de Mensagens" subtitle="Mensagens reutilizáveis (manuais e automáticas) com variáveis do banco">
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
        <Button onClick={openNew} size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Novo template</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum template.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <Badge variant="outline" className="text-[10px]">{TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label || t.category}</Badge>
                    {t.is_automatic && <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">Automática</Badge>}
                    {!t.active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativa</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">chave: <code>{t.key}</code></p>
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line line-clamp-3">{t.body}</p>
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
                  <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
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
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={editing.category || "outro"} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
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
                <Label className="text-xs">Usado em automações</Label>
              </div>
            </div>
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