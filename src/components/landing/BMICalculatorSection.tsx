import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowRight, Scale } from "lucide-react";

const classifyBMI = (bmi: number) => {
  if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-blue-400", bg: "bg-blue-500/20" };
  if (bmi < 25) return { label: "Peso normal", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  return { label: "Obesidade", color: "text-red-400", bg: "bg-red-500/20" };
};

const BMICalculatorSection = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{ bmi: number; classification: ReturnType<typeof classifyBMI> } | null>(null);

  const calculate = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0) return;
    const bmi = w / (h * h);
    setResult({ bmi, classification: classifyBMI(bmi) });
  };

  return (
    <section id="imc" className="py-24 md:py-32 px-6 border-t border-border/40">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5 inline-flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" /> Ferramenta gratuita
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            Calculadora de IMC.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light mt-5">Descubra em segundos sua classificação corporal.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-border/40 rounded-2xl p-8 md:p-10 bg-background"
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="bmi-height">Altura (cm)</Label>
              <Input
                id="bmi-height"
                type="number"
                placeholder="Ex: 175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-weight">Peso (kg)</Label>
              <Input
                id="bmi-weight"
                type="number"
                placeholder="Ex: 80"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 gap-2 text-[14px] font-medium">
            <Calculator className="w-4 h-4" /> Calcular IMC
          </Button>

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center space-y-4"
            >
              <div className={`inline-flex items-center gap-3 rounded-2xl px-6 py-4 ${result.classification.bg}`}>
                <span className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{result.bmi.toFixed(1)}</span>
                <span className={`text-[13px] font-medium tracking-wide ${result.classification.color}`}>{result.classification.label}</span>
              </div>
              <div>
                <Link to="/questionario">
                  <Button variant="outline" className="gap-2 rounded-full border-border/60 h-10 text-[13px] font-medium">
                    Descubra seus Macros Ideais <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default BMICalculatorSection;
