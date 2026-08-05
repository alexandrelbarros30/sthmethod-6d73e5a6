import { useEffect, useState } from "react";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AiVoiceInput, { appendTranscript } from "@/components/ai/AiVoiceInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { focusField } from "@/lib/field-focus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Brain } from "lucide-react";

interface FormState {
  full_name: string;
  age: string;
  sex: string;
  weight_kg: string;
  height_cm: string;
  goal: string;
  training_level: string;
  routine: string;
  meals_per_day: string;
  restrictions: string;
  comorbidities: string;
  medications: string;
  dislikes: string;
  budget: string;
  training_days: string;
  equipment: string;
  limitations: string;
  sleep: string;
  stress: string;
}

const EMPTY: FormState = {
  full_name: "", age: "", sex: "", weight_kg: "", height_cm: "", goal: "", training_level: "",
  routine: "", meals_per_day: "", restrictions: "", comorbidities: "", medications: "", dislikes: "", budget: "",
  training_days: "", equipment: "", limitations: "", sleep: "", stress: "",
};

export default function AiOnboarding() {
  useSthAiTheme();
  const { user, loading: authLoading } = useAuth() as { user: { id: string } | null; loading?: boolean };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const campoParam = searchParams.get("campo");
  const returnTo = nextParam && nextParam.startsWith("/ai/") ? nextParam : "/ai/app";
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      navigate(`/ai/login?next=${encodeURIComponent(`/ai/onboarding${nextParam ? `?next=${nextParam}` : ""}`)}`);
      return;
    }
    (async () => {
      const { data } = await supabase.from("ai_app_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setData(data);
        const a = (data.answers ?? {}) as Record<string, string>;
        setForm((prev) => ({
          ...prev,
          // Auditoria: NO RESET. Mantém os dados locais do prev.
          ...prev,
          full_name: data.full_name ?? "",
          age: data.age?.toString() ?? "",
          sex: data.sex ?? "",
          weight_kg: data.weight_kg?.toString() ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          goal: data.goal ?? "",
          training_level: data.training_level ?? "",
          comorbidities: (data as any).comorbidities ?? "",
          medications: (data as any).medications ?? "",
          ...a,
        }));
        setStep(data.phase1_complete ? 1 : 0);
      } else {
        const { data: authUser } = await supabase.auth.getUser();
        const metaName = (authUser?.user?.user_metadata as any)?.full_name || "";
        if (metaName) setForm((f) => ({ ...f, full_name: metaName }));
      }
      setReady(true);
    })();
  }, [user?.id, authLoading, navigate]);

  const STEP0_FIELDS = ["full_name", "age", "sex", "weight_kg", "height_cm", "goal", "training_level"];

  // Chegou aqui a partir de uma red flag do checklist: abre a etapa certa e destaca o campo.
  useEffect(() => {
    if (!ready || !campoParam) return;
    setStep(STEP0_FIELDS.includes(campoParam) ? 0 : 1);
    focusField(`f-${campoParam}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, campoParam]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(phase: 1 | 2) {
    if (!user?.id) return;
    if (phase === 1) {
      const missing = !form.full_name || !form.age || !form.sex || !form.weight_kg || !form.height_cm || !form.goal || !form.training_level;
      if (missing) {
        toast.error("Preencha todos os campos essenciais.");
        return;
      }
    }
    
    // Auditoria: Garante que NENHUM campo seja perdido ao persistir
    const fullAnswers = {
      ...(data?.answers ?? {}), // preserva respostas existentes vindas do banco
      ...form, // mescla com o formulário atual
      meals_per_day: form.meals_per_day,
      restrictions: form.restrictions,
      comorbidities: form.comorbidities,
      medications: form.medications,
      dislikes: form.dislikes,
      budget: form.budget,
      training_days: form.training_days,
      equipment: form.equipment,
      limitations: form.limitations,
      sleep: form.sleep,
      stress: form.stress,
    };

    setSaving(true);
    const { error } = await supabase.from("ai_app_profiles").upsert({
      user_id: user.id,
      full_name: form.full_name,
      age: Number(form.age) || null,
      sex: form.sex || null,
      weight_kg: Number(form.weight_kg) || null,
      height_cm: Number(form.height_cm) || null,
      goal: form.goal || null,
      training_level: form.training_level || null,
      comorbidities: form.comorbidities || null,
      medications: form.medications || null,
      answers: fullAnswers,
      step: phase,
      phase1_complete: true,
      phase2_complete: phase === 2,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (phase === 1) {
      setStep(1);
    } else {
      toast.success("Perfil concluído.");
      navigate(returnTo);
    }
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">STH METHOD AI</span>
        </div>

        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: step === 0 ? "50%" : "100%" }} />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 0 ? "Cadastro essencial" : "Perfil avançado"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 0
            ? "O básico para a inteligência entender seu ponto de partida."
            : "Quanto mais preciso aqui, mais personalizado fica o seu plano."}
        </p>

        <Card className="mt-6 space-y-4 p-5">
          {step === 0 ? (
            <>
              <div id="f-full_name" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Nome completo</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div id="f-age" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Idade</Label>
                  <Input inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} />
                </div>
                <div id="f-sex" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Sexo</Label>
                  <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={5} className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div id="f-weight_kg" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Peso (kg)</Label>
                  <Input inputMode="decimal" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
                </div>
                <div id="f-height_cm" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Altura (cm)</Label>
                  <Input inputMode="numeric" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
                </div>
              </div>
              <div id="f-goal" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Objetivo</Label>
                <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="recomposicao">Recomposição corporal</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="saude">Saúde e rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="f-training_level" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Nível de treino</Label>
                <Select value={form.training_level} onValueChange={(v) => set("training_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div id="f-routine" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Como é sua rotina no dia a dia?</Label>
                <Textarea rows={2} value={form.routine} onChange={(e) => set("routine", e.target.value)} placeholder="Horários, trabalho, deslocamento..." />
                <AiVoiceInput onTranscribe={(t) => set("routine", appendTranscript(form.routine, t))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div id="f-meals_per_day" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Refeições por dia</Label>
                  <Input inputMode="numeric" value={form.meals_per_day} onChange={(e) => set("meals_per_day", e.target.value)} />
                </div>
                <div id="f-training_days" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Dias de treino por semana</Label>
                  <Input inputMode="numeric" value={form.training_days} onChange={(e) => set("training_days", e.target.value)} />
                </div>
              </div>
              <div id="f-restrictions" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Restrições alimentares / alergias</Label>
                <Input value={form.restrictions} onChange={(e) => set("restrictions", e.target.value)} />
              </div>
              <div id="f-comorbidities" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Comorbidades (doenças/condições de saúde)</Label>
                <Textarea rows={2} value={form.comorbidities} onChange={(e) => set("comorbidities", e.target.value)} placeholder="Ex.: diabetes, hipertensão, hipotireoidismo. Se não houver, escreva 'Nenhuma'" />
                <AiVoiceInput onTranscribe={(t) => set("comorbidities", appendTranscript(form.comorbidities, t))} />
                <p className="text-[11px] text-muted-foreground">Usado na avaliação e na construção do seu cardápio e treino.</p>
              </div>
              <div id="f-medications" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Medicamentos em uso</Label>
                <Textarea rows={2} value={form.medications} onChange={(e) => set("medications", e.target.value)} placeholder="Ex.: Metformina 850mg 2x/dia, Losartana 50mg/dia. Se não usa, escreva 'Nenhum'" />
                <AiVoiceInput onTranscribe={(t) => set("medications", appendTranscript(form.medications, t))} />
                <p className="text-[11px] text-muted-foreground">Usado na avaliação e na construção do seu cardápio e treino.</p>
              </div>
              <div id="f-dislikes" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Alimentos que você não gosta</Label>
                <Input value={form.dislikes} onChange={(e) => set("dislikes", e.target.value)} />
              </div>
              <div id="f-budget" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Orçamento para alimentação</Label>
                <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="economico">Econômico</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="livre">Sem restrição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="f-equipment" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Equipamentos disponíveis</Label>
                <Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Academia completa, halteres em casa, peso do corpo..." />
              </div>
              <div id="f-limitations" className="space-y-1.5 scroll-mt-24 p-1">
                <Label>Limitações físicas / lesões</Label>
                <Input value={form.limitations} onChange={(e) => set("limitations", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div id="f-sleep" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Horas de sono</Label>
                  <Input inputMode="numeric" value={form.sleep} onChange={(e) => set("sleep", e.target.value)} />
                </div>
                <div id="f-stress" className="space-y-1.5 scroll-mt-24 p-1">
                  <Label>Nível de estresse</Label>
                  <Select value={form.stress} onValueChange={(v) => set("stress", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={5} className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="mt-5 flex items-center justify-between gap-3">
          {step === 1 ? (
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          ) : <span />}
          <Button onClick={() => save(step === 0 ? 1 : 2)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {step === 0 ? "Continuar" : "Concluir"}
            {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}