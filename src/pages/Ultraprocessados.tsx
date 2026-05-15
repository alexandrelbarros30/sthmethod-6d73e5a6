import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-ultraprocessados-hero.jpg";

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

const Ultraprocessados = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  const pageUrl = "https://sthmethod.com.br/tendencias/ultraprocessados-saude-mental";
  const pageTitle = "Ultraprocessados destroem a saúde mental? O que a ciência diz | STH News";
  const pageDesc = "Ultraprocessados estão associados a piores desfechos em saúde mental — mas associação não é causa. Veja o que pesa de verdade no eixo alimentação-cérebro.";
  const ogImage = "https://sthmethod.com.br/og-ultraprocessados.jpg";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Ultraprocessados não estão destruindo magicamente sua saúde mental",
    description: pageDesc,
    image: ogImage,
    author: { "@type": "Organization", name: "STH METHOD" },
    publisher: {
      "@type": "Organization",
      name: "STH METHOD",
      logo: { "@type": "ImageObject", url: "https://sthmethod.com.br/pwa-icon-192.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "STH News", item: "https://sthmethod.com.br/tendencias" },
      { "@type": "ListItem", position: 2, name: "Ultraprocessados e saúde mental", item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
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
          Opinião impopular
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Ultraprocessados não estão<br />
          <span className="text-muted-foreground">destruindo magicamente sua saúde mental.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Existe associação. Não há ingrediente tóxico mágico. Quem manda no resultado é o ecossistema alimentar inteiro.
        </motion.p>
      </section>

      <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Snacks ultraprocessados sobre superfície escura" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          Uma análise da Sapien Labs com mais de 300 mil adultos encontrou associação entre ultraprocessados e sintomas depressivos.{" "}
          <span className="text-foreground font-medium">Mas associação não é causa.</span>
        </motion.p>
      </section>

      <Section number="01" kicker="Epidemiologia, não causalidade" title="O que esses dados realmente mostram.">
        <p>São dados <span className="text-foreground font-medium">epidemiológicos</span>:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>📊 mostram associação</li>
          <li>❌ não comprovam causa direta</li>
        </ul>
        <p>Pessoas que consomem muitos ultraprocessados também tendem a praticar menos exercícios, ingerir mais calorias totais, apresentar maior obesidade e diabetes tipo 2, dormir pior, ter mais estresse, consumir menos proteína e fibras, menos frutas e vegetais, e possuir menor condição socioeconômica.</p>
        <p>Separar “o alimento” do restante do estilo de vida é muito mais difícil do que parece.</p>
      </Section>

      <Section number="02" kicker="Existe causalidade?" title="Provavelmente — mas sem ingrediente mágico.">
        <p>A qualidade da alimentação importa para a saúde geral, incluindo a mental. Mas não existe um <span className="text-foreground font-medium">“ingrediente tóxico mágico”</span> destruindo instantaneamente o cérebro das pessoas.</p>
        <p>O cenário mais consistente é indireto:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>🍟 ultraprocessados facilitam excesso calórico</li>
          <li>📈 aumentam ganho de gordura corporal</li>
          <li>🧠 obesidade impacta negativamente cognição e saúde mental</li>
        </ul>
      </Section>

      <Section number="03" kicker="Como agir" title="Princípios práticos.">
        <div className="grid gap-4">
          {[
            ["🥩 Proteína suficiente", "Base estrutural da composição corporal e da saciedade."],
            ["🥗 Fibras, frutas e vegetais em prioridade", "Densidade nutricional alta com baixa densidade calórica."],
            ["🍚 Alimentos minimamente processados como base", "A maior parte da rotina deve ser construída aqui."],
            ["🍕 Ultraprocessados ocasionalmente", "Sem paranoia. Sem terrorismo alimentar."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="04" kicker="O verdadeiro problema" title="Não é o processamento isolado.">
        <p>O problema é que ultraprocessados:</p>
        <ul className="space-y-2 list-none pl-0">
          <li>⚠️ são extremamente fáceis de hiperconsumir</li>
          <li>⚠️ costumam substituir alimentos mais nutritivos</li>
          <li>⚠️ favorecem excesso calórico passivamente</li>
        </ul>
        <p>Três variáveis raramente discutidas com o peso que merecem:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li>contexto importa</li>
          <li>quantidade importa</li>
          <li>padrão alimentar importa</li>
        </ul>
        <p>A internet adora transformar nutrição em terrorismo alimentar. Saúde metabólica raramente funciona em extremos.</p>
      </Section>

      <Section number="05" kicker="Exemplo prático" title="Mesmo alimento, contextos opostos.">
        <div className="grid gap-4">
          {[
            ["🥗 Pessoa ativa, com boa ingestão de proteína, fibras, frutas e vegetais", "Consumir ultraprocessados ocasionalmente provavelmente terá impacto pequeno."],
            ["🍟 Dieta baseada em fast food, excesso calórico, sedentarismo e baixa qualidade nutricional", "Risco metabólico e mental tende a subir bastante. O problema raramente é UM alimento — é o ecossistema."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="Referências" title="Evidência científica.">
        <ul className="space-y-3 list-disc pl-5">
          <li><span className="text-foreground font-medium">PMID 31069930</span> — Ultra-processed food consumption and adverse mental health outcomes.</li>
          <li><span className="text-foreground font-medium">PMID 35285920</span> — Ultra-processed foods and depressive symptoms.</li>
          <li><span className="text-foreground font-medium">BMJ 2024</span> — Associação entre ultraprocessados e desfechos em saúde (bmj-2023-077310).</li>
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

export default Ultraprocessados;
