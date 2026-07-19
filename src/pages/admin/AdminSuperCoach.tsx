import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  UserX,
  HelpCircle,
  Search,
  ClipboardList,
  Loader2,
  RefreshCw,
  Calendar,
  Zap,
  UserPlus,
} from "lucide-react";
import { Layers } from "lucide-react";
import { cn, normalizeSearch } from "@/lib/utils";

const SUPERCOACH_URL = "https://adm.appsupercoach.com/";

type SyncStatus =
  | "pending"
  | "updated"
  | "not_found"
  | "divergent_name"
  | "review_manually";

interface SyncRow {
  user_id: string;
  status: SyncStatus;
  last_updated_at: string | null;
  updated_by_name: string | null;
  observation: string | null;
  divergent_found_name: string | null;
}

interface StudentRow {
  user_id: string;
  full_name: string;
  firstName: string;
  secondName: string;
  email: string;
  phone: string;
  plan: string;
  startDate: string | null;
  endDate: string | null;
  studentStatus: "active" | "expired" | "suspended" | "none";
  sync: SyncRow | null;
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  pending: "Pendente atualizar",
  updated: "SuperCoach atualizado",
  not_found: "Aluno não encontrado",
  divergent_name: "Nome divergente",
  review_manually: "Revisar manualmente",
};

type FilterKey =
  | "all"
  | "active"
  | "expiring_today"
  | "expiring_7"
  | "expired"
  | "pending"
  | "updated"
  | "not_found"
  | "divergent_name"
  | "review_manually";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Alunos ativos" },
  { key: "expiring_today", label: "Vencendo hoje" },
  { key: "expiring_7", label: "Vencendo em 7 dias" },
  { key: "expired", label: "Vencidos" },
  { key: "pending", label: "Pendente atualizar" },
  { key: "updated", label: "SuperCoach atualizado" },
  { key: "not_found", label: "Aluno não encontrado" },
  { key: "divergent_name", label: "Nome divergente" },
  { key: "review_manually", label: "Revisar manualmente" },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysDiff = (endDate: string | null) => {
  if (!endDate) return null;
  const today = startOfDay(new Date()).getTime();
  const end = startOfDay(new Date(endDate)).getTime();
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
};

const statusBadgeClasses = (s: SyncStatus | undefined, vencido: boolean) => {
  if (vencido && s !== "updated") return "bg-destructive/15 text-destructive border-destructive/30";
  if (s === "updated") return "bg-success/15 text-success border-success/30";
  if (s === "not_found") return "bg-muted/40 text-muted-foreground border-foreground/15";
  if (s === "divergent_name") return "bg-warning/15 text-warning border-warning/30";
  if (s === "review_manually") return "bg-muted/40 text-muted-foreground border-foreground/20";
  return "bg-warning/15 text-warning border-warning/30"; // pending
};

export default function AdminSuperCoach() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("active");
  const [search, setSearch] = useState("");
  const [actionRow, setActionRow] = useState<StudentRow | null>(null);
  const [actionType, setActionType] = useState<"not_found" | "divergent_name" | "review_manually" | null>(null);
  const [obs, setObs] = useState("");
  const [divergentName, setDivergentName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [fullSyncing, setFullSyncing] = useState(false);

  const runFullSync = async () => {
    if (!confirm("Importar todos os programas do ST Coach para a STH e espelhar as atribuições dos alunos? Essa ação pode levar alguns segundos.")) return;
    setFullSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-full-sync", { body: {} });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message || "Falha ao sincronizar");
      const p = data.programs, c = data.customers, a = data.assignments;
      toast({
        title: "Sincronização concluída",
        description: `Programas: ${p.created} criados, ${p.updated} atualizados (${p.total} no ST Coach) • Alunos casados: ${c.matched}/${c.total} • Atribuições gravadas: ${a.upserted}`,
      });
      qc.invalidateQueries();
    } catch (e: any) {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    } finally {
      setFullSyncing(false);
    }
  };

  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ["supercoach-students"],
    queryFn: async (): Promise<StudentRow[]> => {
      const [{ data: profiles }, { data: subs }, { data: syncs }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, phone"),
        supabase.from("subscriptions").select("user_id, status, start_date, end_date, plans(name)"),
        supabase.from("supercoach_sync").select("user_id, status, last_updated_at, updated_by_name, observation, divergent_found_name"),
      ]);

      if (!profiles) return [];

      return profiles.map((p: any) => {
        const sub = subs?.find((s: any) => s.user_id === p.user_id);
        const syncRaw = syncs?.find((s: any) => s.user_id === p.user_id) || null;
        const sync: SyncRow | null = syncRaw
          ? { ...syncRaw, status: syncRaw.status as SyncStatus }
          : null;
        const parts: string[] = (p.full_name || "").trim().split(/\s+/);
        const firstName = parts[0] || "";
        const secondName = parts[1] || "";
        const studentStatus: StudentRow["studentStatus"] = sub
          ? sub.status === "active" && new Date(sub.end_date) >= startOfDay(new Date())
            ? "active"
            : sub.status === "suspended"
            ? "suspended"
            : "expired"
          : "none";
        return {
          user_id: p.user_id,
          full_name: p.full_name || "—",
          firstName,
          secondName,
          email: p.email || "",
          phone: p.phone || "",
          plan: sub?.plans?.name || "—",
          startDate: sub?.start_date || null,
          endDate: sub?.end_date || null,
          studentStatus,
          sync,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = normalizeSearch(search);
    return students.filter((s) => {
      if (q) {
        const hay = normalizeSearch(`${s.full_name} ${s.email} ${s.phone}`);
        if (!hay.includes(q)) return false;
      }
      const diff = daysDiff(s.endDate);
      const status = s.sync?.status as SyncStatus | undefined;
      switch (filter) {
        case "all":
          return true;
        case "active":
          return s.studentStatus === "active";
        case "expiring_today":
          return diff === 0;
        case "expiring_7":
          return diff !== null && diff >= 0 && diff <= 7;
        case "expired":
          return s.studentStatus === "expired" || (diff !== null && diff < 0);
        case "pending":
          return !status || status === "pending";
        case "updated":
          return status === "updated";
        case "not_found":
          return status === "not_found";
        case "divergent_name":
          return status === "divergent_name";
        case "review_manually":
          return status === "review_manually";
      }
      return true;
    });
  }, [students, filter, search]);

  // ===== KPIs
  const kpis = useMemo(() => {
    const all = students || [];
    let active = 0,
      pending = 0,
      updatedToday = 0,
      expired = 0,
      notFound = 0,
      divergent = 0;
    const todayStr = new Date().toDateString();
    for (const s of all) {
      if (s.studentStatus === "active") active++;
      const status = s.sync?.status;
      if (!status || status === "pending") pending++;
      if (status === "not_found") notFound++;
      if (status === "divergent_name") divergent++;
      if (status === "updated" && s.sync?.last_updated_at) {
        if (new Date(s.sync.last_updated_at).toDateString() === todayStr) updatedToday++;
      }
      const diff = daysDiff(s.endDate);
      if (s.studentStatus === "expired" || (diff !== null && diff < 0)) expired++;
    }
    return { active, pending, updatedToday, expired, notFound, divergent };
  }, [students]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado", description: `${label}: ${text}` });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const openSuperCoach = () => window.open(SUPERCOACH_URL, "_blank", "noopener");

  const persistStatus = async (
    row: StudentRow,
    status: SyncStatus,
    observation: string,
    divergent_found_name: string
  ) => {
    setSavingId(row.user_id);
    try {
      const payload = {
        user_id: row.user_id,
        status,
        observation,
        divergent_found_name,
        last_updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
        updated_by_name: user?.user_metadata?.full_name || user?.email || "Equipe",
      };
      const { error } = await supabase
        .from("supercoach_sync")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      await supabase.from("supercoach_sync_logs").insert({
        user_id: row.user_id,
        status,
        performed_by: user?.id || null,
        performed_by_name: payload.updated_by_name,
        observation: observation || "",
      });
      toast({ title: "Atualizado", description: STATUS_LABEL[status] });
      qc.invalidateQueries({ queryKey: ["supercoach-students"] });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const markUpdated = (row: StudentRow) => persistStatus(row, "updated", row.sync?.observation || "", "");

  const syncSuperCoach = async (row: StudentRow) => {
    if (!row.endDate) {
      toast({ title: "Sem data de vencimento na STH", variant: "destructive" });
      return;
    }
    setSavingId(row.user_id);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-sync-expiration", {
        body: {
          action: "update",
          email: row.email,
          name: row.full_name,
          expiresDate: row.endDate.slice(0, 10),
        },
      });
      if (error) throw error;
      if (!data?.ok) {
        if (data?.status === "not_found") {
          await persistStatus(row, "not_found", "Não encontrado via API SuperCoach", "");
          toast({ title: "Aluno não encontrado no SuperCoach", variant: "destructive" });
          return;
        }
        throw new Error(data?.message || "Falha na sincronização");
      }
      const c = data.customer;
      const obs = `API: ${c.previous_expires_date || "—"} → ${c.new_expires_date} (${data.matchedBy})`;
      await persistStatus(row, "updated", obs, data.matchedBy === "name_partial" ? c.name : "");
      toast({
        title: "SuperCoach sincronizado",
        description: `${c.name}: vencimento agora ${c.new_expires_date}`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao sincronizar", description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const createInSuperCoach = async (row: StudentRow) => {
    if (!confirm(`Criar cadastro no SuperCoach para ${row.full_name}?\nSerá gerada uma senha temporária.`)) return;
    setSavingId(row.user_id);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-sync-expiration", {
        body: {
          action: "create",
          userId: row.user_id,
          expiresDate: row.endDate ? row.endDate.slice(0, 10) : undefined,
        },
      });
      if (error) throw error;
      if (!data?.ok) {
        if (data?.status === "already_exists") {
          await persistStatus(row, "updated", data.message || "Já existia no SuperCoach", "");
          toast({ title: "Já existia no SuperCoach", description: data.message });
          return;
        }
        throw new Error(data?.message || "Falha ao criar aluno");
      }
      const c = data.customer;
      const obs = `Criado no SuperCoach · vence ${c.premium_expires_date} · senha temp: ${c.temporary_password}`;
      await persistStatus(row, "updated", obs, "");
      try {
        await navigator.clipboard.writeText(`E-mail: ${c.email}\nSenha: ${c.temporary_password}`);
      } catch { /* ignore */ }
      toast({
        title: "Aluno criado no SuperCoach",
        description: `Senha temporária ${c.temporary_password} copiada para a área de transferência.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao criar aluno", description: e.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const openActionDialog = (row: StudentRow, type: "not_found" | "divergent_name" | "review_manually") => {
    setActionRow(row);
    setActionType(type);
    setObs(row.sync?.observation || "");
    setDivergentName(row.sync?.divergent_found_name || "");
  };

  const submitActionDialog = async () => {
    if (!actionRow || !actionType) return;
    if ((actionType === "not_found" || actionType === "review_manually") && !obs.trim()) {
      toast({ title: "Observação obrigatória", variant: "destructive" });
      return;
    }
    if (actionType === "divergent_name" && !divergentName.trim()) {
      toast({ title: "Informe o nome encontrado no SuperCoach", variant: "destructive" });
      return;
    }
    await persistStatus(actionRow, actionType, obs.trim(), divergentName.trim());
    setActionRow(null);
    setActionType(null);
    setObs("");
    setDivergentName("");
  };

  return (
    <DashboardLayout role="admin" title="SuperCoach Admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              SuperCoach Admin <span className="text-muted-foreground font-normal">| Treinos e Vigência</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe a atualização do período de vigência dos alunos no SuperCoach.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Recarregar
            </Button>
            <Button onClick={runFullSync} disabled={fullSyncing} className="gap-2">
              {fullSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              Sincronizar programas + atribuições
            </Button>
            <Button onClick={openSuperCoach} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
              <ExternalLink className="w-4 h-4" /> Abrir SuperCoach Admin
            </Button>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Alunos ativos" value={kpis.active} tone="default" />
          <KpiCard label="Pendentes" value={kpis.pending} tone="warning" />
          <KpiCard label="Atualizados hoje" value={kpis.updatedToday} tone="success" />
          <KpiCard label="Vencidos" value={kpis.expired} tone="destructive" />
          <KpiCard label="Não encontrados" value={kpis.notFound} tone="muted" />
          <KpiCard label="Nome divergente" value={kpis.divergent} tone="warning" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main panel */}
          <div className="space-y-4">
            {/* Filters + search */}
            <Card className="p-4 bg-card/60 border-foreground/10">
              <div className="flex flex-wrap gap-2 mb-3">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      filter === f.key
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-muted/30 text-muted-foreground border-foreground/10 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou WhatsApp"
                  className="pl-9 bg-background/60"
                />
              </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden border-foreground/10">
              <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                <table className="min-w-max text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 whitespace-nowrap">Aluno</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">Contato</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">Plano</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">Vigência STH</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">SuperCoach</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Carregando alunos…
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum aluno encontrado para este filtro.
                      </td></tr>
                    ) : (
                      filtered.map((row) => {
                        const diff = daysDiff(row.endDate);
                        const isExpired = row.studentStatus === "expired" || (diff !== null && diff < 0);
                        const status = (row.sync?.status as SyncStatus | undefined) || "pending";
                        const searchName = `${row.firstName} ${row.secondName}`.trim();
                        return (
                          <tr key={row.user_id} className="border-t border-foreground/5 hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{row.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {row.firstName} {row.secondName && `· ${row.secondName}`}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="text-foreground">{row.phone || "—"}</div>
                              <div className="text-muted-foreground truncate max-w-[180px]">{row.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="border-foreground/15 text-foreground">{row.plan}</Badge>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                Início: {formatDate(row.startDate)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={cn("text-sm font-semibold", isExpired ? "text-destructive" : diff !== null && diff <= 7 ? "text-warning" : "text-foreground")}>
                                {formatDate(row.endDate)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {diff === null ? "—" : isExpired ? `vencido há ${Math.abs(diff)}d` : diff === 0 ? "vence hoje" : `em ${diff}d`}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center px-2 py-1 rounded-md border text-[11px] font-medium", statusBadgeClasses(status, isExpired))}>
                                {STATUS_LABEL[status]}
                              </span>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                {row.sync?.last_updated_at ? formatDateTime(row.sync.last_updated_at) : "—"}
                              </div>
                              {row.sync?.updated_by_name && (
                                <div className="text-[11px] text-muted-foreground">
                                  por {row.sync.updated_by_name}
                                </div>
                              )}
                              {row.sync?.divergent_found_name && (
                                <div className="text-[11px] text-warning mt-1">
                                  ≠ {row.sync.divergent_found_name}
                                </div>
                              )}
                              {row.sync?.observation && (
                                <div className="text-[11px] text-muted-foreground mt-1 italic max-w-[220px] truncate" title={row.sync.observation}>
                                  “{row.sync.observation}”
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={openSuperCoach}>
                                  <ExternalLink className="w-3.5 h-3.5" /> SuperCoach
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={() => copyText(searchName, "Nome para busca")}>
                                  <Copy className="w-3.5 h-3.5" /> Nome
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={() => row.endDate && copyText(formatDate(row.endDate), "Vencimento")} disabled={!row.endDate}>
                                  <Calendar className="w-3.5 h-3.5" /> Vencimento
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap shrink-0"
                                  onClick={() => syncSuperCoach(row)}
                                  disabled={savingId === row.user_id || !row.endDate}
                                  title="Atualiza automaticamente a data de vencimento no SuperCoach via API"
                                >
                                  {savingId === row.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                  Sincronizar
                                </Button>
                                {status === "not_found" && (
                                  <Button
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs bg-success text-success-foreground hover:bg-success/90 whitespace-nowrap shrink-0"
                                    onClick={() => createInSuperCoach(row)}
                                    disabled={savingId === row.user_id}
                                    title="Cria o cadastro do aluno no SuperCoach puxando dados do portal"
                                  >
                                    {savingId === row.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    Criar no SuperCoach
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs bg-success text-success-foreground hover:bg-success/90 whitespace-nowrap shrink-0"
                                  onClick={() => markUpdated(row)}
                                  disabled={savingId === row.user_id}
                                >
                                  {savingId === row.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  Atualizado
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={() => openActionDialog(row, "not_found")}>
                                  <UserX className="w-3.5 h-3.5" /> Não encontrado
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={() => openActionDialog(row, "divergent_name")}>
                                  <AlertTriangle className="w-3.5 h-3.5" /> Divergente
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs whitespace-nowrap shrink-0" onClick={() => openActionDialog(row, "review_manually")}>
                                  <HelpCircle className="w-3.5 h-3.5" /> Revisar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Side guide */}
          <aside className="space-y-4 lg:sticky lg:top-4 self-start">
            <Card className="p-5 bg-card/60 border-foreground/10">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-success" />
                <h2 className="font-display font-semibold tracking-tight">Procedimento guiado</h2>
              </div>
              <ol className="space-y-2.5 text-sm">
                {[
                  "Abrir o SuperCoach Admin.",
                  "Acessar o menu “Alunos”.",
                  "Buscar o aluno usando primeiro + segundo nome.",
                  "Conferir se o aluno encontrado corresponde ao da STH Method.",
                  "Atualizar o período de vigência/consultoria com a mesma data de vencimento da STH Method.",
                  "Salvar a alteração no SuperCoach.",
                  "Voltar ao CRM e marcar como “SuperCoach atualizado”.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-success/15 text-success text-xs font-bold inline-flex items-center justify-center border border-success/30">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90 leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
              <Button onClick={openSuperCoach} className="w-full mt-4 gap-2 bg-success text-success-foreground hover:bg-success/90">
                <ExternalLink className="w-4 h-4" /> Abrir SuperCoach
              </Button>
            </Card>

            <Card className="p-4 bg-muted/20 border-foreground/10 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Segurança</p>
              Login e senha do SuperCoach <strong>não são</strong> armazenados no CRM. Use o gerenciador de senhas do navegador para acessar. Em caso de dúvida, marque o aluno como <em>Revisar manualmente</em>.
            </Card>
          </aside>
        </div>
      </div>

      {/* Action dialog */}
      <Dialog open={!!actionType} onOpenChange={(o) => { if (!o) { setActionRow(null); setActionType(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "not_found" && "Aluno não encontrado"}
              {actionType === "divergent_name" && "Nome divergente"}
              {actionType === "review_manually" && "Revisar manualmente"}
            </DialogTitle>
            <DialogDescription>
              {actionRow?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {actionType === "divergent_name" && (
              <div className="space-y-1.5">
                <Label>Nome encontrado no SuperCoach</Label>
                <Input value={divergentName} onChange={(e) => setDivergentName(e.target.value)} placeholder="Ex.: João Silva Santos" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>
                Observação {actionType !== "divergent_name" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={4} placeholder="Descreva o que foi verificado…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setActionRow(null); setActionType(null); }}>Cancelar</Button>
            <Button onClick={submitActionDialog} className="bg-success text-success-foreground hover:bg-success/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "warning" | "destructive" | "muted" }) {
  const toneClasses = {
    default: "from-foreground/5 to-transparent border-foreground/10 text-foreground",
    success: "from-success/10 to-transparent border-success/30 text-success",
    warning: "from-warning/10 to-transparent border-warning/30 text-warning",
    destructive: "from-destructive/10 to-transparent border-destructive/30 text-destructive",
    muted: "from-muted/20 to-transparent border-foreground/10 text-muted-foreground",
  }[tone];
  return (
    <Card className={cn("p-4 border bg-gradient-to-b", toneClasses)}>
      <div className="text-[11px] uppercase tracking-wider font-medium opacity-80">{label}</div>
      <div className="text-3xl font-display font-bold tabular-nums mt-1">{value}</div>
    </Card>
  );
}