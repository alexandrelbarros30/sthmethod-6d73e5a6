import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Flame, Users, RefreshCw, AlertTriangle, Clock, DollarSign, Brain, Sparkles } from "lucide-react";

export default function AdminSthAutomation() {
  const { data: stats } = useQuery({
    queryKey: ["sth-automation-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sth_automation_dashboard");
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 30000,
  });

  const { data: events } = useQuery({
    queryKey: ["sth-auto-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sth_auto_events")
        .select("id, phone, classification, intent, decision, action_taken, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const alerts = stats?.alertas || {};

  const kpis = [
    { label: "Alunos Ativos", value: stats?.alunos_ativos ?? 0, icon: Users },
    { label: "Leads Quentes", value: stats?.leads_quentes ?? 0, icon: Flame },
    { label: "Conversões 30d", value: stats?.conversoes_30d ?? 0, icon: Sparkles },
    { label: "Renovações próximas", value: stats?.renovacoes_proximas ?? 0, icon: RefreshCw },
    { label: "Atendimentos abertos", value: stats?.atendimentos_abertos ?? 0, icon: Activity },
    { label: "Tempo médio (ms)", value: stats?.tempo_medio_resposta_ms ?? 0, icon: Clock },
    { label: "Receita 30d", value: `R$ ${Number(stats?.receita_30d ?? 0).toFixed(0)}`, icon: DollarSign },
    { label: "Eventos 24h", value: stats?.eventos_24h ?? 0, icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">STH Automation Engine</h1>
        <p className="text-sm text-muted-foreground">
          Organismo operacional — identifica, classifica, registra, converte e retém.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/40 bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-semibold">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Alertas operacionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="🔥 Leads quentes" value={alerts.leads_quentes ?? 0} />
            <Row label="🔥 Sem atualização" value={alerts.sem_atualizacao ?? 0} />
            <Row label="🔥 Renovações" value={alerts.renovacoes ?? 0} />
            <Row label="🔥 Atendimento parado" value={alerts.atendimento_parado ?? 0} />
            <Row label="🔥 Risco de evasão" value={alerts.risco_evasao ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-96 overflow-auto">
            {(events || []).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-xs border-b border-border/30 py-1.5">
                <div className="min-w-0">
                  <p className="font-mono truncate">{e.phone}</p>
                  <p className="text-muted-foreground truncate">
                    {e.classification || "—"} · {e.intent || "—"} · {e.action_taken || e.decision}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {new Date(e.created_at).toLocaleTimeString()}
                </Badge>
              </div>
            ))}
            {!events?.length && <p className="text-xs text-muted-foreground">Nenhum evento ainda.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}