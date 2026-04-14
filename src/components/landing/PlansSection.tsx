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
    <section id="planos" className="py-24 px-6 surface">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Planos de <span className="gradient-text">Acompanhamento</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu momento e objetivo. Todos incluem acompanhamento real e personalizado.
          </p>
        </motion.div>

        <div className={`grid grid-cols-1 ${plans.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-8`}>
          {plans.map((plan, i) => {
            const isPopular = plans.length >= 3 ? i === midIndex : i === 0;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-8 border transition-all duration-500 ${
                  isPopular
                    ? "border-primary glow-border bg-card"
                    : "border-border bg-card/50"
                } relative`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Mais Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1 text-primary">
                  {iconMap[i] || <Star className="w-6 h-6" />}
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                </div>
                {plan.subtitle && (
                  <p className="text-muted-foreground text-sm mb-4">{plan.subtitle}</p>
                )}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-muted-foreground">Pix</span>
                  <span className="text-4xl font-display font-bold gradient-text">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/ {plan.duration}</span>
                </div>
{plan.card_price && (
                  <p className="text-xs text-muted-foreground mb-4">
                    {plan.duration_days >= 180
                      ? `ou ${plan.card_price} no cartão em até 6x de R$ 88,31`
                      : plan.duration_days >= 90
                        ? `ou ${plan.card_price} no cartão em até 3x de R$ 96,63`
                        : `ou ${plan.card_price} no cartão à vista`}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.benefits?.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button
                    className={`w-full ${isPopular ? "gradient-bg text-primary-foreground hover:opacity-90" : ""}`}
                    variant={isPopular ? "default" : "outline"}
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
