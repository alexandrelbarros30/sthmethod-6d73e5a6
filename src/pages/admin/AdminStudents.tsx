import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminStudents = () => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [subForm, setSubForm] = useState({ plan_id: "", start_date: "", end_date: "", status: "active" });

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students-list"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles) return [];
      const { data: subs } = await supabase.from("subscriptions").select("*, plans(name)");
      return profiles.map((p) => {
        const sub = subs?.find((s) => s.user_id === p.user_id);
        return {
          ...p,
          plan: (sub as any)?.plans?.name || "—",
          subscription: sub || null,
          startDate: sub?.start_date || null,
          endDate: sub?.end_date || null,
          status: sub ? (sub.status === "active" && new Date(sub.end_date) > new Date() ? "active" : sub.status === "suspended" ? "suspended" : "expired") : "none",
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans-list"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").eq("active", true).order("duration_days");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "create", email: form.email, password: form.password, full_name: form.full_name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Update phone if provided
      if (form.phone && data?.user?.id) {
        await supabase.from("profiles").update({ phone: form.phone }).eq("user_id", data.user.id);
      }
    },
    onSuccess: () => {
      toast.success("Aluno criado com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
      setCreateOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "" });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar aluno"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("profiles").update({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      }).eq("user_id", selected.user_id);
    },
    onSuccess: () => {
      toast.success("Aluno atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
      setEditOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Aluno excluído!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir"),
  });

  const subMutation = useMutation({
    mutationFn: async () => {
      if (selected?.subscription) {
        await supabase.from("subscriptions").update({
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: subForm.status,
        }).eq("id", selected.subscription.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: selected.user_id,
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: subForm.status,
        });
      }
    },
    onSuccess: () => {
      toast.success("Assinatura atualizada!");
      qc.invalidateQueries({ queryKey: ["admin-students-list"] });
      setSubOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar assinatura"),
  });

  const openEdit = (s: any) => {
    setSelected(s);
    setForm({ full_name: s.full_name || "", email: s.email || "", password: "", phone: s.phone || "" });
    setEditOpen(true);
  };

  const openSub = (s: any) => {
    setSelected(s);
    const sub = s.subscription;
    const selectedPlan = plans?.find((p) => p.id === sub?.plan_id);
    setSubForm({
      plan_id: sub?.plan_id || plans?.[0]?.id || "",
      start_date: sub?.start_date || new Date().toISOString().split("T")[0],
      end_date: sub?.end_date || "",
      status: sub?.status || "active",
    });
    setSubOpen(true);
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const start = subForm.start_date || new Date().toISOString().split("T")[0];
    const end = plan ? new Date(new Date(start).getTime() + plan.duration_days * 86400000).toISOString().split("T")[0] : subForm.end_date;
    setSubForm({ ...subForm, plan_id: planId, end_date: end });
  };

  return (
    <DashboardLayout role="admin" title="Gestão de Alunos" subtitle="Crie, edite e gerencie todos os alunos.">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Alunos cadastrados</CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Criar Aluno</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Novo Aluno</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="font-body">Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div><Label className="font-body">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label className="font-body">Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
                  <div><Label className="font-body">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Aluno</TableHead>
                  <TableHead className="font-body">Plano</TableHead>
                  <TableHead className="font-body">Início</TableHead>
                  <TableHead className="font-body">Vencimento</TableHead>
                  <TableHead className="font-body">Status</TableHead>
                  <TableHead className="font-body text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{s.initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm font-body">{s.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground font-body">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm">{s.plan}</TableCell>
                    <TableCell className="font-body text-sm">
                      {s.startDate ? new Date(s.startDate).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      {s.endDate ? new Date(s.endDate).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "secondary" : s.status === "suspended" ? "outline" : "destructive"} className="text-xs">
                        {s.status === "active" ? "Ativo" : s.status === "suspended" ? "Suspenso" : s.status === "expired" ? "Vencido" : "Sem plano"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openSub(s)} title="Assinatura">
                          <CreditCard className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Excluir">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação é irreversível. Todos os dados de {s.full_name || "este aluno"} serão removidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(s.user_id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!students || students.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground font-body">
                      Nenhum aluno cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Editar Aluno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-body">Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label className="font-body">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="font-body">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Gerenciar Assinatura</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-body">{selected?.full_name}</p>
          <div className="space-y-3">
            <div>
              <Label className="font-body">Plano</Label>
              <Select value={subForm.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="font-body">Data de início</Label><Input type="date" value={subForm.start_date} onChange={(e) => setSubForm({ ...subForm, start_date: e.target.value })} /></div>
            <div><Label className="font-body">Data de vencimento</Label><Input type="date" value={subForm.end_date} onChange={(e) => setSubForm({ ...subForm, end_date: e.target.value })} /></div>
            <div>
              <Label className="font-body">Status</Label>
              <Select value={subForm.status} onValueChange={(v) => setSubForm({ ...subForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => subMutation.mutate()} disabled={subMutation.isPending}>
              {subMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStudents;
