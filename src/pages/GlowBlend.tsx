import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  Sparkles, Microscope, FlaskConical, Activity, Shield,
  Wand2, Layers, Clock, AlertTriangle, BookOpen, Star,
  Heart, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-glow-hero.jpg";
import trioImg from "@/assets/sthnews-glow-trio.jpg";
import collagenImg from "@/assets/sthnews-glow-collagen.jpg";
import skinImg from "@/assets/sthnews-glow-skin.jpg";
import recoveryImg from "@/assets/sthnews-glow-recovery.jpg";
import synergyImg from "@/assets/sthnews-glow-synergy.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const GlowBlend = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const backLabel = isStudent ? "Início" : "STH News";
  const BackIcon = isStudent ? Home : ArrowLeft;

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-12 flex items-center justify-between">
            <Link to={backTo} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <BackIcon className="w-3.5 h-3.5" /> {backLabel}
            </Link>
            <div className="flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black tracking-[0.2em] text-foreground uppercase">STH News</span>
            </div>
            {isStudent ? (
              <Link to="/dashboard">
                <Button size="sm" variant="ghost" className="text-[10px] px-3 h-7 rounded-full font-bold">Voltar</Button>
              </Link>
            ) : (
              <Link to="/cadastro">
                <Button size="sm" className="gradient-bg text-primary-foreground text-[10px] px-3 h-7 rounded-full font-bold">Começar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        {/* Tag */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
          <span className="text-[10px] text-muted-foreground">{today} · STH News · Estética & Longevidade</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          ✨ Glow Blend:{" "}
          <span className="gradient-text">o trio de peptídeos que regenera, repara e faz o corpo brilhar</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Não é mais uma "moda da estética". É um protocolo de <strong className="text-foreground">modulação regenerativa</strong> que une BPC-157, TB-500 e GHK-Cu para reparar tecido, acelerar recuperação e revelar a pele que vive por baixo do desgaste.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Frasco premium do Glow Blend com líquido cobre dourado" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">GLOW BLEND · Regeneração sistêmica</span>
            <p className="text-sm font-bold text-foreground">Reparar por dentro. Brilhar por fora.</p>
          </div>
        </motion.div>

        {/* INTRO — Mentalidade */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Antes de começar</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              O Glow Blend é um <strong className="gradient-text">catalisador</strong>. Ele potencializa o que você já constrói — mas <strong className="text-foreground">treino intenso, nutrição inteligente e constância</strong> seguem sendo o motor do seu corpo. Este blend atua exatamente onde o seu esforço encontra o limite biológico, ajudando o corpo a se reparar, renovar e brilhar.
            </p>
          </motion.div>
        </motion.section>

        {/* COMPOSIÇÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">A Composição · Trio de Ouro</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Três dos peptídeos mais estudados em <strong className="text-foreground">longevidade e medicina regenerativa</strong>. Cada um com função específica — juntos formam um ecossistema de cura.
          </motion.p>

          {/* Imagem trio */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={trioImg} alt="Trio de frascos: BPC-157, TB-500 e GHK-Cu" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          {/* BPC-157 */}
          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">01 · Arquiteto</p>
                <h3 className="text-base font-bold text-foreground">BPC-157</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O <em>Body Protection Compound</em> é o mensageiro que o corpo usa para responder a lesões. Ele <strong className="text-foreground">organiza a obra</strong>: reduz a inflamação sistêmica e acelera a cicatrização de tecidos moles — tendões, ligamentos e mucosa intestinal — criando um ambiente onde o reparo celular vira prioridade.
            </p>
          </motion.div>

          {/* TB-500 */}
          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500">02 · Mobilizador</p>
                <h3 className="text-base font-bold text-foreground">TB-500 (Timosina Beta-4)</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se o BPC-157 planeja, a Timosina Beta-4 <strong className="text-foreground">executa</strong>. Especialista em mobilizar células regenerativas e promover angiogênese — a criação de novos vasos sanguíneos. Garante que nutrientes e oxigênio cheguem nas áreas certas, encurtando drasticamente o tempo de recuperação após treinos intensos ou microlesões.
            </p>
          </motion.div>

          {/* GHK-Cu */}
          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">03 · Escultor</p>
                <h3 className="text-base font-bold text-foreground">GHK-Cu (Tripeptídeo de Cobre)</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O componente que dá nome ao blend. Mestre da <strong className="text-foreground">remodelação dérmica</strong>: atua na matriz extracelular, sinaliza aos fibroblastos para produzirem colágeno e elastina de alta qualidade. É ele que transforma reparação celular em estética visível — textura aveludada, tom uniforme e o brilho característico de uma pele rejuvenescida.
            </p>
          </motion.div>
        </motion.section>

        {/* COLLAGEN visualization */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl overflow-hidden border border-primary/20 mb-3 aspect-[16/10] bg-muted relative">
            <img src={collagenImg} alt="Visualização microscópica de fibras de colágeno regenerando" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Visão microscópica</span>
              <p className="text-sm font-bold text-foreground">Colágeno e elastina sendo reconstruídos pelo cobre peptídico.</p>
            </div>
          </motion.div>
        </motion.section>

        {/* SINERGIA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">A Sinergia · Como se conectam</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A verdadeira mágica não está nos peptídeos isolados — está na <strong className="text-foreground">orquestração biológica</strong> entre eles.
          </motion.p>

          {/* Imagem sinergia */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={synergyImg} alt="Visualização abstrata da sinergia entre os três peptídeos" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded tracking-wider">FASE 01</span>
                <h3 className="text-sm font-bold text-foreground">Limpeza e Preparo</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">BPC-157</strong> estabiliza o ambiente, reduz a inflamação de base e permite que o corpo pare de "lutar" contra lesões e desgastes crônicos.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black bg-cyan-500/15 text-cyan-500 px-2 py-0.5 rounded tracking-wider">FASE 02</span>
                <h3 className="text-sm font-bold text-foreground">Transporte e Construção</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">TB-500</strong> aumenta o fluxo de reparo: o tecido em regeneração recebe energia, oxigênio e nutrientes para se reconstruir forte.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded tracking-wider">FASE 03</span>
                <h3 className="text-sm font-bold text-foreground">Remodelação e Estética</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O <strong className="text-foreground">GHK-Cu</strong> faz o acabamento: organiza estruturalmente o tecido novo, dá firmeza, viço — e instala o efeito "Glow".
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground leading-relaxed text-center">
              <strong className="text-primary">Inflamação controlada</strong> → <strong className="text-primary">reparo celular acelerado</strong> → <strong className="text-primary">estrutura tecidual renovada</strong>.
            </p>
          </motion.div>
        </motion.section>

        {/* BENEFÍCIOS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Benefícios e Aplicações</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Imagem skin */}
          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted relative">
            <img src={skinImg} alt="Pele luminosa e saudável após protocolo regenerativo" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm font-bold text-foreground">O efeito "Glow" é o ápice de um corpo cuidado por dentro.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Alta performance</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Redução drástica do downtime entre sessões intensas de treino.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Vitalidade GI</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Otimização da absorção de nutrientes — base essencial para hipertrofia.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Estética avançada</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Pele com qualidade superior, cicatrização rápida e viço natural por renovação do colágeno.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Saúde articular</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Conforto e mobilidade para quem treina pesado — proteção das estruturas que sustentam massa.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* TEMPO DE RESPOSTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Frequência & Tempo de Resposta</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Imagem recovery */}
          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={recoveryImg} alt="Atleta em recuperação demonstrando vitalidade" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <h3 className="text-sm font-bold text-foreground mb-2">Frequência</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Aplicação pensada para uma rotina constante, focada na <strong className="text-foreground">estabilidade dos níveis séricos</strong>. A consistência é o que diferencia quem apenas <em>tenta</em> de quem <em>transforma</em>.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Tempo de resposta</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Os primeiros sinais — mais disposição, menos dor articular — costumam surgir nas <strong className="text-foreground">primeiras semanas</strong>. As mudanças na qualidade da pele e na remodelação tecidual profunda são <strong className="text-foreground">cumulativas</strong>: o efeito "Glow" é o ápice de um corpo cuidado por dentro durante semanas e meses.
            </p>
          </motion.div>
        </motion.section>

        {/* SAFETY */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Dica de Especialista · Origem importa</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              Como todo protocolo de alta performance, a <strong className="text-destructive">qualidade da fonte é determinante</strong>. Peptídeos de pureza questionável não entregam a sinergia descrita acima — e podem causar reações inflamatórias indesejadas. Origem idônea, manipulação segura e acompanhamento são inegociáveis.
            </p>
          </motion.div>
        </motion.section>

        {/* INSIGHT */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ Insight Brutal</p>
            <p className="text-sm text-foreground leading-relaxed">
              Beleza real não nasce da rotina cosmética — nasce da <strong className="gradient-text">saúde celular</strong>. Quando você sinaliza ao seu corpo que regeneração é prioridade, ele responde com pele, performance e longevidade que nenhuma vitrine consegue replicar.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-3 leading-tight">
              Eleve o padrão. <br />
              Ative o seu <span className="gradient-text">Glow</span>.
            </h2>
            <p className="text-xs text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
              Quer integrar o Glow Blend ao seu protocolo de forma estratégica, segura e com acompanhamento clínico? Comece sua otimização sistêmica hoje.
            </p>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl cta-glow">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20o%20Glow%20Blend%20e%20quero%20entender%20como%20aplicar%20com%20seguran%C3%A7a."
                target="_blank" rel="noopener noreferrer" className="w-full"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl cta-glow-soft">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.section>

        {/* Notas */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Notas técnicas</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Pickart & Margolina</p>
              <p><em>GHK-Cu and tissue regeneration.</em> — Revisão clássica sobre o tripeptídeo de cobre e seu papel na remodelação dérmica e produção de colágeno.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Sikiric et al.</p>
              <p><em>Body Protection Compound (BPC-157): pleiotropic effects on healing.</em> — Estudos sobre cicatrização de tendões, ligamentos e mucosa intestinal.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Goldstein et al.</p>
              <p><em>Thymosin Beta-4: cell migration and angiogenesis.</em> — Mecanismos do TB-500 na regeneração tecidual e formação de novos vasos.</p>
            </div>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl bg-muted/30 border border-border/40 p-4 mb-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            <strong className="text-foreground">Nota:</strong> Conteúdo de finalidade informativa técnica. Qualquer uso de peptídeos deve ser orientado e acompanhado por profissional habilitado, alinhado ao protocolo clínico individual e a normas de segurança biológica.
          </p>
        </motion.div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">STH News — Informação que transforma</p>
          <p className="text-[9px] text-muted-foreground/30">Consultoria Estratégica em Saúde & Performance</p>
        </div>
      </main>
    </div>
  );
};

export default GlowBlend;
