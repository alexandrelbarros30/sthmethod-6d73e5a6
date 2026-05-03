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
  <section id="guia-alimentar" className="py-24 md:py-32 px-6 border-t border-border/40">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16 md:mb-20"
      >
        <div className="text-[11px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-5">Nutrição</div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground">
          Guia básico de alimentação.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light mt-5 max-w-xl mx-auto">
          Os pilares de uma alimentação equilibrada para potencializar resultados.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
        {blocks.map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-background p-8 md:p-10"
          >
            <block.icon className="w-6 h-6 text-foreground mb-4" />
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground mb-2">{block.title}</h3>
            <p className="text-[14px] text-muted-foreground font-light mb-5 leading-relaxed">{block.description}</p>
            <ul className="space-y-2">
              {block.items.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[14px] text-foreground/80 font-light">
                  <span className="w-1 h-1 rounded-full bg-foreground/40 flex-shrink-0" />
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
