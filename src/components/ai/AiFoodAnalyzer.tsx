import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MEAL_TYPES } from "@/lib/food-diary-storage";
import { cn } from "@/lib/utils";
import { Camera, Check, Loader2, Mic, Sparkles, Square, Tag, Utensils } from "lucide-react";

type Mode = "photo" | "label" | "text" | "audio";

const todayISO = () => new Date().toISOString().slice(0, 10);

async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<string> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type || "image/jpeg" });
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) {
    return await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ""));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function AiFoodAnalyzer({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("photo");
  const [text, setText] = useState("");
  const [imgB64, setImgB64] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recSeconds, setRecSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recMimeRef = useRef("audio/webm");
  const timerRef = useRef<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<string>("almoco");
  const [addDate, setAddDate] = useState<string>(todayISO());
  const [adding, setAdding] = useState(false);

  function reset() {
    setText(""); setImgB64(null); setImgPreview(null); setResult(null); setTranscript(""); setRecSeconds(0);
  }

  function stopStream() {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const chosen = candidates.find((c) => MediaRecorder.isTypeSupported?.(c)) || "";
      const rec = chosen ? new MediaRecorder(stream, { mimeType: chosen }) : new MediaRecorder(stream);
      recMimeRef.current = rec.mimeType || chosen || "audio/webm";
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recMimeRef.current });
        stopStream();
        setRecording(false);
        if (blob.size < 1024) { toast.error("Gravação muito curta. Tente novamente."); return; }
        await transcribe(blob);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = window.setInterval(() => setRecSeconds((s) => s + 1), 1000) as unknown as number;
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || "").split(",")[1] || "");
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("food-ai-transcribe", {
        body: { audio: b64, mime: blob.type || recMimeRef.current },
      });
      if (error) throw new Error(error.message);
      const txt = String((data as any)?.text || "").trim();
      if (!txt) { toast.error("Não consegui entender o áudio. Fale um pouco mais alto."); return; }
      setTranscript(txt);
    } catch (e) {
      toast.error((e as Error)?.message || "Falha ao transcrever o áudio.");
    } finally {
      setTranscribing(false);
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setImgPreview(dataUrl);
      setImgB64(dataUrl.split(",")[1] || "");
    } catch {
      toast.error("Não foi possível preparar a foto.");
    }
  }

  async function analyze() {
    setLoading(true);
    setResult(null);
    try {
      const isAudio = mode === "audio";
      const analyzeMode = isAudio || mode === "text" ? "text" : mode;
      const { data, error } = await supabase.functions.invoke("food-ai-analyze", {
        body: {
          mode: analyzeMode,
          text: isAudio ? transcript.trim() : mode === "text" ? text.trim() : undefined,
          image: !isAudio && mode !== "text" ? imgB64 : undefined,
          mime: "image/jpeg",
          audit_source: isAudio ? "ai_app_audio" : "ai_app_standalone",
          student_id: user?.id ?? null,
        },
      });
      if (error) throw new Error(error.message || "analysis_failed");
      if ((data as any)?.error) throw new Error((data as any).details || (data as any).error);
      setResult(data);
      setTimeout(onSaved, 400);
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível analisar agora.");
    } finally {
      setLoading(false);
    }
  }

  async function addToDiary() {
    if (!user || !result?.foods?.length) return;
    setAdding(true);
    try {
      const meal = MEAL_TYPES.find((m) => m.key === addMeal);
      const rows = (result.foods as any[]).map((f) => ({
        user_id: user.id,
        log_date: addDate,
        meal_type: addMeal,
        meal_label: meal?.label || addMeal,
        food_id: null,
        item_name: String(f.name || "Alimento"),
        quantity: Number(f.estimated_weight_g) || 0,
        unit: f.unit === "ml" ? "ml" : "g",
        energy_kcal: +Number(f.calories || 0).toFixed(1),
        protein_g: +Number(f.protein_g || 0).toFixed(2),
        carbs_g: +Number(f.carbs_g || 0).toFixed(2),
        fat_g: +Number(f.fat_g || 0).toFixed(2),
        fiber_g: +Number(f.fiber_g || 0).toFixed(2),
        sodium_mg: +Number(f.sodium_mg || 0).toFixed(1),
        sort_order: 0,
      }));
      const { data: inserted, error } = await supabase.from("food_diary_entries").insert(rows).select("id");
      if (error) throw error;
      const logId = (result as any)?.log_id as string | undefined;
      if (logId && inserted?.length) {
        await supabase
          .from("food_ai_logs")
          .update({
            diary_entry_ids: inserted.map((r: any) => r.id),
            meal_type: addMeal,
            meal_label: meal?.label || addMeal,
            log_date: addDate,
          })
          .eq("id", logId);
      }
      toast.success(`Adicionado ao diário — ${meal?.label || addMeal}`);
      setAddOpen(false);
      reset();
      onSaved();
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível adicionar ao diário.");
    } finally {
      setAdding(false);
    }
  }

  const canAnalyze =
    (mode === "text" && text.trim().length >= 3) ||
    (mode === "audio" && transcript.trim().length >= 3) ||
    ((mode === "photo" || mode === "label") && !!imgB64);

  const chip = "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium h-10 rounded-xl transition-colors";
  const modes: { key: Mode; label: string; icon: typeof Camera }[] = [
    { key: "photo", label: "Foto", icon: Camera },
    { key: "label", label: "Rótulo", icon: Tag },
    { key: "text", label: "Texto", icon: Sparkles },
    { key: "audio", label: "Áudio", icon: Mic },
  ];

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Registrar refeição</h2>
        <p className="text-xs text-muted-foreground">Foto do prato, rótulo, texto ou áudio — sem pesar nada.</p>
      </div>

      <div className="flex gap-1 rounded-2xl bg-muted p-1">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => { setMode(m.key); setResult(null); }}
              className={cn(chip, mode === m.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
            >
              <Icon className="h-3.5 w-3.5" /> {m.label}
            </button>
          );
        })}
      </div>

      {mode === "audio" ? (
        <div className="space-y-3">
          {!transcript && (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 text-center">
              <button
                type="button"
                onClick={recording ? () => recRef.current?.stop() : startRecording}
                disabled={transcribing}
                className={cn(
                  "mx-auto grid h-16 w-16 place-items-center rounded-full transition-colors",
                  recording ? "animate-pulse bg-destructive text-destructive-foreground" : "border border-border bg-background text-primary",
                )}
              >
                {recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <p className="mt-3 text-sm font-medium">
                {transcribing ? "Transcrevendo…" : recording ? `Gravando… ${Math.floor(recSeconds / 60)}:${String(recSeconds % 60).padStart(2, "0")}` : "Toque para falar sua refeição"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Ex.: “no almoço comi arroz, feijão, bife e salada”</p>
            </div>
          )}
          {transcript && (
            <div className="space-y-2 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Transcrição</span>
                <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => { setTranscript(""); setResult(null); }}>
                  Regravar
                </button>
              </div>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      ) : mode === "text" ? (
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ex.: "2 ovos mexidos, 1 pão francês, café com leite"'
          className="w-full resize-none rounded-2xl border border-border bg-muted/40 p-4 text-sm outline-none focus:border-primary"
        />
      ) : (
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 text-center transition-colors hover:border-primary">
          <input
            type="file"
            accept="image/*"
            capture={mode === "photo" ? "environment" : undefined}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {imgPreview ? (
            <img src={imgPreview} alt="Prévia da refeição" className="mx-auto max-h-56 rounded-xl object-contain" />
          ) : (
            <div className="py-4">
              <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">{mode === "photo" ? "Fotografar o prato" : "Fotografar o rótulo"}</p>
              <p className="text-xs text-muted-foreground">Toque para escolher ou capturar</p>
            </div>
          )}
        </label>
      )}

      <Button className="w-full" onClick={analyze} disabled={!canAnalyze || loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Analisar com a STHIA
      </Button>

      {result && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{Math.round(Number(result.total_calories || 0))} kcal</Badge>
            <Badge variant="outline">P {Math.round(Number(result.total_protein_g || 0))}g</Badge>
            <Badge variant="outline">C {Math.round(Number(result.total_carbs_g || 0))}g</Badge>
            <Badge variant="outline">G {Math.round(Number(result.total_fat_g || 0))}g</Badge>
            {result.classification && <Badge>{String(result.classification)}</Badge>}
          </div>
          {Array.isArray(result.foods) && (
            <ul className="space-y-1 text-sm">
              {result.foods.map((f: any, i: number) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{f.name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(Number(f.estimated_weight_g || 0))}{f.unit === "ml" ? "ml" : "g"} · {Math.round(Number(f.calories || 0))} kcal
                  </span>
                </li>
              ))}
            </ul>
          )}
          {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sugestões STHIA</p>
              <ul className="mt-1 space-y-1 text-sm">
                {result.suggestions.slice(0, 3).map((s: string, i: number) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => setAddOpen(true)}>
              <Utensils className="mr-2 h-4 w-4" /> Adicionar ao diário
            </Button>
            <Button variant="ghost" onClick={reset}>Descartar</Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Estimativa por IA — confira antes de usar. Não substitui orientação profissional.
          </p>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar ao diário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Refeição</span>
              <Select value={addMeal} onValueChange={setAddMeal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Data</span>
              <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={addToDiary} disabled={adding}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
