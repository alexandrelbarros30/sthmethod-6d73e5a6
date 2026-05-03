import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-plato-hero.jpg";
import tireoideImg from "@/assets/sthnews-plato-tireoide.jpg";
import insulinaImg from "@/assets/sthnews-plato-insulina.jpg";
import cortisolImg from "@/assets/sthnews-plato-cortisol.jpg";
import hormoniosImg from "@/assets/sthnews-plato-hormonios.jpg";
import microImg from "@/assets/sthnews-plato-micronutrientes.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number, kicker, title, image, alt, children,
}: { number: string; kicker: string; title: string; image: string; alt: string; children: React.ReactNode }) => (
  <motion.section
    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}
    className="py-20 md:py-32 border-t border-border/40"
  >
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
        {number} — {kicker}
      </p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">
        {title}
      </h2>
    </div>
    <div className="max-w-4xl mx-auto px-6 mb-10">
      <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
        <img src={image} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const Marker = ({ name, ok, alert }: { name: string; ok: string; alert: string }) => (
  <div className="py-5 border-t border-border/40 grid grid-cols-3 gap-4 items-baseline">
    <p className="text-foreground font-medium text-[15px]">{name}</p>
    <p className="text-[14px] text-primary font-mono">{ok}</p>
    <p className="text-[14px] text-destructive font-mono">{alert}</p>
  </div>
);

const PlatoMetabolico = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-11 flex items-center justify-between">
          <Link to={backTo} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            <BackIcon className="w-3.5 h-3.5" />
            <span>{isStudent ? "Início" : "STH News"}</span>
          </Link>
          <span className="text-[12px] font-semibold tracking-tight">STH News</span>
          {isStudent ? (
            <Link to="/dashboard"><Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">Voltar</Button></Link>
          ) : (
            <Link to="/cadastro"><Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Começar</Button></Link>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Platô Metabólico
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Por que seu corpo <br />
          <span className="text-muted-foreground">parou de emagrecer.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Não é mais matemática. É bioquímica.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Saúde metabólica" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Quando a balança trava, a matemática do déficit calórico deixa de ser o fator determinante. O corpo prioriza homeostase. A solução não é menos comida — é <span className="text-primary">mais saúde metabólica</span>.
        </motion.p>
      </section>

      <Section number="01" kicker="Eixo tireoidiano" title="O motor que ninguém olha direito."
        image={tireoideImg} alt="Tireoide">
        <p>O erro comum é olhar apenas para o TSH. O emagrecimento eficiente depende da conversão periférica de T4 em T3 ativo.</p>
        <p><span className="text-foreground font-medium">T4 reverso (rT3)</span> elevado é o sinal silencioso do platô — o corpo está economizando energia.</p>
      </Section>

      <Section number="02" kicker="Eixo insulínico" title="A chave que bloqueia tudo."
        image={insulinaImg} alt="Insulina">
        <p>Se a insulina está alta, a lipólise é bloqueada. O corpo entra em modo de armazenamento — não importa quão bem você esteja comendo.</p>
        <div className="grid grid-cols-3 gap-6 pt-6">
          {[
            ["Insulina", "< 6-8", "µUI/mL"],
            ["HOMA-IR", "> 1.5", "resistência"],
            ["HbA1c", "> 5.6%", "alerta"],
          ].map(([n, v, u]) => (
            <div key={n} className="text-left">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{n}</p>
              <p className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{v}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{u}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Adrenal & inflamação" title="O fator estresse."
        image={cortisolImg} alt="Cortisol">
        <p>Cortisol alto mantém a glicemia elevada, promove retenção hídrica e estimula a deposição de gordura visceral.</p>
        <p>PCR-us acima de 2.0 mg/L: o corpo prioriza reparo de tecidos inflamados — não a queima de gordura.</p>
      </Section>

      <Section number="04" kicker="Perfil hormonal" title="Quando o peso simplesmente não desce."
        image={hormoniosImg} alt="Hormônios femininos">
        <p><span className="text-foreground font-medium">SHBG baixo:</span> forte indício de resistência à insulina e síndrome metabólica.</p>
        <p><span className="text-foreground font-medium">Testosterona livre desbalanceada:</span> reduz disposição ou facilita acúmulo de gordura androgênica.</p>
        <p><span className="text-foreground font-medium">Domínio estrogênico:</span> retenção hídrica severa que mascara a perda de gordura.</p>
      </Section>

      <Section number="05" kicker="Base celular" title="Sem micronutrientes, nada roda."
        image={microImg} alt="Micronutrientes">
        <p>O ciclo de Krebs depende de cofatores. As mitocôndrias são as usinas — precisam de combustível certo.</p>
        <p><span className="text-foreground font-medium">Vitamina D &lt; 30 ng/mL:</span> sinalização da insulina comprometida.</p>
        <p><span className="text-foreground font-medium">GGT &gt; 30 U/L:</span> sobrecarga hepática — e o fígado é o órgão da queima de gordura.</p>
      </Section>

      {/* RESUMO */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="py-20 md:py-32 border-t border-border/40"
      >
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">Resumo</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-12 leading-[1.05]">
            O mapa rápido.
          </h2>
          <div>
            <div className="py-3 grid grid-cols-3 gap-4 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              <span>Marcador</span><span className="text-primary">Ótimo</span><span className="text-destructive">Alerta</span>
            </div>
            {[
              ["HOMA-IR", "< 1.0", "> 1.5"],
              ["T3 Livre", "Terço superior", "Terço inferior"],
              ["rT3", "Baixo", "Elevado"],
              ["PCR-us", "< 1.0 mg/L", "> 2.0 mg/L"],
              ["Ferritina", "40-100 ng/mL", "> 150 ng/mL"],
              ["GGT", "< 20 U/L", "> 30 U/L"],
            ].map(([n, o, a]) => (
              <Marker key={n} name={n} ok={o} alert={a} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Mais saúde. <br /><span className="text-muted-foreground">Não menos comida.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Destrave seu metabolismo com leitura clínica precisa.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Quero destravar meu metabolismo
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo. Sempre correlacione exames com a clínica e avaliação médica especializada.
        </p>
      </footer>
    </div>
  );
};

export default PlatoMetabolico;
