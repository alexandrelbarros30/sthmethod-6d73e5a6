import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Shield, Zap, Lock, Unlock, Award, MessageCircle } from "lucide-react";
import { families, TOTAL_COMPOUNDS, type Family } from "@/components/student/content/compoundData";
import { supabase } from "@/integrations/supabase/client";
import FamilyCard from "@/components/student/content/FamilyCard";
import CompoundDetail from "@/components/student/content/CompoundDetail";
import InsightCarousel from "@/components/student/content/InsightCarousel";
import CombinationsSection from "@/components/student/content/CombinationsSection";
import ContentHubCards, { type ContentSection } from "@/components/student/content/ContentHubCards";
import { useNavigate } from "react-router-dom";

const G = {
  accent: "hsl(145 60% 42%)",
  accentSoft: "hsl(145 50% 55%)",
  accentBg: "hsl(145 60% 42% / 0.12)",
  accentBorderSoft: "hsl(145 60% 42% / 0.2)",
  accentGlow: "hsl(145 60% 42% / 0.25)",
  accentText06: "hsl(145 60% 42% / 0.06)",
  accentText15: "hsl(145 60% 42% / 0.15)",
  bg: "hsl(0 0% 3%)",
  card: "hsl(0 0% 6%)",
  border: "hsl(0 0% 14%)",
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

const gamificationMessages = [
  { min: 5, icon: Brain, text: "Você já está à frente da maioria." },
  { min: 10, icon: Shield, text: "Agora começa o nível estratégico." },
  { min: 13, icon: Zap, text: "A maioria erra na condução aqui." },
];

const whatsappUrl =
  "https://wa.me/5521998496289?text=Fala,%20vi%20o%20conteudo%20sobre%20hormonios%20e%20quero%20ajustar%20meu%20protocolo";

const StudentContent = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<ContentSection | null>(null);
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const progress = visited.size;

  useEffect(() => {
    supabase.from("landing_settings").select("value").eq("key", "logo_url").maybeSingle()
      .then(({ data }) => { if (data?.value) setLogoUrl(data.value); });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedCompound(id);
    setVisited((prev) => new Set(prev).add(id));
  }, []);

  const handleFamilyClick = (family: Family) => {
    setActiveFamily(family);
    setSelectedCompound(null);
  };

  const handleBack = () => {
    if (activeFamily) {
      setActiveFamily(null);
      setSelectedCompound(null);
    } else {
      setSection(null);
    }
  };

  const handleNavigate = (s: ContentSection) => {
    if (s === "receitas") {
      navigate("/dashboard/recipes");
      return;
    }
    setSection(s);
  };

  const getFamilyVisitedCount = (family: Family) =>
    family.compounds.filter((c) => visited.has(c.id)).length;

  // ── Section titles
  const sectionTitle = section === "hormonios" ? "Hormônios e Compostos"
    : section === "dicas" ? "Dicas Estratégicas" : "";

  return (
    <DashboardLayout role="student" title="" subtitle="">
      <div className="min-h-screen -m-4 sm:-m-6 px-4 sm:px-6 py-6 space-y-6 max-w-lg mx-auto" style={{ background: G.bg }}>

        {/* ── HEADER ── */}
        <motion.header
          key={section ?? "hub"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2"
        >
          {/* Logo on hub */}
          {logoUrl && !section && (
            <div className="flex justify-center pb-1">
              <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
            </div>
          )}

          {/* Back button */}
          {(section || activeFamily) ? (
            <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: G.t60 }}>
              <ArrowLeft className="w-4 h-4" />
              {activeFamily ? "Famílias" : "Conteúdo"}
            </button>
          ) : (
            <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: G.accent }}>
              STH Method
            </p>
          )}

          <h1 className="text-2xl font-bold tracking-tight" style={{ color: G.t96 }}>
            {activeFamily ? activeFamily.title : (section ? sectionTitle : "Conteúdo")}
          </h1>

          {!section && !activeFamily && (
            <p className="text-sm leading-relaxed" style={{ color: G.t50 }}>
              Escolha uma trilha. Cada módulo foi desenhado para entregar clareza e resultado.
            </p>
          )}

          {section === "hormonios" && !activeFamily && (
            <p className="text-sm leading-relaxed" style={{ color: G.t50 }}>
              Entenda cada família. O resultado depende de como o composto é conduzido.
            </p>
          )}

          {activeFamily && (
            <p className="text-sm leading-relaxed" style={{ color: `hsl(${activeFamily.accentHue} 60% 42%)` }}>
              {activeFamily.subheadline}
            </p>
          )}

          {/* Global progress — show in hormonios */}
          {section === "hormonios" && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: G.t45 }}>
                  Progresso: {progress}/{TOTAL_COMPOUNDS} compostos
                </span>
                {progress === TOTAL_COMPOUNDS && (
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
                  animate={{ width: `${(progress / TOTAL_COMPOUNDS) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.header>

        {/* ═══ HUB VIEW ═══ */}
        {!section && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ContentHubCards onNavigate={handleNavigate} />
          </motion.div>
        )}

        {/* ═══ HORMÔNIOS SECTION ═══ */}
        {section === "hormonios" && !activeFamily && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {families.map((family, i) => (
              <FamilyCard
                key={family.id}
                family={family}
                index={i}
                visitedCount={getFamilyVisitedCount(family)}
                onClick={() => handleFamilyClick(family)}
              />
            ))}
          </motion.div>
        )}

        {section === "hormonios" && activeFamily && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: G.card, border: `0.5px solid ${G.border}` }}>
              <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: G.t40 }}>Perfil da família</p>
              <p className="text-sm leading-relaxed" style={{ color: G.t80 }}>{activeFamily.description}</p>
              <p className="text-xs leading-relaxed pt-1" style={{ color: `hsl(${activeFamily.accentHue} 50% 55%)` }}>
                {activeFamily.profile}
              </p>
            </div>
            <CompoundDetail
              family={activeFamily}
              selected={selectedCompound}
              visited={visited}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {/* ═══ DICAS SECTION ═══ */}
        {section === "dicas" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InsightCarousel />
          </motion.div>
        )}

        {/* ── GAMIFICATION (hormônios) ── */}
        {section === "hormonios" && (
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
                    <p className="text-sm font-medium" style={{ color: G.accentSoft }}>{gm.text}</p>
                  </motion.div>
                )
            )}
          </div>
        )}

        {/* ── LOCKED / UNLOCKED (hormônios) ── */}
        {section === "hormonios" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl p-5 space-y-3 overflow-hidden"
            style={{ background: G.card, border: `0.5px solid ${G.border}` }}
          >
            {progress < TOTAL_COMPOUNDS && (
              <div
                className="absolute inset-0 z-10 backdrop-blur-md flex flex-col items-center justify-center gap-3"
                style={{ background: "hsl(0 0% 3% / 0.7)" }}
              >
                <Lock className="w-6 h-6" style={{ color: G.t30 }} />
                <p className="text-xs font-medium text-center" style={{ color: G.t40 }}>
                  Explore todos os {TOTAL_COMPOUNDS} compostos para desbloquear
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {progress === TOTAL_COMPOUNDS ? (
                <Unlock className="w-4 h-4" style={{ color: G.accent }} />
              ) : (
                <Lock className="w-4 h-4" style={{ color: G.t30 }} />
              )}
              <h3 className="text-base font-semibold" style={{ color: G.t92 }}>Nível Avançado STH</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: G.t55 }}>
              Combinação de compostos, ajuste fino e controle real de resultado.
            </p>
            {progress === TOTAL_COMPOUNDS && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: G.accent }} />
                  <p className="text-xs font-semibold" style={{ color: G.accent }}>Conteúdo desbloqueado!</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: G.t65 }}>
                  A combinação de compostos exige leitura de meia-vida, janela de aplicação e controle de aromatização. O protocolo inteligente considera não apenas o composto, mas o contexto metabólico individual.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── CTA (always visible inside a section) ── */}
        {section && (
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
            <h3 className="text-lg font-bold" style={{ color: G.t96 }}>Não é o composto que define o resultado.</h3>
            <p className="text-sm" style={{ color: G.t50 }}>É a estratégia, o contexto e o acompanhamento.</p>
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
        )}

        <div className="h-20" />
      </div>
    </DashboardLayout>
  );
};

export default StudentContent;
