import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, Camera, Wand2, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { normalizeSearch } from "@/lib/utils";
import AICreditUsage from "@/components/shared/AICreditUsage";

type Mode = "generate" | "copilot" | "analyze";

const MODE_META: Record<Mode, { label: string; hint: string; icon: any }> = {
  generate: { label: "Gerador completo", hint: "IA monta programa inteiro (anamnese → periodização → treinos → progressão).", icon: Wand2 },
  copilot:  { label: "Copiloto",         hint: "Peça ajustes cirúrgicos: substituir exercício, progredir carga, redistribuir semana.", icon: Sparkles },
  analyze:  { label: "Análise visual",   hint: "Envie fotos do aluno (frente/costas/perfil) para avaliação estética corporal.", icon: Camera },
};

interface Props {
  triggerLabel?: string;
  defaultStudentId?: string | null;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "secondary";
}

export default function AiWorkoutCoachDialog({ triggerLabel, defaultStudentId, size = "default", variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("generate");
  const [studentId, setStudentId] = useState<string>(defaultStudentId || "");
  const [studentSearch, setStudentSearch] = useState("");
  const [instruction, setInstruction] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [response, setResponse] = useState("");
  const [usage, setUsage] = useState<any>(null);
  const [usedModel, setUsedModel] = useState<string | undefined>();

  const { data: students } = useQuery({
    queryKey: ["ai-coach-students"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").order("full_name");
      return data || [];
    },
  });

  const filteredStudents = useMemo(() => {
    const q = normalizeSearch(studentSearch);
    if (!q) return (students || []).slice(0, 30);
    return (students || []).filter((s: any) =>
      normalizeSearch(s.full_name || "").includes(q) || normalizeSearch(s.email || "").includes(q)
    ).slice(0, 30);
  }, [students, studentSearch]);

  const selectedStudent = (students || []).find((s: any) => s.user_id === studentId);

  const handleImage = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 8 - images.length);
    const next: { url: string; name: string }[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: máx 5MB`); continue; }
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      next.push({ url: b64, name: f.name });
    }
    setImages(prev => [...prev, ...next]);
  };

  const runMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-workout-coach", {
        body: {
          mode,
          studentId: studentId || undefined,
          instruction: instruction.trim(),
          imageUrls: mode === "analyze" ? images.map(i => i.url) : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { response: string; usage?: any; model?: string };
    },
    onSuccess: (d) => { setResponse(d.response || ""); setUsage(d.usage || null); setUsedModel(d.model); },
    onError: (e: any) => toast.error(e.message || "Erro ao chamar IA"),
  });

  const canRun = mode === "analyze"
    ? images.length > 0
    : instruction.trim().length > 3;

  const copyResponse = async () => {
    try { await navigator.clipboard.writeText(response); toast.success("Copiado"); } catch { toast.error("Falha ao copiar"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResponse(""); setInstruction(""); setImages([]); setUsage(null); } }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1">
          <Sparkles className="w-4 h-4" />
          {triggerLabel || "STHIA · Treinos"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            STHIA — Elite Coach AI (Treinos)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Modo */}
          <div>
            <Label>Modo</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
              {(Object.keys(MODE_META) as Mode[]).map(m => {
                const Icon = MODE_META[m].icon;
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`text-left p-3 rounded-lg border transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm"><Icon className="w-4 h-4" /> {MODE_META[m].label}</div>
                    <p className="text-xs text-muted-foreground mt-1">{MODE_META[m].hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aluno */}
          <div>
            <Label className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Aluno (opcional — envia dossiê completo pra IA)</Label>
            {selectedStudent ? (
              <div className="flex items-center gap-2 mt-1.5 p-2 rounded-md border bg-muted/40">
                <Badge variant="secondary" className="text-xs">Selecionado</Badge>
                <span className="text-sm truncate flex-1">{selectedStudent.full_name || selectedStudent.email}</span>
                <Button size="sm" variant="ghost" onClick={() => { setStudentId(""); setStudentSearch(""); }}><X className="w-3 h-3" /></Button>
              </div>
            ) : (
              <div className="space-y-1.5 mt-1.5">
                <Input placeholder="Buscar por nome ou email..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                {studentSearch && filteredStudents.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredStudents.map((s: any) => (
                      <button
                        key={s.user_id}
                        onClick={() => { setStudentId(s.user_id); setStudentSearch(""); }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent border-b last:border-b-0"
                      >
                        <div className="truncate">{s.full_name || "(sem nome)"}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instrução */}
          {mode !== "analyze" && (
            <div>
              <Label>Instrução</Label>
              <Textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                rows={mode === "generate" ? 5 : 3}
                className="mt-1.5"
                placeholder={
                  mode === "generate"
                    ? "Ex.: Programa de hipertrofia 12 semanas, 5x/semana, foco em ombros e posteriores. Aluno intermediário, treina em academia completa, 60min/sessão."
                    : "Ex.: Substituir agachamento livre por hack squat (aluno com dor lombar) mantendo o volume. Progredir carga do supino inclinado."
                }
              />
            </div>
          )}

          {/* Imagens (analyze) */}
          {mode === "analyze" && (
            <div>
              <Label>Fotos do aluno (até 8) — poses padronizadas</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-md border overflow-hidden bg-muted">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button onClick={() => setImages(prev => prev.filter((_, x) => x !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {images.length < 8 && (
                  <label className="aspect-[3/4] rounded-md border-2 border-dashed grid place-items-center cursor-pointer hover:bg-accent text-xs text-muted-foreground text-center p-2">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImage(e.target.files)} />
                    <div><Camera className="w-5 h-5 mx-auto mb-1" />Adicionar foto</div>
                  </label>
                )}
              </div>
              <Textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                rows={2}
                className="mt-2"
                placeholder="Contexto opcional: fase atual do aluno, objetivo, pontos que quer priorizar na análise..."
              />
            </div>
          )}

          {/* Ação */}
          <div className="flex justify-end">
            <Button onClick={() => runMutation.mutate()} disabled={!canRun || runMutation.isPending}>
              {runMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Consultando STHIA...</> : <><Sparkles className="w-4 h-4 mr-1" /> Gerar resposta</>}
            </Button>
          </div>

          {/* Resposta */}
          {response && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Resposta STHIA</div>
                <Button size="sm" variant="ghost" onClick={copyResponse}><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</Button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
              <AICreditUsage model={usedModel} usage={usage} label="Consumo desta geração de treino" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}