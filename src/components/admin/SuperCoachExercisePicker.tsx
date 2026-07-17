import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Eye, Loader2, Search, Video, Zap } from "lucide-react";
import { toast } from "sonner";

interface ScProgram { id: number | string; name: string; subtitle?: string | null; cover_url?: string | null }
interface ScTraining { id: number | string; name: string; subtitle?: string | null; description?: string | null }
interface ScExercise {
  id: number | string;
  name: string;
  series_repetitions?: string;
  description?: string;
  video_url?: string;
  cover_url?: string | null;
  intervals?: any;
  weight_suggestion?: string | null;
}

export interface PickedScExercise {
  name: string;
  description: string;
  video_url: string;
  sets: string;
  reps: string;
  rest_interval: string;
  load_suggestion: string;
}

interface Props {
  onAdd: (items: PickedScExercise[]) => void;
  buttonSize?: "sm" | "default";
  buttonVariant?: "outline" | "default" | "secondary" | "ghost";
  buttonLabel?: string;
}

const parseSetsReps = (s?: string): { sets: string; reps: string } => {
  if (!s) return { sets: "", reps: "" };
  const m = s.match(/(\d+)\s*[xX×]\s*([\dA-Za-z\-\s"']+)/);
  if (m) return { sets: m[1], reps: m[2].trim() };
  return { sets: "", reps: s };
};

const normalize = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function SuperCoachExercisePicker({ onAdd, buttonSize = "sm", buttonVariant = "outline", buttonLabel = "ST Coach (vídeos)" }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"library" | "programs">("library");
  const [step, setStep] = useState<"programs" | "trainings" | "exercises" | "library">("library");
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<ScProgram[]>([]);
  const [trainings, setTrainings] = useState<ScTraining[]>([]);
  const [exercises, setExercises] = useState<ScExercise[]>([]);
  const [library, setLibrary] = useState<ScExercise[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ScProgram | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<ScTraining | null>(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ScExercise | null>(null);

  const toEmbed = (url: string): string => {
    if (!url) return "";
    // Vimeo
    const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (v) return `https://player.vimeo.com/video/${v[1]}?autoplay=1`;
    // YouTube
    const y = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (y) return `https://www.youtube.com/embed/${y[1]}?autoplay=1`;
    return url;
  };

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-library" } });
      if (error) throw error;
      setLibrary(data?.exercises || []);
    } catch (e: any) {
      toast.error(`Falha ao carregar biblioteca: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-programs" } });
      if (error) throw error;
      setPrograms(data?.programs || []);
    } catch (e: any) {
      toast.error(`Falha ao listar programas: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTrainings = async (p: ScProgram) => {
    setSelectedProgram(p);
    setStep("trainings");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", { body: { action: "list-trainings", programId: p.id } });
      if (error) throw error;
      setTrainings(data?.trainings || []);
    } catch (e: any) {
      toast.error(`Falha ao listar treinos: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async (t: ScTraining) => {
    if (!selectedProgram) return;
    setSelectedTraining(t);
    setStep("exercises");
    setLoading(true);
    setPicked(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("supercoach-import-workout", {
        body: { action: "get-training-details", programId: selectedProgram.id, trainingId: t.id },
      });
      if (error) throw error;
      setExercises(data?.exercises || []);
    } catch (e: any) {
      toast.error(`Falha ao carregar exercícios: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async () => {
    setOpen(true);
    setMode("library");
    setStep("library");
    setSelectedProgram(null);
    setSelectedTraining(null);
    setSearch("");
    setPicked(new Set());
    if (library.length === 0) await loadLibrary();
  };

  const switchMode = async (m: "library" | "programs") => {
    setMode(m);
    setSearch("");
    setPicked(new Set());
    setSelectedProgram(null);
    setSelectedTraining(null);
    if (m === "library") {
      setStep("library");
      if (library.length === 0) await loadLibrary();
    } else {
      setStep("programs");
      if (programs.length === 0) await loadPrograms();
    }
  };

  const filteredPrograms = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return programs;
    return programs.filter((p) => normalize(p.name || "").includes(q));
  }, [programs, search]);
  const filteredTrainings = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return trainings;
    return trainings.filter((t) => normalize(t.name || "").includes(q));
  }, [trainings, search]);
  const filteredExercises = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return exercises;
    return exercises.filter((e) => normalize(e.name || "").includes(q));
  }, [exercises, search]);
  const filteredLibrary = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return library;
    return library.filter((e) => normalize(e.name || "").includes(q));
  }, [library, search]);

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmAdd = () => {
    const pool = step === "library" ? library : exercises;
    const chosen = pool.filter((e) => picked.has(String(e.id)));
    if (!chosen.length) return;
    const items: PickedScExercise[] = chosen.map((e) => {
      const sr = parseSetsReps(e.series_repetitions);
      const interval = e.intervals && typeof e.intervals === "object"
        ? (e.intervals?.rest || e.intervals?.time || "")
        : (typeof e.intervals === "string" ? e.intervals : "");
      return {
        name: e.name || "",
        description: e.description || "",
        video_url: e.video_url || (e as any).video_url_thumb || e.cover_url || "",
        sets: sr.sets,
        reps: sr.reps,
        rest_interval: String(interval || ""),
        load_suggestion: e.weight_suggestion || "",
      };
    });
    onAdd(items);
    toast.success(`${items.length} exercício(s) adicionado(s) com vídeo do ST Coach!`);
    setOpen(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => (v ? openDialog() : setOpen(false))}>
      <DialogTrigger asChild>
        <Button size={buttonSize} variant={buttonVariant}>
          <Zap className="w-3 h-3 mr-1" /> {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(step === "trainings" || step === "exercises") && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  if (step === "exercises") { setStep("trainings"); setSelectedTraining(null); setPicked(new Set()); }
                  else if (step === "trainings") { setStep("programs"); setSelectedProgram(null); setTrainings([]); }
                  setSearch("");
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <span className="truncate">
              {step === "library" && "ST Coach · Biblioteca de exercícios"}
              {step === "programs" && "ST Coach · Escolha um programa"}
              {step === "trainings" && `Treinos de: ${selectedProgram?.name || ""}`}
              {step === "exercises" && `Exercícios: ${selectedTraining?.name || ""}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button size="sm" variant={mode === "library" ? "default" : "outline"} onClick={() => switchMode("library")}>
            Biblioteca
          </Button>
          <Button size="sm" variant={mode === "programs" ? "default" : "outline"} onClick={() => switchMode("programs")}>
            Programas / Treinos
          </Button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={
              step === "library" ? "Buscar exercício na biblioteca..."
              : step === "programs" ? "Buscar programa..."
              : step === "trainings" ? "Buscar treino..."
              : "Buscar exercício..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando do ST Coach...
            </div>
          ) : step === "library" ? (
            <div className="space-y-2">
              {filteredLibrary.slice(0, 300).map((e) => {
                const id = String(e.id);
                const checked = picked.has(id);
                return (
                  <label
                    key={id}
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition ${checked ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => togglePick(id)} className="mt-0.5" />
                    {e.cover_url && (
                      <img src={e.cover_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" onError={(ev: any) => ev.target.style.display = 'none'} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{e.name}</p>
                        {e.video_url && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Video className="w-2.5 h-2.5" /> ST Coach
                          </Badge>
                        )}
                      </div>
                    </div>
                    {(e.video_url || e.cover_url) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 shrink-0"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPreview(e); }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                      </Button>
                    )}
                  </label>
                );
              })}
              {filteredLibrary.length > 300 && (
                <p className="text-xs text-muted-foreground text-center py-2">Mostrando 300 de {filteredLibrary.length}. Refine a busca.</p>
              )}
              {!filteredLibrary.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum exercício.</p>}
            </div>
          ) : step === "programs" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredPrograms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadTrainings(p)}
                  className="text-left border rounded-lg p-3 hover:bg-muted transition"
                >
                  <p className="font-medium truncate">{p.name}</p>
                  {p.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{p.subtitle}</p>}
                </button>
              ))}
              {!filteredPrograms.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum programa.</p>}
            </div>
          ) : step === "trainings" ? (
            <div className="space-y-2">
              {filteredTrainings.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadExercises(t)}
                  className="w-full text-left border rounded-lg p-3 hover:bg-muted transition"
                >
                  <p className="font-medium truncate">{t.name}</p>
                  {t.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{t.subtitle}</p>}
                </button>
              ))}
              {!filteredTrainings.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum treino.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map((e) => {
                const id = String(e.id);
                const checked = picked.has(id);
                return (
                  <label
                    key={id}
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition ${checked ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => togglePick(id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{e.name}</p>
                        {e.video_url && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Video className="w-2.5 h-2.5" /> ST Coach
                          </Badge>
                        )}
                      </div>
                      {e.series_repetitions && (
                        <p className="text-xs text-muted-foreground mt-0.5">{e.series_repetitions}</p>
                      )}
                    </div>
                    {(e.video_url || e.cover_url) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 shrink-0"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setPreview(e); }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                      </Button>
                    )}
                  </label>
                );
              })}
              {!filteredExercises.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum exercício.</p>}
            </div>
          )}
        </div>

        {(step === "exercises" || step === "library") && (
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {picked.size} selecionado(s) · vídeo e nome vêm do ST Coach
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={confirmAdd} disabled={picked.size === 0}>
                Adicionar {picked.size ? `(${picked.size})` : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {preview && (
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {preview.name}
              <Badge variant="outline" className="text-[10px] gap-1">
                <Video className="w-2.5 h-2.5" /> ST Coach
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "16 / 9" }}>
              {preview.video_url ? (
                <iframe
                  src={toEmbed(preview.video_url)}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : preview.cover_url ? (
                <img src={preview.cover_url} alt={preview.name} className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Sem mídia</div>
              )}
            </div>
            {preview.series_repetitions && (
              <p className="text-sm"><span className="text-muted-foreground">Séries × Reps:</span> {preview.series_repetitions}</p>
            )}
            {preview.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{preview.description}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Vídeo de referência técnica — © ST Coach</p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setPreview(null)}>Fechar</Button>
              <Button
                size="sm"
                onClick={() => {
                  togglePick(String(preview.id));
                  setPreview(null);
                }}
              >
                {picked.has(String(preview.id)) ? "Desmarcar" : "Selecionar este"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}