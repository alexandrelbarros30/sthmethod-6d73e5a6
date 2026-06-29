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

const SubSection = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="mb-6 ml-2">
    <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 tracking-tight">
      {n} {title}
    </h3>
    <div className="space-y-2 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
  </div>
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
        Ao aderir aos serviços da STH METHOD, o CONTRATANTE declara que leu integralmente este Termo de
        Adesão, compreendeu seu conteúdo e concorda com todas as condições aqui estabelecidas, as quais
        disciplinam a prestação dos serviços contratados. A contratação dos serviços implica a aceitação
        deste Termo, da Política de Privacidade e das demais condições disponibilizadas pela STH METHOD
        no momento da contratação.
      </p>

      <Section n="1" title="Das partes">
        <p><strong>CONTRATADA:</strong> STH METHOD, empresa especializada na prestação de serviços de acompanhamento em saúde e performance, responsável pela administração da plataforma digital, desenvolvimento da metodologia e execução dos serviços previstos neste instrumento.</p>
        <p><strong>CONTRATANTE:</strong> Pessoa física devidamente identificada no cadastro eletrônico realizado junto à plataforma da STH METHOD, que adere voluntariamente ao programa de acompanhamento.</p>
      </Section>

      <Section n="2" title="Do objeto">
        <p>O presente Termo tem por objeto a prestação de serviços de acompanhamento em saúde e performance por prazo determinado, conforme o plano escolhido pelo CONTRATANTE.</p>
        <p>A contratação compreende o acesso temporário ao ecossistema digital da STH METHOD durante a vigência do plano contratado, podendo incluir ferramentas tecnológicas, conteúdos técnicos, materiais educativos, suporte, acompanhamento e estratégias individualizadas.</p>
        <p>O serviço possui natureza continuada durante o período contratado e será executado conforme a modalidade escolhida pelo CONTRATANTE.</p>
      </Section>

      <Section n="3" title="Da natureza do serviço">
        <p>O CONTRATANTE declara ciência de que está contratando um <strong>Programa de Acompanhamento em Saúde e Performance</strong>, e não a aquisição definitiva de dietas, programas de treinamento, protocolos, materiais ou documentos individualizados.</p>
        <p>Durante a vigência do plano contratado, poderão ser disponibilizados, conforme critérios técnicos e as características do plano escolhido:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Planejamento alimentar individualizado;</li>
          <li>Programas de treinamento físico;</li>
          <li>Protocolos de suplementação, quando aplicáveis;</li>
          <li>Avaliações periódicas;</li>
          <li>Atualizações técnicas;</li>
          <li>Ajustes individualizados;</li>
          <li>Estratégias de acompanhamento;</li>
          <li>Materiais educativos;</li>
          <li>Conteúdos digitais;</li>
          <li>Suporte prestado pelos canais disponibilizados pela STH METHOD.</li>
        </ul>
        <p>Todos esses recursos integram o serviço de acompanhamento e permanecem vinculados à vigência do plano contratado.</p>
        <p>A contratação não implica cessão de propriedade intelectual, venda definitiva de materiais ou direito de acesso permanente aos conteúdos disponibilizados durante o acompanhamento, salvo previsão expressa em contrário.</p>
      </Section>

      <Section n="4" title="Do funcionamento do acompanhamento">
        <p>O Programa STH METHOD foi desenvolvido para promover acompanhamento contínuo durante o período contratado.</p>
        <p>Após a confirmação da contratação, o CONTRATANTE poderá realizar seu cadastro e fornecer informações necessárias para personalização do acompanhamento.</p>
        <p>O processo poderá compreender: cadastro inicial; avaliação das informações fornecidas; definição dos objetivos; planejamento individualizado; disponibilização dos recursos previstos para o plano; atualizações periódicas; ajustes técnicos conforme evolução; reavaliações; suporte por meio dos canais oficiais disponibilizados.</p>
        <p>O acompanhamento será realizado exclusivamente durante a vigência do plano contratado.</p>
        <p>A qualidade do acompanhamento depende da colaboração do CONTRATANTE, especialmente quanto ao fornecimento de informações verdadeiras, atualizadas e completas.</p>
      </Section>

      <Section n="5" title="Dos planos">
        <p>A STH METHOD disponibiliza diferentes modalidades de acompanhamento, cada uma com vigência, funcionalidades e condições comerciais próprias.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Plano 30D</strong> — Vigência de 30 dias. R$ 87,00 via Pix ou R$ 97,00 no cartão de crédito.</li>
          <li><strong>Plano 90D</strong> — Vigência de 90 dias. R$ 227,00 via Pix ou até 3 parcelas de R$ 85,67 no cartão.</li>
          <li><strong>Plano 6M</strong> — Vigência de 180 dias. R$ 427,00 via Pix ou até 6 parcelas de R$ 79,50 no cartão. Poderá incluir funcionalidades adicionais conforme divulgado.</li>
          <li><strong>Plano Selected</strong> — Plano gratuito concedido mediante critérios definidos pela STH METHOD. Duração, funcionalidades e condições estabelecidas individualmente.</li>
          <li><strong>Projeto Verão 180</strong> — Programa especial com duração de 180 dias. Pagamento em 2 parcelas iniciais de R$ 49,50 + 4 parcelas subsequentes de R$ 94,50.</li>
        </ul>
      </Section>

      <Section n="6" title="Da vigência">
        <p>A vigência do plano inicia-se na data da efetiva liberação do acesso à plataforma pela STH METHOD.</p>
        <p>Cada modalidade possui prazo determinado, conforme descrito neste Termo e nas condições comerciais da contratação.</p>
        <p>Encerrado o período contratado, considera-se concluída a prestação dos serviços correspondente ao plano escolhido.</p>
        <p>A contratação não gera renovação automática, salvo quando expressamente prevista nas condições específicas da modalidade contratada.</p>
      </Section>

      <Section n="7" title="Do acesso à plataforma">
        <p>Durante a vigência do plano contratado, o CONTRATANTE terá acesso aos conteúdos, ferramentas e funcionalidades disponibilizados para sua modalidade.</p>
        <p>O acesso é pessoal, individual, intransferível e vinculado exclusivamente ao cadastro do CONTRATANTE. É proibido compartilhar login, senha ou qualquer forma de acesso com terceiros.</p>
        <p>A STH METHOD poderá adotar medidas de segurança para impedir acessos simultâneos, compartilhamentos indevidos ou utilização em desacordo com este Termo.</p>
        <p>Os recursos disponíveis poderão variar conforme o plano contratado e poderão ser atualizados visando melhorias na experiência do usuário, sem descaracterizar o objeto principal do serviço.</p>
      </Section>

      <Section n="8" title="Do encerramento do acesso">
        <p>O CONTRATANTE declara estar ciente de que o Programa STH METHOD possui prazo determinado, conforme a modalidade contratada.</p>
        <p>Encerrada a vigência do plano, o acesso à plataforma poderá ser automaticamente bloqueado, independentemente de aviso prévio, encerrando-se a prestação dos serviços correspondente ao período contratado.</p>
        <p>O CONTRATANTE reconhece que: o plano contratado corresponde ao direito de acesso temporário ao Programa STH METHOD; dietas, programas de treinamento, protocolos, avaliações, materiais educativos, conteúdos digitais e demais recursos disponibilizados integram o acompanhamento prestado durante a vigência contratada; o encerramento da vigência implica também o encerramento do acesso aos recursos disponibilizados, salvo previsão expressa em sentido diverso para determinado plano.</p>
        <p>A eventual contratação de novo plano não obriga a CONTRATADA a restabelecer conteúdos anteriormente disponibilizados, podendo ser elaborado novo planejamento conforme avaliação técnica.</p>
      </Section>

      <Section n="9" title="Dos planos com recursos adicionais">
        <p>Determinadas modalidades poderão oferecer funcionalidades adicionais, incluindo, entre outras: exportação de documentos em formato PDF; materiais complementares; conteúdos exclusivos; recursos tecnológicos adicionais; funcionalidades específicas da plataforma.</p>
        <p>Os recursos adicionais serão informados previamente ao CONTRATANTE no momento da contratação e poderão variar conforme a modalidade escolhida.</p>
        <p>A disponibilização de funcionalidades exclusivas em determinados planos não caracteriza tratamento desigual entre os clientes, constituindo diferenciação legítima entre modalidades comerciais distintas.</p>
      </Section>

      <Section n="10" title="Das obrigações do CONTRATANTE">
        <p>São obrigações do CONTRATANTE:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fornecer informações completas, verdadeiras e atualizadas;</li>
          <li>Comunicar qualquer alteração relevante em seu estado de saúde;</li>
          <li>Informar a utilização de medicamentos, suplementos ou tratamentos que possam interferir no acompanhamento;</li>
          <li>Comunicar gravidez, cirurgias, lesões, doenças, limitações físicas ou quaisquer condições relevantes;</li>
          <li>Seguir as orientações recebidas de acordo com suas condições individuais;</li>
          <li>Utilizar a plataforma de forma ética e de boa-fé;</li>
          <li>Manter seus dados cadastrais atualizados;</li>
          <li>Preservar o sigilo de seu login e senha;</li>
          <li>Não compartilhar conteúdos, materiais ou acesso com terceiros;</li>
          <li>Respeitar os direitos de propriedade intelectual da STH METHOD.</li>
        </ul>
        <p>O CONTRATANTE declara que a omissão de informações relevantes poderá comprometer a qualidade e a segurança do acompanhamento prestado.</p>
      </Section>

      <Section n="11" title="Das obrigações da CONTRATADA">
        <p>Compete à STH METHOD:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestar os serviços previstos neste Termo durante a vigência do plano contratado;</li>
          <li>Disponibilizar os recursos correspondentes à modalidade escolhida;</li>
          <li>Realizar o acompanhamento conforme sua metodologia;</li>
          <li>Preservar a confidencialidade das informações do CONTRATANTE, observadas as hipóteses legais;</li>
          <li>Buscar o aperfeiçoamento contínuo da plataforma e dos serviços.</li>
        </ul>
        <SubSection n="11.1" title="Dos exames laboratoriais">
          <p>A STH METHOD não realiza solicitação, requisição ou emissão de pedidos de exames laboratoriais, exames de imagem ou quaisquer outros exames diagnósticos como parte dos serviços contratados.</p>
          <p>Sempre que a equipe técnica entender que exames complementares possam contribuir para melhor acompanhamento do CONTRATANTE, este poderá ser orientado a procurar profissional legalmente habilitado para avaliação clínica e eventual solicitação dos exames considerados necessários.</p>
        </SubSection>
        <SubSection n="11.2" title="Dos medicamentos, suplementos e prescrições">
          <p>A STH METHOD não realiza consultas médicas, diagnósticos médicos, prescrição de medicamentos nem substitui acompanhamento médico.</p>
          <p>As orientações fornecidas poderão contemplar estratégias relacionadas à alimentação, treinamento físico, suplementação e hábitos de vida, sempre respeitando as atribuições legais dos profissionais responsáveis pelo atendimento.</p>
          <p>Quando houver necessidade de avaliação clínica, diagnóstico, prescrição de medicamentos, solicitação de exames ou qualquer outra conduta privativa de profissional legalmente habilitado, o CONTRATANTE será orientado a procurar o respectivo profissional.</p>
          <p>A eventual indicação da necessidade de utilização de medicamentos, suplementos, exames ou tratamentos não constitui prescrição médica ou receita emitida pela STH METHOD.</p>
        </SubSection>
        <SubSection n="11.3" title="Do acompanhamento multiprofissional">
          <p>O CONTRATANTE declara ciência de que o Programa STH METHOD não substitui: consultas médicas; acompanhamento psicológico; atendimento fisioterapêutico; acompanhamento hospitalar; tratamentos clínicos; atendimento de urgência ou emergência.</p>
          <p>Sempre que identificado pela equipe técnica, o CONTRATANTE poderá ser orientado a procurar profissionais habilitados para avaliação complementar.</p>
        </SubSection>
        <SubSection n="11.4" title="Das informações prestadas">
          <p>O CONTRATANTE declara que todas as informações fornecidas durante seu cadastro e acompanhamento são verdadeiras, comprometendo-se a comunicar imediatamente qualquer alteração relevante que possa influenciar a prestação dos serviços.</p>
          <p>A STH METHOD poderá fundamentar suas orientações nas informações fornecidas pelo CONTRATANTE, não sendo responsável por prejuízos decorrentes de informações falsas, incompletas ou omitidas.</p>
        </SubSection>
        <SubSection n="11.5" title="Da segurança do CONTRATANTE">
          <p>Caso a equipe técnica identifique situação que possa representar risco à saúde do CONTRATANTE, a STH METHOD poderá recomendar a suspensão temporária das estratégias propostas até que seja realizada avaliação por profissional legalmente habilitado.</p>
          <p>Tal medida possui finalidade exclusivamente preventiva e não caracteriza interrupção injustificada da prestação dos serviços.</p>
        </SubSection>
      </Section>

      <Section n="12" title="Dos resultados">
        <p>O CONTRATANTE declara ciência de que a STH METHOD não garante resultados específicos.</p>
        <p>Os resultados dependem de diversos fatores, incluindo: adesão ao programa; disciplina; alimentação; rotina; treinamento; condições clínicas; fatores hormonais; fatores genéticos; qualidade do sono; utilização correta das orientações recebidas.</p>
        <p>A contratação corresponde à prestação de um serviço de acompanhamento, não constituindo promessa de resultado.</p>
      </Section>

      <Section n="13" title="Do uso de imagem, voz, depoimentos e evolução">
        <p>A autorização para utilização da imagem do CONTRATANTE é totalmente facultativa. Sua concessão, recusa ou posterior alteração não interfere na prestação dos serviços contratados.</p>
        <p>O CONTRATANTE poderá optar por: (i) não autorizar qualquer utilização da imagem, voz, depoimentos ou evolução; (ii) autorizar a divulgação sem identificação pessoal; (iii) autorizar a divulgação com identificação.</p>
        <p>A autorização poderá abranger fotografias, vídeos, registros corporais, comparativos de evolução, depoimentos e demais conteúdos relacionados ao acompanhamento.</p>
        <p>O CONTRATANTE poderá conceder, alterar ou revogar sua autorização a qualquer momento, durante ou após a vigência contratual, por meio da plataforma ou dos canais oficiais disponibilizados pela STH METHOD. Caso a autorização seja concedida posteriormente, produzirá efeitos apenas para divulgações futuras.</p>
        <p>A revogação da autorização não tornará ilícitas as divulgações realizadas durante o período em que havia consentimento válido, comprometendo-se a CONTRATADA a interromper novas divulgações após a solicitação, observadas as limitações técnicas e operacionais para remoção de conteúdos já publicados.</p>
      </Section>

      <Section n="14" title="Da proteção de dados pessoais">
        <p>A STH METHOD tratará os dados pessoais do CONTRATANTE em conformidade com a legislação aplicável, exclusivamente para: execução deste contrato; prestação dos serviços; comunicações relacionadas ao acompanhamento; cumprimento de obrigações legais; melhoria contínua da plataforma e da experiência do usuário.</p>
        <p>Os dados serão tratados com medidas de segurança compatíveis com sua natureza e não serão utilizados para finalidades incompatíveis com este Termo, ressalvadas as hipóteses autorizadas por lei ou mediante consentimento do CONTRATANTE.</p>
        <p>Consulte a <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>.</p>
      </Section>

      <Section n="15" title="Da propriedade intelectual">
        <p>Todo o conteúdo disponibilizado pela STH METHOD é protegido pela legislação aplicável sobre propriedade intelectual.</p>
        <p>Constituem propriedade exclusiva da STH METHOD, dentre outros: metodologia de acompanhamento; protocolos desenvolvidos; materiais educativos; planejamentos; vídeos; textos; imagens; gráficos; documentos; identidade visual; logotipos; sistemas; softwares; banco de dados; conteúdos disponibilizados na plataforma.</p>
        <p>O acesso aos conteúdos durante a vigência do plano não transfere ao CONTRATANTE qualquer direito de propriedade intelectual.</p>
        <p>É expressamente proibido copiar, reproduzir, comercializar, distribuir, compartilhar, disponibilizar a terceiros, modificar ou utilizar para fins comerciais qualquer conteúdo da plataforma sem autorização expressa da STH METHOD.</p>
        <p>O descumprimento desta cláusula poderá ensejar responsabilização civil e, quando cabível, penal.</p>
      </Section>

      <Section n="16" title="Dos pagamentos">
        <p>Os pagamentos poderão ser realizados pelos meios disponibilizados pela STH METHOD no momento da contratação. Os valores de cada modalidade encontram-se informados neste Termo e na página oficial de contratação.</p>
        <p>Nos planos parcelados ou recorrentes, o CONTRATANTE declara ciência das condições financeiras antes da conclusão da contratação.</p>
        <p>A falta de pagamento poderá acarretar: suspensão temporária do acesso; bloqueio dos serviços; cancelamento da assinatura recorrente, quando aplicável; adoção das medidas administrativas e legais cabíveis.</p>
        <p>O eventual atraso no pagamento não prorroga automaticamente a vigência originalmente contratada, salvo decisão expressa da STH METHOD.</p>
      </Section>

      <Section n="17" title="Do cancelamento, renovação e direito de arrependimento">
        <p>O CONTRATANTE poderá solicitar o cancelamento do plano conforme as condições comerciais da modalidade contratada e a legislação aplicável.</p>
        <p>Nas contratações realizadas pela internet ou fora do estabelecimento comercial, poderá ser exercido o direito de arrependimento dentro do prazo legal, desde que observados os requisitos previstos na legislação.</p>
        <p>Após iniciado o acompanhamento e transcorrido o prazo legal para arrependimento, aplicam-se as regras específicas do plano contratado.</p>
        <p>Ao término da vigência, o plano será considerado encerrado. A renovação dependerá de nova contratação, salvo quando houver modalidade com cobrança recorrente previamente aceita pelo CONTRATANTE.</p>
        <p>A renovação constitui novo período contratual, podendo haver atualização de estratégias, materiais e planejamentos.</p>
      </Section>

      <Section n="18" title="Das comunicações">
        <p>O CONTRATANTE autoriza o recebimento de comunicações relacionadas ao Programa STH METHOD por meio dos canais informados em seu cadastro.</p>
        <p>Essas comunicações poderão incluir: informações sobre o acompanhamento; lembretes; solicitações de atualização de peso, medidas e fotografias; avisos de reavaliação; notificações sobre o encerramento da vigência; convites para renovação; mensagens administrativas; comunicados técnicos; atualizações da plataforma.</p>
        <p>O CONTRATANTE poderá optar por não receber comunicações exclusivamente promocionais, permanecendo o envio das comunicações indispensáveis à execução do contrato.</p>
      </Section>

      <Section n="19" title="Das disposições gerais">
        <p>Este Termo constitui o acordo integral entre as partes relativamente ao objeto contratado.</p>
        <p>A eventual nulidade ou invalidade de qualquer cláusula não prejudicará a validade das demais disposições.</p>
        <p>A eventual tolerância da STH METHOD quanto ao descumprimento de qualquer obrigação não constituirá renúncia de direitos nem alteração contratual.</p>
        <p>Os serviços poderão sofrer aperfeiçoamentos técnicos, atualizações da plataforma e melhorias operacionais durante a vigência contratada, desde que tais alterações não descaracterizem o objeto principal do serviço.</p>
        <p>A STH METHOD poderá atualizar este Termo sempre que necessário para adequação legal, tecnológica ou operacional, respeitados os direitos adquiridos e a legislação aplicável.</p>
        <p>Fica eleito o foro da comarca do domicílio do CONTRATANTE ou outro previsto pela legislação aplicável para dirimir eventuais controvérsias decorrentes deste Termo.</p>
      </Section>

      <Section n="20" title="Do aceite eletrônico">
        <p>Ao concluir sua contratação, o CONTRATANTE declara que:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Leu integralmente este Termo de Adesão;</li>
          <li>Compreendeu todas as cláusulas aqui estabelecidas;</li>
          <li>Teve oportunidade de esclarecer eventuais dúvidas antes da contratação;</li>
          <li>Está ciente de que contrata um Programa de Acompanhamento em Saúde e Performance, com duração determinada;</li>
          <li>Compreende que dietas, treinamentos, protocolos, materiais e demais recursos integram o acompanhamento prestado durante a vigência do plano contratado;</li>
          <li>Está ciente de que o acesso à plataforma poderá ser encerrado automaticamente ao término da vigência do plano, conforme previsto neste Termo;</li>
          <li>Concorda com as condições comerciais da modalidade escolhida;</li>
          <li>Concorda com a Política de Privacidade e com o tratamento de seus dados pessoais para execução deste contrato;</li>
          <li>Reconhece que a autorização para uso de imagem é facultativa e poderá ser concedida, alterada ou revogada nos termos deste instrumento;</li>
          <li>Declara que todas as informações fornecidas à STH METHOD são verdadeiras e completas;</li>
          <li>Aceita eletronicamente este Termo de Adesão, reconhecendo sua validade jurídica e eficácia para todos os fins de direito.</li>
        </ul>
      </Section>

      <Section n="21" title="Anexo I — Planos e condições comerciais">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Plano 30D</strong> — Vigência: 30 dias. Investimento: R$ 87,00 via Pix ou R$ 97,00 no cartão. Acesso durante a vigência do plano.</li>
          <li><strong>Plano 90D</strong> — Vigência: 90 dias. Investimento: R$ 227,00 via Pix ou até 3 parcelas de R$ 85,67. Acesso durante a vigência do plano.</li>
          <li><strong>Plano 6M</strong> — Vigência: 180 dias. Investimento: R$ 427,00 via Pix ou até 6 parcelas de R$ 79,50. Poderá incluir funcionalidades adicionais conforme divulgado.</li>
          <li><strong>Plano Selected</strong> — Plano gratuito. Prazo definido entre as partes. Recursos conforme critérios da STH METHOD.</li>
          <li><strong>Projeto Verão 180</strong> — Vigência: 180 dias. Investimento: 2 parcelas de R$ 49,50 e 4 parcelas de R$ 94,50. Mantido durante a vigência e conforme as condições financeiras da modalidade.</li>
        </ul>
      </Section>

      <Section n="22" title="Declaração final">
        <p>A STH METHOD reafirma seu compromisso com a ética, a transparência, o respeito à individualidade e a prestação de serviços de acompanhamento em saúde e performance baseados em critérios técnicos.</p>
        <p>O CONTRATANTE declara que realizou a contratação de forma livre, consciente e informada, reconhecendo que o serviço contratado consiste em um Programa de Acompanhamento por prazo determinado, cujas condições de acesso, utilização e encerramento estão descritas neste Termo de Adesão.</p>
      </Section>

      <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
        Dúvidas: <a className="text-primary" href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> ·{" "}
        <a className="text-primary" href={`https://wa.me/${LEGAL.supportWhatsapp}`} target="_blank" rel="noreferrer">WhatsApp oficial</a>
      </footer>
    </article>
  </div>
);

export default Termo;