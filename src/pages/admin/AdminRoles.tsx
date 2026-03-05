import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Shield, ShieldCheck, ShieldAlert, Users, UserCog } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "consultor" | "assistente" | "financeiro" | "student";

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldAlert },
  consultor: { label: "Consultor", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ShieldCheck },
  assistente: { label: "Assistente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: UserCog },
  financeiro: { label: "Financeiro", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Shield },
  student: { label: "Aluno", color: "bg-muted text-muted-foreground border-border", icon: Users },
};

const AdminRoles = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; name: string; currentRole: AppRole; newRole: AppRole } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-roles-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, avatar_url, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      return profiles.map((p) => {
        const roleEntry = roles.find((r) => r.user_id === p.user_id);
        return {
          ...p,
          role: (roleEntry?.role || "student") as AppRole,
          initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        };
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
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
    const matchSearch = !searchTerm.trim() ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = users?.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <DashboardLayout role="admin" title="Permissões" subtitle="Gerencie os níveis de acesso dos usuários">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Gerenciar Permissões</h1>
          <p className="text-muted-foreground font-body">Atribua e altere os níveis de acesso dos usuários</p>
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={role}
                className={`cursor-pointer transition-all ${filterRole === role ? "ring-2 ring-primary" : "hover:bg-accent/50"}`}
                onClick={() => setFilterRole(filterRole === role ? "all" : role)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
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
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
                      <TableHead>Role Atual</TableHead>
                      <TableHead>Alterar Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.map((user) => {
                      const config = roleConfig[user.role];
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {user.initials}
                              </div>
                              <span className="font-medium text-foreground">{user.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(newRole: string) => {
                                if (newRole !== user.role) {
                                  setConfirmDialog({
                                    userId: user.user_id,
                                    name: user.full_name || user.email,
                                    currentRole: user.role,
                                    newRole: newRole as AppRole,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, c]) => (
                                  <SelectItem key={role} value={role}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de permissão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar a role de <strong>{confirmDialog?.name}</strong> de{" "}
              <Badge variant="outline" className={confirmDialog ? roleConfig[confirmDialog.currentRole].color : ""}>
                {confirmDialog ? roleConfig[confirmDialog.currentRole].label : ""}
              </Badge>{" "}
              para{" "}
              <Badge variant="outline" className={confirmDialog ? roleConfig[confirmDialog.newRole].color : ""}>
                {confirmDialog ? roleConfig[confirmDialog.newRole].label : ""}
              </Badge>
              ? Esta ação altera imediatamente o nível de acesso do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  updateRoleMutation.mutate({ userId: confirmDialog.userId, newRole: confirmDialog.newRole });
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminRoles;
