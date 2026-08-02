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
];

export const getAiLegalDoc = (slug?: string) =>
  AI_LEGAL_DOCS.find((d) => d.slug === slug);
