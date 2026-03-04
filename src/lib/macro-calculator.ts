// Macro calculator based on Mifflin-St Jeor equation
// Mirrors hipertrofia.org calculator: NEAT + training MET + cardio MET approach

export interface MacroInput {
  gender: "masculino" | "feminino";
  age: number;
  weight: number; // kg
  height: number; // cm
  activityType: string; // musculacao, crossfit, nenhuma
  doesCardio: boolean;
  objective: string; // perder_gordura, hipertrofia, manter_peso
  physicalActivityLevel?: string; // NEAT level
  // New detailed fields
  trainingDaysPerWeek?: number;
  trainingDurationMinutes?: number;
  trainingIntensity?: string;
  cardioDaysPerWeek?: number;
  cardioDurationMinutes?: number;
  cardioIntensity?: string;
}

export interface MacroResult {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// MET values for weight training intensity
function getTrainingMET(intensity: string | undefined): number {
  switch (intensity) {
    case "muito_leve": return 3.0;
    case "leve": return 3.5;
    case "moderado": return 5.0;
    case "pesado": return 6.0;
    case "muito_pesado": return 7.0;
    default: return 5.0;
  }
}

// MET values for cardio intensity
function getCardioMET(intensity: string | undefined): number {
  switch (intensity) {
    case "muito_leve": return 2.5;
    case "leve": return 3.5;
    case "moderado": return 5.0;
    case "intenso": return 7.0;
    case "muito_intenso": return 10.0;
    default: return 5.0;
  }
}
// NEAT multiplier based on daily physical activity level (excluding exercise)
function getNeatMultiplier(level: string | undefined): number {
  switch (level) {
    case "sedentario": return 1.2;
    case "levemente_ativo": return 1.375;
    case "moderadamente_ativo": return 1.55;
    case "bastante_ativo": return 1.725;
    case "extremamente_ativo": return 1.9;
    default: return 1.2;
  }
}

export function calculateMacros(input: MacroInput): MacroResult {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (input.gender === "masculino") {
    bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;
  } else {
    bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age - 161;
  }

  // Calculate TDEE using activity-based EAT (Exercise Activity Thermogenesis)
  // NEAT multiplier based on physical activity level (non-exercise)
  const neatMultiplier = getNeatMultiplier(input.physicalActivityLevel);
  let dailyTDEE = bmr * neatMultiplier;

  // Add training calories if applicable
  if (input.activityType !== "nenhuma" && input.trainingDaysPerWeek && input.trainingDurationMinutes) {
    const met = getTrainingMET(input.trainingIntensity);
    // Calories per session = MET * weight * hours
    const hoursPerSession = input.trainingDurationMinutes / 60;
    const calPerSession = met * input.weight * hoursPerSession;
    // Spread weekly training calories across 7 days
    const dailyTrainingCal = (calPerSession * input.trainingDaysPerWeek) / 7;
    dailyTDEE += dailyTrainingCal;
  } else if (input.activityType !== "nenhuma") {
    // Fallback: use simple multiplier if no detailed data
    if (input.activityType === "musculacao") {
      dailyTDEE = bmr * 1.55;
    } else if (input.activityType === "crossfit") {
      dailyTDEE = bmr * 1.725;
    }
  }

  // Add cardio calories if applicable
  if (input.doesCardio && input.cardioDaysPerWeek && input.cardioDurationMinutes) {
    const met = getCardioMET(input.cardioIntensity);
    const hoursPerSession = input.cardioDurationMinutes / 60;
    const calPerSession = met * input.weight * hoursPerSession;
    const dailyCardioCal = (calPerSession * input.cardioDaysPerWeek) / 7;
    dailyTDEE += dailyCardioCal;
  } else if (input.doesCardio) {
    // Fallback: add a small bonus
    dailyTDEE += bmr * 0.1;
  }

  const tdee = Math.round(dailyTDEE);

  // Adjust calories based on objective
  let dailyCalories: number;
  if (input.objective === "perder_gordura") {
    dailyCalories = tdee - 500; // déficit de 500 kcal
  } else if (input.objective === "hipertrofia") {
    dailyCalories = tdee + 350; // superávit de 350 kcal
  } else {
    dailyCalories = tdee; // manutenção
  }

  // Macros: Protein 2g/kg, Fat 1g/kg, Carbs = remaining
  const proteinG = Math.round(input.weight * 2);
  const fatG = Math.round(input.weight * 1);
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const carbsCal = Math.max(0, dailyCalories - proteinCal - fatCal);
  const carbsG = Math.round(carbsCal / 4);

  return {
    bmr: Math.round(bmr),
    tdee,
    dailyCalories: Math.round(dailyCalories),
    proteinG,
    carbsG,
    fatG,
  };
}
