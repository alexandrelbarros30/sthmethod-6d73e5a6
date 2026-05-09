import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Droplet, BookmarkPlus, ChevronLeft, ChevronRight, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { localDiary, MEAL_TYPES, DEFAULT_GOALS, type DiaryEntry, type SavedMeal, type Goals } from "@/lib/food-diary-storage";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Diário Alimentar STH METHOD</h1>
          <p className="text-sm text-muted-foreground">
            Acesso liberado em segundos. Preencha para começar a registrar suas refeições.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} />
          <Input placeholder="WhatsApp (somente números)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Acessar Diário
          </Button>
        </form>
        <p className="text-[11px] text-center text-muted-foreground">
          Já é aluno? <Link to="/login" className="underline">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}

/* ---------------- Add Food Dialog ---------------- */
function AddFoodDialog({
  open, onOpenChange, mealType, onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mealType: string;
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
    const label = MEAL_TYPES.find((m) => m.key === mealType)?.label || "";
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
    const label = MEAL_TYPES.find((m) => m.key === mealType)?.label || "";
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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{MEAL_TYPES.find((m) => m.key === mealType)?.label}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="alimento">Alimento</TabsTrigger>
            <TabsTrigger value="salvas">Refeições Salvas</TabsTrigger>
          </TabsList>

          <TabsContent value="alimento" className="flex-1 flex flex-col min-h-0 mt-3 space-y-3">
            {selectedFood ? (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedFood.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{selectedFood.source} · {selectedFood.category}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFood(null)}>Trocar</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} className="w-24 h-8" min={1} />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="unidade">unidade</SelectItem>
                      <SelectItem value="porção">porção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-muted/40 rounded p-2 text-center">
                    <p className="text-muted-foreground">kcal</p>
                    <p className="font-bold text-sm">{(selectedFood.energy_kcal * ratio).toFixed(0)}</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2 text-center">
                    <p className="text-muted-foreground">P</p>
                    <p className="font-bold text-sm">{(selectedFood.protein_g * ratio).toFixed(1)}g</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2 text-center">
                    <p className="text-muted-foreground">C</p>
                    <p className="font-bold text-sm">{(selectedFood.carbs_g * ratio).toFixed(1)}g</p>
                  </div>
                  <div className="bg-muted/40 rounded p-2 text-center">
                    <p className="text-muted-foreground">G</p>
                    <p className="font-bold text-sm">{(selectedFood.fat_g * ratio).toFixed(1)}g</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={confirmFood} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Adicionar à refeição
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimento (ex: laranja, frango...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-[200px]">
                  {loading && <div className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 inline animate-spin mr-2" />Buscando...</div>}
                  {!loading && !search.trim() && <p className="p-6 text-center text-sm text-muted-foreground">Digite para buscar entre 30.000+ alimentos</p>}
                  {!loading && search.trim() && foods.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>}
                  {foods.map((f) => (
                    <button key={f.id} onClick={() => setSelectedFood(f)} className="w-full text-left px-3 py-2.5 hover:bg-accent/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            100{f.serving_unit} · {Math.round(f.energy_kcal)} kcal · P:{f.protein_g}g C:{f.carbs_g}g G:{f.fat_g}g
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{f.source}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="salvas" className="flex-1 overflow-y-auto mt-3 border rounded-lg divide-y min-h-[200px]">
            {savedMeals.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma refeição salva ainda.<br/>Monte uma refeição e clique em "Salvar como combo".</p>
            ) : savedMeals.map((sm) => (
              <div key={sm.id} className="flex items-center justify-between px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{sm.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(sm.total_kcal)} kcal · {sm.items.length} itens
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { localDiary.removeSavedMeal(sm.id); setSavedMeals(localDiary.getSavedMeals()); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => addSavedMeal(sm)}>Adicionar</Button>
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
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Minhas Metas Diárias</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {([
            ["daily_kcal", "Calorias (kcal)"],
            ["protein_g", "Proteína (g)"],
            ["carbs_g", "Carboidrato (g)"],
            ["fat_g", "Gordura (g)"],
            ["water_ml", "Água (ml)"],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <label className="text-sm">{label}</label>
              <Input type="number" className="w-28 h-8" value={(g as any)[k]} onChange={(e) => setG({ ...g, [k]: Number(e.target.value) || 0 })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(g); onOpenChange(false); }}>Salvar</Button>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diário Alimentar</h1>
            <p className="text-xs text-muted-foreground">
              {dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setGoalsOpen(true)}>
            <Settings className="w-4 h-4 mr-1" /> Metas
          </Button>
        </div>

        {/* Week strip */}
        <Card className="p-3">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() - 7); setDate(d.toISOString().slice(0, 10));
            }}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="grid grid-cols-7 flex-1 gap-1">
              {week.map((d) => {
                const iso = d.toISOString().slice(0, 10);
                const isSel = iso === date;
                const isToday = iso === todayISO();
                return (
                  <button key={iso} onClick={() => setDate(iso)}
                    className={`flex flex-col items-center py-1.5 rounded-lg text-xs ${
                      isSel ? "bg-primary text-primary-foreground" : isToday ? "bg-accent" : "hover:bg-accent/50"
                    }`}>
                    <span className="opacity-70">{DOW[d.getDay()]}</span>
                    <span className="font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
              const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + 7); setDate(d.toISOString().slice(0, 10));
            }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </Card>

        {/* Calorie summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Calorias Restantes</span>
            <span className="font-bold tabular-nums">{Math.round(remaining)} / {goals.daily_kcal}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Calorias Consumidas</span>
            <span className="font-bold tabular-nums text-primary">{Math.round(totals.kcal)}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${consumedPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
            <div className="rounded-lg bg-info/10 p-2">
              <div className="text-info font-bold tabular-nums">{Math.round(totals.p)}g</div>
              <div className="text-muted-foreground">Proteína / {goals.protein_g}g</div>
            </div>
            <div className="rounded-lg bg-warning/10 p-2">
              <div className="text-warning font-bold tabular-nums">{Math.round(totals.c)}g</div>
              <div className="text-muted-foreground">Carbo / {goals.carbs_g}g</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: "hsl(25 85% 55% / 0.1)" }}>
              <div className="font-bold tabular-nums" style={{ color: "hsl(25 85% 55%)" }}>{Math.round(totals.f)}g</div>
              <div className="text-muted-foreground">Gord / {goals.fat_g}g</div>
            </div>
          </div>
        </Card>

        {/* Meals */}
        {MEAL_TYPES.map((m) => {
          const items = groupByMeal(m.key);
          const mealKcal = items.reduce((a, i) => a + Number(i.energy_kcal), 0);
          return (
            <Card key={m.key} className="overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{m.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground">{Math.round(mealKcal)} kcal · {items.length} itens</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveAsCombo(m.key)} title="Salvar como combo">
                      <BookmarkPlus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary"
                    onClick={() => { setAddMeal(m.key); setAddOpen(true); }}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {items.length > 0 && (
                <div className="divide-y">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{it.item_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {it.quantity}{it.unit} · {Math.round(Number(it.energy_kcal))} kcal · P:{Number(it.protein_g).toFixed(1)} C:{Number(it.carbs_g).toFixed(1)} G:{Number(it.fat_g).toFixed(1)}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeEntry(it.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        {/* Water */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-info" />
              <div>
                <p className="font-bold leading-tight">Contador de Água</p>
                <p className="text-[11px] text-muted-foreground">{water} / {goals.water_ml} ml</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => updateWater(water - 250)}>-250</Button>
              <Button size="sm" onClick={() => updateWater(water + 250)}>+250</Button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-info transition-all" style={{ width: `${Math.min(100, (water / goals.water_ml) * 100)}%` }} />
          </div>
        </Card>
      </div>

      <AddFoodDialog open={addOpen} onOpenChange={setAddOpen} mealType={addMeal} onAdd={addEntries} />
      <GoalsDialog open={goalsOpen} onOpenChange={setGoalsOpen} goals={goals} onSave={saveGoals} />
    </div>
  );
}