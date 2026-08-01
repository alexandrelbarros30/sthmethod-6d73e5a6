import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AiShell from "@/components/ai/AiShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AI_MODULES, AiKind, daysLeftInCycle, latestOf, useAiApp } from "@/hooks/useAiApp";
import AiFeedbackCard from "@/components/ai/AiFeedbackCard";
import AiExamAttach from "@/components/ai/AiExamAttach";
import AiWorkoutBriefing from "@/components/ai/AiWorkoutBriefing";
import AiWorkoutProgram from "@/components/ai/AiWorkoutProgram";
import { feedbackForGeneration, useAiFeedback } from "@/hooks/useAiFeedback";
import { Loader2, Sparkles, RefreshCw, Lock } from "lucide-react";

const SLUG_TO_KIND: Record<string, AiKind> = {
  cardapio: "diet",
  treino: "workout",
  analise: "analysis",
};

export default function AiModule() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const kind = SLUG_TO_KIND[slug ?? ""] ?? "diet";
  const mod = AI_MODULES[kind];
  const { generations, subscription, profile, loading, refresh } = useAiApp();
  const { items: feedbacks, submit: submitFeedback } = useAiFeedback(kind);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [examIds, setExamIds] = useState<string[]>([]);
  const [workoutBrief, setWorkoutBrief] = useState("");

  const current = useMemo(() => latestOf(generations, kind), [generations, kind]);
  const currentFeedback = useMemo(() => feedbackForGeneration(feedbacks, current?.id), [feedbacks, current?.id]);
  const daysLeft = daysLeftInCycle(current, mod.cycleDays);
  const maxRevisions = kind === "analysis" ? 1 : 2;
  const revisionsLeft = current ? Math.max(0, maxRevisions - current.revisions) : maxRevisions;
  const cycleLocked = Boolean(current) && daysLeft > 0;

  async function run(mode: "create" | "revise") {
    if (!subscription) {
      navigate("/ai/assinatura");
      return;
    }
    if (mode === "revise" && !instruction.trim()) {
      toast.error("Descreva o que deseja ajustar.");
      return;
    }
    setBusy(true);
    const fullInstruction = [kind === "workout" ? workoutBrief : "", instruction.trim()]
      .filter(Boolean)
      .join("\n\n");
    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-app", {
        body: { kind, mode, instruction: fullInstruction, file_ids: kind === "analysis" ? examIds : [] },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).message || (data as any).error);
      setInstruction("");
      await refresh();
      toast.success(mode === "create" ? "Plano gerado." : "Revisão aplicada.");
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível gerar agora.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AiShell title={mod.title} subtitle={mod.short}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {current ? (
          <>
            <Badge variant="secondary">{daysLeft > 0 ? `${daysLeft} dia(s) no ciclo` : "Novo ciclo liberado"}</Badge>
            <Badge variant="outline">{revisionsLeft} revisão(ões) disponível(is)</Badge>
          </>
        ) : (
          <Badge variant="outline">Primeira geração</Badge>
        )}
      </div>

      {kind === "analysis" && <AiExamAttach selected={examIds} onChange={setExamIds} />}

      {kind === "workout" && <AiWorkoutBriefing profile={profile} onChange={setWorkoutBrief} />}

      <Card className="space-y-3 p-5">
        <Textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            current
              ? "O que deseja ajustar? Ex: trocar o jantar por opções mais rápidas."
              : "Quer acrescentar alguma observação antes de gerar? (opcional)"
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => run("create")} disabled={busy || cycleLocked}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : cycleLocked ? <Lock className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {current ? "Gerar novo ciclo" : "Gerar agora"}
          </Button>
          {current && (
            <Button className="flex-1" variant="outline" onClick={() => run("revise")} disabled={busy || revisionsLeft === 0}>
              <RefreshCw className="mr-2 h-4 w-4" /> Revisar
            </Button>
          )}
        </div>
        {cycleLocked && (
          <p className="text-xs text-muted-foreground">
            A estrutura principal é preservada durante o ciclo — é assim que a metodologia gera adaptação real. Use uma
            revisão para ajustes pontuais.
          </p>
        )}
      </Card>

      {current && (
        <>
        {kind === "workout" && (
          <div className="mt-5">
            <AiWorkoutProgram content={current.content} />
          </div>
        )}
        <Card className="mt-5 p-5">
          <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.content}</ReactMarkdown>
          </article>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Atualizado em {new Date(current.updated_at).toLocaleString("pt-BR")}
          </p>
        </Card>
        </>
      )}

      {current && (
        <AiFeedbackCard
          kind={kind}
          generationId={current.id}
          existing={currentFeedback}
          onSubmit={submitFeedback}
        />
      )}
    </AiShell>
  );
}