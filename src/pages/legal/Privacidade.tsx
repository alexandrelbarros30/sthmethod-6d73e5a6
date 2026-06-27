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

const Privacidade = () => (
  <div className="min-h-screen bg-background py-12 px-6">
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Documento legal</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Política de Privacidade e Proteção de Dados
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">STH METHOD · LGPD (Lei 13.709/2018)</p>
        <p className="mt-1 text-xs text-muted-foreground">Versão: {LEGAL.privacyVersion}</p>
      </header>

      <Section n="1" title="Quem somos">
        <p>A STH METHOD é a controladora dos dados coletados nesta plataforma para a prestação do Programa de Acompanhamento em Saúde e Performance.</p>
      </Section>

      <Section n="2" title="Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Dados cadastrais: nome, CPF/RG, data de nascimento, e-mail, telefone, endereço.</li>
          <li>Dados de saúde e performance: peso, medidas, fotos de evolução, anamnese, histórico clínico declarado, exames laboratoriais quando enviados pelo titular.</li>
          <li>Dados de uso: acessos, interações com conteúdos, registros de treino e refeições.</li>
          <li>Dados financeiros: comprovantes de pagamento Pix, identificadores de transação no gateway (Mercado Pago). Não armazenamos números completos de cartão.</li>
        </ul>
      </Section>

      <Section n="3" title="Como usamos seus dados">
        <ul className="list-disc pl-5 space-y-1">
          <li>Execução do contrato e prestação do acompanhamento;</li>
          <li>Personalização de planejamento alimentar, treino e protocolos;</li>
          <li>Comunicação de avisos essenciais (vencimento, atualizações, lembretes);</li>
          <li>Cumprimento de obrigações legais, contábeis e regulatórias;</li>
          <li>Melhoria contínua da plataforma e dos serviços.</li>
        </ul>
      </Section>

      <Section n="4" title="Base legal">
        <p>O tratamento baseia-se em: execução de contrato (art. 7º, V), consentimento (art. 7º, I, e art. 11, I para dados sensíveis), cumprimento de obrigação legal/regulatória (art. 7º, II) e legítimo interesse para segurança e prevenção a fraudes (art. 7º, IX).</p>
      </Section>

      <Section n="5" title="Compartilhamento">
        <p>Compartilhamos dados apenas com operadores estritamente necessários: provedor de infraestrutura, gateway de pagamento (Mercado Pago), provedor de e-mail transacional, provedor de mensageria (WhatsApp Business). Não vendemos dados a terceiros.</p>
      </Section>

      <Section n="6" title="Imagem e evolução corporal">
        <p>O uso de imagem do CONTRATANTE é facultativo e segue a opção registrada no cadastro: <em>não autorizo</em>, <em>autorizo sem identificação</em> ou <em>autorizo com identificação</em>. A escolha pode ser alterada a qualquer momento em "Autorização de imagem" na área do aluno.</p>
      </Section>

      <Section n="7" title="Retenção">
        <p>Os dados são mantidos durante a vigência da relação contratual e pelos prazos legais aplicáveis após o encerramento (fiscal/contábil até 5 anos; demais conforme legislação).</p>
      </Section>

      <Section n="8" title="Segurança">
        <p>Adotamos medidas técnicas e administrativas para proteger seus dados: criptografia em trânsito, controles de acesso por função, logs de auditoria e ambientes segregados.</p>
      </Section>

      <Section n="9" title="Seus direitos (LGPD)">
        <p>Você pode solicitar, a qualquer momento: confirmação de tratamento, acesso, correção, anonimização/eliminação de dados desnecessários, portabilidade, informação sobre compartilhamento, revogação de consentimento. Para exercer, escreva para <a className="text-primary" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</p>
      </Section>

      <Section n="10" title="Cookies">
        <p>Utilizamos cookies essenciais para autenticação e funcionamento da plataforma, e cookies analíticos para melhorar a experiência. Você pode configurar seu navegador para bloqueá-los, ciente de que algumas funcionalidades podem ser afetadas.</p>
      </Section>

      <Section n="11" title="Encarregado (DPO)">
        <p>Contato do encarregado pelo tratamento de dados: <a className="text-primary" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.</p>
      </Section>

      <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
        Veja também o <Link to="/termo" className="text-primary underline">Termo de Adesão</Link>.
      </footer>
    </article>
  </div>
);

export default Privacidade;