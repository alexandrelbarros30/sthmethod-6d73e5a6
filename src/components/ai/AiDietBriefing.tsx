import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Flame, Pencil, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AiProfile } from "@/hooks/useAiApp";
import { calculateMacros } from "@/lib/macro-calculator";
import {
  activityLabels,
  cardioIntensityOptions,
  objectiveLabels,
  physicalActivityLevelOptions,
  trainingIntensityOptions,
} from "@/lib/form-constants";

interface Props {
  profile: AiProfile | null;
  onChange: (brief: string) => void;
}

type Field = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  when?: (v: Record<string, string>) => boolean;
};

const numberOptions = (from: number, to: number, step: number, suffix: string) => {
  const out: { value: string; label: string }[] = [];
  for (let i = from; i <= to; i += step) out.push({ value: String(i), label: `${i} ${suffix}` });
  return out;
};

// Rotina — espelha fielmente a rotina cadastrada na STH METHOD (src/lib/form-constants.ts)
const ROUTINE_FIELDS: Field[] = [
  {
    key: "objective",
    label: "Objetivo",
    options: Object.entries(objectiveLabels).map(([value, label]) => ({ value, label })),
  },
  {
    key: "physical_activity_level",
    label: "Nível de atividade física (NEAT)",
    options: physicalActivityLevelOptions.map((o) => ({ value: o.value, label: `${o.label} — ${o.desc}` })),
  },
  {
    key: "activity_type",
    label: "Atividade física praticada",
    options: Object.entries(activityLabels).map(([value, label]) => ({ value, label })),
  },
  {
    key: "training_days_per_week",
    label: "Dias de treino por semana",
    options: numberOptions(1, 7, 1, "x por semana"),
    when: (v) => v.activity_type !== "nenhuma",
  },
  {
    key: "training_duration_minutes",
    label: "Duração do treino",
    options: numberOptions(15, 180, 15, "minutos"),
    when: (v) => v.activity_type !== "nenhuma",
  },
  {
    key: "training_intensity",
    label: "Intensidade do treino",
    options: trainingIntensityOptions.map((o) => ({ value: o.value, label: `${o.label} — ${o.desc}` })),
    when: (v) => v.activity_type !== "nenhuma",
  },
  {
    key: "does_cardio",
    label: "Faz cardio?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
  },
  {
    key: "cardio_days_per_week",
    label: "Dias de cardio por semana",
    options: numberOptions(1, 7, 1, "x por semana"),
    when: (v) => v.does_cardio === "sim",
  },
  {
    key: "cardio_duration_minutes",
    label: "Duração do cardio",
    options: numberOptions(10, 120, 10, "minutos"),
    when: (v) => v.does_cardio === "sim",
  },
  {
    key: "cardio_intensity",
    label: "Intensidade do cardio",
    options: cardioIntensityOptions.map((o) => ({ value: o.value, label: `${o.label} — ${o.desc}` })),
    when: (v) => v.does_cardio === "sim",
  },
];

// Campos específicos do cardápio
const DIET_FIELDS: Field[] = [
  { key: "meals_per_day", label: "Refeições por dia", options: numberOptions(4, 6, 1, "refeições") },
  {
    key: "diet_style",
    label: "Estilo alimentar",
    options: [
      { value: "tradicional", label: "Tradicional / onívoro" },
      { value: "low_carb", label: "Low carb" },
      { value: "vegetariano", label: "Vegetariano" },
      { value: "vegano", label: "Vegano" },
      { value: "sem_lactose", label: "Sem lactose" },
      { value: "sem_gluten", label: "Sem glúten" },
    ],
  },
  {
    key: "food_restrictions",
    label: "Restrições / alergias",
    options: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "lactose", label: "Lactose" },
      { value: "gluten", label: "Glúten" },
      { value: "frutos_do_mar", label: "Frutos do mar" },
      { value: "oleaginosas", label: "Oleaginosas" },
      { value: "ovo", label: "Ovo" },
    ],
  },
  {
    key: "cooking_time",
    label: "Tempo para cozinhar",
    options: [
      { value: "pouco", label: "Pouco — receitas rápidas" },
      { value: "medio", label: "Médio — preparo diário simples" },
      { value: "alto", label: "Alto — posso cozinhar com calma" },
    ],
  },
  {
    key: "meal_prep",
    label: "Faz marmita / meal prep?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não" },
    ],
  },
  {
    key: "budget_level",
    label: "Orçamento dos alimentos",
    options: [
      { value: "economico", label: "Econômico" },
      { value: "intermediario", label: "Intermediário" },
      { value: "sem_restricao", label: "Sem restrição" },
    ],
  },
];

const FIELDS = [...ROUTINE_FIELDS, ...DIET_FIELDS];

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
  const [values, setValues] = useState<Record<string, string>>({});
  const hydrated = useRef(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of FIELDS) {
      const raw = String(answers[f.key] ?? "").trim();
      if (raw && f.options.some((o) => o.value === raw)) initial[f.key] = raw;
    }
    setValues(initial);
    hydrated.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  const visible = useMemo(() => FIELDS.filter((f) => !f.when || f.when(values)), [values]);
  const missing = visible.filter((f) => !values[f.key]);

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

  // Gasto energético total (mesma engine da STH METHOD)
  const macros = useMemo(() => {
    const weight = Number(profile?.weight_kg || 0);
    const height = Number(profile?.height_cm || 0);
    const age = Number(profile?.age || 0);
    if (!weight || !height || !age) return null;
    const objective = values.objective || GOAL_TO_OBJECTIVE[profile?.goal ?? ""] || "manter_peso";
    return calculateMacros({
      gender: profile?.sex === "feminino" ? "feminino" : "masculino",
      age,
      weight,
      height,
      activityType: values.activity_type || "musculacao",
      doesCardio: values.does_cardio === "sim",
      objective,
      physicalActivityLevel: values.physical_activity_level,
      trainingDaysPerWeek: values.training_days_per_week ? Number(values.training_days_per_week) : undefined,
      trainingDurationMinutes: values.training_duration_minutes ? Number(values.training_duration_minutes) : undefined,
      trainingIntensity: values.training_intensity,
      cardioDaysPerWeek: values.cardio_days_per_week ? Number(values.cardio_days_per_week) : undefined,
      cardioDurationMinutes: values.cardio_duration_minutes ? Number(values.cardio_duration_minutes) : undefined,
      cardioIntensity: values.cardio_intensity,
    });
  }, [profile, values]);

  // Monta o briefing e persiste as respostas (os dados da STH AI alimentam a STH METHOD)
  useEffect(() => {
    const lines = visible
      .filter((f) => values[f.key])
      .map((f) => {
        const opt = f.options.find((o) => o.value === values[f.key]);
        return `- ${f.label}: ${opt?.label ?? values[f.key]}`;
      });

    if (macros) {
      lines.push(
        `- Gasto energético calculado (Mifflin-St Jeor + NEAT + treino + cardio): TMB ${macros.bmr} kcal | GET/TDEE ${macros.tdee} kcal.`,
        `- META OBRIGATÓRIA DO CARDÁPIO: ${macros.dailyCalories} kcal/dia, ${macros.proteinG} g de proteína, ${macros.carbsG} g de carboidrato e ${macros.fatG} g de gordura. O somatório das refeições deve fechar nesses valores (tolerância de ±5%).`,
      );
    }
    lines.push(
      "- RESTRIÇÃO: não utilize, cite ou considere protocolos, medicamentos, hormônios ou suplementação terapêutica eventualmente registrados na STH METHOD. O cardápio é exclusivamente alimentar.",
    );

    onChange(
      lines.length
        ? `Cadastro e rotina confirmados pelo usuário (padrão STH METHOD):\n${lines.join("\n")}`
        : "",
    );

    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    if (!profile?.user_id || !Object.keys(values).length) return;
    const timer = setTimeout(() => {
      supabase
        .from("ai_app_profiles")
        .update({ answers: { ...(profile.answers ?? {}), ...values } as Record<string, string> })
        .eq("user_id", profile.user_id)
        .then(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, visible, macros]);

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
            <UtensilsCrossed className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Briefing do cardápio</h2>
            <p className="text-xs text-muted-foreground">
              {missing.length ? `${missing.length} campo(s) ainda sem resposta.` : "Todos os campos preenchidos."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs">
                {f.label}
                {!values[f.key] && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                    falta
                  </Badge>
                )}
              </Label>
              <Select value={values[f.key] ?? ""} onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Gasto energético total</h2>
            <p className="text-xs text-muted-foreground">
              Calculado a partir do cadastro, da rotina e dos exercícios físicos informados.
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
              Estes números definem o cardápio gerado: as refeições fecham a meta diária dentro de ±5%.
            </p>
          </>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            O cardápio é exclusivamente alimentar. Protocolos registrados na STH METHOD não são utilizados aqui — esse
            tema pertence ao acompanhamento profissional.
          </p>
        </div>
      </Card>
    </div>
  );
}
