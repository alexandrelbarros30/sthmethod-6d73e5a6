import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, ImageIcon, Plus, Search, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const normalize = (v: string) =>
  (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export interface PickedExercise {
  name: string;
  source: "library" | "manual";
  media_url: string | null;
  thumb_url: string | null;
  muscle_group: string | null;
}

interface Props {
  onPick: (ex: PickedExercise) => void;
  disabled?: boolean;
}

const CoachExerciseSearch = ({ onPick, disabled }: Props) => {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

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

  const hits = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return (library || [])
      .filter((e: any) => normalize(`${e.name} ${e.muscle_group || ""}`).includes(q))
      .slice(0, 10);
  }, [query, library]);

  const add = (e: any) => {
    onPick({
      name: e.name,
      source: "library",
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
          placeholder="Buscar exercício na biblioteca (GIFs/vídeos) ou digitar um nome livre…"
          className="pl-9 h-11 rounded-xl text-[13px]"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-2 space-y-1">
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