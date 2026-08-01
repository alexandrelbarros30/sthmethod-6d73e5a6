import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Users, Building2, Link2, Search, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { COACH_PLANS } from "@/lib/coach-plans";
import { normalizeSearch } from "@/lib/utils";

type Tenant = {
  id: string;
  business_name: string;
  legal_name: string | null;
  cref: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  student_limit: number;
  active: boolean;
  created_at: string;
};

const AdminCoach = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-coach-overview"],
    queryFn: async () => {
      const [t, m, s, i] = await Promise.all([
        supabase.from("coach_tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("coach_members").select("id, tenant_id, role, full_name, email, active"),
        supabase.from("coach_students").select("id, tenant_id, full_name, email, phone, status, user_id, created_at"),
        supabase.from("coach_invites").select("id, tenant_id, token, used_at, expires_at, created_at"),
      ]);
      if (t.error) throw t.error;
      return {
        tenants: (t.data || []) as Tenant[],
        members: m.data || [],
        students: s.data || [],
        invites: i.data || [],
      };
    },
  });

  const tenants = data?.tenants ?? [];
  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return tenants;
    return tenants.filter((t) =>
      normalizeSearch(`${t.business_name} ${t.legal_name ?? ""} ${t.email ?? ""} ${t.cref ?? ""}`).includes(q)
    );
  }, [tenants, search]);

  const countBy = (arr: any[], tenantId: string) => arr.filter((x) => x.tenant_id === tenantId).length;
  const current = tenants.find((t) => t.id === selected) || null;

  const updateTenant = async (id: string, patch: Partial<Tenant>) => {
    const { error } = await supabase.from("coach_tenants").update(patch as any).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar: " + error.message);
      return;
    }
    toast.success("Ambiente atualizado.");
    qc.invalidateQueries({ queryKey: ["admin-coach-overview"] });
  };

  const totals = {
    tenants: tenants.length,
    active: tenants.filter((t) => t.active).length,
    members: data?.members.length ?? 0,
    students: data?.students.length ?? 0,
  };

  return (
    <DashboardLayout role="admin" title="STH METHOD COACH">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-primary" /> STH METHOD COACH · Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão interna de todos os ambientes de personal trainers, academias e assessorias.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/coach" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir COACH
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Ambientes", value: totals.tenants, icon: Building2 },
            { label: "Ativos", value: totals.active, icon: Building2 },
            { label: "Profissionais", value: totals.members, icon: Users },
            { label: "Alunos COACH", value: totals.students, icon: Users },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                  <c.icon className="w-4 h-4" /> {c.label}
                </div>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Ambientes</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, e-mail ou CREF"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-center">Equipe</TableHead>
                  <TableHead className="text-center">Alunos</TableHead>
                  <TableHead className="text-center">Convites</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando…</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum ambiente COACH criado ainda.</TableCell></TableRow>
                )}
                {filtered.map((t) => (
                  <TableRow key={t.id} className={selected === t.id ? "bg-muted/50" : ""}>
                    <TableCell>
                      <p className="font-medium">{t.business_name}</p>
                      <p className="text-xs text-muted-foreground">{t.email || "—"} {t.cref ? `· CREF ${t.cref}` : ""}</p>
                    </TableCell>
                    <TableCell>
                      <Select value={t.plan} onValueChange={(v) => {
                        const plan = COACH_PLANS.find((p: any) => p.id === v);
                        updateTenant(t.id, { plan: v as any, student_limit: plan?.studentLimit ?? t.student_limit });
                      }}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COACH_PLANS.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">{countBy(data?.members ?? [], t.id)}</TableCell>
                    <TableCell className="text-center">
                      {countBy(data?.students ?? [], t.id)} / {t.student_limit}
                    </TableCell>
                    <TableCell className="text-center">{countBy(data?.invites ?? [], t.id)}</TableCell>
                    <TableCell>
                      <Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(selected === t.id ? null : t.id)}>
                        {selected === t.id ? "Fechar" : "Detalhes"}
                      </Button>
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => updateTenant(t.id, { active: !t.active })}>
                        {t.active ? "Desativar" : "Ativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {current && (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Equipe · {current.business_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(data?.members ?? []).filter((m: any) => m.tenant_id === current.id).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{m.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{m.email || "—"}</p>
                    </div>
                    <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
                  </div>
                ))}
                {(data?.members ?? []).filter((m: any) => m.tenant_id === current.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum profissional.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" /> Alunos · {current.business_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {(data?.students ?? []).filter((s: any) => s.tenant_id === current.id).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.email || s.phone || "—"}</p>
                    </div>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                ))}
                {(data?.students ?? []).filter((s: any) => s.tenant_id === current.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCoach;