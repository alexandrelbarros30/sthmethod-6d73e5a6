import { useEffect, useState } from "react";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  routine: "", meals_per_day: "", restrictions: "", dislikes: "", budget: "",
  training_days: "", equipment: "", limitations: "", sleep: "", stress: "",
};

export default function AiOnboarding() {
  useSthAiTheme();
  const { user, loading: authLoading } = useAuth() as { user: { id: string } | null; loading?: boolean };
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      navigate("/ai/login?next=/ai/onboarding");
      return;
    }
    (async () => {
      const { data } = await supabase.from("ai_app_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const a = (data.answers ?? {}) as Record<string, string>;
        setForm({
          ...EMPTY,
          full_name: data.full_name ?? "",
          age: data.age?.toString() ?? "",
          sex: data.sex ?? "",
          weight_kg: data.weight_kg?.toString() ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          goal: data.goal ?? "",
          training_level: data.training_level ?? "",
          ...a,
        });
        setStep(data.phase1_complete ? 1 : 0);
      } else {
        const { data: authUser } = await supabase.auth.getUser();
        const metaName = (authUser?.user?.user_metadata as any)?.full_name || "";
        if (metaName) setForm((f) => ({ ...f, full_name: metaName }));
      }
      setReady(true);
    })();
  }, [user?.id, authLoading, navigate]);

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
      answers: {
        routine: form.routine,
        meals_per_day: form.meals_per_day,
        restrictions: form.restrictions,
        dislikes: form.dislikes,
        budget: form.budget,
        training_days: form.training_days,
        equipment: form.equipment,
        limitations: form.limitations,
        sleep: form.sleep,
        stress: form.stress,
      },
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
      navigate("/ai/app");
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
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Idade</Label>
                  <Input inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sexo</Label>
                  <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Peso (kg)</Label>
                  <Input inputMode="decimal" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Altura (cm)</Label>
                  <Input inputMode="numeric" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="recomposicao">Recomposição corporal</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="saude">Saúde e rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nível de treino</Label>
                <Select value={form.training_level} onValueChange={(v) => set("training_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Como é sua rotina no dia a dia?</Label>
                <Textarea rows={2} value={form.routine} onChange={(e) => set("routine", e.target.value)} placeholder="Horários, trabalho, deslocamento..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Refeições por dia</Label>
                  <Input inputMode="numeric" value={form.meals_per_day} onChange={(e) => set("meals_per_day", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dias de treino por semana</Label>
                  <Input inputMode="numeric" value={form.training_days} onChange={(e) => set("training_days", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Restrições alimentares / alergias</Label>
                <Input value={form.restrictions} onChange={(e) => set("restrictions", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Alimentos que você não gosta</Label>
                <Input value={form.dislikes} onChange={(e) => set("dislikes", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Orçamento para alimentação</Label>
                <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economico">Econômico</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="livre">Sem restrição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Equipamentos disponíveis</Label>
                <Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Academia completa, halteres em casa, peso do corpo..." />
              </div>
              <div className="space-y-1.5">
                <Label>Limitações físicas / lesões</Label>
                <Input value={form.limitations} onChange={(e) => set("limitations", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Horas de sono</Label>
                  <Input inputMode="numeric" value={form.sleep} onChange={(e) => set("sleep", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nível de estresse</Label>
                  <Select value={form.stress} onValueChange={(v) => set("stress", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
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