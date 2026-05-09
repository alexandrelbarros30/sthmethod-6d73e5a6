// LocalStorage adapter for non-authenticated public users.
// Same shape as DB rows so the UI doesn't care where data comes from.

export type DiaryEntry = {
  id: string;
  user_id: string | null;
  log_date: string;
  meal_type: string;
  meal_label: string;
  food_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  sort_order: number;
  created_at: string;
};

export type SavedMeal = {
  id: string;
  name: string;
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: Array<{
    item_name: string;
    quantity: number;
    unit: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    food_id: string | null;
  }>;
};

export type Goals = {
  daily_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
};

const KEY_ENTRIES = "fd_entries_v1";
const KEY_SAVED = "fd_saved_v1";
const KEY_WATER = "fd_water_v1";
const KEY_GOALS = "fd_goals_v1";
const KEY_LEAD = "fd_lead_v1";

export const DEFAULT_GOALS: Goals = {
  daily_kcal: 2000,
  protein_g: 130,
  carbs_g: 220,
  fat_g: 65,
  water_ml: 2500,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const localDiary = {
  getEntries: (date: string) =>
    read<DiaryEntry[]>(KEY_ENTRIES, []).filter((e) => e.log_date === date),
  addEntry: (entry: DiaryEntry) => {
    const all = read<DiaryEntry[]>(KEY_ENTRIES, []);
    all.push(entry);
    write(KEY_ENTRIES, all);
  },
  removeEntry: (id: string) => {
    write(KEY_ENTRIES, read<DiaryEntry[]>(KEY_ENTRIES, []).filter((e) => e.id !== id));
  },
  getWater: (date: string) => {
    const map = read<Record<string, number>>(KEY_WATER, {});
    return map[date] || 0;
  },
  setWater: (date: string, ml: number) => {
    const map = read<Record<string, number>>(KEY_WATER, {});
    map[date] = ml;
    write(KEY_WATER, map);
  },
  getGoals: () => read<Goals>(KEY_GOALS, DEFAULT_GOALS),
  setGoals: (g: Goals) => write(KEY_GOALS, g),
  getSavedMeals: () => read<SavedMeal[]>(KEY_SAVED, []),
  addSavedMeal: (m: SavedMeal) => {
    const all = read<SavedMeal[]>(KEY_SAVED, []);
    all.unshift(m);
    write(KEY_SAVED, all);
  },
  removeSavedMeal: (id: string) => {
    write(KEY_SAVED, read<SavedMeal[]>(KEY_SAVED, []).filter((m) => m.id !== id));
  },
  getLead: () => {
    try { return JSON.parse(localStorage.getItem(KEY_LEAD) || "null"); } catch { return null; }
  },
  setLead: (lead: { id: string; full_name: string; email: string; phone: string }) => {
    write(KEY_LEAD, lead);
  },
};

export const MEAL_TYPES = [
  { key: "cafe", label: "Café da Manhã", icon: "☀️" },
  { key: "almoco", label: "Almoço", icon: "🍽️" },
  { key: "jantar", label: "Jantar", icon: "🌇" },
  { key: "lanche", label: "Lanches/Outros", icon: "🌙" },
] as const;