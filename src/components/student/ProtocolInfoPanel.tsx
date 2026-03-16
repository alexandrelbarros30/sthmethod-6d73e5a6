import { motion } from "framer-motion";
import { Heart, Activity, Zap, Shield, FlaskConical, Brain } from "lucide-react";

const categories = [
  {
    title: "Suporte Endócrino Hormonal",
    icon: FlaskConical,
    color: "from-violet-500 to-fuchsia-500",
    glowColor: "shadow-violet-500/20",
    bgAccent: "bg-violet-500/10",
    borderAccent: "border-violet-500/20",
    items: [
      "Otimização dos eixos hormonais",
      "Suporte à tireoide e metabolismo basal",
      "Regulação do cortisol e estresse",
      "Equilíbrio de hormônios anabólicos",
    ],
    iconSecondary: Brain,
  },
  {
    title: "Suporte Cardiovascular, Hepático e Renal",
    icon: Heart,
    color: "from-rose-500 to-orange-500",
    glowColor: "shadow-rose-500/20",
    bgAccent: "bg-rose-500/10",
    borderAccent: "border-rose-500/20",
    items: [
      "Proteção cardiovascular avançada",
      "Suporte à função hepática e detox",
      "Manutenção da saúde renal",
      "Controle lipídico e pressórico",
    ],
    iconSecondary: Shield,
  },
  {
    title: "Suporte Metabólico e Performance",
    icon: Zap,
    color: "from-emerald-500 to-cyan-500",
    glowColor: "shadow-emerald-500/20",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/20",
    items: [
      "Maximização da performance esportiva",
      "Otimização da composição corporal",
      "Suporte energético e recuperação",
      "Nutrição celular e micronutrientes",
    ],
    iconSecondary: Activity,
  },
];

const ProtocolInfoPanel = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase">
          <FlaskConical className="w-3.5 h-3.5" />
          Protocolo Personalizado
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Pilares do Protocolo
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto font-body">
          Seu protocolo é construído sobre três pilares científicos para otimização completa da saúde e performance.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid gap-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          const IconSec = cat.iconSecondary;
          return (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className={`relative overflow-hidden rounded-xl border ${cat.borderAccent} bg-card/80 backdrop-blur-sm p-4 sm:p-5 group hover:shadow-lg ${cat.glowColor} transition-all duration-500`}
            >
              {/* Glow background effect */}
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${cat.color} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
              <div className={`absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br ${cat.color} opacity-[0.04] rounded-full blur-xl`} />

              <div className="relative z-10">
                {/* Title row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg ${cat.glowColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm sm:text-base text-foreground leading-tight">
                      {cat.title}
                    </h3>
                  </div>
                  <IconSec className={`w-5 h-5 text-muted-foreground/30 shrink-0`} />
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-[52px]">
                  {cat.items.map((item, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.15 + j * 0.08 }}
                      className="flex items-start gap-2"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${cat.color} mt-1.5 shrink-0`} />
                      <span className="text-xs sm:text-sm text-muted-foreground font-body leading-snug">
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-[11px] text-muted-foreground/60 font-body"
      >
        Protocolos individualizados com base na avaliação clínica e laboratorial do aluno.
      </motion.p>
    </div>
  );
};

export default ProtocolInfoPanel;
