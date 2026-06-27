import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldCheck, Calendar, MessageCircle, Sparkles } from "lucide-react";
import { PLAN_CATALOG, LEGAL_DISCLAIMER_SHORT, LEGAL } from "@/lib/legal-version";

const includes = [
  "Planejamento alimentar individualizado",
  "Programa de treinamento",
  "Protocolos de suplementação, quando aplicáveis",
  "Avaliações e reavaliações periódicas",
  "Atualizações estratégicas e ajustes individuais",
  "Materiais educativos da STH METHOD",
  "Suporte da equipe pelos canais oficiais",
];

const notIncludes = [
  "Aquisição definitiva de dietas, treinos ou protocolos",
  "Garantia de resultados específicos (emagrecimento, hipertrofia, performance)",
  "Atendimento de urgência clínica ou emergência",
  "Substituição de avaliações laboratoriais ou exames",
  "Acesso vitalício à plataforma após o término do plano",
];

const steps = [
  { n: "01", t: "Você escolhe o plano", d: "Define a duração do acompanhamento (30, 90 ou 180 dias)." },
  { n: "02", t: "Confirma a contratação", d: "Aceita o Termo de Adesão, a Política de Privacidade e finaliza o pagamento." },
  { n: "03", t: "Acesso liberado", d: "Você recebe acesso ao ecossistema da STH METHOD durante toda a vigência." },
  { n: "04", t: "Acompanhamento ativo", d: "Planejamento, ajustes, materiais e suporte ao longo do período contratado." },
  { n: "05", t: "Encerramento ou renovação", d: "Ao fim da vigência, o acesso é encerrado. Você pode renovar a qualquer momento." },
];

const faqs = [
  { q: "O treino e a dieta são meus para sempre?", a: "Não. Eles fazem parte do Programa de Acompanhamento e ficam disponíveis durante a vigência do seu plano." },
  { q: "Depois do término continuo acessando?", a: "Não. Encerrada a vigência, o acesso à plataforma e aos materiais é encerrado, salvo previsão específica para determinado plano." },
  { q: "Posso renovar?", a: "Sim. Você pode renovar a qualquer momento pela área do aluno." },
  { q: "Posso cancelar?", a: "Sim, observando a legislação vigente e, quando aplicável, o direito de arrependimento de 7 dias para contratações fora de estabelecimento comercial (art. 49 do CDC)." },
  { q: "Há garantia de emagrecer ou ganhar massa?", a: "Não. Resultados dependem de adesão, rotina, genética, alimentação, treinamento, condições clínicas e disciplina." },
];

const Programa = () => (
  <div className="min-h-screen bg-background">
    {/* HERO */}
    <section className="relative overflow-hidden border-b border-border">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6"
        >
          <Sparkles className="w-3 h-3" /> STH METHOD
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1] text-foreground"
        >
          Programa de Acompanhamento
          <br />
          <span className="text-muted-foreground">em Saúde e Performance</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-6 font-light"
        >
          Um acompanhamento por <strong className="text-foreground">prazo determinado</strong>. Durante a vigência você
          recebe planejamento, ajustes e suporte da equipe. Não é venda de dieta, treino ou protocolo.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="rounded-full px-8"><Link to="/cadastro">Quero contratar</Link></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8"><Link to="#planos">Ver planos</Link></Button>
        </motion.div>
      </div>
    </section>

    {/* COMO FUNCIONA */}
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-10 text-center">
          Como funciona
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border p-5 bg-card">
              <p className="text-xs text-muted-foreground tracking-widest">{s.n}</p>
              <p className="font-semibold text-foreground mt-2">{s.t}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* INCLUSO / NÃO INCLUSO */}
    <section className="py-20 px-6 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" /> O que está incluso
          </h3>
          <ul className="space-y-2.5">
            {includes.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /> {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-destructive" /> O que não está incluso
          </h3>
          <ul className="space-y-2.5">
            {notIncludes.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" /> {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    {/* VIGÊNCIA / ACESSO / ENCERRAMENTO */}
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <Calendar className="w-6 h-6 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-foreground">Prazo determinado</h4>
          <p className="text-sm text-muted-foreground mt-2">Cada plano possui vigência específica, que se inicia na liberação do acesso.</p>
        </div>
        <div className="text-center p-6">
          <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-foreground">Acesso pessoal</h4>
          <p className="text-sm text-muted-foreground mt-2">O acesso à plataforma é individual, pessoal e intransferível durante a vigência.</p>
        </div>
        <div className="text-center p-6">
          <MessageCircle className="w-6 h-6 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-foreground">Encerramento</h4>
          <p className="text-sm text-muted-foreground mt-2">Ao fim da vigência, o acesso é encerrado automaticamente. A renovação é opcional.</p>
        </div>
      </div>
    </section>

    {/* PLANOS */}
    <section id="planos" className="py-20 px-6 bg-muted/30 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-10 text-center">Planos</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_CATALOG.map((p) => (
            <div key={p.code} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.code}</p>
              <h3 className="text-xl font-semibold text-foreground mt-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">{p.duration}</p>
              <div className="mt-5 space-y-1">
                <p className="text-sm"><strong className="text-foreground">{p.pix}</strong></p>
                <p className="text-sm text-muted-foreground">{p.card}</p>
              </div>
              <Button asChild className="mt-6 rounded-full"><Link to="/cadastro">Contratar</Link></Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
          Os valores e modalidades podem ser atualizados. As condições aplicáveis serão sempre as exibidas no momento da contratação e
          registradas no <Link to="/termo" className="underline">Termo de Adesão</Link>.
        </p>
      </div>
    </section>

    {/* FAQ RESUMIDO */}
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-8 text-center">Dúvidas frequentes</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-xl border border-border bg-card p-5 group">
              <summary className="cursor-pointer font-medium text-foreground list-none flex justify-between items-center">
                {f.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-center mt-8">
          <Link to="/faq" className="text-sm text-primary underline">Ver FAQ completo</Link>
        </p>
      </div>
    </section>

    {/* CTA + DISCLAIMER */}
    <section className="py-20 px-6 border-t border-border bg-card">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Pronto para começar seu acompanhamento?
        </h2>
        <Button asChild size="lg" className="rounded-full px-10 mt-8"><Link to="/cadastro">Contratar agora</Link></Button>
        <p className="text-xs text-muted-foreground mt-10 max-w-2xl mx-auto leading-relaxed">
          {LEGAL_DISCLAIMER_SHORT} Ao contratar, você concorda com o{" "}
          <Link to="/termo" className="underline">Termo de Adesão</Link> e com a{" "}
          <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Dúvidas: <a className="underline" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
        </p>
      </div>
    </section>
  </div>
);

export default Programa;