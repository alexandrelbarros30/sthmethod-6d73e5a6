import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Activity, Flame, AlertTriangle, RefreshCw, ClipboardList, Users,
  DollarSign, Sparkles, Crown, TrendingUp, MessageSquare, Clock,
} from "lucide-react";

type Series = Array<{ day: string; value: number }>;

interface CmdData {
  comercial: { leads_hoje: number; leads_semana: number; conversoes_30d: number; taxa_conversao: number; plano_top: { name?: string; count?: number } };
  operacao: { abertos: number; aguardando: number; encerrados_7d: number; tempo_medio_ms: number };
  retencao: { sem_atualizacao: number; em_risco: number; ativos: number; vip: number };
  renovacao: { d30: number; d15: number; d7: number; d3: number };
  financeiro: { receita_mes: number; receita_ano: number; ticket_medio: number; por_plano: Array<{ name: string; amount: number }> };
  inteligencia: {
    top_intents: Array<{ intent: string; count: number }>;
    top_templates: Array<{ name: string; uses: number; success: number }>;
    top_conversao_templates: Array<{ name: string; success: number; uses: number }>;
  };
  series: { receita_30d: Series; leads_30d: Series; conversoes_30d: Series };
  alertas: { leads_quentes: number; risco_evasao: number; renovacao_proxima: number; atendimento_parado: number; atualizacao_pendente: number };
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const Stat = ({ icon: Icon, label, value, sub, accent = "text-foreground" }: any) => (
  <div className="rounded-2xl border border-border/40 bg-black/40 backdrop-blur-xl p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
        <p className={`text-xl font-display font-semibold mt-1 truncate ${accent}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 font-body truncate">{sub}</p>}
      </div>
      <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, label, accent }: any) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${accent}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <h2 className="text-sm font-display font-semibold uppercase tracking-wider">{label}</h2>
  </div>
);

const AlertChip = ({ icon, label, value, accent }: any) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${accent}`}>
    <span className="text-base">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs font-medium leading-tight truncate">{label}</p>
      <p className="text-lg font-display font-semibold leading-tight">{value}</p>
    </div>
  </div>
);

const chartTooltipStyle = {
  backgroundColor: "rgba(0,0,0,0.92)",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

export default function AdminSthCommand() {
  const { data, isLoading } = useQuery({
    queryKey: ["sth-command-center"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sth_command_center" as any);
      if (error) throw error;
      return data as unknown as CmdData;
    },
    refetchInterval: 60_000,
  });

  return (
    <DashboardLayout role="admin" title="STH Command Center">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">STH Command Center</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            Toda a operação da STH METHOD em uma única tela — em tempo real.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando indicadores...</p>
        ) : !data ? (
          <p className="text-sm text-rose-400">Falha ao carregar dados.</p>
        ) : (
          <>
            {/* Alertas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <AlertChip icon="🔥" label="Lead quente" value={data.alertas.leads_quentes} accent="bg-rose-500/10 border-rose-500/30 text-rose-400" />
              <AlertChip icon="🔥" label="Aluno em risco" value={data.alertas.risco_evasao} accent="bg-amber-500/10 border-amber-500/30 text-amber-400" />
              <AlertChip icon="🔥" label="Renov. próxima" value={data.alertas.renovacao_proxima} accent="bg-sky-500/10 border-sky-500/30 text-sky-400" />
              <AlertChip icon="🔥" label="Atend. parado" value={data.alertas.atendimento_parado} accent="bg-orange-500/10 border-orange-500/30 text-orange-400" />
              <AlertChip icon="🔥" label="Atualiz. pendente" value={data.alertas.atualizacao_pendente} accent="bg-violet-500/10 border-violet-500/30 text-violet-400" />
            </div>

            {/* COMERCIAL */}
            <section>
              <SectionTitle icon={Sparkles} label="Comercial" accent="bg-rose-500/15 text-rose-400" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Stat icon={Flame} label="Leads hoje" value={data.comercial.leads_hoje} />
                <Stat icon={Flame} label="Leads (7d)" value={data.comercial.leads_semana} />
                <Stat icon={TrendingUp} label="Conversões 30d" value={data.comercial.conversoes_30d} accent="text-emerald-400" />
                <Stat icon={TrendingUp} label="Taxa conversão" value={`${data.comercial.taxa_conversao}%`} accent="text-emerald-400" />
                <Stat icon={Crown} label="Plano top" value={data.comercial.plano_top?.name || "—"} sub={data.comercial.plano_top?.count ? `${data.comercial.plano_top.count} vendas` : ""} />
              </div>
            </section>

            {/* OPERAÇÃO */}
            <section>
              <SectionTitle icon={MessageSquare} label="Operação" accent="bg-sky-500/15 text-sky-400" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat icon={MessageSquare} label="Atend. abertos" value={data.operacao.abertos} />
                <Stat icon={Clock} label="Aguardando" value={data.operacao.aguardando} accent="text-amber-400" />
                <Stat icon={Clock} label="Tempo médio" value={`${(data.operacao.tempo_medio_ms / 1000).toFixed(1)}s`} />
                <Stat icon={ClipboardList} label="Encerrados 7d" value={data.operacao.encerrados_7d} />
              </div>
            </section>

            {/* RETENÇÃO + RENOVAÇÃO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section>
                <SectionTitle icon={Users} label="Retenção" accent="bg-violet-500/15 text-violet-400" />
                <div className="grid grid-cols-2 gap-3">
                  <Stat icon={Users} label="Ativos" value={data.retencao.ativos} accent="text-emerald-400" />
                  <Stat icon={Crown} label="VIP" value={data.retencao.vip} accent="text-amber-400" />
                  <Stat icon={AlertTriangle} label="Sem atualização" value={data.retencao.sem_atualizacao} accent="text-amber-400" />
                  <Stat icon={AlertTriangle} label="Em risco" value={data.retencao.em_risco} accent="text-rose-400" />
                </div>
              </section>
              <section>
                <SectionTitle icon={RefreshCw} label="Renovação" accent="bg-sky-500/15 text-sky-400" />
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { lbl: "30d", val: data.renovacao.d30, c: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
                    { lbl: "15d", val: data.renovacao.d15, c: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
                    { lbl: "7d",  val: data.renovacao.d7,  c: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
                    { lbl: "3d",  val: data.renovacao.d3,  c: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
                  ].map((r) => (
                    <div key={r.lbl} className={`rounded-2xl border ${r.c} p-3 text-center`}>
                      <p className="text-2xl font-display font-semibold">{r.val}</p>
                      <p className="text-[10px] uppercase tracking-wider font-body mt-0.5">{r.lbl}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* FINANCEIRO */}
            <section>
              <SectionTitle icon={DollarSign} label="Financeiro" accent="bg-emerald-500/15 text-emerald-400" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Stat icon={DollarSign} label="Receita do mês" value={fmtBRL(data.financeiro.receita_mes)} accent="text-emerald-400" />
                <Stat icon={DollarSign} label="Receita do ano" value={fmtBRL(data.financeiro.receita_ano)} accent="text-emerald-400" />
                <Stat icon={TrendingUp} label="Ticket médio" value={fmtBRL(data.financeiro.ticket_medio)} />
              </div>
              {data.financeiro.por_plano.length > 0 && (
                <Card className="bg-black/40 border-border/40 backdrop-blur-xl mt-3">
                  <CardHeader><CardTitle className="text-sm">Receita por plano (30d)</CardTitle></CardHeader>
                  <CardContent style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.financeiro.por_plano}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtBRL(v)} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-sm">Receita (30d)</CardTitle></CardHeader>
                <CardContent style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series.receita_30d}>
                      <defs>
                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => fmtBRL(v)} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#gRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-sm">Leads (30d)</CardTitle></CardHeader>
                <CardContent style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.series.leads_30d}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-sm">Conversões (30d)</CardTitle></CardHeader>
                <CardContent style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.series.conversoes_30d}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* INTELIGÊNCIA */}
            <section>
              <SectionTitle icon={Sparkles} label="Inteligência" accent="bg-violet-500/15 text-violet-400" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-sm">Assuntos recorrentes</CardTitle></CardHeader>
                  <CardContent>
                    {data.inteligencia.top_intents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem dados nos últimos 30d.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.inteligencia.top_intents.map((i) => (
                          <li key={i.intent} className="flex justify-between text-sm">
                            <span className="capitalize">{i.intent}</span>
                            <Badge variant="outline">{i.count}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-sm">Templates mais usados</CardTitle></CardHeader>
                  <CardContent>
                    {data.inteligencia.top_templates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem templates ativos.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.inteligencia.top_templates.map((t) => (
                          <li key={t.name} className="flex justify-between text-sm">
                            <span className="truncate pr-2">{t.name}</span>
                            <Badge variant="outline">{t.uses}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-sm">Maior conversão</CardTitle></CardHeader>
                  <CardContent>
                    {data.inteligencia.top_conversao_templates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem conversões registradas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.inteligencia.top_conversao_templates.map((t) => (
                          <li key={t.name} className="flex justify-between text-sm">
                            <span className="truncate pr-2">{t.name}</span>
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">{t.success}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}