import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Rocket, Crown, QrCode, Clock, ShieldCheck, Flame } from "lucide-react";
import DynamicCheckoutDialog from "@/components/DynamicCheckoutDialog";
import { toast } from "sonner";

const PROMO_END = new Date("2026-04-24T23:59:59-03:00");

const iconMap: Record<number, React.ReactNode> = {
  0: <Zap className="w-7 h-7" />,
  1: <Rocket className="w-7 h-7" />,
  2: <Crown className="w-7 h-7" />,
};

const useCountdown = (target: Date) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
};

// Slug → duration_days mapping for direct-link checkout
const slugToDurationDays: Record<string, number> = {
  "turbo-30d": 30,
  "impulso-90d": 90,
  "premium-6m": 180,
};

const Promo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const countdown = useCountdown(PROMO_END);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [autoOpenedSlug, setAutoOpenedSlug] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["promo-abril-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .eq("visibility", "promo_abril")
        .order("duration_days");
      if (error) throw error;
      return data || [];
    },
  });

  const calculateFinalPrice = (plan: any) => {
    const priceStr = String(plan.price).replace(/[^\d,\.]/g, "").replace(",", ".");
    return parseFloat(priceStr) || 0;
  };

  // Auto-resume checkout after signup/login (uses localStorage)
  useEffect(() => {
    if (!user || !plans?.length) return;
    const pendingId = localStorage.getItem("promo_abril_plan_id");
    if (!pendingId) return;
    const plan = plans.find((p: any) => p.id === pendingId);
    if (plan) {
      localStorage.removeItem("promo_abril_plan_id");
      setSelectedPlan(plan);
      setCheckoutOpen(true);
      toast.success("Tudo certo! Finalize seu pagamento via PIX para ativar a promoção.");
    }
  }, [user, plans]);

  // Direct-link mode: /promo/:slug → auto-open checkout for that plan
  useEffect(() => {
    if (!slug || !plans?.length || autoOpenedSlug === slug) return;
    const targetDays = slugToDurationDays[slug];
    if (!targetDays) return;
    const plan = plans.find((p: any) => p.duration_days === targetDays);
    if (!plan) return;

    if (!user) {
      // Not logged in — store target plan and route through signup, returning to this slug URL
      localStorage.setItem("promo_abril_plan_id", plan.id);
      toast.info("Crie sua conta para garantir a promoção — você voltará direto para o pagamento PIX.");
      navigate(`/cadastro?redirect=/promo/${slug}`);
      return;
    }

    setSelectedPlan(plan);
    setCheckoutOpen(true);
    setAutoOpenedSlug(slug);
  }, [slug, plans, user, navigate, autoOpenedSlug]);

  const handleSelect = (plan: any) => {
    if (!user) {
      localStorage.setItem("promo_abril_plan_id", plan.id);
      toast.info("Crie sua conta para garantir a promoção — você voltará direto para o pagamento PIX.");
      navigate(`/cadastro?redirect=/promo`);
      return;
    }
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.4), transparent 50%), radial-gradient(circle at 70% 80%, hsl(var(--primary) / 0.3), transparent 50%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-8 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            <Flame className="w-3 h-3" />
            Promoção por tempo limitado
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-semibold text-foreground mb-6 tracking-[-0.04em] leading-[0.95]"
          >
            Promoção
            <br />
            <span className="text-muted-foreground">STH METHOD</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light tracking-tight"
          >
            Condições especiais de pagamento exclusivas via PIX. Aproveite antes que acabe.
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Promoção encerra em</span>
            </div>
            <div className="flex gap-2 md:gap-3">
              {[
                { label: "Dias", value: countdown.days },
                { label: "Horas", value: countdown.hours },
                { label: "Min", value: countdown.minutes },
                { label: "Seg", value: countdown.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="min-w-[64px] md:min-w-[80px] rounded-2xl bg-card border border-border/40 px-3 py-3"
                >
                  <div className="text-2xl md:text-3xl font-semibold text-foreground tabular-nums tracking-tight">
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                    {unit.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Válida até 24/04/2026</p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando planos...</p>
          ) : !plans?.length ? (
            <p className="text-center text-muted-foreground">Nenhum plano promocional disponível.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {plans.map((plan, i) => {
                const isPopular = i === 1;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                    className={`relative rounded-3xl p-8 border transition-all duration-500 bg-card ${
                      isPopular
                        ? "border-foreground/30 scale-[1.02]"
                        : "border-border/40"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium uppercase tracking-[0.15em] px-4 py-1 rounded-full whitespace-nowrap">
                        Mais Escolhido
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-2 text-foreground">
                      {iconMap[i]}
                      <h3 className="text-xl font-semibold text-foreground tracking-tight">{plan.name}</h3>
                    </div>

                    <Badge variant="outline" className="mb-4 text-xs">
                      <QrCode className="w-3 h-3 mr-1" /> Exclusivo PIX
                    </Badge>

                    <div className="mb-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <span className="text-5xl font-semibold text-foreground tracking-[-0.04em]">
                          {String(plan.price).replace(/R\$\s?/i, "").trim()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pagamento único • {plan.duration}
                      </p>
                    </div>

                    <ul className="space-y-2.5 my-6">
                      {plan.benefits?.map((b: string) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-secondary-foreground"
                        >
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-full ${
                        isPopular ? "bg-foreground text-background hover:bg-foreground/90" : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelect(plan)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Pagar com PIX
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Trust strip */}
          <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Pagamento 100% seguro via Mercado Pago
            </div>
            <div className="hidden md:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              Ativação automática após confirmação
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar à página inicial
            </Link>
          </div>
        </div>
      </section>

      {/* Checkout dialog — forced PIX-only */}
      <DynamicCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        calculateFinalPrice={calculateFinalPrice}
        actionType="new"
        forcePixOnly
        onPaymentSuccess={() => {
          setCheckoutOpen(false);
          navigate("/dashboard/subscription");
        }}
      />
    </div>
  );
};

export default Promo;
