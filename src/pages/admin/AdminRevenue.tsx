import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { normalizeSearch } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Wallet, TrendingUp, CreditCard, QrCode, Landmark, Download, Search, Calendar, Eye, EyeOff } from "lucide-react";

type PaymentRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  original_amount: number;
  method: string;
  status: string;
  action_type: string;
  installments: number;
  created_at: string;
  plans: { name: string; duration_days: number } | null;
  profiles?: { full_name: string; email: string } | null;
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[Number(m) - 1]}/${y}`;
};

const methodMeta: Record<string, { label: string; icon: any; color: string }> = {
  pix: { label: "PIX", icon: QrCode, color: "bg-emerald-500/10 text-emerald-600" },
  credit: { label: "Crédito", icon: CreditCard, color: "bg-blue-500/10 text-blue-600" },
  credit_card: { label: "Crédito", icon: CreditCard, color: "bg-blue-500/10 text-blue-600" },
  card: { label: "Cartão", icon: CreditCard, color: "bg-blue-500/10 text-blue-600" },
  debit: { label: "Débito", icon: Landmark, color: "bg-amber-500/10 text-amber-600" },
  debit_card: { label: "Débito", icon: Landmark, color: "bg-amber-500/10 text-amber-600" },
};

const normalizeMethod = (m: string) => {
  const k = (m || "").toLowerCase();
  if (k.includes("pix")) return "pix";
  if (k.includes("debit")) return "debit";
  if (k.includes("credit") || k.includes("card")) return "credit";
  return k || "outro";
};

const AdminRevenue = () => {
  const [period, setPeriod] = useState<"all" | "month" | "year" | "custom">("all");
  const [showValues, setShowValues] = useState(false);
  const mask = (formatted: string) => (showValues ? formatted : "R$ ••••••");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("approved");
  const [search, setSearch] = useState("");

  const { data: plans = [] } = useQuery({
    queryKey: ["revenue-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("id, name, duration_days").order("duration_days");
      return data || [];
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["revenue-payments"],
    queryFn: async () => {
      const { data: pays } = await supabase
        .from("payments")
        .select("*, plans(name, duration_days)")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (!pays) return [];
      const userIds = Array.from(new Set(pays.map((p: any) => p.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
      return pays.map((p: any) => ({ ...p, profiles: map.get(p.user_id) || null })) as PaymentRow[];
    },
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (methodFilter !== "all" && normalizeMethod(r.method) !== methodFilter) return false;
      if (planFilter !== "all" && r.plan_id !== planFilter) return false;
      const d = new Date(r.created_at);
      if (period === "year" && d.getFullYear().toString() !== year) return false;
      if (period === "month") {
        if (d.getFullYear().toString() !== year) return false;
        if (String(d.getMonth() + 1).padStart(2, "0") !== month) return false;
      }
      if (period === "custom") {
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to + "T23:59:59")) return false;
      }
      if (search) {
        const q = normalizeSearch(search);
        const name = normalizeSearch(r.profiles?.full_name || "");
        const email = normalizeSearch(r.profiles?.email || "");
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, methodFilter, planFilter, period, year, month, from, to, search]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);
    const count = filtered.length;
    const byMethod: Record<string, { count: number; total: number }> = {};
    const byPlan: Record<string, { name: string; count: number; total: number }> = {};
    const byMonth: Record<string, { count: number; total: number }> = {};
    const byStudent: Record<string, { name: string; email: string; count: number; total: number; lastDate: string | null; firstDate: string | null }> = {};

    for (const r of filtered) {
      const m = normalizeMethod(r.method);
      byMethod[m] = byMethod[m] || { count: 0, total: 0 };
      byMethod[m].count++;
      byMethod[m].total += Number(r.amount || 0);

      const pkey = r.plan_id || "sem-plano";
      const pname = r.plans?.name || "Sem plano";
      byPlan[pkey] = byPlan[pkey] || { name: pname, count: 0, total: 0 };
      byPlan[pkey].count++;
      byPlan[pkey].total += Number(r.amount || 0);

      const d = new Date(r.created_at);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[ym] = byMonth[ym] || { count: 0, total: 0 };
      byMonth[ym].count++;
      byMonth[ym].total += Number(r.amount || 0);

      const skey = r.user_id;
      byStudent[skey] = byStudent[skey] || {
        name: r.profiles?.full_name || "—",
        email: r.profiles?.email || "",
        count: 0,
        total: 0,
        lastDate: null,
        firstDate: null,
      };
      byStudent[skey].count++;
      byStudent[skey].total += Number(r.amount || 0);
      const d2 = r.created_at;
      if (!byStudent[skey].lastDate || new Date(d2) > new Date(byStudent[skey].lastDate!)) {
        byStudent[skey].lastDate = d2;
      }
      if (!byStudent[skey].firstDate || new Date(d2) < new Date(byStudent[skey].firstDate!)) {
        byStudent[skey].firstDate = d2;
      }
    }

    return { total, count, byMethod, byPlan, byMonth, byStudent };
  }, [filtered]);

  const monthsSorted = Object.entries(totals.byMonth).sort((a, b) => b[0].localeCompare(a[0]));
  const studentsSorted = Object.entries(totals.byStudent).sort((a, b) => b[1].total - a[1].total);
  const plansSorted = Object.entries(totals.byPlan).sort((a, b) => b[1].total - a[1].total);

  const exportCSV = () => {
    const headers = ["Data", "Aluno", "Email", "Plano", "Método", "Parcelas", "Valor", "Status", "Tipo"];
    const lines = filtered.map((r) =>
      [
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.profiles?.full_name || "",
        r.profiles?.email || "",
        r.plans?.name || "",
        methodMeta[normalizeMethod(r.method)]?.label || r.method,
        r.installments,
        Number(r.amount).toFixed(2).replace(".", ","),
        r.status,
        r.action_type,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );
    const csv = [headers.join(";"), ...lines].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faturamento_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const years = Array.from(new Set(rows.map((r) => new Date(r.created_at).getFullYear()))).sort((a, b) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  return (
    <DashboardLayout role="admin" title="Faturamento" subtitle="Receitas, métodos, planos e alunos">
      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Período</label>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="year">Por ano</SelectItem>
                <SelectItem value="month">Por mês</SelectItem>
                <SelectItem value="custom">Intervalo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(period === "year" || period === "month") && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Ano</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {period === "month" && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Mês</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                    <SelectItem key={m} value={m}>{monthLabel(`${year}-${m}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {period === "custom" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">De</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Até</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Método</label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Plano</label>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {plans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Recusados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
            <label className="text-xs text-muted-foreground">Buscar aluno</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={() => setShowValues((v) => !v)} variant="outline" className="gap-2" title={showValues ? "Ocultar valores" : "Mostrar valores"}>
              {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button onClick={exportCSV} variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mask(fmtBRL(totals.total))}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.count} pagamento(s)</p>
          </CardContent>
        </Card>
        {(["pix", "credit", "debit"] as const).map((k) => {
          const meta = methodMeta[k];
          const Icon = meta.icon;
          const v = totals.byMethod[k] || { count: 0, total: 0 };
          return (
            <Card key={k}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mask(fmtBRL(v.total))}</div>
                <p className="text-xs text-muted-foreground mt-1">{v.count} pagamento(s)</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="meses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meses"><Calendar className="w-4 h-4 mr-2" />Por Mês</TabsTrigger>
          <TabsTrigger value="planos"><CreditCard className="w-4 h-4 mr-2" />Por Plano</TabsTrigger>
          <TabsTrigger value="alunos"><Wallet className="w-4 h-4 mr-2" />Por Aluno</TabsTrigger>
          <TabsTrigger value="todos">Todos pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="meses">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead className="text-right">Pagamentos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthsSorted.map(([ym, v]) => (
                    <TableRow key={ym}>
                      <TableCell className="font-medium">{monthLabel(ym)}</TableCell>
                      <TableCell className="text-right">{v.count}</TableCell>
                      <TableCell className="text-right font-semibold">{mask(fmtBRL(v.total))}</TableCell>
                    </TableRow>
                  ))}
                  {monthsSorted.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansSorted.map(([id, v]) => (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-right">{v.count}</TableCell>
                      <TableCell className="text-right font-semibold">{mask(fmtBRL(v.total))}</TableCell>
                    </TableRow>
                  ))}
                  {plansSorted.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alunos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Último pagamento</TableHead>
                    <TableHead>Primeiro pagamento</TableHead>
                    <TableHead className="text-right">Pagamentos</TableHead>
                    <TableHead className="text-right">Total Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsSorted.map(([id, v]) => (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{v.email}</TableCell>
                      <TableCell className="text-sm">
                        {v.lastDate ? new Date(v.lastDate).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.firstDate ? new Date(v.firstDate).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right">{v.count}</TableCell>
                      <TableCell className="text-right font-semibold">{mask(fmtBRL(v.total))}</TableCell>
                    </TableRow>
                  ))}
                  {studentsSorted.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 500).map((r) => {
                    const m = normalizeMethod(r.method);
                    const meta = methodMeta[m];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{r.profiles?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.profiles?.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">{r.plans?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={meta?.color}>
                            {meta?.label || r.method}
                            {r.installments > 1 ? ` ${r.installments}x` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "destructive"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{mask(fmtBRL(Number(r.amount)))}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && !isLoading && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem pagamentos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {filtered.length > 500 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">Mostrando 500 de {filtered.length}. Use filtros ou exporte em CSV.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminRevenue;