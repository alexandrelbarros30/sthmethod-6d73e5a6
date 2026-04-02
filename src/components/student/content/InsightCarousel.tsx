import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Brain, Sun, Zap, TestTube, BarChart3, ShieldAlert, Dumbbell,
  ChevronLeft, ChevronRight, MessageCircle, Bookmark, Share2, ArrowRight
} from "lucide-react";

const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.10)",
  accentBorder: "hsl(145 60% 42% / 0.18)",
  accentGlow: "hsl(145 60% 42% / 0.25)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  cardHover: "hsl(0 0% 8%)",
  border: "hsl(0 0% 14%)",
  t96: "hsl(0 0% 96%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t50: "hsl(0 0% 50%)",
  t40: "hsl(0 0% 40%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
  orange: "hsl(25 90% 55%)",
  orangeBg: "hsl(25 90% 55% / 0.10)",
  red: "hsl(0 70% 55%)",
  redBg: "hsl(0 70% 55% / 0.10)",
  blue: "hsl(210 70% 55%)",
  blueBg: "hsl(210 70% 55% / 0.10)",
  yellow: "hsl(45 90% 55%)",
  yellowBg: "hsl(45 90% 55% / 0.10)",
  purple: "hsl(270 60% 60%)",
  purpleBg: "hsl(270 60% 60% / 0.10)",
};

interface InsightTopic {
  id: string;
  icon: typeof Flame;
  accentColor: string;
  accentBg: string;
  tag: string;
  title: string;
  subheadline: string;
  cards: { type: "problem" | "error" | "truth" | "solution" | "action"; text: string }[];
  cta: string;
}

const topics: InsightTopic[] = [
  {
    id: "adaptacao",
    icon: Flame,
    accentColor: G.orange,
    accentBg: G.orangeBg,
    tag: "Metabolismo",
    title: "Seu corpo não travou… você travou ele.",
    subheadline: "Você acha que está em platô. Na verdade, criou um ambiente que impede o progresso.",
    cards: [
      { type: "problem", text: "Você come pouco → metabolismo reduz" },
      { type: "problem", text: "Treina igual sempre → corpo adapta" },
      { type: "problem", text: "Corta tudo → corpo entra em defesa" },
      { type: "error", text: "Não é falta de esforço. É estratégia errada." },
      { type: "solution", text: "Ajuste calórico inteligente, não só cortar" },
      { type: "solution", text: "Periodização de treino real" },
      { type: "solution", text: "Refeed e descanso estratégico" },
    ],
    cta: "Quer sair do platô de verdade?",
  },
  {
    id: "trh",
    icon: TestTube,
    accentColor: G.accent,
    accentBg: G.accentBg,
    tag: "Hormonal",
    title: "Seu problema pode não ser disciplina. Pode ser hormonal.",
    subheadline: "Baixa energia, libido, dificuldade de resultado… isso não é normal.",
    cards: [
      { type: "error", text: "\"É idade\" — NÃO." },
      { type: "error", text: "\"É cansaço\" — NÃO." },
      { type: "truth", text: "Pode ser desequilíbrio hormonal real." },
      { type: "truth", text: "Hormônios regulam: energia, massa muscular, humor e metabolismo." },
      { type: "solution", text: "Exames corretos + interpretação individual" },
      { type: "solution", text: "Estratégia segura e personalizada" },
    ],
    cta: "Faça seu painel completo com a ST&H",
  },
  {
    id: "jejum",
    icon: Dumbbell,
    accentColor: G.blue,
    accentBg: G.blueBg,
    tag: "Treino",
    title: "Treinar em jejum QUEIMA MAIS GORDURA?",
    subheadline: "Depende… e quase ninguém te explica isso certo.",
    cards: [
      { type: "error", text: "Não é mágico. Não funciona pra todo mundo." },
      { type: "truth", text: "Funciona quando: dieta ajustada + hormônios equilibrados + treino estratégico." },
      { type: "problem", text: "Jejum + dieta ruim = perda de músculo." },
      { type: "solution", text: "O contexto define se funciona ou destrói." },
    ],
    cta: "Quer usar isso do jeito certo?",
  },
  {
    id: "diabetes",
    icon: ShieldAlert,
    accentColor: G.red,
    accentBg: G.redBg,
    tag: "Saúde",
    title: "Diabetes tipo 2 começa muito antes do diagnóstico.",
    subheadline: "Você não \"descobre\"… você constrói.",
    cards: [
      { type: "problem", text: "Resistência à insulina silenciosa" },
      { type: "problem", text: "Acúmulo de gordura visceral" },
      { type: "problem", text: "Inflamação crônica ignorada" },
      { type: "error", text: "Não é só açúcar. É estilo de vida." },
      { type: "solution", text: "Treino + dieta + controle metabólico" },
    ],
    cta: "Prevenir é mais fácil que remediar",
  },
  {
    id: "vitd",
    icon: Sun,
    accentColor: G.yellow,
    accentBg: G.yellowBg,
    tag: "Integrativa",
    title: "Vitamina D não é vitamina. É HORMÔNIO.",
    subheadline: "Afeta imunidade, testosterona, humor e metabolismo.",
    cards: [
      { type: "truth", text: "D3 regula mais de 200 genes no corpo humano." },
      { type: "error", text: "\"Só tomar sol resolve\" — nem sempre." },
      { type: "solution", text: "Exame → ajuste de dose → estratégia individual." },
    ],
    cta: "Descubra seus níveis reais",
  },
  {
    id: "b12",
    icon: Zap,
    accentColor: G.purple,
    accentBg: G.purpleBg,
    tag: "Nutrição",
    title: "Cansaço constante pode ser deficiência de B12.",
    subheadline: "Sintomas ignorados: fadiga, falta de foco, desânimo.",
    cards: [
      { type: "problem", text: "Você trata como preguiça o que é deficiência." },
      { type: "truth", text: "Seu corpo pode estar sem combustível real." },
      { type: "solution", text: "Avalie isso antes de se culpar." },
    ],
    cta: "Avalie seus níveis agora",
  },
  {
    id: "exames",
    icon: BarChart3,
    accentColor: G.accent,
    accentBg: G.accentBg,
    tag: "Diagnóstico",
    title: "Você não melhora o que não mede.",
    subheadline: "Treinar e fazer dieta sem exame é tentativa e erro.",
    cards: [
      { type: "truth", text: "Hormônios, vitaminas, inflamação, metabolismo." },
      { type: "truth", text: "O exame mostra o que o espelho esconde." },
      { type: "solution", text: "Painel completo ST&H — leitura estratégica." },
    ],
    cta: "Solicitar painel completo",
  },
  {
    id: "mentiras",
    icon: Brain,
    accentColor: G.red,
    accentBg: G.redBg,
    tag: "Mindset",
    title: "As mentiras que estão travando seu resultado.",
    subheadline: "O maior obstáculo não é o treino. É o que você acredita.",
    cards: [
      { type: "error", text: "\"Só dieta resolve\" — NÃO." },
      { type: "error", text: "\"Só treino resolve\" — NÃO." },
      { type: "error", text: "\"Hormônio é milagre\" — NÃO." },
      { type: "error", text: "\"Déficit eterno funciona\" — NÃO." },
      { type: "truth", text: "Resultado vem da combinação estratégica." },
    ],
    cta: "Pare de tentar sozinho",
  },
];

const typeConfig: Record<string, { label: string; color: string }> = {
  problem: { label: "DOR", color: G.red },
  error: { label: "ERRO", color: G.orange },
  truth: { label: "VERDADE", color: G.accent },
  solution: { label: "SOLUÇÃO", color: G.blue },
  action: { label: "AÇÃO", color: G.yellow },
};

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20estrategico%20e%20quero%20saber%20mais";

const InsightCarousel = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cardIdx, setCardIdx] = useState(0);

  const expanded = topics.find((t) => t.id === expandedId);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setCardIdx(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: G.accent }}>
          Dicas Estratégicas
        </p>
        <h2 className="text-lg font-bold tracking-tight" style={{ color: G.t96 }}>
          Conteúdo que transforma
        </h2>
        <p className="text-xs" style={{ color: G.t50 }}>
          {topics.length} temas essenciais para quem leva resultado a sério.
        </p>
      </div>

      {/* Topic list */}
      <div className="space-y-2.5">
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isExpanded = expandedId === topic.id;

          return (
            <motion.div key={topic.id} layout className="space-y-0">
              {/* Topic row */}
              <motion.button
                layout
                onClick={() => toggleExpand(topic.id)}
                className="w-full rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
                style={{
                  background: isExpanded ? topic.accentBg : G.card,
                  border: `0.5px solid ${isExpanded ? topic.accentColor + "33" : G.border}`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: topic.accentBg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: topic.accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: topic.accentColor }}>
                      {topic.tag}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold truncate" style={{ color: G.t96 }}>
                    {topic.title}
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 transition-transform"
                  style={{
                    color: G.t40,
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                />
              </motion.button>

              {/* Expanded cards */}
              <AnimatePresence>
                {isExpanded && expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-1 space-y-3">
                      {/* Subheadline */}
                      <p className="text-xs leading-relaxed px-1" style={{ color: G.t65 }}>
                        {expanded.subheadline}
                      </p>

                      {/* Card carousel */}
                      <div className="relative">
                        <div
                          className="rounded-xl p-4 space-y-3"
                          style={{ background: G.card, border: `0.5px solid ${G.border}` }}
                        >
                          {/* Card type badge */}
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
                              style={{
                                color: typeConfig[expanded.cards[cardIdx].type].color,
                                background: typeConfig[expanded.cards[cardIdx].type].color + "15",
                              }}
                            >
                              {typeConfig[expanded.cards[cardIdx].type].label}
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: G.t40 }}>
                              {cardIdx + 1}/{expanded.cards.length}
                            </span>
                          </div>

                          {/* Card content */}
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={cardIdx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.2 }}
                              className="text-sm font-medium leading-relaxed min-h-[48px] flex items-center"
                              style={{ color: G.t80 }}
                            >
                              {expanded.cards[cardIdx].text}
                            </motion.p>
                          </AnimatePresence>

                          {/* Dots */}
                          <div className="flex items-center justify-center gap-1.5">
                            {expanded.cards.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCardIdx(i)}
                                className="rounded-full transition-all"
                                style={{
                                  width: i === cardIdx ? 16 : 6,
                                  height: 6,
                                  background: i === cardIdx ? expanded.accentColor : G.t30,
                                }}
                              />
                            ))}
                          </div>

                          {/* Nav arrows */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setCardIdx(Math.max(0, cardIdx - 1))}
                              disabled={cardIdx === 0}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
                              style={{ background: G.t10 }}
                            >
                              <ChevronLeft className="w-4 h-4" style={{ color: G.t65 }} />
                            </button>

                            {cardIdx === expanded.cards.length - 1 ? (
                              <motion.a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                  background: expanded.accentColor,
                                  color: "hsl(0 0% 100%)",
                                }}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {expanded.cta}
                              </motion.a>
                            ) : (
                              <button
                                onClick={() => setCardIdx(Math.min(expanded.cards.length - 1, cardIdx + 1))}
                                className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-medium"
                                style={{ background: G.t10, color: G.t65 }}
                              >
                                Próximo
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCarousel;
