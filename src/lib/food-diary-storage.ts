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
const KEY_CUSTOM_MEALS = "fd_custom_meals_v1";

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
  updateEntry: (id: string, patch: Partial<DiaryEntry>) => {
    const all = read<DiaryEntry[]>(KEY_ENTRIES, []);
    const next = all.map((e) => (e.id === id ? { ...e, ...patch } : e));
    write(KEY_ENTRIES, next);
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
  getCustomMeals: () => read<Array<{ key: string; label: string; icon: string }>>(KEY_CUSTOM_MEALS, []),
  addCustomMeal: (m: { key: string; label: string; icon: string }) => {
    const all = read<Array<{ key: string; label: string; icon: string }>>(KEY_CUSTOM_MEALS, []);
    if (all.some((x) => x.key === m.key)) return;
    all.push(m);
    write(KEY_CUSTOM_MEALS, all);
  },
  removeCustomMeal: (key: string) => {
    write(KEY_CUSTOM_MEALS, read<Array<{ key: string; label: string; icon: string }>>(KEY_CUSTOM_MEALS, []).filter((m) => m.key !== key));
  },
};

export const MEAL_TYPES = [
  { key: "cafe", label: "Café da Manhã", icon: "☀️" },
  { key: "almoco", label: "Almoço", icon: "🍽️" },
  { key: "lanche_tarde", label: "Lanche da Tarde", icon: "🥪" },
  { key: "lanche_jantar", label: "Lanche antes do Jantar", icon: "🥗" },
  { key: "jantar", label: "Jantar", icon: "🌇" },
  { key: "ceia", label: "Ceia", icon: "🌙" },
] as const;