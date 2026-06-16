import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, ShieldCheck, ShieldAlert, Users, UserCog, Link2, Plus, X, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "admin_viewer" | "consultor" | "assistente" | "financeiro" | "student";

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldAlert },
  admin_viewer: { label: "Admin (Visualização)", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Shield },
  consultor: { label: "Consultor", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ShieldCheck },
  assistente: { label: "Assistente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: UserCog },
  financeiro: { label: "Financeiro", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Shield },
  student: { label: "Aluno", color: "bg-muted text-muted-foreground border-border", icon: Users },
};

// ─── Roles Tab ───
type SubStatus = "active" | "expired" | "suspended" | "none";

const subStatusConfig: Record<SubStatus, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  expired: { label: "Vencido", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  suspended: { label: "Suspenso", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  none: { label: "Sem plano", color: "bg-muted text-muted-foreground border-border" },
};

const RolesTab = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; name: string; currentRole: AppRole; newRole: AppRole } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-roles-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, avatar_url, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("subscriptions").select("user_id, status, end_date, plans(name)"),
      ]);
      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const subs = subsRes.data || [];
      return profiles.map((p) => {
        const roleEntry = roles.find((r) => r.user_id === p.user_id);
        const sub = subs.find((s) => s.user_id === p.user_id);
        let subStatus: SubStatus = "none";
        if (sub) {
          if (sub.status === "suspended") subStatus = "suspended";
          else if (sub.status === "active" && new Date(sub.end_date) > new Date()) subStatus = "active";
          else subStatus = "expired";
        }
        return {
          ...p,
          role: (roleEntry?.role || "student") as AppRole,
          subStatus,
          planName: (sub as any)?.plans?.name || null,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role atualizada com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-roles-users"] });
      setConfirmDialog(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar role"),
  });

  const filtered = users?.filter((u) => {
    const matchSearch = !searchTerm.trim() || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || u.subStatus === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const roleCounts = users?.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <Card key={role} className={`cursor-pointer transition-all ${filterRole === role ? "ring-2 ring-primary" : "hover:bg-accent/50"}`} onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}><Icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{roleCounts[role] || 0}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle className="font-display">Usuários</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status assinatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {(Object.entries(subStatusConfig) as [SubStatus, { label: string }][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8 font-body">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Role Atual</TableHead>
                    <TableHead>Alterar Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((user) => {
                    const config = roleConfig[user.role] ?? roleConfig.student;
                    const statusCfg = subStatusConfig[user.subStatus] ?? subStatusConfig.none;
                    return (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{user.initials}</div>
                            <span className="font-medium text-foreground">{user.full_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                            {user.planName && <span className="text-xs text-muted-foreground">{user.planName}</span>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={config.color}>{config.label}</Badge></TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(newRole: string) => { if (newRole !== user.role) setConfirmDialog({ userId: user.user_id, name: user.full_name || user.email, currentRole: user.role, newRole: newRole as AppRole }); }}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, c]) => (
                                <SelectItem key={role} value={role}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de permissão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar a role de <strong>{confirmDialog?.name}</strong> de{" "}
              <Badge variant="outline" className={confirmDialog ? roleConfig[confirmDialog.currentRole].color : ""}>{confirmDialog ? roleConfig[confirmDialog.currentRole].label : ""}</Badge>{" "}
              para{" "}
              <Badge variant="outline" className={confirmDialog ? roleConfig[confirmDialog.newRole].color : ""}>{confirmDialog ? roleConfig[confirmDialog.newRole].label : ""}</Badge>?
              Esta ação altera imediatamente o nível de acesso do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDialog) updateRoleMutation.mutate({ userId: confirmDialog.userId, newRole: confirmDialog.newRole }); }} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Consultant-Student Linking Tab ───
const ConsultantLinksTab = () => {
  const qc = useQueryClient();
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ consultantId: string; studentId: string; studentName: string } | null>(null);

  // Fetch consultants
  const { data: consultants } = useQuery({
    queryKey: ["admin-consultants"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "consultor");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      return profiles || [];
    },
  });

  // Fetch links for selected consultant
  const { data: linkedStudents, isLoading: loadingLinks } = useQuery({
    queryKey: ["admin-consultant-links", selectedConsultant],
    queryFn: async () => {
      const { data: links } = await supabase.from("consultant_students").select("id, student_id").eq("consultant_id", selectedConsultant);
      if (!links?.length) return [];
      const studentIds = links.map((l) => l.student_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", studentIds);
      return links.map((l) => {
        const profile = profiles?.find((p) => p.user_id === l.student_id);
        return { linkId: l.id, studentId: l.student_id, name: profile?.full_name || "—", email: profile?.email || "", phone: profile?.phone || "" };
      });
    },
    enabled: !!selectedConsultant,
  });

  // Fetch all students for linking dialog
  const { data: allStudents } = useQuery({
    queryKey: ["admin-all-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      return profiles || [];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const rows = studentIds.map((sid) => ({ consultant_id: selectedConsultant, student_id: sid }));
      const { error } = await supabase.from("consultant_students").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alunos vinculados com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-consultant-links", selectedConsultant] });
      setLinkDialogOpen(false);
      setSelectedStudentIds(new Set());
      setStudentSearch("");
    },
    onError: (e: any) => toast.error(e.message?.includes("duplicate") ? "Alguns alunos já estão vinculados" : e.message || "Erro ao vincular"),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("consultant_students").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo removido!");
      qc.invalidateQueries({ queryKey: ["admin-consultant-links", selectedConsultant] });
      setUnlinkConfirm(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao desvincular"),
  });

  const alreadyLinkedIds = new Set(linkedStudents?.map((l) => l.studentId) || []);
  const availableStudents = allStudents?.filter((s) => !alreadyLinkedIds.has(s.user_id)) || [];
  const filteredAvailable = availableStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return s.full_name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term);
  });

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle className="font-display">Vínculos Consultor → Alunos</CardTitle>
            <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Selecione um consultor..." />
              </SelectTrigger>
              <SelectContent>
                {consultants?.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || c.email}</SelectItem>
                ))}
                {!consultants?.length && <SelectItem value="none" disabled>Nenhum consultor cadastrado</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedConsultant ? (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-body">Selecione um consultor para gerenciar seus alunos vinculados</p>
            </div>
          ) : loadingLinks ? (
            <p className="text-muted-foreground text-center py-8 font-body">Carregando...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground font-body">
                  {linkedStudents?.length || 0} aluno(s) vinculado(s)
                </p>
                <Button size="sm" onClick={() => { setLinkDialogOpen(true); setSelectedStudentIds(new Set()); setStudentSearch(""); }}>
                  <Plus className="w-4 h-4 mr-1" /> Vincular Alunos
                </Button>
              </div>

              {linkedStudents?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="w-[80px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedStudents.map((ls) => (
                        <TableRow key={ls.linkId}>
                          <TableCell className="font-medium text-foreground">{ls.name}</TableCell>
                          <TableCell className="text-muted-foreground">{ls.email}</TableCell>
                          <TableCell className="text-muted-foreground">{ls.phone || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUnlinkConfirm({ consultantId: selectedConsultant, studentId: ls.studentId, studentName: ls.name })}>
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground font-body text-sm">Nenhum aluno vinculado a este consultor</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Link students dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Alunos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-10" />
            </div>
            <ScrollArea className="h-[300px] border rounded-lg">
              {filteredAvailable.length ? (
                <div className="p-2 space-y-1">
                  {filteredAvailable.map((s) => (
                    <label key={s.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                      <Checkbox checked={selectedStudentIds.has(s.user_id)} onCheckedChange={() => toggleStudent(s.user_id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground break-words">{s.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground break-words">{s.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">Nenhum aluno disponível</p>
              )}
            </ScrollArea>
            {selectedStudentIds.size > 0 && (
              <p className="text-sm text-muted-foreground">{selectedStudentIds.size} aluno(s) selecionado(s)</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => linkMutation.mutate(Array.from(selectedStudentIds))} disabled={!selectedStudentIds.size || linkMutation.isPending}>
              {linkMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink confirm */}
      <AlertDialog open={!!unlinkConfirm} onOpenChange={(open) => !open && setUnlinkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular <strong>{unlinkConfirm?.studentName}</strong> deste consultor? O consultor perderá acesso aos dados deste aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (unlinkConfirm) { const link = linkedStudents?.find((l) => l.studentId === unlinkConfirm.studentId); if (link) unlinkMutation.mutate(link.linkId); } }} disabled={unlinkMutation.isPending}>
              {unlinkMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Main Page ───
const AdminRoles = () => {
  return (
    <DashboardLayout role="admin" title="Permissões" subtitle="Gerencie os níveis de acesso dos usuários">
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles"><Shield className="w-4 h-4 mr-1.5" />Permissões</TabsTrigger>
          <TabsTrigger value="links"><Link2 className="w-4 h-4 mr-1.5" />Vínculos</TabsTrigger>
        </TabsList>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="links"><ConsultantLinksTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminRoles;
