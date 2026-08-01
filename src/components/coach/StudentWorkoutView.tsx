import { useState } from "react";
import { Dumbbell, PlayCircle, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatDate = (d?: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR") : null;

const groupLabel = (t?: string | null) =>
  t === "biset" ? "Bi-set" : t === "triset" ? "Tri-set" : null;

interface Props {
  program: any;
  workouts: any[];
  exercises: any[];
  endDate?: string | null;
}

const StudentWorkoutView = ({ program, workouts, exercises, endDate }: Props) => {
  const [media, setMedia] = useState<any | null>(null);
  if (!program) return null;

  return (
    <div>
      <Card className="p-5 rounded-2xl border-border/60">
        <p className="text-[16px] font-semibold tracking-[-0.025em]">{program.name}</p>
        <p className="text-[12px] text-muted-foreground font-light mt-1">
          {program.goal || "Programa de treino"} · {program.weeks} semanas
          {endDate ? ` · até ${formatDate(endDate)}` : ""}
        </p>
        {program.description && (
          <p className="text-[13px] text-muted-foreground font-light mt-3 leading-relaxed">{program.description}</p>
        )}
      </Card>

      <div className="mt-3 space-y-3">
        {workouts.map((w: any) => {
          const exs = exercises.filter((e: any) => e.workout_id === w.id);
          return (
            <Card key={w.id} className="p-5 rounded-2xl border-border/60">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold tracking-[-0.02em]">{w.name}</p>
                {w.day_label && <Badge variant="secondary" className="text-[10px] font-normal">{w.day_label}</Badge>}
                <span className="ml-auto text-[11px] text-muted-foreground">{exs.length} exercícios</span>
              </div>
              {w.notes && <p className="text-[12px] text-muted-foreground font-light mt-1.5">{w.notes}</p>}

              <div className="mt-3 space-y-2">
                {exs.map((ex: any, i: number) => {
                  const grouped = ex.group_type && ex.group_type !== "single";
                  const prev = exs[i - 1];
                  const startsGroup = grouped && (!prev || prev.group_key !== ex.group_key);
                  const nextSame = grouped && exs[i + 1]?.group_key === ex.group_key;
                  return (
                    <div key={ex.id}>
                      {startsGroup && (
                        <p className="text-[10px] uppercase tracking-[0.14em] text-primary/80 mb-1 ml-1">
                          {groupLabel(ex.group_type)} — sem descanso entre os exercícios
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => (ex.media_url || ex.thumb_url) && setMedia(ex)}
                        className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                          grouped ? "border-primary/25 bg-primary/[0.03]" : "border-border/50"
                        } ${ex.media_url || ex.thumb_url ? "hover:bg-muted/50" : ""}`}
                      >
                        {ex.thumb_url ? (
                          <img src={ex.thumb_url} alt={ex.name} loading="lazy" className="h-12 w-16 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-muted flex items-center justify-center">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium truncate">{ex.name}</p>
                          <p className="text-[12px] text-muted-foreground font-light">
                            {ex.sets} × {ex.reps}
                            {ex.load_text ? ` · ${ex.load_text}` : ""}
                          </p>
                          {ex.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{ex.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          {ex.media_url && <PlayCircle className="h-4 w-4 text-primary ml-auto mb-1" />}
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                            <Timer className="h-3 w-3" /> {nextSame ? "0s" : `${ex.rest_seconds}s`}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
                {!exs.length && (
                  <p className="text-[12px] text-muted-foreground font-light">Sem exercícios cadastrados.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!media} onOpenChange={(o) => !o && setMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="text-[15px]">{media?.name}</DialogTitle></DialogHeader>
          {media && (
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              {/\.(mp4|webm|mov)(\?|$)/i.test(media.media_url || "") ? (
                <video src={media.media_url} controls playsInline className="w-full h-full object-contain" />
              ) : /youtube|vimeo|player\./i.test(media.media_url || "") ? (
                <iframe src={media.media_url} title={media.name} allowFullScreen className="w-full h-full" />
              ) : (
                <img src={media.media_url || media.thumb_url} alt={media.name} className="w-full h-full object-contain" />
              )}
            </div>
          )}
          <p className="text-[12px] text-muted-foreground font-light">
            {media?.sets} × {media?.reps}
            {media?.load_text ? ` · ${media.load_text}` : ""} · descanso {media?.rest_seconds}s
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentWorkoutView;
