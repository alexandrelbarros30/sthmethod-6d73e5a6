export type CoachPlanId = "free" | "start" | "pro" | "business" | "enterprise";

export interface CoachPlan {
  id: CoachPlanId;
  name: string;
  price: string;
  priceNote?: string;
  studentLimit: number;
  highlight?: boolean;
  tagline: string;
  features: string[];
}

export const COACH_PLANS: CoachPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    priceNote: "/mês",
    studentLimit: 1,
    tagline: "Teste o método com 1 aluno e conheça a plataforma sem custo.",
    features: [
      "1 aluno ativo",
      "Editor completo de treinos",
      "Biblioteca oficial de exercícios",
      "Banco ST Coach (vídeos)",
      "Convite de aluno por link ou QR",
      "App do aluno",
      "Sem cartão de crédito",
    ],
  },
  {
    id: "start",
    name: "Start",
    price: "R$ 49,90",
    priceNote: "/mês",
    studentLimit: 50,
    tagline: "Para o profissional autônomo começar com estrutura de verdade.",
    features: [
      "Até 50 alunos ativos",
      "Editor completo de treinos",
      "Biblioteca oficial de exercícios",
      "Banco ST Coach (vídeos)",
      "Cadastro e convite de alunos",
      "Dashboard de produtividade",
      "App do aluno",
      "Registro de cargas e histórico",
      "Atualizações contínuas",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 99,90",
    priceNote: "/mês",
    studentLimit: 150,
    highlight: true,
    tagline: "Para quem já vive de treino e precisa escalar sem perder padrão.",
    features: [
      "Até 150 alunos ativos",
      "Tudo do Start",
      "Logo e identidade própria",
      "Biblioteca própria de exercícios",
      "Templates e duplicação",
      "Relatórios de acompanhamento",
      "Avaliação física",
      "Backup e armazenamento ampliado",
      "Central de comunicação",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "R$ 199,90",
    priceNote: "/mês",
    studentLimit: 300,
    tagline: "Para academias, studios e assessorias com equipe.",
    features: [
      "Até 300 alunos ativos",
      "Tudo do Pro",
      "Gestão de equipe e professores",
      "Permissões por perfil",
      "Dashboard da academia",
      "Biblioteca compartilhada",
      "Relatórios consolidados",
      "Identidade visual completa",
      "Gestão centralizada",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$ 399,90",
    priceNote: "/mês a partir de",
    studentLimit: 100000,
    tagline: "Para redes, franquias e operações multiunidade.",
    features: [
      "Volume de alunos personalizado",
      "Profissionais ilimitados",
      "Múltiplas unidades",
      "API e integrações",
      "Customizações",
      "Dashboard corporativo",
      "Gerente dedicado",
    ],
  },
];

export const getCoachPlan = (id?: string | null): CoachPlan =>
  COACH_PLANS.find((p) => p.id === id) ?? COACH_PLANS[0];