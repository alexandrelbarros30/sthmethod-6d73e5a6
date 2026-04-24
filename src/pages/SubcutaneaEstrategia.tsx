import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  FlaskConical, Syringe, Activity, ShieldCheck, BookOpen,
  Microscope, AlertTriangle, Target, Droplet, RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-subq-glass-1.jpg";
import pkImg from "@/assets/sthnews-subq-glass-2.jpg";
import sitesImg from "@/assets/sthnews-subq-glass-3.jpg";
import vialImg from "@/assets/sthnews-subq-glass-4.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const SubcutaneaEstrategia = () => {
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
          💉 IM → SubQ:{" "}
          <span className="gradient-text">a estratégia farmacocinética que mudou o jogo</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          A migração da via intramuscular para a subcutânea no contexto da reposição e otimização hormonal não é apenas conforto. É uma manobra tática para alcançar <strong className="text-foreground">estabilidade sérica</strong> — o santo graal do bodybuilding de alto rendimento.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Aplicação subcutânea com agulha de insulina no abdômen" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">SubQ · Tecido adiposo</span>
            <p className="text-sm font-bold text-foreground">Absorção lenta. Curva plana. Menos trauma.</p>
          </div>
        </motion.div>

        {/* ETAPA 1 — DIAGNÓSTICO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Microscope className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 1 · Diagnóstico</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <p className="text-sm text-foreground leading-relaxed mb-3">
              No bodybuilding de alto rendimento, o objetivo é a <strong className="text-primary">estabilidade sérica</strong> — manter a curva de níveis plasmáticos o mais plana possível para mitigar:
            </p>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex gap-2"><span className="text-destructive">▲</span> Picos de estradiol</li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Variações abruptas de humor</li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Picos desnecessários de hematócrito</li>
              <li className="flex gap-2"><span className="text-destructive">▲</span> Fibrose e cicatrizes por anos de IM</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-foreground leading-relaxed">
                <strong className="text-primary">Veredito:</strong> a via SubQ, bem executada, oferece absorção mais lenta e constante (efeito depot mais eficiente) e reduz o trauma tecidual acumulado.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* ETAPA 2 — CONSTRUÇÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 2 · Construção</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A viabilidade técnica baseia-se na fisiologia do tecido adiposo: altamente vascularizado, mas com fluxo sanguíneo <strong className="text-foreground">menor e mais constante</strong> que o músculo esquelético.
          </motion.p>

          {/* Imagem farmacocinética */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={pkImg} alt="Comparação farmacocinética IM vs SubQ" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          {/* Cards técnicos */}
          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Farmacocinética estável</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estudos demonstram que ésteres de testosterona (Cipionato/Enantato) via SubQ produzem níveis séricos equivalentes ou superiores à IM, com vantagem de menores picos de hematócrito. A liberação mais lenta a partir do tecido adiposo evita o "spike" agudo da via IM.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Bioequivalência validada</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A literatura médica validou a técnica para TRT, provando ser eficaz, segura e com maior adesão do paciente — autoaplicação com agulhas de insulina, menores e menos invasivas.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">Volume e densidade</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O limitante técnico é o volume. O tecido adiposo não acomoda grandes cargas — idealmente <strong className="text-foreground">&lt; 0,5 ml a 1 ml por sítio</strong>. Apenas fármacos de alta concentração (mg/ml) são viáveis para esta via.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 3 — OTIMIZAÇÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 3 · Otimização</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Para implementar isso no <strong className="text-foreground">STH METHOD</strong> com segurança, siga o protocolo de precisão:
          </motion.p>

          {/* Regra da concentração */}
          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">REGRA 01</span>
              <h3 className="text-sm font-bold text-foreground">Concentração e veículo</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use apenas ésteres de testosterona em <strong className="text-foreground">veículo oleoso de alta pureza</strong>. Solventes agressivos ou alta concentração de álcool benzílico podem causar necrose tecidual ou inflamação severa (lipohipertrofia).
            </p>
          </motion.div>

          {/* Técnica */}
          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">REGRA 02</span>
              <h3 className="text-sm font-bold text-foreground">Técnica de aplicação</h3>
            </div>
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex gap-2"><Syringe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Agulhas de insulina (30G ou 31G)</li>
              <li className="flex gap-2"><Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Ângulo de 90° na dobra cutânea (abdômen ou glúteos)</li>
              <li className="flex gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Não precisa aspirar — risco vascular é mínimo no tecido adiposo</li>
            </ul>
          </motion.div>

          {/* Imagem rotação de sítios */}
          <motion.div variants={fadeUp} custom={4} className="rounded-2xl overflow-hidden border border-primary/20 mb-3 aspect-[16/10] bg-muted">
            <img src={sitesImg} alt="Mapa de rotação de sítios subcutâneos" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          {/* Rotação */}
          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">REGRA 03</span>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5" /> Rotação de sítios</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Aplicação repetida no mesmo ponto causa <strong className="text-foreground">lipohipertrofia</strong> (acúmulo de tecido endurecido). Rotacione sistematicamente:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="px-2 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-[10px] font-bold text-foreground">Abdômen Direito</p>
              </div>
              <div className="px-2 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-[10px] font-bold text-foreground">Abdômen Esquerdo</p>
              </div>
              <div className="px-2 py-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-[10px] font-bold text-foreground">Glúteos Sup.</p>
              </div>
            </div>
          </motion.div>

          {/* Filtro de segurança */}
          <motion.div variants={fadeUp} custom={6} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Filtro de segurança</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-2">
              Se ocorrer <strong>vermelhidão, calor local ou nódulo persistente</strong>, interrompa a via.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Substâncias como <strong className="text-destructive">Clenbuterol</strong> ou hormônios de base aquosa/ácida <strong className="text-destructive">nunca</strong> devem ser administrados via subcutânea — risco altíssimo de irritação e abscessos. Apenas ésteres oleosos longos (Cipionato, Enantato, "Durateston") possuem perfil farmacológico para SubQ.
            </p>
          </motion.div>
        </motion.section>

        {/* INSIGHT BRUTAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ Insight Brutal</p>
            <p className="text-sm text-foreground leading-relaxed">
              A mudança para SubQ é o refinamento dos <strong className="gradient-text">pequenos ganhos</strong>. Se o paciente apresenta hematócrito subindo agressivamente com IM, a migração para SubQ é a <strong className="text-foreground">primeira manobra tática</strong> para controlar essa variável — sem reduzir a dose androgênica.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight">
              Não é a substância. <br />
              É <span className="gradient-text">a via, a dose e o monitoramento</span>.
            </h2>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20SubQ%20e%20quero%20entender%20como%20aplicar%20com%20seguran%C3%A7a."
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
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Spratt et al., 2017</p>
              <p><em>Subcutaneous injection of testosterone is an effective and preferred alternative to intramuscular injection.</em> — Demonstra eficácia clínica e preferência do paciente pela via SubQ.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Pastuszak et al., 2017</p>
              <p><em>Subcutaneous testosterone therapy is an effective and safe delivery method for the treatment of hypogonadism.</em> — Confirma manutenção de níveis terapêuticos estáveis sem necessidade de injeções profundas.</p>
            </div>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl bg-muted/30 border border-border/40 p-4 mb-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            <strong className="text-foreground">Nota:</strong> Conteúdo de finalidade informativa técnica para profissionais. A administração de qualquer fármaco deve estar alinhada com o protocolo clínico do paciente e respeitar normas de segurança biológica.
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

export default SubcutaneaEstrategia;
