import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useEvolutionStatus } from "@/hooks/useEvolutionStatus";

/**
 * Card resumido na Home do aluno informando o status do ciclo
 * de atualização (29 dias) com CTA direto para a tela de Atualização.
 */
const EvolutionUpdateStatusCard = () => {
  const { data, isLoading } = useEvolutionStatus();
  if (isLoading || !data) return null;

  // Não mostra quando está confortável (mais de 5 dias para vencer)
  if (data.status === "ok") return null;

  const config = {
    never: {
      icon: TrendingUp,
      label: "Primeira atualização",
      title: "Registre seu peso inicial",
      desc: "Comece agora para destravar o acompanhamento.",
      accent: "text-foreground",
    },
    approaching: {
      icon: Clock,
      label: `Faltam ${data.daysUntilNext} dia${data.daysUntilNext === 1 ? "" : "s"}`,
      title: "Sua próxima atualização está chegando",
      desc: "Prepare a balança e fotos atualizadas.",
      accent: "text-foreground",
    },
    due: {
      icon: CheckCircle2,
      label: "Atualização disponível",
      title: "Hora de atualizar sua evolução",
      desc: "Ciclo de 29 dias completo. Atualize agora.",
      accent: "text-foreground",
    },
    late: {
      icon: AlertCircle,
      label: `${Math.abs(data.daysUntilNext)} dias em atraso`,
      title: "Atualização pendente",
      desc: "Atualize peso e fotos para reajustar seus macros.",
      accent: "text-foreground",
    },
  }[data.status];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <Link to="/dashboard/evolution" className="block mb-6 group">
      <div className="rounded-3xl border border-foreground/30 bg-foreground/[0.04] p-5 flex items-center gap-4 hover:bg-foreground/[0.06] transition-colors">
        <div className="w-11 h-11 rounded-2xl bg-foreground/10 flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${config.accent}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-1.5">
            {config.label}
          </p>
          <p className="text-[14px] font-semibold text-foreground tracking-[-0.015em] truncate">
            {config.title}
          </p>
          <p className="text-[11px] text-muted-foreground font-light mt-0.5 tracking-tight truncate">
            {config.desc}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
      </div>
    </Link>
  );
};

export default EvolutionUpdateStatusCard;