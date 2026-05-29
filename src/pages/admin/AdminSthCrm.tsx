import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Flame, Users, Clock, LineChart, FlaskConical, Headphones, AlertTriangle,
  DollarSign, Search, ArrowUpRight, Sparkles, Tag as TagIcon, Plus, Trash2, MessageCircle,
} from "lucide-react";
import CrmContactDrawer from "@/components/admin/sth-crm/CrmContactDrawer";
import { toast } from "sonner";

type RoleArea = "admin" | "consultor";
interface Props { area?: RoleArea }

interface Stats {
  leads_novos: number; alunos_ativos: number; renovacoes_proximas: number;
  atualizacoes_pendentes: number; exames_aguardando: number; atendimentos_abertos: number;
  prioridade_alta: number; oportunidades: number; total_leads: number; receita_30d: number;
}

const CARDS = [
  { key: "leads_novos", label: "Leads Novos", icon: Flame, accent: "text-rose-400 bg-rose-500/10" },
  { key: "alunos_ativos", label: "Alunos Ativos", icon: Users, accent: "text-emerald-400 bg-emerald-500/10" },
  { key: "renovacoes_proximas", label: "Renovações Próximas", icon: Clock, accent: "text-amber-400 bg-amber-500/10" },
  { key: "atualizacoes_pendentes", label: "Atualizações Pendentes", icon: LineChart, accent: "text-sky-400 bg-sky-500/10" },
  { key: "exames_aguardando", label: "Exames Aguardando", icon: FlaskConical, accent: "text-violet-400 bg-violet-500/10" },
  { key: "atendimentos_abertos", label: "Atendimentos Abertos", icon: Headphones, accent: "text-cyan-400 bg-cyan-500/10" },
  { key: "prioridade_alta", label: "Prioridade Alta", icon: AlertTriangle, accent: "text-red-400 bg-red-500/10" },
  { key: "oportunidades", label: "Oportunidades", icon: DollarSign, accent: "text-emerald-300 bg-emerald-500/10" },
] as const;

const StatCard = ({ label, value, Icon, accent }: { label: string; value: number; Icon: any; accent: string }) => (
  <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground truncate">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value ?? 0}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["sth-crm-stats"],
    queryFn: async (): Promise<Stats> => {
      const { data, error } = await supabase.rpc("sth_crm_dashboard_stats" as any);
      if (error) throw error;
      return data as Stats;
    },
    refetchInterval: 60_000,
  });

  const taxa = data && data.total_leads > 0
    ? ((data.alunos_ativos / Math.max(data.total_leads, 1)) * 100).toFixed(1)
    : "0";

  const receita = data ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(data.receita_30d) : "R$ 0";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">Cérebro operacional</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">STH CRM</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Toda informação de leads, alunos e pacientes em um único lugar — organizar, atender, converter, reter, renovar.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conversão</p>
              <p className="text-lg font-semibold text-emerald-400">{taxa}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Receita 30d</p>
              <p className="text-lg font-semibold">{receita}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total leads</p>
              <p className="text-lg font-semibold">{data?.total_leads ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={(data?.[c.key as keyof Stats] as number) ?? 0}
            Icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando indicadores…</p>}
    </motion.div>
  );
};

interface PersonRow {
  id: string;
  kind: "lead" | "student" | "unknown" | string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  plan_name: string | null;
  plan_status: string | null;
  plan_end: string | null;
  tags: string[] | null;
  updated_at: string;
  origin: string | null;
  objective: string | null;
  lead_status: string | null;
}

const People = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["sth-crm-people", kind, status],
    queryFn: async () => {
      let query = supabase
        .from("crm_contacts")
        .select("id,kind,full_name,phone,email,plan_name,plan_status,plan_end,tags,updated_at,origin,objective,lead_status")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (kind !== "all") query = query.eq("kind", kind);
      if (status !== "all") query = query.eq("plan_status", status);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PersonRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((p) =>
      [p.full_name, p.phone, p.email, p.plan_name, (p.tags || []).join(" ")]
        .some((v) => (v || "").toString().toLowerCase().includes(term))
    );
  }, [data, q]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, WhatsApp, email, plano, tag…"
              className="pl-9 bg-background/60"
            />
          </div>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="student">Alunos</SelectItem>
              <SelectItem value="unknown">Desconhecido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="expired">Encerrado</SelectItem>
              <SelectItem value="renewal_pending">Renovação Pendente</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium text-right">Última interação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onOpen(p.id)}
                    className="cursor-pointer border-b border-border/30 transition hover:bg-emerald-500/5"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.full_name || "Sem nome"}</div>
                      {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        p.kind === "student" ? "border-emerald-500/40 text-emerald-400" :
                        p.kind === "lead" ? "border-amber-500/40 text-amber-400" :
                        "border-border/60 text-muted-foreground"
                      }>
                        {p.kind === "student" ? "Aluno" : p.kind === "lead" ? "Lead" : "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.plan_name || "—"}
                      {p.plan_status && <div className="text-[10px] text-muted-foreground">{p.plan_status}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum contato encontrado.</td></tr>
                )}
                {isLoading && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Carregando…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AdminSthCrm({ area = "admin" }: Props) {
  return <AdminSthCrmInner area={area} />;
}

interface RenewalRow {
  id: string;
  user_id: string;
  end_date: string;
  plan_id: string;
  plan_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  contact_id?: string | null;
}

const Renovacoes = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const [win, setWin] = useState("30");
  const { data, isLoading } = useQuery({
    queryKey: ["sth-crm-renewals", win],
    queryFn: async () => {
      const days = parseInt(win, 10);
      const today = new Date().toISOString().slice(0, 10);
      const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("id,user_id,end_date,plan_id")
        .eq("status", "active")
        .gte("end_date", today)
        .lte("end_date", limit)
        .order("end_date", { ascending: true })
        .limit(300);
      if (error) throw error;
      const subsArr = (subs || []) as any[];
      const userIds = [...new Set(subsArr.map((s) => s.user_id))];
      const planIds = [...new Set(subsArr.map((s) => s.plan_id))];
      const [profilesRes, plansRes, contactsRes] = await Promise.all([
        userIds.length ? supabase.from("profiles").select("user_id,full_name,phone").in("user_id", userIds) : Promise.resolve({ data: [] as any[] }),
        planIds.length ? supabase.from("plans").select("id,name").in("id", planIds) : Promise.resolve({ data: [] as any[] }),
        userIds.length ? supabase.from("crm_contacts").select("id,user_id").in("user_id", userIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pmap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const planmap = new Map((plansRes.data || []).map((p: any) => [p.id, p.name]));
      const cmap = new Map((contactsRes.data || []).map((c: any) => [c.user_id, c.id]));
      return subsArr.map<RenewalRow>((s) => ({
        id: s.id, user_id: s.user_id, end_date: s.end_date, plan_id: s.plan_id,
        plan_name: planmap.get(s.plan_id) || null,
        full_name: pmap.get(s.user_id)?.full_name || null,
        phone: pmap.get(s.user_id)?.phone || null,
        contact_id: cmap.get(s.user_id) || null,
      }));
    },
  });

  const bucket = (days: number) => {
    if (days <= 1) return { label: "Hoje/Amanhã", cls: "border-red-500/40 text-red-400 bg-red-500/10" };
    if (days <= 3) return { label: `D-${days}`, cls: "border-rose-500/40 text-rose-400 bg-rose-500/10" };
    if (days <= 7) return { label: `D-${days}`, cls: "border-amber-500/40 text-amber-400 bg-amber-500/10" };
    if (days <= 15) return { label: `D-${days}`, cls: "border-sky-500/40 text-sky-400 bg-sky-500/10" };
    return { label: `D-${days}`, cls: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Alertas de Renovação</p>
            <p className="text-xs text-muted-foreground">Assinaturas ativas com vencimento próximo.</p>
          </div>
          <Select value={win} onValueChange={setWin}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Próximos 3 dias</SelectItem>
              <SelectItem value="7">Próximos 7 dias</SelectItem>
              <SelectItem value="15">Próximos 15 dias</SelectItem>
              <SelectItem value="30">Próximos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Aluno</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Janela</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((r) => {
                  const days = Math.max(0, Math.ceil((new Date(r.end_date).getTime() - Date.now()) / 86400000));
                  const b = bucket(days);
                  const wa = r.phone ? `https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${r.full_name || ""}, seu plano STH vence em ${days} dias. Vamos renovar? sthmethod.com.br/#planos`)}` : null;
                  return (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-emerald-500/5">
                      <td className="px-4 py-3">
                        <button onClick={() => r.contact_id && onOpen(r.contact_id)} className="text-left font-medium hover:text-emerald-400">
                          {r.full_name || "Sem nome"}
                        </button>
                        {r.phone && <div className="font-mono text-[11px] text-muted-foreground">{r.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">{r.plan_name || "—"}</td>
                      <td className="px-4 py-3 text-xs">{new Date(r.end_date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={b.cls}>{b.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {wa && (
                          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">
                            <MessageCircle className="h-3 w-3" />WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && (data?.length || 0) === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma renovação nesta janela.</td></tr>
                )}
                {isLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Carregando…</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface TagRow { id: string; name: string; color: string | null; kind: string | null }

const TagsManager = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [kind, setKind] = useState("general");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sth-crm-tags-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_tags").select("id,name,color,kind").order("name");
      if (error) throw error;
      return (data || []) as TagRow[];
    },
  });

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    const { error } = await supabase.from("crm_tags").insert({ name: n, color, kind } as any);
    if (error) { toast.error(error.message); return; }
    setName(""); toast.success("Tag criada"); refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("crm_tags").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tag removida"); refetch();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Nome da tag</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lead Quente" />
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Cor</p>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 cursor-pointer rounded-md border border-border bg-background" />
          </div>
          <div className="w-full md:w-44">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Categoria</p>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="renewal">Renovação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={create} className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400">
            <Plus className="h-4 w-4" />Adicionar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-4">
          {isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
          <div className="flex flex-wrap gap-2">
            {(data || []).map((t) => (
              <div key={t.id} className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/60 py-1 pl-3 pr-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color || "#22c55e" }} />
                <span className="text-xs font-medium">{t.name}</span>
                <span className="text-[10px] text-muted-foreground">· {t.kind}</span>
                <button onClick={() => remove(t.id)} className="ml-1 rounded-full p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {!isLoading && (data?.length || 0) === 0 && <p className="text-xs text-muted-foreground">Nenhuma tag cadastrada.</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function AdminSthCrmInner({ area = "admin" }: Props) {
  const [tab, setTab] = useState<"dashboard" | "pessoas" | "renovacoes" | "tags">("dashboard");
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  return (
    <DashboardLayout role={area} title="STH CRM" subtitle="Cérebro operacional do ecossistema STH METHOD">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">STH CRM</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Núcleo de Relacionamento</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Leads, alunos, pacientes, atendimentos, renovações e histórico — tudo conectado.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-muted/40 flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="gap-2"><LineChart className="h-3.5 w-3.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="pessoas" className="gap-2"><Users className="h-3.5 w-3.5" />Pessoas</TabsTrigger>
            <TabsTrigger value="renovacoes" className="gap-2"><Clock className="h-3.5 w-3.5" />Renovações</TabsTrigger>
            <TabsTrigger value="tags" className="gap-2"><TagIcon className="h-3.5 w-3.5" />Tags</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6"><Dashboard /></TabsContent>
          <TabsContent value="pessoas" className="mt-6"><People onOpen={setOpenContactId} /></TabsContent>
          <TabsContent value="renovacoes" className="mt-6"><Renovacoes onOpen={setOpenContactId} /></TabsContent>
          <TabsContent value="tags" className="mt-6"><TagsManager /></TabsContent>
        </Tabs>

        <CrmContactDrawer contactId={openContactId} onClose={() => setOpenContactId(null)} />
      </div>
    </DashboardLayout>
  );
}