import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Droplets, Zap, Activity, Scale } from "lucide-react";

interface Props {
  profile: {
    weight?: number | null;
    bmr?: number | null;
    tdee?: number | null;
    daily_calories?: number | null;
    protein_g?: number | null;
    carbs_g?: number | null;
    fat_g?: number | null;
    updated_at?: string;
  };
}

const EvolutionMacroDisplay = ({ profile }: Props) => {
  const hasMacros = profile.bmr && profile.tdee && profile.daily_calories;
  if (!hasMacros) return null;

  const lastUpdate = profile.updated_at
    ? new Date(profile.updated_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Seus Macros Atuais
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Valores recalculados automaticamente com base no seu peso atual.
          {lastUpdate && <> — Última atualização: <strong>{lastUpdate}</strong></>}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <MacroCard icon={<Scale className="w-4 h-4" />} label="Peso" value={`${Number(profile.weight).toFixed(1)} kg`} color="text-foreground" />
          <MacroCard icon={<Flame className="w-4 h-4" />} label="TMB" value={`${profile.bmr} kcal`} color="text-destructive" />
          <MacroCard icon={<Zap className="w-4 h-4" />} label="TDEE" value={`${profile.tdee} kcal`} color="text-warning" />
          <MacroCard icon={<Activity className="w-4 h-4" />} label="Meta Calórica" value={`${profile.daily_calories} kcal`} color="text-primary" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MacroCard icon={<Droplets className="w-4 h-4" />} label="Proteína" value={`${profile.protein_g}g`} color="text-info" />
          <MacroCard icon={<Zap className="w-4 h-4" />} label="Carboidratos" value={`${profile.carbs_g}g`} color="text-success" />
          <MacroCard icon={<Flame className="w-4 h-4" />} label="Gordura" value={`${profile.fat_g}g`} color="text-warning" />
        </div>
      </CardContent>
    </Card>
  );
};

const MacroCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="bg-muted/50 rounded-lg p-3 text-center">
    <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-sm font-bold text-foreground">{value}</p>
  </div>
);

export default EvolutionMacroDisplay;
