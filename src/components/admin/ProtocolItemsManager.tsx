import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, FlaskConical, Heart, Zap, Pill, GripVertical, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "endocrino", label: "Endócrino Hormonal", icon: FlaskConical, color: "text-violet-500" },
  { key: "cardiovascular", label: "Cardiovascular / Hepático / Renal", icon: Heart, color: "text-rose-500" },
  { key: "metabolico", label: "Metabólico e Performance", icon: Zap, color: "text-emerald-500" },
];

interface Props {
  userId: string;
  studentName: string;
}

const ProtocolItemsManager = ({ userId, studentName }: Props) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "endocrino", dosage: "", frequency: "", notes: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["protocol-items", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", userId)
        .order("category")
        .order("sort_order");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Nome obrigatório");
      const catItems = items.filter((i: any) => i.category === form.category);
      const payload = {
        user_id: userId,
        name: form.name.trim(),
        category: form.category,
        dosage: form.dosage.trim(),
        frequency: form.frequency.trim(),
        notes: form.notes.trim() || null,
        sort_order: editingId ? undefined : catItems.length,
      };

      if (editingId) {
        const { sort_order, ...updatePayload } = payload;
        await supabase.from("protocols").update(updatePayload).eq("id", editingId);
      } else {
        await supabase.from("protocols").insert(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Item atualizado!" : "Item adicionado!");
      qc.invalidateQueries({ queryKey: ["protocol-items", userId] });
      resetForm();
    },
    onError: (e) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("protocols").delete().eq("id", id);
    },
    onSuccess: () => {
      toast.success("Item removido!");
      qc.invalidateQueries({ queryKey: ["protocol-items", userId] });
    },
  });

  const resetForm = () => {
    setForm({ name: "", category: "endocrino", dosage: "", frequency: "", notes: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (item: any) => {
    setForm({
      name: item.name,
      category: item.category,
      dosage: item.dosage || "",
      frequency: item.frequency || "",
      notes: item.notes || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i: any) => i.category === cat.key),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
          <Pill className="w-4 h-4" /> Medicamentos & Suplementos
        </h3>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-body">Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Vitamina D3"
                />
              </div>
              <div>
                <Label className="text-xs font-body">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-body">Dosagem</Label>
                <Input
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="Ex: 5000 UI"
                />
              </div>
              <div>
                <Label className="text-xs font-body">Frequência</Label>
                <Input
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  placeholder="Ex: 1x ao dia"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-body">Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Tomar pela manhã com gordura..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Check className="w-3 h-3 mr-1" /> {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped list */}
      {grouped.map((cat) => {
        const CatIcon = cat.icon;
        if (cat.items.length === 0) return null;
        return (
          <div key={cat.key} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CatIcon className={`w-4 h-4 ${cat.color}`} />
              <span className="text-xs font-semibold font-display text-foreground">{cat.label}</span>
              <Badge variant="outline" className="text-[10px]">{cat.items.length}</Badge>
            </div>
            {cat.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                <Pill className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{item.name}</span>
                  {item.dosage && <span className="text-muted-foreground ml-1.5">• {item.dosage}</span>}
                  {item.frequency && <span className="text-muted-foreground ml-1.5">• {item.frequency}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(item)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {items.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-4 font-body">
          Nenhum medicamento ou suplemento adicionado ainda.
        </p>
      )}
    </div>
  );
};

export default ProtocolItemsManager;
