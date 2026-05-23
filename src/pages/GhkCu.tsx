import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-ghkcu-hero.jpg";
import fibroImg from "@/assets/sthnews-ghkcu-fibroblast.jpg";
import skinImg from "@/assets/sthnews-ghkcu-skin.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const Section = ({
  number, kicker, title, image, alt, children,
}: { number: string; kicker: string; title: string; image?: string; alt?: string; children: React.ReactNode }) => (
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
    {image && (
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="rounded-3xl overflow-hidden bg-muted aspect-[16/10]">
          <img src={image} alt={alt || ""} className="w-full h-full object-cover" loading="lazy" />
        </div>
      </div>
    )}
    <div className="max-w-2xl mx-auto px-6 space-y-6 text-[17px] leading-[1.6] text-muted-foreground font-light">
      {children}
    </div>
  </motion.section>
);

const GhkCu = () => {
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
          GHK-Cu
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          O peptídeo-cobre <br />
          <span className="text-muted-foreground">sem perfume de vendedor.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          O que a literatura sustenta sobre o tripeptídeo-cobre — e onde o marketing força a barra.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Molécula GHK-Cu sobre pele" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          GHK-Cu é o complexo entre o tripeptídeo <span className="text-primary">Glicina–Histidina–Lisina</span> e o íon cobre Cu²⁺. Conhecido em cosméticos como Copper Tripeptide-1 — mas a história é bem maior que skincare.
        </motion.p>
      </section>

      <Section number="01" kicker="Origem" title="Não nasceu como peptídeo estético.">
        <p>Descrito por <span className="text-foreground font-medium">Loren Pickart em 1973</span>, o GHK foi inicialmente identificado como um pequeno fator no plasma humano ligado à modulação de crescimento e reparo celular.</p>
        <p>A investigação começou em plasma, envelhecimento celular, função hepática e regeneração tecidual. O eixo cosmético veio depois — e hoje monopoliza o discurso.</p>
      </Section>

      <Section number="02" kicker="Mecanismo" title="Um mensageiro de reparo — não cobre jogado no corpo."
        image={fibroImg} alt="Fibroblastos e matriz extracelular">
        <p>O GHK-Cu modula vias biológicas específicas. Ele sinaliza, não força:</p>
        <div className="grid gap-4 pt-4">
          {[
            ["Fibroblastos", "Estimula células produtoras de colágeno, elastina e glicosaminoglicanos."],
            ["Matriz extracelular", "Equilibra construção e remodelação. Pele jovem não é mais colágeno — é colágeno organizado."],
            ["Inflamação", "Ação anti-inflamatória e antioxidante em modelos celulares e animais."],
            ["Angiogênese e reparo", "Suporte a formação de vasos, reparo cutâneo, nervos e tecido conjuntivo."],
            ["Modulação gênica", "Influência ampla sobre expressão de genes ligados a reparo e regeneração. Aqui mora o fascínio — e o exagero."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="03" kicker="Química" title="A coordenação do cobre é o ponto-chave.">
        <p>O anel imidazol da histidina participa da ligação com Cu²⁺. O complexo GHK-Cu funciona como uma forma biologicamente mais <span className="text-foreground font-medium">organizada</span> de entregar e modular cobre em ambiente tecidual.</p>
        <p>Características importantes: molécula pequena, hidrofílica, com baixa penetração cutânea sem formulação adequada, sensível a pH, oxidação e interação com outros ativos.</p>
        <p>Tradução prática: <span className="text-foreground font-medium">formulação é tudo</span>. Um produto ruim com GHK-Cu é só um rótulo azul bonito com ciência tímida dentro.</p>
      </Section>

      <Section number="04" kicker="Farmacocinética" title="Meia-vida curta. Esqueça o discurso milagroso.">
        <p>Estimativas variam: revisões falam em <span className="text-foreground font-medium">menos de 30 minutos</span> em plasma para tripeptídeos; outras fontes citam de 1,5 a 2 horas.</p>
        <p>O ponto prático é o mesmo: o GHK-Cu é rapidamente degradado e clareado, especialmente em uso sistêmico. Isso enfraquece narrativas do tipo <span className="text-foreground font-medium">"aplica uma vez e o corpo inteiro regenera"</span>. A biologia não assina cheque em branco.</p>
      </Section>

      <Section number="05" kicker="Benefícios" title="Onde a evidência é forte — e onde é só promessa."
        image={skinImg} alt="Pele madura luminosa">
        <div className="grid gap-4 pt-2">
          {[
            ["Pele e textura ✅", "Firmeza, elasticidade, redução discreta de linhas finas, reparo de barreira, suporte em pele fotoenvelhecida. Estudos clínicos pequenos, mas com sinal consistente."],
            ["Cicatrização ✅", "Racional forte e dados promissores em feridas. Ainda falta o ensaio clínico grande que o transforme em padrão terapêutico."],
            ["Cabelo 🟡", "Coadjuvante em queda e afinamento. Não substitui investigação de ferritina, tireoide, hormônios e alopecia androgenética."],
            ["Anti-aging sistêmico ❌", "Sem base sólida em humanos. Marketing puro."],
            ["Performance e hipertrofia ❌", "Não há evidência robusta para recuperação muscular profunda ou regeneração de órgãos."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="Riscos" title="Tópico é uma conversa. Injetável é outra completamente.">
        <p><span className="text-foreground font-medium">Tópico:</span> em geral bem tolerado. Pode causar irritação, vermelhidão, ardência, dermatite de contato e sensibilidade quando combinado com ácidos fortes e retinoides.</p>
        <p><span className="text-foreground font-medium">Injetável:</span> alerta vermelho-neon. A FDA aponta preocupação com GHK-Cu injetável manipulado — risco de imunogenicidade por agregação, impurezas peptídicas e ausência de dados humanos robustos.</p>
        <p>Não dá para pegar um ativo cosmético promissor e transformar automaticamente em protocolo sistêmico seguro.</p>
      </Section>

      <Section number="07" kicker="Interações" title="O que evitar — e quando parar.">
        <p>Não existe mapa robusto de interações medicamentosas em humanos. Por lógica química e dermatológica, cuidado com:</p>
        <div className="grid gap-3 pt-4">
          {[
            "Ácidos fortes e vitamina C em pH muito baixo",
            "Retinoides fortes e peróxido de benzoíla no mesmo horário",
            "Excesso de suplementação de cobre sem necessidade",
            "Doença de Wilson e distúrbios do metabolismo do cobre",
            "Gestantes e lactantes sem orientação profissional",
            "Pele lesionada ou inflamada sem avaliação",
          ].map((t) => (
            <div key={t} className="py-3 border-t border-border/40 text-[15px]">{t}</div>
          ))}
        </div>
      </Section>

      <Section number="08" kicker="Uso responsável" title="A lógica por finalidade — sem prescrição.">
        <div className="grid gap-4 pt-2">
          {[
            ["Estética tópica", "Pele madura, textura, linhas finas, barreira cutânea, manutenção anti-idade. Começar com baixa frequência, observar tolerância, evitar misturar com ácidos fortes no mesmo horário, usar protetor solar e avaliar resposta em 8 a 12 semanas."],
            ["Capilar", "Coadjuvante para couro cabeludo e afinamento. Sempre investigando ferritina, tireoide, hormônios, estresse e padrão androgenético antes."],
            ["Cicatrização", "Potencial interessante, mas conduzido por profissional — especialmente em diabéticos, feridas crônicas, pós-operatório, imunossupressão e uso de corticoide."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="09" kicker="O que o marketing exagera" title="Quatro premissas fracas que circulam por aí.">
        <div className="grid gap-4 pt-2">
          {[
            ["“Aumenta colágeno, então rejuvenesce tudo.”", "Colágeno precisa de estímulo, organização, ambiente inflamatório adequado, nutrição, sono, fotoproteção e tempo."],
            ["“Se é natural no corpo, é seguro.”", "Naturalidade não define dose, via, pureza, estabilidade ou risco."],
            ["“Injetável é mais forte, então é melhor.”", "Injetável aumenta complexidade, risco de contaminação, imunogenicidade e ausência de dados clínicos robustos."],
            ["“Melhor que retinol e vitamina C.”", "Pode ser útil — mas retinoides e fotoproteção seguem com base clínica muito mais consolidada."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="10" kicker="Veredito STH METHOD" title="Peptídeo real. Não é molécula mágica.">
        <p>GHK-Cu é um peptídeo-cobre com ação sinalizadora ligada à <span className="text-foreground font-medium">reparação cutânea, remodelação da matriz extracelular, colágeno, elastina e modulação inflamatória</span>.</p>
        <p>Uso tópico tem racional e evidência moderada em estética. Uso injetável e sistêmico ainda exige cautela pela escassez de dados humanos robustos, questões regulatórias, estabilidade, pureza e risco imunológico.</p>
        <p>Essa é a versão sem perfume de vendedor.</p>
      </Section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Ciência acima do marketing.
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Integre peptídeos ao seu protocolo com acompanhamento clínico — não com promessa de vitrine.
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
          Conteúdo informativo técnico. Qualquer uso de peptídeos deve ser orientado e acompanhado por profissional habilitado.
        </p>
      </footer>
    </div>
  );
};

export default GhkCu;