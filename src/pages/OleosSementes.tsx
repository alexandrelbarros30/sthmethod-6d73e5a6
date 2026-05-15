import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-oleos-sementes-hero.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } } };

const Section = ({ number, kicker, title, children }: { number: string; kicker: string; title: string; children: React.ReactNode }) => (
  <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="py-20 md:py-32 border-t border-border/40">
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">{number} — {kicker}</p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-10 leading-[1.05]">{title}</h2>
    </div>
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">{children}</div>
  </motion.section>
);

const OleosSementes = () => {
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
          Óleos de sementes
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Você foi enganado<br />
          <span className="text-muted-foreground">sobre os óleos de sementes.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Eles não são automaticamente inflamatórios. O contexto da dieta importa muito mais do que o óleo isolado.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Óleo de semente sendo despejado em proveta de vidro" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          Sozinhos, os óleos de sementes não parecem aumentar inflamação de forma relevante em humanos.{" "}
          <span className="text-foreground font-medium">O problema é o ecossistema alimentar inteiro.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="O cenário real" title="O óleo isolado não é o vilão.">
        <p>Quando comparados caloria por caloria com gordura saturada, os óleos de sementes frequentemente mostram efeito <span className="text-foreground font-medium">neutro ou até levemente benéfico</span> em marcadores inflamatórios.</p>
        <p>O problema começa quando coexistem:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>⚠️ excesso calórico</li>
          <li>⚠️ ganho excessivo de gordura corporal</li>
          <li>⚠️ dieta baseada em ultraprocessados</li>
          <li>⚠️ sedentarismo</li>
        </ul>
        <p>Porque o excesso de gordura corporal é, por si só, pró-inflamatório.</p>
      </Section>

      <Section number="02" kicker="O que a literatura mostra" title="Efeito neutro — e às vezes benéfico.">
        <p>Alguns estudos com óleos de sementes em substituição à gordura saturada demonstram:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>📉 redução de gordura no fígado</li>
          <li>📉 redução do colesterol LDL</li>
          <li>📉 melhora do risco cardiovascular</li>
        </ul>
        <p className="text-[14px] opacity-70">Referências: PMID 28752873 — Dietary linoleic acid intake and blood inflammatory markers. PMID 22492369 — Effects of n-6 PUFAs compared with SFAs on liver fat, lipoproteins and inflammation.</p>
      </Section>

      <Section number="03" kicker="LDL oxidado" title="“Mas e o LDL oxidado?”">
        <p>É um dos argumentos mais usados contra os óleos de sementes. Os dados em humanos, porém, não sustentam esse medo tão bem quanto se imagina.</p>
        <p>Um estudo recente avaliou indivíduos consumindo cerca de <span className="text-foreground font-medium">30 g/dia de óleo de soja</span>. Resultado:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>✔️ sem aumento de marcadores inflamatórios</li>
          <li>✔️ sem aumento de LDL oxidado</li>
          <li>✔️ tendência de queda na IL-6</li>
          <li>✔️ redução do ácido araquidônico (AA)</li>
        </ul>
        <p className="text-[14px] opacity-70">Referência: PMID 41695083 — Foods Fortified with Soybean or Palm Oil Show No Effect on Inflammatory Markers.</p>
      </Section>

      <Section number="04" kicker="Mecanismo" title="O LDL não oxida flutuando no sangue.">
        <p>A oxidação do LDL ocorre principalmente <span className="text-foreground font-medium">depois que ele entra na parede arterial</span>. O fator central, então, passa a ser a quantidade total de LDL circulante.</p>
        <div className="grid gap-4">
          {[
            ["Mais gordura saturada", "→ mais LDL → maior entrada na parede arterial → maior potencial de oxidação."],
            ["Mais gorduras poli-insaturadas", "→ menor LDL → menor entrada → menor formação de LDL oxidado."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Sem licença para excesso" title="Isso não significa carta branca.">
        <p>Não passa a ser verdade que:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>❌ qualquer óleo vegetal seja saudável em qualquer contexto</li>
          <li>❌ ultraprocessados ricos nesses óleos sejam “fitness”</li>
          <li>❌ estabilidade térmica seja irrelevante</li>
          <li>❌ fritura infinita seja metabolicamente neutra</li>
        </ul>
        <p>Existe uma diferença gigantesca entre azeite e óleos usados dentro de uma alimentação equilibrada e o cenário fast food + ultraprocessados + excesso calórico. Misturar essas duas coisas na mesma discussão gera ruído.</p>
      </Section>

      <Section number="06" kicker="O que pesa mais" title="O ecossistema alimentar inteiro.">
        <p>O cenário mais consistente na literatura atual aponta que os fatores abaixo impactam <span className="text-foreground font-medium">muito mais</span> a inflamação sistêmica do que demonizar gorduras poli-insaturadas isoladamente:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>excesso calórico</li>
          <li>obesidade</li>
          <li>baixa ingestão de fibras</li>
          <li>sedentarismo</li>
          <li>ultraprocessados em excesso</li>
        </ul>
      </Section>

      <Section number="07" kicker="Conceitos rápidos" title="Mapa das gorduras.">
        <div className="grid gap-4">
          {[
            ["🌻 Óleos de sementes", "Soja, milho, canola, girassol e cártamo."],
            ["🌻 Gorduras poli-insaturadas", "Ômega-3 e ômega-6."],
            ["🥑 Gorduras monoinsaturadas", "Azeite de oliva e abacate."],
            ["🥩 Gorduras saturadas", "Manteiga, gordura animal e óleo de coco."],
            ["🐟 Ômega-3", "Mais associado a efeitos anti-inflamatórios."],
            ["🌽 Ômega-6", "Necessário ao corpo. O excesso relativo, dentro de dietas ruins, pode favorecer vias inflamatórias em alguns contextos."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="08" kicker="Exemplo prático" title="Mesmo óleo, contextos opostos.">
        <div className="grid gap-4">
          {[
            ["🥗 Pessoa ativa, magra, alimentação equilibrada", "Usa óleos de sementes moderadamente. Impacto provavelmente mínimo ou neutro."],
            ["🍟 Dieta baseada em fritura, fast food e ultraprocessados", "Inflamação, resistência à insulina e piora metabólica podem subir muito. O problema raramente é o óleo isolado — é o ecossistema."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="09" kicker="Referências" title="Evidência científica.">
        <ul className="space-y-3 list-disc pl-5">
          <li><span className="text-foreground font-medium">PMID 28752873</span> — Dietary linoleic acid intake and blood inflammatory markers.</li>
          <li><span className="text-foreground font-medium">PMID 22492369</span> — Effects of n-6 PUFAs compared with SFAs on liver fat, lipoproteins and inflammation.</li>
          <li><span className="text-foreground font-medium">PMID 41695083</span> — Foods Fortified with Soybean or Palm Oil Show No Effect on Inflammatory Markers.</li>
        </ul>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Menos pânico.<br />Mais leitura técnica.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Estratégia nutricional individualizada com a consultoria STH METHOD.
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

export default OleosSementes;