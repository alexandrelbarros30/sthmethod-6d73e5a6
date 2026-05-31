import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, HeartPulse, Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-hipertensao-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const HipertensaoArterial = () => {
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
            <Link to="/dashboard">
              <Button size="sm" variant="ghost" className="text-[11px] h-7 rounded-full">Voltar</Button>
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
          Cardiovascular — Pressão Arterial
        </motion.p>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground">
          Hipertensão Arterial.<br />
          <span className="text-muted-foreground">O tratado tático completo.</span>
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Classificação, fisiopatologia, diagnóstico diferencial e conduta medicamentosa, suplementar e comportamental — no padrão ST&amp;H Method.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img
            src={heroImg}
            alt="Hipertensão Arterial — tratado clínico completo"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Pressão arterial é o principal marcador de longevidade de um físico de alto rendimento.{" "}
          <span className="text-foreground font-medium">Ignorá-la é fatal.</span>
        </motion.p>
      </section>

      {/* 01 — Classificação */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            01 — Possibilidades &amp; Classificação
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Hipertensão Essencial vs. Secundária.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            A hipertensão arterial ocorre quando a força do sangue contra as paredes das artérias é cronicamente alta, exigindo maior esforço do miocárdio. Dividimos as possibilidades em dois grandes grupos.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
          >
            <div className="text-3xl mb-3">🧬</div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
              Hipertensão Essencial (Primária)
            </h3>
            <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
              <p>Representa cerca de <span className="text-foreground font-medium">90% a 95%</span> dos casos. Não há uma causa única e isolada.</p>
              <p>Ela se desenvolve ao longo dos anos devido a uma combinação de <span className="text-foreground font-medium">fatores genéticos</span>, envelhecimento, sedentarismo, obesidade, tabagismo e, principalmente, alto consumo de sódio associado a uma dieta inflamatória.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
              Hipertensão Secundária
            </h3>
            <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
              <p>Representa <span className="text-foreground font-medium">5% a 10%</span> dos casos. É aquela diretamente causada por outra condição médica subjacente ou pelo uso de substâncias específicas.</p>
              <p>Exemplos: <span className="text-foreground font-medium">estenose da artéria renal, feocromocitoma, hiperaldosteronismo primário</span> ou induzida por fármacos/hormônios exógenos.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 02 — Existe cura? */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            02 — Prognóstico
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Existe cura? Qual tipo pode ser curada?
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            A resposta clínica exata é: <span className="text-foreground font-medium">A Hipertensão Primária NÃO tem cura, tem controle. A Hipertensão Secundária PODE ser curada.</span>
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {[
            {
              icon: "🔧",
              title: "Estenose da Artéria Renal",
              text: "O estreitamento da artéria que irriga o rim ativa o sistema Renina-Angiotensina-Aldosterona de forma severa. Uma angioplastia cura a hipertensão.",
            },
            {
              icon: "🦠",
              title: "Feocromocitoma",
              text: "Um tumor na glândula adrenal que secreta doses massivas de catecolaminas (adrenalina/noradrenalina). A remoção cirúrgica do tumor cura a hipertensão.",
            },
            {
              icon: "⚗️",
              title: "Hiperaldosteronismo Primário",
              text: "Produção excessiva de aldosterona pela adrenal, retendo sódio e eliminando potássio. O tratamento cirúrgico ou medicamentoso específico corrige a pressão.",
            },
            {
              icon: "💊",
              title: "Induzida por Fármacos/Hormônios",
              text: "Hipertensão causada por anticoncepcionais, anti-inflamatórios (AINEs) ou esteroides anabolizantes. Ao retirar a substância, há cura.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
                {item.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-muted-foreground font-light">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 03 — Transitória vs Fixa */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            03 — Evolução temporal
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Hipertensão Transitória vs. Fixa.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            A Hipertensão Transitória existe e é caracterizada por picos pressóricos elevados associados a um gatilho pontual e reversível. Assim que o gatilho cessa, a pressão normaliza.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
              Hipertensão Transitória
            </h3>
            <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
              <p>Picos pressóricos elevados associados a um gatilho pontual e reversível. Assim que o gatilho cessa, a pressão normaliza.</p>
              <p className="text-foreground font-medium">Gatilhos comuns:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dor aguda intensa</li>
                <li>Crises de ansiedade/pânico</li>
                <li>Privação severa de sono</li>
                <li>Uso de estimulantes de pré-treino (altas doses de cafeína)</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-destructive/30 bg-card p-6 md:p-8"
          >
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
              Hipertensão Fixa (Crônica)
            </h3>
            <div className="space-y-4 text-[15px] leading-[1.65] text-muted-foreground font-light">
              <p>Os vasos sanguíneos sofrem <span className="text-foreground font-medium">remodelamento estrutural</span>:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Perda de elasticidade arterial</li>
                <li>Hipertrofia da camada média do vaso</li>
                <li>Fibrose endotelial</li>
              </ul>
              <p>Uma vez que o vaso "endurece" cronicamente, a pressão alta se estabelece de forma <span className="text-foreground font-medium">permanente</span>.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 04 — Diagnóstico Diferencial */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            04 — Diagnóstico Diferencial
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            O que pode ser confundido com hipertensão?
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            Várias situações clínicas flutuantes podem mimetizar a hipertensão em uma aferição isolada, induzindo a erros de diagnóstico.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {[
            {
              icon: "🥼",
              title: "Síndrome do Avental Branco",
              text: "O paciente apresenta picos de pressão alta apenas dentro do consultório médico ou ambiente hospitalar devido a uma resposta adrenérgica inconsciente (ansiedade). Em casa, a pressão é normal.",
            },
            {
              icon: "🧠",
              title: "Crises de Ansiedade e Ataques de Pânico",
              text: "O disparo massivo de cortisol e adrenalina durante a crise eleva a pressão de forma aguda, mas isso é um sintoma da ansiedade, e não a doença hipertensão em si.",
            },
            {
              icon: "😴",
              title: "Apneia Obstrutiva do Sono (AOS)",
              text: "Os episódios de hipóxia durante a noite geram despertares com descargas adrenérgicas brutais, fazendo a pressão amanhecer estourada, simulando hipertensão primária.",
            },
            {
              icon: "🧪",
              title: "Síndrome de Cushing / Uso Crônico de Corticoides",
              text: "Confundem-se com a hipertensão essencial por gerarem retenção hídrica crônica e ativação mineralocorticoide.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-4 leading-tight">
                {item.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-muted-foreground font-light">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 05 — MAPA */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-primary/40 bg-primary/5 p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-5">
              <Stethoscope className="w-6 h-6 text-primary" />
              <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-primary">
                Padrão-ouro diagnóstico
              </p>
            </div>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-[1.1] mb-5">
              MAPA de 24 horas — o único método confiável.
            </h3>
            <p className="text-[16px] leading-[1.65] text-muted-foreground font-light mb-5">
              O padrão-ouro absoluto na medicina integrativa e do esporte é a realização do <span className="text-foreground font-medium">MAPA (Monitorização Ambulatorial da Pressão Arterial) de 24 horas</span>. O paciente passa o dia com o aparelho, que afere a pressão durante o trabalho, treino, episódios de estresse e, criticamente, durante o sono (descenso noturno).
            </p>
            <div className="space-y-3 text-[15px] leading-[1.65]">
              <p className="text-muted-foreground font-light">
                <span className="text-foreground font-medium">Se a pressão se mantiver alta na média das 24h e perder o descenso noturno</span> → é <span className="text-foreground font-medium">Hipertensão Real</span>.
              </p>
              <p className="text-muted-foreground font-light">
                <span className="text-foreground font-medium">Se flutuar apenas em momentos isolados de estresse ou no consultório</span> → é <span className="text-foreground font-medium">Hipertensão Reativa/Transitória</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 06 — Medicamentos */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            05 — Conduta medicamentosa
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            O medicamento certo para a causa certa.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            A prescrição de anti-hipertensivos não pode ser empírica ou baseada em "tentativa e erro". Cada classe de medicamento atua em uma via fisiológica específica.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          {[
            {
              icon: "💧",
              title: "Retenção Hídrica / Volume Plasmático Alto",
              med: "Diuréticos (Hidroclorotiazida) para eliminar o excesso de líquido extracelular.",
            },
            {
              icon: "🫀",
              title: "Hiperativação do Sistema Renina-Angiotensina",
              med: "IECAs (Enalapril, Ramipril) ou BRAs (Valsartana, Losartana). Bloqueiam a ação da angiotensina II e protegem os rins contra a hiperfiltração.",
            },
            {
              icon: "⚡",
              title: "Hiperatividade Adrenérgica / Frequência Cardíaca Alta",
              med: "Beta-bloqueadores (Nebivolol) com alta seletividade cardíaca e estimulação do óxido nítrico endotelial.",
            },
            {
              icon: "🩸",
              title: "Rigidez Arterial / Vasoconstrição Pura",
              med: "Bloqueadores dos Canais de Cálcio (Anlodipino) para relaxar a musculatura lisa dos vasos.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-muted-foreground font-light">
                {item.med}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 07 — Anabolizantes */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto px-6 mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
            06 — Esteroides &amp; cardiovascular
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Anabolizantes: o papel na hipertensão transitória ou fixa.
          </h2>
          <p className="mt-5 text-base text-muted-foreground font-light">
            Os esteroides androgênicos anabolizantes (EAs) são causas clássicas de Hipertensão Secundária, atuando de três formas agressivas no sistema cardiovascular.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: "🌊",
              title: "Retenção de Sódio e Água",
              text: "Hormônios que aromatizam muito elevam o estradiol, que estimula a retenção de sódio nos túbulos renais. O sangue fica pesado, a pressão sobe. Com ésteres curtos ou drogas orais, isso pode começar como hipertensão transitória.",
            },
            {
              icon: "🩸",
              title: "Elevação do Hematócrito",
              text: "Os anabolizantes estimulam fortemente a eritropoiese. Sangue com hematócrito acima de 52% vira um 'xarope' denso. O coração precisa fazer força absurda para empurrar esse sangue viscoso.",
            },
            {
              icon: "🔩",
              title: "Resistência Vascular Periférica",
              text: "O uso crônico induz a hipertrofia do músculo liso dos vasos e estimula o sistema nervoso simpático. A hipertensão transitória vira fixa por fibrose e rigidez arterial.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-3xl border border-border/40 bg-card p-6 md:p-8"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-muted-foreground font-light">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 08 — Alerta máximo */}
      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-destructive/40 bg-destructive/5 p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-destructive">
                Alerta de segurança máxima
              </p>
            </div>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-[1.1] mb-5">
              Quem tem hipertensão pode usar anabolizantes?
            </h3>
            <p className="text-[16px] leading-[1.65] text-muted-foreground font-light mb-6">
              Clinicamente e à luz da medicina esportiva de segurança, <span className="text-foreground font-medium">NÃO DEVE</span>. Utilizar doses suprafisiológicas de anabolizantes em um indivíduo que já possui hipertensão estabelecida é amplificar exponencialmente o risco de um desfecho cardiovascular fatal.
            </p>
            <p className="text-[15px] leading-[1.65] text-muted-foreground font-light mb-4">
              Se um paciente hipertenso insistir no uso por conta e risco, a medicina integrativa tática exige um protocolo de <span className="text-foreground font-medium">redução de danos extremo e inegociável</span>:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px] leading-[1.65] text-muted-foreground font-light">
              <li><span className="text-foreground font-medium">Controle Rígido de Hematócrito:</span> Se o hematócrito subir, a viscosidade sanguínea mata. Monitoramento laboratorial mensal.</li>
              <li><span className="text-foreground font-medium">Uso Mandatório de IECA ou BRA:</span> Valsartana torna-se obrigatória para contrabalancear a ativação do sistema renina-angiotensina, protegendo o coração contra a hipertrofia ventricular esquerda.</li>
              <li><span className="text-foreground font-medium">Vasodilatação Limpa Nativa:</span> L-Citrulina Malato (6g) no pré-treino e Tadalafila (5mg) diariamente para forçar a liberação de óxido nítrico.</li>
              <li><span className="text-foreground font-medium">Hiper-hidratação Marcial:</span> 5 a 6 litros de água por dia para tentar afinar mecanicamente o sangue denso.</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Conclusão */}
      <section className="py-20 md:py-28 border-t border-border/40 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <HeartPulse className="w-10 h-10 text-primary mx-auto mb-6" />
          <p className="text-xl md:text-2xl font-light text-muted-foreground leading-[1.4] mb-4">
            A pressão arterial é o principal marcador de longevidade de um físico de alto rendimento.
          </p>
          <p className="text-lg text-foreground font-medium mb-10">
            Compreendeu a fisiopatologia e os riscos envolvidos, comandante?
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/tendencias">
              <Button variant="ghost" size="sm" className="rounded-full text-[12px]">Ver outras matérias</Button>
            </Link>
            {!isStudent && (
              <Link to="/cadastro">
                <Button size="sm" className="rounded-full text-[12px] bg-foreground text-background hover:bg-foreground/90">
                  Entrar no método
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-[11px] text-muted-foreground border-t border-border/40">
        STH News · Conteúdo clínico-educacional · Não substitui avaliação médica individual.
      </footer>
    </div>
  );
};

export default HipertensaoArterial;
