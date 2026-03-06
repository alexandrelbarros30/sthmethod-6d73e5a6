import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical } from "lucide-react";

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
  _uid: string; // local unique id for dnd
}

interface Props {
  row: ExerciseRow;
  idx: number;
  libraryExercises: any[];
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: keyof ExerciseRow, value: string | null) => void;
  onSelectFromLibrary: (idx: number, exerciseId: string) => void;
}

const SortableExerciseRow = ({ row, idx, libraryExercises, onRemove, onUpdate, onSelectFromLibrary }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row._uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4" />
          </button>
          <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={() => onRemove(idx)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
      <div>
        <Label className="text-xs">Da Biblioteca</Label>
        <Select value={row.exercise_id || ""} onValueChange={v => onSelectFromLibrary(idx, v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar exercício..." /></SelectTrigger>
          <SelectContent>
            {(libraryExercises || []).map((e: any) => (
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
          <Input value={row.sets} onChange={e => onUpdate(idx, "sets", e.target.value)} placeholder="4" />
        </div>
        <div>
          <Label className="text-xs">Repetições</Label>
          <Input value={row.reps} onChange={e => onUpdate(idx, "reps", e.target.value)} placeholder="12" />
        </div>
        <div>
          <Label className="text-xs">Intervalo</Label>
          <Input value={row.rest_interval} onChange={e => onUpdate(idx, "rest_interval", e.target.value)} placeholder="60s" />
        </div>
        <div>
          <Label className="text-xs">Carga</Label>
          <Input value={row.load_suggestion} onChange={e => onUpdate(idx, "load_suggestion", e.target.value)} placeholder="20kg" />
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
