import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (food: any, quantityGrams: number, unit: "g" | "ml") => void;
}

const CATEGORIES = [
  "Todos",
  "Cereais",
  "Carnes",
  "Peixes",
  "Laticínios",
  "Leguminosas",
  "Frutas",
  "Verduras",
  "Oleaginosas",
  "Óleos",
  "Outros",
];

type Measure = { label: string; grams: number; unit?: "g" | "ml" };
const GENERIC_MEASURES: Measure[] = [
  { label: "1 colher de chá (5g)", grams: 5 },
  { label: "1 colher de sobremesa (10g)", grams: 10 },
  { label: "1 colher de sopa (15g)", grams: 15 },
  { label: "1 xícara (240g)", grams: 240 },
  { label: "1 copo (200ml)", grams: 200, unit: "ml" },
  { label: "1 unidade pequena (50g)", grams: 50 },
  { label: "1 unidade média (100g)", grams: 100 },
  { label: "1 unidade grande (150g)", grams: 150 },
];

function getMeasuresForFood(food: any): Measure[] {
  const n = (food?.name || "").toLowerCase();
  const cat = (food?.category || "").toLowerCase();
  const list: Measure[] = [];
  if (/whey|prote[ií]na|albumina|caseina|caseína|hipercal[oó]rico|bcaa|cre?atina|colla?gen|colá?geno/i.test(n)) {
    list.push({ label: "1 scoop (30g)", grams: 30 });
    list.push({ label: "1 scoop (40g)", grams: 40 });
    list.push({ label: "1 scoop (50g)", grams: 50 });
  }
  if (/p[aã]o de forma|sliced bread|toast/i.test(n)) {
    list.push({ label: "1 fatia (25g)", grams: 25 });
    list.push({ label: "2 fatias (50g)", grams: 50 });
  }
  if (/p[aã]o franc[eê]s|baguete|pão de sal/i.test(n)) {
    list.push({ label: "1 unidade (50g)", grams: 50 });
  }
  if (/p[aã]o|bolo|cake|bread/i.test(n) && !/forma|franc[eê]s|baguete/i.test(n)) {
    list.push({ label: "1 fatia (40g)", grams: 40 });
  }
  if (/banana/i.test(n)) list.push({ label: "1 unidade média (100g)", grams: 100 });
  if (/ma[cç][aã]|apple/i.test(n)) list.push({ label: "1 unidade (130g)", grams: 130 });
  if (/laranja|orange/i.test(n)) list.push({ label: "1 unidade (180g)", grams: 180 });
  if (/mam[aã]o|papaya/i.test(n)) list.push({ label: "1 fatia (170g)", grams: 170 });
  if (/abacaxi|pineapple/i.test(n)) list.push({ label: "1 fatia (75g)", grams: 75 });
  if (/morango|strawberry/i.test(n)) list.push({ label: "1 unidade (12g)", grams: 12 });
  if (/\bovo\b|\begg\b/i.test(n)) {
    list.push({ label: "1 unidade (50g)", grams: 50 });
    list.push({ label: "1 clara (33g)", grams: 33 });
    list.push({ label: "1 gema (17g)", grams: 17 });
  }
  if (/arroz|rice/i.test(n)) {
    list.push({ label: "1 colher de servir (45g)", grams: 45 });
    list.push({ label: "1 escumadeira (100g)", grams: 100 });
  }
  if (/feij[aã]o|bean/i.test(n)) {
    list.push({ label: "1 concha (140g)", grams: 140 });
  }
  if (/macarr[aã]o|massa|pasta|spaghetti|penne/i.test(n)) {
    list.push({ label: "1 escumadeira (100g)", grams: 100 });
  }
  if (/file?[ée]|peito|fil[eé]t|steak|frango|chicken|carne|beef|patinho|alcatra|coxa|sobrecoxa/i.test(n)) {
    list.push({ label: "1 filé pequeno (100g)", grams: 100 });
    list.push({ label: "1 filé médio (150g)", grams: 150 });
    list.push({ label: "1 bife (120g)", grams: 120 });
  }
  if (/leite|milk|iogurte|yogurt|bebida l[aá]ctea/i.test(n)) {
    list.push({ label: "1 copo (200ml)", grams: 200, unit: "ml" });
    list.push({ label: "1 xícara (240ml)", grams: 240, unit: "ml" });
    list.push({ label: "1 pote (170g)", grams: 170 });
  }
  if (/queijo|cheese|mussarela|prato|minas|ricota/i.test(n)) {
    list.push({ label: "1 fatia (20g)", grams: 20 });
  }
  if (/[oó]leo|azeite|oil/i.test(n) || cat.includes("óleos") || cat.includes("oils")) {
    list.push({ label: "1 colher de chá (5ml)", grams: 5, unit: "ml" });
    list.push({ label: "1 colher de sopa (15ml)", grams: 15, unit: "ml" });
    list.push({ label: "1 fio (3ml)", grams: 3, unit: "ml" });
  }
  if (/castanha|am[eê]ndoa|nozes|nuts|amendoim|peanut|pistache/i.test(n) || cat.includes("oleaginosas") || cat.includes("nut")) {
    list.push({ label: "1 punhado (30g)", grams: 30 });
    list.push({ label: "1 colher de sopa (10g)", grams: 10 });
  }
  if (/pasta de amendoim|peanut butter|mel\b|honey|geleia|jam/i.test(n)) {
    list.push({ label: "1 colher de sopa (15g)", grams: 15 });
    list.push({ label: "1 colher de sobremesa (10g)", grams: 10 });
  }
  if (/tapioca/i.test(n)) {
    list.push({ label: "1 unidade pequena (50g)", grams: 50 });
    list.push({ label: "1 unidade média (80g)", grams: 80 });
  }
  if (/suco|juice|refrigerante|soda|[aá]gua|water|ch[aá]\b|coffee|caf[eé]/i.test(n)) {
    list.push({ label: "1 copo (200ml)", grams: 200, unit: "ml" });
    list.push({ label: "1 xícara (240ml)", grams: 240, unit: "ml" });
  }
  for (const m of GENERIC_MEASURES) {
    if (!list.find((x) => x.label === m.label)) list.push(m);
  }
  return list;
}

const normalizeText = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const getPrimarySearchName = (name: string) =>
  normalizeText(name)
    .split(",")[0]
    .split("(")[0]
    .trim();

function getFoodSearchScore(food: any, query: string) {
  const name = normalizeText(food.name);
  const primaryName = getPrimarySearchName(food.name);
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

const FoodSearchDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<"g" | "ml">("g");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [addedCount, setAddedCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setAddedCount(0);
  }, [open]);

  const { data: foods = [] } = useQuery({
    queryKey: ["foods-db"],
    queryFn: async () => {
      const { data } = await supabase.from("foods").select("*").order("category").order("name");
      return data || [];
    },
    enabled: open,
  });

  const q = normalizeText(search);
  const filtered = useMemo(() => {
    return foods
      .filter((f: any) => {
        const matchCat = category === "Todos" || f.category === category;
        if (!matchCat) return false;
        if (!q) return true;
        return normalizeText(f.name).includes(q);
      })
      .map((f: any) => {
        const { score, name, primaryName } = getFoodSearchScore(f, q);
        return { f, score, name, primaryName };
      })
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        if (a.primaryName.length !== b.primaryName.length) return a.primaryName.length - b.primaryName.length;
        if (a.name.length !== b.name.length) return a.name.length - b.name.length;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 80)
      .map((x) => x.f);
  }, [foods, category, q]);

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    // Auto-detect unit from serving_unit
    if (food.serving_unit?.toLowerCase().includes("ml")) {
      setUnit("ml");
    } else {
      setUnit("g");
    }
  };

  const handleAdd = () => {
    if (selectedFood) {
      const name = selectedFood.name;
      onSelect(selectedFood, quantity, unit);
      setSelectedFood(null);
      setQuantity(100);
      setSearch("");
      setAddedCount((c) => c + 1);
      toast.success(`${name} adicionado`, { description: "Busque o próximo alimento da refeição." });
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };

  const handleQuickAdd = (food: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const u = food.serving_unit?.toLowerCase().includes("ml") ? "ml" : "g";
    onSelect(food, 100, u);
    setAddedCount((c) => c + 1);
    toast.success(`${food.name} adicionado`, { description: `100${u} • Continue buscando ou conclua a refeição.` });
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleAddAndClose = () => {
    if (selectedFood) {
      onSelect(selectedFood, quantity, unit);
      setSelectedFood(null);
      setQuantity(100);
      onOpenChange(false);
    }
  };

  const ratio = quantity / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display flex items-center gap-2">
            Buscar Alimento — TACO / TBCA
            {addedCount > 0 && (
              <Badge variant="secondary" className="text-[11px]">
                {addedCount} adicionado{addedCount > 1 ? "s" : ""}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Pesquisar alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedFood && addedCount > 0 && (
          <div className="mt-2 shrink-0 rounded-lg border bg-muted/40 px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Refeição em montagem</p>
              <p className="text-xs text-muted-foreground">
                {addedCount} {addedCount > 1 ? "alimentos adicionados" : "alimento adicionado"} • continue buscando ou finalize agora.
              </p>
            </div>
            <Button size="sm" onClick={() => onOpenChange(false)} className="shrink-0">
              Concluir refeição
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mt-2 min-h-0">
        {selectedFood ? (
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium font-body">{selectedFood.name}</p>
                <Badge variant="outline" className="text-xs mt-1">{selectedFood.source} — {selectedFood.category}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFood(null)}>Trocar</Button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Quantidade:</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-24 h-8"
                min={1}
              />
              <Select value={unit} onValueChange={(v) => setUnit(v as "g" | "ml")}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium shrink-0">Medida caseira:</label>
              <Select
                value=""
                onValueChange={(v) => {
                  const measures = getMeasuresForFood(selectedFood);
                  const m = measures.find((x) => x.label === v);
                  if (m) {
                    setQuantity(m.grams);
                    if (m.unit) setUnit(m.unit);
                  }
                }}
              >
                <SelectTrigger className="h-8 flex-1 min-w-[180px]">
                  <SelectValue placeholder="Escolher medida (colher, scoop, fatia...)" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {getMeasuresForFood(selectedFood).map((m) => (
                    <SelectItem key={m.label} value={m.label}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground basis-full">
                Dica: ajuste a gramagem após escolher (ex.: scoop de whey pode ter 30g, 40g ou 50g dependendo da marca).
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2 text-center">
                <p className="text-muted-foreground">Calorias</p>
                <p className="font-bold text-base">{(selectedFood.energy_kcal * ratio).toFixed(0)}</p>
                <p className="text-muted-foreground">kcal</p>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <p className="text-muted-foreground">Proteína</p>
                <p className="font-bold text-base">{(selectedFood.protein_g * ratio).toFixed(1)}</p>
                <p className="text-muted-foreground">g</p>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <p className="text-muted-foreground">Carboidratos</p>
                <p className="font-bold text-base">{(selectedFood.carbs_g * ratio).toFixed(1)}</p>
                <p className="text-muted-foreground">g</p>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <p className="text-muted-foreground">Gordura</p>
                <p className="font-bold text-base">{(selectedFood.fat_g * ratio).toFixed(1)}</p>
                <p className="text-muted-foreground">g</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center"><span className="text-muted-foreground">Fibra:</span> {(selectedFood.fiber_g * ratio).toFixed(1)}g</div>
              <div className="text-center"><span className="text-muted-foreground">Açúcar:</span> {(selectedFood.sugar_g * ratio).toFixed(1)}g</div>
              <div className="text-center"><span className="text-muted-foreground">Sódio:</span> {(selectedFood.sodium_mg * ratio).toFixed(0)}mg</div>
              <div className="text-center"><span className="text-muted-foreground">Colesterol:</span> {(selectedFood.cholesterol_mg * ratio).toFixed(0)}mg</div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum alimento encontrado.</p>
            ) : (
              filtered.map((food: any) => (
                <div
                  key={food.id}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <button
                    onClick={() => handleSelectFood(food)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium truncate font-body">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.energy_kcal} kcal • P:{food.protein_g}g • C:{food.carbs_g}g • G:{food.fat_g}g
                    </p>
                    <Badge variant="outline" className="text-[10px] mt-1">{food.source}</Badge>
                  </button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 rounded-full"
                    onClick={(e) => handleQuickAdd(food, e)}
                    title="Adicionar 100g/ml"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
        </div>

        {selectedFood && (
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2 shrink-0">
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" /> Adicionar e buscar próximo
            </Button>
            <Button variant="outline" onClick={handleAddAndClose} className="w-full sm:w-auto">
              Adicionar e finalizar refeição
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FoodSearchDialog;
