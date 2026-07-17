import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeSearch } from "@/lib/utils";

type Program = { id: number; name: string; subtitle: string | null; weeks: any; days_per_week: any; minutes_per_day: any; cover_url: string | null };
type Exercise = { id: number; name: string; series_repetitions: string; cover_url: string | null; video_url_thumb: string | null };
type Training = { id: number; name: string; subtitle: string | null; description: string | null; weeks: any; days_per_week: any; minutes_per_day: any; cover_url: string | null; exercises: Exercise[] };

function parseSetsReps(sr: string): { sets: string; reps: string } {
  const s = (sr || "").trim();
  const m = s.match(/^\s*(\d+)\s*[xX]\s*(.+)$/);
  if (m) return { sets: m[1], reps: m[2].trim() };
  return { sets: "", reps: s };
}

export default function ImportFromSuperCoachDialog({ libraryExercises, onImported, programId, buttonLabel, buttonSize, buttonVariant }: { libraryExercises: any[]; onImported: () => void; programId?: string; buttonLabel?: string; buttonSize?: "sm" | "default"; buttonVariant?: "outline" | "default" | "secondary" }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"programs" | "trainings">("programs");
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [search, setSearch] = useState("");

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-programs" } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setPrograms((data as any)?.programs || []);
      setStep("programs");
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar programas");
    } finally { setLoading(false); }
  };

  const loadTrainings = async (p: Program) => {
    setLoading(true);
    setSelectedProgram(p);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-trainings", programId: p.id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setTrainings((data as any)?.trainings || []);
      setStep("trainings");
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar treinos");
    } finally { setLoading(false); }
  };

  const findLibraryMatch = (name: string): string | null => {
    const q = normalizeSearch(name);
    if (!q) return null;
    const exact = libraryExercises.find((e: any) => normalizeSearch(e.name) === q);
    if (exact) return exact.id;
    const partial = libraryExercises.find((e: any) => normalizeSearch(e.name).includes(q) || q.includes(normalizeSearch(e.name)));
    return partial?.id || null;
  };

  const importMutation = useMutation({
    mutationFn: async (t: Training) => {
      if (!user) throw new Error("Sem sessão");
      const { data: tpl, error: e1 } = await supabase.from("workout_templates").insert({
        title: t.name,
        description: [selectedProgram?.name, t.subtitle, t.description].filter(Boolean).join(" • "),
        weeks: t.weeks ? Number(t.weeks) : (selectedProgram?.weeks ? Number(selectedProgram.weeks) : null),
        days_per_week: t.days_per_week ? Number(t.days_per_week) : (selectedProgram?.days_per_week ? Number(selectedProgram.days_per_week) : null),
        minutes_per_day: t.minutes_per_day ? Number(t.minutes_per_day) : (selectedProgram?.minutes_per_day ? Number(selectedProgram.minutes_per_day) : null),
        created_by: user.id,
        ...(programId ? { program_id: programId } : {}),
      }).select("id").single();
      if (e1) throw e1;
      const rows = t.exercises.map((ex, i) => {
        const { sets, reps } = parseSetsReps(ex.series_repetitions);
        return {
          template_id: tpl.id,
          exercise_id: findLibraryMatch(ex.name),
          custom_name: ex.name,
          custom_description: "",
          sets, reps,
          rest_interval: "",
          load_suggestion: "",
          video_url: ex.video_url_thumb || "",
          sort_order: i,
        };
      });
      if (rows.length > 0) {
        const { error: e2 } = await supabase.from("workout_template_exercises").insert(rows);
        if (e2) throw e2;
      }
      return { count: rows.length, matched: rows.filter(r => r.exercise_id).length };
    },
    onSuccess: (r) => {
      toast.success(`Importado! ${r.count} exercícios (${r.matched} vinculados à biblioteca)`);
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
      onImported();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao importar"),
  });

  const filteredPrograms = programs.filter(p => !search || normalizeSearch(p.name).includes(normalizeSearch(search)));
  const filteredTrainings = trainings.filter(t => !search || normalizeSearch(t.name).includes(normalizeSearch(search)));

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && programs.length === 0) loadPrograms(); if (!v) { setSearch(""); setStep("programs"); setSelectedProgram(null); } }}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant || "outline"} size={buttonSize || "default"}><Download className="w-4 h-4 mr-1" /> {buttonLabel || "Importar do SuperCoach"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "programs" ? "Escolha um Programa" : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setStep("programs"); setSelectedProgram(null); setSearch(""); }}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                Treinos de: {selectedProgram?.name}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>}
          {!loading && step === "programs" && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredPrograms.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum programa encontrado.</p>}
              {filteredPrograms.map(p => (
                <button key={p.id} onClick={() => loadTrainings(p)} className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-3">
                  {p.cover_url && <img src={p.cover_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" onError={(e: any) => e.target.style.display = 'none'} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    {p.subtitle && <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>}
                    <div className="flex gap-1 mt-0.5">
                      {p.weeks && <Badge variant="outline" className="text-xs">{p.weeks} sem</Badge>}
                      {p.days_per_week && <Badge variant="outline" className="text-xs">{p.days_per_week}x/sem</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
          {!loading && step === "trainings" && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredTrainings.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum treino neste programa.</p>}
              {filteredTrainings.map(t => {
                const matched = t.exercises.filter(ex => findLibraryMatch(ex.name)).length;
                return (
                  <div key={t.id} className="p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t.name}</p>
                        {t.subtitle && <p className="text-xs text-muted-foreground">{t.subtitle}</p>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{t.exercises.length} exercício(s)</Badge>
                          {matched > 0 && <Badge variant="outline" className="text-xs text-primary">{matched} c/ mídia</Badge>}
                        </div>
                      </div>
                      <Button size="sm" disabled={importMutation.isPending} onClick={() => importMutation.mutate(t)}>
                        {importMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Download className="w-3 h-3 mr-1" /> Importar</>}
                      </Button>
                    </div>
                    {t.exercises.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Ver exercícios</summary>
                        <ul className="mt-2 space-y-1 text-xs">
                          {t.exercises.map(ex => (
                            <li key={ex.id} className="flex justify-between gap-2 py-1 border-t">
                              <span>{findLibraryMatch(ex.name) ? "✅" : "◻️"} {ex.name}</span>
                              <span className="text-muted-foreground">{ex.series_repetitions}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}