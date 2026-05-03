import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-bfalto-hero.jpg";
import aromataseImg from "@/assets/sthnews-bfalto-aromatase.jpg";
import hormoniosImg from "@/assets/sthnews-bfalto-hormonios.jpg";
import examesImg from "@/assets/sthnews-bfalto-exames.jpg";
import cardioImg from "@/assets/sthnews-bfalto-cardio.jpg";
import fisicoImg from "@/assets/sthnews-bfalto-fisico.jpg";

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

const HormoniosBfAlto = () => {
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
            <Link to="/cadastro"><Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">Quero a verdade</Button></Link>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-primary mb-6">
          Exclusivo · Hormônios & BF alto
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O fim do mito: <br />
          <span className="text-muted-foreground">hormônio com sobrepeso.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          Não é proibido. É cirúrgico. Quando bem conduzido, vira ferramenta de resgate metabólico — não risco.
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
          A "mística" de que <span className="text-primary">BF acima de 15%</span> não pode usar Nandrolona ou Testosterona ignora o que importa: <span className="text-primary">controle enzimático</span> e leitura do painel hormonal.
        </motion.p>
      </section>

      <Section number="01" kicker="Fim do mito" title="Não é o hormônio. É a aromatase."
        image={aromataseImg} alt="Tecido adiposo em vidro com molécula neon verde">
        <p>Sobrepeso e obesidade geram um ambiente de <span className="text-foreground font-medium">inflamação crônica</span> e baixa testosterona — o chamado hipogonadismo funcional.</p>
        <p>O problema real não é o hormônio em si: é a <span className="text-foreground font-medium">enzima aromatase</span> presente no tecido adiposo, que converte testosterona em estradiol (E2). Mais gordura, mais aromatização.</p>
        <p>A solução STH não é proibir. É <span className="text-foreground font-medium">ajustar inibidores de aromatase</span> (Anastrozol) e controlar a prolactina (Cabergolina) de acordo com o volume de gordura. O hormônio entra para preservar a massa magra — seu motor de queima — enquanto o déficit calórico foca a gordura.</p>
      </Section>

      <Section number="02" kicker="Protocolo cirúrgico" title="Dose proporcional, manejo enzimático."
        image={hormoniosImg} alt="Frascos de vidro de hormônios com destaque verde neon">
        <p>Tratar sobrepeso com suporte hormonal é o que chamamos de <span className="text-foreground font-medium">Protocolo de Controle Dinâmico</span>.</p>
        <div className="grid gap-4 pt-4">
          {[
            { name: "Dose proporcional", desc: "Ajustadas para manter o anabolismo enquanto o corpo queima gordura — não para 'explodir' músculo." },
            { name: "Manejo enzimático", desc: "Uso preventivo de protetores para que o excesso de gordura não transforme o ciclo em mar de estrogênio." },
            { name: "Segurança cardiovascular", desc: "Tadalafila e Ômega-3 para proteção endotelial — viscosidade sanguínea controlada." },
          ].map((e) => (
            <div key={e.name} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{e.name}</p>
              <p className="text-[15px]">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Eixo hormonal" title="O raio-X que define a segurança."
        image={examesImg} alt="Tubos de exame com destaque neon verde">
        <p>Sem leitura do painel completo, é tiro no escuro. A assertividade nasce do cruzamento entre eixo hormonal e marcadores metabólicos.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Testo Total e Livre / SHBG", "Garantem que o hormônio está agindo no receptor, não preso no sangue."],
            ["Estradiol (E2) e DHT", "O equilíbrio define ereção, densidade e ausência de ginecomastia."],
            ["Insulina, HbA1c, HOMA-IR", "Insulina alta trava lipólise. O hormônio melhora a sensibilidade — se a dieta acompanhar."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="Saúde sistêmica" title="Combustível, fígado, rim e coração."
        image={cardioImg} alt="Coração de vidro com pulso neon verde">
        <p>Performance é o subproduto da saúde. Sem esses pilares, o protocolo trava — e o sintoma vira fadiga, queda de libido e platô.</p>
        <div className="grid gap-4 pt-4">
          {[
            ["B12, D3, Ferro, Ferritina", "Os combustíveis da disposição. Sem eles, fadiga e queda de performance."],
            ["Perfil lipídico", "Monitoramento obrigatório — Nandrolona impacta HDL."],
            ["Renais (Creatinina, TFG, Ureia)", "Garantem segurança da hidratação e da carga proteica."],
            ["Hepáticos (TGP, TGO, GGT)", "Proteção do laboratório central do corpo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Conclusão" title="Doença metabólica exige inteligência, não medo."
        image={fisicoImg} alt="Torso masculino com contorno neon verde">
        <p>A obesidade é uma <span className="text-foreground font-medium">doença metabólica</span>. Quando exames mostram deficiências e metabolismo lento, o ajuste hormonal — feito com maestria e doses adequadas — <span className="text-foreground font-medium">acelera a recuperação da saúde</span>.</p>
        <p>O uso de Nandrolona e Testosterona em indivíduos com BF mais alto, acompanhado por exames + dieta + fármacos auxiliares, deixa de ser risco e passa a ser <span className="text-foreground font-medium">estratégia de alta performance para a saúde</span>.</p>
        <p className="text-foreground font-medium pt-2">Você perde gordura com segurança, sem perder libido e sem sofrer com fadiga.</p>
      </Section>

      {/* CTA */}
      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Quer saber a verdade <br />
            <span className="text-muted-foreground">sobre o seu cenário?</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Leitura clínica do seu painel hormonal e ajuste fino do protocolo — mesmo com BF alto.
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

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Esta análise é estritamente informativa. Substâncias ergogênicas devem ser conduzidas sob supervisão estrita de endocrinologista ou médico do esporte.
        </p>
      </footer>
    </div>
  );
};

export default HormoniosBfAlto;