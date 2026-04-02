export interface PerformethProduct {
  id: string;
  name: string;
  headline: string;
  benefits: [string, string, string];
  imageUrl?: string;
  link?: string;
}

export interface PerformethCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  products: PerformethProduct[];
}

export const performethCategories: PerformethCategory[] = [
  {
    id: "performance",
    title: "Performance & Estética",
    subtitle: "Resultados visíveis. Força real.",
    icon: "⚡",
    products: [
      {
        id: "p1",
        name: "WHEY PROTEIN ISOLADO",
        headline: "Absorção rápida para máxima síntese proteica.",
        benefits: [
          "30g de proteína por dose",
          "Zero lactose e zero açúcar",
          "Recuperação muscular acelerada",
        ],
      },
      {
        id: "p2",
        name: "CREATINA MONOHIDRATADA",
        headline: "O suplemento mais estudado do mundo.",
        benefits: [
          "Aumento de força e potência",
          "Volumização celular muscular",
          "Melhora cognitiva comprovada",
        ],
      },
      {
        id: "p3",
        name: "PRÉ-TREINO ELITE",
        headline: "Foco extremo. Energia explosiva.",
        benefits: [
          "Cafeína + Beta-alanina otimizados",
          "Vasodilatação e pump superior",
          "Sem crash pós-treino",
        ],
      },
    ],
  },
  {
    id: "hormonal",
    title: "Base Hormonal",
    subtitle: "Equilíbrio que potencializa tudo.",
    icon: "🧬",
    products: [
      {
        id: "h1",
        name: "ZMA ADVANCED",
        headline: "Suporte natural à testosterona durante o sono.",
        benefits: [
          "Zinco, Magnésio e B6 quelados",
          "Melhora da qualidade do sono",
          "Recuperação hormonal noturna",
        ],
      },
      {
        id: "h2",
        name: "D-ÁCIDO ASPÁRTICO",
        headline: "Estímulo ao eixo hormonal masculino.",
        benefits: [
          "Suporte à produção de LH",
          "Otimização da testosterona livre",
          "Fórmula clínica concentrada",
        ],
      },
    ],
  },
  {
    id: "emagrecimento",
    title: "Emagrecimento",
    subtitle: "Queima inteligente. Sem rebote.",
    icon: "🔥",
    products: [
      {
        id: "e1",
        name: "TERMOGÊNICO BLACK",
        headline: "Aceleração metabólica controlada.",
        benefits: [
          "Cafeína + Chá verde sinérgicos",
          "Oxidação de gordura potencializada",
          "Energia sustentada sem jitter",
        ],
      },
      {
        id: "e2",
        name: "L-CARNITINA LÍQUIDA",
        headline: "Transporte de gordura para energia.",
        benefits: [
          "2000mg por dose concentrada",
          "Sabor premium, fácil consumo",
          "Ideal pré-cardio ou pré-treino",
        ],
      },
      {
        id: "e3",
        name: "CLA 1000",
        headline: "Ácido linoleico conjugado de alta pureza.",
        benefits: [
          "Redução de gordura corporal",
          "Preservação de massa magra",
          "Suporte à composição corporal",
        ],
      },
    ],
  },
  {
    id: "suporte",
    title: "Suporte & Proteção",
    subtitle: "O alicerce invisível dos resultados.",
    icon: "🛡️",
    products: [
      {
        id: "s1",
        name: "ÔMEGA 3 ULTRA",
        headline: "EPA + DHA em concentração farmacêutica.",
        benefits: [
          "Anti-inflamatório sistêmico",
          "Proteção cardiovascular",
          "Melhora da sensibilidade insulínica",
        ],
      },
      {
        id: "s2",
        name: "MULTIVITAMÍNICO PREMIUM",
        headline: "Cobertura completa de micronutrientes.",
        benefits: [
          "26 vitaminas e minerais quelados",
          "Antioxidantes de alta biodisponibilidade",
          "Suporte imunológico diário",
        ],
      },
      {
        id: "s3",
        name: "COLÁGENO TIPO II",
        headline: "Proteção articular para treinos intensos.",
        benefits: [
          "40mg de colágeno não desnaturado",
          "Redução de dores articulares",
          "Manutenção da cartilagem",
        ],
      },
    ],
  },
  {
    id: "foco",
    title: "Foco & Energia",
    subtitle: "Mente afiada. Produtividade máxima.",
    icon: "🧠",
    products: [
      {
        id: "f1",
        name: "NOOTRÓPICO FOCUS",
        headline: "Clareza mental e foco sustentado.",
        benefits: [
          "L-Teanina + Cafeína balanceados",
          "Melhora da memória de trabalho",
          "Sem ansiedade ou taquicardia",
        ],
      },
      {
        id: "f2",
        name: "CAFEÍNA 200mg",
        headline: "Energia limpa na dose certa.",
        benefits: [
          "Liberação gradual e controlada",
          "Aumento de performance aeróbica",
          "Praticidade em cápsulas",
        ],
      },
    ],
  },
  {
    id: "libido",
    title: "Libido & Sexual",
    subtitle: "Vitalidade que se sente.",
    icon: "💎",
    products: [
      {
        id: "l1",
        name: "MACA PERUANA BLACK",
        headline: "Energia vital e desejo natural.",
        benefits: [
          "Extrato concentrado 10:1",
          "Melhora da disposição sexual",
          "Equilíbrio hormonal adaptogênico",
        ],
      },
      {
        id: "l2",
        name: "TRIBULUS TERRESTRIS",
        headline: "Estímulo natural à libido masculina.",
        benefits: [
          "90% de saponinas ativas",
          "Suporte à produção de NO",
          "Vitalidade e vigor aumentados",
        ],
      },
    ],
  },
];
