import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mic, Pause, Play, Square, X } from "lucide-react";

/**
 * Botão de ditado por voz para campos livres do STH AI.
 * Grava PCM via Web Audio, codifica WAV 16 kHz mono (WebM/Opus é rejeitado
 * pelo modelo) e envia para a edge function `food-ai-transcribe`.
 */
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

interface Props {
  /** Recebe o texto transcrito já pronto para ser anexado ao campo. */
  onTranscribe: (text: string) => void;
  className?: string;
  label?: string;
  size?: "sm" | "icon";
}

export default function AiVoiceInput({ onTranscribe, className, label = "Falar", size = "sm" }: Props) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  function cleanupStream() {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }

  /** Encerra captura sem transcrever (usado por "Cancelar" / Esc). */
  function teardown() {
    try { nodeRef.current?.disconnect(); sourceRef.current?.disconnect(); } catch { /* noop */ }
    nodeRef.current = null; sourceRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null;
    try { void ctx?.close(); } catch { /* noop */ }
    cleanupStream();
    pausedRef.current = false;
    setPaused(false);
    setRecording(false);
  }

  function cancel() {
    if (!recording) return;
    teardown();
    pcmRef.current = [];
    toast.info("Gravação cancelada");
  }

  function togglePause() {
    if (!recording) return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    const ctx = ctxRef.current;
    if (next) {
      void ctx?.suspend?.().catch(() => {});
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    } else {
      void ctx?.resume?.().catch(() => {});
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000) as unknown as number;
      }
    }
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      pcmRef.current = [];
      pausedRef.current = false;
      setPaused(false);
      node.onaudioprocess = (e) => {
        if (pausedRef.current) return;
        pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      ctxRef.current = ctx; nodeRef.current = node; sourceRef.current = source;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000) as unknown as number;
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }

  async function stop() {
    const ctx = ctxRef.current;
    try { nodeRef.current?.disconnect(); sourceRef.current?.disconnect(); } catch { /* noop */ }
    nodeRef.current = null; sourceRef.current = null;
    cleanupStream();
    setRecording(false);
    pausedRef.current = false;
    setPaused(false);
    const rate = ctx?.sampleRate || 44100;
    try { await ctx?.close(); } catch { /* noop */ }
    ctxRef.current = null;
    const blob = encodeWav(pcmRef.current, rate);
    pcmRef.current = [];
    if (blob.size < 4096) { toast.error("Gravação muito curta. Tente novamente."); return; }
    setBusy(true);
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
      onTranscribe(txt);
      toast.success("Áudio transcrito");
    } catch (e) {
      toast.error((e as Error)?.message || "Falha ao transcrever o áudio.");
    } finally {
      setBusy(false);
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Atalhos: Ctrl/Cmd+Shift+M grava/para, Ctrl/Cmd+Shift+P pausa/retoma, Esc cancela.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && e.shiftKey && key === "m") {
        e.preventDefault();
        if (busy) return;
        void (recording ? stop() : start());
      } else if (mod && e.shiftKey && key === "p") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "Escape" && recording) {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, busy]);

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <Button
        type="button"
        size={size}
        variant={recording ? "destructive" : "outline"}
        disabled={busy}
        onClick={recording ? stop : start}
        aria-label={recording ? "Parar gravação e transcrever (Ctrl+Shift+M)" : "Gravar áudio e transcrever (Ctrl+Shift+M)"}
        title={recording ? "Parar e transcrever (Ctrl/Cmd+Shift+M)" : "Falar e transcrever (Ctrl/Cmd+Shift+M)"}
      >
        {busy ? (
          <Loader2 className={`h-4 w-4 animate-spin ${size === "icon" ? "" : "mr-1.5"}`} />
        ) : recording ? (
          <Square className={`h-4 w-4 ${size === "icon" ? "" : "mr-1.5"}`} />
        ) : (
          <Mic className={`h-4 w-4 ${size === "icon" ? "" : "mr-1.5"}`} />
        )}
        {size !== "icon" && (busy ? "Transcrevendo…" : recording ? `Parar ${mm}:${ss}` : label)}
      </Button>

      {recording && (
        <>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={togglePause}
            aria-label={paused ? "Retomar gravação (Ctrl+Shift+P)" : "Pausar gravação (Ctrl+Shift+P)"}
            title={paused ? "Retomar (Ctrl/Cmd+Shift+P)" : "Pausar (Ctrl/Cmd+Shift+P)"}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={cancel}
            aria-label="Cancelar gravação (Esc)"
            title="Cancelar (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}

      {recording && paused && <span className="text-xs text-muted-foreground">Pausado</span>}
    </div>
  );
}

/** Anexa o texto transcrito ao valor atual do campo. */
export function appendTranscript(current: string, text: string) {
  return current?.trim() ? `${current.trim()} ${text}` : text;
}