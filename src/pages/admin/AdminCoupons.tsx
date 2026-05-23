import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Ticket, Copy, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emptyForm = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  max_uses: 10,
  expires_at: "",
  plan_ids: [] as string[],
  active: true,
};

const AdminCoupons = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*, plans(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans-for-coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("id, name").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error("Código obrigatório");
      const payload: any = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: Number(form.max_uses),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        plan_ids: form.plan_ids,
        plan_id: form.plan_ids.length === 1 ? form.plan_ids[0] : null,
        active: form.active,
      };
      if (editing) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cupom atualizado!" : "Cupom criado!");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar cupom"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupom excluído!");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: () => toast.error("Erro ao excluir cupom"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
      plan_ids: (coupon.plan_ids && coupon.plan_ids.length > 0)
        ? coupon.plan_ids
        : (coupon.plan_id ? [coupon.plan_id] : []),
      active: coupon.active,
    });
    setDialogOpen(true);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "STH";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code });
  };

  const isExpired = (c: any) => c.expires_at && new Date(c.expires_at) < new Date();
  const isUsedUp = (c: any) => c.current_uses >= c.max_uses;

  return (
    <DashboardLayout role="admin" title="Cupons de Desconto" subtitle="Crie e gerencie cupons promocionais.">
      <div className="mb-4">
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Novo Cupom</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
        {coupons?.map((coupon: any) => {
          const expired = isExpired(coupon);
          const usedUp = isUsedUp(coupon);
          const inactive = !coupon.active || expired || usedUp;
          return (
            <Card key={coupon.id} className={`relative ${inactive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg font-mono tracking-wider">{coupon.code}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    {!coupon.active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                    {expired && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                    {usedUp && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
                    {coupon.active && !expired && !usedUp && <Badge className="text-xs bg-primary/20 text-primary border-0">Ativo</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `R$ ${Number(coupon.discount_value).toFixed(2)} OFF`}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Usos: {coupon.current_uses} / {coupon.max_uses}</p>
                  {coupon.expires_at && (
                    <p>Expira: {new Date(coupon.expires_at).toLocaleDateString("pt-BR")} {new Date(coupon.expires_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  )}
                  <p>
                    Planos: {(() => {
                      const ids: string[] = coupon.plan_ids && coupon.plan_ids.length > 0
                        ? coupon.plan_ids
                        : (coupon.plan_id ? [coupon.plan_id] : []);
                      if (ids.length === 0) return "Todos";
                      const names = ids.map((id) => plans?.find((p: any) => p.id === id)?.name).filter(Boolean);
                      return names.length > 0 ? names.join(", ") : "Todos";
                    })()}
                  </p>
                </div>
                <div className="flex gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success("Código copiado!"); }}>
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm"><Trash2 className="w-3 h-3 mr-1 text-destructive" /> Excluir</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
                        <AlertDialogDescription>O cupom "{coupon.code}" será removido permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(coupon.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {coupons?.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum cupom criado ainda.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-body">Código do Cupom</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EX: STH20OFF" className="font-mono" />
                <Button variant="outline" size="sm" onClick={generateCode} type="button">Gerar</Button>
              </div>
            </div>
            <div>
              <Label className="font-body">Tipo de Desconto</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body">Valor do Desconto {form.discount_type === "percentage" ? "(%)" : "(R$)"}</Label>
              <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="font-body">Quantidade máxima de usos</Label>
              <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} min={1} />
            </div>
            <div>
              <Label className="font-body">Data de expiração (opcional)</Label>
              <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div>
              <Label className="font-body">Planos válidos</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione um ou mais planos. Deixe vazio para aplicar a todos.
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-md border p-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plan_ids: [] })}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-accent ${form.plan_ids.length === 0 ? "bg-accent" : ""}`}
                >
                  {form.plan_ids.length === 0 && <Check className="w-3.5 h-3.5 text-primary" />}
                  <span className={form.plan_ids.length === 0 ? "font-medium" : "text-muted-foreground"}>
                    Todos os planos
                  </span>
                </button>
                {plans?.map((p: any) => {
                  const checked = form.plan_ids.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setForm({
                            ...form,
                            plan_ids: v
                              ? [...form.plan_ids, p.id]
                              : form.plan_ids.filter((id) => id !== p.id),
                          });
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="font-body">Cupom ativo</Label>
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

export default AdminCoupons;
