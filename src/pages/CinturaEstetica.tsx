import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Newspaper, Dumbbell, Apple, Gauge, Target, AlertTriangle, BookOpen, Rocket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/sthnews-cintura-hero.jpg";
import treinoImg from "@/assets/sthnews-cintura-treino.jpg";
import nutricaoImg from "@/assets/sthnews-cintura-nutricao.jpg";
import composicaoImg from "@/assets/sthnews-cintura-composicao.jpg";
import anatomiaImg from "@/assets/sthnews-cintura-anatomia.jpg";
import pratoImg from "@/assets/sthnews-cintura-prato.jpg";
import coreImg from "@/assets/sthnews-cintura-core.jpg";
import medicaoImg from "@/assets/sthnews-cintura-medicao.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const GlassImage = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <figure className="my-8 group">
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <img src={src} alt={alt} loading="lazy" width={1920} height={1080} className="w-full h-auto object-cover" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </div>
    <figcaption className="text-[11px] text-muted-foreground mt-2 text-center italic">{caption}</figcaption>
  </figure>
);

const CinturaEsteticaArticle = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/tendencias" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black tracking-[0.2em] text-foreground uppercase">STH News</span>
          </div>
          <Link to="/cadastro">
            <Button size="sm" className="gradient-bg text-primary-foreground text-[10px] px-3 h-7 rounded-full font-bold">
              Começar
            </Button>
          </Link>
        </div>
      </header>

      <main className="pt-20 pb-20 px-4 max-w-3xl mx-auto">
        <motion.section initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded tracking-wider">EXCLUSIVO</span>
            <span className="text-[10px] text-muted-foreground">22 de Abril de 2026</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-primary font-semibold">STH Method</span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black text-foreground leading-[1.1] mb-4 tracking-tight">
            A estética da cintura não é só genética: o que <span className="gradient-text">treino e alimentação</span> realmente fazem com o seu corpo
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
            O formato da cintura é resultado direto da interação entre estrutura corporal, estímulos de treino e estratégia alimentar. Ignorar qualquer um desses fatores é limitar o resultado.
          </motion.p>
        </motion.section>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <GlassImage src={heroImg} alt="Estética da cintura — definição e composição corporal" caption="Estética da cintura: resultado da interação entre estrutura, treino e nutrição." />
        </motion.div>

        {/* Introdução */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Introdução</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
            <p>Quando se fala em estética corporal — principalmente na definição da cintura — a maioria das pessoas aponta imediatamente para a genética. Mas essa é apenas parte da equação.</p>
            <p className="font-semibold text-foreground">Na prática, o formato da cintura é resultado direto da interação entre estrutura corporal, estímulos de treino e estratégia alimentar.</p>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <GlassImage src={anatomiaImg} alt="Anatomia da cintura definida" caption="Anatomia em foco: a cintura é desenhada por estímulo, não por acaso." />
          </motion.div>
        </motion.section>

        {/* Treino */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Treino: estímulo errado, adaptação errada</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
            <p>O corpo responde exatamente ao tipo de estímulo que recebe. Treinos com alta demanda de estabilização e ativação constante do core são importantes para performance e proteção da coluna.</p>
            <p>No entanto, quando mal estruturados ou sem estratégia, podem gerar adaptações musculares indesejadas na região abdominal lateral, impactando a estética da cintura.</p>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-semibold text-foreground">O ponto não é o treino em si — é como ele é aplicado dentro do contexto do objetivo estético.</p>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <GlassImage src={treinoImg} alt="Treino estratégico de core" caption="Estímulo direcionado: o desenho da cintura começa na escolha do exercício." />
          </motion.div>
          <motion.div variants={fadeUp} custom={3}>
            <GlassImage src={coreImg} alt="Exercício controlado de core e estabilização" caption="Controle e técnica: estabilidade que protege e modela." />
          </motion.div>
        </motion.section>

        {/* Alimentação */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Apple className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Alimentação: o fator silencioso</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
            <p>Muitas pessoas associam abdômen estufado apenas ao percentual de gordura. Na prática, isso é incompleto.</p>
            <p className="font-semibold text-foreground">A distensão abdominal pode estar ligada a:</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {["Retenção hídrica","Inflamação intestinal","Intolerâncias alimentares","Desequilíbrios hormonais"].map((item) => (
                <li key={item} className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p>Condições como Síndrome do Intestino Irritável e Síndrome dos Ovários Policísticos exigem ajustes alimentares específicos que impactam diretamente <span className="font-semibold text-foreground">volume abdominal, digestão e resposta metabólica</span>.</p>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <GlassImage src={nutricaoImg} alt="Alimentação estratégica" caption="A escolha alimentar molda volume, digestão e composição." />
          </motion.div>
          <motion.div variants={fadeUp} custom={3}>
            <GlassImage src={pratoImg} alt="Refeição estratégica balanceada" caption="Macros calculados: precisão substitui restrição." />
          </motion.div>
        </motion.section>

        {/* O que define a estética */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">O que realmente define a estética da cintura</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="grid gap-3 sm:grid-cols-2">
            {[
              { t: "Percentual de gordura", d: "Controle preciso, sem extremismos." },
              { t: "Retenção e inflamação", d: "Gestão hídrica e intestinal." },
              { t: "Equilíbrio hormonal", d: "Avaliação contínua dos biomarcadores." },
              { t: "Estrutura muscular", d: "Distribuição estratégica do volume." },
              { t: "Estratégia de treino", d: "Estímulo dirigido ao objetivo." },
            ].map((p) => (
              <div key={p.t} className="p-4 rounded-2xl bg-card border border-border/60">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Pilar</p>
                <h3 className="text-sm font-bold text-foreground mb-1">{p.t}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <GlassImage src={composicaoImg} alt="Análise de composição corporal" caption="Estética é a soma integrada de variáveis — não um único fator." />
          </motion.div>
          <motion.div variants={fadeUp} custom={3}>
            <GlassImage src={medicaoImg} alt="Avaliação física profissional" caption="Medição objetiva: o que se mede, se gerencia." />
          </motion.div>
        </motion.section>

        {/* Erro comum */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">O erro mais comum</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <p className="text-sm font-bold text-foreground">Buscar solução isolada.</p>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              <li>• Treinar mais sem direção.</li>
              <li>• Cortar alimentos sem critério.</li>
              <li>• Copiar protocolos sem contexto.</li>
            </ul>
            <p className="text-xs text-muted-foreground italic pt-2 border-t border-destructive/20">Isso gera esforço… mas não necessariamente resultado.</p>
          </motion.div>
        </motion.section>

        {/* Abordagem STH */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Abordagem STH Method</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 space-y-3 text-sm md:text-base text-foreground/90 leading-relaxed">
            <p>Na <span className="font-bold text-foreground">STH Method</span>, a estética não é tratada como tentativa. É tratada como <span className="font-bold text-foreground">estratégia aplicada</span>.</p>
            <p>Cada ajuste — seja no treino ou na alimentação — é pensado para gerar resposta no corpo, respeitando individualidade e objetivo.</p>
          </motion.div>
        </motion.section>

        {/* Base conceitual */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Base conceitual</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-3 gap-2">
            {["Fisiologia do Exercício","Nutrição Esportiva","Composição Corporal"].map((b) => (
              <div key={b} className="p-3 rounded-xl bg-muted/30 border border-border/40 text-center">
                <p className="text-[11px] font-semibold text-foreground leading-tight">{b}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Conclusão */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Rocket className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Conclusão</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed">
            <p>A cintura não é definida apenas pelo que você herda. <span className="font-bold text-foreground">Ela é moldada pelo que você aplica.</span></p>
            <ul className="space-y-2">
              <li className="p-3 rounded-xl bg-muted/30 border border-border/40"><span className="font-semibold">Treino sem estratégia</span> gera adaptação aleatória.</li>
              <li className="p-3 rounded-xl bg-muted/30 border border-border/40"><span className="font-semibold">Alimentação sem ajuste</span> gera distorção de resultado.</li>
              <li className="p-3 rounded-xl bg-primary/10 border border-primary/30"><span className="font-bold text-foreground">Quando ambos trabalham juntos, o corpo responde.</span></li>
            </ul>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Quer entender como aplicar isso no seu caso?</p>
            <Link to="/cadastro">
              <Button size="lg" className="gradient-bg text-primary-foreground font-bold rounded-full px-6">
                Acessar STH Method <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground mt-3">sthmethod.com.br</p>
          </motion.div>
        </motion.section>

        {/* Assinatura */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
          <motion.div variants={fadeUp} custom={0} className="text-center py-6 border-t border-border/40">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Assinatura STH</p>
            <p className="text-base md:text-lg font-black text-foreground italic">"Estratégia sem controle é só tentativa."</p>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
};

export default CinturaEsteticaArticle;
