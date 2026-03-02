import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emptyForm = { name: "", subtitle: "", price: "", duration: "", duration_days: 30, benefits: "", active: true, discount_type: "none", discount_value: 0 };

const AdminPlans = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("duration_days");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        subtitle: form.subtitle,
        price: form.price,
        duration: form.duration,
        duration_days: Number(form.duration_days),
        benefits: form.benefits.split("\n").filter(Boolean),
        active: form.active,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
      };
      if (editing) {
        await supabase.from("plans").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("plans").insert(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Plano atualizado!" : "Plano criado!");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar plano"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("plans").delete().eq("id", id);
    },
    onSuccess: () => {
      toast.success("Plano excluído!");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: () => toast.error("Erro ao excluir (pode ter assinaturas vinculadas)"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      subtitle: plan.subtitle || "",
      price: plan.price,
      duration: plan.duration,
      duration_days: plan.duration_days,
      benefits: (plan.benefits || []).join("\n"),
      active: plan.active,
      discount_type: plan.discount_type || "none",
      discount_value: plan.discount_value || 0,
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout role="admin" title="Gestão de Planos" subtitle="Configure e gerencie os planos oferecidos.">
      <div className="mb-4">
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Novo Plano</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {plans?.map((plan, i) => (
          <Card key={plan.id} className={`animate-fade-in relative ${!plan.active ? "opacity-60" : ""}`} style={{ animationDelay: `${i * 100}ms` }}>
            {!plan.active && (
              <div className="absolute top-2 right-2"><Badge variant="outline" className="text-xs">Inativo</Badge></div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
              {(plan as any).subtitle && <p className="text-xs text-muted-foreground font-body">{(plan as any).subtitle}</p>}
              <p className="text-2xl font-bold text-foreground mt-2 font-body">{plan.price}</p>
              <p className="text-xs text-muted-foreground font-body">{plan.duration}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.benefits?.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm font-body">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1 justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm"><Trash2 className="w-3 h-3 mr-1 text-destructive" /> Excluir</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                      <AlertDialogDescription>O plano "{plan.name}" será removido permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(plan.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-body">Título</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="font-body">Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div><Label className="font-body">Valor (R$)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="R$ 99,90" /></div>
            <div><Label className="font-body">Duração (texto)</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="30 dias" /></div>
            <div><Label className="font-body">Duração (dias)</Label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} /></div>
            <div><Label className="font-body">Características (uma por linha, máx 7)</Label><Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={5} placeholder="Acesso ao treino&#10;Dieta personalizada&#10;..." /></div>
            <div>
              <Label className="font-body">Tipo de Desconto</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem desconto</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.discount_type !== "none" && (
              <div><Label className="font-body">Valor do Desconto {form.discount_type === "percentage" ? "(%)" : "(R$)"}</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="font-body">Plano ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPlans;
