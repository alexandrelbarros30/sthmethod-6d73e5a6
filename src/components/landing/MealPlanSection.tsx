import { motion } from "framer-motion";
import { UtensilsCrossed, Coffee, Sun, Cookie, Moon } from "lucide-react";

const meals = [
  {
    icon: Coffee,
    name: "Café da manhã",
    items: ["Ovos mexidos (2 un)", "Aveia com banana", "Café sem açúcar"],
  },
  {
    icon: Sun,
    name: "Almoço",
    items: ["Frango grelhado (150g)", "Arroz integral (100g)", "Salada verde", "Azeite de oliva (1 colher)"],
  },
  {
    icon: Cookie,
    name: "Lanche",
    items: ["Iogurte natural (200ml)", "Castanhas (30g)"],
  },
  {
    icon: Moon,
    name: "Jantar",
    items: ["Peixe grelhado (150g)", "Batata doce (150g)", "Legumes refogados"],
  },
];

const macros = [
  { label: "Proteína", value: "150g", color: "text-blue-400" },
  { label: "Carboidratos", value: "220g", color: "text-amber-400" },
  { label: "Gorduras", value: "65g", color: "text-rose-400" },
  { label: "Calorias totais", value: "2.000 kcal", color: "gradient-text" },
];

const MealPlanSection = () => (
  <section id="plano-alimentar" className="py-24 md:py-32 px-6 bg-[hsl(0_0%_4%)] text-white">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-brand mb-5 inline-flex items-center gap-2">
          <UtensilsCrossed className="w-3.5 h-3.5" /> Exemplo prático
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-white">
          <span className="text-brand">Plano alimentar</span> diário.
        </h2>
        <p className="text-base md:text-lg text-white/60 font-light mt-5">Referência de 2.000 kcal — personalizado para cada aluno.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40 mb-6">
        {meals.map((meal, i) => (
          <motion.div
            key={meal.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="bg-background p-7"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <meal.icon className="w-4 h-4 text-foreground" />
              <h3 className="text-foreground text-[15px] font-semibold tracking-[-0.01em]">{meal.name}</h3>
            </div>
            <ul className="space-y-2">
              {meal.items.map((item) => (
                <li key={item} className="text-[14px] text-muted-foreground font-light flex items-center gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-foreground/30 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="border border-border/40 rounded-2xl p-8 bg-background"
      >
        <h3 className="text-center text-[11px] font-medium text-muted-foreground mb-6 uppercase tracking-[0.2em]">Macros Totais Aproximados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {macros.map((m) => (
            <div key={m.label}>
              <div className={`text-2xl md:text-3xl font-semibold tracking-[-0.03em] ${m.color}`}>{m.value}</div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mt-2">{m.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default MealPlanSection;
