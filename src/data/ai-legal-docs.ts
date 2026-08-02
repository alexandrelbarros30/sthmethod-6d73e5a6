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
  {
    slug: "politica-de-uso-da-ia",
    title: "Política de Uso da Inteligência Artificial",
    subtitle: "Regras e princípios dos recursos de IA da STH AI",
    code: "STHAI-IA-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Objetivo",
        paragraphs: [
          "Esta Política estabelece as regras de utilização dos recursos de Inteligência Artificial disponibilizados pela STH AI.",
          "O objetivo é garantir que o usuário compreenda como a tecnologia funciona, suas capacidades, limitações e princípios utilizados para geração de informações personalizadas.",
        ],
      },
      {
        title: "2. O que é a STH AI",
        paragraphs: [
          "A STH AI é uma plataforma de inteligência artificial desenvolvida com base na metodologia STH Method, criada para auxiliar o usuário no acompanhamento de objetivos relacionados a treinamento, alimentação, evolução corporal, análise de informações fornecidas e organização e acompanhamento de dados pessoais.",
          "A plataforma utiliza informações inseridas pelo próprio usuário para construir análises e recomendações personalizadas.",
        ],
      },
      {
        title: "3. Funcionamento da Inteligência Artificial",
        paragraphs: [
          "A STH AI utiliza modelos computacionais capazes de interpretar informações fornecidas, identificar padrões, organizar dados, gerar sugestões personalizadas e acompanhar histórico de evolução.",
          "As respostas geradas são baseadas nas informações disponíveis no perfil do usuário e nos parâmetros definidos pela metodologia STH Method.",
        ],
      },
      {
        title: "4. Importância das Informações Fornecidas",
        paragraphs: [
          "O usuário reconhece que a qualidade das análises depende diretamente da qualidade das informações cadastradas.",
          "Informações incompletas, incorretas ou desatualizadas podem influenciar análises, recomendações, planejamento e acompanhamento da evolução.",
          "O usuário é responsável por manter seus dados atualizados.",
        ],
      },
      {
        title: "5. Geração de Planejamentos",
        paragraphs: [
          "A STH AI poderá gerar planejamento de treino, planejamento alimentar, análises técnicas e acompanhamento de evolução.",
          "As gerações seguem critérios metodológicos e não são realizadas com base em alterações aleatórias ou solicitações sem fundamento técnico.",
        ],
      },
      {
        title: "6. Princípio da Periodização",
        paragraphs: [
          "A STH AI utiliza o conceito de periodização, respeitando fases planejadas de evolução.",
          "Por esse motivo, novos planejamentos não devem ser solicitados constantemente, revisões devem possuir justificativa e alterações frequentes podem prejudicar a avaliação dos resultados.",
          "A plataforma prioriza consistência, execução e evolução progressiva.",
        ],
      },
      {
        title: "7. Revisões e Ajustes",
        paragraphs: [
          "As revisões dos planejamentos possuem critérios definidos pela Política de Gerações, Revisões e Periodização.",
          "A inteligência artificial poderá considerar histórico do usuário, evolução registrada, alterações informadas, objetivos definidos e dados adicionados ao longo do acompanhamento.",
        ],
      },
      {
        title: "8. Recursos de Uso Contínuo",
        paragraphs: ["Durante a vigência da assinatura, alguns recursos possuem utilização contínua:"],
        bullets: [
          "STH Food AI: permite análise de alimentos, análise de refeições, interpretação de produtos e auxílio no registro alimentar.",
          "Evolução Corporal por Imagens: permite análise comparativa de fotografias, acompanhamento visual e registro histórico da evolução.",
          "Esses recursos não representam uma alteração automática do planejamento principal.",
        ],
      },
      {
        title: "9. Limitações da Inteligência Artificial",
        paragraphs: [
          "O usuário compreende que a IA não possui consciência ou julgamento humano, que resultados dependem das informações fornecidas, que podem existir limitações tecnológicas e que nenhuma ferramenta digital elimina a necessidade de avaliação profissional quando indicada.",
        ],
      },
      {
        title: "10. Saúde e Segurança",
        paragraphs: [
          "A STH AI não substitui consultas ou avaliações realizadas por profissionais habilitados.",
          "O usuário deve buscar atendimento especializado em situações como sintomas importantes, emergências, diagnósticos e alterações clínicas relevantes.",
        ],
      },
      {
        title: "11. Transparência e Evolução da Tecnologia",
        paragraphs: [
          "A STH AI poderá passar por melhorias constantes para aumentar a qualidade das análises, melhorar a experiência do usuário, incorporar novas tecnologias e aperfeiçoar os recursos disponíveis.",
          "Atualizações poderão modificar funcionalidades sem comprometer os princípios fundamentais da plataforma.",
        ],
      },
      {
        title: "12. Uso Responsável",
        paragraphs: [
          "O usuário concorda em utilizar a inteligência artificial de forma responsável, evitando compartilhamento indevido da conta, tentativa de manipulação do sistema, uso comercial não autorizado e envio intencional de informações falsas.",
        ],
      },
      {
        title: "13. Aceite",
        paragraphs: [
          "Ao utilizar os recursos de inteligência artificial da STH AI, o usuário declara que compreendeu como a tecnologia funciona, suas limitações, a importância das informações fornecidas e os princípios metodológicos utilizados.",
        ],
      },
      {
        title: "14. Vigência",
        paragraphs: [
          "Esta Política entra em vigor na data de sua publicação e permanece válida enquanto o usuário utilizar os recursos de inteligência artificial da STH AI.",
        ],
      },
    ],
  },
  {
    slug: "politica-geracoes-revisoes-periodizacao",
    title: "Política de Gerações, Revisões e Periodização",
    subtitle: "Regras para criação e ajuste dos planejamentos personalizados",
    code: "STHAI-GR-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Objetivo",
        paragraphs: [
          "Esta Política estabelece as regras para geração, atualização e revisão dos planejamentos personalizados realizados pela STH AI.",
          "O objetivo é garantir que os recursos de inteligência artificial sejam utilizados de forma estratégica, respeitando princípios de periodização, adaptação e evolução progressiva.",
        ],
      },
      {
        title: "2. Princípio da Metodologia",
        paragraphs: [
          "A STH AI não funciona como uma ferramenta de criação ilimitada de planos aleatórios.",
          "O sistema foi desenvolvido para acompanhar a evolução do usuário através de ciclos planejados, considerando objetivo individual, histórico registrado, informações corporais, rotina, evolução observada e dados inseridos durante o acompanhamento.",
          "A constante alteração de estratégias sem justificativa técnica pode prejudicar a execução e a análise dos resultados.",
        ],
      },
      {
        title: "3. Conceito de Geração",
        paragraphs: [
          "Uma geração representa a criação oficial de um planejamento personalizado pela STH AI.",
          "Cada geração poderá envolver planejamento de treino, planejamento alimentar, análise de exames e análise corporal por imagens.",
          "Após a geração, o planejamento passa a ser considerado a referência oficial do ciclo atual do usuário.",
        ],
      },
      {
        title: "4. Primeiro Planejamento",
        paragraphs: [
          "Após a contratação do plano, o usuário terá direito à primeira geração dos serviços contratados.",
          "A geração será realizada utilizando questionário inicial, dados corporais, objetivos informados, histórico disponível, informações alimentares e demais dados fornecidos.",
        ],
      },
      {
        title: "5. Ciclos de Acompanhamento",
        paragraphs: [
          "A STH AI organiza o acompanhamento em ciclos de evolução.",
          "Os ciclos permitem aplicação do planejamento, observação da resposta individual, coleta de dados, análise de evolução e ajustes quando necessários.",
          "A duração dos ciclos pode variar conforme objetivo, perfil e estratégia definida.",
        ],
      },
      {
        title: "6. Revisões",
        paragraphs: [
          "As revisões existem para ajustes técnicos e não para substituição constante do planejamento.",
          "Cada geração poderá possuir até três revisões dentro dos critérios definidos pela plataforma.",
        ],
        bullets: [
          "mudança relevante de rotina;",
          "alteração de objetivo;",
          "evolução corporal significativa;",
          "dificuldade comprovada de execução;",
          "necessidade de ajuste alimentar;",
          "alteração de dados importantes;",
          "informações novas que impactem o planejamento.",
        ],
      },
      {
        title: "7. Solicitações sem Justificativa Técnica",
        paragraphs: [
          "Podem não gerar revisão: desejo de alterar constantemente o planejamento, comparação com outros usuários, curiosidade sobre novas versões e busca por mudanças sem execução adequada do plano anterior.",
          "A STH AI poderá manter o planejamento vigente quando identificar que a continuidade é mais adequada para o processo de evolução.",
        ],
      },
      {
        title: "8. Uso de Recursos Ilimitados",
        paragraphs: ["Algumas ferramentas possuem utilização contínua durante a assinatura:"],
        bullets: [
          "STH Food AI: uso livre para análise de alimentos, análise de refeições, interpretação de produtos e apoio ao diário alimentar.",
          "Evolução Corporal por Imagens: uso livre para envio de novas fotografias, comparação visual e acompanhamento da transformação corporal.",
          "Esses recursos não representam automaticamente uma nova geração de treino ou cardápio.",
        ],
      },
      {
        title: "9. Planos e Ciclos",
        paragraphs: ["Os planos possuem diferentes períodos de duração:"],
        bullets: [
          "Plano 30 dias: destinado a um ciclo inicial de acompanhamento.",
          "Plano 90 dias: permite acompanhamento de ciclos de evolução mais extensos.",
          "Plano 180 dias: permite acompanhamento prolongado com análise contínua da evolução.",
          "Plano 365 dias: permite acompanhamento anual com planejamento estruturado em fases.",
          "A liberação de novos ciclos seguirá critérios metodológicos e não apenas o tempo contratado.",
        ],
      },
      {
        title: "10. Exceções Técnicas",
        paragraphs: [
          "A STH AI poderá considerar novas avaliações ou ajustes extraordinários quando houver alteração significativa das informações fornecidas, mudança relevante de contexto, necessidade identificada pela análise da evolução ou situações que justifiquem alteração do planejamento.",
        ],
      },
      {
        title: "11. Registro Histórico",
        paragraphs: [
          "Todas as gerações e revisões serão registradas no histórico do usuário contendo data da criação, versão do planejamento, alterações realizadas, justificativa da revisão e evolução observada.",
          "Esse histórico permite acompanhar a trajetória do usuário dentro da metodologia STH AI.",
        ],
      },
      {
        title: "12. Objetivo Final",
        paragraphs: [
          "A Política de Gerações, Revisões e Periodização existe para garantir que a inteligência artificial seja utilizada como uma ferramenta estratégica de acompanhamento, evitando mudanças impulsivas e priorizando consistência, execução, adaptação e evolução sustentável.",
        ],
      },
      {
        title: "13. Vigência",
        paragraphs: [
          "Esta Política entra em vigor na data de sua publicação e permanece válida durante a utilização da plataforma STH AI.",
        ],
      },
    ],
  },
  {
    slug: "politica-planos-pagamentos-cancelamentos-reembolsos",
    title: "Política de Planos, Pagamentos, Cancelamentos e Reembolsos",
    subtitle: "Condições comerciais dos planos STH AI",
    code: "STHAI-PAG-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Objetivo",
        paragraphs: [
          "Esta Política estabelece as regras comerciais relacionadas aos planos, pagamentos, cancelamentos, renovação e possíveis reembolsos dos serviços digitais oferecidos pela STH AI.",
          "O objetivo é garantir transparência na relação entre a plataforma e seus usuários.",
        ],
      },
      {
        title: "2. Planos Disponíveis",
        paragraphs: ["A STH AI poderá disponibilizar planos com diferentes períodos de acesso:"],
        bullets: [
          "Plano 30 dias;",
          "Plano 90 dias;",
          "Plano 180 dias;",
          "Plano 365 dias.",
        ],
      },
      {
        title: "3. Ativação do Plano",
        paragraphs: [
          "O acesso aos recursos pagos será liberado após confirmação do pagamento, validação da transação financeira e aceite dos documentos obrigatórios da plataforma.",
          "Após a ativação, o usuário poderá utilizar os recursos correspondentes ao plano contratado.",
        ],
      },
      {
        title: "4. Recursos Incluídos",
        paragraphs: ["Durante a vigência da assinatura, o usuário terá acesso aos recursos disponibilizados conforme o plano contratado, incluindo:"],
        bullets: [
          "geração de planejamento personalizado;",
          "geração de treino;",
          "geração de cardápio;",
          "análises disponíveis;",
          "STH Food AI com uso livre;",
          "análise de evolução corporal por imagens com uso livre;",
          "diário alimentar;",
          "histórico de acompanhamento.",
        ],
      },
      {
        title: "5. Pagamento",
        paragraphs: [
          "O pagamento poderá ser realizado através dos meios disponibilizados pela STH AI no momento da contratação.",
          "O usuário é responsável por informar dados corretos de pagamento, garantir disponibilidade financeira e acompanhar confirmações de pagamento.",
        ],
      },
      {
        title: "6. Início da Vigência",
        paragraphs: [
          "A vigência do plano inicia-se após a confirmação do pagamento.",
          "O período contratado será contado a partir da ativação do acesso.",
        ],
      },
      {
        title: "7. Renovação",
        paragraphs: [
          "A renovação do acesso poderá ocorrer conforme as condições apresentadas no momento da contratação.",
          "O usuário será informado sobre condições de renovação quando aplicável.",
        ],
      },
      {
        title: "8. Cancelamento",
        paragraphs: [
          "O usuário poderá solicitar o cancelamento conforme os canais oficiais disponibilizados pela STH AI.",
          "O cancelamento interrompe futuras cobranças ou renovações, quando aplicável.",
          "O encerramento do acesso seguirá as condições previstas no plano contratado e na legislação vigente.",
        ],
      },
      {
        title: "9. Direito de Arrependimento",
        paragraphs: [
          "Quando aplicável, serão observadas as regras previstas no Código de Defesa do Consumidor relacionadas a contratações realizadas por meios digitais.",
          "O tratamento de solicitações considerará data da contratação, início da utilização dos serviços e disponibilização das funcionalidades contratadas.",
        ],
      },
      {
        title: "10. Reembolsos",
        paragraphs: ["Solicitações de reembolso serão analisadas conforme:"],
        bullets: [
          "legislação aplicável;",
          "condições do plano contratado;",
          "utilização dos recursos disponibilizados;",
          "histórico de acesso.",
        ],
      },
      {
        title: "11. Planos Promocionais",
        paragraphs: [
          "Condições promocionais poderão possuir regras específicas relacionadas a prazo, valores, benefícios e elegibilidade.",
          "As regras da promoção serão informadas no momento da contratação.",
        ],
      },
      {
        title: "12. Suspensão de Acesso",
        paragraphs: [
          "A STH AI poderá suspender ou limitar o acesso em casos de uso indevido da plataforma, tentativa de fraude, compartilhamento de conta, violação dos Termos de Uso ou práticas que comprometam a segurança do sistema.",
        ],
      },
      {
        title: "13. Alteração de Planos",
        paragraphs: [
          "A STH AI poderá disponibilizar novos planos, alterar características comerciais ou criar novos formatos de assinatura, respeitando contratos já ativos.",
        ],
      },
      {
        title: "14. Transparência",
        paragraphs: [
          "O usuário terá acesso às informações do plano contratado, incluindo período de vigência, recursos disponíveis, histórico de pagamento e situação da assinatura.",
        ],
      },
      {
        title: "15. Vigência",
        paragraphs: [
          "Esta Política entra em vigor na data de sua publicação e integra os documentos oficiais da STH AI.",
        ],
      },
    ],
  },
  {
    slug: "politica-de-cookies",
    title: "Política de Cookies",
    subtitle: "Uso de cookies e tecnologias semelhantes na plataforma STH AI",
    code: "STHAI-COOK-001",
    version: "1.0",
    status: "Vigente",
    sections: [
      {
        title: "1. Objetivo",
        paragraphs: [
          "Esta Política de Cookies tem como objetivo informar aos usuários da STH AI como são utilizados cookies e tecnologias semelhantes durante o acesso à plataforma.",
          "A finalidade é garantir transparência sobre a coleta de informações técnicas utilizadas para funcionamento, segurança e melhoria da experiência do usuário.",
        ],
      },
      {
        title: "2. O que são Cookies",
        paragraphs: [
          "Cookies são pequenos arquivos de informação armazenados no dispositivo do usuário quando ele acessa uma plataforma digital.",
          "Eles permitem que o sistema reconheça determinadas informações, facilitando o funcionamento dos serviços e proporcionando uma experiência mais personalizada.",
        ],
      },
      {
        title: "3. Utilização de Cookies pela STH AI",
        paragraphs: ["A STH AI poderá utilizar cookies e tecnologias semelhantes para:"],
        bullets: [
          "manter o usuário conectado;",
          "garantir segurança de acesso;",
          "lembrar preferências;",
          "melhorar desempenho da plataforma;",
          "analisar utilização dos recursos;",
          "identificar falhas técnicas;",
          "aperfeiçoar funcionalidades.",
        ],
      },
      {
        title: "4. Categorias de Cookies Utilizados",
        paragraphs: [],
      },
      {
        title: "4.1 Cookies Essenciais",
        paragraphs: [
          "São necessários para o funcionamento básico da plataforma.",
          "Podem ser utilizados para autenticação de usuário, manutenção da sessão, segurança da conta e funcionamento de áreas restritas.",
          "Sem esses cookies, algumas funcionalidades podem não funcionar corretamente.",
        ],
      },
      {
        title: "4.2 Cookies de Preferência",
        paragraphs: [
          "Permitem que a plataforma memorize escolhas realizadas pelo usuário, como configurações, preferências de utilização e personalizações da experiência.",
        ],
      },
      {
        title: "4.3 Cookies de Desempenho",
        paragraphs: [
          "Auxiliam a STH AI a compreender como os usuários utilizam a plataforma.",
          "Podem ajudar na identificação de páginas mais acessadas, dificuldades de navegação, erros técnicos e melhorias necessárias.",
        ],
      },
      {
        title: "4.4 Cookies de Segurança",
        paragraphs: [
          "São utilizados para proteger a plataforma contra acessos indevidos, tentativas de fraude e atividades suspeitas.",
        ],
      },
      {
        title: "5. Cookies de Terceiros",
        paragraphs: [
          "A STH AI poderá utilizar serviços tecnológicos de terceiros necessários para hospedagem, pagamentos, análise de desempenho, segurança e funcionamento de integrações.",
          "Esses fornecedores poderão utilizar tecnologias semelhantes conforme suas próprias políticas de privacidade.",
        ],
      },
      {
        title: "6. Controle pelo Usuário",
        paragraphs: [
          "O usuário poderá gerenciar ou bloquear cookies através das configurações do navegador ou dispositivo utilizado.",
          "Entretanto, a desativação de determinados cookies poderá afetar login, segurança, funcionamento de recursos e experiência dentro da plataforma.",
        ],
      },
      {
        title: "7. Cookies e Dados Pessoais",
        paragraphs: [
          "Quando cookies estiverem associados a informações capazes de identificar o usuário, seu tratamento seguirá as regras estabelecidas na Política de Privacidade da STH AI e na legislação aplicável de proteção de dados.",
        ],
      },
      {
        title: "8. Atualizações",
        paragraphs: [
          "Esta Política poderá ser atualizada para refletir mudanças tecnológicas, novas funcionalidades, alterações legais e melhorias de transparência.",
          "Quando necessário, a STH AI poderá solicitar novo consentimento do usuário.",
        ],
      },
      {
        title: "9. Vigência",
        paragraphs: [
          "Esta Política entra em vigor na data de sua publicação e permanece válida enquanto estiver disponível na plataforma STH AI.",
        ],
      },
    ],
  },
];

export const getAiLegalDoc = (slug?: string) =>
  AI_LEGAL_DOCS.find((d) => d.slug === slug);
