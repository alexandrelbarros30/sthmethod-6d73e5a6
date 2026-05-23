import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Copy, MessageSquare } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "comercial", label: "Comercial" },
  { id: "relacionamento", label: "Relacionamento" },
  { id: "estrategico", label: "Estratégico" },
  { id: "conteudo", label: "Conteúdo" },
] as const;

const VARIABLES = ["{nome}", "{plano}", "{dias_vencido}", "{cupom}", "{link}", "{objetivo}"];

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string | null;
  preview_text: string | null;
  is_active: boolean;
  variables: string[] | null;
  created_at: string;
}

const renderPreview = (text: string) => {
  return text
    .replace(/{nome}/g, "João")
    .replace(/{plano}/g, "Premium")
    .replace(/{dias_vencido}/g, "3")
    .replace(/{cupom}/g, "STH20")
    .replace(/{link}/g, "sthmethod.com.br")
    .replace(/{objetivo}/g, "hipertrofia");
};

export default function CRMTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ title: "", category: "comercial", subcategory: "", content: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Template[];
    },
  });

  const filtered = useMemo(
    () => templates.filter((t) => category === "all" || t.category === category),
    [templates, category],
  );

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", category: "comercial", subcategory: "", content: "" });
    setOpen(true);
  };
  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ title: t.title, category: t.category, subcategory: t.subcategory || "", content: t.content });
    setOpen(true);
  };

  const insertVar = (v: string) => setForm((f) => ({ ...f, content: f.content + " " + v }));

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    if (!user?.id) return;
    const variables = VARIABLES.filter((v) => form.content.includes(v));
    const payload = {
      title: form.title.trim(),
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      content: form.content,
      variables,
      created_by: user.id,
      preview_text: renderPreview(form.content).slice(0, 120),
    };
    const { error } = editing
      ? await supabase.from("crm_templates").update(payload).eq("id", editing.id)
      : await supabase.from("crm_templates").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Template atualizado" : "Template criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-templates"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir template?")) return;
    const { error } = await supabase.from("crm_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["crm-templates"] });
  };

  const copyContent = (t: Template) => {
    navigator.clipboard.writeText(t.content);
    toast.success("Conteúdo copiado");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {CATEGORIES.map((c) => <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Novo template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar template" : "Novo template"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                <Input placeholder="Título" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.id !== "all").map((c) =>
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Subcategoria" value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
                </div>
                <Textarea rows={9} placeholder="Olá {nome}, ..."
                  value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map((v) => (
                    <Button key={v} size="sm" variant="outline" type="button"
                      className="h-6 text-[10px]" onClick={() => insertVar(v)}>{v}</Button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <MessageSquare className="h-3.5 w-3.5" /> Preview WhatsApp
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-sm whitespace-pre-wrap break-words min-h-[200px]">
                  {renderPreview(form.content) || <span className="text-muted-foreground">Sua mensagem aparece aqui...</span>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-emerald-500 text-black hover:bg-emerald-400">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum template nesta categoria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <Card key={t.id} className="border-border/40 transition hover:border-emerald-500/30">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{t.category}</Badge>
                      {t.subcategory && <Badge variant="outline" className="text-[10px]">{t.subcategory}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyContent(t)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => remove(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.content}</p>
                {(t.variables?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.variables!.map((v) => <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}