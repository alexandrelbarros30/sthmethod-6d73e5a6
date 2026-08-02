import { useEffect, useRef, useState } from "react";
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
import { Camera, Check, Image as ImageIcon, Loader2, Mic, Sparkles, Square, Tag, Utensils } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as NativeCamera, CameraResultType, CameraSource } from "@capacitor/camera";

type Mode = "photo" | "label" | "text" | "audio";

const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

// No APK o <input type="file" capture> abre a câmera do sistema, mas o
// Android pode destruir a Activity do WebView e o onChange nunca dispara —
// a foto some sem erro. O plugin nativo devolve o base64 direto.
async function nativeCapture(source: CameraSource): Promise<string | null> {
  const shot = await NativeCamera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source,
    width: 1400,
    correctOrientation: true,
  });
  if (!shot?.base64String) return null;
  const fmt = (shot.format || "jpeg").toLowerCase();
  const mime = fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${shot.base64String}`;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const DRAFT_KEY = "sth_food_ai_photo_draft";

// Grava PCM via Web Audio e codifica WAV 16 kHz mono.
// WebM/Opus é rejeitado pelo modelo de transcrição — WAV funciona em todos os navegadores.
function encodeWav(chunks: Float32Array[], sampleRate: number, targetRate = 16000): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  const ratio = sampleRate / targetRate;
  const outLen = Math.max(1, Math.floor(merged.length / ratio));
  const samples = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] || 0));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const wr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); wr(8, "WAVE");
  wr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  wr(36, "data"); view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = () => rej(r.error || new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

// Decodifica em 2 estágios (createImageBitmap → <img>), pois WebViews Android
// e HEIC do iOS falham no primeiro caminho.
async function decodeImage(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height, draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h) };
  } catch { /* fallback */ }
  try {
    const url = await readAsDataUrl(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = () => rej(new Error("img_decode_failed"));
      el.src = url;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    };
  } catch { return null; }
}

// Sempre devolve JPEG (o modelo não aceita HEIC) e mantém o payload abaixo de ~1,5 MB.
async function compressImage(file: File, maxSide = 1400): Promise<string> {
  const decoded = await decodeImage(file);
  if (!decoded) {
    const raw = await readAsDataUrl(file);
    if (!/^data:image\/(jpeg|jpg|png|webp);/i.test(raw)) throw new Error("unsupported_image");
    return raw;
  }
  const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(decoded.width * scale));
  canvas.height = Math.max(1, Math.round(decoded.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const raw = await readAsDataUrl(file);
    if (/^data:image\/(jpeg|jpg|png|webp);/i.test(raw)) return raw;
    throw new Error("canvas_unavailable");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  decoded.draw(ctx, canvas.width, canvas.height);
  let quality = 0.82;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > 1_500_000 && quality > 0.4) {
    quality -= 0.15;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  // WebViews Android podem devolver canvas vazio ("data:,") — cai no arquivo original.
  if (!out.startsWith("data:image/jpeg") || out.length < 3000) {
    const raw = await readAsDataUrl(file);
    if (/^data:image\/(jpeg|jpg|png|webp);/i.test(raw)) return raw;
    throw new Error("encode_failed");
  }
  return out;
}

export default function AiFoodAnalyzer({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("photo");
  const [text, setText] = useState("");
  const [imgB64, setImgB64] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  // Câmera embutida (web): evita o <input capture>, que em vários navegadores
  // mobile devolve o arquivo vazio ou perde o state ao voltar da câmera nativa.
  const [camOpen, setCamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    try { camStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    camStreamRef.current = null;
    setCamOpen(false);
  }

  useEffect(() => () => { try { camStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ } }, []);

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { cameraInputRef.current?.click(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1600 } },
        audio: false,
      });
      camStreamRef.current = stream;
      setCamOpen(true);
      setTimeout(() => {
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        v.play().catch(() => { /* noop */ });
      }, 50);
    } catch {
      cameraInputRef.current?.click();
    }
  }

  function captureFromCamera() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setErrMsg("Câmera ainda carregando. Tente novamente."); return; }
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { setErrMsg("Não foi possível capturar a foto neste aparelho."); return; }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    stopCamera();
    if (!dataUrl.startsWith("data:image/jpeg") || dataUrl.length < 3000) {
      setErrMsg("A captura falhou. Tente pela galeria.");
      return;
    }
    applyImage(dataUrl);
  }

  // Android WebView pode reiniciar a activity ao abrir a câmera e perder o state.
  // Restauramos o rascunho da foto ao montar.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { mode: Mode; dataUrl: string; at: number };
      if (!draft?.dataUrl || Date.now() - (draft.at || 0) > 30 * 60 * 1000) {
        sessionStorage.removeItem(DRAFT_KEY);
        return;
      }
      setMode(draft.mode === "label" ? "label" : "photo");
      setImgPreview(draft.dataUrl);
      setImgB64(draft.dataUrl.split(",")[1] || "");
    } catch { /* noop */ }
  }, []);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recSeconds, setRecSeconds] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<string>("almoco");
  const [addDate, setAddDate] = useState<string>(todayISO());
  const [adding, setAdding] = useState(false);

  function reset() {
    setText(""); setImgB64(null); setImgPreview(null); setResult(null); setTranscript(""); setRecSeconds(0);
    setErrMsg(null);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
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
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      pcmRef.current = [];
      node.onaudioprocess = (e) => pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(ctx.destination);
      audioCtxRef.current = ctx;
      nodeRef.current = node;
      sourceRef.current = source;
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = window.setInterval(() => setRecSeconds((s) => s + 1), 1000) as unknown as number;
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }

  async function stopRecording() {
    const ctx = audioCtxRef.current;
    try { nodeRef.current?.disconnect(); sourceRef.current?.disconnect(); } catch { /* noop */ }
    nodeRef.current = null; sourceRef.current = null;
    stopStream();
    setRecording(false);
    const rate = ctx?.sampleRate || 44100;
    try { await ctx?.close(); } catch { /* noop */ }
    audioCtxRef.current = null;
    const blob = encodeWav(pcmRef.current, rate);
    pcmRef.current = [];
    if (blob.size < 4096) { toast.error("Gravação muito curta. Tente novamente."); return; }
    await transcribe(blob);
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
        body: { audio: b64, mime: "audio/wav" },
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
    setPreparing(true);
    setErrMsg(null);
    try {
      const dataUrl = await compressImage(file);
      if (!dataUrl || dataUrl.length < 1000) throw new Error("empty_image");
      applyImage(dataUrl);
    } catch (e) {
      setImgB64(null);
      setImgPreview(null);
      const code = (e as Error)?.message || "";
      const msg = code === "unsupported_image"
        ? "Formato de imagem não suportado. Tente escolher a foto pela galeria (JPG ou PNG)."
        : "Não foi possível preparar a foto neste aparelho. Tente novamente pela galeria.";
      setErrMsg(msg);
      toast.error(msg);
    } finally {
      setPreparing(false);
    }
  }

  function applyImage(dataUrl: string) {
    setImgPreview(dataUrl);
    setImgB64(dataUrl.split(",")[1] || "");
    setResult(null);
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ mode, dataUrl, at: Date.now() })); } catch { /* noop */ }
  }

  // Câmera/galeria: usa o plugin nativo no APK e o <input file> no navegador.
  async function pickImage(from: "camera" | "gallery") {
    setErrMsg(null);
    if (!isNative()) {
      if (from === "camera") { void openCamera(); return; }
      galleryInputRef.current?.click();
      return;
    }
    setPreparing(true);
    try {
      const dataUrl = await nativeCapture(from === "camera" ? CameraSource.Camera : CameraSource.Photos);
      if (!dataUrl) throw new Error("empty_image");
      applyImage(dataUrl);
    } catch (e) {
      const raw = String((e as Error)?.message || "");
      if (/cancel/i.test(raw)) return;
      const msg = /permission|denied/i.test(raw)
        ? "Permissão de câmera negada. Libere o acesso nas configurações do app."
        : "Não foi possível capturar a foto. Tente pela galeria.";
      setErrMsg(msg);
      toast.error(msg);
    } finally {
      setPreparing(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setResult(null);
    try {
      const isAudio = mode === "audio";
      const analyzeMode = isAudio || mode === "text" ? "text" : mode;
      const isImage = analyzeMode === "photo" || analyzeMode === "label";
      if (isImage && !imgB64) throw new Error("Escolha ou capture uma foto antes de analisar.");
      const { data, error } = await supabase.functions.invoke("food-ai-analyze", {
        body: {
          mode: analyzeMode,
          text: isAudio ? transcript.trim() : mode === "text" ? text.trim() : undefined,
          image: isImage ? imgB64 : undefined,
          mime: "image/jpeg",
          audit_source: isAudio ? "ai_app_audio" : "ai_app_standalone",
          student_id: user?.id ?? null,
        },
      });
      if (error) {
        let detail = "";
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx.json === "function") {
            const j = await ctx.json();
            detail = String(j?.details || j?.error || "");
          }
        } catch { /* noop */ }
        throw new Error(detail || error.message || "analysis_failed");
      }
      if ((data as any)?.error) throw new Error((data as any).details || (data as any).error);
      setResult(data);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      setTimeout(onSaved, 400);
    } catch (e) {
      const msg = (e as Error)?.message || "Não foi possível analisar agora.";
      setErrMsg(msg);
      toast.error(msg);
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
                onClick={recording ? stopRecording : startRecording}
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
        <div className="space-y-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { onFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { onFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
          />
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 text-center">
            {preparing ? (
              <div className="py-6">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Preparando a foto…</p>
              </div>
            ) : imgPreview ? (
              <img src={imgPreview} alt="Prévia da refeição" className="mx-auto max-h-56 rounded-xl object-contain" />
            ) : (
              <div className="py-4">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">{mode === "photo" ? "Fotografar o prato" : "Fotografar o rótulo"}</p>
                <p className="text-xs text-muted-foreground">Use a câmera ou escolha da galeria</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" disabled={preparing} onClick={() => pickImage("camera")}>
              <Camera className="mr-2 h-4 w-4" /> Câmera
            </Button>
            <Button type="button" variant="outline" className="flex-1" disabled={preparing} onClick={() => pickImage("gallery")}>
              <ImageIcon className="mr-2 h-4 w-4" /> Galeria
            </Button>
          </div>
          {imgPreview && (
            <button type="button" className="w-full text-center text-[11px] text-muted-foreground hover:underline" onClick={() => { setImgB64(null); setImgPreview(null); setResult(null); try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ } }}>
              Remover foto
            </button>
          )}
        </div>
      )}

      {errMsg && (
        <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errMsg}</p>
      )}

      <Button className="w-full" onClick={analyze} disabled={!canAnalyze || loading || preparing}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Analisar com a STHIA
      </Button>

      {result && (
        (() => {
          const t = (result as any).totals || {};
          const num = (v: any) => Number(v) || 0;
          const kcal = num((result as any).total_calories ?? t.calories);
          const prot = num((result as any).total_protein_g ?? t.protein_g);
          const carb = num((result as any).total_carbs_g ?? t.carbs_g);
          const fat = num((result as any).total_fat_g ?? t.fat_g);
          const fiber = num((result as any).total_fiber_g ?? t.fiber_g);
          const sodium = num((result as any).total_sodium_mg ?? t.sodium_mg);
          const score = Math.round(num((result as any).sthia_score) || num(result.quality_score) * 10);
          const scoreLabel = String((result as any).sthia_score_label || result.classification || "");
          const novaMap: Record<number, string> = {
            1: "NOVA 1 — in natura",
            2: "NOVA 2 — ingrediente culinário",
            3: "NOVA 3 — processado",
            4: "NOVA 4 — ultraprocessado",
          };
          const nova = novaMap[Number((result as any).nova_summary)] || null;
          const alerts: string[] = Array.isArray(result.alerts) ? result.alerts : [];
          return (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{Math.round(kcal)} kcal</Badge>
            <Badge variant="outline">P {prot.toFixed(1)}g</Badge>
            <Badge variant="outline">C {carb.toFixed(1)}g</Badge>
            <Badge variant="outline">G {fat.toFixed(1)}g</Badge>
            {fiber > 0 && <Badge variant="outline">Fibra {fiber.toFixed(1)}g</Badge>}
            {sodium > 0 && <Badge variant="outline">Sódio {Math.round(sodium)}mg</Badge>}
            {result.classification && <Badge>{String(result.classification)}</Badge>}
          </div>

          {Array.isArray(result.foods) && (
            <ul className="space-y-2 text-sm">
              {result.foods.map((f: any, i: number) => (
                <li key={i} className="rounded-xl bg-muted/40 px-3 py-2">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">
                      {Math.round(num(f.estimated_weight_g))}{f.unit === "ml" ? "ml" : "g"} · {Math.round(num(f.calories))} kcal
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    P {num(f.protein_g).toFixed(1)}g · C {num(f.carbs_g).toFixed(1)}g · G {num(f.fat_g).toFixed(1)}g
                    {num(f.fiber_g) > 0 && ` · Fibra ${num(f.fiber_g).toFixed(1)}g`}
                    {num(f.sodium_mg) > 0 && ` · Sódio ${Math.round(num(f.sodium_mg))}mg`}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {score > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                📈 Score STHIA: {scoreLabel} ({score}/100)
              </span>
            )}
            {nova && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">🏷️ {nova}</span>}
          </div>

          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alerts.slice(0, 6).map((a, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">⚠️ {a.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          )}

          {(result as any).needs_second_evidence && (result as any).second_evidence_reason && (
            <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              📷 {(result as any).second_evidence_reason}
            </p>
          )}

          {result.notes && <p className="text-xs text-muted-foreground">{String(result.notes)}</p>}

          <p className="text-xs font-medium">
            ⚡ Resumo: {Math.round(kcal)} kcal · {prot.toFixed(1)} g proteína{fiber > 0 ? ` · ${fiber.toFixed(1)} g fibra` : ""}
          </p>
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
          );
        })()
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
