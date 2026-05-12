import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-proteina-hero.jpg";

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

const ProteinaSuperavit = () => {
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
          Proteína & Superávit
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Comer proteína em excesso<br />
          <span className="text-muted-foreground">não engorda como você pensa.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Em treinados, o superávit calórico via proteína altera o particionamento de nutrientes — e a equação física não se quebra, ela se reescreve.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Proteína de alto valor biológico em prato cristalino" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          O erro não está em comer mais.{" "}
          <span className="text-foreground font-medium">Está em assumir que toda caloria se comporta igual.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Opinião controversa" title="Superávit com proteína: o paradoxo treinado.">
        <p>Muita gente escuta “superávit calórico” e assume que ganhar gordura é inevitável. Mas a literatura sobre superalimentação proteica em indivíduos treinados em musculação conta uma história diferente.</p>
        <p>Em vários estudos, aumentar calorias <span className="text-foreground font-medium">acima da manutenção</span> principalmente através da proteína resultou em pouco ou nenhum aumento de gordura corporal. Em alguns casos, os participantes <span className="text-foreground font-medium">perderam gordura</span> enquanto ganharam massa magra.</p>
        <p className="text-[14px] opacity-70">Referências: PMIDs 24299050, 26500462, 22215165, 29405780.</p>
      </Section>

      <Section number="02" kicker="Termodinâmica" title="Isso quebra calorias que entram vs. saem? Não.">
        <p>“Calorias in vs. calorias out” continua valendo. O que muda é o lado direito da equação — o gasto energético — quando a proteína domina o superávit.</p>
        <p className="text-foreground font-medium">A proteína altera ativamente o balanço, ela não o ignora.</p>
      </Section>

      <Section number="03" kicker="Fisiologia da proteína" title="Por que sobra proteína não vira gordura na mesma proporção.">
        <div className="grid gap-4">
          {[
            ["Efeito térmico (TEF)", "A proteína tem o maior custo metabólico de digestão entre os macronutrientes — cerca de 20–30% das calorias ingeridas são gastas para processá-la."],
            ["Saciedade aumentada", "Reduz a fome subjetiva e a ingestão espontânea em refeições subsequentes, modulando o comportamento alimentar."],
            ["NEAT espontâneo", "Eleva o gasto energético de atividades não-exercício (movimentar-se, gesticular, manter postura), aumentando o consumo total."],
            ["Particionamento", "Em presença de treino resistido, o excedente é direcionado preferencialmente à síntese proteica muscular, não ao tecido adiposo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-foreground font-medium">Nem todo superávit calórico se comporta igual fisiologicamente.</p>
      </Section>

      <Section number="04" kicker="Estudo-chave" title="Antonio et al., 2014 — 4,4 g/kg/dia.">
        <p>“Os efeitos do consumo de uma dieta hiperproteica (4,4 g/kg/dia) sobre a composição corporal em indivíduos treinados em musculação.” — Jose Antonio et al., <em>Journal of the International Society of Sports Nutrition</em>, 2014. PMID: 24834017.</p>
        <div className="grid gap-4">
          {[
            ["A intervenção", "Treinados consumiram 5,5× a recomendação diária de proteína mantendo o mesmo treino."],
            ["O resultado", "Sem efeito negativo sobre a composição corporal. Sem aumento de gordura, mesmo em superávit calórico significativo."],
            ["O ineditismo", "Foi o primeiro estudo intervencional a demonstrar que uma dieta hipercalórica rica em proteína não resultou em ganho de gordura."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="O que isso significa" title="Reescrevendo a regra prática.">
        <div className="grid gap-4">
          {[
            ["Para ganho de massa magra", "Priorize proteína acima do mínimo (2.0–2.4 g/kg) com treino de força bem estruturado. O superávit cumpre seu papel sem custo estético."],
            ["Para recomposição", "Manter aporte proteico elevado mesmo fora do bulk preserva o particionamento favorável e protege o músculo em qualquer fase."],
            ["Para iniciantes", "A janela anabólica do destreinado, somada ao TEF e à saciedade, torna o erro de cálculo calórico muito mais perdoável."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-foreground font-medium">Não é licença para excesso. É leitura técnica de um macronutriente que se comporta de forma única.</p>
      </Section>

      <Section number="06" kicker="Tópicos para discussão" title="A pauta que se abre a partir daqui.">
        <ul className="space-y-3 list-disc pl-5">
          <li>Excesso de proteína e ganho de gordura.</li>
          <li>Frequência alimentar.</li>
          <li>Leucina e crescimento muscular.</li>
          <li>Hormônio do crescimento.</li>
          <li>Volume de treino.</li>
          <li>Refeeds e pausas da dieta.</li>
          <li>Mulheres devem treinar diferente dos homens?</li>
          <li>Wearables vs. percepção subjetiva.</li>
          <li>Lesões e ajustes no treino.</li>
        </ul>
      </Section>

      <Section number="07" kicker="Referências" title="Evidência científica.">
        <ul className="space-y-3 list-disc pl-5">
          <li><span className="text-foreground font-medium">Antonio J. et al. (2014)</span> — “The effects of a high protein diet (4.4 g/kg/d) on body composition in resistance-trained individuals.” JISSN. PMID: 24834017.</li>
          <li><span className="text-foreground font-medium">PMID: 24299050</span> — Superalimentação com proteína em treinados.</li>
          <li><span className="text-foreground font-medium">PMID: 26500462</span> — Composição corporal e ingestão proteica elevada.</li>
          <li><span className="text-foreground font-medium">PMID: 22215165</span> — Particionamento de nutrientes em superávit.</li>
          <li><span className="text-foreground font-medium">PMID: 29405780</span> — Efeitos da proteína na termogênese e composição.</li>
        </ul>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Mais músculo.<br />Menos achismo.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Construa sua estratégia proteica com a consultoria STH METHOD.
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
          Conteúdo informativo técnico. Decisões nutricionais devem ser conduzidas com acompanhamento profissional individualizado.
        </p>
      </footer>
    </div>
  );
};

export default ProteinaSuperavit;