import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ClipboardList, Dumbbell, HeartPulse, MapPin, Pencil, SlidersHorizontal, Timer } from "lucide-react";
import AiEditSection from "@/components/ai/AiEditSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AiProfile } from "@/hooks/useAiApp";
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
  /** Modo perfil: esconde a revisão do cadastro e mostra botão de salvar explícito. */
  standalone?: boolean;
  /** Modo solicitação: grupos em janelas expansíveis fechadas, cada uma com seu botão salvar. */
  collapsible?: boolean;
}

type Field = { key: string; label: string; options: { value: string; label: string }[]; when?: (v: Record<string, string>) => boolean };

const numberOptions = (from: number, to: number, step: number, suffix: string) => {
  const out: { value: string; label: string }[] = [];
  for (let i = from; i <= to; i += step) out.push({ value: String(i), label: `${i} ${suffix}` });
  return out;
};

// Espelha fielmente a rotina cadastrada na plataforma STH METHOD (src/lib/form-constants.ts)
const FIELDS: Field[] = [
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

const GROUPS: { id: string; title: string; description: string; icon: JSX.Element; keys: string[] }[] = [
  {
    id: "treino",
    title: "Treino",
    description: "Objetivo, NEAT, frequência, duração e intensidade",
    icon: <Dumbbell className="h-4 w-4" />,
    keys: [
      "objective",
      "physical_activity_level",
      "activity_type",
      "training_days_per_week",
      "training_duration_minutes",
      "training_intensity",
    ],
  },
  {
    id: "cardio",
    title: "Cardio",
    description: "Frequência, duração e intensidade do cardio",
    icon: <HeartPulse className="h-4 w-4" />,
    keys: ["does_cardio", "cardio_days_per_week", "cardio_duration_minutes", "cardio_intensity"],
  },
  {
    id: "contexto",
    title: "Local e limitações",
    description: "Onde treina e regiões sensíveis",
    icon: <MapPin className="h-4 w-4" />,
    keys: ["training_place", "injury_area"],
  },
];

export default function AiWorkoutBriefing({ profile, onChange, standalone, collapsible }: Props) {
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

  const missing = visible.filter((f) => !values[f.key]);

  // Cardio somado ao relógio da musculação
  const cardioOn = values.does_cardio === "sim";
  const strengthMin = Number(values.training_duration_minutes || 0);
  const cardioMin = Number(values.cardio_duration_minutes || 0);
  const cardioDays = values.cardio_days_per_week;
  const cardioIntensity = cardioIntensityOptions.find((o) => o.value === values.cardio_intensity)?.label;
  const [cardioDialog, setCardioDialog] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  async function saveRoutine() {
    if (!profile?.user_id) return;
    setSavingRoutine(true);
    const { error } = await supabase
      .from("ai_app_profiles")
      .update({ answers: { ...((profile.answers ?? {}) as Record<string, string>), ...values } })
      .eq("user_id", profile.user_id);
    setSavingRoutine(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rotina atualizada — a IA já usa esses dados na próxima geração.");
  }

  function handleSelect(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    if ((key === "does_cardio" && v === "sim") || (key === "cardio_duration_minutes" && values.does_cardio === "sim")) {
      setCardioDialog(true);
    }
  }

  // Monta o briefing e persiste as respostas no perfil (os dados da STH AI alimentam a STH METHOD)
  useEffect(() => {
    const lines = visible
      .filter((f) => values[f.key])
      .map((f) => {
        const opt = f.options.find((o) => o.value === values[f.key]);
        return `- ${f.label}: ${opt?.label ?? values[f.key]}`;
      });
    if (cardioOn && cardioMin) {
      lines.push(
        `- Composição da sessão: ${strengthMin || "?"} min de musculação + ${cardioMin} min de cardio = ${
          (strengthMin || 0) + cardioMin
        } min de tempo total por sessão (o cardio entra no mesmo relógio do treino).`,
      );
      lines.push(
        `- OBRIGATÓRIO: incluir a seção "## Cardio" com ${cardioDays ?? "?"}x por semana de ${cardioMin} minutos${
          cardioIntensity ? ` em intensidade ${cardioIntensity}` : ""
        }, além da seção "## Abdominal e core".`,
      );
    } else {
      lines.push('- OBRIGATÓRIO: incluir a seção "## Abdominal e core" no programa.');
    }
    onChange(lines.length ? `Rotina confirmada pelo usuário (padrão STH METHOD):\n${lines.join("\n")}` : "");

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
  }, [values, visible]);

  return (
    <div className="mb-4 space-y-4">
      {!standalone && collapsible && (
        <AiEditSection
          icon={<ClipboardList className="h-4 w-4" />}
          title="Revisão do seu cadastro"
          description="Dados pessoais usados pela IA"
          pending={review.length === 0 ? 1 : 0}
        >
          {review.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado cadastrado ainda. Complete seu perfil primeiro.</p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {review.map((i) => (
                <div key={i.label} className="rounded-lg border border-border/60 p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{i.label}</dt>
                  <dd className="mt-0.5 text-sm">{i.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/ai/onboarding?next=/ai/app/treino%3Fsolicitar%3D1">
              <Pencil className="mr-2 h-4 w-4" /> Editar cadastro
            </Link>
          </Button>
        </AiEditSection>
      )}

      {!standalone && !collapsible && (
      {collapsible ? (
        <>
          {GROUPS.map((g) => {
            const fields = visible.filter((f) => g.keys.includes(f.key));
            if (!fields.length) return null;
            const pend = fields.filter((f) => !values[f.key]).length;
            return (
              <AiEditSection
                key={g.id}
                icon={g.icon}
                title={g.title}
                description={g.description}
                pending={pend}
                onSave={saveRoutine}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <div key={f.key} id={`brief-${f.key}`} className="space-y-1.5 scroll-mt-24 p-1">
                      <Label className="flex items-center gap-2 text-xs">
                        {f.label}
                        {!values[f.key] && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">falta</Badge>
                        )}
                      </Label>
                      <Select value={values[f.key] ?? ""} onValueChange={(v) => handleSelect(f.key, v)}>
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
                {g.id === "cardio" && cardioOn && cardioMin > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      O cardio é somado ao relógio do treino:{" "}
                      <strong className="text-foreground">{strengthMin || 0} min</strong> de musculação +{" "}
                      <strong className="text-foreground">{cardioMin} min</strong> de cardio ={" "}
                      <strong className="text-foreground">{(strengthMin || 0) + cardioMin} min</strong> por sessão.
                    </p>
                  </div>
                )}
              </AiEditSection>
            );
          })}
        </>
      ) : (
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
            <Link to="/ai/onboarding?next=/ai/app/treino%3Fsolicitar%3D1">
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
      )}

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Rotina de treino e cardio</h2>
            <p className="text-xs text-muted-foreground">
              {missing.length ? `${missing.length} campo(s) ainda sem resposta.` : "Todos os campos preenchidos."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map((f) => (
            <div key={f.key} id={`brief-${f.key}`} className="space-y-1.5 scroll-mt-24 p-1">
              <Label className="flex items-center gap-2 text-xs">
                {f.label}
                {!values[f.key] && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">falta</Badge>}
              </Label>
              <Select value={values[f.key] ?? ""} onValueChange={(v) => handleSelect(f.key, v)}>
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

        {cardioOn && cardioMin > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              O cardio é somado ao relógio do treino: <strong className="text-foreground">{strengthMin || 0} min</strong> de
              musculação + <strong className="text-foreground">{cardioMin} min</strong> de cardio ={" "}
              <strong className="text-foreground">{(strengthMin || 0) + cardioMin} min</strong> por sessão
              {cardioDays ? `, ${cardioDays}x por semana` : ""}
              {cardioIntensity ? ` em intensidade ${cardioIntensity}` : ""}.
            </p>
          </div>
        )}

        {standalone && (
          <Button className="mt-4 w-full" onClick={saveRoutine} disabled={savingRoutine}>
            {savingRoutine && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar rotina
          </Button>
        )}
      </Card>
      )}

      <Dialog open={cardioDialog} onOpenChange={setCardioDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" /> Cardio entra no relógio do treino
            </DialogTitle>
            <DialogDescription>
              O tempo de cardio é acrescentado à duração da musculação na composição da sessão. Ex.: 60 minutos de
              musculação + 20 minutos de cardio = 80 minutos de treino, com a modalidade e o posicionamento ajustados
              pela intensidade escolhida.
            </DialogDescription>
          </DialogHeader>
          {cardioMin > 0 && (
            <p className="rounded-lg border border-border/60 p-3 text-sm">
              Sua sessão: <strong>{strengthMin || 0} min</strong> musculação + <strong>{cardioMin} min</strong> cardio ={" "}
              <strong>{(strengthMin || 0) + cardioMin} min</strong>.
            </p>
          )}
          <DialogFooter>
            <Button onClick={() => setCardioDialog(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
