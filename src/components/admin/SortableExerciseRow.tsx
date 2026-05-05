import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Search } from "lucide-react";

export interface ExerciseRow {
  id?: string;
  exercise_id: string | null;
  custom_name: string;
  custom_description: string;
  sets: string;
  reps: string;
  rest_interval: string;
  load_suggestion: string;
  video_url: string;
  sort_order: number;
  _uid: string;
  group_id?: string | null;
  group_name?: string;
  group_color?: string;
}

interface Props {
  row: ExerciseRow;
  idx: number;
  libraryExercises: any[];
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: keyof ExerciseRow, value: string | null) => void;
  onSelectFromLibrary: (idx: number, exerciseId: string) => void;
  selected?: boolean;
  onToggleSelected?: (idx: number) => void;
}

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps",
  "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Cardio", "Outro"
];

const SortableExerciseRow = ({ row, idx, libraryExercises, onRemove, onUpdate, onSelectFromLibrary, selected, onToggleSelected }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row._uid });
  const [libSearch, setLibSearch] = useState("");
  const [libGroup, setLibGroup] = useState("all");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeft: row.group_color ? `4px solid ${row.group_color}` : undefined,
  };

  const filteredLibrary = (libraryExercises || []).filter((e: any) => {
    const matchSearch = !libSearch || e.name.toLowerCase().includes(libSearch.toLowerCase());
    const matchGroup = libGroup === "all" || e.muscle_group === libGroup;
    return matchSearch && matchGroup;
  });

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {onToggleSelected && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelected(idx)}
              className="w-4 h-4 cursor-pointer accent-primary"
              aria-label="Selecionar exercício"
            />
          )}
          <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4" />
          </button>
          <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
          {row.group_name && (
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ backgroundColor: row.group_color ? `${row.group_color}22` : undefined, borderColor: row.group_color || undefined, color: row.group_color || undefined }}
            >
              {row.group_name}
            </Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={() => onRemove(idx)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Da Biblioteca</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar exercício..."
              value={libSearch}
              onChange={e => setLibSearch(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          <Select value={libGroup} onValueChange={setLibGroup}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select value={row.exercise_id || ""} onValueChange={v => onSelectFromLibrary(idx, v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar exercício..." /></SelectTrigger>
          <SelectContent>
            {filteredLibrary.map((e: any) => (
              <SelectItem key={e.id} value={e.id}>{e.name} {e.muscle_group ? `(${e.muscle_group})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Nome</Label>
        <Input value={row.custom_name} onChange={e => onUpdate(idx, "custom_name", e.target.value)} placeholder="Nome do exercício" />
      </div>
      <div>
        <Label className="text-xs">Descrição</Label>
        <Textarea value={row.custom_description} onChange={e => onUpdate(idx, "custom_description", e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <Label className="text-xs">Séries</Label>
          <Input value={row.sets} onChange={e => onUpdate(idx, "sets", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Repetições</Label>
          <Input value={row.reps} onChange={e => onUpdate(idx, "reps", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Intervalo</Label>
          <Input value={row.rest_interval} onChange={e => onUpdate(idx, "rest_interval", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Carga</Label>
          <Input value={row.load_suggestion} onChange={e => onUpdate(idx, "load_suggestion", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">URL Vídeo</Label>
        <Input value={row.video_url} onChange={e => onUpdate(idx, "video_url", e.target.value)} placeholder="https://..." />
      </div>
    </div>
  );
};

export default SortableExerciseRow;
