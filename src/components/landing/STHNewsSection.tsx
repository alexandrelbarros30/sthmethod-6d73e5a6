import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Newspaper, ChevronRight, ArrowRight } from "lucide-react";
import subqImg from "@/assets/sthnews-subq-glass-1.jpg";
import cinturaImg from "@/assets/sthnews-subq-glass-2.jpg";
import triadeImg from "@/assets/sthnews-triade-thumb.jpg";
import masteronImg from "@/assets/sthnews-masteron-glass-1.jpg";

const articles = [
  {
    to: "/tendencias/drostanolona-masteron",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "🧬 Drostanolona (Masteron): o derivado de DHT que separa densidade de risco",
    desc: "Densidade muscular, virilização e os limites do uso feminino.",
    img: masteronImg,
  },
  {
    to: "/tendencias/triade-intestino-hormonio",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "🧬 Tríade SII, SOP e DRGE: o eixo intestino-hormônio-inflamação",
    desc: "Mesma raiz, três expressões.",
    img: triadeImg,
  },
  {
    to: "/tendencias/subcutanea-estrategia",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "💉 IM → SubQ: a estratégia farmacocinética que mudou o jogo",
    desc: "Estabilidade sérica e técnica de precisão.",
    img: subqImg,
  },
  {
    to: "/tendencias/cintura-estetica",
    tag: "NOVO",
    tagClass: "bg-primary text-primary-foreground",
    date: "22 Abr 2026",
    title: "⚡ A estética da cintura: o que treino e alimentação realmente fazem",
    desc: "Estrutura, estímulo e estratégia.",
    img: cinturaImg,
  },
];

const STHNewsSection = () => {
  return (
    <section id="sth-news" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass border border-primary/30 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] text-primary uppercase">STH News</p>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">Inteligência aplicada ao corpo</h2>
            </div>
          </div>
          <Link to="/tendencias" className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={a.to}
                className="group block rounded-2xl overflow-hidden border border-border/60 bg-card/40 backdrop-blur-xl hover:border-primary/40 transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={a.img}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={1280}
                    height={800}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-wider ${a.tagClass}`}>{a.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{a.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-tight mb-1.5 group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {a.desc} <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link to="/tendencias" className="inline-flex items-center gap-1 text-xs text-primary font-bold">
            Ver todas as matérias <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default STHNewsSection;