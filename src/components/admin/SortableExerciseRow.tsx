import { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, GripVertical, ChevronsUpDown, Check, Video, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ExerciseMediaPreview, { getExerciseMediaSource } from "@/components/admin/ExerciseMediaPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [libGroup, setLibGroup] = useState("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeft: row.group_color ? `4px solid ${row.group_color}` : undefined,
  };

  const filteredLibrary = useMemo(
    () => (libraryExercises || []).filter((e: any) => libGroup === "all" || e.muscle_group === libGroup),
    [libraryExercises, libGroup]
  );

  const selectedExercise = useMemo(
    () => (libraryExercises || []).find((e: any) => e.id === row.exercise_id),
    [libraryExercises, row.exercise_id]
  );

  const mediaSource = getExerciseMediaSource({
    videoUrl: row.video_url || selectedExercise?.video_url,
    imageUrl: selectedExercise?.image_url,
  });

  const displayName = row.custom_name || selectedExercise?.name || "Sem nome";

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {onToggleSelected && (
            <button
              type="button"
              onClick={() => onToggleSelected(idx)}
              aria-label="Selecionar exercício"
              aria-pressed={!!selected}
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                selected
                  ? "border-primary bg-primary shadow-sm shadow-primary/40"
                  : "border-muted-foreground/40 hover:border-primary/60 bg-background"
              )}
            >
              {selected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
            </button>
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
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir exercício?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <span className="font-semibold text-foreground">{displayName}</span>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { onRemove(idx); setConfirmDelete(false); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* Collapsed summary */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-2 text-left hover:bg-muted/30 rounded-md p-2 -m-1 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
        <ExerciseMediaPreview
          videoUrl={row.video_url || selectedExercise?.video_url}
          imageUrl={selectedExercise?.image_url}
          alt={displayName}
          className="w-14 h-14 shrink-0"
          showBadge
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
          {(row.sets || row.reps) && (
            <div className="text-xs text-muted-foreground/90 mt-0.5">
              {row.sets && `${row.sets} séries`}{row.sets && row.reps ? " × " : ""}{row.reps}
            </div>
          )}
          {row.rest_interval && (
            <div className="text-[11px] text-muted-foreground/60 mt-0.5">Intervalo: {row.rest_interval}</div>
          )}
        </div>
      </button>

      {expanded && (
      <>
      <div className="space-y-2">
        {!selectedExercise && (
          <>
            <Label className="text-xs">Da Biblioteca</Label>
            <div className="flex flex-col sm:flex-row gap-2">
          <Select value={libGroup} onValueChange={setLibGroup}>
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="flex-1 justify-between h-9 text-xs font-normal min-w-0"
              >
                <span className="truncate text-left">
                  {selectedExercise ? selectedExercise.name : "Selecionar exercício..."}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[260px]" align="start">
              <Command>
                <CommandInput placeholder="Filtrar exercício..." className="h-9" />
                <CommandList>
                  <CommandEmpty>Nenhum exercício encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredLibrary.map((e: any) => (
                      <CommandItem
                        key={e.id}
                        value={`${e.name} ${e.muscle_group || ""}`}
                        onSelect={() => {
                          onSelectFromLibrary(idx, e.id);
                          setPickerOpen(false);
                        }}
                        className={cn(
                          "text-xs gap-2 py-2",
                          row.exercise_id === e.id && "bg-primary/15 text-primary data-[selected=true]:bg-primary/20"
                        )}
                      >
                        <Check className={cn("h-3.5 w-3.5 shrink-0", row.exercise_id === e.id ? "opacity-100" : "opacity-0")} />
                        <ExerciseMediaPreview
                          videoUrl={e.video_url}
                          imageUrl={e.image_url}
                          alt={e.name}
                          className="w-12 h-12 shrink-0"
                          showBadge
                        />
                        <span className="flex-1 truncate">{e.name}</span>
                        {e.muscle_group && (
                          <span className="ml-2 text-[10px] text-muted-foreground shrink-0">{e.muscle_group}</span>
                        )}
                        {(e.video_url || e.image_url) && <Video className="ml-1.5 h-3 w-3 text-primary shrink-0" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
            </div>
          </>
        )}

        {/* Video preview */}
        {mediaSource && (
          <ExerciseMediaPreview
            videoUrl={row.video_url || selectedExercise?.video_url}
            imageUrl={selectedExercise?.image_url}
            alt={selectedExercise?.name || row.custom_name || "Exercício"}
            mode="player"
            className="w-full aspect-video"
            showBadge
          />
        )}
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
      </>
      )}
    </div>
  );
};

export default SortableExerciseRow;
