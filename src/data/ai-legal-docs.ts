export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface AiLegalDoc {
  slug: string;
  title: string;
  subtitle: string;
  code: string;
  version: string;
  status: string;
  intro?: string;
  sections: LegalSection[];
}

export const AI_LEGAL_DOCS: AiLegalDoc[] = [
  {
    slug: "termos-de-uso",
    title: "Termos de Uso da Plataforma",
    subtitle: "Condições gerais de utilização do STH AI",
    code: "STHAI-TU-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Apresentação",
        paragraphs: [
          "Bem-vindo à STH AI.",
          "A STH AI é uma plataforma tecnológica desenvolvida com base na metodologia STH Method, destinada ao acompanhamento inteligente de usuários por meio de inteligência artificial, oferecendo recursos personalizados para alimentação, treinamento, análise corporal, interpretação de exames e monitoramento da evolução.",
          "Ao utilizar a plataforma, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.",
        ],
      },
      {
        title: "2. Aceitação",
        paragraphs: [
          "A utilização da plataforma implica na aceitação destes Termos de Uso, da Política de Privacidade e dos demais documentos aplicáveis.",
          "Caso o usuário não concorde com qualquer disposição, deverá interromper a utilização da plataforma.",
        ],
      },
      {
        title: "3. Cadastro",
        paragraphs: [
          "Para utilizar a STH AI o usuário deverá fornecer informações verdadeiras, completas e atualizadas.",
          "O usuário é responsável pela segurança de sua conta, senha e demais credenciais de acesso.",
        ],
      },
      {
        title: "4. Recursos Gratuitos",
        paragraphs: ["Antes da contratação de qualquer plano, o usuário poderá:"],
        bullets: [
          "realizar seu cadastro;",
          "responder aos questionários;",
          "cadastrar peso, medidas e informações pessoais;",
          "enviar fotografias corporais;",
          "utilizar o diário alimentar;",
          "realizar até 3 consultas gratuitas no STH Food AI para análise de alimentos, refeições ou produtos.",
        ],
      },
      {
        title: "5. Recursos Exclusivos para Assinantes",
        paragraphs: [
          "Após a confirmação do pagamento do plano contratado, serão liberados os recursos previstos na assinatura. Entre eles:",
        ],
        bullets: [
          "geração de treino;",
          "geração de cardápio;",
          "análise de exames laboratoriais;",
          "análise corporal inteligente;",
          "acompanhamento pela STH AI;",
          "utilização ilimitada do STH Food AI;",
          "utilização ilimitada da análise de evolução corporal por imagens.",
        ],
      },
      {
        title: "6. Geração dos Serviços",
        paragraphs: ["A metodologia STH AI trabalha com planejamento estruturado. Cada ciclo libera:"],
        bullets: [
          "uma geração de treino;",
          "uma geração de cardápio;",
          "uma análise de exames;",
          "uma análise corporal.",
        ],
      },
      {
        title: "7. Revisões",
        paragraphs: [
          "Cada geração poderá receber até três revisões quando existir justificativa técnica. As revisões poderão ocorrer, por exemplo, em situações de:",
        ],
        bullets: [
          "evolução da periodização;",
          "alteração de exames;",
          "mudança relevante da rotina;",
          "indisponibilidade alimentar;",
          "lesão;",
          "mudança de objetivo;",
          "outras situações compatíveis com a metodologia STH Method.",
        ],
      },
      {
        title: "8. Metodologia",
        paragraphs: [
          "A STH AI prioriza consistência, aderência e evolução progressiva.",
          "Alterações frequentes de treino ou alimentação podem comprometer os resultados e, por esse motivo, a plataforma utiliza critérios técnicos para liberação de novas gerações e revisões.",
        ],
      },
      {
        title: "9. Uso Adequado",
        paragraphs: ["O usuário compromete-se a:"],
        bullets: [
          "fornecer informações verdadeiras;",
          "utilizar a plataforma de forma ética;",
          "não compartilhar sua conta;",
          "não tentar acessar funcionalidades de forma indevida;",
          "não copiar ou explorar comercialmente a plataforma sem autorização.",
        ],
      },
      {
        title: "10. Inteligência Artificial",
        paragraphs: [
          "As recomendações da STH AI são produzidas por modelos de inteligência artificial treinados conforme a metodologia STH Method.",
          "Os resultados dependem diretamente da qualidade das informações fornecidas pelo usuário.",
        ],
      },
      {
        title: "11. Limitações",
        paragraphs: ["A plataforma não garante resultados específicos. Os resultados dependem de fatores como:"],
        bullets: [
          "adesão ao planejamento;",
          "rotina;",
          "alimentação;",
          "treinamento;",
          "condições clínicas;",
          "fatores individuais.",
        ],
      },
      {
        title: "12. Saúde",
        paragraphs: [
          "A STH AI não substitui atendimento médico, nutricional, psicológico ou de outros profissionais habilitados.",
          "Situações de urgência, doenças, sintomas importantes ou emergências deverão ser avaliadas por profissionais competentes.",
        ],
      },
      {
        title: "13. Planos",
        paragraphs: ["Os planos possuem duração de:"],
        bullets: ["30 dias;", "90 dias;", "180 dias;", "365 dias."],
      },
      {
        title: "14. Cancelamento",
        paragraphs: [
          "As regras de cancelamento, renovação e reembolso encontram-se descritas na Política de Planos, Cancelamentos e Reembolsos da STH AI.",
        ],
      },
      {
        title: "15. Privacidade",
        paragraphs: [
          "O tratamento dos dados pessoais e sensíveis ocorre conforme descrito na Política de Privacidade da STH AI e na legislação aplicável.",
        ],
      },
      {
        title: "16. Alterações",
        paragraphs: [
          "A STH AI poderá atualizar estes Termos de Uso para aperfeiçoar a plataforma, atender alterações legais ou incorporar novas funcionalidades.",
          "Quando houver alterações relevantes, os usuários serão informados e poderá ser solicitado novo aceite.",
        ],
      },
      {
        title: "17. Propriedade Intelectual",
        paragraphs: [
          "Todos os sistemas, algoritmos, identidade visual, metodologia, conteúdos, textos, banco de dados, marcas e demais elementos da STH AI e da STH Method são protegidos pela legislação aplicável, sendo vedada sua reprodução, distribuição ou utilização sem autorização.",
        ],
      },
      {
        title: "18. Foro",
        paragraphs: [
          "Os presentes Termos serão interpretados de acordo com a legislação brasileira.",
          "As partes elegem o foro competente previsto na legislação aplicável para solução de eventuais controvérsias.",
        ],
      },
      {
        title: "19. Vigência",
        paragraphs: [
          "Estes Termos entram em vigor na data de seu aceite eletrônico pelo usuário e permanecem válidos enquanto houver utilização da plataforma ou até que sejam substituídos por versão posterior.",
        ],
      },
    ],
  },
  {
    slug: "contrato-prestacao-servicos",
    title: "Contrato de Prestação de Serviços Digitais",
    subtitle: "Condições contratuais dos planos STH AI",
    code: "STHAI-CT-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Partes",
        paragraphs: [
          "O presente Contrato de Prestação de Serviços Digitais é celebrado entre a STH AI, plataforma tecnológica baseada na metodologia STH Method, doravante denominada CONTRATADA, e o usuário que concluir a contratação de qualquer plano disponível na plataforma, doravante denominado CONTRATANTE.",
          "O aceite eletrônico deste contrato possui validade jurídica e produz os mesmos efeitos de uma assinatura física, conforme a legislação aplicável.",
        ],
      },
      {
        title: "2. Objeto",
        paragraphs: [
          "Este contrato tem por objeto a disponibilização dos serviços digitais da STH AI durante o período correspondente ao plano contratado.",
          "Os serviços incluem, conforme as funcionalidades vigentes da plataforma:",
        ],
        bullets: [
          "geração inteligente de treino;",
          "geração inteligente de cardápio;",
          "análise de exames laboratoriais;",
          "análise corporal por imagens;",
          "acompanhamento por inteligência artificial;",
          "utilização ilimitada do STH Food AI;",
          "utilização ilimitada da ferramenta de evolução corporal por fotografias;",
          "diário alimentar;",
          "histórico de evolução;",
          "demais funcionalidades disponibilizadas pela plataforma.",
        ],
      },
      {
        title: "3. Planos",
        paragraphs: ["A CONTRATADA disponibiliza planos com vigência de:"],
        bullets: ["30 dias;", "90 dias;", "180 dias;", "365 dias."],
      },
      {
        title: "4. Ativação",
        paragraphs: [
          "A assinatura será considerada ativa após a confirmação do pagamento.",
          "A partir desse momento, os recursos previstos no plano serão automaticamente liberados.",
        ],
      },
      {
        title: "5. Metodologia de Acompanhamento",
        paragraphs: [
          "A STH AI utiliza a metodologia STH Method para estruturar o acompanhamento do usuário.",
          "Cada ciclo de acompanhamento poderá incluir:",
        ],
        bullets: [
          "geração de treino;",
          "geração de cardápio;",
          "análise de exames;",
          "análise corporal.",
        ],
      },
      {
        title: "6. Revisões",
        paragraphs: [
          "Cada planejamento poderá receber revisões quando houver justificativa técnica compatível com a metodologia STH Method.",
          "As revisões possuem critérios próprios definidos na Política de Gerações, Revisões e Periodização.",
          "A CONTRATADA poderá negar solicitações incompatíveis com os princípios metodológicos da plataforma.",
        ],
      },
      {
        title: "7. Obrigações da CONTRATADA",
        paragraphs: ["Compete à CONTRATADA:"],
        bullets: [
          "manter a plataforma disponível, ressalvadas interrupções técnicas ou de manutenção;",
          "proteger os dados pessoais conforme a legislação vigente;",
          "fornecer os serviços contratados;",
          "promover melhorias contínuas na plataforma.",
        ],
      },
      {
        title: "8. Obrigações do CONTRATANTE",
        paragraphs: ["O CONTRATANTE compromete-se a:"],
        bullets: [
          "fornecer informações verdadeiras e atualizadas;",
          "utilizar a plataforma de forma lícita;",
          "preservar a confidencialidade de suas credenciais de acesso;",
          "não compartilhar sua conta com terceiros;",
          "seguir as orientações fornecidas pela plataforma.",
        ],
      },
      {
        title: "9. Uso Indevido",
        paragraphs: ["É vedado ao CONTRATANTE:"],
        bullets: [
          "copiar conteúdos protegidos;",
          "tentar acessar áreas restritas da plataforma;",
          "utilizar robôs ou ferramentas automatizadas para exploração indevida;",
          "comercializar, reproduzir ou redistribuir conteúdos da STH AI sem autorização.",
        ],
      },
      {
        title: "10. Inteligência Artificial",
        paragraphs: [
          "O CONTRATANTE reconhece que o acompanhamento é realizado predominantemente por inteligência artificial desenvolvida conforme a metodologia STH Method.",
          "As recomendações dependem da qualidade e veracidade das informações fornecidas pelo usuário.",
        ],
      },
      {
        title: "11. Limitação de Responsabilidade",
        paragraphs: [
          "A CONTRATADA não garante resultados específicos, uma vez que estes dependem de fatores individuais, incluindo adesão ao planejamento, rotina, condições clínicas, alimentação, treinamento e outros aspectos pessoais.",
          "A plataforma não substitui atendimento médico, nutricional ou de outros profissionais quando necessário.",
        ],
      },
      {
        title: "12. Pagamentos",
        paragraphs: [
          "Os valores, formas de pagamento, condições promocionais e regras comerciais são definidos na página oficial da plataforma no momento da contratação.",
        ],
      },
      {
        title: "13. Cancelamento",
        paragraphs: [
          "As condições de cancelamento, reembolso e encerramento da assinatura observarão a Política de Planos, Pagamentos, Cancelamentos e Reembolsos da STH AI e a legislação aplicável.",
        ],
      },
      {
        title: "14. Proteção de Dados",
        paragraphs: [
          "O tratamento dos dados pessoais e sensíveis seguirá a Política de Privacidade da STH AI e a legislação vigente.",
        ],
      },
      {
        title: "15. Alterações Contratuais",
        paragraphs: [
          "Este contrato poderá ser atualizado para refletir alterações legais, regulatórias ou evoluções da plataforma.",
          "Quando as alterações forem relevantes, o usuário será comunicado e poderá ser solicitado novo aceite.",
        ],
      },
      {
        title: "16. Vigência",
        paragraphs: [
          "O presente contrato entra em vigor na data da confirmação do pagamento e permanece válido durante todo o período correspondente ao plano contratado.",
        ],
      },
      {
        title: "17. Disposições Finais",
        paragraphs: [
          "Este contrato integra o conjunto documental da STH AI e deve ser interpretado em conjunto com:",
        ],
        bullets: [
          "Termos de Uso;",
          "Política de Privacidade;",
          "Política de Uso da Inteligência Artificial;",
          "Política de Gerações, Revisões e Periodização;",
          "Política de Planos, Pagamentos, Cancelamentos e Reembolsos;",
          "demais documentos oficiais da plataforma.",
        ],
      },
      {
        title: "18. Foro",
        paragraphs: [
          "As partes elegem o foro competente previsto na legislação brasileira para dirimir eventuais controvérsias decorrentes deste contrato, observadas as normas de proteção ao consumidor quando aplicáveis.",
        ],
      },
    ],
  },
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade e Proteção de Dados Pessoais",
    subtitle: "Como a STH AI coleta, utiliza e protege seus dados",
    code: "STHAI-PP-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Introdução",
        paragraphs: [
          "A STH AI valoriza a privacidade e a proteção dos dados de seus usuários.",
          "Esta Política de Privacidade tem como objetivo informar como os dados pessoais são coletados, utilizados, armazenados e protegidos durante a utilização da plataforma.",
          "A STH AI realiza o tratamento de dados conforme a legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD).",
        ],
      },
      {
        title: "2. Quem é responsável pelo tratamento dos dados",
        paragraphs: [
          "A STH AI é responsável pelo gerenciamento dos dados coletados dentro da plataforma, adotando medidas técnicas e administrativas para garantir segurança, privacidade e uso adequado das informações.",
        ],
      },
      {
        title: "3. Dados coletados",
        paragraphs: ["Durante a utilização da plataforma poderão ser coletados:"],
        bullets: [
          "Dados cadastrais: nome completo, data de nascimento, gênero quando informado, e-mail, telefone e informações de cadastro.",
          "Dados corporais: peso, altura, medidas corporais, percentual de gordura quando informado, histórico de evolução e fotografias corporais.",
          "Dados relacionados à alimentação: registros do diário alimentar, refeições cadastradas e informações analisadas pelo STH Food AI.",
          "Dados relacionados à saúde: exames laboratoriais enviados pelo usuário, informações relacionadas a objetivos, histórico informado pelo usuário e informações necessárias para personalização das análises.",
          "Dados técnicos: informações de acesso, dispositivo utilizado, registros de utilização e informações necessárias para segurança da plataforma.",
        ],
      },
      {
        title: "4. Dados sensíveis",
        paragraphs: [
          "A STH AI poderá tratar dados considerados sensíveis pela LGPD, incluindo informações relacionadas à saúde, exames laboratoriais, fotografias corporais e informações físicas e metabólicas.",
          "O tratamento desses dados ocorre somente para as finalidades informadas nesta Política e mediante consentimento adequado do usuário quando necessário.",
        ],
      },
      {
        title: "5. Finalidade do tratamento dos dados",
        paragraphs: ["Os dados coletados poderão ser utilizados para:"],
        bullets: [
          "criação e gerenciamento da conta;",
          "funcionamento da plataforma;",
          "geração personalizada de treinos;",
          "geração personalizada de cardápios;",
          "análises inteligentes;",
          "acompanhamento de evolução;",
          "funcionamento do STH Food AI;",
          "análise de fotografias de evolução corporal;",
          "melhoria dos sistemas de inteligência artificial;",
          "segurança da plataforma;",
          "cumprimento de obrigações legais.",
        ],
      },
      {
        title: "6. Uso da Inteligência Artificial",
        paragraphs: [
          "A STH AI utiliza inteligência artificial para processar informações fornecidas pelo usuário e gerar análises personalizadas conforme a metodologia STH Method.",
          "O usuário reconhece que a qualidade das respostas depende das informações inseridas, que a IA utiliza dados fornecidos para personalização e que recomendações podem ser aprimoradas conforme novos dados sejam adicionados.",
        ],
      },
      {
        title: "7. Fotografias Corporais",
        paragraphs: [
          "As imagens enviadas pelo usuário possuem finalidade exclusiva de acompanhamento de evolução corporal, comparação entre períodos, geração de análises visuais e histórico pessoal dentro da plataforma.",
          "As imagens não serão utilizadas publicamente sem autorização expressa do usuário.",
        ],
      },
      {
        title: "8. Compartilhamento de dados",
        paragraphs: [
          "A STH AI não comercializa dados pessoais dos usuários.",
          "Os dados poderão ser compartilhados somente quando necessário para funcionamento da plataforma, processamento tecnológico, armazenamento seguro, cumprimento de obrigações legais e atendimento de solicitações das autoridades competentes.",
        ],
      },
      {
        title: "9. Armazenamento e segurança",
        paragraphs: [
          "A STH AI adota medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, perda, alteração indevida e divulgação irregular.",
          "Nenhum sistema conectado à internet possui risco zero, mas são aplicadas práticas de segurança compatíveis com a natureza das informações tratadas.",
        ],
      },
      {
        title: "10. Prazo de armazenamento",
        paragraphs: [
          "Os dados permanecerão armazenados enquanto a conta estiver ativa, forem necessários para prestação dos serviços ou houver obrigação legal de manutenção.",
          "O usuário poderá solicitar informações sobre seus dados conforme previsto na legislação.",
        ],
      },
      {
        title: "11. Direitos do usuário",
        paragraphs: [
          "O usuário poderá solicitar, conforme a LGPD: confirmação da existência de tratamento, acesso aos dados, correção de informações, atualização cadastral, informações sobre uso dos dados e exclusão quando aplicável.",
        ],
      },
      {
        title: "12. Responsabilidade do usuário",
        paragraphs: [
          "O usuário declara que as informações fornecidas são verdadeiras, que possui autorização para enviar informações inseridas na plataforma e compreende que dados incorretos podem comprometer análises geradas pela IA.",
        ],
      },
      {
        title: "13. Alterações desta Política",
        paragraphs: [
          "Esta Política poderá ser atualizada para acompanhar mudanças legais, melhorias de segurança ou evolução da plataforma.",
          "Alterações relevantes poderão exigir novo aceite do usuário.",
        ],
      },
      {
        title: "14. Contato",
        paragraphs: [
          "Para dúvidas relacionadas à privacidade ou solicitações sobre dados pessoais, o usuário poderá utilizar os canais oficiais disponibilizados pela STH AI.",
        ],
      },
      {
        title: "15. Vigência",
        paragraphs: [
          "Esta Política entra em vigor na data de sua publicação e permanece válida enquanto estiver disponível na plataforma.",
        ],
      },
    ],
  },
  {
    slug: "consentimento-dados-sensiveis",
    title: "Termo de Consentimento para Tratamento de Dados Pessoais Sensíveis",
    subtitle: "Consentimento específico para dados de saúde e evolução corporal",
    code: "STHAI-CONS-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Finalidade do Documento",
        paragraphs: [
          "Este Termo tem como objetivo registrar o consentimento do usuário para que a STH AI realize o tratamento de dados pessoais sensíveis necessários para o funcionamento das ferramentas de inteligência artificial e acompanhamento digital oferecidas pela plataforma.",
          "O aceite deste documento é necessário para utilização dos recursos que dependem de informações relacionadas à saúde, composição corporal e evolução física.",
        ],
      },
      {
        title: "2. Dados Sensíveis Envolvidos",
        paragraphs: ["O usuário autoriza o tratamento das seguintes categorias de dados, quando fornecidas voluntariamente:"],
        bullets: [
          "Informações corporais: peso, altura, medidas corporais, composição corporal, histórico de evolução e fotografias corporais.",
          "Informações relacionadas à saúde: exames laboratoriais, informações metabólicas, histórico informado pelo usuário e informações relacionadas a objetivos físicos e nutricionais.",
          "Informações alimentares: registros do diário alimentar, refeições cadastradas e análises realizadas pelo STH Food AI.",
        ],
      },
      {
        title: "3. Finalidade do Uso dos Dados",
        paragraphs: ["Os dados poderão ser utilizados exclusivamente para:"],
        bullets: [
          "personalização dos serviços da STH AI;",
          "geração de treinos personalizados;",
          "geração de cardápios personalizados;",
          "análise de informações fornecidas pelo usuário;",
          "interpretação de dados laboratoriais enviados;",
          "acompanhamento da evolução corporal;",
          "comparação de imagens de evolução;",
          "melhoria da experiência dentro da plataforma.",
        ],
      },
      {
        title: "4. Uso das Fotografias Corporais",
        paragraphs: [
          "O usuário declara estar ciente de que as fotografias corporais enviadas poderão ser analisadas por sistemas de inteligência artificial para identificar alterações visuais de evolução, comparar diferentes períodos e auxiliar no acompanhamento da transformação corporal.",
          "As imagens permanecem vinculadas ao perfil do usuário e não serão divulgadas publicamente sem autorização específica.",
        ],
      },
      {
        title: "5. Uso pela Inteligência Artificial",
        paragraphs: [
          "O usuário compreende que a STH AI utiliza sistemas de inteligência artificial para analisar informações fornecidas e gerar respostas personalizadas.",
          "O usuário reconhece que os resultados dependem da qualidade dos dados inseridos, que informações incompletas podem reduzir a precisão das análises e que a inteligência artificial atua conforme os parâmetros da metodologia STH Method.",
        ],
      },
      {
        title: "6. Natureza do Consentimento",
        paragraphs: [
          "O fornecimento dos dados sensíveis é voluntário.",
          "Entretanto, o usuário compreende que a ausência dessas informações poderá limitar ou impedir o funcionamento de determinadas ferramentas personalizadas da plataforma.",
        ],
      },
      {
        title: "7. Proteção dos Dados",
        paragraphs: [
          "A STH AI compromete-se a aplicar medidas técnicas e administrativas para proteger as informações armazenadas, conforme descrito na Política de Privacidade.",
        ],
      },
      {
        title: "8. Compartilhamento",
        paragraphs: [
          "O usuário declara estar ciente de que os dados poderão ser processados por fornecedores tecnológicos necessários ao funcionamento da plataforma, sempre respeitando medidas de segurança e finalidade definida.",
          "A STH AI não comercializa dados pessoais de seus usuários.",
        ],
      },
      {
        title: "9. Revogação do Consentimento",
        paragraphs: [
          "O usuário poderá solicitar a revogação deste consentimento conforme previsto na legislação aplicável.",
          "A revogação poderá limitar o acesso a funcionalidades que dependam do tratamento dos dados autorizados.",
        ],
      },
      {
        title: "10. Declarações do Usuário",
        paragraphs: ["Ao aceitar este termo, o usuário declara que:"],
        bullets: [
          "compreendeu quais dados serão tratados;",
          "compreendeu a finalidade do tratamento;",
          "concorda com a utilização das informações para funcionamento da STH AI;",
          "forneceu informações de forma voluntária;",
          "está ciente das limitações da inteligência artificial.",
        ],
      },
      {
        title: "11. Aceite Eletrônico",
        paragraphs: [
          "O aceite digital deste documento representa manifestação válida de consentimento, registrada pela plataforma com identificação do usuário, data e horário, versão do documento aceita e registro eletrônico da ação.",
        ],
      },
      {
        title: "12. Vigência",
        paragraphs: [
          "Este Termo permanece válido enquanto o usuário utilizar recursos da STH AI que dependam do tratamento de dados sensíveis, podendo ser atualizado conforme mudanças legais ou tecnológicas.",
        ],
      },
    ],
  },
];

export const getAiLegalDoc = (slug?: string) =>
  AI_LEGAL_DOCS.find((d) => d.slug === slug);
