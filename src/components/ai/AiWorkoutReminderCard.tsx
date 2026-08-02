import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiGeneration } from "@/hooks/useAiApp";

interface Props {
  workout: AiGeneration | null;
  done: boolean;
  onDone: () => void;
}

/** Lembrete de treino do dia — leva ao treino guiado e permite marcar como realizado. */
const AiWorkoutReminderCard = ({ workout, done, onDone }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="group relative col-span-2 flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-5 transition-all duration-300 hover:border-primary/40 lg:col-span-3 lg:p-6">
      <div
        className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Dumbbell className="h-3 w-3" /> Treino de hoje
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {done ? "Realizado" : "Pendente"}
        </span>
      </div>

      <div className="relative mt-4">
        <p className="text-lg font-semibold leading-tight tracking-tight sm:text-xl">
          {workout ? (done ? "Treino concluído" : "Hora de treinar") : "Nenhum treino ativo"}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {workout
            ? done
              ? "Excelente. Sua constância de hoje já está registrada."
              : "Abra seu programa guiado, use o cronômetro e execute a sessão do dia."
            : "Gere seu treino inteligente para receber lembretes diários."}
        </p>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <Button className="flex-1 gap-2" onClick={() => navigate("/ai/app/treino")}>
          {workout ? "Ir para o treino" : "Gerar treino"} <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant={done ? "secondary" : "outline"} className="gap-1.5" disabled={done} onClick={onDone}>
          <Check className="h-4 w-4" /> {done ? "Feito" : "Realizado"}
        </Button>
      </div>
    </div>
  );
};

export default AiWorkoutReminderCard;
