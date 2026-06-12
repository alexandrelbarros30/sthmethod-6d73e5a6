import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/sthnews-atrofia-hero.jpg";
import mionucleosImg from "@/assets/sthnews-atrofia-mionucleos.jpg";
import eixoImg from "@/assets/sthnews-atrofia-eixo.jpg";
import treinoImg from "@/assets/sthnews-atrofia-treino.jpg";
import nutricaoImg from "@/assets/sthnews-atrofia-nutricao.jpg";
import restauracaoImg from "@/assets/sthnews-atrofia-restauracao.jpg";

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
      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase mb-4">
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

const RestauracaoMuscular = () => {
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
          Reabilitação do eixo HPT · Uso crônico 10+ anos
        </motion.p>
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] text-foreground"
        >
          Acordando o testículo <br />
          <span className="text-muted-foreground">depois de uma década calado.</span>
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" variants={fadeUp}
          className="max-w-xl mx-auto mt-8 text-lg md:text-xl text-muted-foreground font-light leading-relaxed"
        >
          O tratado definitivo sobre reativação testicular, restauração do eixo hipotálamo-hipófise-gônadas e os fármacos que realmente devolvem produção endógena após 10+ anos de anabolizantes.
        </motion.p>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-6 mb-16 md:mb-24"
      >
        <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[16/9]">
          <img src={heroImg} alt="Eixo hipotálamo-hipófise-gônadas representado em hélice neon" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-2xl md:text-3xl font-light leading-[1.35] text-foreground tracking-tight"
        >
          Dez anos de exógeno calam o hipotálamo, atrofiam as células de Leydig e desligam a espermatogênese. Mas o eixo HPT não morre — ele entra em hibernação profunda. <span className="text-primary">Reativá-lo é farmacologia de precisão</span>, não tentativa e erro.
        </motion.p>
      </section>

      <Section number="01" kicker="Diagnóstico do silêncio" title="Como uma década apaga o eixo HPT."
        image={eixoImg} alt="Eixo hipotálamo-hipófise-gônadas em silêncio">
        <p>A administração contínua de testosterona exógena por 10 anos suprime o GnRH hipotalâmico de forma sustentada. Sem GnRH pulsátil, a hipófise para de liberar <span className="text-foreground font-medium">LH e FSH</span>. Sem LH, as células de Leydig involuem; sem FSH, as células de Sertoli silenciam.</p>
        <p>O resultado bioquímico após 10 anos é previsível: LH e FSH abaixo de 0,5 mUI/mL, testosterona total inferior a 150 ng/dL após o washout, estradiol oscilante, SHBG elevada e inibina B no chão — a assinatura clássica do hipogonadismo hipogonadotrófico secundário induzido.</p>
        <p>O volume testicular cai de 18–25 mL para 6–10 mL. A biópsia revela parada da espermatogênese e atrofia de Leydig. <span className="text-foreground font-medium">Esse é o ponto de partida real</span> — e o motivo de qualquer protocolo genérico de PCT fracassar nesse cenário.</p>
      </Section>

      <Section number="02" kicker="Reativação testicular" title="hCG: o primeiro fármaco que devolve volume."
        image={mionucleosImg} alt="Células de Leydig sendo reativadas">
        <p>Antes de qualquer tentativa de despertar a hipófise, é preciso restaurar a capacidade responsiva das gônadas. <span className="text-foreground font-medium">Gonadotrofina coriônica humana (hCG)</span> é estruturalmente análoga ao LH e age diretamente sobre as células de Leydig, forçando esteroidogênese local e regeneração testicular.</p>
        <div className="grid gap-4 pt-2">
          {[
            ["Fase 1 · Resgate (4–8 semanas)", "hCG 1.500–2.500 UI subcutâneo, 3x por semana. Objetivo: restaurar volume testicular, sensibilidade do receptor de LH e produção intratesticular de testosterona — pré-requisito biológico para espermatogênese."],
            ["Adjuvante · Inibidor de aromatase", "Anastrozol 0,25–0,5 mg 2x/semana, titulado por estradiol. O hCG aromatiza intensamente; sem controle, o estradiol descontrolado bloqueia o feedback do eixo e induz ginecomastia."],
            ["Monitoramento", "LH, FSH, testosterona total e livre, estradiol ultrassensível, prolactina, SHBG e hemograma a cada 30 dias. Sem laboratório seriado, o protocolo é cego."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p>Após essa fase, o testículo volta a responder. Sem isso, qualquer SERM aplicado encontra uma gônada incapaz de obedecer e a tentativa de restart fracassa.</p>
      </Section>

      <Section number="03" kicker="Despertando a hipófise" title="SERMs: forçando LH e FSH endógenos."
        image={heroImg} alt="Hipófise sendo reativada por SERMs">
        <p>Com o testículo reabilitado, o segundo movimento é destravar o eixo central. Os <span className="text-foreground font-medium">moduladores seletivos do receptor de estrogênio (SERMs)</span> bloqueiam o feedback negativo do estradiol no hipotálamo e na hipófise, liberando GnRH, LH e FSH.</p>
        <div className="grid gap-4 pt-2">
          {[
            ["Citrato de clomifeno", "25–50 mg/dia por 4–6 semanas. Aumenta LH e FSH em 2–3 semanas. Efeito mais robusto, porém com risco de alterações visuais e humor em isômeros zuclomifeno acumulados."],
            ["Tamoxifeno", "20 mg/dia, frequentemente combinado ao clomifeno nas últimas semanas. Protege contra rebote estrogênico e ginecomastia durante a saída do hCG."],
            ["Enclomifeno (quando disponível)", "12,5–25 mg/dia. Isômero trans-puro do clomifeno, com perfil de efeitos colaterais consideravelmente menor e elevação de LH mais limpa — opção de elite quando há acesso."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
        <p>A retirada do hCG deve ser <span className="text-foreground font-medium">gradual e sobreposta</span> ao SERM por 10–14 dias. Cortes abruptos derrubam o eixo recém-acordado e desperdiçam toda a reabilitação anterior.</p>
      </Section>

      <Section number="04" kicker="Adjuvantes de elite" title="Kisspeptina, gonadorelina e o futuro do restart."
        image={nutricaoImg} alt="Adjuvantes farmacológicos avançados">
        <p>Para casos refratários após 10+ anos de supressão, surgem peptídeos que agem em níveis ainda mais altos do eixo:</p>
        <div className="grid gap-4 pt-2">
          {[
            ["Kisspeptina-10", "Neuropeptídeo a montante do GnRH. Em protocolos experimentais, reativa o gerador pulsátil hipotalâmico em pacientes que não respondem a SERMs isolados."],
            ["Gonadorelina / GnRH pulsátil", "Substitui temporariamente a sinalização hipotalâmica perdida, restaurando o ritmo pulsátil natural de LH e FSH. Alternativa em hipogonadismo hipotalâmico persistente."],
            ["Mesilato de cabergolina", "0,25–0,5 mg 2x/semana quando há hiperprolactinemia secundária. Prolactina elevada bloqueia GnRH e sabota qualquer restart."],
            ["HMG (menotropina)", "Associada ao hCG quando o objetivo inclui fertilidade — repõe a ação de FSH e restaura espermatogênese de forma direta."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="05" kicker="Suporte sistêmico" title="O terreno que permite o eixo voltar."
        image={treinoImg} alt="Suporte metabólico ao eixo HPT">
        <p>Nenhum protocolo farmacológico sobrevive a um terreno metabólico hostil. Dez anos de exógeno costumam deixar resistência à insulina, hematócrito elevado, perfil lipídico distorcido e sono fragmentado — todos inimigos diretos do GnRH.</p>
        <div className="grid gap-4 pt-2">
          {[
            ["Composição corporal", "Reduzir gordura visceral abaixo de 18% restaura a sinalização leptina/insulina sobre o hipotálamo. Acima disso, a aromatase periférica sabota o eixo."],
            ["Sono profundo · 7–9h", "O pico de LH ocorre em sono REM. Privação crônica derruba testosterona em 15% por noite mal dormida — comprovado em ensaios controlados."],
            ["Vitamina D · 50–80 ng/mL, Zinco · 25 mg/dia, Magnésio · 400 mg/dia", "Cofatores diretos da esteroidogênese. Deficiência subclínica é a regra em pacientes pós-ciclo crônico."],
            ["Treino com tensão, sem volume insano", "10–12 séries por agrupamento, cadência excêntrica controlada. Cortisol baixo protege o eixo recém-acordado; overtraining desliga de novo."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="06" kicker="O ponto sem retorno" title="Quando a TRT médica é a resposta honesta."
        image={restauracaoImg} alt="Decisão clínica sobre TRT vitalícia">
        <p>Após 12 meses do protocolo completo (hCG + SERMs + adjuvantes + suporte sistêmico), se o LH permanecer abaixo de 2 mUI/mL e a testosterona total não ultrapassar 350 ng/dL de forma estável, há <span className="text-foreground font-medium">dano hipotalâmico ou testicular irreversível</span>.</p>
        <p>Nesse cenário, insistir é cruel. A <span className="text-foreground font-medium">terapia de reposição médica supervisionada</span> — testosterona em doses fisiológicas (100–160 mg/semana), com hCG 500 UI 2x/semana para preservar volume testicular e fertilidade — devolve qualidade de vida, libido, composição corporal e saúde cardiovascular.</p>
        <p>TRT bem indicada não é derrota: é diagnóstico maduro. Pior do que reconhecer hipogonadismo permanente é tentar reativar por anos um eixo que já não existe, vivendo em subdosagem crônica.</p>
      </Section>

      <Section number="07" kicker="Cronograma realista" title="O que esperar mês a mês."
        image={mionucleosImg} alt="Linha do tempo da reabilitação hormonal">
        <div className="grid gap-4">
          {[
            ["Mês 1–2", "Washout supervisionado do exógeno. Início do hCG. Volume testicular começa a recuperar. Libido oscila."],
            ["Mês 3–4", "Introdução do SERM. LH e FSH detectáveis pela primeira vez em anos. Testosterona endógena entre 250–400 ng/dL."],
            ["Mês 5–8", "Desmame do hCG. SERM isolado. Eixo testa autonomia. Aqui se separa quem reativou de quem precisará de TRT."],
            ["Mês 9–12", "Avaliação final. LH > 3, testosterona > 450 ng/dL sustentada = sucesso. Abaixo disso, decisão clínica sobre TRT."],
          ].map(([t, d]) => (
            <div key={t} className="py-5 border-t border-border/40">
              <p className="text-foreground font-medium text-base mb-1">{t}</p>
              <p className="text-[15px]">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section number="08" kicker="O veredito" title="O eixo HPT premia quem respeita a biologia."
        image={heroImg} alt="Eixo hormonal restaurado">
        <p>Reativar o eixo HPT após 10 anos de uso crônico é possível na maioria dos casos — desde que conduzido em fases, com fármaco certo na ordem certa, lastreado por exames seriados e respeito ao tempo biológico do testículo.</p>
        <p className="text-foreground font-medium">A regra de ouro: primeiro o testículo (hCG), depois a hipófise (SERMs), por último a manutenção (estilo de vida). Inverter essa ordem é sabotar o próprio protocolo.</p>
        <p>E quando o eixo finalmente volta a falar, o músculo — graças à memória miotonuclear preservada — responde com velocidade que surpreende. Mas isso só acontece depois que o sangue está em ordem. Não antes.</p>
      </Section>

      <section className="max-w-2xl mx-auto px-6 py-16 border-t border-border/40">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Referências clínicas</p>
        <ul className="text-[13px] text-muted-foreground space-y-2 font-light leading-relaxed list-disc pl-5">
          <li>Rahnema CD et al. <em>Anabolic steroid-induced hypogonadism: diagnosis and treatment.</em> Fertil Steril, 2014.</li>
          <li>Coward RM et al. <em>Anabolic steroid induced hypogonadism in young men.</em> J Urol, 2013.</li>
          <li>Tan RS, Vasudevan SG. <em>Use of clomiphene citrate to reverse premature andropause secondary to steroids.</em> Fertil Steril, 2003.</li>
          <li>Wenker EP et al. <em>The use of hCG-based combination therapy for recovery of spermatogenesis after testosterone use.</em> J Sex Med, 2015.</li>
          <li>Skorupskaite K et al. <em>Kisspeptin and reproductive physiology in men.</em> Hum Reprod Update, 2020.</li>
        </ul>
      </Section>
      </section>

      <section className="py-32 md:py-40 px-6 text-center border-t border-border/40">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1] text-foreground mb-6">
            Seu eixo não morreu. <br />
            <span className="text-muted-foreground">Ele está esperando o protocolo certo.</span>
          </h2>
          <p className="max-w-md mx-auto text-lg text-muted-foreground font-light mb-10">
            Painel hormonal completo, leitura clínica e plano de reativação em fases. Sem achismo, sem protocolo de fórum.
          </p>
          {!isStudent && (
            <Link to="/cadastro">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-[15px] font-medium">
                Quero avaliar meu eixo HPT
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <p className="max-w-xl mx-auto text-[12px] text-muted-foreground font-light leading-relaxed">
          Conteúdo educacional. hCG, SERMs, inibidores de aromatase, kisspeptina e gonadorelina são medicamentos sob prescrição e exigem acompanhamento médico individualizado com endocrinologista, urologista ou médico do esporte. Não use este artigo como protocolo de automedicação.
        </p>
      </footer>
    </div>
  );
};

export default RestauracaoMuscular;