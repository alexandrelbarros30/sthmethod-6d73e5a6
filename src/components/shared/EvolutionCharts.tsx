import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";
import type { EvolutionSnapshot } from "@/lib/evolution-snapshot";

interface Props {
  userId: string;
}

const axisStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const gridStroke = "hsl(var(--border))";
const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 11,
  color: "hsl(var(--foreground))",
};

const EvolutionCharts = ({ userId }: Props) => {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["evolution-snapshots-charts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evolution_snapshots")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EvolutionSnapshot[];
    },
    enabled: !!userId,
  });

  const series = useMemo(
    () =>
      snapshots.map((s) => ({
        date: format(new Date(s.created_at), "dd/MM"),
        peso: s.weight ?? null,
        calorias: s.daily_calories ?? null,
        proteina: s.protein_g ?? null,
        carbo: s.carbs_g ?? null,
        gordura: s.fat_g ?? null,
        treino_dias: s.training_days_per_week ?? null,
        cardio_dias: s.cardio_days_per_week ?? null,
        treino_min: s.training_duration_minutes ?? null,
        cardio_min: s.cardio_duration_minutes ?? null,
        gordura_pct: s.body_fat_pct ?? null,
        massa_magra: s.lean_mass_kg ?? null,
        massa_gorda: s.fat_mass_kg ?? null,
      })),
    [snapshots]
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Carregando gráficos…</p>;
  }

  if (snapshots.length < 2) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        Os gráficos aparecem após 2 ou mais snapshots de evolução.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">Peso (kg)</CardTitle>
        </CardHeader>
        <CardContent className="h-[180px] pl-1 pr-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} domain={["auto", "auto"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">Calorias diárias (kcal)</CardTitle>
        </CardHeader>
        <CardContent className="h-[180px] pl-1 pr-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="calorias" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">Macros (g)</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] pl-1 pr-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" name="Proteína" dataKey="proteina" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" name="Carbo" dataKey="carbo" stroke="hsl(40, 90%, 55%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" name="Gordura" dataKey="gordura" stroke="hsl(140, 60%, 50%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">NEAT — dias/semana</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] pl-1 pr-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} domain={[0, 7]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar name="Treino" dataKey="treino_dias" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar name="Cardio" dataKey="cardio_dias" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-display">Bioimpedância</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] pl-1 pr-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis yAxisId="left" tick={axisStyle} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line yAxisId="right" type="monotone" name="% Gordura" dataKey="gordura_pct" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line yAxisId="left" type="monotone" name="Massa magra (kg)" dataKey="massa_magra" stroke="hsl(140, 60%, 50%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line yAxisId="left" type="monotone" name="Massa gorda (kg)" dataKey="massa_gorda" stroke="hsl(40, 90%, 55%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionCharts;