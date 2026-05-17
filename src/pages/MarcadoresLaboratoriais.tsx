import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-marcadores-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

type Marker = { name: string; desc?: string; bullets?: string[] };

const Section = ({
  number,
  kicker,
  title,
  intro,
  markers,
}: {
  number: string;
  kicker: string;
  title: string;
  intro?: string;
  markers: Marker[];
}) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    variants={fadeUp}
    className="py-20 md:py-28 border-t border-border/40"
  >
    <div className="max-w-2xl mx-auto px-6">
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
        {number} — {kicker}
      </p>
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-8 leading-[1.05]">
        {title}
      </h2>
      {intro && (
        <p className="text-[17px] leading-[1.6] text-muted-foreground font-light mb-10">{intro}</p>
      )}
      <div className="grid gap-4">
        {markers.map((m) => (
          <div key={m.name} className="py-5 border-t border-border/40">
            <p className="text-foreground font-medium text-base mb-1">{m.name}</p>
            {m.desc && (
              <p className="text-[15px] text-muted-foreground font-light leading-[1.55]">{m.desc}</p>
            )}
            {m.bullets && (
              <ul className="mt-3 space-y-1.5 list-disc pl-5 text-[15px] text-muted-foreground font-light">
                {m.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  </motion.section>
);

const MarcadoresLaboratoriais = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const BackIcon = isStudent ? Home : ArrowLeft;

  const pageUrl = "https://sthmethod.com.br/tendencias/marcadores-laboratoriais";
  const pageTitle = "Marcadores Laboratoriais — Monitoramento estratégico | STH METHOD";
  const pageDesc =
    "Guia completo de marcadores laboratoriais para usuários de hormônios e anabolizantes: eixo hormonal, cardiovascular, hepático, renal, glicêmico, inflamação e eletrólitos.";
  const ogImage = "https://sthmethod.com.br/og-marcadores-laboratoriais.jpg";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Marcadores laboratoriais: monitoramento estratégico para usuários de hormônios e anabolizantes",
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
      { "@type": "ListItem", position: 2, name: "Marcadores Laboratoriais", item: pageUrl },
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
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">
                Voltar
              </Button>
            </Link>
          ) : (
            <Link to="/cadastro">
              <Button size="sm" className="text-[11px] h-7 rounded-full bg-foreground text-background hover:bg-foreground/90">
                Começar
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 text-center px-6">
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Guia técnico · Laboratorial
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Marcadores laboratoriais.<br />
          <span className="text-muted-foreground">Monitoramento estratégico.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          O acompanhamento de quem utiliza hormônios e anabolizantes não pode focar apenas em testosterona. Ciência, prevenção e estratégia.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Tubos de coleta laboratorial sobre superfície escura" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight">
          A utilização de hormônios anabolizantes altera múltiplos sistemas do organismo.{" "}
          <span className="text-foreground font-medium">
            O monitoramento correto envolve eixo hormonal, cardiovascular, hepático, renal, glicêmico, inflamatório, eletrolítico e viscosidade sanguínea.
          </span>
        </motion.p>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10">
          <Link to="/triagem-marcadores">
            <Button size="lg" className="rounded-full px-8">
              Gerar minha tabela personalizada
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3 font-light">
            Ferramenta gratuita • Resposta em menos de 2 minutos
          </p>
        </motion.div>
      </section>

      <Section
        number="01"
        kicker="Eixo Hormonal"
        title="A base de toda análise."
        markers={[
          {
            name: "Testosterona Total",
            desc: "Avalia a quantidade total de testosterona circulante. Pode sofrer influência de:",
            bullets: ["SHBG", "obesidade", "resistência insulínica", "hormônios utilizados"],
          },
          {
            name: "Testosterona Livre",
            desc: "Representa a fração biologicamente ativa da testosterona. Importante para:",
            bullets: ["libido", "recuperação", "performance", "composição corporal"],
          },
          {
            name: "SHBG",
            desc: "Proteína transportadora de hormônios sexuais. Impacta diretamente a testosterona livre. Níveis baixos podem ocorrer em:",
            bullets: ["resistência insulínica", "obesidade", "uso de androgênios"],
          },
          {
            name: "Estradiol",
            desc: "Hormônio essencial para saúde cardiovascular, libido, articulações e sensibilidade à insulina. Tanto excesso quanto deficiência podem gerar problemas.",
          },
          {
            name: "LH",
            desc: "Hormônio sinalizador da produção natural de testosterona. Frequentemente suprimido durante utilização exógena.",
          },
          {
            name: "FSH",
            desc: "Relacionado à função testicular e fertilidade. Importante em estratégias de recuperação hormonal.",
          },
          {
            name: "Prolactina",
            desc: "Pode impactar libido, ereção, humor e disposição. Alterações podem ocorrer com determinados compostos.",
          },
          {
            name: "DHT",
            desc: "Hormônio derivado da testosterona. Relaciona-se com:",
            bullets: ["acne", "oleosidade", "próstata", "queda capilar"],
          },
          {
            name: "Cortisol",
            desc: "Hormônio do estresse. Importante para avaliar:",
            bullets: ["recuperação", "fadiga", "excesso de treinamento", "privação de sono"],
          },
        ]}
      />

      <Section
        number="02"
        kicker="Tireoide"
        title="Metabolismo e energia."
        markers={[
          { name: "TSH", desc: "Marcador regulador da tireoide." },
          { name: "T4 Livre", desc: "Hormônio tireoidiano circulante." },
          {
            name: "T3 Livre",
            desc: "Forma metabolicamente mais ativa da tireoide. Relacionada com:",
            bullets: ["metabolismo", "energia", "temperatura corporal", "disposição"],
          },
        ]}
      />

      <Section
        number="03"
        kicker="Saúde Cardiovascular"
        title="O risco que ninguém pode ignorar."
        markers={[
          { name: "Colesterol Total", desc: "Visão geral do perfil lipídico." },
          { name: "HDL", desc: "Relaciona-se ao transporte reverso de colesterol. Frequentemente reduzido com utilização de anabolizantes." },
          { name: "LDL", desc: "Marcador importante para avaliação cardiovascular." },
          { name: "Não-HDL", desc: "Representa partículas aterogênicas totais." },
          {
            name: "Triglicerídeos",
            desc: "Importantes para avaliação metabólica. Alterações podem indicar:",
            bullets: ["resistência insulínica", "excesso calórico", "baixa sensibilidade metabólica"],
          },
          { name: "ApoB", desc: "Um dos principais marcadores modernos de risco cardiovascular. Representa o número de partículas potencialmente aterogênicas." },
          { name: "ApoA1", desc: "Associada ao HDL e proteção cardiovascular." },
          { name: "Lipoproteína(a)", desc: "Marcador genético relacionado ao risco cardiovascular." },
          { name: "PCR ultrassensível", desc: "Marcador de inflamação sistêmica." },
          { name: "Homocisteína", desc: "Associada à saúde vascular e cardiovascular." },
        ]}
      />

      <Section
        number="04"
        kicker="Controle Glicêmico e Metabólico"
        title="Sensibilidade e regulação."
        markers={[
          { name: "Glicemia de jejum", desc: "Avalia níveis de glicose em jejum." },
          { name: "Insulina de jejum", desc: "Importante para análise de sensibilidade à insulina." },
          { name: "Hemoglobina glicada (HbA1c)", desc: "Mostra a média glicêmica dos últimos meses." },
        ]}
      />

      <Section
        number="05"
        kicker="Função Hepática"
        title="Filtro central do organismo."
        markers={[
          { name: "AST / TGO", desc: "Enzima relacionada ao fígado e musculatura. Pode elevar-se após treinos intensos." },
          { name: "ALT / TGP", desc: "Marcador hepático importante." },
          { name: "GGT", desc: "Marcador importante para avaliação hepática e colestase." },
          { name: "Fosfatase alcalina", desc: "Relacionada ao fluxo biliar." },
          { name: "Bilirrubinas", desc: "Importantes para avaliação hepática e biliar." },
          {
            name: "Albumina",
            desc: "Proteína produzida pelo fígado. Relaciona-se com:",
            bullets: ["estado nutricional", "síntese hepática", "hidratação"],
          },
        ]}
      />

      <Section
        number="06"
        kicker="Função Renal"
        title="Filtração e equilíbrio."
        markers={[
          {
            name: "Creatinina",
            desc: "Marcador renal amplamente utilizado. Pode sofrer influência de:",
            bullets: ["massa muscular", "creatina", "hidratação"],
          },
          { name: "Ureia", desc: "Relacionada ao metabolismo proteico e hidratação." },
          { name: "Cistatina C", desc: "Marcador renal moderno menos dependente de massa muscular." },
          { name: "eGFR / TFG estimada", desc: "Estimativa da função renal." },
        ]}
      />

      <Section
        number="07"
        kicker="Eletrólitos e Performance"
        title="O equilíbrio invisível."
        markers={[
          {
            name: "Sódio",
            desc: "Importante para:",
            bullets: ["hidratação", "pressão arterial", "função neuromuscular"],
          },
          {
            name: "Potássio",
            desc: "Essencial para:",
            bullets: ["contração muscular", "função cardíaca", "equilíbrio eletrolítico"],
          },
          {
            name: "Magnésio",
            desc: "Relaciona-se com:",
            bullets: ["recuperação", "sono", "contração muscular", "sensibilidade à insulina"],
          },
        ]}
      />

      <Section
        number="08"
        kicker="Hemograma Completo"
        title="Viscosidade sanguínea sob controle."
        intro="Avalia hemoglobina, hematócrito, viscosidade sanguínea, glóbulos brancos e plaquetas. Muito importante para usuários de testosterona e anabolizantes devido ao risco de aumento excessivo do hematócrito."
        markers={[
          { name: "Hemoglobina", desc: "Capacidade de transporte de oxigênio." },
          { name: "Hematócrito", desc: "Proporção de células no volume sanguíneo — risco direto de viscosidade aumentada." },
          { name: "Glóbulos brancos", desc: "Resposta imunológica e inflamatória." },
          { name: "Plaquetas", desc: "Coagulação e integridade vascular." },
        ]}
      />

      <Section
        number="09"
        kicker="Importante"
        title="Nenhum marcador isolado conta a história inteira."
        intro="A análise correta depende de contexto clínico e variáveis individuais."
        markers={[
          {
            name: "Variáveis que entram na leitura",
            bullets: [
              "contexto clínico",
              "sintomas",
              "compostos utilizados",
              "tempo de uso",
              "pressão arterial",
              "composição corporal",
              "histórico familiar",
              "estilo de vida",
            ],
          },
        ]}
      />

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <p className="text-[12px] font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
            STH METHOD
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Performance, saúde<br />e estratégia.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Monitoramento inteligente não é paranoia. É gestão de risco baseada em dados.
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
          Conteúdo informativo técnico. Decisões clínicas e laboratoriais devem ser conduzidas com acompanhamento profissional individualizado.
        </p>
      </footer>
    </div>
  );
};

export default MarcadoresLaboratoriais;