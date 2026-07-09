import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Video, Dumbbell, Eraser } from "lucide-react";
import ExerciseMediaPreview from "@/components/admin/ExerciseMediaPreview";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps",
  "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Cardio", "Outro",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  libraryExercises: any[];
  onAdd: (exercises: any[]) => void;
  maxSelectable?: number;
}

const LibraryMultiSelectDialog = ({ open, onOpenChange, libraryExercises, onAdd, maxSelectable = 25 }: Props) => {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return (libraryExercises || []).filter((e: any) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      const matchGroup = group === "all" || e.muscle_group === group;
      return matchSearch && matchGroup;
    });
  }, [libraryExercises, search, group]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxSelectable) next.add(id);
      return next;
    });
  };

  const clear = () => setSelectedIds(new Set());

  const handleAdd = () => {
    const items = (libraryExercises || []).filter((e: any) => selectedIds.has(e.id));
    if (!items.length) return;
    onAdd(items);
    clear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) clear(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Exercícios</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar exercício..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-muted/40">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-primary">Exercícios selecionados: {selectedIds.size}/{maxSelectable}</span>
            <span className="text-xs text-muted-foreground">({filtered.length} listados)</span>
          </div>
          <Button size="sm" variant="ghost" onClick={clear} disabled={!selectedIds.size}>
            <Eraser className="w-3.5 h-3.5 mr-1" /> Limpar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border divide-y">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum exercício encontrado.</p>
          ) : (
            filtered.map((e: any) => {
              const checked = selectedIds.has(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors ${checked ? "bg-primary/5" : ""}`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(e.id)} />
                  <ExerciseMediaPreview
                    videoUrl={e.video_url}
                    imageUrl={e.image_url}
                    alt={e.name}
                    className="w-16 h-16 shrink-0"
                    showBadge
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.name}</p>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      {e.muscle_group && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{e.muscle_group}</Badge>}
                      {(e.video_url || e.image_url) && <Video className="w-3 h-3 text-primary" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={!selectedIds.size}>
            ADD AO TREINO ({selectedIds.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LibraryMultiSelectDialog;