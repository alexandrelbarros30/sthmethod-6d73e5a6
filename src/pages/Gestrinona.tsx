import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  Sparkles, FlaskConical, Activity, Shield, Layers,
  Clock, AlertTriangle, BookOpen, Star, Pill, Cpu, Zap, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-gestrinona-hero.jpg";
import capsulasImg from "@/assets/sthnews-gestrinona-capsulas.jpg";
import chipImg from "@/assets/sthnews-gestrinona-chip.jpg";
import densidadeImg from "@/assets/sthnews-gestrinona-densidade.jpg";
import moleculaImg from "@/assets/sthnews-gestrinona-molecula.jpg";
import resultadoImg from "@/assets/sthnews-gestrinona-resultado.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Gestrinona = () => {
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
          <span className="text-[10px] text-muted-foreground">{today} · STH News · Endocrinologia & Estética</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          💊 Gestrinona:{" "}
          <span className="gradient-text">a molécula de tripla ação que redefine densidade, secura e performance</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Da <strong className="text-foreground">cápsula manipulada</strong> ao <strong className="text-foreground">chip subdérmico de liberação contínua</strong>: como a Gestrinona se tornou uma das ferramentas mais sofisticadas da endocrinologia aplicada à composição corporal feminina.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Frasco premium de Gestrinona manipulada com cápsulas douradas" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">GESTRINONA · Endocrinologia aplicada</span>
            <p className="text-sm font-bold text-foreground">Densidade, secura e equilíbrio — em uma única molécula.</p>
          </div>
        </motion.div>

        {/* INTRO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Antes de começar</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              A Gestrinona <strong className="gradient-text">amplifica</strong> — não substitui. Ela cria o ambiente hormonal ideal para que treino sério e nutrição precisa se traduzam em resultado visível. Sem rotina sólida, nenhuma molécula faz milagre. Com rotina sólida, ela faz toda a diferença.
            </p>
          </motion.div>
        </motion.section>

        {/* O QUE É */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">O que é · Molécula de tripla ação</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A Gestrinona (<em>etil-nortestosterona</em>) é um esteroide sintético derivado da <strong className="text-foreground">19-nortestosterona</strong>. Seu diferencial é o perfil farmacológico <strong className="text-foreground">híbrido</strong>: três propriedades operando em sinergia dentro de uma única molécula.
          </motion.p>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={moleculaImg} alt="Visualização molecular da Gestrinona" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">01 · Antiprogestogênica</p>
                  <h3 className="text-base font-bold text-foreground">Modulação da progesterona</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Regula a atividade da progesterona, contribuindo para o controle de quadros como <strong className="text-foreground">endometriose</strong> e ajustando a homeostase hormonal feminina em protocolos estéticos avançados.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">02 · Androgênica</p>
                  <h3 className="text-base font-bold text-foreground">Densidade muscular e força</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aumenta a síntese proteica e a <strong className="text-foreground">qualidade do tecido muscular</strong> — entrega aquele aspecto de músculo cheio, denso e duro que poucas estratégias atingem.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500">03 · Antiestrogênica</p>
                  <h3 className="text-base font-bold text-foreground">Pele colada, sem retenção</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reduz a ação do estrogênio livre — combate <strong className="text-foreground">retenção hídrica</strong> e celulite, revelando o contorno real do músculo construído com esforço.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* FORMAS DE APLICAÇÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Formas de aplicação · Conveniência vs. Constância</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-5 leading-relaxed">
            A administração evoluiu para atender dois perfis: quem busca <strong className="text-foreground">flexibilidade imediata</strong> e quem busca <strong className="text-foreground">estabilidade de elite</strong>.
          </motion.p>

          {/* CÁPSULAS — DESTAQUE */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 mb-4 relative overflow-hidden">
            <span className="absolute top-3 right-3 text-[8px] font-black bg-amber-500 text-background px-2 py-0.5 rounded tracking-wider">DESTAQUE</span>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Forma 01 · Praticidade oral</p>
                <h3 className="text-lg font-bold text-foreground">Cápsulas manipuladas</h3>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-amber-500/20 mb-4 aspect-[16/10] bg-muted">
              <img src={capsulasImg} alt="Cápsulas douradas de Gestrinona manipulada" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              A manipulação em cápsulas oferece a <strong className="text-foreground">flexibilidade</strong> necessária para ajustes frequentes de dose conforme a evolução estética e a resposta individual.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Diferencial:</strong> permite ao médico monitorar a resposta e ajustar o protocolo com precisão clínica.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Ideal para:</strong> quem inicia o protocolo e quer testar a resposta do corpo antes de migrar para opções de longa duração.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Atenção:</strong> exige <em>disciplina absoluta</em> nos horários — a estabilidade metabólica depende dela.</p>
              </div>
            </div>
          </motion.div>

          {/* CHIP */}
          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-card to-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-xl">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500">Forma 02 · Constância de elite</p>
                <h3 className="text-lg font-bold text-foreground">Implante hormonal ("Chip")</h3>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-cyan-500/20 mb-4 aspect-[16/10] bg-muted">
              <img src={chipImg} alt="Chip implante subdérmico de Gestrinona em pinça cirúrgica" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Os implantes subdérmicos de <strong className="text-foreground">liberação lenta</strong> são o padrão-ouro de quem busca performance sem a preocupação da rotina diária — sem picos, sem vales.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Liberação contínua:</strong> níveis hormonais em platô estável, sem oscilações de humor ou inconstância.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Vantagem metabólica:</strong> síntese proteica e oxidação lipídica otimizadas <em>24h por dia</em>.</p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/40">
                <Star className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground"><strong>Para quem busca:</strong> máxima eficiência com mínima interrupção da rotina.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground leading-relaxed text-center">
              <strong className="text-amber-500">Cápsula</strong> = ajuste fino e flexibilidade · <strong className="text-cyan-500">Chip</strong> = estabilidade contínua e zero rotina diária.
            </p>
          </motion.div>
        </motion.section>

        {/* BENEFÍCIOS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Benefícios · Por que se destaca</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted relative">
            <img src={densidadeImg} alt="Costas femininas musculares destacando densidade e definição" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Densidade real</span>
              <p className="text-sm font-bold text-foreground">Músculo cheio, pele colada, contorno definido.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Densidade muscular</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Dureza ao tecido que a testosterona pura nem sempre entrega — músculo "mais cheio" e definido.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Gestão de gordura</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Ação antiestrogênica reduz gordura localizada e a retenção crônica de líquidos.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Energia & "drive"</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Aumento de disposição que se traduz em treinos mais produtivos e foco para sustentar a dieta.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Equilíbrio hormonal</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Sensação de bem-estar e estabilidade emocional — base para constância no protocolo.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* TEMPO DE RESPOSTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Resposta & Resultados</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted relative">
            <img src={resultadoImg} alt="Costas femininas com pele radiante mostrando resultado do protocolo" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm font-bold text-foreground">A constância separa o resultado moderado da transformação de elite.</p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              A Gestrinona é um fármaco de <strong className="text-foreground">construção cumulativa</strong>. As primeiras semanas são de adaptação. A partir do <strong className="text-foreground">primeiro mês de constância</strong>, a alteração na composição corporal — ganho de massa magra e redução de gordura subcutânea — começa a se tornar visível no espelho.
            </p>
          </motion.div>
        </motion.section>

        {/* SAFETY */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Pilar de segurança · Monitoramento obrigatório</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-3">
              A Gestrinona é potente — seu uso deve ser <strong className="text-destructive">precedido e acompanhado</strong> por exames laboratoriais rigorosos.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">●</span><strong className="text-foreground">Perfil lipídico:</strong>&nbsp;HDL/LDL — pode reduzir o HDL.</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">●</span><strong className="text-foreground">Saúde hepática:</strong>&nbsp;TGO/TGP — monitoramento contínuo do fígado.</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">●</span><strong className="text-foreground">Hematócrito:</strong>&nbsp;acompanhamento da viscosidade sanguínea.</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">●</span><strong className="text-foreground">Sensibilidade androgênica:</strong>&nbsp;oleosidade, acne, alterações na voz e ciclo menstrual.</li>
            </ul>
          </motion.div>
        </motion.section>

        {/* INSIGHT */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ Insight Brutal</p>
            <p className="text-sm text-foreground leading-relaxed">
              A Gestrinona <strong className="gradient-text">não substitui o esforço — ela amplifica</strong>. O chip ou a cápsula não fazem o trabalho pesado: garantem que o ambiente hormonal esteja otimizado para que o seu trabalho no treino seja <em>recompensado de verdade</em>.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-3 leading-tight">
              Cápsula ou chip? <br />
              <span className="gradient-text">Sua escolha define o ritmo.</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
              Você busca otimização sistêmica e contínua (chip) ou prefere a flexibilidade das cápsulas? Tudo depende do seu estilo de vida e nível de comprometimento. Nossa consultoria te orienta com segurança e estratégia.
            </p>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl cta-glow">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20a%20Gestrinona%20e%20quero%20entender%20qual%20forma%20%C3%A9%20ideal%20para%20mim."
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
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Referências científicas</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Coutinho & Silva (1995)</p>
              <p><em>Gestrinone: a steroid with progestogenic, androgenic and anti-oestrogenic properties.</em> — Fundamentos da tripla ação farmacológica.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Barbosa et al. (1992)</p>
              <p><em>Gestrinone: its effect on the endocrine, metabolic and haemostatic parameters.</em> — Impactos sistêmicos e metabólicos.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Kicman, A. T. (2008)</p>
              <p><em>Pharmacology of anabolic steroids. British Journal of Pharmacology.</em> — Diferenciação entre esteroides e derivados de 19-nortestosterona.</p>
            </div>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl bg-muted/30 border border-border/40 p-4 mb-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            <strong className="text-foreground">Nota:</strong> Conteúdo de finalidade informativa técnica. O uso de hormônios e moduladores deve ser orientado e acompanhado por profissional habilitado, com avaliação clínica e laboratorial individualizada.
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

export default Gestrinona;
