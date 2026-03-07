import { useState, useRef, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileDown, Upload, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MealData, FoodItem } from "./NutritionMealBuilder";
import type { NutritionTotals } from "./NutritionSummaryPanel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: MealData[];
  totals: NutritionTotals | null;
  studentName: string;
  weight: number | null;
  tdee: number | null;
}

function getPrimaryMacro(food: FoodItem): "protein" | "carbs" | "fat" {
  const protCal = food.base_protein_g * 4;
  const carbCal = food.base_carbs_g * 4;
  const fatCal = food.base_fat_g * 9;
  if (protCal >= carbCal && protCal >= fatCal) return "protein";
  if (carbCal >= protCal && carbCal >= fatCal) return "carbs";
  return "fat";
}

function findAlternative(food: FoodItem, allFoods: any[]): { name: string; qty: number; unit: string; kcal: number } | null {
  if (!food.food_id || !food.base_energy_kcal) return null;
  const primaryMacro = getPrimaryMacro(food);
  const targetKcal = food.energy_kcal;
  if (targetKcal <= 0) return null;

  // Find foods in similar category, excluding same food
  let candidates = allFoods.filter((f) => f.id !== food.food_id && f.energy_kcal > 0);

  // Score: how close kcal per 100g and primary macro match
  const scored = candidates.map((c) => {
    const kcalRatio = targetKcal > 0 ? (c.energy_kcal / food.base_energy_kcal) : 1;
    // Quantity to match kcal
    const altQty = Math.round((targetKcal / c.energy_kcal) * 100);
    if (altQty < 5 || altQty > 1000) return null;

    const altRatio = altQty / 100;
    let macroScore = 0;
    if (primaryMacro === "protein") {
      macroScore = Math.abs((c.protein_g * altRatio) - food.protein_g);
    } else if (primaryMacro === "carbs") {
      macroScore = Math.abs((c.carbs_g * altRatio) - food.carbs_g);
    } else {
      macroScore = Math.abs((c.fat_g * altRatio) - food.fat_g);
    }
    const kcalDiff = Math.abs((c.energy_kcal * altRatio) - targetKcal);

    return { food: c, qty: altQty, score: kcalDiff + macroScore * 2 };
  }).filter(Boolean) as { food: any; qty: number; score: number }[];

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];
  if (!best || best.score > targetKcal * 0.5) return null;

  return {
    name: best.food.name,
    qty: best.qty,
    unit: best.food.serving_unit?.includes("ml") ? "ml" : "g",
    kcal: Math.round(best.food.energy_kcal * (best.qty / 100)),
  };
}

const NutritionPdfPreview = ({ open, onOpenChange, meals, totals, studentName, weight, tdee }: Props) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Rotina Alimentar");
  const [headerNote, setHeaderNote] = useState("");
  const [footerNote, setFooterNote] = useState("Observações: Beber no mínimo 2L de água por dia. Seguir horários das refeições.");
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allFoods = [] } = useQuery({
    queryKey: ["foods-db-pdf"],
    queryFn: async () => {
      const { data } = await supabase.from("foods").select("*");
      return data || [];
    },
    enabled: open,
  });

  const alternatives = useMemo(() => {
    if (!showAlternatives || !allFoods.length) return new Map<string, ReturnType<typeof findAlternative>>();
    const map = new Map<string, ReturnType<typeof findAlternative>>();
    meals.forEach((meal) => {
      meal.foods.forEach((food, fi) => {
        const key = `${meal.name}-${fi}`;
        map.set(key, findAlternative(food, allFoods));
      });
    });
    return map;
  }, [meals, allFoods, showAlternatives]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const proteinPerKg = weight && totals ? (totals.protein_g / weight).toFixed(2) : "–";
  const carbsPerKg = weight && totals ? (totals.carbs_g / weight).toFixed(2) : "–";
  const fatPerKg = weight && totals ? (totals.fat_g / weight).toFixed(2) : "–";

  const handleGeneratePdf = useCallback(async () => {
    if (!printRef.current) return;
    setGenerating(true);

    try {
      const content = printRef.current;
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setGenerating(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - ${studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 24px; font-size: 11px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 12px; }
            .header img { max-height: 60px; margin-bottom: 8px; }
            .header h1 { font-size: 18px; font-weight: 700; }
            .header p { font-size: 12px; color: #666; margin-top: 4px; }
            .header-note { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 11px; white-space: pre-wrap; }
            .meal { margin-bottom: 14px; }
            .meal-header { background: #222; color: #fff; padding: 6px 12px; font-weight: 600; font-size: 12px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0f0f0; text-align: left; padding: 4px 8px; font-size: 10px; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 4px 8px; font-size: 10px; border: 1px solid #ddd; }
            .subtotal td { font-weight: 700; background: #f9f9f9; }
            .alt-row td { font-style: italic; color: #666; background: #fafafa; }
            .summary { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .summary-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
            .summary-box h3 { font-size: 12px; font-weight: 700; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
            .summary-row .val { font-weight: 600; }
            .footer-note { margin-top: 16px; padding: 10px; background: #f8f8f8; border-radius: 4px; font-size: 11px; white-space: pre-wrap; border-left: 3px solid #333; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      // fallback
    }
    setGenerating(false);
  }, [title, studentName]);

  const getMealTotals = (foods: MealData["foods"]) =>
    foods.reduce((a, f) => ({
      kcal: a.kcal + (f.energy_kcal || 0), p: a.p + (f.protein_g || 0),
      c: a.c + (f.carbs_g || 0), g: a.g + (f.fat_g || 0), fi: a.fi + (f.fiber_g || 0),
    }), { kcal: 0, p: 0, c: 0, g: 0, fi: 0 });

  const thStyle: React.CSSProperties = { background: "#f0f0f0", textAlign: "center", padding: "3px 8px", fontSize: "10px", border: "1px solid #ddd" };
  const tdStyle: React.CSSProperties = { padding: "3px 8px", fontSize: "10px", border: "1px solid #ddd", textAlign: "center" };
  const tdLeft: React.CSSProperties = { ...tdStyle, textAlign: "left" };
  const subStyle: React.CSSProperties = { ...tdStyle, fontWeight: 700, background: "#f9f9f9" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Pré-visualização do PDF</DialogTitle>
        </DialogHeader>

        {/* Editable controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b pb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título do documento</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Logomarca</label>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLogoUrl(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-1" /> Enviar logo
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nota de cabeçalho (opcional)</label>
            <Textarea value={headerNote} onChange={(e) => setHeaderNote(e.target.value)} className="min-h-[50px] text-xs" placeholder="Ex: Dieta elaborada para fase de cutting..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações finais</label>
            <Textarea value={footerNote} onChange={(e) => setFooterNote(e.target.value)} className="min-h-[50px] text-xs" />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch checked={showAlternatives} onCheckedChange={setShowAlternatives} />
            <Label className="text-sm font-body">Incluir alternativas alimentares (equiparando kcal e macro principal)</Label>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-white text-black" style={{ fontSize: "11px" }}>
          <div ref={printRef}>
            <div className="header" style={{ textAlign: "center", marginBottom: "16px", borderBottom: "2px solid #333", paddingBottom: "10px" }}>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: "60px", marginBottom: "8px" }} />}
              <h1 style={{ fontSize: "18px", fontWeight: 700 }}>{title}</h1>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Aluno: {studentName} • Data: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>

            {headerNote && (
              <div className="header-note" style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: "4px", marginBottom: "14px", whiteSpace: "pre-wrap" }}>
                {headerNote}
              </div>
            )}

            {meals.filter(m => m.foods.length > 0).map((meal, i) => {
              const mt = getMealTotals(meal.foods);
              return (
                <div key={i} className="meal" style={{ marginBottom: "12px" }}>
                  <div className="meal-header" style={{ background: "#222", color: "#fff", padding: "5px 10px", fontWeight: 600, fontSize: "12px", borderRadius: "4px 4px 0 0", display: "flex", justifyContent: "space-between" }}>
                    <span>{meal.name} — {meal.time}</span>
                    <span>{mt.kcal.toFixed(0)} kcal</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: "left" }}>Alimento</th>
                        <th style={thStyle}>Qtd</th>
                        <th style={thStyle}>Kcal</th>
                        <th style={thStyle}>Prot (g)</th>
                        <th style={thStyle}>Carb (g)</th>
                        <th style={thStyle}>Gord (g)</th>
                        <th style={thStyle}>Fibra (g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meal.foods.map((food, fi) => {
                        const altKey = `${meal.name}-${fi}`;
                        const alt = showAlternatives ? alternatives.get(altKey) : null;
                        return (
                          <>
                            <tr key={fi}>
                              <td style={tdLeft}>{food.item}</td>
                              <td style={tdStyle}>{food.quantity_grams}{food.unit || "g"}</td>
                              <td style={tdStyle}>{food.energy_kcal.toFixed(0)}</td>
                              <td style={tdStyle}>{food.protein_g.toFixed(1)}</td>
                              <td style={tdStyle}>{food.carbs_g.toFixed(1)}</td>
                              <td style={tdStyle}>{food.fat_g.toFixed(1)}</td>
                              <td style={tdStyle}>{food.fiber_g.toFixed(1)}</td>
                            </tr>
                            {alt && (
                              <tr key={`${fi}-alt`} className="alt-row">
                                <td style={{ ...tdLeft, fontStyle: "italic", color: "#888", background: "#fafafa" }}>
                                  ↳ <em>Alt:</em> {alt.name}
                                </td>
                                <td style={{ ...tdStyle, fontStyle: "italic", color: "#888", background: "#fafafa" }}>{alt.qty}{alt.unit}</td>
                                <td style={{ ...tdStyle, fontStyle: "italic", color: "#888", background: "#fafafa" }}>{alt.kcal}</td>
                                <td colSpan={4} style={{ ...tdStyle, fontStyle: "italic", color: "#888", background: "#fafafa", textAlign: "left" }}>
                                  ≈ equivale em kcal e macro principal
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                      <tr className="subtotal">
                        <td style={{ ...subStyle, textAlign: "left" }}>Subtotal</td>
                        <td style={subStyle}></td>
                        <td style={subStyle}>{mt.kcal.toFixed(0)}</td>
                        <td style={subStyle}>{mt.p.toFixed(1)}</td>
                        <td style={subStyle}>{mt.c.toFixed(1)}</td>
                        <td style={subStyle}>{mt.g.toFixed(1)}</td>
                        <td style={subStyle}>{mt.fi.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Summary */}
            <div className="summary" style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="summary-box" style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Totais do Dia</h3>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Calorias</span><span style={{ fontWeight: 600 }}>{totals?.energy_kcal.toFixed(0) || 0} kcal</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Proteína</span><span style={{ fontWeight: 600 }}>{totals?.protein_g.toFixed(1) || 0}g</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Carboidratos</span><span style={{ fontWeight: 600 }}>{totals?.carbs_g.toFixed(1) || 0}g</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Gordura</span><span style={{ fontWeight: 600 }}>{totals?.fat_g.toFixed(1) || 0}g</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Fibras</span><span style={{ fontWeight: 600 }}>{totals?.fiber_g.toFixed(1) || 0}g</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Sódio</span><span style={{ fontWeight: 600 }}>{totals?.sodium_mg.toFixed(0) || 0}mg</span></div>
              </div>
              <div className="summary-box" style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Análise por kg</h3>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Proteína/kg</span><span style={{ fontWeight: 600 }}>{proteinPerKg} g/kg</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Carboidrato/kg</span><span style={{ fontWeight: 600 }}>{carbsPerKg} g/kg</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Gordura/kg</span><span style={{ fontWeight: 600 }}>{fatPerKg} g/kg</span></div>
                {tdee && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", marginTop: "6px", borderTop: "1px solid #eee", paddingTop: "6px" }}><span>TDEE</span><span style={{ fontWeight: 600 }}>{tdee.toFixed(0)} kcal</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>Balanço</span><span style={{ fontWeight: 600 }}>{totals ? (totals.energy_kcal - tdee > 0 ? "+" : "") + (totals.energy_kcal - tdee).toFixed(0) : 0} kcal</span></div>
                  </>
                )}
              </div>
            </div>

            {footerNote && (
              <div className="footer-note" style={{ marginTop: "16px", padding: "10px", background: "#f8f8f8", borderRadius: "4px", whiteSpace: "pre-wrap", borderLeft: "3px solid #333" }}>
                {footerNote}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleGeneratePdf} disabled={generating}>
            <FileDown className="w-4 h-4 mr-1" /> {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionPdfPreview;
