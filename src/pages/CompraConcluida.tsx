import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal-version";

const CompraConcluida = () => (
  <div className="min-h-screen bg-background flex items-center px-6 py-16">
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-6" />
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Tudo certo. Bem-vindo(a) ao Programa.</h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Sua contratação foi recebida. Você agora faz parte do <strong>Programa de Acompanhamento em Saúde e Performance</strong> da STH METHOD,
        com vigência conforme o plano escolhido.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-10 text-left">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Prazo de liberação</p>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Pix: liberação automática após a confirmação. Cartão: até alguns minutos após a aprovação pela operadora.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Como acessar</p>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Entre em sua conta pela área do aluno. Você receberá também um e-mail de boas-vindas.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Como funciona o acompanhamento</p>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            Avaliação inicial, planejamento, ajustes e suporte da equipe durante toda a vigência do seu plano.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Fale com a equipe</p>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            WhatsApp oficial e e-mail{" "}
            <a className="text-primary underline" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="rounded-full px-8"><Link to="/dashboard">Acessar área do aluno</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-8"><Link to="/termo">Ver Termo de Adesão</Link></Button>
      </div>

      <p className="text-xs text-muted-foreground mt-10 leading-relaxed max-w-xl mx-auto">
        Lembrete: o Programa possui <strong>prazo determinado</strong>. Ao final da vigência, o acesso é encerrado. Você pode renovar a qualquer momento.
      </p>
    </div>
  </div>
);

export default CompraConcluida;