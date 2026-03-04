// Shared labels and constants for training/cardio forms

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
