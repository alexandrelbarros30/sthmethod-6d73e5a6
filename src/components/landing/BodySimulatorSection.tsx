import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown, ArrowRight, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BodySimulatorSection = () => {
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [weeklyLoss, setWeeklyLoss] = useState("0.5");
  const [result, setResult] = useState<{ weeks: number; data: { semana: number; peso: number }[] } | null>(null);

  const simulate = () => {
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    const wl = parseFloat(weeklyLoss);
    if (!cw || !gw || !wl || wl <= 0 || cw <= gw) return;

    const diff = cw - gw;
    const weeks = Math.ceil(diff / wl);
    const data = Array.from({ length: weeks + 1 }, (_, i) => ({
      semana: i,
      peso: Math.max(gw, +(cw - wl * i).toFixed(1)),
    }));
    setResult({ weeks, data });
  };

  return (
    <section id="simulador" className="py-24 md:py-32 px-6 border-t border-border/40">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5 inline-flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Simulador
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            Simule sua evolução.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-border/40 rounded-2xl p-8 md:p-10 bg-background"
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Peso atual (kg)</Label>
              <Input type="number" placeholder="90" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta (kg)</Label>
              <Input type="number" placeholder="75" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Perda/semana (kg)</Label>
              <Input type="number" step="0.1" placeholder="0.5" value={weeklyLoss} onChange={(e) => setWeeklyLoss(e.target.value)} />
            </div>
          </div>

          <Button onClick={simulate} className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 gap-2 text-[14px] font-medium">
            <TrendingDown className="w-4 h-4" /> Simular evolução
          </Button>

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-6">
              <div className="text-center">
                <p className="text-[13px] text-muted-foreground font-light">
                  Estimativa: <span className="text-foreground font-semibold">{result.weeks} semanas</span> para atingir sua meta
                </p>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Semanas", position: "insideBottom", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-center text-[13px] text-muted-foreground font-light">
                Com consistência e acompanhamento adequado, sua meta pode ser alcançada de forma saudável.
              </p>

              <Link to="/login" className="block">
                <Button className="w-full rounded-full h-11 bg-foreground text-background hover:bg-foreground/90 gap-2 text-[14px] font-medium">
                  Iniciar meu acompanhamento <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default BodySimulatorSection;
