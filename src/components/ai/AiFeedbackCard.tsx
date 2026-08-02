import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import AiVoiceInput, { appendTranscript } from "@/components/ai/AiVoiceInput";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageSquareHeart, Star } from "lucide-react";
import type { AiKind } from "@/hooks/useAiApp";
import { FEEDBACK_TAGS, type AiFeedback, type AiFeedbackInput } from "@/hooks/useAiFeedback";

interface Props {
  kind: AiKind;
  generationId: string | null;
  existing: AiFeedback | null;
  onSubmit: (input: AiFeedbackInput) => Promise<void>;
}

const SCALE_LABELS: Record<AiKind, { difficulty: string; energy: string; adherence: string }> = {
  diet: { difficulty: "Dificuldade de seguir", energy: "Energia e disposição", adherence: "Adesão ao cardápio" },
  workout: { difficulty: "Dificuldade dos treinos", energy: "Recuperação e disposição", adherence: "Frequência cumprida" },
  analysis: { difficulty: "Complexidade do plano", energy: "Confiança no caminho", adherence: "Ações executadas" },
};

function TagRow({
  title,
  tone,
  options,
  selected,
  onToggle,
}: {
  title: string;
  tone: "good" | "bad";
  options: string[];
  selected: string[];
  onToggle: (t: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? tone === "good"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AiFeedbackCard({ kind, generationId, existing, onSubmit }: Props) {
  const labels = SCALE_LABELS[kind];
  const tags = FEEDBACK_TAGS[kind];
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [adherence, setAdherence] = useState(70);
  const [worked, setWorked] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void) => (t: string) =>
    set(list.includes(t) ? list.filter((x) => x !== t) : [...list, t]);

  async function save() {
    if (!rating) {
      toast.error("Dê uma nota de 1 a 5 primeiro.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        generation_id: generationId,
        kind,
        rating,
        difficulty,
        energy,
        adherence_pct: adherence,
        worked,
        blocked,
        comment,
      });
      toast.success("Feedback registrado — a IA usará isso no próximo ciclo.");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível registrar agora.");
    } finally {
      setBusy(false);
    }
  }

  if (existing) {
    return (
      <Card className="mt-5 border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Feedback deste ciclo registrado</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Nota {existing.rating}/5</Badge>
              {existing.adherence_pct !== null && <Badge variant="outline">{existing.adherence_pct}% de adesão</Badge>}
              {existing.worked.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline" className="border-primary/40 text-primary">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              A próxima geração deste módulo já considera essas respostas.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card className="mt-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageSquareHeart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Como este ciclo funcionou para você?</p>
              <p className="text-xs text-muted-foreground">
                Leva 40 segundos e ensina a IA a calibrar o próximo plano ao seu contexto real.
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} className="sm:shrink-0">
            Avaliar ciclo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-5 space-y-5 p-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Nota geral do ciclo</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`Nota ${n}`}>
              <Star className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {labels.difficulty}: <span className="text-foreground">{difficulty}/5</span>
          </p>
          <Slider value={[difficulty]} min={1} max={5} step={1} onValueChange={(v) => setDifficulty(v[0])} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {labels.energy}: <span className="text-foreground">{energy}/5</span>
          </p>
          <Slider value={[energy]} min={1} max={5} step={1} onValueChange={(v) => setEnergy(v[0])} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {labels.adherence}: <span className="text-foreground">{adherence}%</span>
        </p>
        <Slider value={[adherence]} min={0} max={100} step={5} onValueChange={(v) => setAdherence(v[0])} />
      </div>

      <TagRow title="O que funcionou" tone="good" options={tags.worked} selected={worked} onToggle={toggle(worked, setWorked)} />
      <TagRow title="O que atrapalhou" tone="bad" options={tags.blocked} selected={blocked} onToggle={toggle(blocked, setBlocked)} />

      <div className="space-y-2">
        <Textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={800}
          placeholder="Quer detalhar algo? (opcional)"
        />
        <AiVoiceInput onTranscribe={(t) => setComment((v) => appendTranscript(v, t))} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={save} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar feedback
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Agora não
        </Button>
      </div>
    </Card>
  );
}
