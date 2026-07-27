import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Camera, Tag, Sparkles, Mic, Square, Loader2, Check, X, ChevronDown, Filter, Utensils, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { toFriendlyError } from "@/lib/friendly-errors";
import { MEAL_TYPES } from "@/lib/food-diary-storage";
import { cn } from "@/lib/utils";

type Mode = "photo" | "label" | "text" | "audio";

async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<string> {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "image/jpeg" });
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
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", quality);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function classifyBadge(cls?: string) {
  const c = (cls || "").toLowerCase();
  if (c.includes("excel")) return { label: "Excelente", cls: "bg-[#F0FAF3] text-[#0F7B3B] border-[#34C759]/30" };
  if (c.includes("modera") || c.includes("boa")) return { label: cls || "Moderada", cls: "bg-[#FFF7EB] text-[#B25E00] border-[#FF9500]/30" };
  if (c.includes("evit") || c.includes("melhor")) return { label: cls || "Necessita melhorias", cls: "bg-[#FFF0F0] text-[#C7362B] border-[#FF3B30]/30" };
  return { label: cls || "—", cls: "bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA]" };
}

function modeLabel(mode: string, source: string | null) {
  if ((source || "").includes("audio")) return "Áudio";
  if (mode === "photo") return "Foto";
  if (mode === "label") return "Rótulo";
  return "Texto";
}

/* ================= Analyzer ================= */
function Analyzer({ onAnalyzed }: { onAnalyzed: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("photo");
  const [text, setText] = useState("");
  const [imgB64, setImgB64] = useState<string | null>(null);
  const [imgMime, setImgMime] = useState<string>("image/jpeg");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recMimeRef = useRef<string>("audio/webm");
  const [recSeconds, setRecSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<string>("almoco");
  const [addDate, setAddDate] = useState<string>(todayISO());
  const [adding, setAdding] = useState(false);

  const reset = () => {
    setText(""); setImgB64(null); setImgPreview(null); setResult(null);
    setTranscript(""); setRecSeconds(0);
  };

  const stopStream = () => {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
      const chosen = candidates.find((c) => (window as any).MediaRecorder && MediaRecorder.isTypeSupported?.(c)) || "";
      const rec = chosen ? new MediaRecorder(stream, { mimeType: chosen }) : new MediaRecorder(stream);
      recMimeRef.current = rec.mimeType || chosen || "audio/webm";
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recMimeRef.current });
        stopStream(); setRecording(false);
        if (!blob.size || blob.size < 1024) { toast.error("Gravação muito curta. Tente novamente."); return; }
        await transcribeBlob(blob);
      };
      rec.start(); recRef.current = rec; setRecording(true); setRecSeconds(0);
      timerRef.current = window.setInterval(() => setRecSeconds((s) => s + 1), 1000) as unknown as number;
    } catch (err) {
      console.error("mic error", err);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };
  const stopRecording = () => { try { recRef.current?.stop(); } catch { /* noop */ } };

  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("food-ai-transcribe", { body: { audio: b64, mime: blob.type || recMimeRef.current } });
      if (error) throw new Error(error.message || "transcription_failed");
      const txt = String((data as any)?.text || "").trim();
      if (!txt) { toast.error("Não consegui entender o áudio. Tente novamente falando um pouco mais alto."); return; }
      setTranscript(txt);
    } catch (e: any) {
      const f = toFriendlyError(e);
      toast.error(`[${f.code}] ${f.title}`, { description: f.message });
    } finally {
      setTranscribing(false);
    }
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 1600, 0.85);
      setImgMime("image/jpeg"); setImgPreview(dataUrl); setImgB64(dataUrl.split(",")[1] || "");
    } catch (err) {
      console.error("image compression failed", err);
      toast.error("Não foi possível preparar a foto. Tente outra imagem.");
    }
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const isAudio = mode === "audio";
      const analyzeMode = isAudio || mode === "text" ? "text" : mode;
      const payloadText = isAudio ? transcript.trim() : (mode === "text" ? text.trim() : undefined);
      const { data, error } = await supabase.functions.invoke("food-ai-analyze", {
        body: {
          mode: analyzeMode,
          text: payloadText,
          image: !isAudio && mode !== "text" ? imgB64 : undefined,
          mime: imgMime,
          audit_source: isAudio ? "student_sthia_audio" : "student_sthia_standalone",
          student_id: user?.id ?? null,
        },
      });
      if (error) {
        let parsed: any = null;
        try { parsed = await (error as any)?.context?.json?.(); } catch { /* noop */ }
        const status = (error as any)?.context?.status;
        throw Object.assign(new Error(parsed?.error || parsed?.details || error.message || "analysis_failed"), {
          status: status ?? (parsed?.code === "STH-402" ? 402 : parsed?.code === "STH-429" ? 429 : 500),
          code: parsed?.code,
        });
      }
      if ((data as any)?.error) throw new Error((data as any).details || (data as any).error);
      setResult(data);
      // Notify history to refresh (edge already persisted the log server-side).
      setTimeout(() => onAnalyzed(), 500);
    } catch (e: any) {
      let f = toFriendlyError(e);
      if (e?.code === "STH-402" || e?.status === 402) {
        f = { code: "STH-402", title: "Serviço indisponível no momento", message: "A análise por IA está temporariamente fora do ar. Tente novamente em instantes." };
      }
      toast.error(`[${f.code}] ${f.title}`, { description: f.message });
    } finally {
      setLoading(false);
    }
  };

  const addToDiary = async () => {
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
        unit: (f.unit === "ml" ? "ml" : "g"),
        energy_kcal: +Number(f.calories || 0).toFixed(1),
        protein_g: +Number(f.protein_g || 0).toFixed(2),
        carbs_g: +Number(f.carbs_g || 0).toFixed(2),
        fat_g: +Number(f.fat_g || 0).toFixed(2),
        fiber_g: +Number(f.fiber_g || 0).toFixed(2),
        sodium_mg: +Number(f.sodium_mg || 0).toFixed(1),
        sort_order: 0,
      }));
      const { data: inserted, error } = await supabase
        .from("food_diary_entries")
        .insert(rows)
        .select("id");
      if (error) throw error;
      // Link back to the STHIA Food analysis log so the diary can show the origin badge.
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
      toast.success(`Adicionado ao Diário — ${meal?.label || addMeal}`);
      setAddOpen(false);
    } catch (e: any) {
      const f = toFriendlyError(e);
      toast.error(`[${f.code}] ${f.title}`, { description: f.message });
    } finally {
      setAdding(false);
    }
  };

  const canAnalyze =
    (mode === "text" && text.trim().length >= 3) ||
    (mode === "audio" && transcript.trim().length >= 3) ||
    ((mode === "photo" || mode === "label") && !!imgB64);
  const confidencePct = Math.round((result?.confidence || 0) * 100);
  const sthiaScore = Number(result?.sthia_score);
  const scorePct = Number.isFinite(sthiaScore) && sthiaScore > 0
    ? Math.round(sthiaScore)
    : Math.round(((result?.quality_score || 0) * 10));
  const novaMap: Record<number, { label: string; cls: string }> = {
    1: { label: "NOVA 1 · in natura", cls: "bg-[#F0FAF3] text-[#0F7B3B] border-[#34C759]/25" },
    2: { label: "NOVA 2 · culinário", cls: "bg-[#F0FAF3] text-[#0F7B3B] border-[#34C759]/25" },
    3: { label: "NOVA 3 · processado", cls: "bg-[#FFF7EB] text-[#B25E00] border-[#FF9500]/25" },
    4: { label: "NOVA 4 · ultraprocessado", cls: "bg-[#FFF0F0] text-[#C7362B] border-[#FF3B30]/25" },
  };
  const chipCls = "flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium px-3 h-10 rounded-xl transition-all tracking-[-0.01em]";
  const activeCls = "bg-white text-[#1D1D1F] shadow-[0_1px_3px_rgba(0,0,0,0.08)]";
  const idleCls = "bg-transparent text-[#6E6E73] hover:text-[#1D1D1F]";

  return (
    <Card className="rounded-3xl border-[#E5E5EA] bg-white p-5 space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.02em]">Nova análise STHIA FOOD IA</h2>
        <p className="text-[12px] text-[#86868B] mt-0.5 tracking-[-0.005em]">Foto, rótulo, texto ou áudio — a STHIA entende como for mais natural para você.</p>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl bg-[#F5F5F7]">
        <button type="button" className={cn(chipCls, mode === "photo" ? activeCls : idleCls)} onClick={() => { setMode("photo"); setResult(null); }}>
          <Camera className="w-3.5 h-3.5" strokeWidth={2.25} /> Foto
        </button>
        <button type="button" className={cn(chipCls, mode === "label" ? activeCls : idleCls)} onClick={() => { setMode("label"); setResult(null); }}>
          <Tag className="w-3.5 h-3.5" strokeWidth={2.25} /> Rótulo
        </button>
        <button type="button" className={cn(chipCls, mode === "text" ? activeCls : idleCls)} onClick={() => { setMode("text"); setResult(null); }}>
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} /> Texto
        </button>
        <button type="button" className={cn(chipCls, mode === "audio" ? activeCls : idleCls)} onClick={() => { setMode("audio"); setResult(null); }}>
          <Mic className="w-3.5 h-3.5" strokeWidth={2.25} /> Áudio
        </button>
      </div>

      {mode === "audio" ? (
        <div className="space-y-3">
          {!transcript && (
            <div className="rounded-2xl border-2 border-dashed border-[#D1D1D6] bg-[#F5F5F7] p-6 text-center">
              <button type="button" onClick={recording ? stopRecording : startRecording} disabled={transcribing}
                className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all shadow-sm",
                  recording ? "bg-[#FF3B30] text-white animate-pulse" : "bg-white border border-[#E5E5EA] text-[#34C759] hover:border-[#34C759]")}>
                {recording ? <Square className="w-6 h-6" strokeWidth={2.25} /> : <Mic className="w-6 h-6" strokeWidth={2} />}
              </button>
              <div className="text-[14px] font-medium text-[#1D1D1F] mt-3 tracking-[-0.01em]">
                {transcribing ? "Transcrevendo…" : recording ? `Gravando… ${String(Math.floor(recSeconds / 60))}:${String(recSeconds % 60).padStart(2, "0")}` : "Toque para falar sua refeição"}
              </div>
              <div className="text-[12px] text-[#86868B] mt-0.5">
                {recording ? "Toque no quadrado para parar" : "Ex.: “no almoço comi arroz, feijão, bife e salada”"}
              </div>
            </div>
          )}
          {transcript && (
            <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Transcrição</div>
                <button type="button" onClick={() => { setTranscript(""); setResult(null); }} className="text-[11px] text-[#0071E3] hover:underline">Regravar</button>
              </div>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={3}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] text-[#1D1D1F] p-3 text-[13px] leading-relaxed resize-none focus:outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759] transition-colors" />
            </div>
          )}
        </div>
      ) : mode === "text" ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder='Ex.: "2 ovos mexidos, 1 pão francês, café com leite"' rows={4}
          className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] text-[#1D1D1F] placeholder:text-[#86868B] p-4 text-[14px] leading-relaxed resize-none focus:outline-none focus:border-[#34C759] focus:ring-1 focus:ring-[#34C759] transition-colors" />
      ) : (
        <div className="space-y-2">
          <label className="block rounded-2xl border-2 border-dashed border-[#D1D1D6] bg-[#F5F5F7] p-6 text-center cursor-pointer hover:border-[#34C759] hover:bg-[#F0FAF3] transition-colors">
            <input type="file" accept="image/*" capture={mode === "photo" ? "environment" : undefined} className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)} />
            {imgPreview ? (
              <img src={imgPreview} alt="preview" className="max-h-56 mx-auto rounded-xl object-contain" />
            ) : (
              <div className="py-4">
                <div className="w-11 h-11 mx-auto rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center mb-2.5">
                  <Camera className="w-5 h-5 text-[#34C759]" strokeWidth={2} />
                </div>
                <div className="text-[14px] font-medium text-[#1D1D1F] tracking-[-0.01em]">
                  Toque para {mode === "photo" ? "fotografar o prato" : "fotografar o rótulo"}
                </div>
                <div className="text-[12px] text-[#86868B] mt-0.5">Boa iluminação melhora a precisão</div>
              </div>
            )}
          </label>
          {imgPreview && (
            <Button variant="ghost" size="sm" className="text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FFF0F0] rounded-full" onClick={() => { setImgB64(null); setImgPreview(null); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Remover foto
            </Button>
          )}
        </div>
      )}

      <Button onClick={analyze} disabled={!canAnalyze || loading}
        className="w-full h-12 rounded-full bg-[#1D1D1F] hover:bg-[#000] disabled:bg-[#E5E5EA] disabled:text-[#86868B] text-white font-medium tracking-[-0.01em] text-[15px] shadow-none transition-colors">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando com STHIA…</> : <><Sparkles className="w-4 h-4 mr-2" />Analisar</>}
      </Button>

      {result && (
        <div className="space-y-4 border border-[#E5E5EA] rounded-3xl p-5 bg-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-[#86868B] font-medium">Total</div>
              <div className="text-[34px] font-semibold text-[#1D1D1F] tracking-[-0.03em] leading-none tabular-nums">
                {Math.round(result.totals?.calories || 0)}
                <span className="text-[15px] text-[#86868B] font-normal ml-1">kcal</span>
              </div>
              {result.classification && (() => { const b = classifyBadge(result.classification); return (
                <span className={cn("inline-block mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border", b.cls)}>{b.label}</span>
              ); })()}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className={cn("rounded-full px-3 py-1 text-[11px] font-medium tabular-nums border",
                confidencePct >= 85 ? "bg-[#F0FAF3] text-[#0F7B3B] border-[#34C759]/25"
                : confidencePct >= 60 ? "bg-[#FFF7EB] text-[#B25E00] border-[#FF9500]/25"
                : "bg-[#FFF0F0] text-[#C7362B] border-[#FF3B30]/25")}>
                {confidencePct}% confiança
              </div>
              {scorePct > 0 && (
                <div className="rounded-full px-3 py-1 text-[11px] font-medium tabular-nums border border-[#E5E5EA] bg-[#F5F5F7] text-[#1D1D1F]">
                  Score STHIA {scorePct}/100
                </div>
              )}
              {novaMap[Number(result?.nova_summary)] && (
                <div className={cn("rounded-full px-3 py-1 text-[11px] font-medium border", novaMap[Number(result?.nova_summary)].cls)}>
                  {novaMap[Number(result?.nova_summary)].label}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Proteína", value: result.totals?.protein_g, color: "#34C759" },
              { label: "Carbo", value: result.totals?.carbs_g, color: "#FF9500" },
              { label: "Gordura", value: result.totals?.fat_g, color: "#FF3B30" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-[#F5F5F7] p-3">
                <div className="text-[10px] uppercase tracking-[0.04em] font-medium" style={{ color: m.color }}>{m.label}</div>
                <div className="text-[18px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums mt-0.5">
                  {Math.round(Number(m.value) || 0)}<span className="text-[12px] text-[#86868B] font-normal ml-0.5">g</span>
                </div>
              </div>
            ))}
          </div>

          {result.notes && <p className="text-[12px] text-[#6E6E73] leading-relaxed tracking-[-0.005em]">{result.notes}</p>}

          <div className="rounded-2xl border border-[#E5E5EA] divide-y divide-[#F2F2F7] overflow-hidden">
            {(result.foods || []).map((f: any, i: number) => (
              <div key={i} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#1D1D1F] truncate tracking-[-0.01em]">{f.name}</p>
                  <p className="text-[11px] text-[#86868B] mt-0.5 tabular-nums">
                    {Math.round(f.estimated_weight_g || 0)}{f.unit || "g"} · {Math.round(f.calories || 0)} kcal · P{Number(f.protein_g || 0).toFixed(0)} · C{Number(f.carbs_g || 0).toFixed(0)} · G{Number(f.fat_g || 0).toFixed(0)}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 rounded-full text-[10px] font-medium tabular-nums border px-2",
                  (f.confidence || 0) >= 0.85 ? "border-[#34C759]/25 bg-[#F0FAF3] text-[#0F7B3B]"
                  : (f.confidence || 0) >= 0.6 ? "border-[#FF9500]/25 bg-[#FFF7EB] text-[#B25E00]"
                  : "border-[#FF3B30]/25 bg-[#FFF0F0] text-[#C7362B]")}>
                  {Math.round((f.confidence || 0) * 100)}%
                </Badge>
              </div>
            ))}
          </div>

          {Array.isArray(result.alerts) && result.alerts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.alerts.map((a: string) => (
                <Badge key={a} variant="outline" className="rounded-full text-[10px] font-medium border-[#FF9500]/30 bg-[#FFF7EB] text-[#B25E00]">
                  ⚠ {a.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          )}

          {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
            <div className="rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] p-4 space-y-1.5">
              <div className="text-[11px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Sugestões STHIA</div>
              <ul className="space-y-1">
                {result.suggestions.slice(0, 3).map((s: string, i: number) => (
                  <li key={i} className="text-[13px] text-[#1D1D1F] leading-relaxed tracking-[-0.005em] flex gap-2">
                    <span className="text-[#34C759] mt-0.5">•</span><span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] p-4 text-center">
            <p className="text-[13px] font-medium text-[#1D1D1F] tracking-[-0.01em]">Deseja adicionar esta análise ao Diário Alimentar?</p>
            <p className="text-[11px] text-[#86868B] mt-1">O histórico STHIA já foi salvo automaticamente. Adicionar ao Diário é opcional.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="ghost" onClick={reset} className="flex-1 h-11 rounded-full text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white font-medium">
                Não, obrigado
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="flex-1 h-11 rounded-full bg-[#34C759] hover:bg-[#30B350] text-white font-medium tracking-[-0.01em] shadow-none">
                <Utensils className="w-4 h-4 mr-1" /> Adicionar ao Diário
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-[#86868B] text-center tracking-[-0.005em]">Análise por IA — confirme antes de usar. Não substitui orientação do consultor.</p>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar ao Diário Alimentar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-[#6E6E73]">Refeição</label>
              <Select value={addMeal} onValueChange={setAddMeal}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => (<SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6E6E73]">Data</label>
              <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={addToDiary} disabled={adding} className="bg-[#34C759] hover:bg-[#30B350] text-white">
              {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ================= History ================= */
function HistoryList({ refreshToken }: { refreshToken: number }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(todayISO());
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("food_ai_logs").select("*")
        .eq("student_id", user.id)
        .neq("status", "error")
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .order("created_at", { ascending: false })
        .limit(200);
      const { data, error } = await q;
      if (error) throw error;
      setLogs(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível carregar o histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id, fromDate, toDate, refreshToken]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (modeFilter !== "all") {
        const label = modeLabel(l.mode, l.source).toLowerCase();
        if (!label.includes(modeFilter)) return false;
      }
      if (classFilter !== "all") {
        const c = (l.classification || "").toLowerCase();
        if (classFilter === "excelente" && !c.includes("excel")) return false;
        if (classFilter === "boa" && !(c.includes("boa") || c.includes("modera"))) return false;
        if (classFilter === "melhorar" && !(c.includes("evit") || c.includes("melhor"))) return false;
      }
      if (s) {
        const hay = [
          l.notes || "", l.input_text || "",
          ...(Array.isArray(l.foods) ? l.foods.map((f: any) => f?.name || "") : []),
        ].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [logs, modeFilter, classFilter, search]);

  const removeLog = async (id: string) => {
    if (!confirm("Excluir esta análise do histórico?")) return;
    const { error } = await supabase.from("food_ai_logs").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir"); return; }
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <Card className="rounded-3xl border-[#E5E5EA] bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-[-0.02em]">Histórico STH FOOD AI</h2>
          <p className="text-[12px] text-[#86868B] mt-0.5 tracking-[-0.005em]">Todas as suas análises ficam salvas aqui — foto, rótulo, texto ou áudio.</p>
        </div>
        <Badge variant="outline" className="rounded-full text-[10px] font-medium border-[#E5E5EA] bg-[#F5F5F7] text-[#6E6E73]">
          {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-[0.05em] text-[#86868B] font-medium">De</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl h-9 mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Até</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl h-9 mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Tipo</label>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="rounded-xl h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="foto">Foto</SelectItem>
              <SelectItem value="rótulo">Rótulo</SelectItem>
              <SelectItem value="texto">Texto</SelectItem>
              <SelectItem value="áudio">Áudio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Classificação</label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="rounded-xl h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="excelente">Excelente</SelectItem>
              <SelectItem value="boa">Boa / Moderada</SelectItem>
              <SelectItem value="melhorar">Melhorar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="text-[10px] uppercase tracking-[0.05em] text-[#86868B] font-medium">Buscar</label>
          <Input placeholder="Alimento…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl h-9 mt-1" />
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-[#86868B]"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#86868B]">
          <Filter className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Nenhuma análise encontrada nesse período.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => {
            const dt = new Date(l.created_at);
            const b = classifyBadge(l.classification);
            const kcal = Math.round(l?.totals?.calories || 0);
            const p = Math.round(l?.totals?.protein_g || 0);
            const c = Math.round(l?.totals?.carbs_g || 0);
            const g = Math.round(l?.totals?.fat_g || 0);
            const score = Math.round((l.quality_score || 0) * 10);
            const foods = Array.isArray(l.foods) ? l.foods : [];
            return (
              <Collapsible key={l.id} className="rounded-2xl border border-[#E5E5EA] bg-white">
                <CollapsibleTrigger className="w-full p-3 flex items-center justify-between gap-3 hover:bg-[#F5F5F7] transition-colors rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[10px] font-semibold text-[#1D1D1F] tabular-nums">
                      {dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[13px] font-medium text-[#1D1D1F] tracking-[-0.01em] truncate">
                        {foods[0]?.name || l.notes || "Análise"} {foods.length > 1 && <span className="text-[#86868B]">+ {foods.length - 1}</span>}
                      </p>
                      <p className="text-[11px] text-[#86868B] tabular-nums mt-0.5">
                        {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {modeLabel(l.mode, l.source)} · {kcal} kcal · P{p}·C{c}·G{g}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {score > 0 && (
                      <span className="rounded-full border border-[#E5E5EA] bg-[#F5F5F7] text-[10px] px-2 py-0.5 text-[#1D1D1F] tabular-nums">{score}</span>
                    )}
                    <span className={cn("rounded-full text-[10px] font-medium border px-2 py-0.5", b.cls)}>{b.label}</span>
                    <ChevronDown className="w-4 h-4 text-[#86868B]" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <div className="border-t border-[#F2F2F7] pt-3 space-y-2">
                    {foods.length > 0 && (
                      <div className="divide-y divide-[#F2F2F7] border border-[#E5E5EA] rounded-xl overflow-hidden">
                        {foods.map((f: any, i: number) => (
                          <div key={i} className="p-2.5 flex items-center justify-between gap-3 text-[12px]">
                            <span className="truncate text-[#1D1D1F]">{f.name}</span>
                            <span className="text-[#86868B] tabular-nums shrink-0">
                              {Math.round(f.estimated_weight_g || 0)}{f.unit || "g"} · {Math.round(f.calories || 0)} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(l.alerts) && l.alerts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {l.alerts.map((a: string, i: number) => (
                          <Badge key={i} variant="outline" className="rounded-full text-[10px] font-medium border-[#FF9500]/30 bg-[#FFF7EB] text-[#B25E00]">
                            ⚠ {a.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {l.notes && <p className="text-[11px] text-[#6E6E73] leading-relaxed">{l.notes}</p>}
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => removeLog(l.id)} className="text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FFF0F0] rounded-full h-8">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ================= Page ================= */
export default function StudentSthiaFood() {
  const [refreshToken, setRefreshToken] = useState(0);
  return (
    <DashboardLayout role="student" title="STH FOOD AI">
      <div className="max-w-3xl mx-auto space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1D1D1F] tracking-[-0.03em]">STH FOOD AI</h1>
          <p className="text-[13px] text-[#86868B] mt-1 tracking-[-0.005em]">
            Motor multimodal de análise nutricional. Independente do Diário Alimentar — adicione manualmente se quiser.
          </p>
        </div>
        <Analyzer onAnalyzed={() => setRefreshToken((n) => n + 1)} />
        <HistoryList refreshToken={refreshToken} />
      </div>
    </DashboardLayout>
  );
}