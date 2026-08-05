import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import AiDietBriefing from "@/components/ai/AiDietBriefing";
import AiWorkoutProgram from "@/components/ai/AiWorkoutProgram";
import AiDietPlan from "@/components/ai/AiDietPlan";
import AiAnalysisReport from "@/components/ai/AiAnalysisReport";
import AiRevisionsBanner from "@/components/ai/AiRevisionsBanner";
import AiBriefingChecklist, { buildChecklist } from "@/components/ai/AiBriefingChecklist";
import AiFieldTipsDialog from "@/components/ai/AiFieldTipsDialog";
import AiVoiceInput, { appendTranscript } from "@/components/ai/AiVoiceInput";
import { feedbackForGeneration, useAiFeedback } from "@/hooks/useAiFeedback";
import { Loader2, Sparkles, RefreshCw, Lock, ArrowLeft } from "lucide-react";
import { focusField } from "@/lib/field-focus";
import type { ChecklistItem } from "@/components/ai/AiBriefingChecklist";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const SLUG_TO_KIND: Record<string, AiKind> = {
  cardapio: "diet",
  treino: "workout",
  analise: "analysis",
};

export default function AiModule() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kind = SLUG_TO_KIND[slug ?? ""] ?? "diet";
  const mod = AI_MODULES[kind];
  const { generations, subscription, profile, loading, refresh, unlimited } = useAiApp();
  const { items: feedbacks, submit: submitFeedback } = useAiFeedback(kind);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [examIds, setExamIds] = useState<string[]>([]);
  const [workoutBrief, setWorkoutBrief] = useState("");
  const [dietBrief, setDietBrief] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);

  const backTo = searchParams.get("next");
  const campoParam = searchParams.get("campo");
  const currentHref = `/ai/app/${slug}?solicitar=1`;

  useEffect(() => {
    if (searchParams.get("solicitar") === "1") setRequestOpen(true);
  }, [searchParams]);

  // Veio de uma red flag do checklist: abre o formulário e destaca o campo.
  useEffect(() => {
    if (!campoParam || loading) return;
    setRequestOpen(true);
    focusField(`brief-${campoParam}`);
  }, [campoParam, loading]);

  const current = useMemo(() => latestOf(generations, kind), [generations, kind]);
  const currentFeedback = useMemo(() => feedbackForGeneration(feedbacks, current?.id), [feedbacks, current?.id]);
  const daysLeft = daysLeftInCycle(current, mod.cycleDays);
  const maxRevisions = kind === "analysis" ? 1 : 3;
  const revisionsLeft = unlimited
    ? Infinity
    : current
      ? Math.max(0, maxRevisions - current.revisions)
      : maxRevisions;
  const cycleLocked = !unlimited && Boolean(current) && daysLeft > 0;
  const isGuided = (kind === "workout" || kind === "diet") && Boolean(current);
  const canRequest = unlimited || !cycleLocked || revisionsLeft > 0;

  const checklist = useMemo(() => buildChecklist(profile, kind), [profile, kind]);
  const checklistMissing = checklist.filter((i) => !i.ok);
  const briefingIncomplete = kind !== "analysis" && checklistMissing.length > 0;
  const showRequestForm = briefingIncomplete || requestOpen || !current;
  const editHref = `/ai/onboarding?next=${encodeURIComponent(`/ai/app/${slug}?solicitar=1`)}`;

  /** Clique na red flag: leva até a tela do campo e volta para gerar/revisar. */
  function handleChecklistSelect(item: ChecklistItem) {
    if (item.where === "cadastro") {
      navigate(
        `/ai/onboarding?campo=${item.key}&next=${encodeURIComponent(
          backTo && backTo.startsWith("/ai/") ? backTo : currentHref,
        )}`,
      );
      return;
    }
    
    // Para itens de briefing, garante que o formulário de solicitação esteja aberto
    setRequestOpen(true);
    
    // Se o item for de "briefing" mas o kind for diferente (ex: dieta pedindo campo de treino),
    // redireciona para o módulo correto com a flag de solicitar
    if (kind === "diet" && (item.key.includes("training") || item.key.includes("activity") || item.key.includes("cardio"))) {
      navigate(`/ai/app/treino?solicitar=1&campo=${item.key}&next=${encodeURIComponent(currentHref)}`);
      return;
    }
    
    setTimeout(() => {
      focusField(`brief-${item.key}`);
    }, 100);
  }

  const requestForm = (
    <>
      {kind !== "analysis" && (
        <AiBriefingChecklist
          profile={profile}
          kind={kind}
          items={checklist}
          editHref={editHref}
          onSelect={handleChecklistSelect}
        />
      )}
      {kind === "analysis" && <AiExamAttach selected={examIds} onChange={setExamIds} />}
      {kind === "workout" && <AiWorkoutBriefing profile={profile} onChange={setWorkoutBrief} collapsible />}
      {kind === "diet" && <AiDietBriefing profile={profile} onChange={setDietBrief} collapsible />}
      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="w-full text-sm font-medium sm:w-auto sm:flex-1 sm:min-w-0">
            Campo livre — conte os detalhes
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AiVoiceInput onTranscribe={(t) => setInstruction((v) => appendTranscript(v, t))} />
            <AiFieldTipsDialog kind={kind} />
          </div>
        </div>
        <Textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={
            current
              ? kind === "workout"
                ? "O que deseja ajustar no seu treino? Ex: priorizar ombros ou trocar exercícios."
                : "O que deseja ajustar no cardápio? Ex: trocar o jantar por opções mais rápidas."
              : "Quer acrescentar alguma observação antes de gerar? (opcional)"
          }
        />
        <p className="text-xs text-muted-foreground">
          Quanto mais detalhes você informar, melhor a entrega. Toque em "Como escrever aqui?" para ver o guia.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => run("create")} disabled={busy || cycleLocked || briefingIncomplete}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : cycleLocked || briefingIncomplete ? <Lock className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {current ? "Gerar novo ciclo" : "Gerar agora"}
          </Button>
          {current && (
            <Button className="flex-1" variant="outline" onClick={() => run("revise")} disabled={busy || revisionsLeft === 0 || briefingIncomplete}>
              <RefreshCw className="mr-2 h-4 w-4" /> Revisar
            </Button>
          )}
        </div>
        {briefingIncomplete && (
          <p className="text-xs font-medium text-destructive">
            Complete os {checklistMissing.length} campo(s) do checklist acima para liberar a geração e a revisão.
          </p>
        )}
        {cycleLocked && (
          <p className="text-xs text-muted-foreground">
            A estrutura principal é preservada durante o ciclo — é assim que a metodologia gera adaptação real. Use uma
            revisão para ajustes pontuais.
          </p>
        )}
      </Card>
    </>
  );

  async function run(mode: "create" | "revise") {
    if (!subscription && !unlimited) {
      navigate("/ai/assinatura");
      return;
    }
    if (mode === "revise" && !instruction.trim()) {
      toast.error("Descreva o que deseja ajustar.");
      return;
    }
    if (briefingIncomplete) {
      toast.error(`Checklist incompleto: faltam ${checklistMissing.length} campo(s) do briefing.`);
      return;
    }
    setBusy(true);
    const fullInstruction = [kind === "workout" ? workoutBrief : kind === "diet" ? dietBrief : "", instruction.trim()]
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
      setRequestOpen(false);
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
      {backTo && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-primary/40 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">
            Você veio de outra tela para completar um campo. Ao terminar, volte para gerar ou revisar.
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate(backTo)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar e continuar
          </Button>
        </Card>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {current ? (
          <>
            <Badge variant="secondary">
              {unlimited ? "Ciclo livre" : daysLeft > 0 ? `${daysLeft} dia(s) no ciclo` : "Novo ciclo liberado"}
            </Badge>
          </>
        ) : (
          <Badge variant="outline">Primeira geração</Badge>
        )}
      </div>

      {current && (
        <AiRevisionsBanner
          used={current.revisions}
          max={maxRevisions}
          cycleStart={current.cycle_start}
          cycleDays={mod.cycleDays}
          unlimited={unlimited}
        />
      )}

      {isGuided ? (
        <>
          {kind === "diet" && <AiDietBriefing profile={profile} onChange={setDietBrief} compact />}
          <div className="mb-4">
            <Button
              size="lg"
              onClick={() => setRequestOpen(true)}
              disabled={!canRequest}
              className="w-full shadow-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              {kind === "diet" ? "Solicitar novo cardápio ou revisão" : "Solicitar novo treino ou revisão"}
            </Button>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Toque aqui para pedir um novo ciclo ou uma revisão do que já foi entregue.
            </p>
          </div>
          <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
            <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 [&>button.absolute]:hidden sm:h-auto sm:max-h-[85vh] sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:rounded-lg">
              <DialogHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-3 border-b bg-background px-4 py-3 text-left sm:px-6">
                <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg">{kind === "diet" ? "Novo cardápio ou revisão" : "Novo treino ou revisão"}</DialogTitle>
                <DialogDescription className="text-xs">
                  {kind === "diet"
                    ? "Revise seu cadastro e o briefing antes de solicitar."
                    : "Revise seu cadastro e a rotina de treino/cardio antes de solicitar."}
                </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setRequestOpen(false)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
              </DialogHeader>
              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{requestForm}</div>
            </DialogContent>
          </Dialog>
        </>
      ) : showRequestForm ? (
        requestForm
      ) : null}
      {current && (
        <>
        {kind === "workout" && (
          <div>
            <AiWorkoutProgram content={current.content} />
          </div>
        )}
        {kind === "diet" ? (
          <Card className="mt-5 p-5">
            <AiDietPlan content={current.content} weightKg={profile?.weight_kg ?? null} />
            <p className="mt-4 text-[11px] text-muted-foreground">
              Atualizado em {new Date(current.updated_at).toLocaleString("pt-BR")}
            </p>
          </Card>
        ) : kind === "workout" ? (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Atualizado em {new Date(current.updated_at).toLocaleString("pt-BR")}
          </p>
        ) : (
          <AiAnalysisReport
            content={current.content}
            generationId={current.id}
            updatedAt={current.updated_at}
          />
        )}
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