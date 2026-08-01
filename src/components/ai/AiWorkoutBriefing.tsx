import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ClipboardList, Pencil, SlidersHorizontal } from "lucide-react";
import type { AiProfile } from "@/hooks/useAiApp";

interface Props {
  profile: AiProfile | null;
  onChange: (brief: string) => void;
}

const FIELDS: { key: string; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: "training_days",
    label: "Dias de treino por semana",
    options: ["2", "3", "4", "5", "6"].map((v) => ({ value: v, label: `${v}x por semana` })),
  },
  {
    key: "session_minutes",
    label: "Tempo por sessão",
    options: [
      { value: "30", label: "Até 30 minutos" },
      { value: "45", label: "45 minutos" },
      { value: "60", label: "60 minutos" },
      { value: "90", label: "90 minutos ou mais" },
    ],
  },
  {
    key: "training_place",
    label: "Onde você treina",
    options: [
      { value: "academia_completa", label: "Academia completa" },
      { value: "academia_basica", label: "Academia básica / condomínio" },
      { value: "casa_halteres", label: "Em casa com halteres/elásticos" },
      { value: "casa_peso_corpo", label: "Em casa só com peso do corpo" },
      { value: "ar_livre", label: "Ar livre / calistenia" },
    ],
  },
  {
    key: "split_pref",
    label: "Divisão preferida",
    options: [
      { value: "indiferente", label: "Deixar a IA escolher" },
      { value: "fullbody", label: "Full body" },
      { value: "upper_lower", label: "Superior / Inferior" },
      { value: "push_pull_legs", label: "Push, Pull, Legs" },
      { value: "abcd", label: "ABCD por grupo muscular" },
    ],
  },
  {
    key: "muscle_focus",
    label: "Prioridade muscular",
    options: [
      { value: "equilibrado", label: "Equilibrado" },
      { value: "gluteos_posterior", label: "Glúteos e posterior" },
      { value: "pernas", label: "Pernas" },
      { value: "costas_ombros", label: "Costas e ombros" },
      { value: "peito_bracos", label: "Peito e braços" },
      { value: "core_cintura", label: "Core e cintura" },
    ],
  },
  {
    key: "cardio_pref",
    label: "Cardio na semana",
    options: [
      { value: "nenhum", label: "Sem cardio" },
      { value: "leve", label: "Leve (caminhada)" },
      { value: "moderado", label: "Moderado (3x por semana)" },
      { value: "hiit", label: "Intenso / HIIT" },
    ],
  },
  {
    key: "training_time",
    label: "Horário do treino",
    options: [
      { value: "manha", label: "Manhã" },
      { value: "tarde", label: "Tarde" },
      { value: "noite", label: "Noite" },
      { value: "variavel", label: "Varia bastante" },
    ],
  },
  {
    key: "injury_area",
    label: "Alguma região sensível?",
    options: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "joelho", label: "Joelho" },
      { value: "lombar", label: "Lombar" },
      { value: "ombro", label: "Ombro" },
      { value: "punho_cotovelo", label: "Punho / cotovelo" },
      { value: "quadril", label: "Quadril" },
    ],
  },
];

const GOAL_LABELS: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  recomposicao: "Recomposição corporal",
  performance: "Performance",
  saude: "Saúde e rotina",
};

const LEVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function AiWorkoutBriefing({ profile, onChange }: Props) {
  const answers = (profile?.answers ?? {}) as Record<string, string>;
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of FIELDS) {
      const raw = String(answers[f.key] ?? "").trim();
      if (raw && f.options.some((o) => o.value === raw)) initial[f.key] = raw;
    }
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  const review = useMemo(
    () =>
      [
        { label: "Nome", value: profile?.full_name },
        { label: "Idade", value: profile?.age ? `${profile.age} anos` : null },
        { label: "Sexo", value: profile?.sex === "feminino" ? "Feminino" : profile?.sex === "masculino" ? "Masculino" : null },
        { label: "Peso", value: profile?.weight_kg ? `${profile.weight_kg} kg` : null },
        { label: "Altura", value: profile?.height_cm ? `${profile.height_cm} cm` : null },
        { label: "Objetivo", value: profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : null },
        { label: "Nível", value: profile?.training_level ? LEVEL_LABELS[profile.training_level] ?? profile.training_level : null },
        { label: "Equipamentos", value: answers.equipment || null },
        { label: "Limitações", value: answers.limitations || null },
        { label: "Rotina", value: answers.routine || null },
        { label: "Sono", value: answers.sleep ? `${answers.sleep} h` : null },
        { label: "Estresse", value: answers.stress || null },
      ].filter((i) => i.value),
    [profile, answers],
  );

  const missing = FIELDS.filter((f) => !values[f.key]);

  useEffect(() => {
    const lines = FIELDS.filter((f) => values[f.key]).map((f) => {
      const opt = f.options.find((o) => o.value === values[f.key]);
      return `- ${f.label}: ${opt?.label ?? values[f.key]}`;
    });
    onChange(lines.length ? `Preferências de treino confirmadas pelo usuário:\n${lines.join("\n")}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

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
              <p className="text-xs text-muted-foreground">Confira os dados antes de gerar o treino.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/ai/onboarding">
              <Pencil className="mr-2 h-4 w-4" /> Editar cadastro
            </Link>
          </Button>
        </div>

        {review.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum dado cadastrado ainda. Complete seu perfil primeiro.</p>
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
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Complete para um treino mais preciso</h2>
            <p className="text-xs text-muted-foreground">
              {missing.length ? `${missing.length} campo(s) ainda sem resposta.` : "Todos os campos preenchidos."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs">
                {f.label}
                {!values[f.key] && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">falta</Badge>}
              </Label>
              <Select value={values[f.key] ?? ""} onValueChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
