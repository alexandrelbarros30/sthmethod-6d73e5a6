import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAiProgress, todayISO } from "@/hooks/useAiProgress";
import { CalendarCheck, Dumbbell, Loader2, RotateCcw, Salad, Droplets, Flame } from "lucide-react";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

const weekday = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });

/** Histórico detalhado dos treinos: datas, sessões concluídas e opção de desfazer. */
export default function AiWorkoutHistory() {
  const { user, loading, checkins, streak, setWorkoutDone } = useAiProgress();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/ai/login?next=/ai/app/treino/historico");
  }, [loading, user, navigate]);

  const done = useMemo(() => checkins.filter((c) => c.workout_done), [checkins]);
  const thisMonth = useMemo(
    () => done.filter((c) => c.checkin_date.slice(0, 7) === todayISO().slice(0, 7)).length,
    [done],
  );

  async function undo(dateISO: string) {
    setBusy(dateISO);
    try {
      await setWorkoutDone(dateISO, false);
      toast.success(`Treino de ${fmt(dateISO)} desmarcado.`);
    } catch {
      toast.error("Não foi possível atualizar o histórico.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AiShell title="Histórico de treinos" subtitle="Datas, sessões concluídas e ajuste dos registros.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Dumbbell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-none">{done.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">treinos registrados</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-none">{thisMonth}</p>
            <p className="mt-1 text-xs text-muted-foreground">no mês atual</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-none">{streak}</p>
            <p className="mt-1 text-xs text-muted-foreground">dias seguidos de check-in</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold">Sessões concluídas</h2>
        {done.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum treino marcado como realizado ainda. Ao concluir a sessão do dia, ela aparece aqui com a data.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/40">
            {done.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {fmt(c.checkin_date)}
                    {c.checkin_date === todayISO() && (
                      <Badge variant="secondary" className="ml-2 align-middle">Hoje</Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">{weekday(c.checkin_date)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Dumbbell className="h-3 w-3" /> Treino
                  </Badge>
                  {c.diet_done && (
                    <Badge variant="outline" className="gap-1">
                      <Salad className="h-3 w-3" /> Dieta
                    </Badge>
                  )}
                  {c.water_done && (
                    <Badge variant="outline" className="gap-1">
                      <Droplets className="h-3 w-3" /> Hidratação
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    disabled={busy === c.checkin_date}
                    onClick={() => undo(c.checkin_date)}
                  >
                    {busy === c.checkin_date ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Desfazer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AiShell>
  );
}