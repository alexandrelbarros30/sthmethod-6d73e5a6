import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Dumbbell, Video, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const isImageUrl = (url?: string | null) =>
  !!url && /\.(gif|png|jpe?g|webp|avif)(\?.*)?$/i.test(url);

const getYoutubeThumb = (url?: string | null) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
};

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps",
  "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Cardio", "Outro"
];

interface ExerciseLibraryPickerProps {
  onSelect: (exercise: {
    name: string;
    description: string;
    video_url: string;
    muscle_group: string;
  }) => void;
}

const ExerciseLibraryPicker = ({ onSelect }: ExerciseLibraryPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");

  const { data: exercises } = useQuery({
    queryKey: ["exercise-library-picker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("*")
        .order("muscle_group")
        .order("name");
      return data || [];
    },
  });

  const filtered = (exercises || []).filter((ex: any) => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "all" || ex.muscle_group === filterGroup;
    return matchSearch && matchGroup;
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="w-full justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            Buscar na Biblioteca de Exercícios
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MUSCLE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum exercício encontrado.</p>
          ) : (
            filtered.slice(0, 20).map((ex: any) => {
              const preview = isImageUrl(ex.image_url)
                ? { kind: "image" as const, url: ex.image_url }
                : isImageUrl(ex.video_url)
                ? { kind: "image" as const, url: ex.video_url }
                : getYoutubeThumb(ex.video_url)
                ? { kind: "image" as const, url: getYoutubeThumb(ex.video_url)! }
                : null;
              return (
              <button
                key={ex.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onSelect({
                    name: ex.name,
                    description: ex.description || "",
                    video_url: ex.video_url || ex.image_url || "",
                    muscle_group: ex.muscle_group || "",
                  });
                  setOpen(false);
                  setSearch("");
                }}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-md bg-muted overflow-hidden shrink-0 border border-border">
                  {preview ? (
                    <img
                      src={preview.url}
                      alt={ex.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ex.name}</p>
                  <div className="flex gap-1.5 items-center mt-0.5">
                    {ex.muscle_group && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ex.muscle_group}</Badge>}
                    {(ex.video_url || ex.image_url) && <Video className="w-3 h-3 text-primary" />}
                  </div>
                </div>
              </button>
              );
            })
          )}
        </div>
        {filtered.length > 20 && (
          <p className="text-[10px] text-muted-foreground text-center">Mostrando 20 de {filtered.length}. Refine a busca.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ExerciseLibraryPicker;
