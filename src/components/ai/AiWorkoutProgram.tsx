import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import LazyVideoEmbed from "@/components/student/LazyVideoEmbed";
import { Dumbbell, Timer, Repeat } from "lucide-react";

type Row = { name: string; sets: string; reps: string; rest: string; note: string };
type Session = { title: string; rows: Row[] };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Extrai as sessões (Treino A, B, C...) e suas tabelas do markdown gerado pela IA. */
export function parseWorkoutSessions(markdown: string): Session[] {
  const lines = markdown.split("\n");
  const sessions: Session[] = [];
  let current: Session | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^#{2,4}\s*(.+)$/);
    if (heading) {
      const title = heading[1].replace(/[*_`]/g, "").trim();
      if (/^treino\b/i.test(title) || /^(dia|sess[aã]o)\b/i.test(title)) {
        current = { title, rows: [] };
        sessions.push(current);
      } else {
        current = null;
      }
      continue;
    }
    if (!current || !line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.replace(/[*`]/g, "").trim());
    if (cells.length < 2) continue;
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (/^exerc[ií]cio$/i.test(cells[0])) continue;
    current.rows.push({
      name: cells[0],
      sets: cells[1] ?? "",
      reps: cells[2] ?? "",
      rest: cells[3] ?? "",
      note: cells[4] ?? "",
    });
  }
  return sessions.filter((s) => s.rows.length > 0);
}

export default function AiWorkoutProgram({ content }: { content: string }) {
  const sessions = useMemo(() => parseWorkoutSessions(content), [content]);

  const { data: library } = useQuery({
    queryKey: ["ai-workout-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("id, name, muscle_group, video_url, image_url, description");
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const index = useMemo(() => {
    const map = new Map<string, any>();
    for (const ex of library ?? []) map.set(norm(ex.name), ex);
    return map;
  }, [library]);

  const match = (name: string) => {
    const key = norm(name);
    if (index.has(key)) return index.get(key);
    for (const [k, v] of index) {
      if (k.includes(key) || key.includes(k)) return v;
    }
    return null;
  };

  if (!sessions.length) return null;

  return (
    <div className="space-y-5">
      {sessions.map((session, si) => (
        <Card key={si} className="overflow-hidden border-border/60">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold leading-tight">{session.title}</h3>
                <p className="text-[11px] text-muted-foreground">{session.rows.length} exercícios</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">STH METHOD</Badge>
          </div>

          <div className="divide-y divide-border/60">
            {session.rows.map((row, ri) => {
              const ex = match(row.name);
              return (
                <div key={ri} className="flex gap-3 p-4 sm:gap-4">
                  <div className="w-28 shrink-0 sm:w-40">
                    {ex?.video_url ? (
                      <LazyVideoEmbed
                        url={ex.video_url}
                        title={ex.name}
                        posterUrl={ex.image_url ?? undefined}
                        className="aspect-video w-full overflow-hidden rounded-lg"
                      />
                    ) : ex?.image_url ? (
                      <img
                        src={ex.image_url}
                        alt={`Execução do exercício ${ex.name}`}
                        loading="lazy"
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ex?.name ?? row.name}</p>
                    {ex?.muscle_group && (
                      <p className="text-[11px] text-muted-foreground">{ex.muscle_group}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.sets && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Repeat className="h-3 w-3" /> {row.sets} séries
                        </Badge>
                      )}
                      {row.reps && <Badge variant="outline" className="text-[10px]">{row.reps} reps</Badge>}
                      {row.rest && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Timer className="h-3 w-3" /> {row.rest}
                        </Badge>
                      )}
                    </div>
                    {row.note && <p className="mt-2 text-xs text-muted-foreground">{row.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
