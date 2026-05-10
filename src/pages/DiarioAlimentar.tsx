import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Plus, Search, Trash2, Droplet, BookmarkPlus, ChevronLeft, ChevronRight, Loader2, X, ChevronDown, Calculator, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { localDiary, MEAL_TYPES, DEFAULT_GOALS, type DiaryEntry, type SavedMeal, type Goals } from "@/lib/food-diary-storage";
import { calculateMacros, type MacroInput } from "@/lib/macro-calculator";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const todayISO = () => new Date().toISOString().slice(0, 10);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

const normalizeFoodText = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const getPrimaryFoodName = (name: string) =>
  normalizeFoodText(name)
    .split(",")[0]
    .split("(")[0]
    .trim();

function scoreFoodMatch(food: any, query: string) {
  const name = normalizeFoodText(food.name);
  const primaryName = getPrimaryFoodName(food.name);
  const tokens = name.split(/[\s,\-\/()]+/).filter(Boolean);

  if (!query) return { score: 999, name, primaryName };

  let score = 99;
  if (name === query) score = 0;
  else if (primaryName === query) score = 1;
  else if (tokens[0] === query) score = 2;
  else if (tokens.includes(query)) score = 3;
  else if (name.startsWith(`${query},`) || name.startsWith(`${query} `)) score = 4;
  else if (primaryName.startsWith(query)) score = 5;
  else if (name.startsWith(query)) score = 6;
  else if (tokens.some((token) => token.startsWith(query))) score = 7;
  else if (name.includes(query)) score = 8;

  return { score, name, primaryName };
}

function getWeek(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/* ---------------- Lead capture for unauthenticated visitors ---------------- */
function LeadGate({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const leadId = newId();
    const { error } = await supabase
      .from("free_leads")
      .insert({ full_name: name.trim(), email: cleanEmail, phone: cleanPhone });
    setLoading(false);
    // Ignore duplicate-key errors (lead already exists) — let the user proceed.
    if (error && !/duplicate key|unique/i.test(error.message)) {
      toast.error("Erro ao registrar. Tente novamente.");
      return;
    }
    localDiary.setLead({ id: leadId, full_name: name.trim(), email: cleanEmail, phone: cleanPhone });
    onDone();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-apple w-full max-w-md p-8 space-y-5 border border-[#E5E5EA]">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5E9] mb-2">
            <Droplet className="w-7 h-7 text-[#34C759]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1C1C1E]">Diário Alimentar STH METHOD</h1>
          <p className="text-sm text-[#6E6E73]">
            Acesso liberado em segundos. Preencha para começar a registrar suas refeições.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            className="bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E] placeholder:text-[#8E8E93]" />
          <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150}
            className="bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E] placeholder:text-[#8E8E93]" />
          <Input placeholder="WhatsApp (somente números)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20}
            className="bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E] placeholder:text-[#8E8E93]" />
          <Button type="submit" className="w-full font-semibold bg-[#34C759] text-white hover:bg-[#30B350]" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Acessar Diário
          </Button>
        </form>
        <p className="text-[11px] text-center text-[#6E6E73]">
          Já é aluno? <Link to="/login" className="underline text-[#34C759]">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Add Food Dialog ---------------- */
function AddFoodDialog({
  open, onOpenChange, mealType, mealLabel, dateISO, onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mealType: string;
  mealLabel: string;
  dateISO: string;
  onAdd: (entries: Omit<DiaryEntry, "id" | "user_id" | "log_date" | "created_at">[]) => void;
}) {
  const [tab, setTab] = useState<"alimento" | "salvas">("alimento");
  const [search, setSearch] = useState("");
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [editQty, setEditQty] = useState(100);
  const [editUnit, setEditUnit] = useState<"g" | "ml">("g");
  const [selections, setSelections] = useState<Map<string, { food: any; quantity: number; unit: "g" | "ml" }>>(new Map());
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);

  useEffect(() => {
    if (!open) { setSearch(""); setEditingFood(null); setEditQty(100); setEditUnit("g"); setSelections(new Map()); }
    else { setSavedMeals(localDiary.getSavedMeals()); setSelections(new Map()); }
  }, [open]);

  useEffect(() => {
    if (!search.trim() || tab !== "alimento") { setFoods([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("fatsecret-search", {
          body: { query: search.trim(), maxResults: 40 },
        });
        if (error) throw error;
        setFoods(data?.foods || []);
      } catch (e) {
        console.error("fatsecret-search invoke error", e);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, tab]);

  const editRatio = editingFood ? editQty / 100 : 1;
  const selectedCount = selections.size;

  const defaultUnitFor = (food: any): "g" | "ml" =>
    food?.serving_unit?.toLowerCase().includes("ml") ? "ml" : "g";

  const toggleSelect = (food: any) => {
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(food.id)) next.delete(food.id);
      else next.set(food.id, { food, quantity: 100, unit: defaultUnitFor(food) });
      return next;
    });
  };

  const openEditor = (food: any) => {
    const existing = selections.get(food.id);
    setEditingFood(food);
    setEditQty(existing?.quantity ?? 100);
    setEditUnit(existing?.unit ?? defaultUnitFor(food));
  };

  const saveEditor = () => {
    if (!editingFood) return;
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(editingFood.id, { food: editingFood, quantity: editQty, unit: editUnit });
      return next;
    });
    setEditingFood(null);
  };

  const confirmAll = () => {
    if (selections.size === 0) return;
    const entries = Array.from(selections.values()).map(({ food, quantity, unit }) => {
      const r = quantity / 100;
      return {
        meal_type: mealType,
        meal_label: mealLabel,
        food_id: typeof food.id === "string" && food.id.startsWith("fs_") ? null : food.id,
        item_name: food.name,
        quantity,
        unit,
        energy_kcal: +(food.energy_kcal * r).toFixed(1),
        protein_g: +(food.protein_g * r).toFixed(2),
        carbs_g: +(food.carbs_g * r).toFixed(2),
        fat_g: +(food.fat_g * r).toFixed(2),
        fiber_g: +((food.fiber_g || 0) * r).toFixed(2),
        sodium_mg: +((food.sodium_mg || 0) * r).toFixed(1),
        sort_order: 0,
      };
    });
    onAdd(entries);
    onOpenChange(false);
  };

  const headerDate = (() => {
    try {
      const d = new Date(`${dateISO}T00:00:00`);
      return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
    } catch { return dateISO; }
  })();

  const addSavedMeal = (sm: SavedMeal) => {
    const label = mealLabel;
    onAdd(sm.items.map((it) => ({
      meal_type: mealType,
      meal_label: label,
      food_id: it.food_id,
      item_name: it.item_name,
      quantity: it.quantity,
      unit: it.unit,
      energy_kcal: it.energy_kcal,
      protein_g: it.protein_g,
      carbs_g: it.carbs_g,
      fat_g: it.fat_g,
      fiber_g: 0,
      sodium_mg: 0,
      sort_order: 0,
    })));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col bg-white border-[#E5E5EA] text-[#1C1C1E]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-[#1C1C1E]">{mealLabel}</DialogTitle>
              <p className="text-[11px] text-[#6E6E73] mt-0.5 capitalize">{headerDate}</p>
            </div>
            <Button
              size="sm"
              onClick={confirmAll}
              disabled={selectedCount === 0}
              className="shrink-0 font-semibold bg-[#34C759] text-white hover:bg-[#30B350] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-1" /> {selectedCount > 0 ? selectedCount : ""} Confirmar
            </Button>
          </div>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 bg-[#F2F2F7] border border-[#E5E5EA]">
            <TabsTrigger value="alimento" className="data-[state=active]:bg-white data-[state=active]:text-[#34C759] data-[state=active]:shadow-sm">Alimento</TabsTrigger>
            <TabsTrigger value="salvas" className="data-[state=active]:bg-white data-[state=active]:text-[#34C759] data-[state=active]:shadow-sm">Refeições Salvas</TabsTrigger>
          </TabsList>

          <TabsContent value="alimento" className="flex-1 flex flex-col min-h-0 mt-3 space-y-3">
            {editingFood ? (
              <div className="bg-[#F2F2F7] rounded-xl p-4 space-y-3 border border-[#E5E5EA]">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-[#1C1C1E]">{editingFood.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 border-[#E5E5EA] text-[#6E6E73]">{editingFood.source} · {editingFood.category}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingFood(null)} className="text-[#34C759] hover:text-[#30B350]">Voltar</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={editQty} onChange={(e) => setEditQty(Number(e.target.value) || 0)} className="w-24 h-8 bg-white border-[#E5E5EA]" min={1} />
                  <Select value={editUnit} onValueChange={(v) => setEditUnit(v as "g" | "ml")}>
                    <SelectTrigger className="w-24 h-8 bg-white border-[#E5E5EA]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E5EA]">
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl bg-white border border-[#E5E5EA] p-2 text-center">
                    <p className="text-[#6E6E73]">kcal</p>
                    <p className="font-bold text-sm text-[#34C759]">{(editingFood.energy_kcal * editRatio).toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E5EA] p-2 text-center">
                    <p className="text-[#6E6E73]">P</p>
                    <p className="font-bold text-sm text-[#007AFF]">{(editingFood.protein_g * editRatio).toFixed(1)}g</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E5EA] p-2 text-center">
                    <p className="text-[#6E6E73]">C</p>
                    <p className="font-bold text-sm text-[#FF9500]">{(editingFood.carbs_g * editRatio).toFixed(1)}g</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E5EA] p-2 text-center">
                    <p className="text-[#6E6E73]">G</p>
                    <p className="font-bold text-sm text-[#FF9F0A]">{(editingFood.fat_g * editRatio).toFixed(1)}g</p>
                  </div>
                </div>
                <DialogFooter>
                  <div className="w-full flex flex-col sm:flex-row gap-2">
                    <Button onClick={saveEditor} className="w-full font-semibold bg-[#34C759] text-white hover:bg-[#30B350]">
                      <Check className="w-4 h-4 mr-1" /> Salvar e voltar à lista
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                  <Input
                    placeholder="Buscar alimento (ex: laranja, frango...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E] placeholder:text-[#8E8E93]"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto border border-[#E5E5EA] rounded-xl divide-y divide-[#E5E5EA] min-h-[200px] bg-white pb-16">
                  {loading && <div className="p-6 text-center text-sm text-[#6E6E73]"><Loader2 className="w-4 h-4 inline animate-spin mr-2 text-[#34C759]" />Buscando...</div>}
                  {!loading && !search.trim() && <p className="p-6 text-center text-sm text-[#6E6E73]">Digite para buscar entre 30.000+ alimentos</p>}
                  {!loading && search.trim() && foods.length === 0 && <p className="p-6 text-center text-sm text-[#6E6E73]">Nada encontrado.</p>}
                  {foods.map((f) => {
                    const sel = selections.get(f.id);
                    const checked = !!sel;
                    return (
                      <div
                        key={f.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F2F2F7] transition-colors",
                          checked && "bg-[#E8F5E9]"
                        )}
                      >
                        <button onClick={() => openEditor(f)} className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium truncate text-[#1C1C1E]">{f.name}</p>
                          <p className="text-[11px] text-[#34C759]">
                            {sel ? `${sel.quantity}${sel.unit}` : `100${f.serving_unit || "g"}`}
                            <span className="text-[#6E6E73]"> · {Math.round(f.energy_kcal * ((sel?.quantity ?? 100) / 100))} kcal · P:{(f.protein_g * ((sel?.quantity ?? 100) / 100)).toFixed(1)}g C:{(f.carbs_g * ((sel?.quantity ?? 100) / 100)).toFixed(1)}g G:{(f.fat_g * ((sel?.quantity ?? 100) / 100)).toFixed(1)}g</span>
                          </p>
                        </button>
                        <button
                          onClick={() => toggleSelect(f)}
                          aria-label={checked ? "Desmarcar" : "Selecionar"}
                          className={cn(
                            "shrink-0 w-7 h-7 rounded-md border flex items-center justify-center transition-colors",
                            checked
                              ? "bg-[#34C759] border-[#34C759] text-white"
                              : "border-[#D1D1D6] hover:border-[#34C759] text-transparent"
                          )}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {selectedCount > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 rounded-full bg-white border border-[#34C759]/30 shadow-lg px-5 py-2 flex items-center gap-3">
                    <span className="text-sm text-[#1C1C1E]">{selectedCount} {selectedCount > 1 ? "itens selecionados" : "item selecionado"}</span>
                    <button onClick={() => setSelections(new Map())} className="text-sm font-medium text-[#34C759] hover:text-[#30B350]">Desmarcar</button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="salvas" className="flex-1 overflow-y-auto mt-3 border border-[#E5E5EA] rounded-xl divide-y divide-[#E5E5EA] min-h-[200px] bg-white">
            {savedMeals.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#6E6E73]">Nenhuma refeição salva ainda.<br/>Monte uma refeição e clique em "Salvar como combo".</p>
            ) : savedMeals.map((sm) => (
              <div key={sm.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F2F2F7] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-[#1C1C1E]">{sm.name}</p>
                  <p className="text-[11px] text-[#6E6E73]">
                    {Math.round(sm.total_kcal)} kcal · {sm.items.length} itens
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { localDiary.removeSavedMeal(sm.id); setSavedMeals(localDiary.getSavedMeals()); }} className="text-[#FF3B30] hover:text-[#FF453A]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => addSavedMeal(sm)} className="bg-[#34C759] text-white hover:bg-[#30B350]">Adicionar</Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Goals Dialog ---------------- */
function GoalsDialog({ open, onOpenChange, goals, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; goals: Goals; onSave: (g: Goals) => void;
}) {
  const [g, setG] = useState(goals);
  useEffect(() => { setG(goals); }, [goals, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-[#E5E5EA] text-[#1C1C1E]">
        <DialogHeader><DialogTitle className="text-[#1C1C1E]">Minhas Metas Diárias</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {([
            ["daily_kcal", "Calorias (kcal)"],
            ["protein_g", "Proteína (g)"],
            ["carbs_g", "Carboidrato (g)"],
            ["fat_g", "Gordura (g)"],
            ["water_ml", "Água (ml)"],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <label className="text-sm text-[#1C1C1E]">{label}</label>
              <Input type="number" className="w-28 h-8 bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E]" value={(g as any)[k]} onChange={(e) => setG({ ...g, [k]: Number(e.target.value) || 0 })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(g); onOpenChange(false); }} className="font-semibold bg-[#34C759] text-white hover:bg-[#30B350]">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Macro Calculator Dialog ---------------- */
function MacroCalcDialog({ open, onOpenChange, currentWater, onApply }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentWater: number;
  onApply: (g: Goals) => void;
}) {
  const [gender, setGender] = useState<"masculino" | "feminino">("masculino");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [neat, setNeat] = useState("levemente_ativo");
  const [activityType, setActivityType] = useState("musculacao");
  const [trainDays, setTrainDays] = useState(4);
  const [trainMin, setTrainMin] = useState(60);
  const [trainIntensity, setTrainIntensity] = useState("moderado");
  const [doesCardio, setDoesCardio] = useState(false);
  const [cardioDays, setCardioDays] = useState(3);
  const [cardioMin, setCardioMin] = useState(30);
  const [cardioIntensity, setCardioIntensity] = useState("moderado");
  const [objective, setObjective] = useState("manter_peso");

  const result = useMemo(() => {
    const input: MacroInput = {
      gender, age, weight, height,
      activityType, doesCardio, objective,
      physicalActivityLevel: neat,
      trainingDaysPerWeek: trainDays,
      trainingDurationMinutes: trainMin,
      trainingIntensity: trainIntensity,
      cardioDaysPerWeek: cardioDays,
      cardioDurationMinutes: cardioMin,
      cardioIntensity: cardioIntensity,
    };
    return calculateMacros(input);
  }, [gender, age, weight, height, neat, activityType, trainDays, trainMin, trainIntensity, doesCardio, cardioDays, cardioMin, cardioIntensity, objective]);

  const apply = () => {
    const waterMl = Math.max(currentWater, Math.round(weight * 35 / 50) * 50); // ~35ml/kg, rounded
    onApply({
      daily_kcal: result.dailyCalories,
      protein_g: result.proteinG,
      carbs_g: result.carbsG,
      fat_g: result.fatG,
      water_ml: waterMl,
    });
    onOpenChange(false);
  };

  const inputCls = "h-9 bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E]";
  const triggerCls = "h-9 bg-[#F2F2F7] border-[#E5E5EA] text-[#1C1C1E]";
  const contentCls = "bg-white border-[#E5E5EA]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border-[#E5E5EA] text-[#1C1C1E]">
        <DialogHeader>
          <DialogTitle className="text-[#1C1C1E] flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Calcular Macros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#6E6E73]">Sexo</label>
              <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                <SelectContent className={contentCls}>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#6E6E73]">Idade</label>
              <Input type="number" className={inputCls} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-[#6E6E73]">Peso (kg)</label>
              <Input type="number" className={inputCls} value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-[#6E6E73]">Altura (cm)</label>
              <Input type="number" className={inputCls} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6E6E73]">Nível de atividade no dia (NEAT)</label>
            <Select value={neat} onValueChange={setNeat}>
              <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="sedentario">Sedentário (escritório)</SelectItem>
                <SelectItem value="levemente_ativo">Levemente ativo</SelectItem>
                <SelectItem value="moderadamente_ativo">Moderadamente ativo</SelectItem>
                <SelectItem value="bastante_ativo">Bastante ativo</SelectItem>
                <SelectItem value="extremamente_ativo">Extremamente ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-[#6E6E73]">Treino</label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="nenhuma">Não treino</SelectItem>
                <SelectItem value="musculacao">Musculação</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activityType !== "nenhuma" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[#6E6E73]">Dias/sem</label>
                <Input type="number" className={inputCls} value={trainDays} onChange={(e) => setTrainDays(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[#6E6E73]">Min/sessão</label>
                <Input type="number" className={inputCls} value={trainMin} onChange={(e) => setTrainMin(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[#6E6E73]">Intensidade</label>
                <Select value={trainIntensity} onValueChange={setTrainIntensity}>
                  <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="muito_leve">Muito leve</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="pesado">Pesado</SelectItem>
                    <SelectItem value="muito_pesado">Muito pesado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input id="cardio-toggle" type="checkbox" checked={doesCardio} onChange={(e) => setDoesCardio(e.target.checked)} className="accent-[#34C759]" />
            <label htmlFor="cardio-toggle" className="text-sm text-[#1C1C1E]">Faço cardio</label>
          </div>

          {doesCardio && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[#6E6E73]">Dias/sem</label>
                <Input type="number" className={inputCls} value={cardioDays} onChange={(e) => setCardioDays(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[#6E6E73]">Min/sessão</label>
                <Input type="number" className={inputCls} value={cardioMin} onChange={(e) => setCardioMin(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[#6E6E73]">Intensidade</label>
                <Select value={cardioIntensity} onValueChange={setCardioIntensity}>
                  <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="muito_leve">Muito leve</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="intenso">Intenso</SelectItem>
                    <SelectItem value="muito_intenso">Muito intenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-[#6E6E73]">Objetivo</label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="perder_gordura">Perder gordura (-500 kcal)</SelectItem>
                <SelectItem value="manter_peso">Manter peso</SelectItem>
                <SelectItem value="hipertrofia">Hipertrofia (+350 kcal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-[#F2F2F7] rounded-xl p-3 mt-2 border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73] mb-2">Resultado</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white border border-[#34C759]/25 p-2">
                <div className="font-bold text-[#34C759] text-sm tabular-nums">{result.dailyCalories}</div>
                <div className="text-[#6E6E73] mt-0.5">kcal</div>
              </div>
              <div className="rounded-xl bg-white border border-[#007AFF]/25 p-2">
                <div className="font-bold text-[#007AFF] text-sm tabular-nums">{result.proteinG}g</div>
                <div className="text-[#6E6E73] mt-0.5">Proteína</div>
              </div>
              <div className="rounded-xl bg-white border border-[#FF9500]/25 p-2">
                <div className="font-bold text-[#FF9500] text-sm tabular-nums">{result.carbsG}g</div>
                <div className="text-[#6E6E73] mt-0.5">Carbo</div>
              </div>
              <div className="rounded-xl bg-white border border-[#FF9F0A]/25 p-2">
                <div className="font-bold text-[#FF9F0A] text-sm tabular-nums">{result.fatG}g</div>
                <div className="text-[#6E6E73] mt-0.5">Gord</div>
              </div>
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-2">TDEE: {result.tdee} kcal · TMB: {result.bmr} kcal · Água sugerida: {Math.round(weight * 35)} ml</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={apply} className="w-full font-semibold bg-[#34C759] text-white hover:bg-[#30B350]">
            Aplicar como minhas metas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Main Page ---------------- */
export default function DiarioAlimentar() {
  const { user } = useAuth();
  const isAuth = !!user;
  const [leadOk, setLeadOk] = useState(() => !!localDiary.getLead());
  const [date, setDate] = useState<string>(todayISO());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [water, setWater] = useState(0);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<string>("cafe");
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [customMeals, setCustomMeals] = useState<Array<{ key: string; label: string; icon: string }>>(() => localDiary.getCustomMeals());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set([...MEAL_TYPES.map(m => m.key), ...localDiary.getCustomMeals().map(m => m.key)]));

  const allMeals = useMemo(() => {
    // Merge defaults + custom + any meal_type present in entries that isn't covered
    const base: Array<{ key: string; label: string; icon: string }> = [...MEAL_TYPES, ...customMeals];
    const known = new Set(base.map((m) => m.key));
    entries.forEach((e) => {
      if (!known.has(e.meal_type)) {
        base.push({ key: e.meal_type, label: e.meal_label || e.meal_type, icon: "🍴" });
        known.add(e.meal_type);
      }
    });
    return base;
  }, [customMeals, entries]);

  const addCustomMeal = () => {
    const name = window.prompt("Nome da nova refeição (ex: Pré-treino, Pós-treino):");
    if (!name || !name.trim()) return;
    const label = name.trim();
    const key = "custom_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Math.random().toString(36).slice(2, 6);
    const meal = { key, label, icon: "🍴" };
    localDiary.addCustomMeal(meal);
    setCustomMeals(localDiary.getCustomMeals());
    setExpandedMeals((prev) => new Set(prev).add(key));
    toast.success("Refeição adicionada");
  };

  const removeCustomMeal = (key: string) => {
    if (entries.some((e) => e.meal_type === key)) {
      toast.error("Remova os alimentos antes de excluir esta refeição");
      return;
    }
    localDiary.removeCustomMeal(key);
    setCustomMeals(localDiary.getCustomMeals());
  };

  // Load data
  const refresh = async () => {
    if (isAuth && user) {
      const [{ data: e }, { data: w }, { data: g }] = await Promise.all([
        supabase.from("food_diary_entries").select("*").eq("user_id", user.id).eq("log_date", date).order("created_at"),
        supabase.from("food_diary_water").select("ml").eq("user_id", user.id).eq("log_date", date).maybeSingle(),
        supabase.from("food_diary_goals").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setEntries((e || []) as DiaryEntry[]);
      setWater(w?.ml || 0);
      setGoals(g ? { daily_kcal: g.daily_kcal, protein_g: g.protein_g, carbs_g: g.carbs_g, fat_g: g.fat_g, water_ml: g.water_ml } : DEFAULT_GOALS);
    } else {
      setEntries(localDiary.getEntries(date));
      setWater(localDiary.getWater(date));
      setGoals(localDiary.getGoals());
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [date, isAuth, user?.id, leadOk]);

  const addEntries = async (items: Omit<DiaryEntry, "id" | "user_id" | "log_date" | "created_at">[]) => {
    if (isAuth && user) {
      const rows = items.map((it) => ({ ...it, user_id: user.id, log_date: date }));
      const { error } = await supabase.from("food_diary_entries").insert(rows);
      if (error) { toast.error("Erro ao adicionar"); return; }
    } else {
      items.forEach((it) => localDiary.addEntry({
        ...it,
        id: newId(),
        user_id: null,
        log_date: date,
        created_at: new Date().toISOString(),
      }));
    }
    toast.success("Adicionado!");
    refresh();
  };

  const removeEntry = async (id: string) => {
    if (isAuth && user) {
      await supabase.from("food_diary_entries").delete().eq("id", id);
    } else {
      localDiary.removeEntry(id);
    }
    refresh();
  };

  const updateWater = async (ml: number) => {
    const v = Math.max(0, ml);
    setWater(v);
    if (isAuth && user) {
      await supabase.from("food_diary_water").upsert({ user_id: user.id, log_date: date, ml: v }, { onConflict: "user_id,log_date" });
    } else {
      localDiary.setWater(date, v);
    }
  };

  const saveGoals = async (g: Goals) => {
    setGoals(g);
    if (isAuth && user) {
      await supabase.from("food_diary_goals").upsert({ user_id: user.id, ...g });
    } else {
      localDiary.setGoals(g);
    }
    toast.success("Metas salvas");
  };

  const totals = useMemo(() => entries.reduce((a, e) => ({
    kcal: a.kcal + Number(e.energy_kcal || 0),
    p: a.p + Number(e.protein_g || 0),
    c: a.c + Number(e.carbs_g || 0),
    f: a.f + Number(e.fat_g || 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 }), [entries]);

  const groupByMeal = (mt: string) => entries.filter((e) => e.meal_type === mt);

  const findMealLabel = (key: string) => allMeals.find((m) => m.key === key)?.label || key;

  const saveAsCombo = (mt: string) => {
    const items = groupByMeal(mt);
    if (items.length === 0) { toast.error("Adicione alimentos antes de salvar"); return; }
    const name = window.prompt("Nome do combo (ex: Almoço cutting 1500kcal):", MEAL_TYPES.find(m => m.key === mt)?.label || "Combo");
    if (!name) return;
    const totals = items.reduce((a, i) => ({
      kcal: a.kcal + Number(i.energy_kcal),
      p: a.p + Number(i.protein_g),
      c: a.c + Number(i.carbs_g),
      f: a.f + Number(i.fat_g),
    }), { kcal: 0, p: 0, c: 0, f: 0 });
    localDiary.addSavedMeal({
      id: newId(),
      name,
      total_kcal: totals.kcal,
      total_protein: totals.p,
      total_carbs: totals.c,
      total_fat: totals.f,
      items: items.map((i) => ({
        item_name: i.item_name, quantity: i.quantity, unit: i.unit,
        energy_kcal: Number(i.energy_kcal), protein_g: Number(i.protein_g),
        carbs_g: Number(i.carbs_g), fat_g: Number(i.fat_g), food_id: i.food_id,
      })),
    });
    toast.success("Combo salvo!");
  };

  if (!isAuth && !leadOk) return <LeadGate onDone={() => setLeadOk(true)} />;

  const remaining = Math.max(0, goals.daily_kcal - totals.kcal);
  const consumedPct = Math.min(100, (totals.kcal / goals.daily_kcal) * 100);

  const week = getWeek(new Date(date + "T00:00:00"));
  const dateObj = new Date(date + "T00:00:00");

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">Diário Alimentar</h1>
            <p className="text-xs text-[#6E6E73]">
              {dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCalcOpen(true)}
              className="border-[#E5E5EA] bg-white text-[#34C759] hover:bg-[#F2F2F7] hover:text-[#30B350]">
              <Calculator className="w-4 h-4 mr-1" /> Calcular
            </Button>
          </div>
        </div>

        {/* Week strip */}
        <div className="bg-white rounded-2xl shadow-apple-sm p-3 border border-[#E5E5EA]">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#1C1C1E] hover:text-[#34C759] hover:bg-[#F2F2F7]" onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() - 7); setDate(d.toISOString().slice(0, 10));
            }}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="grid grid-cols-7 flex-1 gap-1">
              {week.map((d) => {
                const iso = d.toISOString().slice(0, 10);
                const isSel = iso === date;
                const isToday = iso === todayISO();
                return (
                  <button key={iso} onClick={() => setDate(iso)}
                    className={cn(
                      "flex flex-col items-center py-1.5 rounded-xl text-xs transition-all",
                      isSel
                        ? "bg-[#34C759] text-white font-bold shadow-sm"
                        : isToday
                          ? "bg-[#E8F5E9] text-[#34C759]"
                          : "hover:bg-[#F2F2F7] text-[#1C1C1E]"
                    )}>
                    <span className={isSel ? "opacity-80" : "opacity-60"}>{DOW[d.getDay()]}</span>
                    <span className="font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#1C1C1E] hover:text-[#34C759] hover:bg-[#F2F2F7]" onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 7); setDate(d.toISOString().slice(0, 10));
            }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Calorie summary */}
        <div className="bg-white rounded-2xl shadow-apple-sm p-4 border border-[#E5E5EA]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6E6E73]">Calorias Restantes</span>
            <span className="font-bold tabular-nums text-[#1C1C1E]">{Math.round(remaining)} / {goals.daily_kcal}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-[#6E6E73]">Calorias Consumidas</span>
            <span className="font-bold tabular-nums text-[#34C759]">{Math.round(totals.kcal)}</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{ width: `${consumedPct}%`, background: "linear-gradient(90deg, #34C759, #30D158)" }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            <div className="rounded-xl bg-[#F2F2F7] border border-[#007AFF]/20 p-2.5">
              <div className="font-bold tabular-nums text-[#007AFF] text-sm">{Math.round(totals.p)}g</div>
              <div className="text-[#6E6E73] mt-0.5">Proteína / {goals.protein_g}g</div>
            </div>
            <div className="rounded-xl bg-[#F2F2F7] border border-[#FF9500]/20 p-2.5">
              <div className="font-bold tabular-nums text-[#FF9500] text-sm">{Math.round(totals.c)}g</div>
              <div className="text-[#6E6E73] mt-0.5">Carbo / {goals.carbs_g}g</div>
            </div>
            <div className="rounded-xl bg-[#F2F2F7] border border-[#FF9F0A]/20 p-2.5">
              <div className="font-bold tabular-nums text-[#FF9F0A] text-sm">{Math.round(totals.f)}g</div>
              <div className="text-[#6E6E73] mt-0.5">Gord / {goals.fat_g}g</div>
            </div>
          </div>
        </div>

        {/* Meals */}
        {allMeals.map((m) => {
          const items = groupByMeal(m.key);
          const mealKcal = items.reduce((a, i) => a + Number(i.energy_kcal), 0);
          const isCustom = !MEAL_TYPES.some((dm) => dm.key === m.key);
          const isOpen = expandedMeals.has(m.key);
          return (
            <Collapsible key={m.key} open={isOpen} onOpenChange={(open) => {
              setExpandedMeals((prev) => {
                const next = new Set(prev);
                if (open) next.add(m.key);
                else next.delete(m.key);
                return next;
              });
            }}>
              <div className="bg-white rounded-2xl shadow-apple-sm overflow-hidden border border-[#E5E5EA]">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 border-b border-[#E5E5EA] cursor-pointer select-none hover:bg-[#F2F2F7]/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={cn("w-4 h-4 text-[#6E6E73] shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                      <span className="text-xl">{m.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold leading-tight text-[#1C1C1E]">{m.label}</p>
                        <p className="text-[11px] text-[#6E6E73]">{Math.round(mealKcal)} kcal · {items.length} itens</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {isCustom && customMeals.some((c) => c.key === m.key) && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#FF3B30] hover:text-[#FF453A] hover:bg-[#FF3B30]/10" onClick={() => removeCustomMeal(m.key)} title="Remover refeição">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {items.length > 0 && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#34C759] hover:text-[#30B350] hover:bg-[#F2F2F7]" onClick={() => saveAsCombo(m.key)} title="Salvar como combo">
                          <BookmarkPlus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[#34C759] hover:text-[#30B350] hover:bg-[#F2F2F7]"
                        onClick={() => { setAddMeal(m.key); setAddOpen(true); }}>
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {items.length > 0 && (
                    <div className="divide-y divide-[#E5E5EA]">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[#F2F2F7]/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-[#1C1C1E]">{it.item_name}</p>
                            <p className="text-[11px] text-[#6E6E73]">
                              {it.quantity}{it.unit} · {Math.round(Number(it.energy_kcal))} kcal · P:{Number(it.protein_g).toFixed(1)} C:{Number(it.carbs_g).toFixed(1)} G:{Number(it.fat_g).toFixed(1)}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[#FF3B30] hover:text-[#FF453A] hover:bg-[#FF3B30]/10" onClick={() => removeEntry(it.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {/* Add custom meal */}
        <Button
          variant="outline"
          onClick={addCustomMeal}
          className="w-full border-dashed border-[#D1D1D6] bg-white/40 text-[#34C759] hover:bg-[#F2F2F7] hover:text-[#30B350] hover:border-[#34C759]/50"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar refeição
        </Button>

        {/* Water */}
        <div className="bg-white rounded-2xl shadow-apple-sm p-4 border border-[#E5E5EA]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                <Droplet className="w-5 h-5 text-[#007AFF]" />
              </div>
              <div>
                <p className="font-bold leading-tight text-[#1C1C1E]">Contador de Água</p>
                <p className="text-[11px] text-[#6E6E73]">{water} / {goals.water_ml} ml</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => updateWater(water - 250)}
                className="border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7] hover:text-[#34C759]">-250</Button>
              <Button size="sm" onClick={() => updateWater(water + 250)}
                className="bg-[#34C759] text-white hover:bg-[#30B350]">+250</Button>
            </div>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{ width: `${Math.min(100, (water / goals.water_ml) * 100)}%`, background: "linear-gradient(90deg, #007AFF, #5AC8FA)" }}
            />
          </div>
        </div>
      </div>

      <AddFoodDialog open={addOpen} onOpenChange={setAddOpen} mealType={addMeal} mealLabel={findMealLabel(addMeal)} dateISO={date} onAdd={addEntries} />
      <GoalsDialog open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSave={saveGoals} />
      <MacroCalcDialog open={calcOpen} onOpenChange={setCalcOpen} currentWater={goals.water_ml} onApply={saveGoals} />
    </div>
  );
}
