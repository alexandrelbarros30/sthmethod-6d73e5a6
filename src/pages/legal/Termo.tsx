import { Link } from "react-router-dom";
import { LEGAL } from "@/lib/legal-version";

const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3 tracking-tight">
      {n}. {title}
    </h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const Termo = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Documento legal</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Termo de Adesão e Condições Gerais de Prestação de Serviços
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          STH METHOD · Programa de Acompanhamento em Saúde e Performance
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Versão: {LEGAL.termsVersion}</p>
      </header>

      <p className="mb-8 text-[15px] text-muted-foreground">
        Ao aderir aos serviços da STH METHOD, o CONTRATANTE declara que leu, compreendeu e concorda
        integralmente com as condições abaixo.
      </p>

      <Section n="1" title="Das partes">
        <p><strong>CONTRATADA:</strong> STH METHOD, responsável pela prestação de serviços de consultoria em saúde e performance.</p>
        <p><strong>CONTRATANTE:</strong> Pessoa física identificada no cadastro realizado na plataforma.</p>
      </Section>

      <Section n="2" title="Do objeto">
        <p>Prestação de serviços de acompanhamento em saúde e performance por prazo determinado, conforme o plano contratado.</p>
        <p>A contratação contempla o acesso ao ecossistema digital da STH METHOD durante a vigência do plano escolhido, incluindo ferramentas, materiais, suporte e estratégias individualizadas.</p>
      </Section>

      <Section n="3" title="Da natureza do serviço">
        <p>O CONTRATANTE declara ciência de que está contratando um <strong>Programa de Acompanhamento</strong>, e não a aquisição definitiva de dietas, treinos, protocolos ou quaisquer documentos individualizados.</p>
        <p>Durante a vigência do plano poderão ser disponibilizados, conforme necessidade técnica: planejamento alimentar; programa de treinamento; protocolos de suplementação, quando aplicáveis; avaliações periódicas; atualizações estratégicas; ajustes individuais; materiais educativos; suporte da equipe.</p>
      </Section>

      <Section n="4" title="Do funcionamento da consultoria">
        <p>O acompanhamento possui duração determinada conforme o plano contratado. Durante esse período o CONTRATANTE terá acesso aos recursos disponibilizados pela plataforma, podendo compreender avaliação inicial, definição de objetivos, planejamento individualizado, atualizações técnicas, reavaliações, ajustes de estratégias e atendimento da equipe dentro dos canais disponibilizados.</p>
      </Section>

      <Section n="5" title="Dos planos">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Plano 30D</strong> — 30 dias · R$ 87,00 via Pix ou R$ 97,00 no cartão.</li>
          <li><strong>Plano 90D</strong> — 90 dias · R$ 227,00 via Pix ou até 3x de R$ 85,67.</li>
          <li><strong>Plano 6M</strong> — 180 dias · R$ 427,00 via Pix ou até 6x de R$ 79,50.</li>
          <li><strong>Plano Selected</strong> — gratuito, vigência estabelecida entre as partes, funcionalidades limitadas conforme definido pela CONTRATADA.</li>
          <li><strong>Projeto Verão 180</strong> — 180 dias · 2 parcelas de R$ 49,50 + 4 parcelas de R$ 94,50. O acesso permanece disponível durante a vigência contratada e enquanto observadas as condições financeiras.</li>
        </ul>
      </Section>

      <Section n="6" title="Da vigência">
        <p>A vigência inicia-se na data da liberação do acesso à plataforma. Cada plano possui prazo determinado. Ao término do período contratado, considera-se encerrada a prestação do serviço.</p>
      </Section>

      <Section n="7" title="Do acesso à plataforma">
        <p>Durante a vigência, o CONTRATANTE terá acesso aos conteúdos, ferramentas e materiais disponibilizados. O acesso é pessoal, individual e intransferível.</p>
      </Section>

      <Section n="8" title="Do encerramento do acesso">
        <p>Encerrada a vigência, o sistema poderá bloquear automaticamente o acesso do CONTRATANTE. O plano contratado corresponde ao acesso temporário ao Programa; dietas, treinos, protocolos, materiais e demais conteúdos integram o acompanhamento prestado durante a vigência. O término do plano encerra também o acesso aos recursos, salvo previsão específica para determinado plano.</p>
      </Section>

      <Section n="9" title="Dos planos com recursos adicionais">
        <p>Algumas modalidades poderão disponibilizar recursos adicionais (exportação de PDF, materiais complementares ou funcionalidades extras), sempre informados previamente no momento da contratação.</p>
      </Section>

      <Section n="10" title="Das obrigações do CONTRATANTE">
        <ul className="list-disc pl-5 space-y-1">
          <li>Fornecer informações verdadeiras;</li>
          <li>Comunicar alterações relevantes de saúde;</li>
          <li>Seguir as orientações conforme suas condições individuais;</li>
          <li>Utilizar a plataforma de forma ética;</li>
          <li>Manter seus dados atualizados;</li>
          <li>Preservar seu login e senha.</li>
        </ul>
      </Section>

      <Section n="11" title="Das obrigações da CONTRATADA">
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestar os serviços contratados;</li>
          <li>Disponibilizar os recursos previstos para cada plano;</li>
          <li>Manter sigilo das informações;</li>
          <li>Realizar o acompanhamento durante a vigência contratada.</li>
        </ul>
      </Section>

      <Section n="12" title="Dos resultados">
        <p>A STH METHOD não garante resultados específicos. Os resultados dependem de fatores como adesão, rotina, genética, alimentação, treinamento, condições clínicas e disciplina.</p>
      </Section>

      <Section n="13" title="Do uso de imagem, voz, depoimentos e evolução">
        <p>A autorização para utilização da imagem do CONTRATANTE é totalmente facultativa. Sua concessão ou recusa não interfere na prestação dos serviços.</p>
        <p>O CONTRATANTE poderá optar por: (i) não autorizar qualquer utilização; (ii) autorizar a divulgação sem identificação pessoal; (iii) autorizar a divulgação com identificação.</p>
        <p>A autorização poderá abranger fotografias, vídeos, registros corporais, comparativos de evolução, depoimentos e demais conteúdos relacionados ao acompanhamento, e poderá ser alterada a qualquer momento. A revogação não torna ilícitas as divulgações já realizadas enquanto havia consentimento válido.</p>
      </Section>

      <Section n="14" title="Da proteção de dados">
        <p>Os dados pessoais serão tratados exclusivamente para execução deste contrato, cumprimento de obrigações legais e melhoria da prestação dos serviços, observando a legislação vigente (LGPD).</p>
        <p>Consulte a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.</p>
      </Section>

      <Section n="15" title="Da propriedade intelectual">
        <p>A plataforma, métodos, identidade visual, materiais educativos, sistemas, textos, vídeos e demais conteúdos pertencem à STH METHOD. É vedada sua reprodução, distribuição, comercialização ou compartilhamento sem autorização.</p>
      </Section>

      <Section n="16" title="Dos pagamentos">
        <p>Os pagamentos poderão ocorrer via Pix, cartão de crédito ou demais meios disponibilizados. A inadimplência poderá ocasionar suspensão do acesso até a regularização financeira.</p>
      </Section>

      <Section n="17" title="Do cancelamento">
        <p>As regras de cancelamento observarão a legislação vigente, as condições comerciais do plano contratado e, quando aplicável, o direito de arrependimento previsto para contratações realizadas fora do estabelecimento comercial (art. 49 do CDC — 7 dias).</p>
      </Section>

      <Section n="18" title="Das comunicações">
        <p>O CONTRATANTE autoriza o envio de comunicações relacionadas ao acompanhamento, lembretes, atualizações da plataforma, informações técnicas e contatos administrativos. Poderá optar por deixar de receber comunicações de caráter promocional, sem prejuízo das comunicações essenciais para a execução do contrato.</p>
      </Section>

      <Section n="19" title="Disposições finais">
        <p>A eventual nulidade de qualquer cláusula não afetará as demais disposições deste Termo. A tolerância de qualquer das partes não implicará renúncia de direitos. Este Termo substitui entendimentos anteriores relacionados ao objeto contratado.</p>
      </Section>

      <Section n="20" title="Do aceite">
        <p>Ao concluir sua contratação, o CONTRATANTE declara que leu integralmente este Termo, compreendeu suas cláusulas, está ciente da natureza temporária do Programa STH METHOD, concorda com as condições comerciais do plano escolhido e aceita eletronicamente este Termo de Adesão, produzindo todos os efeitos legais.</p>
      </Section>

      <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
        Dúvidas: <a className="text-primary" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> ·{" "}
        <a className="text-primary" href={`https://wa.me/${LEGAL.supportWhatsapp}`} target="_blank" rel="noreferrer">WhatsApp oficial</a>
      </footer>
    </article>
  </div>
);

export default Termo;