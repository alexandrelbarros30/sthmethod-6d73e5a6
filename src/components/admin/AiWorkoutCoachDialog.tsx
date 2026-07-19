import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, Copy, Camera, Wand2, User, X,
  ArrowDown, Send, StopCircle, RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

type Msg = { role: "user" | "assistant"; content: string };

export default function AiWorkoutCoachDialog({ triggerLabel, defaultStudentId, size = "default", variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("generate");
  const [studentId, setStudentId] = useState<string>(defaultStudentId || "");
  const [studentSearch, setStudentSearch] = useState("");
  const [instruction, setInstruction] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [usage, setUsage] = useState<any>(null);
  const [usedModel, setUsedModel] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamText, streaming]);

  const runStream = async (userInstruction: string, opts?: { continuation?: boolean; imageUrls?: string[] }) => {
    if (streaming) return;
    const isContinuation = !!opts?.continuation;
    const nextHistory: Msg[] = isContinuation
      ? messages
      : [...messages, { role: "user", content: userInstruction }];
    if (!isContinuation) setMessages(nextHistory);
    setInstruction("");
    setStreamText("");
    setUsage(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-workout-coach`;
      const resp = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode,
          studentId: studentId || undefined,
          instruction: userInstruction,
          imageUrls: mode === "analyze" ? (opts?.imageUrls || images.map(i => i.url)) : undefined,
          history: nextHistory.slice(-10),
          stream: true,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "Erro ao chamar IA";
        try { msg = JSON.parse(errText).error || msg; } catch {}
        throw new Error(msg);
      }
      setUsedModel(resp.headers.get("X-Model") || "google/gemini-3-flash-preview");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalUsage: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const delta = j?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              acc += delta;
              setStreamText(acc);
            }
            if (j?.usage) finalUsage = j.usage;
          } catch { /* ignore */ }
        }
      }

      if (isContinuation && messages.length && messages[messages.length - 1].role === "assistant") {
        setMessages(prev => {
          const clone = [...prev];
          const last = clone[clone.length - 1];
          clone[clone.length - 1] = { role: "assistant", content: last.content + acc };
          return clone;
        });
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: acc }]);
      }
      setStreamText("");
      setUsage(finalUsage);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        if (acc) setMessages(prev => [...prev, { role: "assistant", content: acc + "\n\n_Interrompido._" }]);
        setStreamText("");
      } else {
        toast.error(e?.message || "Erro na IA");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = () => {
    const text = instruction.trim();
    if (mode === "analyze" && messages.length === 0) {
      if (!images.length) { toast.error("Adicione ao menos 1 foto"); return; }
      runStream(text || "Analisar as fotos.", { imageUrls: images.map(i => i.url) });
    } else {
      if (text.length < 3) { toast.error("Digite uma instrução"); return; }
      runStream(text);
    }
  };

  const handleContinue = () => {
    runStream("Continue exatamente de onde parou, sem repetir nada do que já foi dito, mantendo o mesmo formato e nível de detalhe.", { continuation: true });
  };

  const handleStop = () => { abortRef.current?.abort(); };

  const resetChat = () => {
    setMessages([]);
    setStreamText("");
    setUsage(null);
    setInstruction("");
  };

  const copyLast = async () => {
    const last = [...messages].reverse().find(m => m.role === "assistant")?.content || streamText;
    if (!last) return;
    try { await navigator.clipboard.writeText(last); toast.success("Copiado"); } catch { toast.error("Falha"); }
  };

  const hasConversation = messages.length > 0 || streamText.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (!v) { resetChat(); setImages([]); abortRef.current?.abort(); }
    }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1">
          <Sparkles className="w-4 h-4" />
          {triggerLabel || "STHIA · Treinos"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[92vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> STHIA — Elite Coach AI
            </span>
            {hasConversation && !streaming && (
              <Button variant="ghost" size="sm" onClick={resetChat} className="gap-1 text-xs">
                <RotateCcw className="w-3 h-3" /> Nova conversa
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!hasConversation && (
            <>
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
                </div>
              )}
            </>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={m.role === "user"
                ? "max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap"
                : "max-w-full rounded-xl bg-muted/40 border p-3"}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            </div>
          ))}
          {streaming && streamText && (
            <div className="max-w-full rounded-xl bg-muted/40 border p-3">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{streamText}</ReactMarkdown>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> STHIA escrevendo...
              </div>
            </div>
          )}
          {streaming && !streamText && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Pensando...
            </div>
          )}
          {usage && !streaming && (
            <AICreditUsage model={usedModel} usage={usage} />
          )}
        </div>

        <div className="border-t p-3 space-y-2 bg-background">
          {hasConversation && !streaming && (
            <div className="flex gap-1 flex-wrap">
              <Button size="sm" variant="outline" onClick={handleContinue} className="gap-1 text-xs">
                <ArrowDown className="w-3 h-3" /> Continuar resposta
              </Button>
              <Button size="sm" variant="ghost" onClick={copyLast} className="gap-1 text-xs">
                <Copy className="w-3 h-3" /> Copiar última
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); }
              }}
              rows={2}
              className="resize-none flex-1"
              placeholder={
                streaming ? "Aguarde a resposta..." :
                messages.length === 0
                  ? (mode === "generate"
                      ? "Ex.: Hipertrofia 12sem, 5x/sem, foco ombros e posteriores..."
                      : mode === "copilot"
                        ? "Ex.: Trocar agachamento livre por hack squat mantendo volume."
                        : "Contexto opcional para a análise das fotos...")
                  : "Peça ajustes, próxima fase, mais detalhes..."
              }
              disabled={streaming}
            />
            {streaming ? (
              <Button onClick={handleStop} variant="destructive" size="icon" className="h-11 w-11">
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={handleSend} size="icon" className="h-11 w-11">
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-right">Ctrl/⌘ + Enter para enviar</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}