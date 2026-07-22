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
      // Busca detalhes completos (video_url real do SuperCoach) antes de gravar
      const { data: det, error: eDet } = await supabase.functions.invoke("supercoach-import-workout", {
        body: { action: "get-training-details", programId: selectedProgram?.id, trainingId: t.id },
      });
      if (eDet) throw eDet;
      if ((det as any)?.error) throw new Error((det as any).error);
      const fullExercises: any[] = (det as any)?.exercises || [];
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
      const source = fullExercises.length > 0 ? fullExercises : t.exercises;
      const rows = source.map((ex: any, i: number) => {
        const { sets, reps } = parseSetsReps(ex.series_repetitions);
        // Usa SEMPRE a mídia do SuperCoach; não vincula à biblioteca local
        const videoUrl = ex.video_url || ex.video_url_thumb || ex.cover_url || "";
        return {
          template_id: tpl.id,
          exercise_id: null,
          custom_name: ex.name,
          custom_description: ex.description || "",
          sets, reps,
          rest_interval: "",
          load_suggestion: "",
          video_url: videoUrl,
          sort_order: i,
        };
      });
      if (rows.length > 0) {
        const { error: e2 } = await supabase.from("workout_template_exercises").insert(rows);
        if (e2) throw e2;
      }
      return { count: rows.length, matched: rows.filter((r: any) => r.video_url).length };
    },
    onSuccess: (r) => {
      toast.success(`Importado! ${r.count} exercícios (${r.matched} com vídeo do SuperCoach)`);
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
      onImported();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao importar"),
  });

  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [megaProgress, setMegaProgress] = useState<{ prog: number; totalProg: number; label: string; ok: number; fail: number; totalEx: number } | null>(null);
  const importAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      const list = filteredTrainings.length > 0 ? filteredTrainings : trainings;
      let ok = 0, fail = 0, totalEx = 0;
      setBulkProgress({ done: 0, total: list.length });
      for (let idx = 0; idx < list.length; idx++) {
        const t = list[idx];
        try {
          const { data: det, error: eDet } = await supabase.functions.invoke("supercoach-import-workout", {
            body: { action: "get-training-details", programId: selectedProgram?.id, trainingId: t.id },
          });
          if (eDet) throw eDet;
          if ((det as any)?.error) throw new Error((det as any).error);
          const fullExercises: any[] = (det as any)?.exercises || [];
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
          const source = fullExercises.length > 0 ? fullExercises : t.exercises;
          const rows = source.map((ex: any, i: number) => {
            const { sets, reps } = parseSetsReps(ex.series_repetitions);
            const videoUrl = ex.video_url || ex.video_url_thumb || ex.cover_url || "";
            return {
              template_id: tpl.id,
              exercise_id: null,
              custom_name: ex.name,
              custom_description: ex.description || "",
              sets, reps,
              rest_interval: "",
              load_suggestion: "",
              video_url: videoUrl,
              sort_order: i,
            };
          });
          if (rows.length > 0) {
            const { error: e2 } = await supabase.from("workout_template_exercises").insert(rows);
            if (e2) throw e2;
          }
          totalEx += rows.length;
          ok++;
        } catch (err: any) {
          console.error("[import-all]", t.name, err);
          fail++;
        }
        setBulkProgress({ done: idx + 1, total: list.length });
      }
      return { ok, fail, totalEx, total: list.length };
    },
    onSuccess: (r) => {
      toast.success(`Importados ${r.ok}/${r.total} treinos • ${r.totalEx} exercícios${r.fail ? ` • ${r.fail} falharam` : ""}`);
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
      onImported();
      setBulkProgress(null);
    },
    onError: (e: any) => { toast.error(e.message || "Erro ao importar em lote"); setBulkProgress(null); },
  });

  // Importa TODOS os programas do ST Coach: cria um training_programs local por programa (se não houver programId fixo) e importa todos os treinos.
  const importEverythingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      const list = filteredPrograms.length > 0 ? filteredPrograms : programs;
      let totalOk = 0, totalFail = 0, totalEx = 0;
      setMegaProgress({ prog: 0, totalProg: list.length, label: "", ok: 0, fail: 0, totalEx: 0 });
      for (let pi = 0; pi < list.length; pi++) {
        const p = list[pi];
        setMegaProgress({ prog: pi, totalProg: list.length, label: p.name, ok: totalOk, fail: totalFail, totalEx });
        try {
          // 1) Carrega treinos do programa
          const { data: tList, error: eList } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-trainings", programId: p.id } });
          if (eList) throw eList;
          if ((tList as any)?.error) throw new Error((tList as any).error);
          const trs: Training[] = (tList as any)?.trainings || [];

          // 2) Cria (ou reusa) o training_programs local, salvo se programId prop já foi definido
          let localProgramId = programId as string | undefined;
          if (!localProgramId) {
            const { data: np, error: eNp } = await supabase.from("training_programs").insert({
              title: p.name,
              details: p.subtitle || "",
              objective: "hypertrophy",
              difficulty: "intermediate",
              status: "published",
              poster_url: p.cover_url || null,
              created_by: user.id,
              supercoach_program_id: p.id,
            } as any).select("id").single();
            if (eNp) throw eNp;
            localProgramId = (np as any).id;
          }

          // 3) Importa cada treino
          for (const t of trs) {
            try {
              const { data: det, error: eDet } = await supabase.functions.invoke("supercoach-import-workout", {
                body: { action: "get-training-details", programId: p.id, trainingId: t.id },
              });
              if (eDet) throw eDet;
              if ((det as any)?.error) throw new Error((det as any).error);
              const fullExercises: any[] = (det as any)?.exercises || [];
              const { data: tpl, error: e1 } = await supabase.from("workout_templates").insert({
                title: t.name,
                description: [p.name, t.subtitle, t.description].filter(Boolean).join(" • "),
                weeks: t.weeks ? Number(t.weeks) : (p.weeks ? Number(p.weeks) : null),
                days_per_week: t.days_per_week ? Number(t.days_per_week) : (p.days_per_week ? Number(p.days_per_week) : null),
                minutes_per_day: t.minutes_per_day ? Number(t.minutes_per_day) : (p.minutes_per_day ? Number(p.minutes_per_day) : null),
                created_by: user.id,
                ...(localProgramId ? { program_id: localProgramId } : {}),
              }).select("id").single();
              if (e1) throw e1;
              const source = fullExercises.length > 0 ? fullExercises : t.exercises;
              const rows = source.map((ex: any, i: number) => {
                const { sets, reps } = parseSetsReps(ex.series_repetitions);
                const videoUrl = ex.video_url || ex.video_url_thumb || ex.cover_url || "";
                return {
                  template_id: tpl.id,
                  exercise_id: null,
                  custom_name: ex.name,
                  custom_description: ex.description || "",
                  sets, reps,
                  rest_interval: "",
                  load_suggestion: "",
                  video_url: videoUrl,
                  sort_order: i,
                };
              });
              if (rows.length > 0) {
                const { error: e2 } = await supabase.from("workout_template_exercises").insert(rows);
                if (e2) throw e2;
              }
              totalEx += rows.length;
              totalOk++;
            } catch (err: any) {
              console.error("[import-everything] treino falhou", p.name, t.name, err);
              totalFail++;
            }
            setMegaProgress({ prog: pi, totalProg: list.length, label: p.name, ok: totalOk, fail: totalFail, totalEx });
          }
        } catch (err: any) {
          console.error("[import-everything] programa falhou", p.name, err);
          totalFail++;
        }
      }
      setMegaProgress({ prog: list.length, totalProg: list.length, label: "", ok: totalOk, fail: totalFail, totalEx });
      return { ok: totalOk, fail: totalFail, totalEx, totalProg: list.length };
    },
    onSuccess: (r) => {
      toast.success(`Importados ${r.totalProg} programa(s) • ${r.ok} treinos • ${r.totalEx} exercícios${r.fail ? ` • ${r.fail} falharam` : ""}`);
      qc.invalidateQueries({ queryKey: ["workout-templates"] });
      qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
      qc.invalidateQueries({ queryKey: ["training-programs"] });
      onImported();
      setTimeout(() => setMegaProgress(null), 1500);
    },
    onError: (e: any) => { toast.error(e.message || "Erro ao importar tudo"); setMegaProgress(null); },
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
              {filteredPrograms.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30 sticky top-0 z-10">
                  <div className="text-xs text-muted-foreground">
                    {megaProgress
                      ? `Programa ${Math.min(megaProgress.prog + 1, megaProgress.totalProg)}/${megaProgress.totalProg}${megaProgress.label ? ` • ${megaProgress.label}` : ""} • ${megaProgress.ok} treinos ok${megaProgress.fail ? ` • ${megaProgress.fail} falhas` : ""}`
                      : `${filteredPrograms.length} programa(s) — importar TODOS de uma vez`}
                  </div>
                  <Button size="sm" disabled={importEverythingMutation.isPending} onClick={() => importEverythingMutation.mutate()}>
                    {importEverythingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                    Importar TODOS os programas
                  </Button>
                </div>
              )}
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
              {filteredTrainings.length > 0 && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    {bulkProgress
                      ? `Importando ${bulkProgress.done}/${bulkProgress.total}...`
                      : `${filteredTrainings.length} treino(s) prontos para importar`}
                  </div>
                  <Button size="sm" disabled={importAllMutation.isPending || importMutation.isPending} onClick={() => importAllMutation.mutate()}>
                    {importAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                    Importar todos
                  </Button>
                </div>
              )}
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