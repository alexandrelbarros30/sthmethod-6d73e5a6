import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Brain, Sun, Zap, TestTube, BarChart3, ShieldAlert, Dumbbell,
  ChevronLeft, ChevronRight, MessageCircle, ArrowLeft, X
} from "lucide-react";

import imgMetabolismo from "@/assets/dica-metabolismo.jpg";
import imgTrh from "@/assets/dica-trh.jpg";
import imgJejum from "@/assets/dica-jejum.jpg";
import imgDiabetes from "@/assets/dica-diabetes.jpg";
import imgVitd from "@/assets/dica-vitd.jpg";
import imgB12 from "@/assets/dica-b12.jpg";
import imgExames from "@/assets/dica-exames.jpg";
import imgMentiras from "@/assets/dica-mentiras.jpg";

const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.10)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t50: "hsl(0 0% 50%)",
  t40: "hsl(0 0% 40%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
  orange: "hsl(25 90% 55%)",
  orangeBg: "hsl(25 90% 55% / 0.12)",
  red: "hsl(0 70% 55%)",
  redBg: "hsl(0 70% 55% / 0.12)",
  blue: "hsl(210 70% 55%)",
  blueBg: "hsl(210 70% 55% / 0.12)",
  yellow: "hsl(45 90% 55%)",
  yellowBg: "hsl(45 90% 55% / 0.12)",
  purple: "hsl(270 60% 60%)",
  purpleBg: "hsl(270 60% 60% / 0.12)",
};

interface InsightCard {
  type: "problem" | "error" | "truth" | "solution";
  text: string;
}

interface InsightTopic {
  id: string;
  icon: typeof Flame;
  accentColor: string;
  accentBg: string;
  tag: string;
  title: string;
  subheadline: string;
  img: string;
  cards: InsightCard[];
  cta: string;
}

const topics: InsightTopic[] = [
  {
    id: "adaptacao", icon: Flame, accentColor: G.orange, accentBg: G.orangeBg,
    tag: "Metabolismo", title: "Seu corpo não travou… você travou ele.",
    subheadline: "Você acha que está em platô. Na verdade, criou um ambiente que impede o progresso.",
    img: imgMetabolismo,
    cards: [
      { type: "problem", text: "Você come pouco → metabolismo reduz" },
      { type: "problem", text: "Treina igual sempre → corpo adapta" },
      { type: "problem", text: "Corta tudo → corpo entra em defesa" },
      { type: "error", text: "Não é falta de esforço. É estratégia errada." },
      { type: "solution", text: "Ajuste calórico inteligente, periodização de treino real e refeed estratégico." },
    ],
    cta: "Quer sair do platô de verdade?",
  },
  {
    id: "trh", icon: TestTube, accentColor: G.accent, accentBg: G.accentBg,
    tag: "Hormonal", title: "Pode não ser disciplina. Pode ser hormonal.",
    subheadline: "Baixa energia, libido, dificuldade de resultado… isso não é normal.",
    img: imgTrh,
    cards: [
      { type: "error", text: "\"É idade\" — NÃO. \"É cansaço\" — NÃO." },
      { type: "truth", text: "Pode ser desequilíbrio hormonal real. Hormônios regulam energia, massa muscular, humor e metabolismo." },
      { type: "solution", text: "Exames corretos + interpretação individual + estratégia segura e personalizada." },
    ],
    cta: "Faça seu painel completo",
  },
  {
    id: "jejum", icon: Dumbbell, accentColor: G.blue, accentBg: G.blueBg,
    tag: "Treino", title: "Treinar em jejum queima mais gordura?",
    subheadline: "Depende… e quase ninguém te explica isso certo.",
    img: imgJejum,
    cards: [
      { type: "error", text: "Não é mágico. Não funciona pra todo mundo." },
      { type: "truth", text: "Funciona quando: dieta ajustada + hormônios equilibrados + treino estratégico." },
      { type: "problem", text: "Jejum + dieta ruim = perda de músculo." },
      { type: "solution", text: "O contexto define se funciona ou destrói." },
    ],
    cta: "Quer usar isso do jeito certo?",
  },
  {
    id: "diabetes", icon: ShieldAlert, accentColor: G.red, accentBg: G.redBg,
    tag: "Saúde", title: "Diabetes tipo 2 começa antes do diagnóstico.",
    subheadline: "Você não \"descobre\"… você constrói.",
    img: imgDiabetes,
    cards: [
      { type: "problem", text: "Resistência à insulina silenciosa + gordura visceral + inflamação crônica." },
      { type: "error", text: "Não é só açúcar. É estilo de vida." },
      { type: "solution", text: "Treino + dieta + controle metabólico estratégico." },
    ],
    cta: "Prevenir é mais fácil que remediar",
  },
  {
    id: "vitd", icon: Sun, accentColor: G.yellow, accentBg: G.yellowBg,
    tag: "Integrativa", title: "Vitamina D não é vitamina. É hormônio.",
    subheadline: "Afeta imunidade, testosterona, humor e metabolismo.",
    img: imgVitd,
    cards: [
      { type: "truth", text: "D3 regula mais de 200 genes no corpo humano." },
      { type: "error", text: "\"Só tomar sol resolve\" — nem sempre." },
      { type: "solution", text: "Exame → ajuste de dose → estratégia individual." },
    ],
    cta: "Descubra seus níveis reais",
  },
  {
    id: "b12", icon: Zap, accentColor: G.purple, accentBg: G.purpleBg,
    tag: "Nutrição", title: "Cansaço constante? Pode ser B12.",
    subheadline: "Fadiga, falta de foco, desânimo — sintomas ignorados.",
    img: imgB12,
    cards: [
      { type: "problem", text: "Você trata como preguiça o que é deficiência real." },
      { type: "truth", text: "Seu corpo pode estar sem combustível." },
      { type: "solution", text: "Avalie seus níveis antes de se culpar." },
    ],
    cta: "Avalie seus níveis agora",
  },
  {
    id: "exames", icon: BarChart3, accentColor: G.accent, accentBg: G.accentBg,
    tag: "Diagnóstico", title: "Você não melhora o que não mede.",
    subheadline: "Treinar e fazer dieta sem exame é tentativa e erro.",
    img: imgExames,
    cards: [
      { type: "truth", text: "Hormônios, vitaminas, inflamação, metabolismo — o exame mostra o que o espelho esconde." },
      { type: "solution", text: "Painel completo ST&H — leitura estratégica dos seus marcadores." },
    ],
    cta: "Solicitar painel completo",
  },
  {
    id: "mentiras", icon: Brain, accentColor: G.red, accentBg: G.redBg,
    tag: "Mindset", title: "As mentiras que travam seu resultado.",
    subheadline: "O maior obstáculo não é o treino. É o que você acredita.",
    img: imgMentiras,
    cards: [
      { type: "error", text: "\"Só dieta resolve\" — NÃO." },
      { type: "error", text: "\"Só treino resolve\" — NÃO." },
      { type: "error", text: "\"Hormônio é milagre\" e \"Déficit eterno funciona\" — NÃO." },
      { type: "truth", text: "Resultado vem da combinação estratégica." },
    ],
    cta: "Pare de tentar sozinho",
  },
];

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  problem: { label: "DOR", color: G.red, bg: G.redBg },
  error: { label: "ERRO", color: G.orange, bg: G.orangeBg },
  truth: { label: "VERDADE", color: G.accent, bg: G.accentBg },
  solution: { label: "SOLUÇÃO", color: G.blue, bg: G.blueBg },
};

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20estrategico%20e%20quero%20saber%20mais";

const InsightCarousel = () => {
  const [openTopic, setOpenTopic] = useState<InsightTopic | null>(null);
  const [cardIdx, setCardIdx] = useState(0);

  const handleOpen = (topic: InsightTopic) => {
    setOpenTopic(topic);
    setCardIdx(0);
  };

  const handleClose = () => {
    setOpenTopic(null);
  };

  // ── DETAIL VIEW ──
  if (openTopic) {
    const tc = typeConfig[openTopic.cards[cardIdx].type];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Back */}
        <button onClick={handleClose} className="flex items-center gap-2 text-sm font-medium" style={{ color: G.t50 }}>
          <ArrowLeft className="w-4 h-4" /> Dicas Estratégicas
        </button>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
          <img src={openTopic.img} alt={openTopic.title} className="w-full h-44 object-cover" width={800} height={512} />
          <div
            className="absolute inset-0 flex flex-col justify-end p-5 space-y-1.5"
            style={{ background: "linear-gradient(to top, hsl(0 0% 2% / 0.95), hsl(0 0% 2% / 0.3))" }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm w-fit"
              style={{ background: openTopic.accentBg, color: openTopic.accentColor, border: `0.5px solid ${openTopic.accentColor}33` }}
            >
              <openTopic.icon className="w-3 h-3" />
              {openTopic.tag}
            </span>
            <h2 className="text-lg font-bold tracking-tight leading-tight" style={{ color: G.t96 }}>
              {openTopic.title}
            </h2>
          </div>
        </div>

        {/* Subheadline */}
        <p className="text-sm leading-relaxed" style={{ color: G.t65 }}>
          {openTopic.subheadline}
        </p>

        {/* Card carousel */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
          {/* Badge + counter */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
              style={{ color: tc.color, background: tc.bg }}
            >
              {tc.label}
            </span>
            <span className="text-[11px] font-mono" style={{ color: G.t40 }}>
              {cardIdx + 1}/{openTopic.cards.length}
            </span>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.p
              key={cardIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-[15px] font-medium leading-relaxed min-h-[56px] flex items-center"
              style={{ color: G.t92 }}
            >
              {openTopic.cards[cardIdx].text}
            </motion.p>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {openTopic.cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === cardIdx ? 18 : 6,
                  height: 6,
                  background: i === cardIdx ? openTopic.accentColor : G.t30,
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCardIdx(Math.max(0, cardIdx - 1))}
              disabled={cardIdx === 0}
              className="p-2 rounded-lg transition-colors disabled:opacity-20"
              style={{ background: G.t10 }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: G.t65 }} />
            </button>

            {cardIdx === openTopic.cards.length - 1 ? (
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{ background: openTopic.accentColor, color: "hsl(0 0% 100%)" }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {openTopic.cta}
              </motion.a>
            ) : (
              <button
                onClick={() => setCardIdx(cardIdx + 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: G.t10, color: G.t65 }}
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── GRID VIEW ──
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: G.accent }}>
          Dicas Estratégicas
        </p>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
          Conteúdo que transforma
        </h2>
        <p className="text-xs" style={{ color: G.t50 }}>
          {topics.length} temas essenciais. Toque para explorar.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((topic, i) => {
          const Icon = topic.icon;
          return (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOpen(topic)}
              className="w-full text-left rounded-2xl overflow-hidden relative group"
              style={{ border: `0.5px solid ${G.border}` }}
            >
              {/* Image */}
              <img
                src={topic.img}
                alt={topic.title}
                className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                width={800}
                height={512}
                loading="lazy"
              />

              {/* Overlay */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-4 space-y-1.5"
                style={{ background: "linear-gradient(to top, hsl(0 0% 2% / 0.95) 0%, hsl(0 0% 2% / 0.4) 60%, transparent 100%)" }}
              >
                {/* Tag */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm w-fit"
                  style={{ background: topic.accentBg, color: topic.accentColor, border: `0.5px solid ${topic.accentColor}33` }}
                >
                  <Icon className="w-3 h-3" />
                  {topic.tag}
                </span>

                {/* Title */}
                <h3 className="text-[15px] font-bold tracking-tight leading-snug" style={{ color: G.t96 }}>
                  {topic.title}
                </h3>

                {/* Subtitle preview */}
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: G.t50 }}>
                  {topic.subheadline}
                </p>

                {/* CTA hint */}
                <div className="flex items-center gap-1 pt-0.5">
                  <span className="text-[10px] font-semibold" style={{ color: topic.accentColor }}>Ler mais</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="w-3 h-3" style={{ color: topic.accentColor }} />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCarousel;
