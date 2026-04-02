import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Unlock, MessageCircle, Zap, Brain, Shield, Award, ChevronRight } from "lucide-react";

import heroImg from "@/assets/content-hero.jpg";
import imgMasteronProp from "@/assets/compound-masteron-prop.jpg";
import imgMasteronEnan from "@/assets/compound-masteron-enan.jpg";
import imgNandrolona from "@/assets/compound-nandrolona.jpg";
import imgGestrinona from "@/assets/compound-gestrinona.jpg";
import imgOxandrolona from "@/assets/compound-oxandrolona.jpg";

/* ── Colors ── */
const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.12)",
  accentBorder: "hsl(145 60% 42% / 0.4)",
  accentBorderSoft: "hsl(145 60% 42% / 0.2)",
  accentGlow: "hsl(145 60% 42% / 0.25)",
  accentText06: "hsl(145 60% 42% / 0.06)",
  accentText15: "hsl(145 60% 42% / 0.15)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
  borderSoft: "hsl(0 0% 12%)",
  t96: "hsl(0 0% 96%)",
  t92: "hsl(0 0% 92%)",
  t80: "hsl(0 0% 80%)",
  t65: "hsl(0 0% 65%)",
  t60: "hsl(0 0% 60%)",
  t55: "hsl(0 0% 55%)",
  t50: "hsl(0 0% 50%)",
  t45: "hsl(0 0% 45%)",
  t40: "hsl(0 0% 40%)",
  t35: "hsl(0 0% 35%)",
  t30: "hsl(0 0% 30%)",
  t10: "hsl(0 0% 10%)",
};

/* ── Compound Data ── */
const compounds = [
  {
    id: "masteron-prop",
    name: "Masteron P.",
    tag: "Seco",
    image: imgMasteronProp,
    essencia: "Derivado com ação mais rápida e perfil seco.",
    oQueFaz: "Atua na densidade muscular e estética.",
    comoEntra: "Aplicação intramuscular rápida.",
    comoSeComporta: "Resposta ágil com necessidade de maior frequência.",
    atencao: "Exige controle e acompanhamento.",
    resumo: "Rápido e sensível a ajustes.",
  },
  {
    id: "masteron-enan",
    name: "Masteron E.",
    tag: "Estável",
    image: imgMasteronEnan,
    essencia: "Versão mais estável da drostanolona.",
    oQueFaz: "Contribui para densidade e estética com estabilidade.",
    comoEntra: "Aplicação intramuscular prolongada.",
    comoSeComporta: "Resposta mais linear.",
    atencao: "Exige estratégia.",
    resumo: "Estabilidade com controle.",
  },
  {
    id: "nandrolona",
    name: "Nandrolona",
    tag: "Estrutura",
    image: imgNandrolona,
    essencia: "Forte ação anabólica e suporte estrutural.",
    oQueFaz: "Auxilia recuperação e articulações.",
    comoEntra: "Aplicação intramuscular prolongada.",
    comoSeComporta: "Ação duradoura e acumulativa.",
    atencao: "Impacto hormonal relevante.",
    resumo: "Eficiência com necessidade de precisão.",
  },
  {
    id: "gestrinona",
    name: "Gestrinona",
    tag: "Controle",
    image: imgGestrinona,
    essencia: "Atua no controle do ambiente hormonal.",
    oQueFaz: "Modulação hormonal e composição corporal.",
    comoEntra: "Oral ou transdérmico.",
    comoSeComporta: "Resposta dependente do contexto individual.",
    atencao: "Necessita acompanhamento profissional.",
    resumo: "Controle exige estratégia.",
  },
  {
    id: "oxandrolona",
    name: "Oxandrolona",
    tag: "Definição",
    image: imgOxandrolona,
    essencia: "Perfil controlado com foco em definição.",
    oQueFaz: "Auxilia definição e manutenção muscular.",
    comoEntra: "Administração oral.",
    comoSeComporta: "Resposta progressiva.",
    atencao: "Controle hepático necessário.",
    resumo: "Previsível, mas exige cuidado.",
  },
];

const gamificationMessages = [
  { min: 2, icon: Brain, text: "Você já está à frente da maioria." },
  { min: 3, icon: Shield, text: "Agora começa o nível estratégico." },
  { min: 4, icon: Zap, text: "A maioria erra na condução aqui." },
];

const cardFields = [
  { key: "essencia", label: "Essência" },
  { key: "oQueFaz", label: "O que faz" },
  { key: "comoEntra", label: "Como entra no corpo" },
  { key: "comoSeComporta", label: "Como se comporta" },
  { key: "atencao", label: "Pontos de atenção" },
  { key: "resumo", label: "Resumo STM" },
] as const;

const StudentContent = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const progress = visited.size;
  const compound = compounds.find((c) => c.id === selected);

  const handleSelect = useCallback((id: string) => {
    setSelected(id);
    setVisited((prev) => new Set(prev).add(id));
  }, []);

  const whatsappUrl =
    "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20sobre%20hormonios%20e%20quero%20ajustar%20meu%20protocolo";

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <div
        className="min-h-screen -m-4 sm:-m-6 px-4 sm:px-6 py-6 space-y-8 max-w-lg mx-auto"
        style={{ background: G.bg }}
      >
        {/* ── HEADER ── */}
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
          <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: G.accent }}>
            STM Method
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: G.t96 }}>
            Hormônios e Compostos
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: G.t50 }}>
            Cada composto tem um comportamento. O resultado depende de como ele é conduzido.
          </p>

          {/* Progress */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: G.t45 }}>
                Progresso: {progress}/5 compostos
              </span>
              {progress === 5 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs font-semibold" style={{ color: G.accent }}>
                  ✓ Completo
                </motion.span>
              )}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: G.t10 }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${G.accent}, ${G.accentSoft})` }}
                initial={{ width: 0 }}
                animate={{ width: `${(progress / 5) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.header>

        {/* ── HERO VISUAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden relative"
          style={{ border: `0.5px solid ${G.border}` }}
        >
          <img src={heroImg} alt="STM Method" className="w-full h-56 object-cover" width={800} height={512} />
          <div
            className="absolute inset-0 flex flex-col justify-end p-5 space-y-2"
            style={{ background: "linear-gradient(to top, hsl(0 0% 3% / 0.92), hsl(0 0% 3% / 0.3))" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: G.t92 }}>
              Entenda com clareza
            </h2>
            <ul className="space-y-1.5">
              {["o que faz no corpo", "como se comporta", "onde exige atenção", "impacto no resultado"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: G.t60 }}>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: G.accent }} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[11px] pt-1" style={{ color: G.t35 }}>
              Leitura rápida. Interpretação estratégica.
            </p>
          </div>
        </motion.div>

        {/* ── HORIZONTAL SELECTOR ── */}
        <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
          {compounds.map((c, i) => {
            const isSelected = selected === c.id;
            const isVisited = visited.has(c.id);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(c.id)}
                className="snap-center flex-shrink-0 rounded-xl px-4 py-3 flex flex-col items-center gap-1 min-w-[100px] transition-all duration-200"
                style={{
                  background: isSelected ? G.accentBg : G.card,
                  border: isSelected ? `1px solid ${G.accentBorder}` : `0.5px solid ${G.border}`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: isSelected ? G.accent : G.t80 }}>
                    {c.name}
                  </span>
                  {isVisited && !isSelected && <Check className="w-3 h-3" style={{ color: "hsl(142 60% 40%)" }} />}
                </div>
                <span className="text-[10px] whitespace-nowrap" style={{ color: G.t45 }}>
                  {c.tag}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ── DYNAMIC CONTENT ── */}
        <AnimatePresence mode="wait">
          {compound && (
            <motion.div
              key={compound.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Compound Image */}
              <div className="rounded-xl overflow-hidden relative" style={{ border: `0.5px solid ${G.border}` }}>
                <img
                  src={compound.image}
                  alt={compound.name}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                  width={800}
                  height={512}
                />
                <div
                  className="absolute inset-0 flex items-end p-4"
                  style={{ background: "linear-gradient(to top, hsl(0 0% 3% / 0.85), transparent 60%)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold" style={{ color: G.t96 }}>
                      {compound.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: G.accentBg, color: G.accent, border: `0.5px solid ${G.accentBorderSoft}` }}
                    >
                      {compound.tag}
                    </span>
                  </div>
                </div>
              </div>

              {cardFields.map((field, i) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 space-y-1.5"
                  style={{
                    background: field.key === "resumo" ? G.accentText06 : G.card,
                    border: field.key === "resumo" ? `0.5px solid ${G.accentBorderSoft}` : `0.5px solid ${G.borderSoft}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase tracking-widest font-medium"
                    style={{ color: field.key === "resumo" ? G.accent : G.t40 }}
                  >
                    {field.label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: G.t80 }}>
                    {compound[field.key]}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GAMIFICATION CARDS ── */}
        <div className="space-y-3">
          {gamificationMessages.map(
            (gm) =>
              progress >= gm.min && (
                <motion.div
                  key={gm.min}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: G.accentText06, border: `0.5px solid ${G.accentText15}` }}
                >
                  <gm.icon className="w-5 h-5 flex-shrink-0" style={{ color: G.accent }} />
                  <p className="text-sm font-medium" style={{ color: G.accentSoft }}>
                    {gm.text}
                  </p>
                </motion.div>
              )
          )}
        </div>

        {/* ── LOCKED / UNLOCKED CARD ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-2xl p-5 space-y-3 overflow-hidden"
          style={{ background: G.card, border: `0.5px solid ${G.border}` }}
        >
          {progress < 5 && (
            <div
              className="absolute inset-0 z-10 backdrop-blur-md flex flex-col items-center justify-center gap-3"
              style={{ background: "hsl(0 0% 3% / 0.7)" }}
            >
              <Lock className="w-6 h-6" style={{ color: G.t30 }} />
              <p className="text-xs font-medium" style={{ color: G.t40 }}>
                Explore todos os 5 compostos para desbloquear
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {progress === 5 ? (
              <Unlock className="w-4 h-4" style={{ color: G.accent }} />
            ) : (
              <Lock className="w-4 h-4" style={{ color: G.t30 }} />
            )}
            <h3 className="text-base font-semibold" style={{ color: G.t92 }}>
              Nível Avançado STM
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: G.t55 }}>
            Combinação de compostos, ajuste fino e controle real de resultado.
          </p>
          {progress === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: G.accent }} />
                <p className="text-xs font-semibold" style={{ color: G.accent }}>
                  Conteúdo desbloqueado!
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: G.t65 }}>
                A combinação de compostos exige leitura de meia-vida, janela de aplicação e controle de aromatização. O protocolo inteligente considera não apenas o composto, mas o contexto metabólico individual — sensibilidade estrogênica, perfil lipídico e resposta hepática. É aqui que o ajuste fino separa resultados medianos de resultados de elite.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ── FINAL CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 text-center space-y-4"
          style={{
            background: `linear-gradient(160deg, ${G.accentText06}, ${G.card})`,
            border: `0.5px solid ${G.accentBorderSoft}`,
          }}
        >
          <h3 className="text-lg font-bold" style={{ color: G.t96 }}>
            Não é o composto isolado que define o resultado.
          </h3>
          <p className="text-sm" style={{ color: G.t50 }}>
            É a estratégia, o contexto e o acompanhamento.
          </p>
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: `linear-gradient(135deg, ${G.accent}, hsl(150 55% 32%))`,
              color: "hsl(0 0% 100%)",
              boxShadow: `0 4px 20px ${G.accentGlow}`,
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Solicitar ajuste de protocolo
          </motion.a>
        </motion.div>

        <div className="h-20" />
      </div>
    </DashboardLayout>
  );
};

export default StudentContent;
