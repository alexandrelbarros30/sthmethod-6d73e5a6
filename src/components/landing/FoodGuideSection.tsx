import { motion } from "framer-motion";
import { Beef, Wheat, Droplets } from "lucide-react";

const blocks = [
  {
    icon: Beef,
    title: "Fontes de Proteína",
    description: "Essenciais para a construção e reparação muscular, saciedade e metabolismo.",
    items: ["Frango", "Peixe", "Ovos", "Carne magra", "Whey protein"],
  },
  {
    icon: Wheat,
    title: "Carboidratos Inteligentes",
    description: "Fornecem energia sustentada para treinos e atividades do dia a dia.",
    items: ["Arroz", "Batata", "Aveia", "Frutas", "Quinoa"],
  },
  {
    icon: Droplets,
    title: "Gorduras Boas",
    description: "Fundamentais para hormônios, absorção de vitaminas e saúde cerebral.",
    items: ["Abacate", "Azeite de oliva", "Castanhas", "Amêndoas", "Pasta de amendoim"],
  },
];

const FoodGuideSection = () => (
  <section id="guia-alimentar" className="py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Guia Básico de <span className="gradient-text">Alimentação Saudável</span>
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Conheça os pilares de uma alimentação equilibrada para potencializar seus resultados.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {blocks.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass rounded-2xl p-6 glow-border"
          >
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
              <block.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-2">{block.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{block.description}</p>
            <ul className="space-y-1.5">
              {block.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full gradient-bg flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FoodGuideSection;
