import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClipboardList, Flame, HelpCircle, Pencil, Sparkles, ShieldCheck } from "lucide-react";
import type { AiProfile } from "@/hooks/useAiApp";
import { calculateMacros } from "@/lib/macro-calculator";
import { objectiveLabels } from "@/lib/form-constants";

interface MetricInfoProps {
  label: string;
  value: string;
  tip: string;
}

function MetricInfo({ label, value, tip }: MetricInfoProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
            </div>
            <p className="mt-0.5 text-sm font-semibold">{value}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface Props {
  profile: AiProfile | null;
  onChange: (brief: string) => void;
}

const GOAL_TO_OBJECTIVE: Record<string, string> = {
  emagrecimento: "perder_gordura",
  perder_gordura: "perder_gordura",
  hipertrofia: "hipertrofia",
  recomposicao: "manter_peso",
  performance: "manter_peso",
  saude: "manter_peso",
  manter_peso: "manter_peso",
};

const GOAL_LABELS: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  recomposicao: "Recomposição corporal",
  performance: "Performance",
  saude: "Saúde e rotina",
};

export default function AiDietBriefing({ profile, onChange }: Props) {
  const answers = (profile?.answers ?? {}) as Record<string, string>;

  const [objective, setObjective] = useState("");
  const [kcal, setKcal] = useState("");
  const [meals, setMeals] = useState("5");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [preferences, setPreferences] = useState("");
  const [notes, setNotes] = useState("");
  const seeded = useRef<string | null>(null);

  // Gasto energético total: cadastro + rotina/atividade já registrada
  const macros = useMemo(() => {
    const weight = Number(profile?.weight_kg || 0);
    const height = Number(profile?.height_cm || 0);
    const age = Number(profile?.age || 0);
    if (!weight || !height || !age) return null;
    const obj = objective || GOAL_TO_OBJECTIVE[profile?.goal ?? ""] || "manter_peso";
    return calculateMacros({
      gender: profile?.sex === "feminino" ? "feminino" : "masculino",
      age,
      weight,
      height,
      activityType: answers.activity_type || "musculacao",
      doesCardio: answers.does_cardio === "sim",
      objective: obj,
      physicalActivityLevel: answers.physical_activity_level,
      trainingDaysPerWeek: answers.training_days_per_week ? Number(answers.training_days_per_week) : undefined,
      trainingDurationMinutes: answers.training_duration_minutes ? Number(answers.training_duration_minutes) : undefined,
      trainingIntensity: answers.training_intensity,
      cardioDaysPerWeek: answers.cardio_days_per_week ? Number(answers.cardio_days_per_week) : undefined,
      cardioDurationMinutes: answers.cardio_duration_minutes ? Number(answers.cardio_duration_minutes) : undefined,
      cardioIntensity: answers.cardio_intensity,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, objective]);

  // Pré-preenche objetivo e metas com base no gasto energético calculado
  useEffect(() => {
    if (!objective) setObjective(GOAL_TO_OBJECTIVE[profile?.goal ?? ""] || "manter_peso");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  useEffect(() => {
    if (!macros) return;
    const key = `${profile?.user_id}-${objective}`;
    if (seeded.current === key) return;
    seeded.current = key;
    setKcal(String(macros.dailyCalories));
    setProtein(String(macros.proteinG));
    setCarbs(String(macros.carbsG));
    setFat(String(macros.fatG));
  }, [macros, objective, profile?.user_id]);

  const review = useMemo(
    () =>
      [
        { label: "Nome", value: profile?.full_name },
        { label: "Idade", value: profile?.age ? `${profile.age} anos` : null },
        {
          label: "Sexo",
          value: profile?.sex === "feminino" ? "Feminino" : profile?.sex === "masculino" ? "Masculino" : null,
        },
        { label: "Peso", value: profile?.weight_kg ? `${profile.weight_kg} kg` : null },
        { label: "Altura", value: profile?.height_cm ? `${profile.height_cm} cm` : null },
        { label: "Objetivo", value: profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : null },
        { label: "Rotina", value: answers.routine || null },
        { label: "Sono", value: answers.sleep ? `${answers.sleep} h` : null },
        { label: "Estresse", value: answers.stress || null },
      ].filter((i) => i.value),
    [profile, answers],
  );

  useEffect(() => {
    const lines: string[] = [];
    if (objective) lines.push(`- Objetivo: ${objectiveLabels[objective] ?? objective}`);
    if (kcal) lines.push(`- Kcal alvo: ${kcal} kcal/dia`);
    if (meals) lines.push(`- Nº de refeições: ${meals}`);
    if (protein) lines.push(`- Proteína: ${protein} g`);
    if (carbs) lines.push(`- Carboidrato: ${carbs} g`);
    if (fat) lines.push(`- Lipídio: ${fat} g`);
    if (restrictions.trim()) lines.push(`- Restrições: ${restrictions.trim()}`);
    if (preferences.trim()) lines.push(`- Preferências: ${preferences.trim()}`);
    if (notes.trim()) lines.push(`- Observações livres: ${notes.trim()}`);
    if (macros) {
      lines.push(
        `- Gasto energético total calculado (cadastro + rotina): TMB ${macros.bmr} kcal | GET/TDEE ${macros.tdee} kcal.`,
      );
    }
    lines.push(
      "- META OBRIGATÓRIA: o somatório das refeições deve fechar as kcal e macros alvo acima (tolerância de ±5%).",
      "- RESTRIÇÃO: não utilize, cite ou considere protocolos, medicamentos, hormônios ou suplementação terapêutica registrados na STH METHOD. O cardápio é exclusivamente alimentar.",
    );
    onChange(`Briefing do cardápio confirmado pelo usuário (padrão STH METHOD):\n${lines.join("\n")}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective, kcal, meals, protein, carbs, fat, restrictions, preferences, notes, macros]);

  return (
    <div className="mb-4 space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Revisão do seu cadastro</h2>
              <p className="text-xs text-muted-foreground">Confira os dados antes de gerar o cardápio.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ai/onboarding">
              <Pencil className="mr-2 h-4 w-4" /> Editar cadastro
            </Link>
          </Button>
        </div>

        {review.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum dado cadastrado ainda. Complete seu perfil primeiro.
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {review.map((i) => (
              <div key={i.label} className="rounded-lg border border-border/60 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{i.label}</dt>
                <dd className="mt-0.5 text-sm">{i.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Gasto energético total</h2>
            <p className="text-xs text-muted-foreground">
              Calculado sobre os dados do cadastro somados à atividade da sua rotina.
            </p>
          </div>
        </div>

        {!macros ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Informe peso, altura e idade no cadastro para calcular o gasto energético.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "TMB", value: `${macros.bmr} kcal` },
                { label: "GET (TDEE)", value: `${macros.tdee} kcal` },
                { label: "Meta diária", value: `${macros.dailyCalories} kcal` },
                { label: "Proteína", value: `${macros.proteinG} g` },
                { label: "Carboidrato", value: `${macros.carbsG} g` },
                { label: "Gordura", value: `${macros.fatG} g` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{m.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Estes números pré-preenchem o briefing abaixo — você pode ajustar manualmente.
            </p>
          </>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Briefing</h2>
            <p className="text-xs text-muted-foreground">Defina as metas do cardápio.</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Objetivo</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(objectiveLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Kcal alvo</Label>
              <Input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="2500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nº refeições</Label>
              <Input inputMode="numeric" value={meals} onChange={(e) => setMeals(e.target.value)} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Proteína (g)</Label>
              <Input inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="180" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Carbo (g)</Label>
              <Input inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lipídio (g)</Label>
              <Input inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="70" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Restrições</Label>
            <Input
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="Sem lactose, sem glúten..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Preferências</Label>
            <Input
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Gosta de tapioca, salmão, ovos..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações livres (prompt)</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: dividir carbo em 4 refeições, colocar pré-treino sólido, ceia com whey + pasta de amendoim..."
            />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            O cardápio é exclusivamente alimentar. Protocolos registrados na STH METHOD não são utilizados aqui.
          </p>
        </div>
      </Card>
    </div>
  );
}
