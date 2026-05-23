import { useState } from "react";
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
import { toast } from "sonner";
import { Plus, Filter, Trash2, Pencil } from "lucide-react";

interface SegmentFilters {
  status?: string;
  gender?: string;
  objective?: string;
  min_days_expire?: number | null;
  max_days_expire?: number | null;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  filters: SegmentFilters;
  scope: string;
  created_at: string;
}

const PRESETS = [
  { name: "Alunos ativos", filters: { status: "active" } },
  { name: "Vencimento próximo (7d)", filters: { status: "expiring" } },
  { name: "Vencidos", filters: { status: "expired" } },
  { name: "Inativos +30 dias", filters: { status: "inactive" } },
  { name: "Leads qualificados", filters: { status: "lead" } },
  { name: "Visitantes de ferramentas", filters: { status: "tool_user" } },
  { name: "Foco emagrecimento", filters: { objective: "emagrecimento" } },
];

export default function CRMSegments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; filters: SegmentFilters }>({
    name: "",
    description: "",
    filters: { status: "active" },
  });

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["crm-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_segments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Segment[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", filters: { status: "active" } });
    setOpen(true);
  };
  const openEdit = (s: Segment) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", filters: s.filters || {} });
    setOpen(true);
  };
  const applyPreset = (preset: typeof PRESETS[number]) => {
    setForm({ name: preset.name, description: "", filters: preset.filters });
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Dê um nome ao segmento"); return; }
    if (!user?.id) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      filters: form.filters as any,
      created_by: user.id,
    };
    const { error } = editing
      ? await supabase.from("crm_segments").update(payload).eq("id", editing.id)
      : await supabase.from("crm_segments").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Segmento atualizado" : "Segmento criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-segments"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este segmento?")) return;
    const { error } = await supabase.from("crm_segments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Segmento removido");
    qc.invalidateQueries({ queryKey: ["crm-segments"] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Segmentações</h2>
          <p className="text-xs text-muted-foreground">Salve públicos reutilizáveis para campanhas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
              <Plus className="h-4 w-4" /> Novo segmento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar segmento" : "Novo segmento"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <Button key={p.name} size="sm" variant="outline" type="button"
                    className="h-7 text-xs" onClick={() => applyPreset(p)}>
                    {p.name}
                  </Button>
                ))}
              </div>
              <Input placeholder="Nome do segmento" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Descrição (opcional)" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={form.filters.status || "all"}
                    onValueChange={(v) => setForm({ ...form, filters: { ...form.filters, status: v === "all" ? undefined : v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="expiring">Vencendo</SelectItem>
                      <SelectItem value="expired">Vencidos</SelectItem>
                      <SelectItem value="inactive">Inativos (vencidos +30d)</SelectItem>
                      <SelectItem value="lead">Leads qualificados</SelectItem>
                      <SelectItem value="tool_user">Visitantes de ferramentas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Sexo</label>
                  <Select value={form.filters.gender || "all"}
                    onValueChange={(v) => setForm({ ...form, filters: { ...form.filters, gender: v === "all" ? undefined : v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input placeholder="Objetivo (ex: emagrecimento)" value={form.filters.objective || ""}
                onChange={(e) => setForm({ ...form, filters: { ...form.filters, objective: e.target.value || undefined } })} />
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
      ) : segments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Filter className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum segmento criado ainda.</p>
            <Button size="sm" onClick={openNew} className="mt-2 bg-emerald-500 text-black hover:bg-emerald-400">
              Criar primeiro segmento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {segments.map((s) => (
            <Card key={s.id} className="border-border/40 transition hover:border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(s.filters || {}).map(([k, v]) =>
                        v != null && v !== "" ? (
                          <Badge key={k} variant="outline" className="text-[10px]">{k}: {String(v)}</Badge>
                        ) : null,
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => remove(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}