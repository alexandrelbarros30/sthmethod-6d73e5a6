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

function nullableNumber(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanImageUrl(value: any): string {
  const url = String(value || "").trim();
  if (!url || url.includes("no-video-default")) return "";
  return url;
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

  const invalidateImportedData = () => {
    qc.invalidateQueries({ queryKey: ["workout-templates"] });
    qc.invalidateQueries({ queryKey: ["template-exercises-all"] });
    qc.invalidateQueries({ queryKey: ["training-programs"] });
    onImported();
  };

  const ensureLocalProgram = async (p: Program): Promise<string> => {
    const basePatch = {
      title: p.name,
      subtitle: p.subtitle || null,
      details: p.subtitle || "",
      objective: "hypertrophy",
      difficulty: "intermediate",
      status: "published",
      poster_url: p.cover_url || null,
      updated_at: new Date().toISOString(),
    } as any;

    if (programId) {
      const { error } = await supabase
        .from("training_programs")
        .update({ ...basePatch, supercoach_program_id: p.id })
        .eq("id", programId);
      if (error && (error as any).code !== "23505") throw error;
      if (error && (error as any).code === "23505") {
        const { error: fallbackError } = await supabase
          .from("training_programs")
          .update(basePatch)
          .eq("id", programId);
        if (fallbackError) throw fallbackError;
      }
      return programId;
    }

    const { data: existing, error: existingError } = await supabase
      .from("training_programs")
      .select("id")
      .eq("supercoach_program_id", p.id)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.id) {
      const { error } = await supabase
        .from("training_programs")
        .update(basePatch)
        .eq("id", existing.id);
      if (error) throw error;
      return existing.id;
    }

    const { data: created, error: createError } = await supabase
      .from("training_programs")
      .insert({ ...basePatch, supercoach_program_id: p.id, created_by: user!.id })
      .select("id")
      .single();

    if (createError) {
      if ((createError as any).code === "23505") {
        const { data: retry, error: retryError } = await supabase
          .from("training_programs")
          .select("id")
          .eq("supercoach_program_id", p.id)
          .maybeSingle();
        if (retryError) throw retryError;
        if (retry?.id) return retry.id;
      }
      throw createError;
    }

    return created.id;
  };

  const fetchTrainingExercises = async (p: Program, t: Training): Promise<any[]> => {
    const { data: det, error: detailsError } = await supabase.functions.invoke("supercoach-import-workout", {
      body: { action: "get-training-details", programId: p.id, trainingId: t.id },
    });
    if (detailsError) throw detailsError;
    if ((det as any)?.error) throw new Error((det as any).error);
    const fullExercises: any[] = (det as any)?.exercises || [];
    const source = fullExercises.length > 0 ? fullExercises : (t.exercises || []);
    if (!source.length) throw new Error(`Sem exercícios retornados para ${t.name}`);
    return source;
  };

  const findReusableTemplateId = async (localProgramId: string, p: Program, t: Training): Promise<string | null> => {
    const { data: byTraining, error: byTrainingError } = await supabase
      .from("workout_templates")
      .select("id")
      .eq("program_id", localProgramId)
      .eq("supercoach_training_id", t.id)
      .maybeSingle();
    if (byTrainingError) throw byTrainingError;
    if (byTraining?.id) return byTraining.id;

    const { data: placeholder, error: placeholderError } = await supabase
      .from("workout_templates")
      .select("id")
      .eq("program_id", localProgramId)
      .eq("supercoach_program_id", p.id)
      .is("supercoach_training_id", null)
      .limit(1)
      .maybeSingle();
    if (placeholderError) throw placeholderError;
    return placeholder?.id || null;
  };

  const buildExerciseRows = (templateId: string, source: any[]) => source.map((ex: any, i: number) => {
    const { sets, reps } = parseSetsReps(ex.series_repetitions);
    const videoUrl = ex.video_url || ex.video_url_thumb || "";
    return {
      template_id: templateId,
      exercise_id: null,
      custom_name: ex.name || `Exercício ${i + 1}`,
      custom_description: ex.description || "",
      sets,
      reps,
      rest_interval: ex.intervals != null && Number(ex.intervals) > 0 ? `${ex.intervals}s` : "",
      load_suggestion: ex.weight_suggestion || "",
      video_url: videoUrl,
      image_url: cleanImageUrl(ex.cover_url || ex.video_url_thumb),
      supercoach_workout_id: Number.isFinite(Number(ex.id)) ? Number(ex.id) : null,
      sort_order: i,
    };
  });

  const importTrainingFromProgram = async (p: Program, t: Training, localProgramId: string) => {
    const source = await fetchTrainingExercises(p, t);
    const reusableTemplateId = await findReusableTemplateId(localProgramId, p, t);
    const templatePatch = {
      title: t.name,
      subtitle: t.subtitle || null,
      description: [p.name, t.subtitle, t.description].filter(Boolean).join(" • "),
      image_url: t.cover_url || p.cover_url || "",
      weeks: nullableNumber(t.weeks) ?? nullableNumber(p.weeks),
      days_per_week: nullableNumber(t.days_per_week) ?? nullableNumber(p.days_per_week),
      minutes_per_day: nullableNumber(t.minutes_per_day) ?? nullableNumber(p.minutes_per_day),
      program_id: localProgramId,
      released: true,
      supercoach_program_id: null,
      supercoach_training_id: Number(t.id),
      updated_at: new Date().toISOString(),
    } as any;

    let templateId = reusableTemplateId;
    if (templateId) {
      const { error: updateError } = await supabase
        .from("workout_templates")
        .update(templatePatch)
        .eq("id", templateId);
      if (updateError) throw updateError;
      const { error: deleteError } = await supabase
        .from("workout_template_exercises")
        .delete()
        .eq("template_id", templateId);
      if (deleteError) throw deleteError;
    } else {
      const { data: tpl, error: insertError } = await supabase
        .from("workout_templates")
        .insert({ ...templatePatch, created_by: user!.id })
        .select("id")
        .single();
      if (insertError) throw insertError;
      templateId = tpl.id;
    }

    const rows = buildExerciseRows(templateId, source);
    const { error: exerciseError } = await supabase.from("workout_template_exercises").insert(rows);
    if (exerciseError) throw exerciseError;

    return { count: rows.length, matched: rows.filter((r: any) => r.video_url).length };
  };

  const importMutation = useMutation({
    mutationFn: async (t: Training) => {
      if (!user) throw new Error("Sem sessão");
      if (!selectedProgram) throw new Error("Selecione um programa do ST Coach");
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", {
        body: {
          action: "import-training",
          programId: selectedProgram.id,
          program: selectedProgram,
          training: t,
          localProgramId: programId,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.ok === false) throw new Error((data as any)?.failures?.[0]?.error || "Importação falhou");
      return { count: (data as any)?.exercises || 0, matched: (data as any)?.exercises || 0 };
    },
    onSuccess: (r) => {
      toast.success(`Importado! ${r.count} exercícios (${r.matched} com vídeo do SuperCoach)`);
      invalidateImportedData();
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
      if (!selectedProgram) throw new Error("Selecione um programa do ST Coach");
      setBulkProgress({ done: 0, total: list.length });
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", {
        body: { action: "import-program", programId: selectedProgram.id, program: selectedProgram, localProgramId: programId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      ok = (data as any)?.trainings || 0;
      fail = ((data as any)?.failures || []).length;
      totalEx = (data as any)?.exercises || 0;
      const totalImported = Math.max(list.length, ok + fail);
      setBulkProgress({ done: totalImported, total: totalImported });
      return { ok, fail, totalEx, total: totalImported };
    },
    onSuccess: (r) => {
      toast.success(`Importados ${r.ok}/${r.total} treinos • ${r.totalEx} exercícios${r.fail ? ` • ${r.fail} falharam` : ""}`);
      invalidateImportedData();
      setBulkProgress(null);
    },
    onError: (e: any) => { toast.error(e.message || "Erro ao importar em lote"); setBulkProgress(null); },
  });

  const repairMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      if (!selectedProgram) throw new Error("Selecione um programa do ST Coach");
      setBulkProgress({ done: 0, total: Math.max(filteredTrainings.length, trainings.length, 1) });
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", {
        body: { action: "repair-program", programId: selectedProgram.id, program: selectedProgram, localProgramId: programId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const ok = (data as any)?.trainings || 0;
      const fail = ((data as any)?.failures || []).length;
      const totalEx = (data as any)?.exercises || 0;
      const totalImported = Math.max(ok + fail, 1);
      setBulkProgress({ done: totalImported, total: totalImported });
      return { ok, fail, totalEx };
    },
    onSuccess: (r) => {
      toast.success(`Programa reparado: ${r.ok} treinos • ${r.totalEx} exercícios${r.fail ? ` • ${r.fail} falharam` : ""}`);
      invalidateImportedData();
      setBulkProgress(null);
    },
    onError: (e: any) => { toast.error(e.message || "Erro ao reparar programa"); setBulkProgress(null); },
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
          const { data, error } = await supabase.functions.invoke("supercoach-import-workout", {
            body: { action: "import-program", programId: p.id, program: p, localProgramId: programId },
          });
          if (error) throw error;
          if ((data as any)?.error) throw new Error((data as any).error);
          totalOk += (data as any)?.trainings || 0;
          totalEx += (data as any)?.exercises || 0;
          totalFail += ((data as any)?.failures || []).length;
          setMegaProgress({ prog: pi, totalProg: list.length, label: p.name, ok: totalOk, fail: totalFail, totalEx });
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
      invalidateImportedData();
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={repairMutation.isPending || importAllMutation.isPending || importMutation.isPending} onClick={() => repairMutation.mutate()}>
                      {repairMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                      Reparar programa
                    </Button>
                    <Button size="sm" disabled={importAllMutation.isPending || importMutation.isPending || repairMutation.isPending} onClick={() => importAllMutation.mutate()}>
                      {importAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                      Importar todos
                    </Button>
                  </div>
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