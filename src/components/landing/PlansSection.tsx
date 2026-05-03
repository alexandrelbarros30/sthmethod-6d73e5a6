import { motion } from "framer-motion";
import { Check, Zap, Rocket, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<number, React.ReactNode> = {
  0: <Zap className="w-6 h-6" />,
  1: <Rocket className="w-6 h-6" />,
  2: <Crown className="w-6 h-6" />,
  3: <Star className="w-6 h-6" />,
};

const PlansSection = () => {
  const { data: plans } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .in("visibility", ["public"])
        .order("duration_days");
      if (error) throw error;
      return data || [];
    },
  });

  if (!plans?.length) return null;

  const midIndex = Math.floor(plans.length / 2);

  return (
    <section id="planos" className="py-24 md:py-32 px-6 bg-[hsl(var(--surface))]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-5">Planos</div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
            <span className="text-brand">Acompanhamento</span> real, personalizado.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto mt-5">
            Escolha o plano ideal para o seu momento e objetivo.
          </p>
        </motion.div>

        <div className={`grid grid-cols-1 ${plans.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
          {plans.map((plan, i) => {
            const isPopular = plans.length >= 3 ? i === midIndex : i === 0;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-8 md:p-10 border transition-all relative bg-background ${
                  isPopular ? "border-foreground/80" : "border-border/40"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2 text-foreground">
                  {iconMap[i] || <Star className="w-5 h-5" />}
                  <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{plan.name}</h3>
                </div>
                {plan.subtitle && (
                  <p className="text-muted-foreground text-[13px] font-light mb-6">{plan.subtitle}</p>
                )}
                <div className="flex items-baseline gap-1.5 mb-8 pb-8 border-b border-border/40">
                  <span className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground">Pix</span>
                  <span className="text-4xl md:text-5xl font-semibold tracking-[-0.04em] text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-light">/ {plan.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.benefits?.map((f: string) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-foreground/80 font-light">
                      <Check className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button
                    className={`w-full rounded-full h-11 text-[14px] font-medium ${
                      isPopular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-transparent border border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Quero esse plano
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
