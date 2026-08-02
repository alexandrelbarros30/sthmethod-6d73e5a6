import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight, Check, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiGeneration } from "@/hooks/useAiApp";

interface Props {
  workout: AiGeneration | null;
  done: boolean;
  /** Data (ISO) do check-in em que o treino foi marcado como realizado. */
  doneAt?: string | null;
  onDone: () => void;
  onUndo?: () => void;
}

/** Lembrete de treino do dia — leva ao treino guiado e permite marcar como realizado. */
const AiWorkoutReminderCard = ({ workout, done, doneAt, onDone, onUndo }: Props) => {
  const navigate = useNavigate();
  const doneLabel = doneAt ? doneAt.split("-").reverse().join("/") : null;

  return (
    <div className="group relative col-span-2 flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:border-ocean-teal/40 sm:rounded-[2rem] sm:p-5 lg:col-span-3 lg:p-6">
      <div
        className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-ocean-mint/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-mint/15 px-2.5 py-1 font-urbanist text-[10px] font-bold uppercase tracking-[0.18em] text-ocean-teal">
          <Dumbbell className="h-3 w-3" /> Treino de hoje
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            done ? "bg-ocean-teal/15 text-ocean-teal" : "bg-muted text-muted-foreground"
          }`}
        >
          {done ? "Realizado" : "Pendente"}
        </span>
      </div>

      <div className="relative mt-4">
        <p className="font-urbanist text-lg font-bold leading-tight tracking-tight text-ocean-deep sm:text-xl">
          {workout ? (done ? "Treino concluído" : "Hora de treinar") : "Nenhum treino ativo"}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {workout
            ? done
              ? `Excelente. Registrado no seu histórico${doneLabel ? ` em ${doneLabel}` : ""}.`
              : "Abra seu programa guiado, use o cronômetro e execute a sessão do dia."
            : "Gere seu treino inteligente para receber lembretes diários."}
        </p>
      </div>

      <div className="relative mt-5 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center">
        <Button
          className="w-full gap-2 bg-ocean-deep font-urbanist font-bold text-primary-foreground hover:bg-ocean-mid min-[380px]:flex-1"
          onClick={() => navigate("/ai/app/treino")}
        >
          {workout ? "Ir para o treino" : "Gerar treino"} <ArrowRight className="h-4 w-4" />
        </Button>
        {done ? (
          <Button variant="secondary" className="w-full gap-1.5 min-[380px]:w-auto" onClick={onUndo}>
            <RotateCcw className="h-4 w-4" /> Desfazer
          </Button>
        ) : (
          <Button variant="outline" className="w-full gap-1.5 min-[380px]:w-auto" onClick={onDone}>
            <Check className="h-4 w-4" /> Realizado
          </Button>
        )}
      </div>

      <Link
        to="/ai/app/treino/historico"
        className="relative mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <History className="h-3.5 w-3.5" /> Ver histórico de treinos
      </Link>
    </div>
  );
};

export default AiWorkoutReminderCard;
