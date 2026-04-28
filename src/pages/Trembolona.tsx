import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Sparkles, Activity, Shield, Layers,
  AlertTriangle, Zap, Heart, Flame, Pill, Beaker, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-trembolona-hero.jpg";
import moleculaImg from "@/assets/sthnews-trembolona-molecula.jpg";
import esteresImg from "@/assets/sthnews-trembolona-esteres.jpg";
import particionamentoImg from "@/assets/sthnews-trembolona-particionamento.jpg";
import suporteImg from "@/assets/sthnews-trembolona-suporte.jpg";
import vereditoImg from "@/assets/sthnews-trembolona-veredito.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Trembolona = () => {
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
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider animate-pulse">EXCLUSIVO</span>
          <span className="text-[10px] text-muted-foreground">{today} · STH News · Performance Avançada</span>
        </motion.div>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          Trembolona: a arquitetura corporal{" "}
          <span className="gradient-text">no patamar de elite</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-[11px] font-black tracking-[0.25em] text-primary uppercase mb-3"
        >
          Análise técnica · ST&H Method
        </motion.p>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Para quem já dominou treino, dieta e consistência, e atingiu o ponto onde a eficiência metabólica é a prioridade, a Trembolona não é apenas uma escolha — é uma <strong className="text-foreground">estratégia de precisão</strong>. O segredo nunca foi a dose. É o manejo.
        </motion.p>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/30 mb-8 aspect-[16/10] bg-muted shadow-[0_0_60px_rgba(34,197,94,0.18)]"
        >
          <img src={heroImg} alt="Atleta com hélice de DNA neon simbolizando arquitetura corporal" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[8px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded tracking-wider shadow-lg">CAPA</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">TREMBOLONA · ST&amp;H Method</span>
            <p className="text-base md:text-lg font-black text-foreground leading-tight">Densidade, secura e detalhamento que outros compostos não entregam.</p>
          </div>
        </motion.div>

        {/* INTRO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">A leitura do consultor</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              A Trembolona é uma <strong className="gradient-text">ferramenta de precisão</strong>. Bem utilizada — com suporte clínico, exames em dia e monitoramento contínuo — entrega resultados que a maioria dos atletas leva anos para alcançar. Mal utilizada, é apenas um tiro no escuro. A diferença está no protocolo de manejo.
            </p>
          </motion.div>
        </motion.section>

        {/* SEÇÃO 1 — A CIÊNCIA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Beaker className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">01 · A ciência da molécula</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={moleculaImg} alt="Estrutura molecular 3D da trembolona com ligações duplas em destaque" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Derivada da 19-nortestosterona, a estrutura química da Trembolona — com <strong className="text-foreground">ligações duplas únicas nos carbonos 9 e 11</strong> — a torna radicalmente diferente. Sua afinidade ao receptor androgênico supera quase qualquer outro esteroide, garantindo densidade muscular extrema e perda de gordura acelerada.
          </motion.p>
        </motion.section>

        {/* SEÇÃO 2 — ÉSTERES */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">02 · Os ésteres · O seu relógio</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={esteresImg} alt="Três ésteres da trembolona: Acetato, Enantato e Hexa" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A molécula base é a mesma. A diferença está na <strong className="text-foreground">velocidade de liberação</strong> na corrente sanguínea — e isso muda completamente a estratégia.
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-cyan-500/30 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500">Acetato · Padrão ouro de precisão</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Ação curta, controle total. Se algo sai do planejado, <strong className="text-foreground">sai do sistema rápido</strong>. Ideal para quem busca ajustes semanais.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-amber-500/30 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Enantato · Equilíbrio</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Liberação mais estável, <strong className="text-foreground">menos aplicações</strong>, mantendo a potência da molécula intacta.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 via-card to-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Hexa (Parabolan) · Lendário</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">Ação mais longa e estável. Historicamente associado ao <strong>ganho de qualidade superior</strong> graças à estabilidade plasmática constante — ambiente anabólico imperturbável.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* SEÇÃO 3 — MAGIA METABÓLICA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">03 · A magia metabólica</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={particionamentoImg} alt="Visualização do particionamento de nutrientes direcionado ao músculo" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A Trembolona altera a forma como o corpo processa energia. Para quem busca transformação real, isto é o que acontece:
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Particionamento de nutrientes</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">O corpo é "obrigado" a direcionar proteínas e carboidratos para a <strong className="text-foreground">construção de tecido muscular</strong>, deixando menos energia disponível para armazenamento de gordura.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Oxidação lipídica potencializada</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Aumenta a taxa metabólica basal e a eficiência da queima — mesmo em repouso. Resultado: aspecto <strong className="text-foreground">seco, vascularizado, com detalhamento</strong> que outros compostos escondem com retenção hídrica.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Retenção de nitrogênio</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Maximiza o estoque de nitrogênio no músculo, criando um <strong className="text-foreground">estado anabólico superior</strong> e prevenindo o catabolismo mesmo em déficit calórico agressivo.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* SEÇÃO 4 — GESTÃO DE RISCOS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">04 · Protocolo de suporte · Inegociável</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={suporteImg} alt="Coração e fígado em wireframe neon com escudo simbolizando proteção clínica" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A potência exige responsabilidade. No ST&amp;H Method, os colaterais não são ignorados — são <strong className="text-foreground">gerenciados com precisão clínica</strong>. Para um protocolo voltado a longevidade e performance, o suporte é inegociável.
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Pill className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Proteção hepática</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Uso estratégico de protetores (NAC, TUDCA) para garantir que a metabolização <strong className="text-foreground">não sobrecarregue o sistema</strong>.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Gestão cardiovascular</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Ômega-3 de alta pureza, <strong className="text-foreground">cardio aeróbico indispensável</strong> para controle do hematócrito e monitoramento periódico do perfil lipídico.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Controle da prolactina</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Sob supervisão médica, modulação dopaminérgica mantém <strong className="text-foreground">bem-estar e libido intactos</strong>.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={6} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Gestão psicológica</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Sono regulado e suporte ao sistema nervoso central são vitais para manter a <strong className="text-foreground">performance mental</strong> sob controle.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* SEÇÃO 5 — VEREDITO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">05 · O veredito · Próximo nível</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={vereditoImg} alt="Atleta de elite com definição muscular extrema iluminado por luz neon verde" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5">
            <p className="text-sm text-foreground leading-relaxed mb-3">
              A Trembolona é para quem <strong className="gradient-text">já dominou dieta, treino e consistência básica</strong>. É uma ferramenta de elite. O segredo não é a dose — é o manejo. O controle das variáveis (exames, dieta, suporte) é o que mantém o corpo em estado de alta performance sem comprometer a saúde a longo prazo.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Está pronto para alinhar seu protocolo com o nível de elite? O primeiro passo é o <strong className="text-foreground">check-up metabólico completo</strong>. Sem a leitura correta do seu cenário hormonal atual, qualquer intervenção é apenas um tiro no escuro.
            </p>
          </motion.div>
        </motion.section>

        {/* AVISO ÉTICO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-destructive/40 bg-gradient-to-br from-destructive/10 via-card to-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-destructive">Aviso · Conteúdo informativo</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta análise é estritamente informativa. Substâncias ergogênicas são tratamentos médicos e devem ser conduzidas <strong className="text-foreground">sob supervisão estrita de endocrinologista ou médico do esporte</strong>. O uso inadequado pode trazer danos graves à saúde.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA FINAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-primary/5 p-6 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-black text-foreground mb-2">Pronto para o nível de elite?</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">Comece pelo check-up metabólico completo e alinhe seu protocolo com quem domina o manejo clínico da performance.</p>
            {!isStudent && (
              <Link to="/cadastro">
                <Button className="gradient-bg text-primary-foreground font-bold px-6">Quero meu check-up</Button>
              </Link>
            )}
          </motion.div>
        </motion.section>

        {/* REFERÊNCIAS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-border/60 bg-card/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Referências técnicas</p>
            <ul className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
              <li>Kicman, A. T. (2008). <em>Pharmacology of anabolic steroids</em>. British Journal of Pharmacology.</li>
              <li>Bhasin, S., et al. (2001). <em>The effects of supraphysiologic doses of testosterone on muscle size and strength in normal men</em>. American Journal of Physiology.</li>
              <li>Llewellyn, W. (2011). <em>Anabolics</em>. Molecular Nutrition.</li>
            </ul>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
};

export default Trembolona;