import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, Utensils, Dumbbell, Droplets, Sparkles, ChevronRight } from "lucide-react";

interface Props {
  nextMeal: { name: string; time: string; id: string } | null;
  isMealCompleted: (id: string) => boolean;
  waterConsumedMl: number;
  waterGoalL: number;
  hasTraining: boolean;
}

// Escolhe a "ação do dia" com base no horário e no estado atual do aluno.
// Ordem de prioridade: próxima refeição não concluída dentro de janela → treino → hidratação → estímulo geral.
const DailyHeroCard = ({ nextMeal, isMealCompleted, waterConsumedMl, waterGoalL, hasTraining }: Props) => {
  const action = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const waterPct = waterGoalL > 0 ? (waterConsumedMl / (waterGoalL * 1000)) * 100 : 100;

    // 1) Próxima refeição pendente
    if (nextMeal && !isMealCompleted(nextMeal.id)) {
      const [h, m] = (nextMeal.time || "00:00").split(":").map(Number);
      const mealMin = (h || 0) * 60 + (m || 0);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const diff = mealMin - nowMin;
      let label = "";
      if (diff > 60) label = `em ${Math.round(diff / 60)}h`;
      else if (diff > 0) label = `em ${diff}min`;
      else if (diff > -30) label = "agora";
      else label = `atrasada ${Math.abs(Math.round(diff / 60))}h`;
      return {
        eyebrow: "Agora",
        icon: Utensils,
        title: `${nextMeal.name} · ${label}`,
        sub: `Prevista para ${nextMeal.time}`,
        cta: "Marcar refeição",
        href: "/dashboard/diet",
      };
    }

    // 2) Treino do dia (janela 6h-11h ou 15h-21h)
    if (hasTraining && ((hour >= 6 && hour < 11) || (hour >= 15 && hour < 21))) {
      return {
        eyebrow: "Hoje",
        icon: Dumbbell,
        title: "Seu treino te espera",
        sub: "Ative o cronômetro e mantenha o ritmo.",
        cta: "Iniciar treino",
        href: "/dashboard/training",
      };
    }

    // 3) Hidratação abaixo do esperado pro horário do dia
    const expected = Math.min(100, ((hour - 6) / 15) * 100); // 6h→0%, 21h→100%
    if (waterGoalL > 0 && waterPct < expected - 15) {
      return {
        eyebrow: "Atenção",
        icon: Droplets,
        title: "Você está atrás na hidratação",
        sub: `${Math.round(waterPct)}% da meta · beba um copo agora.`,
        cta: "Registrar água",
        href: "/dashboard/diet",
      };
    }

    // 4) Estímulo geral
    return {
      eyebrow: hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite",
      icon: Sparkles,
      title: "Tudo em dia por aqui",
      sub: "Continue firme — cada escolha conta.",
      cta: "Ver progresso",
      href: "/dashboard/evolution",
    };
  }, [nextMeal, isMealCompleted, waterConsumedMl, waterGoalL, hasTraining]);

  const Icon = action.icon;
  return (
    <Link to={action.href} className="block mb-6 group">
      <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-foreground/[0.04] via-background to-background overflow-hidden relative">
        <div className="p-6 flex items-center gap-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg shadow-foreground/10 group-hover:scale-105 transition-transform">
            <Icon className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {action.eyebrow}
            </p>
            <h2 className="text-[18px] font-semibold text-foreground tracking-[-0.02em] leading-tight mt-1.5 truncate">
              {action.title}
            </h2>
            <p className="text-[12px] text-muted-foreground font-light mt-1 truncate">{action.sub}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[12px] font-medium text-foreground">
            <span className="hidden sm:inline">{action.cta}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DailyHeroCard;