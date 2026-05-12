import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BodySilhouette from "@/components/shared/BodySilhouette";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Droplets, Flame, Scale, Heart, Brain, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CircumferenceTracker from "@/components/student/CircumferenceTracker";
import EvolutionComparison from "@/components/shared/EvolutionComparison";
import EvolutionCharts from "@/components/shared/EvolutionCharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

interface Props {
  userId?: string; // if not provided, uses logged-in user
}

const COLORS = {
  fat: "#ff3355",
  lean: "#14b780",
  muscle: "#0e9468",
  water: "#1ed094",
  visceral: "#ff5566",
  bmr: "#ffaa33",
};

const StudentBioimpedancePanel = ({ userId: propUserId }: Props) => {
  const { user } = useAuth();
  const userId = propUserId || user?.id;

  const { data: logs } = useQuery({
    queryKey: ["bioimpedance-logs", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bioimpedance_logs")
        .select("*")
        .eq("user_id", userId!)
        .order("logged_at", { ascending: true })
        .limit(50);
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  const { data: profile } = useQuery({
    queryKey: ["bio-profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, weight, height, birth_date, gender, objective, physical_activity_level, bmr, tdee, daily_calories, protein_g, carbs_g, fat_g")
        .eq("user_id", userId!)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const latest = logs && logs.length > 0 ? logs[logs.length - 1] : null;
  const previous = logs && logs.length > 1 ? logs[logs.length - 2] : null;

  // Peso "atual" do aluno = profile.weight (sempre o mais recente, atualizado nas evoluções).
  // O peso da bioimpedância (latest.total_weight) é o registrado na avaliação.
  const currentWeight = profile?.weight != null ? Number(profile.weight) : (latest?.total_weight ? Number(latest.total_weight) : null);
  const bioWeight = latest?.total_weight ? Number(latest.total_weight) : null;

  const compositionData = useMemo(() => {
    if (!latest) return [];
    const items = [];
    if (latest.fat_mass_kg) items.push({ name: "Gordura", value: Number(latest.fat_mass_kg), color: "#ff3355" });
    if (latest.skeletal_muscle_kg) items.push({ name: "Músculo Esquelético", value: Number(latest.skeletal_muscle_kg), color: "#0e9468" });
    const otherLean = latest.lean_mass_kg && latest.skeletal_muscle_kg
      ? Number(latest.lean_mass_kg) - Number(latest.skeletal_muscle_kg)
      : latest.lean_mass_kg ? Number(latest.lean_mass_kg) : 0;
    if (otherLean > 0) items.push({ name: "Outros (ossos, órgãos)", value: otherLean, color: "rgba(100,120,140,0.6)" });
    return items;
  }, [latest]);

  const evolutionData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return logs.map((l: any) => ({
      date: new Date(l.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      peso: l.total_weight ? Number(l.total_weight) : null,
      gordura: l.body_fat_pct ? Number(l.body_fat_pct) : null,
      musculo: l.skeletal_muscle_kg ? Number(l.skeletal_muscle_kg) : null,
      agua: l.total_water_pct ? Number(l.total_water_pct) : null,
    }));
  }, [logs]);

  const segmentalData = useMemo(() => {
    if (!latest) return [];
    const items = [];
    if (latest.seg_left_arm != null) items.push({ name: "Braço E", value: Number(latest.seg_left_arm) });
    if (latest.seg_right_arm != null) items.push({ name: "Braço D", value: Number(latest.seg_right_arm) });
    if (latest.seg_trunk != null) items.push({ name: "Tronco", value: Number(latest.seg_trunk) });
    if (latest.seg_left_leg != null) items.push({ name: "Perna E", value: Number(latest.seg_left_leg) });
    if (latest.seg_right_leg != null) items.push({ name: "Perna D", value: Number(latest.seg_right_leg) });
    return items;
  }, [latest]);

  if (!logs || logs.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-8 text-center">
            <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação de bioimpedância registrada ainda.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Seu profissional registrará os dados da sua próxima avaliação aqui.
            </p>
          </CardContent>
        </Card>
        {!propUserId && <CircumferenceTracker />}
      </div>
    );
  }

  const delta = (curr: number | null, prev: number | null) => {
    if (curr == null || prev == null) return null;
    return Number((curr - prev).toFixed(1));
  };

  const DeltaIndicator = ({ value, inverted }: { value: number | null; inverted?: boolean }) => {
    if (value == null) return null;
    const positive = inverted ? value < 0 : value > 0;
    const negative = inverted ? value > 0 : value < 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${positive ? "text-emerald-500" : negative ? "text-red-500" : "text-muted-foreground"}`}>
        {value > 0 ? <TrendingUp className="w-3 h-3" /> : value < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {value > 0 ? "+" : ""}{value}
      </span>
    );
  };

  const chartConfig = {
    peso: { label: "Peso (kg)", color: "#14b780" },
    gordura: { label: "Gordura (%)", color: COLORS.fat },
    musculo: { label: "Músculo (kg)", color: COLORS.muscle },
    agua: { label: "Água (%)", color: COLORS.water },
  };

  return (
    <div className="space-y-4" style={{ ["--sth-green" as any]: "#14b780" }}>
      {/* Header — gamified premium */}
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">
          Bioimpedância
        </h2>
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground tabular-nums">
          {new Date(latest.logged_at).toLocaleDateString("pt-BR")}
          {logs.length > 1 && ` · ${logs.length}`}
        </span>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <MetricCard
          icon={<Scale className="w-4 h-4" />}
          label="Peso"
          value={currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "—"}
          delta={
            bioWeight != null && currentWeight != null && Math.abs(currentWeight - bioWeight) >= 0.1 ? (
              <span className="text-[9px] text-muted-foreground">avaliação: {bioWeight.toFixed(1)} kg</span>
            ) : (
              <DeltaIndicator value={delta(latest.total_weight, previous?.total_weight)} />
            )
          }
          color="text-foreground"
        />
        <MetricCard
          icon={<Flame className="w-4 h-4" />}
          label="Gordura"
          value={latest.body_fat_pct ? `${Number(latest.body_fat_pct).toFixed(1)}%` : "—"}
          delta={<DeltaIndicator value={delta(latest.body_fat_pct, previous?.body_fat_pct)} inverted />}
          color="text-destructive"
        />
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Massa Magra"
          value={latest.lean_mass_kg ? `${Number(latest.lean_mass_kg).toFixed(1)} kg` : "—"}
          delta={<DeltaIndicator value={delta(latest.lean_mass_kg, previous?.lean_mass_kg)} />}
          color="text-foreground"
        />
        <MetricCard
          icon={<Droplets className="w-4 h-4" />}
          label="Água"
          value={latest.total_water_pct ? `${Number(latest.total_water_pct).toFixed(1)}%` : "—"}
          delta={<DeltaIndicator value={delta(latest.total_water_pct, previous?.total_water_pct)} />}
          color="text-blue-500"
        />
      </div>

      {/* Second row metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Musc. Esquelética"
          value={latest.skeletal_muscle_kg ? `${Number(latest.skeletal_muscle_kg).toFixed(1)} kg` : "—"}
          delta={<DeltaIndicator value={delta(latest.skeletal_muscle_kg, previous?.skeletal_muscle_kg)} />}
          color="text-blue-600"
        />
        <MetricCard
          icon={<Flame className="w-4 h-4" />}
          label="TMB"
          value={latest.bmr_kcal ? `${Number(latest.bmr_kcal).toFixed(0)} kcal` : "—"}
          color="text-orange-500"
        />
        <MetricCard
          icon={<Brain className="w-4 h-4" />}
          label="Idade Metabólica"
          value={latest.metabolic_age ? `${latest.metabolic_age} anos` : "—"}
          color="text-purple-500"
        />
        <MetricCard
          icon={<Heart className="w-4 h-4" />}
          label="Gord. Visceral"
          value={latest.visceral_fat != null ? `${latest.visceral_fat}` : "—"}
          delta={<DeltaIndicator value={delta(latest.visceral_fat, previous?.visceral_fat)} inverted />}
          color="text-red-500"
        />
      </div>

      {/* Phase angle & water detail */}
      {(latest.phase_angle || latest.intracellular_water_l || latest.extracellular_water_l) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {latest.phase_angle && (
            <MetricCard icon={<Activity className="w-4 h-4" />} label="Ângulo de Fase" value={`${Number(latest.phase_angle).toFixed(2)}°`} color="text-emerald-500" />
          )}
          {latest.intracellular_water_l && (
            <MetricCard icon={<Droplets className="w-4 h-4" />} label="Água Intracelular" value={`${Number(latest.intracellular_water_l).toFixed(1)} L`} color="text-cyan-500" />
          )}
          {latest.extracellular_water_l && (
            <MetricCard icon={<Droplets className="w-4 h-4" />} label="Água Extracelular" value={`${Number(latest.extracellular_water_l).toFixed(1)} L`} color="text-teal-500" />
          )}
        </div>
      )}

      {/* Composition Pie Chart */}
      {compositionData.length > 0 && (
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-[color:var(--sth-green)]" />
              Composição Corporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 sm:w-48 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {compositionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}:</span>
                    <span className="font-bold">{item.value.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution Line Chart */}
      {evolutionData.length > 1 && (
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[color:var(--sth-green)]" />
              Evolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,183,128,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(20,183,128,0.15)" />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(20,183,128,0.15)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="peso" stroke="#14b780" strokeWidth={2} dot={{ r: 3, fill: '#14b780', stroke: '#14b780' }} connectNulls style={{ filter: 'drop-shadow(0 0 4px #14b78080)' }} />
                <Line type="monotone" dataKey="gordura" stroke={COLORS.fat} strokeWidth={2} dot={{ r: 3, fill: COLORS.fat, stroke: COLORS.fat }} connectNulls style={{ filter: `drop-shadow(0 0 4px ${COLORS.fat}80)` }} />
                <Line type="monotone" dataKey="musculo" stroke={COLORS.muscle} strokeWidth={2} dot={{ r: 3, fill: COLORS.muscle, stroke: COLORS.muscle }} connectNulls style={{ filter: `drop-shadow(0 0 4px ${COLORS.muscle}80)` }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Body Silhouette + or Segmental Bar Chart */}
      {(segmentalData.length > 0 || latest) && (
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[color:var(--sth-green)]" />
              Mapa Corporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Body silhouette */}
              <BodySilhouette
                segments={{
                  leftArm: latest?.seg_left_arm ? Number(latest.seg_left_arm) : null,
                  rightArm: latest?.seg_right_arm ? Number(latest.seg_right_arm) : null,
                  leftLeg: latest?.seg_left_leg ? Number(latest.seg_left_leg) : null,
                  rightLeg: latest?.seg_right_leg ? Number(latest.seg_right_leg) : null,
                  trunk: latest?.seg_trunk ? Number(latest.seg_trunk) : null,
                }}
                metrics={{
                  bodyFatPct: latest?.body_fat_pct ? Number(latest.body_fat_pct) : null,
                  leanMassKg: latest?.lean_mass_kg ? Number(latest.lean_mass_kg) : null,
                  fatMassKg: latest?.fat_mass_kg ? Number(latest.fat_mass_kg) : null,
                  skeletalMuscleKg: latest?.skeletal_muscle_kg ? Number(latest.skeletal_muscle_kg) : null,
                  totalWeight: latest?.total_weight ? Number(latest.total_weight) : null,
                  visceralFat: latest?.visceral_fat ? Number(latest.visceral_fat) : null,
                  totalWaterPct: latest?.total_water_pct ? Number(latest.total_water_pct) : null,
                }}
                gender={profile?.gender}
              />
              {/* Segmental bar chart */}
              {segmentalData.length > 0 && (
                <div className="flex-1 w-full min-w-0">
                  <ChartContainer
                    config={{ segmento: { label: "Valor", color: "#14b780" } }}
                    className="h-[200px] w-full"
                  >
                    <BarChart data={segmentalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,183,128,0.08)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(20,183,128,0.15)" />
                      <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(20,183,128,0.15)" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#14b780" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 6px #14b78060)' }} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration with profile health data */}
      {profile && (profile.bmr || profile.tdee || profile.daily_calories) && (
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[color:var(--sth-green)]" />
              Dados Integrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {profile.bmr && (
                <MiniStat label="TMB (Perfil)" value={`${profile.bmr} kcal`} />
              )}
              {profile.tdee && (
                <MiniStat label="TDEE" value={`${profile.tdee} kcal`} />
              )}
              {profile.daily_calories && (
                <MiniStat label="Meta Calórica" value={`${profile.daily_calories} kcal`} />
              )}
              {profile.protein_g && (
                <MiniStat label="Proteína" value={`${profile.protein_g}g`} />
              )}
              {profile.carbs_g && (
                <MiniStat label="Carboidratos" value={`${profile.carbs_g}g`} />
              )}
              {profile.fat_g && (
                <MiniStat label="Gordura" value={`${profile.fat_g}g`} />
              )}
            </div>
            {profile.objective && (
              <p className="text-xs text-muted-foreground mt-3">
                <span className="font-semibold">Objetivo:</span> {profile.objective}
              </p>
            )}
            {profile.physical_activity_level && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">Nível de Atividade:</span> {profile.physical_activity_level}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes from latest */}
      {latest.notes && (
        <Card className="rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-none">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold tracking-[0.2em] uppercase text-[10px] text-[color:var(--sth-green)]">Notas · </span>{latest.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {!propUserId && <CircumferenceTracker />}

      {/* Comparação de evolução + gráficos completos */}
      {userId && <EvolutionComparison userId={userId} />}
    </div>
  );
};

const MetricCard = ({
  icon, label, value, delta, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors rounded-2xl p-3 text-center border border-white/10 backdrop-blur-xl">
    <div className={`flex items-center justify-center gap-1 mb-1.5 ${color}`}>
      {icon}
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
    {delta && <div className="mt-1">{delta}</div>}
  </div>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center rounded-xl border border-white/10 bg-white/[0.02] py-2 px-2">
    <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">{label}</p>
    <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">{value}</p>
  </div>
);

export default StudentBioimpedancePanel;
