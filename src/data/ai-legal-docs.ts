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
];

export const getAiLegalDoc = (slug?: string) =>
  AI_LEGAL_DOCS.find((d) => d.slug === slug);
