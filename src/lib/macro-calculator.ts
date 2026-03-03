// Macro calculator based on Mifflin-St Jeor equation (same as hipertrofia.org)

export interface MacroInput {
  gender: "masculino" | "feminino";
  age: number;
  weight: number; // kg
  height: number; // cm
  activityType: string; // musculacao, crossfit, nenhuma
  doesCardio: boolean;
  objective: string; // perder_gordura, hipertrofia, manter_peso
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

export function calculateMacros(input: MacroInput): MacroResult {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (input.gender === "masculino") {
    bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age + 5;
  } else {
    bmr = 10 * input.weight + 6.25 * input.height - 5 * input.age - 161;
  }

  // Activity multiplier
  let multiplier = 1.2; // sedentário base
  if (input.activityType === "musculacao") {
    multiplier = 1.55; // moderadamente ativo
  } else if (input.activityType === "crossfit") {
    multiplier = 1.725; // bastante ativo
  }

  // Add cardio bonus
  if (input.doesCardio) {
    multiplier += 0.1;
  }

  const tdee = Math.round(bmr * multiplier);

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
