import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-gineco-hero.jpg";
import aromataseImg from "@/assets/sthnews-gineco-aromatase.jpg";
import anabolizantesImg from "@/assets/sthnews-gineco-anabolizantes.jpg";
import examesImg from "@/assets/sthnews-gineco-exames.jpg";
import tratamentoImg from "@/assets/sthnews-gineco-tratamento.jpg";
import fisicoImg from "@/assets/sthnews-gineco-fisico.jpg";

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
      <p className="text-[11px] font-medium tracking-[0.2em] text-primary uppercase mb-4">
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

const Ginecomastia = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
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
            <Link to="/cadastro"><Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Quero a verdade</Button></Link>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Exclusivo · Ginecomastia
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O caroço silencioso <br />
          <span className="text-muted-foreground">que trava sua definição.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Ginecomastia não é estética. É o termômetro do seu equilíbrio hormonal — e o freio invisível dos seus resultados.
        </motion.p>
      </section>

      {/* HERO IMAGE */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Esfera de vidro com torso esculpido e neon verde" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      {/* LEAD */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Para quem busca alta performance, entender essa engrenagem é a diferença entre <span className="text-primary">progredir</span> e <span className="text-primary">retroceder</span>. A ginecomastia afeta estética, autoconfiança e equilíbrio hormonal — tudo ao mesmo tempo.
        </motion.p>
      </section>

      <Section number="01" kicker="O que é" title="O caroço atrás da aréola tem nome."
        image={aromataseImg} alt="Estrutura molecular de estradiol em vidro com neon verde">
        <p>Ginecomastia é o desenvolvimento <span className="text-foreground font-medium">benigno do tecido glandular mamário</span> em homens. Acontece pelo desequilíbrio entre andrógenos (testosterona) e estrógenos (estradiol).</p>
        <p>Quando a testosterona sobe demais, o corpo converte o excesso em estradiol via <span className="text-foreground font-medium">enzima aromatase</span>. O resultado começa como sensibilidade ou "coceira" no mamilo e evolui para um caroço endurecido e doloroso atrás da aréola.</p>
        <p>Não confunda com lipomastia — esta é apenas acúmulo de gordura. A glândula é estrutura. E estrutura, uma vez formada, raramente regride sozinha.</p>
      </Section>

      <Section number="02" kicker="Anabolizantes" title="Dois caminhos. O mesmo destino."
        image={anabolizantesImg} alt="Frascos de vidro com líquido cristalino e detalhe neon verde">
        <p>Os esteroides causam ginecomastia por dois mecanismos principais — e ignorar qualquer um deles compromete todo o protocolo.</p>
        <div className="grid gap-4 pt-4">
          {[
            { name: "Via aromatização (Estradiol)", desc: "Testosterona (Enantato, Cipionato, Durateston), Dianabol e Boldenona — convertem em estradiol e disparam o crescimento glandular." },
            { name: "Via progestina (Prolactina)", desc: "Deca-Durabolin (Nandrolona), Trembolona e Hemogenin — aumentam a sensibilidade dos receptores mesmo com E2 controlado." },
            { name: "Genética", desc: "Maior densidade de receptores ou aromatase mais ativa: ginecomastia mesmo em doses baixas." },
          ].map((e) => (
            <div key={e.name} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{e.name}</p>
              <p className="text-[15px]">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Exames e biotipo" title="Sem leitura, é tiro no escuro."
        image={examesImg} alt="Tubos de exame hormonal sobre superfície escura">
        <p>O denominador comum é a <span className="text-foreground font-medium">homeostase hormonal</span>. Se um pilar falha, o sistema desmorona.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Testo Total e Livre", "Níveis elevados aumentam o substrato disponível para aromatização."],
            ["Estradiol (E2)", "O principal vilão. Alto em relação à testo, a glândula cresce."],
            ["Prolactina", "Elevada por 19-nor (Trembo/Deca). Causa secreção e potencializa o E2."],
            ["DHT", "Geralmente protege — compete com o E2 no receptor."],
            ["SHBG", "Baixo (comum com Masteron) sobra mais testo livre para aromatizar."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="pt-4">Endomorfos com maior percentual de gordura possuem mais tecido adiposo — e é nele que reside a aromatase. <span className="text-foreground font-medium">Mais gordura, mais aromatização.</span></p>
      </Section>

      <Section number="04" kicker="Tratamento" title="A causa define o medicamento."
        image={tratamentoImg} alt="Cápsula de vidro partida com líquido neon verde">
        <p>Não existe protocolo único. O ajuste é cirúrgico — depende do que está desregulado.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Estradiol alto", "Anastrozol / Letrozol — Inibidores de Aromatase: impedem a criação do estrogênio."],
            ["Tecido já formado", "Tamoxifeno — SERM: bloqueia o receptor de estrogênio na glândula."],
            ["Prolactina alta", "Cabergolina — agonista dopaminérgico que reduz a prolactina."],
            ["DHT baixo", "Proviron / Masteron — aumentam o drive androgênico para equilibrar o E2."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="O custo invisível" title="O freio de mão da sua definição."
        image={fisicoImg} alt="Torso muscular esculpido com contorno neon verde">
        <p><span className="text-foreground font-medium">Na perda de gordura.</span> E2 alto causa retenção hídrica severa, facilita o acúmulo em padrão feminino (quadril e flancos) e dificulta a lipólise.</p>
        <p><span className="text-foreground font-medium">Na hipertrofia.</span> Excesso de estrogênio e prolactina gera fadiga, letargia e reduz a força. O ambiente inflamatório desvia o foco da construção muscular para a gestão do desequilíbrio sistêmico.</p>
        <p className="text-foreground font-medium pt-2">Não adianta dose alta de Trembolona ou Masteron se Anastrozol e Cabergolina não estiverem ajustados.</p>
        <p>Controlar a ginecomastia é, na prática, controlar a sua definição muscular e a sua potência sexual.</p>
      </Section>

      {/* CTA */}
      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Quer saber a verdade <br />
            <span className="text-muted-foreground">sobre o seu cenário?</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Leitura clínica do seu painel hormonal e ajuste fino do protocolo.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Quero meu check-up hormonal
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* FOOTER NOTE */}
      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Esta análise é estritamente informativa. Substâncias ergogênicas devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default Ginecomastia;