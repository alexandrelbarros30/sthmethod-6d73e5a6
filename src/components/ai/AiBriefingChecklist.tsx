import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, CircleAlert, ClipboardCheck, Pencil } from "lucide-react";
import type { AiProfile } from "@/hooks/useAiApp";

export type ChecklistItem = { key: string; label: string; ok: boolean; where: string };

const filled = (v: unknown) => String(v ?? "").trim().length > 0;

/** Campos obrigatórios do briefing/cadastro antes de gerar ou revisar. */
export function buildChecklist(profile: AiProfile | null, kind: "diet" | "workout" | "analysis"): ChecklistItem[] {
  const p = (profile ?? {}) as any;
  const a = (profile?.answers ?? {}) as Record<string, string>;
  const base: ChecklistItem[] = [
    { key: "full_name", label: "Nome completo", ok: filled(p.full_name), where: "cadastro" },
    { key: "age", label: "Idade", ok: Number(p.age) > 0, where: "cadastro" },
    { key: "sex", label: "Sexo biológico", ok: filled(p.sex), where: "cadastro" },
    { key: "weight_kg", label: "Peso atual", ok: Number(p.weight_kg) > 0, where: "cadastro" },
    { key: "height_cm", label: "Altura", ok: Number(p.height_cm) > 0, where: "cadastro" },
    { key: "goal", label: "Objetivo", ok: filled(p.goal), where: "cadastro" },
    { key: "comorbidities", label: "Comorbidades (ou 'Nenhuma')", ok: filled(p.comorbidities), where: "cadastro" },
    { key: "medications", label: "Medicamentos em uso (ou 'Nenhum')", ok: filled(p.medications), where: "cadastro" },
    { key: "routine", label: "Rotina diária", ok: filled(a.routine), where: "cadastro" },
    { key: "physical_activity_level", label: "Nível de atividade física (NEAT)", ok: filled(a.physical_activity_level), where: "briefing" },
    { key: "activity_type", label: "Atividade física praticada", ok: filled(a.activity_type), where: "briefing" },
    { key: "does_cardio", label: "Faz cardio?", ok: filled(a.does_cardio), where: "briefing" },
    { key: "training_days_per_week", label: "Dias de treino por semana", ok: filled(a.training_days_per_week), where: "briefing" },
    { key: "training_duration_minutes", label: "Duração do treino", ok: filled(a.training_duration_minutes), where: "briefing" },
    { key: "training_intensity", label: "Intensidade do treino", ok: filled(a.training_intensity), where: "briefing" },
  ];

  if (kind === "workout") {
    base.push(
      { key: "training_level", label: "Nível de treino", ok: filled(p.training_level), where: "cadastro" },
      { key: "training_place", label: "Onde você treina", ok: filled(a.training_place), where: "briefing" },
      { key: "limitations", label: "Limitações físicas / lesões", ok: filled(p.limitations) || filled(a.limitations), where: "cadastro" },
    );
    if (a.does_cardio === "sim") {
      base.push(
        { key: "cardio_days_per_week", label: "Dias de cardio por semana", ok: filled(a.cardio_days_per_week), where: "briefing" },
        { key: "cardio_duration_minutes", label: "Duração do cardio", ok: filled(a.cardio_duration_minutes), where: "briefing" },
        { key: "cardio_intensity", label: "Intensidade do cardio", ok: filled(a.cardio_intensity), where: "briefing" },
      );
    }
  }

  if (kind === "diet") {
    base.push(
      { key: "meals_per_day", label: "Refeições por dia", ok: filled(a.meals_per_day), where: "cadastro" },
      { key: "restrictions", label: "Restrições alimentares (ou 'Nenhuma')", ok: filled(a.restrictions), where: "cadastro" },
      { key: "dislikes", label: "Alimentos que não gosta (ou 'Nenhum')", ok: filled(a.dislikes), where: "cadastro" },
      { key: "budget", label: "Orçamento / padrão de compra", ok: filled(a.budget), where: "cadastro" },
    );
  }

  return base;
}

interface Props {
  profile: AiProfile | null;
  kind: "diet" | "workout" | "analysis";
  items: ChecklistItem[];
  editHref: string;
  title?: string;
  /** Esconde o botão de editar (quando já se está na tela de cadastro). */
  hideEdit?: boolean;
  /** Clique em um item pendente (red flag) — leva o usuário até o campo. */
  onSelect?: (item: ChecklistItem) => void;
}

export default function AiBriefingChecklist({ items, editHref, title, hideEdit, onSelect }: Props) {
  const { done, total, missing } = useMemo(() => {
    const done = items.filter((i) => i.ok).length;
    return { done, total: items.length, missing: items.filter((i) => !i.ok) };
  }, [items]);
  const pct = total ? Math.round((done / total) * 100) : 100;
  const complete = missing.length === 0;

  return (
    <Card className={`mb-4 p-5 ${complete ? "" : "border-destructive/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl ${
              complete ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">{title ?? "Checklist do briefing"}</h2>
            <p className="text-xs text-muted-foreground">
              {complete
                ? "Tudo preenchido — você já pode gerar ou revisar."
                : `${missing.length} campo(s) faltando. Toque no item em vermelho para corrigir.`}
            </p>
          </div>
        </div>
        {!hideEdit && (
          <Button asChild variant="outline" size="sm">
            <Link to={editHref}>
              <Pencil className="mr-2 h-4 w-4" /> Completar cadastro
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={pct} className="h-2" />
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {done}/{total}
        </span>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((i) => {
          const clickable = !i.ok && Boolean(onSelect);
          const Inner = (
            <>
              <span className="flex items-center gap-2 text-left">
                {i.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <CircleAlert className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className={i.ok ? "" : "font-medium"}>{i.label}</span>
              </span>
              {!i.ok && (
                <span className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase">
                    {i.where}
                  </Badge>
                  {clickable && <ChevronRight className="h-4 w-4 text-destructive" />}
                </span>
              )}
            </>
          );
          return (
            <li key={i.key}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(i)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2.5 text-sm transition-colors hover:bg-destructive/10"
                >
                  {Inner}
                </button>
              ) : (
                <div
                  className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm ${
                    i.ok ? "border-border/60" : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  {Inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
