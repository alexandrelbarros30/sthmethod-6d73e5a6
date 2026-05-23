import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, MessageCircle, Download } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { classifyCrm, CRM_STATUS_COLOR, CRM_STATUS_LABEL, type CrmStatus } from "@/lib/crm-classify";

type StatusFilter = "all" | CrmStatus | "inactive";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "expiring", label: "Vencendo (7d)" },
  { value: "expired", label: "Vencidos" },
  { value: "inactive", label: "Inativos (vencidos +30d)" },
  { value: "lead", label: "Leads qualificados" },
  { value: "tool_user", label: "Visitantes de ferramentas" },
];

interface Contact {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  objective: string | null;
  created_at: string;
  status: CrmStatus;
  plan_name?: string;
  end_date?: string;
  days_to_expire?: number;
}

const statusColor = CRM_STATUS_COLOR;
const statusLabel = CRM_STATUS_LABEL;

export default function CRMContacts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["crm-contacts"],
    queryFn: async (): Promise<Contact[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, gender, objective, onboarding_complete, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const userIds = (profiles || []).map((p) => p.user_id);
      if (userIds.length === 0) return [];

      const [subsRes, plansRes] = await Promise.all([
        supabase.from("subscriptions").select("user_id, plan_id, end_date, status").in("user_id", userIds),
        supabase.from("plans").select("id, name"),
      ]);

      const plansMap = new Map((plansRes.data || []).map((p: any) => [p.id, p.name]));
      const latestSub = new Map<string, any>();
      (subsRes.data || []).forEach((s: any) => {
        const existing = latestSub.get(s.user_id);
        if (!existing || new Date(s.end_date) > new Date(existing.end_date)) {
          latestSub.set(s.user_id, s);
        }
      });

      const now = new Date();
      return (profiles || []).map((p: any): Contact => {
        const sub = latestSub.get(p.user_id);
        const status = classifyCrm(
          { onboarding_complete: p.onboarding_complete, objective: p.objective },
          sub ? { end_date: sub.end_date, status: sub.status } : undefined,
        );
        const end = sub ? parseISO(sub.end_date) : null;
        const days = end ? differenceInDays(end, now) : undefined;
        return {
          ...p,
          status,
          plan_name: sub ? plansMap.get(sub.plan_id) : undefined,
          end_date: sub?.end_date,
          days_to_expire: days,
        } as Contact;
      });
    },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, expiring: 0, expired: 0, inactive: 0, lead: 0, tool_user: 0 };
    contacts.forEach((x) => {
      c[x.status] = (c[x.status] || 0) + 1;
      if (x.status === "expired" && typeof x.days_to_expire === "number" && x.days_to_expire <= -30) {
        c.inactive += 1;
      }
    });
    return c;
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (statusFilter !== "all") {
        if (statusFilter === "inactive") {
          // inativo = vencido há mais de 30 dias
          if (!(c.status === "expired" && typeof c.days_to_expire === "number" && c.days_to_expire <= -30)) return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }
      if (genderFilter !== "all" && (c.gender || "").toLowerCase() !== genderFilter) return false;
      if (!q) return true;
      return (
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, statusFilter, genderFilter]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.user_id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((c) => next.delete(c.user_id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((c) => next.add(c.user_id));
      setSelected(next);
    }
  };

  const exportCsv = () => {
    const rows = filtered.filter((c) => selected.size === 0 || selected.has(c.user_id));
    const header = ["Nome", "Email", "Telefone", "Status", "Plano", "Vence em", "Objetivo"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [r.full_name, r.email, r.phone || "", statusLabel[r.status], r.plan_name || "", r.end_date || "", r.objective || ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-contatos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {[
          { key: "active", label: "Ativos", color: "text-emerald-400" },
          { key: "expiring", label: "Vencendo", color: "text-amber-400" },
          { key: "expired", label: "Vencidos", color: "text-rose-400" },
          { key: "inactive", label: "Inativos +30d", color: "text-zinc-400" },
          { key: "lead", label: "Leads", color: "text-sky-400" },
          { key: "tool_user", label: "Ferramentas", color: "text-zinc-500" },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStatusFilter(s.key as StatusFilter)}
            className={`rounded-lg border p-2 text-left transition hover:border-emerald-500/40 ${
              statusFilter === s.key ? "border-emerald-500/50 bg-emerald-500/5" : "border-border/40"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-semibold ${s.color}`}>{counts[s.key] || 0}</p>
          </button>
        ))}
      </div>

      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Sexo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sexo: todos</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-3 text-sm">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {filtered.length} contatos {selected.size > 0 && `• ${selected.size} selecionados`}
              </span>
            </div>
            {selected.size > 0 && (
              <Button size="sm" className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400" disabled>
                <MessageCircle className="h-4 w-4" /> Disparar campanha
              </Button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum contato encontrado.</div>
            ) : (
              filtered.slice(0, 200).map((c) => (
                <div key={c.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition">
                  <Checkbox
                    checked={selected.has(c.user_id)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(c.user_id); else next.delete(c.user_id);
                      setSelected(next);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.full_name || "(sem nome)"}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.email} {c.phone && `• ${c.phone}`}</p>
                  </div>
                  <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground min-w-[140px]">
                    {c.plan_name && <span>{c.plan_name}</span>}
                    {typeof c.days_to_expire === "number" && (
                      <span>{c.days_to_expire >= 0 ? `vence em ${c.days_to_expire}d` : `vencido há ${-c.days_to_expire}d`}</span>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColor[c.status]}`}>
                    {statusLabel[c.status]}
                  </Badge>
                </div>
              ))
            )}
            {filtered.length > 200 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Mostrando primeiros 200 de {filtered.length}. Refine os filtros para ver mais.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}