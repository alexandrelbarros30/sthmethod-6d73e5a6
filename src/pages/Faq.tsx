import { Link } from "react-router-dom";

const groups = [
  {
    title: "Sobre a natureza do serviço",
    items: [
      {
        q: "O treino é meu para sempre?",
        a: "Não. O programa de treinamento integra o Programa de Acompanhamento e fica disponível durante a vigência do plano contratado.",
      },
      {
        q: "Posso baixar minha dieta?",
        a: "Alguns planos permitem exportação em PDF; quando habilitado, isso será informado no momento da contratação. Em todos os casos, o material faz parte do acompanhamento e não corresponde a uma aquisição definitiva.",
      },
      {
        q: "Depois do término continuo acessando?",
        a: "Não. Encerrada a vigência, o acesso à plataforma e aos materiais é encerrado, salvo previsão específica para o plano contratado.",
      },
      {
        q: "O que acontece quando termina meu plano?",
        a: "O sistema poderá bloquear automaticamente o acesso. Você pode renovar pelo painel do aluno a qualquer momento.",
      },
    ],
  },
  {
    title: "Renovação e mudança de plano",
    items: [
      { q: "Posso renovar?", a: "Sim. A renovação está disponível na área do aluno e mantém continuidade do acompanhamento sem necessidade de novo cadastro." },
      { q: "Posso mudar de plano?", a: "Sim. Solicite à equipe pelos canais oficiais; ajustamos a vigência conforme as condições do novo plano." },
    ],
  },
  {
    title: "Acompanhamento e equipe",
    items: [
      { q: "Como funciona o acompanhamento?", a: "Durante a vigência, você recebe planejamento individualizado, atualizações estratégicas, reavaliações, ajustes e suporte pelos canais disponibilizados." },
      { q: "Tenho garantia de resultado?", a: "Não. Resultados dependem de adesão, rotina, genética, alimentação, treinamento, condições clínicas e disciplina." },
    ],
  },
  {
    title: "Cancelamento e pagamento",
    items: [
      { q: "Posso cancelar?", a: "Sim, observando a legislação vigente, as condições comerciais do plano e, quando aplicável, o direito de arrependimento de 7 dias (art. 49 do CDC) para contratações fora de estabelecimento comercial." },
      { q: "Como funciona o Projeto Verão?", a: "Programa com vigência de 180 dias, pago em 2 parcelas de R$ 49,50 + 4 parcelas de R$ 94,50. O acesso permanece durante a vigência e enquanto observadas as condições financeiras." },
      { q: "Como funciona o plano gratuito (Selected)?", a: "Plano com funcionalidades limitadas conforme definido pela STH METHOD e vigência estabelecida entre as partes." },
      { q: "O que acontece se a cobrança for recusada?", a: "Tentaremos contato para regularização. A inadimplência pode ocasionar a suspensão do acesso até o pagamento ser confirmado." },
    ],
  },
  {
    title: "Imagem e dados",
    items: [
      { q: "Sou obrigado a autorizar o uso da minha imagem?", a: "Não. A autorização é totalmente facultativa e pode ser alterada a qualquer momento em 'Autorização de imagem' na área do aluno." },
      { q: "Como meus dados são tratados?", a: "Conforme nossa Política de Privacidade e a LGPD. Você pode acessar, corrigir ou eliminar seus dados a qualquer momento." },
    ],
  },
];

const Faq = () => (
  <div className="min-h-screen bg-background py-16 px-6">
    <div className="max-w-3xl mx-auto">
      <header className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Central de ajuda</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Perguntas frequentes</h1>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Tudo sobre o Programa de Acompanhamento STH METHOD, em conformidade com o{" "}
          <Link to="/termo" className="text-primary underline">Termo de Adesão</Link>.
        </p>
      </header>

      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">{g.title}</h2>
            <div className="space-y-3">
              {g.items.map((it) => (
                <details key={it.q} className="rounded-xl border border-border bg-card p-5 group">
                  <summary className="cursor-pointer font-medium text-foreground list-none flex justify-between items-center">
                    {it.q}
                    <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{it.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </div>
);

export default Faq;