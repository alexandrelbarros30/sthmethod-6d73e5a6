import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import LazyVideoEmbed from "@/components/student/LazyVideoEmbed";
import WorkoutChronometer from "@/components/student/WorkoutChronometer";
import StCoachCredit from "@/components/shared/StCoachCredit";
import {
  ChevronDown,
  ChevronLeft,
  ChevronsDown,
  Dumbbell,
  Eraser,
  Save,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";

type Row = { name: string; sets: string; reps: string; rest: string; note: string };
type Session = { title: string; subtitle: string; rows: Row[] };

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
        current = { title, subtitle: "", rows: [] };
        sessions.push(current);
      } else {
        current = null;
      }
      continue;
    }
    if (!current) continue;
    if (!line.startsWith("|")) {
      // primeira linha de texto após o título vira subtítulo (ex.: "Ênfase em Peitoral Superior")
      if (line && !current.rows.length && !current.subtitle && !line.startsWith("#")) {
        current.subtitle = line.replace(/[*_`>]/g, "").trim().slice(0, 140);
      }
      continue;
    }
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

const seriesLabel = (row: Row) => {
  const s = row.sets.replace(/[^0-9x×\-\s]/gi, "").trim();
  const r = row.reps.trim();
  if (s && r) return `${s}x${r}`;
  return s || r || "";
};

const restToSeconds = (rest: string): number => {
  const m = rest.match(/(\d+)\s*(m|min|s|seg)?/i);
  if (!m) return 60;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || "").toLowerCase();
  if (unit.startsWith("m")) return n * 60;
  if (!unit && n <= 5) return n * 60;
  return n;
};

const NOTES_KEY = "sth-ai-workout-notes";
const readNotes = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function AiWorkoutProgram({ content }: { content: string }) {
  const sessions = useMemo(() => parseWorkoutSessions(content), [content]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>(() => readNotes());
  const [chronoOpen, setChronoOpen] = useState(false);
  const [chronoRest, setChronoRest] = useState(60);

  const { data: library } = useQuery({
    queryKey: ["stcoach-exercise-catalog"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_stcoach_exercise_catalog");
      return (data ?? []) as { name: string; video_url: string | null; image_url: string | null }[];
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

  const saveNote = (key: string) => {
    const value = (drafts[key] || "").trim();
    if (!value) return;
    const next = { ...saved, [key]: value };
    setSaved(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    setDrafts((p) => ({ ...p, [key]: "" }));
    toast.success("Carga salva!");
  };

  if (!sessions.length) return null;

  // ============ VISTA: TREINO (exercícios sequenciais) ============
  if (active !== null && sessions[active]) {
    const session = sessions[active];
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground uppercase tracking-wide"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Hero */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 text-center">
          <ChevronDown className="w-5 h-5 mx-auto opacity-70" />
          <h2 className="text-xl font-bold mt-1">{session.title}</h2>
          {session.subtitle && <p className="mt-2 text-sm opacity-90">{session.subtitle}</p>}
          <Button
            variant="secondary"
            className="mt-4 w-full rounded-full bg-white text-black font-bold uppercase tracking-wide"
            onClick={() => {
              setChronoRest(restToSeconds(session.rows[0]?.rest || ""));
              setChronoOpen(true);
            }}
          >
            Iniciar Treino
          </Button>
          <p className="text-xs mt-2 opacity-80">Aperte iniciar para começar o treino.</p>
        </div>

        <WorkoutChronometer
          open={chronoOpen}
          onClose={() => setChronoOpen(false)}
          workoutTitle={session.title}
          defaultRest={chronoRest}
        />

        <div className="space-y-6">
          {session.rows.map((row, idx) => {
            const ex = match(row.name);
            const key = `${active}-${idx}-${norm(row.name)}`;
            const serie = seriesLabel(row);
            return (
              <div key={key} className="space-y-3">
                <div>
                  <p className="font-bold text-foreground">
                    {idx + 1}. {ex?.name ?? row.name}
                  </p>
                  {serie && (
                    <p className="text-sm font-semibold text-primary mt-1">
                      Série: {serie}
                      {row.note ? ` + ${row.note}` : ""}
                    </p>
                  )}
                  {row.rest && <p className="text-sm text-muted-foreground">Intervalo: ⏱ {row.rest}</p>}
                </div>

                {ex?.video_url ? (
                  <>
                    <div className="rounded-2xl overflow-hidden border border-border/40 bg-card relative">
                      <LazyVideoEmbed
                        url={ex.video_url}
                        title={ex.name}
                        posterUrl={ex.image_url ?? undefined}
                      />
                      <StCoachCredit variant="overlay" />
                    </div>
                    <StCoachCredit />
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-full">
                    <VideoOff className="w-3.5 h-3.5" /> Vídeo não cadastrado para este exercício.
                  </div>
                )}

                {/* Anotação de carga */}
                <div className="flex items-stretch gap-2">
                  <Textarea
                    placeholder="Anote os pesos aqui"
                    value={drafts[key] || ""}
                    onChange={(e) => setDrafts((p) => ({ ...p, [key]: e.target.value }))}
                    rows={2}
                    className="flex-1 rounded-xl bg-muted/40 border-border resize-none"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      disabled={!drafts[key]?.trim()}
                      onClick={() => saveNote(key)}
                      className="rounded-full bg-primary text-primary-foreground font-bold uppercase text-xs"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDrafts((p) => ({ ...p, [key]: "" }))}
                      className="text-xs uppercase font-bold"
                    >
                      <Eraser className="w-3.5 h-3.5 mr-1" /> Limpar
                    </Button>
                  </div>
                </div>
                {saved[key] && (
                  <p className="text-[11px] text-muted-foreground">
                    Último: <span className="font-semibold text-foreground">{saved[key]}</span>
                  </p>
                )}

                {idx < session.rows.length - 1 && (
                  <div className="flex justify-center pt-1 text-muted-foreground/50">
                    <ChevronsDown className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============ VISTA: PROGRAMA (lista de treinos) ============
  return (
    <div className="space-y-3">
      {sessions.map((session, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isExpanded = openIndex === idx;
        const preview = session.rows.slice(0, 3).map((r) => r.name);
        return (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-card/80"
            onClick={() => setOpenIndex(isExpanded ? null : idx)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-semibold text-foreground tracking-tight">
                {letter}. {session.title}
              </p>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
            {session.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{session.subtitle}</p>}
            {!isExpanded && preview.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">{preview.join(" • ")}</p>
            )}
            {isExpanded && (
              <ul className="mt-3 space-y-2 border-t border-border/50 pt-3">
                {session.rows.map((row, i) => {
                  const serie = seriesLabel(row);
                  return (
                    <li key={i} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0 pt-0.5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium leading-snug">{row.name}</p>
                          {serie && (
                            <p className="text-primary font-semibold text-xs mt-0.5 tabular-nums tracking-tight">
                              {serie}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-full">
                <Dumbbell className="w-3.5 h-3.5" /> {session.rows.length} exercícios
              </div>
              <Button
                onClick={() => setActive(idx)}
                className="rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wide text-xs px-5"
              >
                Ver Treino
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
