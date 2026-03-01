// Mock data for the ST&H platform demo

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "pending";
  avatarInitials: string;
}

export interface Meal {
  name: string;
  time: string;
  foods: { item: string; quantity: string; notes?: string }[];
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes?: string;
}

export interface TrainingDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface ProtocolItem {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  type: "supplement" | "medication";
}

export interface ContentItem {
  id: string;
  title: string;
  type: "article" | "pdf" | "video";
  description: string;
  date: string;
}

export const mockStudents: Student[] = [
  { id: "1", name: "Lucas Mendes", email: "lucas@email.com", phone: "(11) 99999-1234", plan: "Trimestral", startDate: "2026-01-15", endDate: "2026-04-15", status: "active", avatarInitials: "LM" },
  { id: "2", name: "Ana Carolina Silva", email: "ana@email.com", phone: "(21) 98888-5678", plan: "Semestral", startDate: "2025-10-01", endDate: "2026-04-01", status: "active", avatarInitials: "AS" },
  { id: "3", name: "Pedro Oliveira", email: "pedro@email.com", phone: "(31) 97777-9012", plan: "Mensal", startDate: "2026-02-01", endDate: "2026-03-01", status: "expired", avatarInitials: "PO" },
  { id: "4", name: "Maria Fernanda Costa", email: "maria@email.com", phone: "(41) 96666-3456", plan: "6M (180 dias)", startDate: "2025-12-01", endDate: "2026-06-01", status: "active", avatarInitials: "MC" },
  { id: "5", name: "Rafael Santos", email: "rafael@email.com", phone: "(51) 95555-7890", plan: "Trimestral", startDate: "2026-02-20", endDate: "2026-05-20", status: "active", avatarInitials: "RS" },
];

export const mockDiet: Meal[] = [
  { name: "Café da manhã", time: "07:00", foods: [
    { item: "Ovos mexidos", quantity: "3 unidades", notes: "Com azeite extra virgem" },
    { item: "Pão integral", quantity: "2 fatias" },
    { item: "Abacate", quantity: "1/2 unidade" },
    { item: "Café preto", quantity: "200ml", notes: "Sem açúcar" },
  ]},
  { name: "Lanche da manhã", time: "10:00", foods: [
    { item: "Whey Protein", quantity: "30g" },
    { item: "Banana", quantity: "1 unidade" },
    { item: "Aveia", quantity: "30g" },
  ]},
  { name: "Almoço", time: "12:30", foods: [
    { item: "Arroz integral", quantity: "150g" },
    { item: "Frango grelhado", quantity: "200g" },
    { item: "Brócolis", quantity: "100g" },
    { item: "Batata doce", quantity: "150g" },
    { item: "Salada verde", quantity: "À vontade" },
  ]},
  { name: "Lanche da tarde", time: "16:00", foods: [
    { item: "Iogurte natural", quantity: "200g" },
    { item: "Castanhas", quantity: "30g" },
    { item: "Mel", quantity: "1 colher de chá" },
  ]},
  { name: "Jantar", time: "19:30", foods: [
    { item: "Salmão grelhado", quantity: "180g" },
    { item: "Quinoa", quantity: "100g" },
    { item: "Legumes assados", quantity: "150g" },
  ]},
  { name: "Ceia", time: "21:30", foods: [
    { item: "Caseína", quantity: "30g" },
    { item: "Pasta de amendoim", quantity: "1 colher de sopa" },
  ]},
];

export const mockTraining: TrainingDay[] = [
  { day: "Segunda-feira", focus: "Peito + Tríceps", exercises: [
    { name: "Supino reto com barra", sets: "4", reps: "8-10", rest: "90s" },
    { name: "Supino inclinado halteres", sets: "3", reps: "10-12", rest: "75s" },
    { name: "Crucifixo máquina", sets: "3", reps: "12-15", rest: "60s" },
    { name: "Tríceps pulley", sets: "3", reps: "12", rest: "60s" },
    { name: "Tríceps francês", sets: "3", reps: "10-12", rest: "60s" },
  ]},
  { day: "Terça-feira", focus: "Costas + Bíceps", exercises: [
    { name: "Puxada frontal", sets: "4", reps: "8-10", rest: "90s" },
    { name: "Remada curvada", sets: "4", reps: "8-10", rest: "90s" },
    { name: "Remada unilateral", sets: "3", reps: "10-12", rest: "75s" },
    { name: "Rosca direta", sets: "3", reps: "10-12", rest: "60s" },
    { name: "Rosca martelo", sets: "3", reps: "12", rest: "60s" },
  ]},
  { day: "Quarta-feira", focus: "Pernas", exercises: [
    { name: "Agachamento livre", sets: "4", reps: "6-8", rest: "120s", notes: "Atenção à profundidade" },
    { name: "Leg press 45°", sets: "4", reps: "10-12", rest: "90s" },
    { name: "Cadeira extensora", sets: "3", reps: "12-15", rest: "60s" },
    { name: "Mesa flexora", sets: "3", reps: "12", rest: "60s" },
    { name: "Panturrilha em pé", sets: "4", reps: "15-20", rest: "45s" },
  ]},
  { day: "Quinta-feira", focus: "Ombros + Trapézio", exercises: [
    { name: "Desenvolvimento militar", sets: "4", reps: "8-10", rest: "90s" },
    { name: "Elevação lateral", sets: "4", reps: "12-15", rest: "60s" },
    { name: "Elevação frontal", sets: "3", reps: "12", rest: "60s" },
    { name: "Encolhimento com barra", sets: "3", reps: "12-15", rest: "60s" },
  ]},
  { day: "Sexta-feira", focus: "Full Body (funcional)", exercises: [
    { name: "Terra sumo", sets: "4", reps: "6-8", rest: "120s" },
    { name: "Clean and press", sets: "3", reps: "8", rest: "90s" },
    { name: "Burpees", sets: "3", reps: "12", rest: "60s" },
    { name: "Abdominal prancha", sets: "3", reps: "45s", rest: "30s" },
  ]},
];

export const mockProtocol: ProtocolItem[] = [
  { name: "Creatina monohidratada", dosage: "5g", frequency: "Diário", timing: "Pós-treino", type: "supplement" },
  { name: "Vitamina D3", dosage: "5000 UI", frequency: "Diário", timing: "Manhã com gordura", type: "supplement" },
  { name: "Ômega-3 (EPA/DHA)", dosage: "2g", frequency: "Diário", timing: "Com refeição", type: "supplement" },
  { name: "Magnésio quelato", dosage: "400mg", frequency: "Diário", timing: "Antes de dormir", type: "supplement" },
  { name: "Whey Protein Isolado", dosage: "30g", frequency: "Pós-treino", timing: "Até 30min após treino", type: "supplement" },
  { name: "ZMA", dosage: "1 cápsula", frequency: "Diário", timing: "Antes de dormir", type: "supplement" },
];

export const mockContent: ContentItem[] = [
  { id: "1", title: "Guia Completo de Periodização de Treino", type: "article", description: "Entenda como organizar seu treino em mesociclos para maximizar resultados.", date: "2026-02-15" },
  { id: "2", title: "Nutrição para Hipertrofia: Bases Científicas", type: "pdf", description: "PDF com as principais evidências sobre nutrição para ganho de massa muscular.", date: "2026-02-10" },
  { id: "3", title: "Técnica de Agachamento - Análise Biomecânica", type: "video", description: "Vídeo explicativo sobre a biomecânica do agachamento livre.", date: "2026-02-05" },
  { id: "4", title: "Sono e Recuperação: O Pilar Esquecido", type: "article", description: "Como otimizar seu sono para maximizar a recuperação muscular.", date: "2026-01-28" },
  { id: "5", title: "Suplementação Baseada em Evidências", type: "pdf", description: "Revisão dos suplementos com maior respaldo científico.", date: "2026-01-20" },
];

export const mockPlans = [
  { id: "1", name: "Mensal", price: "R$ 297,00", duration: "30 dias", benefits: ["Dieta personalizada", "Treino estruturado", "Protocolo de suplementação", "Suporte por chat"] },
  { id: "2", name: "Trimestral", price: "R$ 797,00", duration: "90 dias", benefits: ["Tudo do plano Mensal", "Revisões quinzenais", "Conteúdo educativo exclusivo", "Prioridade no atendimento"] },
  { id: "3", name: "Semestral", price: "R$ 1.497,00", duration: "180 dias", benefits: ["Tudo do plano Trimestral", "Análise de exames", "Ajustes semanais", "Acesso a workshops"] },
  { id: "4", name: "6M (180 dias)", price: "R$ 1.797,00", duration: "180 dias", benefits: ["Tudo do plano Semestral", "Consultoria 1:1 mensal por vídeo", "Plano de periodização completo", "Mentoria personalizada"] },
];

export const mockAdminMetrics = {
  totalStudents: 47,
  activeStudents: 38,
  expiredSubscriptions: 5,
  expiringIn7Days: 4,
  revenue: "R$ 18.450,00",
  newThisMonth: 6,
};
