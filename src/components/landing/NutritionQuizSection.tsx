import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const questions = [
  {
    q: "Qual seu objetivo?",
    options: ["Emagrecer", "Ganhar massa muscular", "Manter peso"],
  },
  {
    q: "Quantas vezes por semana você pratica atividade física?",
    options: ["0", "1 a 2", "3 a 4", "5 ou mais"],
  },
  {
    q: "Como você considera sua alimentação atual?",
    options: ["Desorganizada", "Moderada", "Equilibrada"],
  },
];

const getResult = (answers: string[]) => {
  const obj = answers[0];
  const freq = answers[1];
  const diet = answers[2];

  if (obj === "Emagrecer") {
    if (diet === "Desorganizada") return "Seu perfil indica necessidade de reeducação alimentar com foco em déficit calórico controlado.";
    return "Seu perfil indica foco em ajuste calórico para perda de gordura com manutenção da massa magra.";
  }
  if (obj === "Ganhar massa muscular") {
    if (freq === "0" || freq === "1 a 2") return "Seu perfil indica necessidade de aumentar a frequência de treinos e ajustar a ingestão proteica.";
    return "Seu perfil indica foco em recomposição corporal com superávit calórico estratégico.";
  }
  return "Seu perfil indica foco em manutenção com otimização da qualidade nutricional.";
};

const NutritionQuizSection = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [weight, setWeight] = useState("");
  const [done, setDone] = useState(false);

  const selectOption = (opt: string) => {
    const next = [...answers];
    next[step] = opt;
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(questions.length);
    }
  };

  const submitWeight = () => {
    if (!weight) return;
    setDone(true);
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setWeight("");
    setDone(false);
  };

  const totalSteps = questions.length + 1;
  const progress = done ? 100 : (step / totalSteps) * 100;

  return (
    <section id="diagnostico" className="py-24 md:py-32 px-6 bg-[hsl(var(--surface))]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5 inline-flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" /> Quiz rápido
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            Descubra seu perfil.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-border/40 rounded-2xl p-8 md:p-10 bg-background"
        >
          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-muted/40 mb-8 overflow-hidden">
            <motion.div className="h-full rounded-full bg-foreground" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          <AnimatePresence mode="wait">
            {!done && step < questions.length && (
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{questions[step].q}</h3>
                <div className="grid gap-3">
                  {questions[step].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectOption(opt)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-[14px] font-light ${
                        answers[step] === opt
                          ? "border-foreground bg-foreground/5 text-foreground"
                          : "border-border/60 hover:border-foreground/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3 h-3" /> Voltar
                  </button>
                )}
              </motion.div>
            )}

            {!done && step === questions.length && (
              <motion.div key="weight" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">Informe seu peso atual (kg)</h3>
                <Input type="number" placeholder="Ex: 80" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <div className="flex gap-3">
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3 h-3" /> Voltar
                  </button>
                  <Button onClick={submitWeight} className="flex-1 rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 text-[14px] font-medium">
                    Ver resultado
                  </Button>
                </div>
              </motion.div>
            )}

            {done && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                <Sparkles className="w-7 h-7 text-foreground mx-auto" />
                <p className="text-foreground text-lg font-light leading-relaxed tracking-[-0.01em]">"{getResult(answers)}"</p>
                <p className="text-[13px] text-muted-foreground font-light">Peso informado: <span className="text-foreground font-medium">{weight} kg</span></p>
                <div className="flex flex-col gap-3">
                  <Link to="/questionario">
                    <Button className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 gap-2 text-[14px] font-medium">
                      Calcular meus Macros <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <button onClick={reset} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    Refazer quiz
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default NutritionQuizSection;
