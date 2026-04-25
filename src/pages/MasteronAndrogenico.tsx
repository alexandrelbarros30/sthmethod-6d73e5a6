import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  FlaskConical, Activity, ShieldCheck, BookOpen,
  Microscope, AlertTriangle, Target, Droplet, HeartPulse, Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-masteron-glass-1.jpg";
import vialsImg from "@/assets/sthnews-masteron-glass-2.jpg";
import receptorImg from "@/assets/sthnews-masteron-glass-3.jpg";
import bodyImg from "@/assets/sthnews-masteron-glass-4.jpg";
import organsImg from "@/assets/sthnews-masteron-glass-5.jpg";
import labsImg from "@/assets/sthnews-masteron-glass-6.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const MasteronAndrogenico = () => {
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
          <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider">EXCLUSIVO</span>
          <span className="text-[10px] text-muted-foreground">{today} · STH News</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          🧬 Drostanolona (Masteron):{" "}
          <span className="gradient-text">o derivado de DHT que define densidade e performance</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Antes de qualquer análise: <strong className="text-foreground">emagrecimento e hipertrofia dependem de déficit/superávit calórico, treino resistido bem estruturado e constância</strong>. Nenhum recurso ergogênico compensa base nutricional deficiente. Substâncias androgênicas <em>potencializam</em> uma base sólida — e trazem riscos sistêmicos que exigem cautela máxima.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Estrutura molecular em vidro líquido representando derivado de DHT" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">DHT · Análogo</span>
            <p className="text-sm font-bold text-foreground">Não aromatiza. Alta afinidade androgênica. Risco real.</p>
          </div>
        </motion.div>

        {/* ETAPA 1 — APRESENTAÇÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Microscope className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 1 · Formas e farmacocinética</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={vialsImg} alt="Frascos de Propionato e Enantato de Drostanolona em vidro líquido" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Propionato de Drostanolona</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Éster <strong className="text-foreground">curto</strong>, meia-vida de <strong className="text-foreground">1 a 3 dias</strong>. Exige aplicações frequentes para manter níveis plasmáticos estáveis. É a forma preferida de quem quer evitar acúmulo prolongado da substância no organismo.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Enantato de Drostanolona</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Éster <strong className="text-foreground">longo</strong>, meia-vida de <strong className="text-foreground">7 a 10 dias</strong>. Aplicações menos frequentes, mas <em>"limpeza" do organismo muito mais lenta</em> em caso de efeitos colaterais — fator crítico para mulheres.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 2 — MECANISMO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 2 · Mecanismo metabólico e hormonal</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={receptorImg} alt="Ligação ao receptor androgênico representada em vidro líquido" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Não aromatiza</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O Masteron <strong className="text-foreground">não converte em estrogênio</strong>. Possui propriedades levemente antiestrogênicas. Para a mulher, isso significa <em>ausência de retenção hídrica típica</em>, promovendo visual "seco" e densidade muscular aparente.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Afinidade androgênica altíssima</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              Por ser derivado de DHT, tem <strong className="text-destructive">altíssima afinidade pelos receptores androgênicos</strong>. No corpo feminino, essa característica é a <strong>principal causa dos riscos de virilização</strong> — o organismo não é adaptado a esses níveis de andrógeno.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 3 — COMPOSIÇÃO CORPORAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 3 · O que ele realmente faz</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={bodyImg} alt="Composição corporal em vidro líquido com fibras musculares âmbar" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            O Masteron <strong className="text-foreground">não "queima gordura" por si só</strong>, nem <strong className="text-foreground">constrói músculo magicamente</strong>. Sua utilidade estética em contextos de performance reside em dois eixos:
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">EFEITO 01</span>
              <h3 className="text-sm font-bold text-foreground">Densidade e dureza</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pela natureza antiestrogênica, reduz aspecto de retenção subcutânea e realça o <strong className="text-foreground">detalhamento muscular</strong> — o famoso efeito de "pele fina".
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">EFEITO 02</span>
              <h3 className="text-sm font-bold text-foreground">Preservação de massa magra</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Em estados de déficit calórico (dieta de emagrecimento), <strong className="text-foreground">sinaliza ao corpo para poupar tecido muscular</strong> em vez de catabolizá-lo.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 4 — RISCOS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 4 · Riscos e efeitos colaterais</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-destructive/30 mb-4 aspect-[16/10] bg-muted">
            <img src={organsImg} alt="Órgãos de filtração e cardiovasculares em vidro líquido com luz de alerta" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Virilização (alguns efeitos irreversíveis)</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex gap-2"><span className="text-destructive">▲</span> Hipertrofia clitoriana — <strong>frequentemente irreversível</strong></li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Engrossamento da voz — <strong>irreversível</strong></li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Hirsutismo (pelos faciais e corporais em padrão masculino)</li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Alterações na estrutura óssea facial</li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Perfil lipídico</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Impacto <strong className="text-foreground">severo na redução do HDL (bom)</strong> e aumento do LDL (ruim), elevando significativamente o risco cardiovascular.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-destructive/15 text-destructive px-2 py-0.5 rounded tracking-wider">RISCO</span>
              <h3 className="text-sm font-bold text-foreground">Saúde hepática e renal</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Embora não seja oral, toda substância exógena <strong className="text-foreground">sobrecarrega os órgãos de metabolização e filtração</strong>.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-destructive/15 text-destructive px-2 py-0.5 rounded tracking-wider">RISCO</span>
              <h3 className="text-sm font-bold text-foreground">Eixo hormonal feminino</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Supressão da produção natural de hormônios femininos — pode levar a <strong className="text-foreground">ciclos irregulares ou amenorreia</strong> (ausência de menstruação).
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 5 — SUPORTE */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 5 · Suporte e monitoramento</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={labsImg} alt="Tubos de exames laboratoriais em vidro líquido" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            <strong className="text-foreground">Não há "antídoto"</strong> para os efeitos androgênicos do Masteron. Uma vez que a virilização se manifesta, o manejo é a <strong className="text-foreground">suspensão imediata</strong>. Como não aromatiza, <em>não se utilizam inibidores de aromatase</em>. O controle foca em três frentes:
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">SUPORTE 01</span>
              <h3 className="text-sm font-bold text-foreground">Hepático</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">N-Acetilcisteína (NAC)</strong> para suporte de glutationa e proteção contra estresse oxidativo.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">SUPORTE 02</span>
              <h3 className="text-sm font-bold text-foreground">Lipídios</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Ômega-3 de alta pureza</strong> (alta concentração de EPA/DHA) e manejo dietético rigoroso de gorduras saturadas.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">SUPORTE 03</span>
              <h3 className="text-sm font-bold text-foreground">Monitoramento periódico</h3>
            </div>
            <ul className="space-y-1 text-xs text-foreground mt-2">
              <li className="flex gap-2"><span className="text-primary">•</span> Perfil lipídico completo</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Função hepática (TGO, TGP, GGT)</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Perfil hormonal (SHBG, testosterona livre e total)</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Hematócrito</li>
            </ul>
          </motion.div>
        </motion.section>

        {/* INSIGHT BRUTAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ Insight Brutal</p>
            <p className="text-sm text-foreground leading-relaxed">
              A introdução de qualquer derivado de DHT em mulheres é uma <strong className="gradient-text">decisão clínica de risco elevado</strong>. A avaliação de um profissional de saúde, acompanhada de exames laboratoriais prévios, é o <strong className="text-foreground">único caminho seguro</strong> para entender a viabilidade de qualquer protocolo de performance.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight">
              A base é dieta e treino. <br />
              O resto é <span className="gradient-text">monitoramento e responsabilidade</span>.
            </h2>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20Drostanolona%20e%20quero%20avaliar%20com%20seguran%C3%A7a."
                target="_blank" rel="noopener noreferrer" className="w-full"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.section>

        {/* Referências */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Referências científicas</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Llewellyn, W.</p>
              <p><em>Anabolics 11th Edition.</em> Molecular Nutrition. — Explicação farmacológica de ésteres e derivados de DHT.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Kicman, A. T. — 2008</p>
              <p><em>Pharmacology of anabolic steroids.</em> British Journal of Pharmacology. — Análise sobre os mecanismos de ação androgênica.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Bhasin, S., et al.</p>
              <p><em>Testosterone Therapy in Men and Women.</em> Endocrine Reviews. — Discussão sobre o impacto do uso de andrógenos em mulheres.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">SBEM</p>
              <p>Sociedade Brasileira de Endocrinologia e Metabologia — Diretrizes sobre o uso inadequado de esteroides anabolizantes e riscos à saúde.</p>
            </div>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl bg-muted/30 border border-border/40 p-4 mb-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            <strong className="text-foreground">Nota:</strong> Conteúdo informativo técnico. A STH METHOD não prescreve nem recomenda o uso de substâncias androgênicas. Qualquer decisão deve ser tomada exclusivamente por médico habilitado, com exames laboratoriais e acompanhamento contínuo.
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

export default MasteronAndrogenico;
