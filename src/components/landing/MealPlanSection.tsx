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
  <section id="plano-alimentar" className="py-20 px-6">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4 text-sm text-muted-foreground">
          <UtensilsCrossed className="w-4 h-4" /> Exemplo prático
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Exemplo de <span className="gradient-text">Plano Alimentar</span> Diário
        </h2>
        <p className="text-muted-foreground mt-2">Referência de 2.000 kcal — personalizado para cada aluno.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {meals.map((meal, i) => (
          <motion.div
            key={meal.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 glow-border"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
                <meal.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-sm">{meal.name}</h3>
            </div>
            <ul className="space-y-1.5">
              {meal.items.map((item) => (
                <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-2xl p-6 glow-border"
      >
        <h3 className="text-center text-sm font-display font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Macros Totais Aproximados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {macros.map((m) => (
            <div key={m.label}>
              <div className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default MealPlanSection;
