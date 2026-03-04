// Shared labels and constants for training/cardio forms

export const physicalActivityLevelOptions = [
  { value: "sedentario", label: "Sedentário", desc: "Passa a maior parte do dia sentado ou deitado" },
  { value: "levemente_ativo", label: "Levemente ativo", desc: "Alterna sentar com pequenas caminhadas e tarefas" },
  { value: "moderadamente_ativo", label: "Moderadamente ativo", desc: "Em pé boa parte do dia, caminha com frequência" },
  { value: "bastante_ativo", label: "Bastante ativo", desc: "Em pé quase todo o dia, movimentação constante" },
  { value: "extremamente_ativo", label: "Extremamente ativo", desc: "Trabalho físico intenso e ritmo intenso o dia todo" },
];

export const physicalActivityLevelLabels: Record<string, string> = Object.fromEntries(
  physicalActivityLevelOptions.map((o) => [o.value, `${o.label} — ${o.desc}`])
);

export const objectiveLabels: Record<string, string> = {
  perder_gordura: "Perder gordura",
  hipertrofia: "Hipertrofia",
  manter_peso: "Manter peso",
};

export const activityLabels: Record<string, string> = {
  musculacao: "Musculação",
  crossfit: "CrossFit",
  nenhuma: "Nenhuma",
};

export const trainingIntensityOptions = [
  { value: "muito_leve", label: "Muito leve", desc: "Sem cargas ou para reabilitação" },
  { value: "leve", label: "Leve", desc: "Com cargas, mas não há desconforto" },
  { value: "moderado", label: "Moderado", desc: "Há desafio, mas desconforto tolerável" },
  { value: "pesado", label: "Pesado", desc: "Máximo de carga e próximo do limite" },
  { value: "muito_pesado", label: "Muito pesado", desc: "Usando muito volume e técnicas avançadas" },
];

export const cardioIntensityOptions = [
  { value: "muito_leve", label: "Muito leve", desc: "Caminhada no parque" },
  { value: "leve", label: "Leve", desc: "Caminhada acelerada talvez com inclinação" },
  { value: "moderado", label: "Moderado", desc: "É possível manter uma conversa" },
  { value: "intenso", label: "Intenso", desc: "Não há fôlego para manter uma conversa" },
  { value: "muito_intenso", label: "Muito intenso", desc: "Tiros (sprints) e HIIT na frequência cardíaca máxima" },
];

export const trainingIntensityLabels: Record<string, string> = Object.fromEntries(
  trainingIntensityOptions.map((o) => [o.value, `${o.label} — ${o.desc}`])
);

export const cardioIntensityLabels: Record<string, string> = Object.fromEntries(
  cardioIntensityOptions.map((o) => [o.value, `${o.label} — ${o.desc}`])
);
