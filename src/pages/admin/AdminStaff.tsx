import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, ShieldCheck, UserCog, Shield, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeSearch } from "@/lib/utils";

type StaffRole = "admin" | "consultor" | "assistente" | "financeiro";

const staffRoleConfig: Record<StaffRole, { label: string; color: string; icon: typeof Shield; desc: string }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldCheck, desc: "Acesso total ao sistema" },
  consultor: { label: "Consultor", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ShieldCheck, desc: "Gerencia dieta/treino dos alunos vinculados" },
  assistente: { label: "Assistente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: UserCog, desc: "Cadastro de alunos e suporte" },
  financeiro: { label: "Financeiro", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Shield, desc: "Gestão de pagamentos e planos" },
};

const emptyForm = { full_name: "", email: "", password: "", phone: "", role: "consultor" as StaffRole };

const AdminStaff = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; name: string } | null>(null);
  const [passwordReset, setPasswordReset] = useState<{ userId: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const staffRoles: StaffRole[] = ["admin", "consultor", "assistente", "financeiro"];

  const { data: staffUsers, isLoading } = useQuery({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", staffRoles);
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, created_at").in("user_id", ids);
      return (profiles || []).map((p) => {
        const roleEntry = roles.find((r) => r.user_id === p.user_id);
        return {
          ...p,
          role: roleEntry?.role as StaffRole,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  // Consultant student counts
  const { data: consultantCounts } = useQuery({
    queryKey: ["admin-consultant-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("consultant_students").select("consultant_id");
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.consultant_id] = (counts[r.consultant_id] || 0) + 1; });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      if (!form.email.trim()) throw new Error("Email é obrigatório");
      if (form.password.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres");

      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "create", email: form.email, password: form.password, full_name: form.full_name, role: form.role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Update profile phone if provided
      if (form.phone && data?.user?.id) {
        await supabase.from("profiles").update({ phone: form.phone }).eq("user_id", data.user.id);
      }
    },
    onSuccess: () => {
      toast.success("Membro da equipe criado!");
      qc.invalidateQueries({ queryKey: ["admin-staff-list"] });
      qc.invalidateQueries({ queryKey: ["admin-roles-users"] });
      setCreateOpen(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !form.full_name.trim()) throw new Error("Nome é obrigatório");
      // Update profile
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      }).eq("user_id", selectedUserId);
      if (profileErr) throw profileErr;
      // Update role
      const { error: roleErr } = await supabase.from("user_roles").update({ role: form.role }).eq("user_id", selectedUserId);
      if (roleErr) throw roleErr;
    },
    onSuccess: () => {
      toast.success("Dados atualizados!");
      qc.invalidateQueries({ queryKey: ["admin-staff-list"] });
      qc.invalidateQueries({ queryKey: ["admin-roles-users"] });
      setEditOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar"),
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
      toast.success("Membro removido!");
      qc.invalidateQueries({ queryKey: ["admin-staff-list"] });
      qc.invalidateQueries({ queryKey: ["admin-roles-users"] });
      setDeleteConfirm(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!passwordReset || newPassword.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres");
      const { data, error } = await supabase.functions.invoke("admin-manage-students", {
        body: { action: "reset_password", user_id: passwordReset.userId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordReset(null);
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao alterar senha"),
  });

  const filtered = staffUsers?.filter((u) => {
    const q = normalizeSearch(searchTerm);
    const matchSearch = !q || normalizeSearch(u.full_name).includes(q) || normalizeSearch(u.email).includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = staffUsers?.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>) || {};

  const openEdit = (user: any) => {
    setSelectedUserId(user.user_id);
    setForm({ full_name: user.full_name || "", email: user.email || "", password: "", phone: user.phone || "", role: user.role });
    setEditOpen(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const renderFormFields = (isCreate: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-body">Nome completo *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-body">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" required />
        </div>
      </div>
      {isCreate && (
        <div className="space-y-2">
          <Label className="font-body">Senha *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type={showCreatePassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10" minLength={6} required />
            <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label className="font-body">Telefone</Label>
        <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label className="font-body">Cargo *</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as StaffRole })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {staffRoles.map((r) => (
              <SelectItem key={r} value={r}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={staffRoleConfig[r].color + " text-xs"}>{staffRoleConfig[r].label}</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{staffRoleConfig[form.role].desc}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="admin" title="Equipe" subtitle="Gerencie consultores, assistentes e financeiros">
      <div className="space-y-6">
        {/* Role summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {staffRoles.map((role) => {
            const config = staffRoleConfig[role];
            const Icon = config.icon;
            return (
              <Card key={role} className={`cursor-pointer transition-all ${filterRole === role ? "ring-2 ring-primary" : "hover:bg-accent/50"}`} onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{roleCounts[role] || 0}</p>
                    <p className="text-xs text-muted-foreground">{config.label}(s)</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <CardTitle className="font-display">Equipe</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => { setForm({ ...emptyForm }); setCreateOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Novo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8 font-body">Carregando...</p>
            ) : !filtered?.length ? (
              <div className="text-center py-12">
                <UserCog className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-body">Nenhum membro da equipe encontrado</p>
                <Button variant="outline" className="mt-3" onClick={() => { setForm({ ...emptyForm }); setCreateOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar primeiro membro
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Info</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((user) => {
                      const config = staffRoleConfig[user.role];
                      const studentCount = consultantCounts?.[user.user_id] || 0;
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{user.initials}</div>
                              <span className="font-medium text-foreground">{user.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className={config.color}>{config.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {user.role === "consultor" && <span>{studentCount} aluno(s)</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" title="Alterar senha" onClick={() => { setPasswordReset({ userId: user.user_id, name: user.full_name || user.email }); setNewPassword(""); }}><Lock className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ userId: user.user_id, name: user.full_name || user.email })}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo membro da equipe</DialogTitle></DialogHeader>
          {renderFormFields(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar membro</DialogTitle></DialogHeader>
          {renderFormFields(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm?.name}</strong>? Esta ação é irreversível e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteConfirm) deleteMutation.mutate(deleteConfirm.userId); }} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password reset dialog */}
      <Dialog open={!!passwordReset} onOpenChange={(open) => { if (!open) { setPasswordReset(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Definir nova senha para <strong>{passwordReset?.name}</strong></p>
          <div className="space-y-2">
            <Label>Nova senha *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showResetPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10" minLength={6} />
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordReset(null); setNewPassword(""); }}>Cancelar</Button>
            <Button onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending || newPassword.length < 6}>
              {resetPasswordMutation.isPending ? "Alterando..." : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStaff;
