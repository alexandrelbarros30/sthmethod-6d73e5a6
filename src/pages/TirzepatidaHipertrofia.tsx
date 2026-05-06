import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-tirzepatida-hero.jpg";
import bodyImg from "@/assets/sthnews-recomposicao-corporal.jpg";
import labImg from "@/assets/sthnews-monitoramento-clinico.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };

const Section = ({ number, kicker, title, image, alt, children }: { number: string; kicker: string; title: string; image?: string; alt?: string; children: React.ReactNode }) => (
  <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 md:py-32 border-t border-border/40">
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">{number} — {kicker}</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">{title}</h2>
    </div>
    {image && (
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
          <img src={image} alt={alt || title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    )}
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">{children}</div>
  </motion.section>
);

const TirzepatidaHipertrofia = () => {
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
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Tirzepatida & Hipertrofia
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Hipertrofiar com Tirzepatida.<br />
          <span className="text-muted-foreground">Sim, é possível.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          A Tirzepatida tratada como moduladora de eficiência metabólica — não como simples emagrecedor. O protocolo que evita sarcopenia.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Tirzepatida — agonista duplo GLP-1 + GIP" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          O erro mais comum não é a substância.{" "}
          <span className="text-foreground font-medium">É o protocolo que ignora a massa magra.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Recomposição" title="Tirzepatida e hipertrofia: o caminho." image={bodyImg} alt="Recomposição corporal">
        <p>A Tirzepatida não impede o anabolismo, mas o torna mais difícil — devido ao déficit calórico severo e à redução do apetite induzida pelo fármaco.</p>
        <p className="text-foreground font-medium">O segredo: aporte proteico mínimo de 2.2 g/kg e treino de força de alta intensidade.</p>
        <p>A Tirzepatida mantém a insulina baixa, favorecendo a oxidação de gordura. O estímulo mecânico do treino e a proteína sinalizam a síntese muscular. O resultado é recomposição — e não simples emagrecimento.</p>
      </Section>

      <Section number="02" kicker="Estratégia anabólica" title="Andrógenos como proteção tecidual.">
        <p>Quando associamos hormônios anabolizantes (Testosterona, Oxandrolona, Primobolan) à Tirzepatida, criamos um cenário de proteção tecidual:</p>
        <div className="grid gap-4">
          {[
            ["Anticatabolismo", "Os andrógenos retêm nitrogênio no músculo, impedindo que o corpo queime massa magra para gerar energia durante o déficit."],
            ["Sinergia hormonal", "A Tirzepatida cuida da saúde metabólica e da queima de gordura. O recurso androgênico mantém densidade e tônus muscular."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-foreground font-medium">A estratégia de elite para transformar o físico sem aspecto flácido ou debilitado.</p>
      </Section>

      <Section number="03" kicker="Mecanismo dual" title="GLP-1 + GIP: o diferencial." image={heroImg} alt="Tirzepatida agonista duplo">
        <p>Diferente da Semaglutida, que atua apenas no receptor GLP-1, a Tirzepatida é um agonista duplo:</p>
        <div className="grid gap-4">
          {[
            ["GLP-1", "Reduz o esvaziamento gástrico, prolonga a saciedade e sinaliza ao cérebro para reduzir o consumo alimentar."],
            ["GIP", "Melhora a sensibilidade à insulina no tecido adiposo e muscular, reduz inflamação e protege as células beta do pâncreas. Permite uso eficiente da gordura estocada como combustível."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="Fisiologia aplicada" title="Por que obesos hipertrofiam e perdem gordura ao mesmo tempo.">
        <p>O fenômeno ocorre devido à alta disponibilidade de energia endógena:</p>
        <div className="grid gap-4">
          {[
            ["Reserva energética", "Indivíduos com alto percentual de gordura possuem milhares de calorias estocadas. Mesmo em déficit alimentar, há combustível de sobra para sustentar a construção muscular."],
            ["Reatividade ao estímulo", "Em iniciantes ou pessoas com sobrepeso retornando ao treino, o estímulo mecânico é tão novo que o corpo prioriza a adaptação muscular, usando a gordura para suprir a síntese proteica."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Saúde metabólica" title="Aplicação contra síndromes." image={labImg} alt="Acompanhamento clínico">
        <p>A Tirzepatida é uma ferramenta poderosa contra a síndrome metabólica:</p>
        <div className="grid gap-4">
          {[
            ["SOP — Síndrome dos Ovários Policísticos", "Reduz o hiperinsulinismo, diminui a produção de andrógenos ovarianos e contribui para restaurar a ovulação."],
            ["Diabetes tipo 2 e pré-diabetes", "Normaliza a glicemia e reduz a hemoglobina glicada de forma consistente."],
            ["Inflamação sistêmica", "Reduz marcadores inflamatórios como a PCR, melhorando a saúde cardiovascular e articular."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="Déficit energético" title="O certo vs. o equivocado.">
        <div className="grid gap-4">
          {[
            ["Proteína", "Correto: alta — preserva o músculo. Equivocado: baixa — perda severa de massa magra."],
            ["Energia", "Correto: suficiente para treinar pesado. Equivocado: letargia, tontura e desânimo."],
            ["Metabolismo", "Correto: termogênese adaptativa lenta, preservada. Equivocado: queda metabólica abrupta."],
            ["Hormônios", "Correto: modulados para proteção. Equivocado: queda de libido, tireoide e GH."],
            ["Resultado", "Correto: corpo denso e definido. Equivocado: corpo flácido e falsamente magro."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-foreground font-medium">Dica de mestre: monitore T3 livre e insulina. Se o T3 cair demais, o metabolismo trava. Se a insulina não cair, a gordura não sai.</p>
      </Section>

      <Section number="07" kicker="Referências" title="Evidência científica.">
        <ul className="space-y-3 list-disc pl-5">
          <li><span className="text-foreground font-medium">SURMOUNT-1 (2022)</span> — Eficácia da Tirzepatida na redução de peso e melhora metabólica. NEJM.</li>
          <li><span className="text-foreground font-medium">Jastreboff, A. M. et al. (2022)</span> — “Tirzepatide Once Weekly for the Treatment of Obesity”. NEJM.</li>
          <li><span className="text-foreground font-medium">Frias, J. P. et al. (2021)</span> — “Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes”. NEJM (SURPASS-2).</li>
          <li><span className="text-foreground font-medium">Bhasin, S. et al. (2001)</span> — Base sobre uso de andrógenos para anticatabolismo.</li>
        </ul>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Estratégia.<br />Monitoramento. Resultado.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Avaliação individual com a consultoria STH METHOD.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Começar agora
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo informativo técnico. Substâncias devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default TirzepatidaHipertrofia;