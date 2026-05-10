import { useState, useRef, useEffect } from "react";
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

  const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const q = normalize(search);
  const filtered = foods
    .filter((f: any) => {
      const matchCat = category === "Todos" || f.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return normalize(f.name).includes(q);
    })
    .map((f: any) => {
      const name = normalize(f.name);
      let score = 999;
      if (q) {
        const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const wholeWordStart = new RegExp(`^${esc}([\\s,\\-/]|$)`).test(name);
        const wholeWordAny = new RegExp(`(^|[\\s,\\-/])${esc}([\\s,\\-/]|$)`).test(name);
        const wordBoundaryStart = new RegExp(`(^|[\\s,\\-/])${esc}`).test(name);
        if (name === q) score = 0;
        else if (wholeWordStart) score = 1;
        else if (wholeWordAny) score = 2;
        else if (name.startsWith(q)) score = 3;
        else if (wordBoundaryStart) score = 4;
        else score = 5;
      }
      return { f, score, name };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.name.length !== b.name.length) return a.name.length - b.name.length;
      return a.name.localeCompare(b.name);
    })
    .map((x) => x.f);

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
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate font-body">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.energy_kcal} kcal • P:{food.protein_g}g • C:{food.carbs_g}g • G:{food.fat_g}g
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{food.source}</Badge>
                </button>
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
              Adicionar e concluir refeição
            </Button>
          </DialogFooter>
        )}

        {!selectedFood && addedCount > 0 && (
          <DialogFooter className="mt-2 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Concluir refeição ({addedCount} {addedCount > 1 ? "itens" : "item"})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FoodSearchDialog;
