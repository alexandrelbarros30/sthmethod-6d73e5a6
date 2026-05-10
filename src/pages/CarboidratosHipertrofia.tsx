import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-carbs-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number, kicker, title, children,
}: { number: string; kicker: string; title: string; children: React.ReactNode }) => (
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
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const CarboidratosHipertrofia = () => {
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

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Nutrição & Hipertrofia · 2026
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Carboidratos não <br />
          <span className="text-muted-foreground">constroem músculo.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Nova meta-análise (2026) reabre o debate. Quando proteína e calorias são iguais, o macro deixa de ser protagonista.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Carboidratos e hipertrofia" className="w-full h-full object-cover" width={1600} height={900} />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Quando a proteína está equiparada, mais carboidrato <span className="text-primary">não significa mais músculo</span>. Significa, na maioria dos casos, mais combustível para o treino que constrói o músculo.
        </motion.p>
      </section>

      <Section number="01" kicker="O estudo central" title="A meta-análise de 2026.">
        <p>Uma nova revisão sistemática e meta-análise publicada em <span className="text-foreground font-medium">Sports Medicine</span> (Henselmans, Vårvik & Izquierdo, PMID: 41712097) avaliou o impacto da ingestão de carboidratos sobre a hipertrofia muscular.</p>
        <p>O resultado foi consistente entre métodos — <span className="text-foreground font-medium">DEXA, ressonância magnética e ultrassom</span>: quando proteína e calorias estão controladas, maior ingestão de carboidratos não produziu ganho significativo de massa muscular.</p>
      </Section>

      <Section number="02" kicker="Como o músculo foi medido" title="Métodos diferentes, mesma direção.">
        <p>Cada técnica olha para o tecido de uma forma. O ultrassom mede diretamente a espessura muscular. O DEXA mede toda a massa magra — não só músculo. A ressonância oferece o corte mais preciso por volume.</p>
        <p>Mesmo com essas diferenças, o efeito geral foi <span className="text-foreground font-medium">neutro ou levemente positivo</span>, sem significância estatística clara.</p>
      </Section>

      <Section number="03" kicker="O que importa de verdade" title="As alavancas reais da hipertrofia.">
        <div className="grid gap-4">
          {[
            ["Proteína total diária", "Substrato direto da síntese proteica muscular. Sem ela, nada acontece."],
            ["Calorias totais", "Define se o corpo está em ambiente anabólico, eutrófico ou catabólico."],
            ["Estímulo de treino", "Sem tensão mecânica recorrente, nutrição sozinha não constrói músculo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p>Carboidratos e gorduras entram como <span className="text-foreground font-medium">moduladores</span> — não como gatilhos primários.</p>
      </Section>

      <Section number="04" kicker="Onde o carboidrato realmente brilha" title="Performance, recuperação e adesão.">
        <p>O carbo não constrói músculo diretamente — mas pode construir o <span className="text-foreground font-medium">treino</span> que constrói o músculo:</p>
        <ul className="list-none space-y-3 pl-0">
          <li className="border-l-2 border-primary/40 pl-4"><span className="text-foreground font-medium">Volume e intensidade</span> — mais carga sustentada por sessão.</li>
          <li className="border-l-2 border-primary/40 pl-4"><span className="text-foreground font-medium">Recuperação</span> — reposição de glicogênio entre sessões.</li>
          <li className="border-l-2 border-primary/40 pl-4"><span className="text-foreground font-medium">Disposição</span> — humor, foco e tolerância à fadiga.</li>
          <li className="border-l-2 border-primary/40 pl-4"><span className="text-foreground font-medium">Adesão</span> — dieta sustentável bate dieta perfeita no papel.</li>
        </ul>
        <p>O efeito é <span className="text-foreground font-medium">indireto, mas real</span>. Treinar melhor é treinar mais — e treinar mais constrói músculo.</p>
      </Section>

      <Section number="05" kicker="Low carb x high carb" title="Nenhum extremo vence sozinho.">
        <p>Estudos sobre hipertrofia em dietas low carb tendem a mostrar efeito <span className="text-foreground font-medium">neutro ou levemente negativo</span>. Restrição severa pode prejudicar performance anaeróbica, recuperação e potencial hipertrófico.</p>
        <p>Por outro lado, gorduras também não aumentam diretamente a massa muscular. O ponto não é o macro vencedor — é o macro que <span className="text-foreground font-medium">você consegue sustentar</span>.</p>
        <p className="text-foreground font-medium">Adesão &gt; guerra de macros.</p>
      </Section>

      <Section number="06" kicker="Leitura honesta" title="O que o estudo realmente diz.">
        <p>O post viral simplifica. O estudo não prova que “carboidrato é irrelevante”. Ele mostra algo específico:</p>
        <p className="text-foreground font-medium">"Maior ingestão de carboidratos, isoladamente, não aumentou hipertrofia quando proteína e calorias estavam equivalentes."</p>
        <p>A meta-análise contou com apenas 11 estudos e os autores classificaram a certeza da evidência como <span className="text-foreground font-medium">baixa</span>. Carboidratos seguem influenciando volume, recuperação, glicogênio, desempenho e adesão.</p>
      </Section>

      <Section number="07" kicker="Conclusão STH METHOD" title="O macro certo é o que cabe na sua rotina.">
        <p>Proteína e calorias são os fatores nutricionais <span className="text-foreground font-medium">primários</span> da hipertrofia. Carboidratos atuam como <span className="text-foreground font-medium">moduladores de performance e recuperação</span>.</p>
        <p>Seja low carb, high carb ou intermediário — escolha a abordagem que você sustenta por anos, não por semanas. Macros ajustados ao seu treino, à sua rotina e à sua biologia. Esse é o trabalho.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Macros sem achismo. <br />
            <span className="text-muted-foreground">Estratégia individual.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            STH METHOD ajusta proteína, calorias e carboidratos ao seu treino, biologia e rotina.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Iniciar minha consultoria
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          STH News · 2026. Referências: Henselmans, Vårvik & Izquierdo (Sports Medicine, PMID: 41712097); Figueiredo & Cameron-Smith (PMC); estudos sobre disponibilidade de carboidrato e performance anaeróbica (PubMed).
        </p>
      </footer>
    </div>
  );
};

export default CarboidratosHipertrofia;