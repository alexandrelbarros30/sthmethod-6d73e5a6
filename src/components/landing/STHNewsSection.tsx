import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import restauracaoImg from "@/assets/sthnews-atrofia-hero.jpg";
import subqImg from "@/assets/sthnews-subq-glass-1.jpg";
import cinturaImg from "@/assets/sthnews-subq-glass-2.jpg";
import triadeImg from "@/assets/sthnews-triade-thumb.jpg";
import masteronImg from "@/assets/sthnews-masteron-glass-1.jpg";
import glowImg from "@/assets/sthnews-glow-hero.jpg";
import gestrinonaImg from "@/assets/sthnews-gestrinona-hero.jpg";
import platoImg from "@/assets/sthnews-plato-hero.jpg";
import trembolonaImg from "@/assets/sthnews-trembolona-hero.jpg";
import ginecoImg from "@/assets/sthnews-gineco-hero.jpg";
import bfAltoImg from "@/assets/sthnews-bfalto-hero.jpg";
import tirzeImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import tirzeDesmameImg from "@/assets/sthnews-tirzepatida-desmame-hero.jpg";
import proteinaImg from "@/assets/sthnews-proteina-hero.jpg";
import oleosImg from "@/assets/sthnews-oleos-sementes-hero.jpg";
import ultraImg from "@/assets/sthnews-ultraprocessados-hero.jpg";
import marcadoresImg from "@/assets/sthnews-marcadores-hero.jpg";
import colateraisImg from "@/assets/sthnews-tirzepatida-colaterais-hero.jpg";
import hipertensaoImg from "@/assets/sthnews-hipertensao-hero.jpg";
import mounjaroPesoTravadoImg from "@/assets/sthnews-mounjaro-peso-travado-hero.jpg";

const articles = [
  {
    to: "/tendencias/tirzepatida-desmame",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "💉 O desmame da tirzepatida: quando a caneta acaba, o verdadeiro desafio começa",
    desc: "Emagrecer é apenas a primeira etapa. A manutenção dos resultados depende dos hábitos construídos durante o tratamento.",
    img: tirzeDesmameImg,
  },
  {
    to: "/tendencias/restauracao-muscular",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "O músculo lembra: restaurando o físico após 10 anos de hormônios",
    desc: "Memória miotonuclear, reset do eixo HPT e o caminho real para reverter atrofia crônica.",
    img: restauracaoImg,
  },
  {
    to: "/tendencias/hipertensao-arterial",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🫀 Hipertensão Arterial: o tratado tático completo",
    desc: "Classificação, fisiopatologia, diagnóstico diferencial e conduta medicamentosa, suplementar e comportamental.",
    img: hipertensaoImg,
  },
  {
    to: "/tendencias/mounjaro-peso-travado",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "22 Mai 2026",
    title: "⚖️ Peso travado no Mounjaro? Entenda por que isso acontece",
    desc: "A balança não conta a história completa. Retenção hídrica, composição corporal e o que fazer na estabilização.",
    img: mounjaroPesoTravadoImg,
  },
  {
    to: "/tendencias/tirzepatida-colaterais",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "💊 Tirzepatida: mapa tático completo dos colaterais",
    desc: "Do arroto sulfúrico à pancreatite — cada sintoma cruzado com solução medicamentosa, suplementar e comportamental.",
    img: colateraisImg,
  },
  {
    to: "/tendencias/marcadores-laboratoriais",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🧪 Marcadores laboratoriais: monitoramento estratégico",
    desc: "Eixo hormonal, cardiovascular, hepático, renal, glicêmico e hematológico — o guia completo para quem utiliza hormônios e anabolizantes.",
    img: marcadoresImg,
  },
  {
    to: "/tendencias/ultraprocessados-saude-mental",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🧠 Ultraprocessados não destroem magicamente sua saúde mental",
    desc: "Existe associação — mas não é causa direta. Quem manda no resultado é o ecossistema alimentar inteiro.",
    img: ultraImg,
  },
  {
    to: "/tendencias/oleos-sementes",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🌻 Você foi enganado sobre os óleos de sementes",
    desc: "Sozinhos não são inflamatórios. O problema é o ecossistema alimentar — excesso calórico, ultraprocessados e sedentarismo.",
    img: oleosImg,
  },
  {
    to: "/tendencias/proteina-superavit",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🥩 Proteína em excesso não engorda como você pensa",
    desc: "Superávit calórico via proteína em treinados: TEF, NEAT e particionamento de nutrientes reescrevendo a equação.",
    img: proteinaImg,
  },
  {
    to: "/tendencias/tirzepatida-hipertrofia",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "💉 Tirzepatida e hipertrofia: o protocolo que preserva massa magra",
    desc: "GLP-1 + GIP, andrógenos como proteção tecidual e o déficit feito do jeito certo.",
    img: tirzeImg,
  },
  {
    to: "/tendencias/hormonios-bf-alto",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🧬 Hormônio com BF alto: o fim do mito (e a verdade técnica)",
    desc: "Não é proibido. É cirúrgico — quando os exames falam mais alto que o medo.",
    img: bfAltoImg,
  },
  {
    to: "/tendencias/ginecomastia",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🧬 Ginecomastia: o caroço silencioso que trava sua definição",
    desc: "O termômetro do equilíbrio hormonal — e o freio invisível dos seus resultados.",
    img: ginecoImg,
  },
  {
    to: "/tendencias/trembolona",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "🧬 Trembolona: a arquitetura corporal no patamar de elite",
    desc: "Densidade, secura e detalhamento — o manejo clínico que entrega o próximo nível.",
    img: trembolonaImg,
  },
  {
    to: "/tendencias/plato-metabolico",
    tag: "CAPA",
    tagClass: "bg-primary text-primary-foreground",
    date: "Nova matéria",
    title: "Por que seu corpo parou de emagrecer (mesmo fazendo tudo certo)",
    desc: "Platô Metabólico — não é menos comida, é mais saúde metabólica.",
    img: platoImg,
  },
  {
    to: "/tendencias/gestrinona",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "💊 Gestrinona: a molécula de tripla ação — cápsulas e chip subdérmico",
    desc: "Densidade, secura e equilíbrio hormonal feminino.",
    img: gestrinonaImg,
  },
  {
    to: "/tendencias/glow-blend",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "✨ Glow Blend: o trio de peptídeos que regenera, repara e faz o corpo brilhar",
    desc: "BPC-157 + TB-500 + GHK-Cu — beleza nascida da saúde celular.",
    img: glowImg,
  },
  {
    to: "/tendencias/drostanolona-masteron",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "🧬 Drostanolona (Masteron): o derivado de DHT que define densidade e performance",
    desc: "Densidade muscular, estética e os limites do uso feminino.",
    img: masteronImg,
  },
  {
    to: "/tendencias/drostanolona-tecnica",
    tag: "EXCLUSIVO",
    tagClass: "bg-destructive text-destructive-foreground",
    date: "Nova matéria",
    title: "🧪 Drostanolona: análise farmacológica completa",
    desc: "Mecanismo, farmacocinética, toxicidade e o veredito STH METHOD.",
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
    <section id="sth-news" className="py-20 sm:py-32 px-4 sm:px-6 bg-[hsl(var(--surface))]">
      <div className="max-w-6xl mx-auto">
        {/* Header — Apple style: tipografia grande, silenciosa, centrada */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-[11px] font-semibold tracking-[0.3em] text-primary uppercase mb-4">
            STH News
          </p>
          <h2 className="text-4xl sm:text-6xl font-display font-semibold text-foreground tracking-tight leading-[1.05] mb-4">
            Inteligência aplicada
            <br />
            <span className="text-muted-foreground">ao corpo.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-light">
            Matérias clínicas. Linguagem clara. Decisões melhores.
          </p>
        </motion.div>

        {/* Duas capas em destaque — Trembolona + Platô Metabólico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {articles.slice(0, 2).map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
            >
              <Link
                to={a.to}
                className="group relative block rounded-3xl overflow-hidden bg-card border border-border/40 hover:border-border transition-all duration-500 h-full"
              >
                <div className="aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-muted relative">
                  <img
                    src={a.img}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-primary uppercase mb-3">
                    Em destaque
                  </p>
                  <h3 className="text-lg sm:text-2xl font-display font-semibold text-foreground tracking-tight leading-tight mb-2">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light mb-4 line-clamp-2">
                    {a.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                    Ler matéria
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Grid secundário — minimalista, ar generoso */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(2).map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <Link
                to={a.to}
                className="group block rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-border transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={a.img}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-2">
                    {a.tag === "CAPA" ? "Nova matéria" : a.tag === "EXCLUSIVO" ? "Exclusivo" : a.date}
                  </p>
                  <h3 className="text-base sm:text-lg font-display font-semibold text-foreground leading-snug tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light line-clamp-2">
                    {a.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Apple style */}
        <div className="mt-14 text-center">
          <Link
            to="/tendencias"
            className="inline-flex items-center gap-1.5 text-base text-primary font-medium hover:opacity-70 transition-opacity"
          >
            Ver todas as matérias
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default STHNewsSection;