import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BellOff, Dumbbell, Replace, History, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALERT_THRESHOLD_DAYS = 45;

type Entry = {
  source: "guided" | "manual";
  id: string;
  title: string;
  assigned_at: string;
  active: boolean;
  replaced_at: string | null;
  alert_silenced_at: string | null;
};

const daysBetween = (fromISO: string, toISO?: string) => {
  const from = new Date(fromISO).getTime();
  const to = toISO ? new Date(toISO).getTime() : Date.now();
  return Math.max(0, Math.floor((to - from) / (1000 * 60 * 60 * 24)));
};

type Props = {
  userId: string;
  onOpenAssign?: () => void;
};

export default function StudentWorkoutAlertCard({ userId, onOpenAssign }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["student-workout-history", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Entry[]> => {
      const [{ data: guided }, { data: manual }] = await Promise.all([
        supabase
          .from("student_workout_assignments")
          .select("id, template_id, assigned_at, active, replaced_at, alert_silenced_at")
          .eq("user_id", userId)
          .order("assigned_at", { ascending: false }),
        supabase
          .from("student_trainings")
          .select("id, title, created_at, start_date, end_date, is_active, replaced_at, alert_silenced_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const templateIds = (guided || []).map((g: any) => g.template_id).filter(Boolean);
      let templatesById: Record<string, string> = {};
      if (templateIds.length) {
        const { data: templates } = await supabase
          .from("workout_templates")
          .select("id, name")
          .in("id", templateIds);
        (templates || []).forEach((t: any) => { templatesById[t.id] = t.name; });
      }

      const list: Entry[] = [
        ...(guided || []).map((g: any) => ({
          source: "guided" as const,
          id: g.id,
          title: templatesById[g.template_id] || "Treino guiado",
          assigned_at: g.assigned_at,
          active: !!g.active,
          replaced_at: g.replaced_at,
          alert_silenced_at: g.alert_silenced_at,
        })),
        ...(manual || []).map((m: any) => ({
          source: "manual" as const,
          id: m.id,
          title: m.title || "Treino",
          assigned_at: m.start_date || m.created_at,
          active: !!m.is_active,
          replaced_at: m.replaced_at,
          alert_silenced_at: m.alert_silenced_at,
        })),
      ];

      return list.sort((a, b) => (a.assigned_at > b.assigned_at ? -1 : 1));
    },
  });

  const current = useMemo(() => entries.find((e) => e.active) || null, [entries]);
  const history = useMemo(() => entries.filter((e) => !e.active).slice(0, 10), [entries]);

  const days = current ? daysBetween(current.assigned_at) : 0;
  const shouldAlert = !!current && days >= ALERT_THRESHOLD_DAYS;
  const silenced = !!current?.alert_silenced_at;

  const silenceMutation = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("Sem treino ativo");
      const table = current.source === "guided" ? "student_workout_assignments" : "student_trainings";
      const { error } = await supabase
        .from(table)
        .update({ alert_silenced_at: new Date().toISOString(), alert_silenced_by: user?.id ?? null })
        .eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta silenciado — segue visível na ficha do aluno.");
      qc.invalidateQueries({ queryKey: ["student-workout-history", userId] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao silenciar"),
  });

  const unsilenceMutation = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("Sem treino ativo");
      const table = current.source === "guided" ? "student_workout_assignments" : "student_trainings";
      const { error } = await supabase
        .from(table)
        .update({ alert_silenced_at: null, alert_silenced_by: null })
        .eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta reativado");
      qc.invalidateQueries({ queryKey: ["student-workout-history", userId] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 p-4 text-xs text-muted-foreground">
        Carregando histórico de treinos…
      </div>
    );
  }

  if (!current && history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Dumbbell className="w-4 h-4" />
        Nenhum treino atribuído a este aluno ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {current && (
        <div
          className={cn(
            "rounded-2xl border p-4 transition-all",
            shouldAlert && !silenced && "border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-[0_8px_28px_-14px_rgba(245,158,11,0.55)]",
            shouldAlert && silenced && "border-amber-500/40 bg-amber-500/5",
            !shouldAlert && "border-border/60 bg-muted/30"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                shouldAlert ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"
              )}
            >
              {shouldAlert ? <AlertTriangle className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold truncate">{current.title}</p>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {current.source === "guided" ? "Guiado" : "Manual"}
                </Badge>
                {shouldAlert && (
                  <Badge
                    className={cn(
                      "text-[10px] uppercase tracking-wider",
                      silenced
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-amber-500 text-white hover:bg-amber-500"
                    )}
                  >
                    {silenced ? "Alerta silenciado" : "Trocar treino"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atribuído há <span className="font-semibold text-foreground">{days} dias</span>
                {" · desde "}
                {new Date(current.assigned_at).toLocaleDateString("pt-BR")}
              </p>
              {shouldAlert && (
                <p className="text-[12px] mt-2 leading-relaxed text-amber-700 dark:text-amber-300">
                  Este treino já passou de {ALERT_THRESHOLD_DAYS} dias — recomendado avaliar troca para novo estímulo.
                  {silenced && " (alerta silenciado, mas continua visível.)"}
                </p>
              )}
            </div>
          </div>

          {shouldAlert && (
            <div className="flex flex-wrap gap-2 mt-3">
              {onOpenAssign && (
                <Button size="sm" onClick={onOpenAssign} className="h-8 gap-1.5">
                  <Replace className="w-3.5 h-3.5" /> Trocar treino
                </Button>
              )}
              {!silenced ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => silenceMutation.mutate()}
                  disabled={silenceMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  <BellOff className="w-3.5 h-3.5" /> Silenciar alerta
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unsilenceMutation.mutate()}
                  disabled={unsilenceMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reativar alerta
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <details className="rounded-xl border border-border/50 bg-background/50">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Histórico ({history.length})
          </summary>
          <ul className="divide-y divide-border/40">
            {history.map((h) => {
              const durationDays = daysBetween(h.assigned_at, h.replaced_at ?? undefined);
              return (
                <li key={`${h.source}-${h.id}`} className="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{h.title}</p>
                    <p className="text-muted-foreground">
                      {new Date(h.assigned_at).toLocaleDateString("pt-BR")}
                      {h.replaced_at && ` → ${new Date(h.replaced_at).toLocaleDateString("pt-BR")}`}
                      {` · ${durationDays} dias`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {h.source === "guided" ? "Guiado" : "Manual"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}