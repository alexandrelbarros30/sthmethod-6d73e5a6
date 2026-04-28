import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Sparkles, Activity, Shield, Layers,
  AlertTriangle, Star, Zap, Heart, Flame, Droplet, Pill, Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-plato-hero.jpg";
import tireoideImg from "@/assets/sthnews-plato-tireoide.jpg";
import insulinaImg from "@/assets/sthnews-plato-insulina.jpg";
import cortisolImg from "@/assets/sthnews-plato-cortisol.jpg";
import hormoniosImg from "@/assets/sthnews-plato-hormonios.jpg";
import microImg from "@/assets/sthnews-plato-micronutrientes.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const PlatoMetabolico = () => {
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
          <span className="text-[10px] text-muted-foreground">{today} · STH News · Endocrinologia Aplicada</span>
        </motion.div>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          Por que seu corpo parou de emagrecer{" "}
          <span className="gradient-text">(mesmo fazendo tudo certo)</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-[11px] font-black tracking-[0.25em] text-primary uppercase mb-3"
        >
          Platô Metabólico
        </motion.p>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Quando a balança trava, <strong className="text-foreground">a matemática do déficit calórico deixa de ser o fator determinante</strong>. O corpo prioriza homeostase. A solução não é menos comida — é mais saúde metabólica. Aqui está o mapa completo.
        </motion.p>

        {/* HERO — DESTAQUE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/30 mb-8 aspect-[16/10] bg-muted shadow-[0_0_60px_rgba(34,197,94,0.15)]"
        >
          <img src={heroImg} alt="Mulher confiante com hélice de DNA luminosa simbolizando saúde metabólica" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[8px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded tracking-wider shadow-lg">CAPA</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">PLATÔ METABÓLICO · ST&H Method</span>
            <p className="text-base md:text-lg font-black text-foreground leading-tight">Ela não precisa de menos comida. Precisa de mais saúde metabólica.</p>
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
              Em estado de <strong className="gradient-text">estresse crônico ou sobrevivência</strong>, o corpo bloqueia a oxidação lipídica para preservar a homeostase. A interpretação não pode ser isolada — precisa ser uma <strong className="text-foreground">constelação de marcadores</strong>. São 5 eixos que, quando alterados, sinalizam o bloqueio.
            </p>
          </motion.div>
        </motion.section>

        {/* EIXO 1 — TIREOIDE */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">01 · Eixo Tireoidiano · O motor</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={tireoideImg} alt="Visualização da tireoide com moléculas T3 e T4" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            O erro comum é olhar apenas para o TSH. O emagrecimento eficiente depende da <strong className="text-foreground">conversão periférica</strong> de T4 em T3 ativo.
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500">TSH</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Valores acima de <strong className="text-foreground">2.5 mIU/L</strong>, mesmo dentro da referência laboratorial, podem indicar uma tireoide "preguiçosa".</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500">T3 LIVRE</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">É o hormônio metabolicamente ativo. Se estiver no <strong className="text-foreground">terço inferior</strong> da referência, o metabolismo basal está baixo.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-destructive/40 bg-gradient-to-br from-destructive/10 via-card to-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[9px] font-black uppercase tracking-widest text-destructive">T4 REVERSO (rT3) · Marcador crítico</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">Se elevado, o corpo está convertendo T4 em <strong>forma inativa para economizar energia</strong> — geralmente por estresse, dieta muito restritiva ou inflamação. <em className="text-muted-foreground">É o sinal silencioso do platô.</em></p>
            </motion.div>
          </div>
        </motion.section>

        {/* EIXO 2 — INSULINA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Droplet className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">02 · Eixo Insulínico · A chave de bloqueio</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={insulinaImg} alt="Gota de sangue com cristais de glicose representando glicemia e insulina" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Se a insulina está alta, a <strong className="text-foreground">lipólise é bloqueada</strong>. O corpo entra em modo de armazenamento — não importa quão bem você esteja comendo.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-amber-500/30 bg-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Insulina jejum</p>
              <p className="text-2xl font-black text-foreground">&lt; 6-8</p>
              <p className="text-[10px] text-muted-foreground">µUI/mL · ideal</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">HOMA-IR · Padrão ouro</p>
              <p className="text-2xl font-black text-foreground">&gt; 1.5</p>
              <p className="text-[10px] text-muted-foreground">já sugere resistência</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-amber-500/30 bg-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">HbA1c</p>
              <p className="text-2xl font-black text-foreground">&gt; 5.6%</p>
              <p className="text-[10px] text-muted-foreground">descontrole glicêmico</p>
            </motion.div>
          </div>
        </motion.section>

        {/* EIXO 3 — CORTISOL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">03 · Adrenal & Inflamação · O fator estresse</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={cortisolImg} alt="Silhueta feminina com glândulas adrenais destacadas representando cortisol e estresse" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Cortisol alto mantém a glicemia elevada, promove <strong className="text-foreground">retenção hídrica</strong> e estimula a deposição de gordura visceral.
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Cortisol matinal</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Elevado sugere <strong className="text-foreground">estresse crônico</strong> que impede a perda de gordura abdominal — mesmo com treino e dieta perfeitos.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">PCR-us</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Marcador de inflamação sistêmica. Acima de <strong className="text-foreground">2.0 mg/L</strong>, o corpo prioriza reparo de tecidos inflamados — não a queima de gordura.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-foreground">Ferritina</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Proteína de fase aguda. Acima de <strong className="text-foreground">150-200 ng/mL</strong> em mulheres indica inflamação crônica, mesmo com ferro normal.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* EIXO 4 — HORMÔNIOS FEMININOS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">04 · Perfil Hormonal Feminino</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={hormoniosImg} alt="Visualização hormonal feminina em ondas neon roxas" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Aqui mora a explicação de por que muitas mulheres sentem que <strong className="text-foreground">"o peso não desce"</strong> — especialmente a gordura inferior.
          </motion.p>

          <div className="space-y-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-violet-500/30 bg-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-1">SHBG</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Baixo = forte indício de <strong className="text-foreground">resistência à insulina</strong> e síndrome metabólica. Muito alto = excesso de estrogênio ou hipertireoidismo.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-violet-500/30 bg-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-1">Testosterona Livre</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Baixa demais (hipogonadismo funcional) reduz disposição, densidade muscular e metabolismo. Alta demais (SOP) facilita o <strong className="text-foreground">acúmulo de gordura androgênica</strong>.</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-violet-500/30 bg-card p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-1">Estradiol / Progesterona</p>
              <p className="text-xs text-muted-foreground leading-relaxed">O <strong className="text-foreground">domínio estrogênico</strong> causa retenção hídrica severa, que mascara a perda de gordura na balança.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* EIXO 5 — MICRONUTRIENTES */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Leaf className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">05 · Base Celular · Sem isso, nada roda</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-5 aspect-[16/10] bg-muted">
            <img src={microImg} alt="Vitaminas, minerais e visualização do fígado simbolizando metabolismo celular" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Sem micronutrientes, o <strong className="text-foreground">ciclo de Krebs não roda</strong>. As mitocôndrias são as usinas — e elas precisam de combustível certo.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <Pill className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Vitamina D</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Abaixo de <strong className="text-foreground">30 ng/mL</strong>, o emagrecimento é ineficiente. Essencial para sinalização da insulina.</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <Pill className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Vitamina B12</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Níveis baixos afetam a <strong className="text-foreground">produção de energia</strong> e a função mitocondrial.</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-emerald-500/30 bg-card p-4">
              <Pill className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">GGT (Gama-GT)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Acima de <strong className="text-foreground">30 U/L</strong> indica sobrecarga hepática — e o fígado é o "órgão da queima de gordura".</p>
            </motion.div>
          </div>
        </motion.section>

        {/* TABELA RESUMO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Resumo de triagem · O mapa rápido</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-primary/10">
                <tr>
                  <th className="text-left p-3 font-black text-foreground text-[10px] uppercase tracking-widest">Marcador</th>
                  <th className="text-left p-3 font-black text-emerald-400 text-[10px] uppercase tracking-widest">Ótimo</th>
                  <th className="text-left p-3 font-black text-destructive text-[10px] uppercase tracking-widest">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { m: "HOMA-IR", o: "< 1.0", a: "> 1.5" },
                  { m: "T3 Livre", o: "Terço superior", a: "Terço inferior" },
                  { m: "rT3", o: "Baixo", a: "Elevado" },
                  { m: "PCR-us", o: "< 1.0 mg/L", a: "> 2.0 mg/L" },
                  { m: "Ferritina", o: "40-100 ng/mL", a: "> 150 ng/mL" },
                  { m: "GGT", o: "< 20 U/L", a: "> 30 U/L" },
                ].map((row, i) => (
                  <tr key={row.m} className={i % 2 === 0 ? "bg-background/50" : ""}>
                    <td className="p-3 font-bold text-foreground">{row.m}</td>
                    <td className="p-3 text-emerald-400 font-mono">{row.o}</td>
                    <td className="p-3 text-destructive font-mono">{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.section>

        {/* CONCLUSÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-background to-primary/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Conclusão do Consultor</p>
            </div>
            <p className="text-base font-bold text-foreground leading-snug mb-4">
              Quando a paciente estagna, ela não precisa de menos comida. <span className="gradient-text">Ela precisa de mais saúde metabólica.</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Identificadas alterações nestes marcadores, o protocolo deve ser ajustado em três frentes:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/40">
                <span className="text-base font-black text-primary">01</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Reduzir a inflamação</p>
                  <p className="text-xs text-muted-foreground">ajuste de dieta e qualidade do sono.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/40">
                <span className="text-base font-black text-primary">02</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Sensibilizar a insulina</p>
                  <p className="text-xs text-muted-foreground">revisão de macronutrientes e horários de ingestão.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/40">
                <span className="text-base font-black text-primary">03</span>
                <div>
                  <p className="text-sm font-bold text-foreground">Otimizar a tireoide</p>
                  <p className="text-xs text-muted-foreground">verificar Selênio, Zinco e Magnésio.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* DISCLAIMER */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="rounded-xl border border-border/60 bg-muted/30 p-4 mb-8">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Nota:</strong> esta interpretação serve como base para o suporte nutricional do <strong className="text-foreground">ST&H Method</strong> e não substitui a avaliação médica necessária caso haja patologias instaladas. Sempre correlacione os exames com a clínica da paciente — sintomas de fadiga, qualidade do sono e ciclo menstrual.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        {!isStudent && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center">
            <Link to="/cadastro">
              <Button size="lg" className="gradient-bg text-primary-foreground font-black tracking-wider rounded-full px-8">
                Quero destravar meu metabolismo
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground mt-3">ST&H Method · Endocrinologia aplicada à composição corporal</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PlatoMetabolico;
