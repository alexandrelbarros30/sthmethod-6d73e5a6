import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, ImageIcon, Loader2, Plus, Search, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { invokeSuperCoachEdge } from "@/lib/supercoach-edge";

const normalize = (v: string) =>
  (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export interface PickedExercise {
  name: string;
  source: "library" | "manual" | "stcoach";
  media_url: string | null;
  thumb_url: string | null;
  muscle_group: string | null;
}

interface Props {
  onPick: (ex: PickedExercise) => void;
  disabled?: boolean;
}

type SourceKind = "library" | "stcoach";

const CoachExerciseSearch = ({ onPick, disabled }: Props) => {
  const [source, setSource] = useState<SourceKind>("library");
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [scLibrary, setScLibrary] = useState<any[] | null>(null);
  const [loadingSc, setLoadingSc] = useState(false);

  const { data: library } = useQuery({
    queryKey: ["coach-exercise-library"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("id, name, muscle_group, image_url, video_url")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // carrega o banco de vídeos ST Coach sob demanda
  useEffect(() => {
    if (source !== "stcoach" || scLibrary !== null || loadingSc) return;
    setLoadingSc(true);
    invokeSuperCoachEdge<any>("supercoach-import-workout", { action: "list-library" })
      .then((data) => setScLibrary(data?.exercises || []))
      .catch(() => setScLibrary([]))
      .finally(() => setLoadingSc(false));
  }, [source, scLibrary, loadingSc]);

  useEffect(() => setCursor(0), [query, source]);

  const hits = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    if (source === "stcoach") {
      return (scLibrary || [])
        .filter((e: any) => normalize(e.name || "").includes(q))
        .slice(0, 10)
        .map((e: any) => ({
          id: `sc-${e.id}`,
          name: e.name,
          muscle_group: e.muscle_group || null,
          image_url: e.cover_url || null,
          video_url: e.video_url || null,
        }));
    }
    return (library || [])
      .filter((e: any) => normalize(`${e.name} ${e.muscle_group || ""}`).includes(q))
      .slice(0, 10);
  }, [query, library, scLibrary, source]);

  const add = (e: any) => {
    onPick({
      name: e.name,
      source,
      media_url: e.video_url || e.image_url || null,
      thumb_url: e.image_url || null,
      muscle_group: e.muscle_group || null,
    });
    setQuery("");
    setCursor(0);
  };

  const addManual = () => {
    const name = query.trim();
    if (!name) return;
    onPick({ name, source: "manual", media_url: null, thumb_url: null, muscle_group: null });
    setQuery("");
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Buscar em:</span>
        <div className="inline-flex rounded-lg border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setSource("library")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              source === "library" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Biblioteca (GIFs)
          </button>
          <button
            type="button"
            onClick={() => setSource("stcoach")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              source === "stcoach" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Vídeos (ST Coach)
          </button>
        </div>
        {source === "stcoach" && loadingSc && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> carregando banco…
          </span>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (!hits.length) {
              if (e.key === "Enter") { e.preventDefault(); addManual(); }
              return;
            }
            if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % hits.length); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + hits.length) % hits.length); }
            else if (e.key === "Enter") { e.preventDefault(); add(hits[cursor]); }
            else if (e.key === "Escape") setQuery("");
          }}
          placeholder={
            source === "library"
              ? "Buscar na biblioteca (GIFs) ou digitar um nome livre…"
              : "Buscar no banco de vídeos ST Coach ou digitar um nome livre…"
          }
          className="pl-9 h-11 rounded-xl text-[13px]"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-2 space-y-1">
          {!hits.length && (
            <p className="px-2.5 py-1 text-[12px] text-muted-foreground">
              {source === "stcoach" && loadingSc ? "Carregando exercícios do ST Coach…" : "Nenhum exercício encontrado."}
            </p>
          )}
          {hits.map((e: any, i: number) => (
            <button
              key={e.id}
              type="button"
              onMouseEnter={() => setCursor(i)}
              onClick={() => add(e)}
              className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                i === cursor ? "bg-primary/10" : "hover:bg-muted/60"
              }`}
            >
              {e.image_url ? (
                <img src={e.image_url} alt={e.name} loading="lazy" className="h-9 w-12 rounded-md object-cover" />
              ) : (
                <div className="h-9 w-12 rounded-md bg-muted flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 min-w-0 text-[13px] font-medium truncate">{e.name}</span>
              {e.muscle_group && (
                <Badge variant="secondary" className="text-[10px] font-normal">{e.muscle_group}</Badge>
              )}
              {e.video_url && <Video className="h-3.5 w-3.5 text-primary" />}
              {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addManual} className="w-full justify-start text-[12px]">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar “{query.trim()}” como exercício livre
          </Button>
        </div>
      )}
    </div>
  );
};

export default CoachExerciseSearch;