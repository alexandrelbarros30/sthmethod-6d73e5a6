import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Plus, Search, Trash2, Droplet, BookmarkPlus, ChevronLeft, ChevronRight, Settings, Loader2, X, ChevronDown, Calculator } from "lucide-react";
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
    const { data, error } = await supabase
      .from("free_leads")
      .insert({ full_name: name.trim(), email: email.trim(), phone: phone.replace(/\D/g, "") })
      .select("id")
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("Erro ao registrar. Tente novamente.");
      return;
    }
    localDiary.setLead({ id: data.id, full_name: name.trim(), email: email.trim(), phone });
    onDone();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="sth-glass w-full max-w-md p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-icon mb-2">
            <Droplet className="w-7 h-7 text-[hsl(150,95%,45%)]" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Diário Alimentar STH METHOD</h1>
          <p className="text-sm text-[hsl(150,8%,55%)]">
            Acesso liberado em segundos. Preencha para começar a registrar suas refeições.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            className="bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground placeholder:text-[hsl(150,8%,45%)]" />
          <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150}
            className="bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground placeholder:text-[hsl(150,8%,45%)]" />
          <Input placeholder="WhatsApp (somente números)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20}
            className="bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground placeholder:text-[hsl(150,8%,45%)]" />
          <Button type="submit" className="w-full premium-btn bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Acessar Diário
          </Button>
        </form>
        <p className="text-[11px] text-center text-[hsl(150,8%,45%)]">
          Já é aluno? <Link to="/login" className="underline text-[hsl(150,95%,45%)]">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Add Food Dialog ---------------- */
function AddFoodDialog({
  open, onOpenChange, mealType, mealLabel, onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mealType: string;
  mealLabel: string;
  onAdd: (entries: Omit<DiaryEntry, "id" | "user_id" | "log_date" | "created_at">[]) => void;
}) {
  const [tab, setTab] = useState<"alimento" | "salvas">("alimento");
  const [search, setSearch] = useState("");
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);

  useEffect(() => {
    if (!open) { setSearch(""); setSelectedFood(null); setQuantity(100); setUnit("g"); }
    else { setSavedMeals(localDiary.getSavedMeals()); }
  }, [open]);

  useEffect(() => {
    if (!search.trim() || tab !== "alimento") { setFoods([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${search.trim()}%`)
        .order("name")
        .limit(50);
      setFoods(data || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search, tab]);

  const ratio = selectedFood ? quantity / 100 : 1;

  const confirmFood = () => {
    if (!selectedFood) return;
    const label = mealLabel;
    onAdd([{
      meal_type: mealType,
      meal_label: label,
      food_id: selectedFood.id,
      item_name: selectedFood.name,
      quantity,
      unit,
      energy_kcal: +(selectedFood.energy_kcal * ratio).toFixed(1),
      protein_g: +(selectedFood.protein_g * ratio).toFixed(2),
      carbs_g: +(selectedFood.carbs_g * ratio).toFixed(2),
      fat_g: +(selectedFood.fat_g * ratio).toFixed(2),
      fiber_g: +((selectedFood.fiber_g || 0) * ratio).toFixed(2),
      sodium_mg: +((selectedFood.sodium_mg || 0) * ratio).toFixed(1),
      sort_order: 0,
    }]);
    setSelectedFood(null);
    setQuantity(100);
  };

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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col bg-[hsl(155,25%,5%)] border-[hsl(150,18%,14%)] text-foreground">
        <DialogHeader>
          <DialogTitle className="gradient-text">{mealLabel}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 bg-[hsl(155,18%,8%)] border border-[hsl(150,18%,14%)]">
            <TabsTrigger value="alimento" className="data-[state=active]:bg-[hsl(150,60%,18%)] data-[state=active]:text-[hsl(150,95%,80%)]">Alimento</TabsTrigger>
            <TabsTrigger value="salvas" className="data-[state=active]:bg-[hsl(150,60%,18%)] data-[state=active]:text-[hsl(150,95%,80%)]">Refeições Salvas</TabsTrigger>
          </TabsList>

          <TabsContent value="alimento" className="flex-1 flex flex-col min-h-0 mt-3 space-y-3">
            {selectedFood ? (
              <div className="sth-glass p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate text-foreground">{selectedFood.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 border-[hsl(150,18%,14%)] text-[hsl(150,8%,55%)]">{selectedFood.source} · {selectedFood.category}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFood(null)} className="text-[hsl(150,95%,45%)] hover:text-[hsl(150,95%,60%)]">Trocar</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} className="w-24 h-8 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)]" min={1} />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-24 h-8 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[hsl(155,25%,6%)] border-[hsl(150,18%,14%)]">
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="unidade">unidade</SelectItem>
                      <SelectItem value="porção">porção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] p-2 text-center">
                    <p className="text-[hsl(150,8%,55%)]">kcal</p>
                    <p className="font-bold text-sm text-[hsl(150,95%,45%)]">{(selectedFood.energy_kcal * ratio).toFixed(0)}</p>
                  </div>
                  <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] p-2 text-center">
                    <p className="text-[hsl(150,8%,55%)]">P</p>
                    <p className="font-bold text-sm text-[hsl(190,100%,50%)]">{(selectedFood.protein_g * ratio).toFixed(1)}g</p>
                  </div>
                  <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] p-2 text-center">
                    <p className="text-[hsl(150,8%,55%)]">C</p>
                    <p className="font-bold text-sm text-[hsl(35,92%,52%)]">{(selectedFood.carbs_g * ratio).toFixed(1)}g</p>
                  </div>
                  <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] p-2 text-center">
                    <p className="text-[hsl(150,8%,55%)]">G</p>
                    <p className="font-bold text-sm text-[hsl(25,85%,55%)]">{(selectedFood.fat_g * ratio).toFixed(1)}g</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={confirmFood} className="w-full premium-btn bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar à refeição
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(150,8%,45%)]" />
                  <Input
                    placeholder="Buscar alimento (ex: laranja, frango...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground placeholder:text-[hsl(150,8%,45%)]"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto border border-[hsl(150,18%,14%)] rounded-xl divide-y divide-[hsl(150,18%,14%)] min-h-[200px] bg-[hsl(155,22%,6%)]">
                  {loading && <div className="p-6 text-center text-sm text-[hsl(150,8%,55%)]"><Loader2 className="w-4 h-4 inline animate-spin mr-2 text-[hsl(150,95%,45%)]" />Buscando...</div>}
                  {!loading && !search.trim() && <p className="p-6 text-center text-sm text-[hsl(150,8%,45%)]">Digite para buscar entre 30.000+ alimentos</p>}
                  {!loading && search.trim() && foods.length === 0 && <p className="p-6 text-center text-sm text-[hsl(150,8%,45%)]">Nada encontrado.</p>}
                  {foods.map((f) => (
                    <button key={f.id} onClick={() => setSelectedFood(f)} className="w-full text-left px-3 py-2.5 hover:bg-[hsl(150,25%,10%)] transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{f.name}</p>
                          <p className="text-[11px] text-[hsl(150,8%,55%)]">
                            100{f.serving_unit} · {Math.round(f.energy_kcal)} kcal · P:{f.protein_g}g C:{f.carbs_g}g G:{f.fat_g}g
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-[hsl(150,18%,14%)] text-[hsl(150,95%,45%)]">{f.source}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="salvas" className="flex-1 overflow-y-auto mt-3 border border-[hsl(150,18%,14%)] rounded-xl divide-y divide-[hsl(150,18%,14%)] min-h-[200px] bg-[hsl(155,22%,6%)]">
            {savedMeals.length === 0 ? (
              <p className="p-6 text-center text-sm text-[hsl(150,8%,55%)]">Nenhuma refeição salva ainda.<br/>Monte uma refeição e clique em "Salvar como combo".</p>
            ) : savedMeals.map((sm) => (
              <div key={sm.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-[hsl(150,25%,10%)] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{sm.name}</p>
                  <p className="text-[11px] text-[hsl(150,8%,55%)]">
                    {Math.round(sm.total_kcal)} kcal · {sm.items.length} itens
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { localDiary.removeSavedMeal(sm.id); setSavedMeals(localDiary.getSavedMeals()); }} className="text-[hsl(0,65%,52%)] hover:text-[hsl(0,65%,60%)]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => addSavedMeal(sm)} className="bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]">Adicionar</Button>
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
      <DialogContent className="max-w-sm bg-[hsl(155,25%,5%)] border-[hsl(150,18%,14%)] text-foreground">
        <DialogHeader><DialogTitle className="gradient-text">Minhas Metas Diárias</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {([
            ["daily_kcal", "Calorias (kcal)"],
            ["protein_g", "Proteína (g)"],
            ["carbs_g", "Carboidrato (g)"],
            ["fat_g", "Gordura (g)"],
            ["water_ml", "Água (ml)"],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <label className="text-sm text-[hsl(150,12%,88%)]">{label}</label>
              <Input type="number" className="w-28 h-8 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground" value={(g as any)[k]} onChange={(e) => setG({ ...g, [k]: Number(e.target.value) || 0 })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(g); onOpenChange(false); }} className="premium-btn bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]">Salvar</Button>
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

  const inputCls = "h-9 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground";
  const triggerCls = "h-9 bg-[hsl(155,18%,8%)] border-[hsl(150,18%,14%)] text-foreground";
  const contentCls = "bg-[hsl(155,25%,6%)] border-[hsl(150,18%,14%)]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[hsl(155,25%,5%)] border-[hsl(150,18%,14%)] text-foreground">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Calcular Macros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[hsl(150,8%,55%)]">Sexo</label>
              <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                <SelectContent className={contentCls}>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[hsl(150,8%,55%)]">Idade</label>
              <Input type="number" className={inputCls} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-[hsl(150,8%,55%)]">Peso (kg)</label>
              <Input type="number" className={inputCls} value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-[hsl(150,8%,55%)]">Altura (cm)</label>
              <Input type="number" className={inputCls} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[hsl(150,8%,55%)]">Nível de atividade no dia (NEAT)</label>
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
            <label className="text-xs text-[hsl(150,8%,55%)]">Treino</label>
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
                <label className="text-xs text-[hsl(150,8%,55%)]">Dias/sem</label>
                <Input type="number" className={inputCls} value={trainDays} onChange={(e) => setTrainDays(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[hsl(150,8%,55%)]">Min/sessão</label>
                <Input type="number" className={inputCls} value={trainMin} onChange={(e) => setTrainMin(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[hsl(150,8%,55%)]">Intensidade</label>
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
            <input id="cardio-toggle" type="checkbox" checked={doesCardio} onChange={(e) => setDoesCardio(e.target.checked)} className="accent-[hsl(150,95%,45%)]" />
            <label htmlFor="cardio-toggle" className="text-sm text-[hsl(150,12%,88%)]">Faço cardio</label>
          </div>

          {doesCardio && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[hsl(150,8%,55%)]">Dias/sem</label>
                <Input type="number" className={inputCls} value={cardioDays} onChange={(e) => setCardioDays(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[hsl(150,8%,55%)]">Min/sessão</label>
                <Input type="number" className={inputCls} value={cardioMin} onChange={(e) => setCardioMin(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-[hsl(150,8%,55%)]">Intensidade</label>
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
            <label className="text-xs text-[hsl(150,8%,55%)]">Objetivo</label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="perder_gordura">Perder gordura (-500 kcal)</SelectItem>
                <SelectItem value="manter_peso">Manter peso</SelectItem>
                <SelectItem value="hipertrofia">Hipertrofia (+350 kcal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sth-glass p-3 mt-2">
            <p className="text-xs text-[hsl(150,8%,55%)] mb-2">Resultado</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(150,95%,45%/0.25)] p-2">
                <div className="font-bold text-[hsl(150,95%,45%)] text-sm tabular-nums">{result.dailyCalories}</div>
                <div className="text-[hsl(150,8%,55%)] mt-0.5">kcal</div>
              </div>
              <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(190,100%,50%/0.25)] p-2">
                <div className="font-bold text-[hsl(190,100%,50%)] text-sm tabular-nums">{result.proteinG}g</div>
                <div className="text-[hsl(150,8%,55%)] mt-0.5">Proteína</div>
              </div>
              <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(35,92%,52%/0.25)] p-2">
                <div className="font-bold text-[hsl(35,92%,52%)] text-sm tabular-nums">{result.carbsG}g</div>
                <div className="text-[hsl(150,8%,55%)] mt-0.5">Carbo</div>
              </div>
              <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(25,85%,55%/0.25)] p-2">
                <div className="font-bold text-[hsl(25,85%,55%)] text-sm tabular-nums">{result.fatG}g</div>
                <div className="text-[hsl(150,8%,55%)] mt-0.5">Gord</div>
              </div>
            </div>
            <p className="text-[10px] text-[hsl(150,8%,45%)] mt-2">TDEE: {result.tdee} kcal · TMB: {result.bmr} kcal · Água sugerida: {Math.round(weight * 35)} ml</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={apply} className="w-full premium-btn bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]">
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
    <div className="min-h-screen bg-black theme-sth-green">
      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">Diário Alimentar</h1>
            <p className="text-xs text-[hsl(150,8%,55%)]">
              {dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCalcOpen(true)}
              className="border-[hsl(150,18%,14%)] bg-[hsl(155,22%,6%)] text-[hsl(150,95%,45%)] hover:bg-[hsl(150,25%,10%)] hover:text-[hsl(150,95%,60%)]">
              <Calculator className="w-4 h-4 mr-1" /> Calcular
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGoalsOpen(true)}
              className="border-[hsl(150,18%,14%)] bg-[hsl(155,22%,6%)] text-[hsl(150,12%,88%)] hover:bg-[hsl(150,25%,10%)] hover:text-[hsl(150,95%,45%)]">
              <Settings className="w-4 h-4 mr-1" /> Metas
            </Button>
          </div>
        </div>

        {/* Week strip */}
        <div className="sth-glass p-3">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[hsl(150,12%,88%)] hover:text-[hsl(150,95%,45%)] hover:bg-[hsl(150,25%,10%)]" onClick={() => {
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
                        ? "bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] font-bold shadow-[0_0_12px_hsl(150,95%,45%/0.5)]"
                        : isToday
                          ? "bg-[hsl(150,60%,18%)] text-[hsl(150,95%,80%)]"
                          : "hover:bg-[hsl(150,25%,10%)] text-[hsl(150,12%,88%)]"
                    )}>
                    <span className={isSel ? "opacity-80" : "opacity-60"}>{DOW[d.getDay()]}</span>
                    <span className="font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-[hsl(150,12%,88%)] hover:text-[hsl(150,95%,45%)] hover:bg-[hsl(150,25%,10%)]" onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 7); setDate(d.toISOString().slice(0, 10));
            }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Calorie summary */}
        <div className="sth-glass p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(150,8%,55%)]">Calorias Restantes</span>
            <span className="font-bold tabular-nums text-[hsl(150,12%,88%)]">{Math.round(remaining)} / {goals.daily_kcal}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-[hsl(150,8%,55%)]">Calorias Consumidas</span>
            <span className="font-bold tabular-nums text-[hsl(150,95%,45%)]">{Math.round(totals.kcal)}</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] overflow-hidden">
            <div
              className="h-full neon-progress-fill transition-all"
              style={{ width: `${consumedPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(190,100%,50%/0.25)] p-2.5">
              <div className="font-bold tabular-nums text-[hsl(190,100%,50%)] text-sm">{Math.round(totals.p)}g</div>
              <div className="text-[hsl(150,8%,55%)] mt-0.5">Proteína / {goals.protein_g}g</div>
            </div>
            <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(35,92%,52%/0.25)] p-2.5">
              <div className="font-bold tabular-nums text-[hsl(35,92%,52%)] text-sm">{Math.round(totals.c)}g</div>
              <div className="text-[hsl(150,8%,55%)] mt-0.5">Carbo / {goals.carbs_g}g</div>
            </div>
            <div className="rounded-xl bg-[hsl(155,22%,6%)] border border-[hsl(25,85%,55%/0.25)] p-2.5">
              <div className="font-bold tabular-nums text-[hsl(25,85%,55%)] text-sm">{Math.round(totals.f)}g</div>
              <div className="text-[hsl(150,8%,55%)] mt-0.5">Gord / {goals.fat_g}g</div>
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
              <div className="sth-glass overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 border-b border-[hsl(150,18%,14%)] cursor-pointer select-none hover:bg-[hsl(150,25%,10%)]/30 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={cn("w-4 h-4 text-[hsl(150,8%,55%)] shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                      <span className="text-xl">{m.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold leading-tight text-[hsl(150,12%,88%)]">{m.label}</p>
                        <p className="text-[11px] text-[hsl(150,8%,55%)]">{Math.round(mealKcal)} kcal · {items.length} itens</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {isCustom && customMeals.some((c) => c.key === m.key) && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[hsl(0,65%,52%)] hover:text-[hsl(0,65%,60%)] hover:bg-[hsl(150,25%,10%)]" onClick={() => removeCustomMeal(m.key)} title="Remover refeição">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {items.length > 0 && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[hsl(150,95%,45%)] hover:text-[hsl(150,95%,60%)] hover:bg-[hsl(150,25%,10%)]" onClick={() => saveAsCombo(m.key)} title="Salvar como combo">
                          <BookmarkPlus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[hsl(150,95%,45%)] hover:text-[hsl(150,95%,60%)] hover:bg-[hsl(150,25%,10%)]"
                        onClick={() => { setAddMeal(m.key); setAddOpen(true); }}>
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {items.length > 0 && (
                    <div className="divide-y divide-[hsl(150,18%,14%)]">
                      {items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[hsl(150,25%,10%)]/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-[hsl(150,12%,88%)]">{it.item_name}</p>
                            <p className="text-[11px] text-[hsl(150,8%,55%)]">
                              {it.quantity}{it.unit} · {Math.round(Number(it.energy_kcal))} kcal · P:{Number(it.protein_g).toFixed(1)} C:{Number(it.carbs_g).toFixed(1)} G:{Number(it.fat_g).toFixed(1)}
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[hsl(0,65%,52%)] hover:text-[hsl(0,65%,60%)] hover:bg-[hsl(0,65%,52%)]/10" onClick={() => removeEntry(it.id)}>
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
          className="w-full border-dashed border-[hsl(150,18%,20%)] bg-[hsl(155,22%,6%)]/40 text-[hsl(150,95%,45%)] hover:bg-[hsl(150,25%,10%)] hover:text-[hsl(150,95%,60%)] hover:border-[hsl(150,95%,45%/0.5)]"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar refeição
        </Button>

        {/* Water */}
        <div className="sth-glass p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-icon flex items-center justify-center">
                <Droplet className="w-5 h-5 text-[hsl(190,100%,50%)]" />
              </div>
              <div>
                <p className="font-bold leading-tight text-[hsl(150,12%,88%)]">Contador de Água</p>
                <p className="text-[11px] text-[hsl(150,8%,55%)]">{water} / {goals.water_ml} ml</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => updateWater(water - 250)}
                className="border-[hsl(150,18%,14%)] bg-[hsl(155,22%,6%)] text-[hsl(150,12%,88%)] hover:bg-[hsl(150,25%,10%)] hover:text-[hsl(150,95%,45%)]">-250</Button>
              <Button size="sm" onClick={() => updateWater(water + 250)}
                className="bg-[hsl(150,95%,45%)] text-[hsl(155,60%,6%)] hover:bg-[hsl(150,95%,50%)]">+250</Button>
            </div>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-[hsl(155,22%,6%)] border border-[hsl(150,18%,14%)] overflow-hidden">
            <div
              className="h-full neon-progress-fill transition-all"
              style={{ width: `${Math.min(100, (water / goals.water_ml) * 100)}%`, background: "linear-gradient(90deg, hsl(190 100% 50% / 0.85), hsl(190 100% 50%))", boxShadow: "0 0 8px hsl(190 100% 50% / 0.8), 0 0 16px hsl(190 100% 50% / 0.5), inset 0 0 6px rgb(255 255 255 / 0.4)" }}
            />
          </div>
        </div>
      </div>

      <AddFoodDialog open={addOpen} onOpenChange={setAddOpen} mealType={addMeal} mealLabel={findMealLabel(addMeal)} onAdd={addEntries} />
      <GoalsDialog open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSave={saveGoals} />
      <MacroCalcDialog open={calcOpen} onOpenChange={setCalcOpen} currentWater={goals.water_ml} onApply={saveGoals} />
    </div>
  );
}
