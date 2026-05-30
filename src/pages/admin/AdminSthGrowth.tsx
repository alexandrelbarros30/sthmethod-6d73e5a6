import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, AlertTriangle, RefreshCw, Crown, DollarSign, Users, Target } from "lucide-react";

interface GrowthData {
  conversao: { frio: number; morno: number; quente: number; pronto: number; taxa_30d: number };
  retencao: { baixo_risco: number; medio_risco: number; alto_risco: number };
  renovacao: { d30: number; d15: number; d7: number; d3: number; d1: number; vencidos_7d: number };
  vip: Array<{ user_id: string; full_name: string; updates: number; renewals: number; score: number }>;
  kpis: {
    leads_quentes: number; risco_evasao: number; renovacoes_proximas: number;
    conversoes_30d: number; receita_30d: number; receita_7d: number;
    alunos_ativos: number; taxa_retencao: number;
  };
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const Kpi = ({ icon: Icon, label, value, accent }: any) => (
  <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
          <p className="text-2xl font-display font-semibold mt-1.5">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Bar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-body">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function AdminSthGrowth() {
  const { data, isLoading } = useQuery({
    queryKey: ["sth-growth-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sth_growth_dashboard" as any);
      if (error) throw error;
      return data as unknown as GrowthData;
    },
    refetchInterval: 60_000,
  });

  const totalConv = (data?.conversao.frio || 0) + (data?.conversao.morno || 0) + (data?.conversao.quente || 0) + (data?.conversao.pronto || 0);
  const totalRet = (data?.retencao.baixo_risco || 0) + (data?.retencao.medio_risco || 0) + (data?.retencao.alto_risco || 0);

  return (
    <DashboardLayout role="admin" title="STH Growth Center">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">STH Growth Center</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            Radares de conversão, retenção, renovação e VIP — dados em ação automática.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando radares...</p>
        ) : !data ? (
          <p className="text-sm text-rose-400">Falha ao carregar dados.</p>
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi icon={Flame} label="Leads quentes" value={data.kpis.leads_quentes} accent="bg-rose-500/15 text-rose-400" />
              <Kpi icon={AlertTriangle} label="Risco evasão" value={data.kpis.risco_evasao} accent="bg-amber-500/15 text-amber-400" />
              <Kpi icon={RefreshCw} label="Renov. próximas" value={data.kpis.renovacoes_proximas} accent="bg-sky-500/15 text-sky-400" />
              <Kpi icon={Target} label="Conversões 30d" value={data.kpis.conversoes_30d} accent="bg-emerald-500/15 text-emerald-400" />
              <Kpi icon={Users} label="Alunos ativos" value={data.kpis.alunos_ativos} accent="bg-violet-500/15 text-violet-400" />
              <Kpi icon={TrendingUp} label="Retenção" value={`${data.kpis.taxa_retencao}%`} accent="bg-emerald-500/15 text-emerald-400" />
              <Kpi icon={DollarSign} label="Receita 7d" value={fmtBRL(data.kpis.receita_7d)} accent="bg-emerald-500/15 text-emerald-400" />
              <Kpi icon={DollarSign} label="Receita 30d" value={fmtBRL(data.kpis.receita_30d)} accent="bg-emerald-500/15 text-emerald-400" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Radar Conversão */}
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    Radar de Conversão
                    <Badge variant="outline" className="ml-auto text-[10px]">Taxa 30d: {data.conversao.taxa_30d}%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="🔥 Pronto p/ compra" value={data.conversao.pronto} total={totalConv} color="bg-emerald-500" />
                  <Bar label="🌡️ Quente" value={data.conversao.quente} total={totalConv} color="bg-rose-500" />
                  <Bar label="☁️ Morno" value={data.conversao.morno} total={totalConv} color="bg-amber-500" />
                  <Bar label="❄️ Frio" value={data.conversao.frio} total={totalConv} color="bg-sky-500" />
                </CardContent>
              </Card>

              {/* Radar Retenção */}
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Radar de Retenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="✅ Baixo risco" value={data.retencao.baixo_risco} total={totalRet} color="bg-emerald-500" />
                  <Bar label="⚠️ Médio risco" value={data.retencao.medio_risco} total={totalRet} color="bg-amber-500" />
                  <Bar label="🚨 Alto risco" value={data.retencao.alto_risco} total={totalRet} color="bg-rose-500" />
                  <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/30 font-body">
                    Calculado pela frequência de atualizações (peso/medidas) dos últimos 45 dias.
                  </p>
                </CardContent>
              </Card>

              {/* Radar Renovação */}
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                    Radar de Renovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { lbl: "30d", val: data.renovacao.d30, c: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
                      { lbl: "15d", val: data.renovacao.d15, c: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
                      { lbl: "7d",  val: data.renovacao.d7,  c: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
                      { lbl: "3d",  val: data.renovacao.d3,  c: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
                      { lbl: "1d",  val: data.renovacao.d1,  c: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
                    ].map((r) => (
                      <div key={r.lbl} className={`rounded-2xl border ${r.c} p-3 text-center`}>
                        <p className="text-2xl font-display font-semibold">{r.val}</p>
                        <p className="text-[10px] uppercase tracking-wider font-body mt-0.5">{r.lbl}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 font-body">
                    Vencidos últimos 7 dias: <span className="text-rose-400 font-medium">{data.renovacao.vencidos_7d}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Radar VIP */}
              <Card className="bg-black/40 border-border/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Radar VIP
                    <Badge variant="outline" className="ml-auto text-[10px]">{data.vip.length} alunos</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.vip.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-body">Nenhum aluno VIP identificado ainda.</p>
                  ) : (
                    <ul className="space-y-2 max-h-72 overflow-y-auto">
                      {data.vip.slice(0, 10).map((v) => (
                        <li key={v.user_id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{v.full_name || "Aluno"}</p>
                            <p className="text-[11px] text-muted-foreground font-body">
                              {v.updates} updates · {v.renewals} renov.
                            </p>
                          </div>
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 shrink-0">
                            {v.score}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}