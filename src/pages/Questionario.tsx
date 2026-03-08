import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Calculator, Flame, Beef, Droplets, Wheat, CheckCircle2 } from "lucide-react";
import { calculateAge, calculateMacros, type MacroResult } from "@/lib/macro-calculator";
import {
  objectiveLabels, activityLabels,
  trainingIntensityOptions, cardioIntensityOptions,
  physicalActivityLevelOptions,
} from "@/lib/form-constants";

interface QuizForm {
  gender: string;
  birth_date: string;
  height: string;
  weight: string;
  physical_activity_level: string;
  activity_type: string;
  does_cardio: string;
  training_days_per_week: string;
  training_duration_minutes: string;
  training_intensity: string;
  cardio_days_per_week: string;
  cardio_duration_minutes: string;
  cardio_intensity: string;
  objective: string;
}

const emptyForm: QuizForm = {
  gender: "", birth_date: "", height: "", weight: "",
  physical_activity_level: "", activity_type: "", does_cardio: "",
  training_days_per_week: "", training_duration_minutes: "", training_intensity: "",
  cardio_days_per_week: "", cardio_duration_minutes: "", cardio_intensity: "",
  objective: "",
};

export default function Questionario() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<QuizForm>(emptyForm);
  const [result, setResult] = useState<MacroResult | null>(null);

  const set = (field: keyof QuizForm, value: string) => setForm(f => ({ ...f, [field]: value }));

  const showTrainingDetails = form.activity_type === "musculacao" || form.activity_type === "crossfit";
  const showCardioDetails = form.does_cardio === "sim";
  const age = form.birth_date ? calculateAge(form.birth_date) : null;

  const canAdvanceStep = (s: number): boolean => {
    switch (s) {
      case 0: return !!form.gender && !!form.birth_date && !!form.height && !!form.weight;
      case 1: return !!form.physical_activity_level;
      case 2: {
        if (!form.activity_type) return false;
        if (showTrainingDetails && (!form.training_days_per_week || !form.training_duration_minutes || !form.training_intensity)) return false;
        if (!form.does_cardio) return false;
        if (showCardioDetails && (!form.cardio_days_per_week || !form.cardio_duration_minutes || !form.cardio_intensity)) return false;
        return true;
      }
      case 3: return !!form.objective;
      default: return true;
    }
  };

  const totalSteps = 4;

  const handleCalculate = () => {
    if (!age || age <= 0 || age >= 120) return;
    const res = calculateMacros({
      gender: form.gender as "masculino" | "feminino",
      age, weight: Number(form.weight), height: Number(form.height),
      activityType: form.activity_type,
      doesCardio: form.does_cardio === "sim",
      objective: form.objective,
      physicalActivityLevel: form.physical_activity_level || undefined,
      trainingDaysPerWeek: form.training_days_per_week ? Number(form.training_days_per_week) : undefined,
      trainingDurationMinutes: form.training_duration_minutes ? Number(form.training_duration_minutes) : undefined,
      trainingIntensity: form.training_intensity || undefined,
      cardioDaysPerWeek: form.cardio_days_per_week ? Number(form.cardio_days_per_week) : undefined,
      cardioDurationMinutes: form.cardio_duration_minutes ? Number(form.cardio_duration_minutes) : undefined,
      cardioIntensity: form.cardio_intensity || undefined,
    });
    setResult(res);
    setStep(totalSteps);
  };

  const next = () => {
    if (step === totalSteps - 1) {
      handleCalculate();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold gradient-text">ST&H</Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Acessar Plataforma</Button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          {step < totalSteps && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Passo {step + 1} de {totalSteps}</span>
                <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-bg rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 0: Dados pessoais */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Dados Básicos</CardTitle>
                    <p className="text-sm text-muted-foreground">Precisamos de algumas informações para calcular seus macros.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Gênero *</Label>
                      <Select value={form.gender} onValueChange={v => set("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data de nascimento *{age ? ` (${age} anos)` : ""}</Label>
                      <Input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Altura (cm) *</Label>
                        <Input type="number" placeholder="170" value={form.height} onChange={e => set("height", e.target.value)} />
                      </div>
                      <div>
                        <Label>Peso (kg) *</Label>
                        <Input type="number" placeholder="75" value={form.weight} onChange={e => set("weight", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 1: NEAT */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Nível de Atividade Diária (NEAT)</CardTitle>
                    <p className="text-sm text-muted-foreground">Fora dos treinos — sua rotina diária de movimento.</p>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={form.physical_activity_level} onValueChange={v => set("physical_activity_level", v)} className="space-y-3">
                      {physicalActivityLevelOptions.map(o => (
                        <div key={o.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value={o.value} id={`pal-${o.value}`} className="mt-0.5" />
                          <label htmlFor={`pal-${o.value}`} className="text-sm cursor-pointer flex-1">
                            <span className="font-medium">{o.label}</span>
                            <span className="text-muted-foreground block text-xs mt-0.5">{o.desc}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Treino e Cardio */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Treino e Cardio</CardTitle>
                    <p className="text-sm text-muted-foreground">Detalhe sua rotina de exercícios.</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label className="font-semibold">Tipo de atividade física *</Label>
                      <RadioGroup value={form.activity_type} onValueChange={v => set("activity_type", v)} className="flex gap-4 mt-2">
                        {Object.entries(activityLabels).map(([val, lab]) => (
                          <div key={val} className="flex items-center gap-2">
                            <RadioGroupItem value={val} id={`act-${val}`} />
                            <label htmlFor={`act-${val}`} className="text-sm cursor-pointer">{lab}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {showTrainingDetails && (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <p className="text-sm font-semibold">Detalhes do treino</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Dias por semana *</Label>
                            <div className="flex items-center gap-3">
                              <Slider min={1} max={7} step={1} value={[Number(form.training_days_per_week) || 3]}
                                onValueChange={([v]) => set("training_days_per_week", v.toString())} className="flex-1" />
                              <span className="text-sm font-bold w-6 text-center">{form.training_days_per_week || "—"}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Duração (min) *</Label>
                            <div className="flex items-center gap-3">
                              <Slider min={15} max={180} step={5} value={[Number(form.training_duration_minutes) || 60]}
                                onValueChange={([v]) => set("training_duration_minutes", v.toString())} className="flex-1" />
                              <span className="text-sm font-bold w-10 text-center">{form.training_duration_minutes || "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Intensidade *</Label>
                          <RadioGroup value={form.training_intensity} onValueChange={v => set("training_intensity", v)} className="space-y-1 mt-1">
                            {trainingIntensityOptions.map(o => (
                              <div key={o.value} className="flex items-start gap-2">
                                <RadioGroupItem value={o.value} id={`ti-${o.value}`} className="mt-0.5" />
                                <label htmlFor={`ti-${o.value}`} className="text-xs cursor-pointer">
                                  <span className="font-medium">{o.label}</span>
                                  <span className="text-muted-foreground"> — {o.desc}</span>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="font-semibold">Pratica cardio? *</Label>
                      <RadioGroup value={form.does_cardio} onValueChange={v => set("does_cardio", v)} className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="sim" id="c-sim" />
                          <label htmlFor="c-sim" className="text-sm cursor-pointer">Sim</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="nao" id="c-nao" />
                          <label htmlFor="c-nao" className="text-sm cursor-pointer">Não</label>
                        </div>
                      </RadioGroup>
                    </div>

                    {showCardioDetails && (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <p className="text-sm font-semibold">Detalhes do cardio</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Dias por semana *</Label>
                            <div className="flex items-center gap-3">
                              <Slider min={1} max={7} step={1} value={[Number(form.cardio_days_per_week) || 3]}
                                onValueChange={([v]) => set("cardio_days_per_week", v.toString())} className="flex-1" />
                              <span className="text-sm font-bold w-6 text-center">{form.cardio_days_per_week || "—"}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Duração (min) *</Label>
                            <div className="flex items-center gap-3">
                              <Slider min={10} max={120} step={5} value={[Number(form.cardio_duration_minutes) || 30]}
                                onValueChange={([v]) => set("cardio_duration_minutes", v.toString())} className="flex-1" />
                              <span className="text-sm font-bold w-10 text-center">{form.cardio_duration_minutes || "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Intensidade *</Label>
                          <RadioGroup value={form.cardio_intensity} onValueChange={v => set("cardio_intensity", v)} className="space-y-1 mt-1">
                            {cardioIntensityOptions.map(o => (
                              <div key={o.value} className="flex items-start gap-2">
                                <RadioGroupItem value={o.value} id={`ci-${o.value}`} className="mt-0.5" />
                                <label htmlFor={`ci-${o.value}`} className="text-xs cursor-pointer">
                                  <span className="font-medium">{o.label}</span>
                                  <span className="text-muted-foreground"> — {o.desc}</span>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Objetivo */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-display">Qual seu objetivo?</CardTitle>
                    <p className="text-sm text-muted-foreground">Escolha o foco principal da sua meta atual.</p>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={form.objective} onValueChange={v => set("objective", v)} className="space-y-3">
                      {Object.entries(objectiveLabels).map(([val, lab]) => (
                        <div key={val} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value={val} id={`obj-${val}`} />
                          <label htmlFor={`obj-${val}`} className="text-sm cursor-pointer font-medium">{lab}</label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Result */}
            {step === totalSteps && result && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <Card className="overflow-hidden">
                  <CardHeader className="gradient-bg text-primary-foreground text-center pb-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
                    </motion.div>
                    <CardTitle className="text-2xl font-display">Seus Macronutrientes</CardTitle>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                      Calculado com base na equação de Mifflin-St Jeor
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Calorias */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">TMB</p>
                        <p className="text-xl font-bold font-display">{result.bmr}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">TDEE</p>
                        <p className="text-xl font-bold font-display">{result.tdee}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="p-4 rounded-xl gradient-bg text-primary-foreground">
                        <Flame className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-xs opacity-80 mb-1">Meta Diária</p>
                        <p className="text-xl font-bold font-display">{result.dailyCalories}</p>
                        <p className="text-xs opacity-80">kcal</p>
                      </motion.div>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="text-center p-4 rounded-xl border border-border">
                        <Beef className="w-5 h-5 mx-auto mb-2 text-red-500" />
                        <p className="text-2xl font-bold font-display">{result.proteinG}g</p>
                        <p className="text-xs text-muted-foreground">Proteína</p>
                        <p className="text-xs text-muted-foreground">{result.proteinG * 4} kcal</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                        className="text-center p-4 rounded-xl border border-border">
                        <Wheat className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                        <p className="text-2xl font-bold font-display">{result.carbsG}g</p>
                        <p className="text-xs text-muted-foreground">Carboidratos</p>
                        <p className="text-xs text-muted-foreground">{result.carbsG * 4} kcal</p>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                        className="text-center p-4 rounded-xl border border-border">
                        <Droplets className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold font-display">{result.fatG}g</p>
                        <p className="text-xs text-muted-foreground">Gorduras</p>
                        <p className="text-xs text-muted-foreground">{result.fatG * 9} kcal</p>
                      </motion.div>
                    </div>

                    {/* Objetivo */}
                    <div className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Objetivo selecionado</p>
                      <p className="font-semibold">{objectiveLabels[form.objective]}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.objective === "perder_gordura" && "Déficit de 500 kcal aplicado ao TDEE"}
                        {form.objective === "hipertrofia" && "Superávit de 350 kcal aplicado ao TDEE"}
                        {form.objective === "manter_peso" && "Manutenção — sem ajuste calórico"}
                      </p>
                    </div>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                      className="text-center space-y-4 pt-4">
                      <div className="glass rounded-xl p-6 glow-border">
                        <h3 className="text-lg font-display font-bold mb-2">
                          Quer um plano personalizado para alcançar seus resultados?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Cadastre-se e tenha acesso a acompanhamento profissional com dieta, treino e protocolos sob medida.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Link to="/cadastro">
                            <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 px-8">
                              Quero me cadastrar <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                          <Link to="/#planos">
                            <Button size="lg" variant="outline" className="px-8">
                              Ver planos disponíveis
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => { setStep(0); setResult(null); }}>
                        Refazer questionário
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < totalSteps && (
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button onClick={next} disabled={!canAdvanceStep(step)} className="gradient-bg text-primary-foreground hover:opacity-90">
                {step === totalSteps - 1 ? (
                  <><Calculator className="w-4 h-4 mr-2" /> Calcular Macros</>
                ) : (
                  <>Próximo <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
