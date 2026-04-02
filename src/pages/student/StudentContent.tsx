import { useState, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Unlock, MessageCircle, Zap, Brain, Shield, Award, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/* ── Compound Data ── */
const compounds = [
  {
    id: "enantato",
    name: "Enantato",
    tag: "Estável",
    essencia: "Éster de liberação gradual e perfil estável.",
    oQueFaz: "Favorece manutenção hormonal, recuperação e suporte à massa muscular.",
    comoEntra: "Aplicação intramuscular com liberação lenta.",
    comoSeComporta: "Resposta previsível ao longo dos dias.",
    atencao: "Pode causar retenção, acne e aromatização.",
    resumo: "Estabilidade e leitura mais limpa do protocolo.",
  },
  {
    id: "cipionato",
    name: "Cipionato",
    tag: "Consistente",
    essencia: "Forma de ação prolongada e comportamento consistente.",
    oQueFaz: "Atua na força, recuperação e síntese proteica.",
    comoEntra: "Aplicação intramuscular lenta.",
    comoSeComporta: "Mantém níveis relativamente estáveis.",
    atencao: "Pode gerar retenção e elevação estrogênica.",
    resumo: "Consistência é o principal valor.",
  },
  {
    id: "propionato",
    name: "Propionato",
    tag: "Rápido",
    essencia: "Éster de ação curta e resposta rápida.",
    oQueFaz: "Favorece ação mais ágil no organismo.",
    comoEntra: "Absorção intramuscular rápida.",
    comoSeComporta: "Exige aplicações mais frequentes.",
    atencao: "Pode causar irritação local e mais variação hormonal.",
    resumo: "Rápido, porém menos estável.",
  },
  {
    id: "durateston",
    name: "Durateston",
    tag: "Misto",
    essencia: "Blend de testosteronas com tempos diferentes de liberação.",
    oQueFaz: "Combina início mais rápido com sustentação posterior.",
    comoEntra: "Aplicação intramuscular com liberação em fases.",
    comoSeComporta: "Pico inicial seguido de manutenção prolongada.",
    atencao: "Pode oscilar mais e exigir maior controle.",
    resumo: "Entrega velocidade, mas cobra precisão.",
  },
  {
    id: "gel",
    name: "Gel",
    tag: "Diário",
    essencia: "Aplicação transdérmica diária.",
    oQueFaz: "Promove aumento gradual dos níveis hormonais.",
    comoEntra: "Absorção pela pele.",
    comoSeComporta: "Níveis mais lineares dependendo da absorção.",
    atencao: "Absorção variável e risco de transferência por contato.",
    resumo: "Praticidade com dependência da absorção individual.",
  },
];

const gamificationMessages = [
  { min: 2, icon: Brain, text: "Você já entende mais que a maioria." },
  { min: 3, icon: Shield, text: "Agora começa o nível estratégico." },
  { min: 4, icon: Zap, text: "A maioria erra aqui." },
];

const cardFields = [
  { key: "essencia", label: "Essência" },
  { key: "oQueFaz", label: "O que faz" },
  { key: "comoEntra", label: "Como entra no corpo" },
  { key: "comoSeComporta", label: "Como se comporta" },
  { key: "atencao", label: "Pontos de atenção" },
  { key: "resumo", label: "Resumo ST&H" },
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
    "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20sobre%20testosteronas%20e%20quero%20ajustar%20meu%20protocolo";

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <div className="min-h-screen -m-4 sm:-m-6 px-4 sm:px-6 py-6 space-y-8 max-w-lg mx-auto"
        style={{ background: "hsl(0 0% 3%)" }}>

        {/* ── HEADER ── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] font-medium"
            style={{ color: "hsl(42 70% 50%)" }}>
            ST&H Education
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "hsl(0 0% 96%)" }}>
            Testosteronas
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 50%)" }}>
            Cada versão tem um ritmo. O resultado depende de saber ler esse ritmo.
          </p>

          {/* Progress */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "hsl(0 0% 45%)" }}>
                Progresso: {progress}/5 compostos
              </span>
              {progress === 5 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-semibold"
                  style={{ color: "hsl(42 70% 50%)" }}
                >
                  ✓ Completo
                </motion.span>
              )}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(42 70% 50%), hsl(42 60% 65%))" }}
                initial={{ width: 0 }}
                animate={{ width: `${(progress / 5) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.header>

        {/* ── HERO CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: "hsl(0 0% 6%)",
            border: "0.5px solid hsl(0 0% 14%)",
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: "hsl(0 0% 92%)" }}>
            Entenda em segundos
          </h2>
          <ul className="space-y-2">
            {["o que faz", "como entra no corpo", "como se comporta", "o que exige de atenção"].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "hsl(0 0% 60%)" }}>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(42 70% 50%)" }} />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] pt-1" style={{ color: "hsl(0 0% 35%)" }}>
            Leitura rápida. Clareza real.
          </p>
        </motion.div>

        {/* ── HORIZONTAL SELECTOR ── */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4"
        >
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
                  background: isSelected ? "hsl(42 70% 50% / 0.12)" : "hsl(0 0% 6%)",
                  border: isSelected
                    ? "1px solid hsl(42 70% 50% / 0.4)"
                    : "0.5px solid hsl(0 0% 14%)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-sm font-medium"
                    style={{ color: isSelected ? "hsl(42 70% 50%)" : "hsl(0 0% 80%)" }}
                  >
                    {c.name}
                  </span>
                  {isVisited && !isSelected && (
                    <Check className="w-3 h-3" style={{ color: "hsl(142 60% 40%)" }} />
                  )}
                </div>
                <span className="text-[10px]" style={{ color: "hsl(0 0% 45%)" }}>
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
              {cardFields.map((field, i) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 space-y-1.5"
                  style={{
                    background: field.key === "resumo" ? "hsl(42 70% 50% / 0.06)" : "hsl(0 0% 6%)",
                    border: field.key === "resumo"
                      ? "0.5px solid hsl(42 70% 50% / 0.2)"
                      : "0.5px solid hsl(0 0% 12%)",
                  }}
                >
                  <p className="text-[11px] uppercase tracking-widest font-medium"
                    style={{ color: field.key === "resumo" ? "hsl(42 70% 50%)" : "hsl(0 0% 40%)" }}>
                    {field.label}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 80%)" }}>
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
                  style={{
                    background: "hsl(42 70% 50% / 0.06)",
                    border: "0.5px solid hsl(42 70% 50% / 0.15)",
                  }}
                >
                  <gm.icon className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(42 70% 50%)" }} />
                  <p className="text-sm font-medium" style={{ color: "hsl(42 60% 65%)" }}>
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
          style={{
            background: "hsl(0 0% 6%)",
            border: "0.5px solid hsl(0 0% 14%)",
          }}
        >
          {progress < 5 && (
            <div
              className="absolute inset-0 z-10 backdrop-blur-md flex flex-col items-center justify-center gap-3"
              style={{ background: "hsl(0 0% 3% / 0.7)" }}
            >
              <Lock className="w-6 h-6" style={{ color: "hsl(0 0% 30%)" }} />
              <p className="text-xs font-medium" style={{ color: "hsl(0 0% 40%)" }}>
                Explore todos os 5 compostos para desbloquear
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {progress === 5 ? (
              <Unlock className="w-4 h-4" style={{ color: "hsl(42 70% 50%)" }} />
            ) : (
              <Lock className="w-4 h-4" style={{ color: "hsl(0 0% 30%)" }} />
            )}
            <h3 className="text-base font-semibold" style={{ color: "hsl(0 0% 92%)" }}>
              Nível Avançado ST&H
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 55%)" }}>
            Ajuste fino de protocolo, combinação de compostos e controle de colaterais.
          </p>
          {progress === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: "hsl(42 70% 50%)" }} />
                <p className="text-xs font-semibold" style={{ color: "hsl(42 70% 50%)" }}>
                  Conteúdo desbloqueado!
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
                A combinação de ésteres exige leitura de meia-vida, janela de aplicação e controle de aromatização. O protocolo inteligente considera não apenas o composto, mas o contexto metabólico individual — sensibilidade estrogênica, perfil lipídico e resposta hepática. É aqui que o ajuste fino separa resultados medianos de resultados de elite.
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
            background: "linear-gradient(160deg, hsl(42 70% 50% / 0.08), hsl(0 0% 6%))",
            border: "0.5px solid hsl(42 70% 50% / 0.2)",
          }}
        >
          <h3 className="text-lg font-bold" style={{ color: "hsl(0 0% 96%)" }}>
            Nome forte não substitui protocolo forte.
          </h3>
          <p className="text-sm" style={{ color: "hsl(0 0% 50%)" }}>
            A substância influencia. A estratégia decide.
          </p>
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, hsl(42 70% 50%), hsl(38 72% 38%))",
              color: "hsl(0 0% 0%)",
              boxShadow: "0 4px 20px hsl(42 70% 50% / 0.25)",
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Solicitar ajuste
          </motion.a>
        </motion.div>

        {/* Bottom spacing for dock */}
        <div className="h-20" />
      </div>
    </DashboardLayout>
  );
};

export default StudentContent;
