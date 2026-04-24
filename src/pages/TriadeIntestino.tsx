import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Newspaper, Home, Rocket, MessageCircle,
  FlaskConical, Activity, ShieldCheck, BookOpen,
  Microscope, AlertTriangle, Target, Brain, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-triade-glass-1.jpg";
import insulinImg from "@/assets/sthnews-triade-glass-2.jpg";
import foodsImg from "@/assets/sthnews-triade-glass-3.jpg";
import ovaryImg from "@/assets/sthnews-triade-glass-4.jpg";
import refluxImg from "@/assets/sthnews-triade-glass-5.jpg";
import brainGutImg from "@/assets/sthnews-triade-glass-6.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const TriadeIntestino = () => {
  const { user, role } = useAuth();
  const isStudent = !!user && role === "student";
  const backTo = isStudent ? "/dashboard" : "/tendencias";
  const backLabel = isStudent ? "Início" : "STH News";
  const BackIcon = isStudent ? Home : ArrowLeft;

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-12 flex items-center justify-between">
            <Link to={backTo} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <BackIcon className="w-3.5 h-3.5" /> {backLabel}
            </Link>
            <div className="flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black tracking-[0.2em] text-foreground uppercase">STH News</span>
            </div>
            {isStudent ? (
              <Link to="/dashboard">
                <Button size="sm" variant="ghost" className="text-[10px] px-3 h-7 rounded-full font-bold">Voltar</Button>
              </Link>
            ) : (
              <Link to="/cadastro">
                <Button size="sm" className="gradient-bg text-primary-foreground text-[10px] px-3 h-7 rounded-full font-bold">Começar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        {/* Tag */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded tracking-wider">EXCLUSIVO</span>
          <span className="text-[10px] text-muted-foreground">{today} · STH News</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-2xl md:text-4xl font-black text-foreground leading-[1.12] mb-3 tracking-tight"
        >
          🧬 A Tríade da Inflamação:{" "}
          <span className="gradient-text">SII, SOP e DRGE em um único eixo</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4 mb-6"
        >
          Síndrome do Intestino Irritável, Ovários Policísticos e Refluxo Gastroesofágico não coexistem por acaso. Existe um <strong className="text-foreground">eixo intestino-hormônio-inflamação</strong> mediado por resistência à insulina, disbiose e desregulação autonômica — e entender essa rede é o que separa o tratamento sintomático da resolução real.
        </motion.p>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8 aspect-[16/10] bg-muted"
        >
          <img src={heroImg} alt="Trato digestório e ovários em vidro límpido — eixo integrado" className="w-full h-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Eixo integrado · SII / SOP / DRGE</span>
            <p className="text-sm font-bold text-foreground">Inflamação sistêmica. Mesma raiz. Três expressões.</p>
          </div>
        </motion.div>

        {/* ETAPA 1 — MAPEAMENTO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Microscope className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 1 · Mapeamento</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">SII — Síndrome do Intestino Irritável</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Distúrbio da interação intestino-cérebro com dor abdominal recorrente, alteração na frequência/forma das fezes, estufamento e gases. A fisiopatologia envolve <strong className="text-foreground">hipersensibilidade visceral</strong>, motilidade alterada e desequilíbrio da microbiota.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-3 aspect-[16/10] bg-muted">
            <img src={ovaryImg} alt="Ovário em vidro límpido representando SOP" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">SOP — Síndrome dos Ovários Policísticos</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Distúrbio endócrino-metabólico marcado por <strong className="text-foreground">hiperandrogenismo, anovulação e resistência à insulina</strong>. Ciclos irregulares, acne, ganho de peso, hirsutismo e inflamação sistêmica elevada — a RI estimula o ovário a produzir excesso de andrógenos.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl overflow-hidden border border-primary/20 mb-3 aspect-[16/10] bg-muted">
            <img src={refluxImg} alt="Esôfago e estômago em vidro límpido representando DRGE" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">DRGE — Refluxo Gastroesofágico</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conteúdo gástrico retorna ao esôfago por incompetência do esfíncter esofágico inferior. Pirose, regurgitação, tosse seca crônica e dor retroesternal — agravado por <strong className="text-foreground">pressão intra-abdominal aumentada</strong> (frequentemente associada ao ganho de peso na SOP) e hipersensibilidade esofágica.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 2 — A CONEXÃO */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 2 · A Conexão</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A ciência atual mostra que essas condições não operam isoladas. O elo é o <strong className="text-foreground">eixo intestino-hormônio-inflamação</strong>:
          </motion.p>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={insulinImg} alt="Molécula de insulina e microbiota em esferas de vidro" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">PILAR 01</span>
              <h3 className="text-sm font-bold text-foreground">Resistência à Insulina (RI)</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pilar central da SOP. A RI altera a motilidade gastrointestinal, podendo agravar a SII e a DRGE simultaneamente — uma única alavanca metabólica que move três sintomas.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">PILAR 02</span>
              <h3 className="text-sm font-bold text-foreground">Inflamação de baixo grau</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              SOP e SII apresentam <strong className="text-foreground">PCR elevada</strong> e marcadores inflamatórios sistêmicos. A inflamação crônica subclínica é o terreno comum que perpetua a tríade.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded tracking-wider">PILAR 03</span>
              <h3 className="text-sm font-bold text-foreground">Disbiose intestinal</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A composição da microbiota afeta a produção de neurotransmissores e o <strong className="text-foreground">metabolismo dos estrogênios (estroboloma)</strong>, perpetuando o ciclo SOP–SII e modulando a sensibilidade visceral.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 3 — ESTRATÉGIAS */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 3 · Estratégias práticas</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={foodsImg} alt="Alimentos low FODMAP em vidro límpido" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded tracking-wider">SII</span>
              <h3 className="text-sm font-bold text-foreground">Dieta Low FODMAP</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Reduz carboidratos fermentáveis que causam distensão. Limitação <strong className="text-foreground">temporária</strong> de cebola, alho, feijões, lactose, maçã, pêra. Após a fase de exclusão, reintrodução guiada com prebióticos e probióticos específicos.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-rose-500/15 text-rose-500 px-2 py-0.5 rounded tracking-wider">SOP</span>
              <h3 className="text-sm font-bold text-foreground">Carga glicêmica + treino resistido</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sensibilizar receptores de insulina. Proteínas magras, ômega-3, carboidratos de baixo IG (aveia, quinoa, vegetais fibrosos), fracionamento inteligente. <strong className="text-foreground">Musculação atua como "remédio"</strong> para a resistência insulínica.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black bg-cyan-500/15 text-cyan-500 px-2 py-0.5 rounded tracking-wider">DRGE</span>
              <h3 className="text-sm font-bold text-foreground">Higiene do sono e da refeição</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reduzir a pressão intragástrica: evitar grandes volumes antes de deitar, eliminar gatilhos (cafeína, chocolate, álcool, gorduras pesadas) e <strong className="text-foreground">elevar a cabeceira da cama</strong>.
            </p>
          </motion.div>
        </motion.section>

        {/* ETAPA 4 — QUALIDADE DE VIDA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Etapa 4 · Eixo intestino-cérebro</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="rounded-2xl overflow-hidden border border-primary/20 mb-4 aspect-[16/10] bg-muted">
            <img src={brainGutImg} alt="Cérebro e intestino conectados em vidro límpido" className="w-full h-full object-cover" width={1280} height={800} loading="lazy" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <h3 className="text-sm font-bold text-foreground mb-2">Estresse → Cortisol → Tudo piora</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O cortisol crônico <strong className="text-foreground">aumenta a resistência à insulina</strong> (agrava SOP) e amplifica o eixo intestino-cérebro (agrava SII). Mindfulness e regulação do sistema nervoso autônomo são intervenções terapêuticas — não acessórios.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-border/60 bg-card p-5 mb-3">
            <h3 className="text-sm font-bold text-foreground mb-2">Sono reparador</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Privação de sono piora diretamente a sensibilidade à insulina. Sem sono, nenhum protocolo metabólico se sustenta.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Nutracêuticos com evidência</h3>
            <ul className="space-y-1.5 text-xs text-foreground">
              <li className="flex gap-2"><span className="text-primary">●</span> <strong>Inositol</strong> — SOP / resistência insulínica</li>
              <li className="flex gap-2"><span className="text-primary">●</span> <strong>L-Glutamina</strong> — barreira intestinal na SII</li>
              <li className="flex gap-2"><span className="text-primary">●</span> <strong>Zinco</strong> — regulação hormonal</li>
            </ul>
          </motion.div>
        </motion.section>

        {/* INSIGHT BRUTAL */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ Insight Brutal</p>
            <p className="text-sm text-foreground leading-relaxed">
              Tratar SII, SOP e DRGE como doenças separadas é o erro clássico. Elas são <strong className="gradient-text">três expressões da mesma desregulação metabólica e inflamatória</strong>. Ataque a raiz — sensibilidade à insulina, microbiota, cortisol — e os três sintomas começam a recuar juntos.
            </p>
          </motion.div>
        </motion.section>

        {/* Filtro de segurança */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Filtro de segurança</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nenhuma estratégia substitui investigação médica. SOP, SII e DRGE exigem diagnóstico clínico formal. Ajustes alimentares, suplementos e protocolos devem ser conduzidos com acompanhamento profissional individualizado.
            </p>
          </motion.div>
        </motion.section>

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10">
          <motion.div variants={fadeUp} custom={0} className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-primary/5 border border-primary/30 p-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.25em] text-primary font-black mb-2">⚡ STH METHOD</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight">
              Não é o sintoma. <br />
              É a <span className="gradient-text">raiz metabólica e inflamatória</span>.
            </h2>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link to={isStudent ? "/dashboard" : "/cadastro"} className="w-full">
                <Button size="lg" className="gradient-bg text-primary-foreground w-full font-bold gap-2 rounded-xl">
                  {isStudent ? "Voltar ao painel" : "Começar agora"} <Rocket className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/5521998496289?text=Ol%C3%A1!%20Vi%20a%20mat%C3%A9ria%20sobre%20SII%2C%20SOP%20e%20DRGE%20e%20quero%20entender%20como%20tratar%20a%20raiz."
                target="_blank" rel="noopener noreferrer" className="w-full"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-xl">
                  <MessageCircle className="w-4 h-4" /> Falar com especialista
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.section>

        {/* Referências */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Referências científicas</h2>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">ACG · 2021</p>
              <p><em>American College of Gastroenterology Clinical Guideline: Management of Irritable Bowel Syndrome.</em></p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Monash University · 2023</p>
              <p><em>International evidence-based guideline for the assessment and management of polycystic ovary syndrome.</em></p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">ACG · 2022</p>
              <p><em>Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease.</em></p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">Cryan et al. · 2019</p>
              <p><em>The Microbiota-Gut-Brain Axis. Physiological Reviews.</em></p>
            </div>
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl bg-muted/30 border border-border/40 p-4 mb-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            Conteúdo educativo. Não substitui consulta médica, nutricional ou farmacológica individualizada.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default TriadeIntestino;