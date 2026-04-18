import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  FlaskConical, Dumbbell, Scale, AlertTriangle, Microscope,
  Heart, Activity, ShieldCheck, BookOpen, Flame, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import bodyImg from "@/assets/sthnews-recomposicao-corporal.jpg";
import labImg from "@/assets/sthnews-monitoramento-clinico.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const RecomposicaoAvancada = () => {
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
        {/* Tag breaking */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider">EXCLUSIVO</span>
          <span className="text-[10px] text-muted-foreground">{today} · STH News</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          🔥 Recomposição Corporal Avançada:{" "}
          <span className="gradient-text">o novo cenário da performance</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          A evolução da estética não está mais em <em>fazer mais</em>. Está em fazer com estratégia. E hoje um dos temas mais discutidos é a combinação entre Tirzepatida (GLP-1 + GIP) e estratégias anabólicas em microdoses.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Estrutura molecular GLP-1 e Tirzepatida" className="w-full h-full object-cover" width={1280} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Tirzepatida · GLP-1 + GIP</span>
            <p className="text-sm font-bold text-foreground">A nova base metabólica</p>
          </div>
        </motion.div>

        {/* O que está por trás */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Microscope className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">O que está por trás</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Card 1 - Tirzepatida */}
          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary">1. Base Metabólica</p>
                <h3 className="text-base font-bold text-foreground">Tirzepatida</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Mais do que reduzir apetite, ela atua diretamente em:</p>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex gap-2"><span className="text-primary">✔</span> Sensibilidade à insulina</li>
              <li className="flex gap-2"><span className="text-primary">✔</span> Controle glicêmico</li>
              <li className="flex gap-2"><span className="text-primary">✔</span> Metabolismo lipídico</li>
              <li className="flex gap-2"><span className="text-primary">✔</span> Redução consistente de gordura corporal</li>
            </ul>
            <p className="text-[11px] text-muted-foreground mt-3 italic">👉 Cria um ambiente altamente favorável para perda de gordura.</p>
          </motion.div>

          {/* Card 2 - Anabólico */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary">2. Estratégia Controlada</p>
                <h3 className="text-base font-bold text-foreground">Anabólico em microdoses</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Quando bem estruturada, pode contribuir para:</p>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex gap-2"><span className="text-primary">✔</span> Preservação de massa magra</li>
              <li className="flex gap-2"><span className="text-primary">✔</span> Estímulo à síntese proteica</li>
              <li className="flex gap-2"><span className="text-primary">✔</span> Melhor partição de nutrientes</li>
            </ul>
            <p className="text-[11px] text-muted-foreground mt-3 italic">👉 O objetivo não é excesso. É <span className="font-bold text-foreground">precisão</span>.</p>
          </motion.div>

          {/* Card 3 - Lógica */}
          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary">3. A lógica</p>
                <h3 className="text-base font-bold text-foreground">Recomposição Corporal</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 text-center">
                <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                <p className="text-[10px] text-muted-foreground">Tirzepatida</p>
                <p className="text-xs font-bold">↓ Gordura</p>
              </div>
              <div className="p-3 rounded-xl bg-background/60 border border-border/40 text-center">
                <Dumbbell className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                <p className="text-[10px] text-muted-foreground">Anabólico</p>
                <p className="text-xs font-bold">↑ Músculo</p>
              </div>
            </div>
            <p className="text-xs text-foreground mt-3 text-center">
              👉 <span className="font-bold">Mais definição, menos perda de massa magra.</span>
            </p>
          </motion.div>
        </motion.section>

        {/* Body image */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-border mb-10 aspect-[16/10] bg-muted"
        >
          <img src={bodyImg} alt="Análise de composição corporal" className="w-full h-full object-cover" loading="lazy" width={1280} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Recomposição visualizada</p>
            <p className="text-xs text-white/80">Massa magra preservada · Gordura reduzida</p>
          </div>
        </motion.div>

        {/* Diferencial */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-destructive/5 border-l-4 border-destructive p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Diferencial real</p>
            </div>
            <p className="text-base font-bold text-foreground leading-snug">
              Não é sobre <span className="line-through text-muted-foreground">usar</span>.
              <br />
              👉 É sobre <span className="gradient-text">como usar</span>.
            </p>
          </motion.div>
        </motion.section>

        {/* Pontos de atenção */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Pontos de atenção</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Activity, label: "Resposta hormonal individual", color: "from-pink-500 to-rose-700" },
              { icon: Heart, label: "Impacto cardiovascular", color: "from-red-500 to-red-700" },
              { icon: FlaskConical, label: "Perfil lipídico", color: "from-amber-500 to-orange-700" },
              { icon: Microscope, label: "Função hepática e renal", color: "from-emerald-500 to-emerald-700" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i + 1}
                className="p-4 rounded-2xl bg-card border border-border/50"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={5} className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/40 text-center">
            <p className="text-xs text-foreground">
              👉 Sem controle, não existe estratégia. <span className="font-bold text-destructive">Existe risco.</span>
            </p>
          </motion.div>
        </motion.section>

        {/* Lab image */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-border mb-10 aspect-[16/10] bg-muted"
        >
          <img src={labImg} alt="Monitoramento clínico e exames" className="w-full h-full object-cover" loading="lazy" width={1280} height={768} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Exames · Monitoramento</p>
            <p className="text-xs text-white/80">O que separa resultado de risco</p>
          </div>
        </motion.div>

        {/* Ciência */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">O que a ciência mostra</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-2.5">
            {[
              "Tirzepatida tem evidência sólida na perda de peso.",
              "Pode haver perda de massa magra sem suporte adequado.",
              "Estratégias anabólicas em mulheres exigem extrema cautela.",
              "Ainda não existem estudos clínicos robustos validando a combinação.",
            ].map((txt, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i + 1}
                className="flex gap-3 p-3 rounded-xl bg-card border border-border/40"
              >
                <span className="text-primary font-bold shrink-0">{i < 3 ? "✔" : "❗"}</span>
                <p className="text-xs text-foreground leading-relaxed">{txt}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Verdade */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-3">💣 Verdade que poucos falam</p>
            <p className="text-base font-bold text-foreground leading-snug">
              O resultado estético não vem da substância.
              <br />
              👉 Vem da <span className="gradient-text">estrutura</span> por trás dela.
            </p>
          </motion.div>
        </motion.section>

        {/* Conclusão */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Conclusão</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <p className="text-sm text-foreground leading-relaxed mb-3">
            A recomposição corporal avançada não é sobre atalhos. É sobre:
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {["Direção", "Monitoramento", "Individualidade", "Estratégia aplicada"].map((w) => (
              <div key={w} className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-xs font-bold text-foreground">✔ {w}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            📊 Exames, acompanhamento e ajuste contínuo não são opcionais. São o que separa resultado de risco.
          </p>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight">
              Não é o que você usa. <br />
              É <span className="gradient-text">como você aplica</span>.
            </h2>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20Recomposi%C3%A7%C3%A3o%20Corporal%20Avan%C3%A7ada%20e%20quero%20entender%20como%20aplicar%20com%20seguran%C3%A7a."
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
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Tirzepatida</p>
              <p>Jastreboff AM, et al. <em>Tirzepatide Once Weekly for the Treatment of Obesity</em>. New England Journal of Medicine (NEJM), 2022.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">GLP-1/GIP & Massa Muscular</p>
              <p>Estudos sobre composição corporal indicam perda de massa magra junto à gorda — justificando suporte anabólico, sem validar uso clínico combinado.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Androgênios em Mulheres</p>
              <p>Bhasin S, et al. <em>Testosterone Therapy in Men and Women</em>. Endocrine Reviews. — Doses terapêuticas seguras em mulheres são ordens de magnitude menores que doses estéticas.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Anabólico-Androgênicos</p>
              <p>Rogol AD. <em>Anabolic-Androgenic Steroids: A Review of Their Use in Sports and Health</em>.</p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">STH News — Informação que transforma</p>
          <p className="text-[9px] text-muted-foreground/30">Consultoria Estratégica em Saúde & Performance</p>
        </div>
      </main>
    </div>
  );
};

export default RecomposicaoAvancada;
