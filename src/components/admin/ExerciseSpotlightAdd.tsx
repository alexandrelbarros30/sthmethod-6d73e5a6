import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Video, ImageIcon, CornerDownLeft } from "lucide-react";
import { invokeSuperCoachEdge } from "@/lib/supercoach-edge";
import type { PickedScExercise } from "@/components/admin/SuperCoachExercisePicker";
import { toast } from "sonner";

const normalize = (v: string) =>
  (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const parseSetsReps = (s?: string): { sets: string; reps: string } => {
  if (!s) return { sets: "", reps: "" };
  const m = s.match(/(\d+)\s*[xX×]\s*([\dA-Za-z\-\s"']+)/);
  if (m) return { sets: m[1], reps: m[2].trim() };
  return { sets: "", reps: s };
};

type Hit = {
  key: string;
  name: string;
  source: "library" | "stcoach";
  thumb?: string;
  hasVideo?: boolean;
  lib?: any;
  sc?: PickedScExercise;
};

interface Props {
  libraryExercises: any[];
  onAddLibrary: (items: any[]) => void;
  onAddSuperCoach: (items: PickedScExercise[]) => void;
}

export default function ExerciseSpotlightAdd({ libraryExercises, onAddLibrary, onAddSuperCoach }: Props) {
  const [query, setQuery] = useState("");
  const [scLibrary, setScLibrary] = useState<any[] | null>(null);
  const [loadingSc, setLoadingSc] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // carrega a biblioteca do ST Coach na primeira busca
  useEffect(() => {
    if (query.trim().length < 2 || scLibrary !== null || loadingSc) return;
    setLoadingSc(true);
    invokeSuperCoachEdge<any>("supercoach-import-workout", { action: "list-library" })
      .then((data) => setScLibrary(data?.exercises || []))
      .catch(() => setScLibrary([]))
      .finally(() => setLoadingSc(false));
  }, [query, scLibrary, loadingSc]);

  const hits = useMemo<Hit[]>(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    const fromLib: Hit[] = (libraryExercises || [])
      .filter((e: any) => normalize(e.name).includes(q))
      .slice(0, 8)
      .map((e: any) => ({
        key: `lib-${e.id}`,
        name: e.name,
        source: "library",
        thumb: e.image_url || undefined,
        hasVideo: !!e.video_url,
        lib: e,
      }));
    const fromSc: Hit[] = (scLibrary || [])
      .filter((e: any) => normalize(e.name).includes(q))
      .slice(0, 8)
      .map((e: any) => {
        const sr = parseSetsReps(e.series_repetitions);
        const interval =
          e.intervals && typeof e.intervals === "object"
            ? e.intervals?.rest || e.intervals?.time || ""
            : typeof e.intervals === "string"
            ? e.intervals
            : "";
        return {
          key: `sc-${e.id}`,
          name: e.name,
          source: "stcoach" as const,
          thumb: e.cover_url || undefined,
          hasVideo: !!e.video_url,
          sc: {
            name: e.name || "",
            description: e.description || "",
            video_url: e.video_url || e.cover_url || "",
            image_url: e.cover_url || "",
            sets: sr.sets,
            reps: sr.reps,
            rest_interval: String(interval || ""),
            load_suggestion: e.weight_suggestion || "",
          },
        };
      });
    return [...fromLib, ...fromSc];
  }, [query, libraryExercises, scLibrary]);

  useEffect(() => setCursor(0), [query]);

  const addHit = (hit: Hit) => {
    if (hit.source === "library" && hit.lib) onAddLibrary([hit.lib]);
    if (hit.source === "stcoach" && hit.sc) {
      onAddSuperCoach([hit.sc]);
      toast.success(`${hit.name} adicionado (vídeo ST Coach)`);
    }
    setQuery("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter") { e.preventDefault(); addHit(hits[cursor]); }
    else if (e.key === "Escape") setQuery("");
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          className="pl-9 h-11 text-base"
          placeholder="Digite o exercício (ex.: supino, agachamento, remada) e tecle Enter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {loadingSc && (
          <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-2">
        Busca única: procura na <strong>Biblioteca (GIFs)</strong> e no <strong>Banco ST Coach (vídeos)</strong> ao mesmo tempo.
        Use ↑ ↓ para navegar e <kbd className="px-1 border rounded">Enter</kbd> para adicionar. Séries, reps e descanso você preenche depois na linha do exercício.
      </p>

      {query.trim().length >= 2 && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border bg-background divide-y">
          {hits.length === 0 && !loadingSc && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nada encontrado para “{query}”. Use o botão “Adicionar” para criar manualmente.
            </p>
          )}
          {hits.map((hit, i) => (
            <button
              key={hit.key}
              type="button"
              onMouseEnter={() => setCursor(i)}
              onClick={() => addHit(hit)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${i === cursor ? "bg-primary/10" : "hover:bg-muted"}`}
            >
              {hit.thumb ? (
                <img src={hit.thumb} alt="" className="w-10 h-10 rounded object-cover shrink-0" onError={(ev: any) => (ev.target.style.visibility = "hidden")} />
              ) : (
                <div className="w-10 h-10 rounded bg-muted grid place-items-center shrink-0">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 min-w-0 truncate font-medium text-sm">{hit.name}</span>
              <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                {hit.source === "library" ? "Biblioteca" : <><Video className="w-2.5 h-2.5" /> ST Coach</>}
              </Badge>
              {i === cursor && <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {query.trim().length < 2 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Supino", "Agachamento", "Remada", "Desenvolvimento", "Rosca", "Tríceps", "Leg press", "Abdominal"].map((s) => (
            <Button key={s} type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setQuery(s); inputRef.current?.focus(); }}>
              {s}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}