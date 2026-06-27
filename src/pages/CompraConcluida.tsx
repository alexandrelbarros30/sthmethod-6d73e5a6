import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, ShieldAlert, Camera, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL, LEGAL_DISCLAIMER_SHORT } from "@/lib/legal-version";

const CompraConcluida = () => (
  <div className="min-h-screen bg-background flex items-center px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <div className="text-center">
      <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-6" />
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Tudo certo. Bem-vindo(a) ao Programa.</h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Sua contratação foi recebida. Você agora faz parte do <strong>Programa de Acompanhamento em Saúde e Performance</strong> da STH METHOD,
        com vigência conforme o plano escolhido.
      </p>
      </div>

      {/* Próximos passos */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Próximos passos do seu onboarding</p>
        </div>
        <ol className="space-y-3 text-sm text-foreground">
          {[
            { n: 1, t: "Acesse a área do aluno", d: "Use seu e-mail e senha para entrar pela primeira vez." },
            { n: 2, t: "Complete sua avaliação inicial", d: "Anamnese, objetivo e dados básicos liberam o planejamento da equipe." },
            { n: 3, t: "Defina sua autorização de uso de imagem", d: "Você pode revisar e alterar sua preferência a qualquer momento no perfil." },
            { n: 4, t: "Acompanhe sua vigência", d: "O Programa tem prazo determinado. O painel mostra os dias restantes." },
          ].map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">{s.n}</span>
              <div>
                <p className="font-medium">{s.t}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Responsabilidade do cliente */}
      <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Sua responsabilidade no Programa</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-foreground leading-relaxed list-disc pl-5">
              <li>Informar condições clínicas, uso de medicamentos e quaisquer restrições à equipe.</li>
              <li>Realizar avaliações e ajustes nos prazos sinalizados.</li>
              <li>Não compartilhar dietas, treinos, materiais ou seu acesso à plataforma.</li>
              <li>Entender que se trata de um acompanhamento por prazo determinado, sem garantia de resultado.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6 text-left">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><p className="text-xs uppercase tracking-widest text-muted-foreground">Prazo de liberação</p></div>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Pix: liberação automática após a confirmação. Cartão: até alguns minutos após a aprovação pela operadora.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /><p className="text-xs uppercase tracking-widest text-muted-foreground">Como acessar</p></div>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Entre em sua conta pela área do aluno. Você receberá também um e-mail de boas-vindas.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><p className="text-xs uppercase tracking-widest text-muted-foreground">Como funciona</p></div>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Avaliação inicial, planejamento, ajustes e suporte da equipe durante toda a vigência do seu plano.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-muted-foreground" /><p className="text-xs uppercase tracking-widest text-muted-foreground">Fale com a equipe</p></div>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            WhatsApp oficial e e-mail{" "}
            <a className="text-primary underline" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
          </p>
        </div>
      </div>

      {/* Convite para autorização de imagem */}
      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3">
        <Camera className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Quer revisar agora a autorização de uso de imagem?</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
            Sua escolha não interfere no atendimento. Pode ser alterada a qualquer momento no perfil do aluno.
          </p>
        </div>
        <Link to="/dashboard/profile#imagem">
          <Button size="sm" variant="outline">Definir agora</Button>
        </Link>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="rounded-full px-8"><Link to="/dashboard">Acessar área do aluno</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-8"><Link to="/termo">Ver Termo de Adesão</Link></Button>
      </div>

      <p className="text-xs text-muted-foreground mt-10 leading-relaxed max-w-xl mx-auto text-center">
        {LEGAL_DISCLAIMER_SHORT}
      </p>
    </div>
  </div>
);

export default CompraConcluida;