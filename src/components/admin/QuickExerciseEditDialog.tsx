import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, Video, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ExerciseMediaPreview from "@/components/admin/ExerciseMediaPreview";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Quadríceps",
  "Posterior", "Glúteos", "Panturrilha", "Abdômen", "Cardio", "Outro",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exercise: any | null;
  invalidateKeys?: any[][];
}

const QuickExerciseEditDialog = ({ open, onOpenChange, exercise, invalidateKeys = [] }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    exercise_id: null as string | null,
    custom_name: "",
    custom_description: "",
    sets: "",
    reps: "",
    rest_interval: "",
    load_suggestion: "",
    video_url: "",
  });
  const [libGroup, setLibGroup] = useState("all");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: libraryExercises } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_library").select("*").order("name");
      return data || [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && exercise) {
      setForm({
        exercise_id: exercise.exercise_id || null,
        custom_name: exercise.custom_name || "",
        custom_description: exercise.custom_description || "",
        sets: exercise.sets || "",
        reps: exercise.reps || "",
        rest_interval: exercise.rest_interval || "",
        load_suggestion: exercise.load_suggestion || "",
        video_url: exercise.video_url || "",
      });
      setLibGroup("all");
    }
  }, [open, exercise]);

  const filteredLibrary = useMemo(
    () => (libraryExercises || []).filter((e: any) => libGroup === "all" || e.muscle_group === libGroup),
    [libraryExercises, libGroup]
  );

  const selectedLib = useMemo(
    () => (libraryExercises || []).find((e: any) => e.id === form.exercise_id),
    [libraryExercises, form.exercise_id]
  );

  const pickFromLibrary = (id: string) => {
    const lib = (libraryExercises || []).find((e: any) => e.id === id);
    if (!lib) return;
    setForm(p => ({
      ...p,
      exercise_id: id,
      custom_name: lib.name,
      custom_description: lib.description || p.custom_description,
      video_url: lib.video_url || lib.image_url || "",
    }));
    setPickerOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!exercise?.id) throw new Error("Exercício inválido");
      const { error } = await supabase.from("workout_template_exercises").update({
        exercise_id: form.exercise_id,
        custom_name: form.custom_name,
        custom_description: form.custom_description,
        sets: form.sets,
        reps: form.reps,
        rest_interval: form.rest_interval,
        load_suggestion: form.load_suggestion,
        video_url: form.video_url,
      }).eq("id", exercise.id);
      if (error) throw error;
      if (exercise.template_id) {
        await supabase
          .from("student_workout_assignments")
          .update({ seen_by_student: false } as any)
          .eq("template_id", exercise.template_id);
      }
    },
    onSuccess: () => {
      invalidateKeys.forEach(k => qc.invalidateQueries({ queryKey: k }));
      qc.invalidateQueries({ queryKey: ["template-exercises-program"] });
      qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
      toast.success("Exercício atualizado!");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Exercício</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Library className="w-3 h-3" /> Substituir por exercício da Biblioteca
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
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
                  <Button variant="outline" role="combobox" className="flex-1 justify-between h-9 text-xs font-normal min-w-0">
                    <span className="truncate text-left">
                      {selectedLib ? selectedLib.name : "Selecionar da biblioteca..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[280px]" align="start">
                  <Command>
                    <CommandInput placeholder="Filtrar..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Nenhum exercício encontrado.</CommandEmpty>
                      <CommandGroup>
                        {filteredLibrary.map((e: any) => (
                          <CommandItem
                            key={e.id}
                            value={`${e.name} ${e.muscle_group || ""}`}
                            onSelect={() => pickFromLibrary(e.id)}
                            className={cn(
                              "text-xs gap-2 py-2",
                              form.exercise_id === e.id && "bg-primary/15 text-primary"
                            )}
                          >
                            <Check className={cn("h-3.5 w-3.5 shrink-0", form.exercise_id === e.id ? "opacity-100" : "opacity-0")} />
                            <ExerciseMediaPreview
                              videoUrl={e.video_url}
                              imageUrl={e.image_url}
                              alt={e.name}
                              className="w-10 h-10 shrink-0"
                              showBadge
                            />
                            <span className="flex-1 truncate">{e.name}</span>
                            {e.muscle_group && <span className="ml-1 text-[10px] text-muted-foreground shrink-0">{e.muscle_group}</span>}
                            {(e.video_url || e.image_url) && <Video className="ml-1 h-3 w-3 text-primary shrink-0" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedLib && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-primary/5 border border-primary/20 px-2 py-1.5">
                <span className="text-[11px] text-primary truncate">
                  Vinculado: <strong>{selectedLib.name}</strong>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px]"
                  onClick={() => setForm(p => ({ ...p, exercise_id: null }))}
                >
                  Desvincular
                </Button>
              </div>
            )}
          </div>

          {(form.video_url || selectedLib?.video_url || selectedLib?.image_url) && (
            <ExerciseMediaPreview
              videoUrl={form.video_url || selectedLib?.video_url}
              imageUrl={selectedLib?.image_url}
              alt={form.custom_name || "Exercício"}
              mode="player"
              className="w-full aspect-video"
              showBadge
            />
          )}

          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={form.custom_name} onChange={e => setForm(p => ({ ...p, custom_name: e.target.value }))} placeholder="Nome do exercício" />
          </div>
          <div>
            <Label className="text-xs">Descrição / Texto livre</Label>
            <Textarea rows={2} value={form.custom_description} onChange={e => setForm(p => ({ ...p, custom_description: e.target.value }))} placeholder="Instruções, observações..." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><Label className="text-xs">Séries</Label><Input value={form.sets} onChange={e => setForm(p => ({ ...p, sets: e.target.value }))} /></div>
            <div><Label className="text-xs">Repetições</Label><Input value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))} /></div>
            <div><Label className="text-xs">Intervalo</Label><Input value={form.rest_interval} onChange={e => setForm(p => ({ ...p, rest_interval: e.target.value }))} /></div>
            <div><Label className="text-xs">Carga</Label><Input value={form.load_suggestion} onChange={e => setForm(p => ({ ...p, load_suggestion: e.target.value }))} /></div>
          </div>
          <div>
            <Label className="text-xs">URL de Vídeo/GIF (opcional)</Label>
            <Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickExerciseEditDialog;