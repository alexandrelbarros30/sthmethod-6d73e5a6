import { useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Loader2, Camera, Tag, Type, Search, Save, ShieldAlert, Trash2, Plus, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSearch } from "@/lib/utils";
import { MEAL_TYPES } from "@/lib/food-diary-storage";
import { toast } from "sonner";

type Mode = "photo" | "label" | "text";

type FoodItem = {
  name: string;
  estimated_weight_g: number;
  unit: "g" | "ml";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  confidence: number;
};

type Totals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
};

type AnalyzeResult = {
  analysis_type: string;
  confidence: number;
  foods: FoodItem[];
  totals: Totals;
  quality_score: number;
  classification: string;
  alerts: string[];
  notes: string;
  source: string;
  reconciled_count: number;
  total_count: number;
};

const CONFIDENCE_THRESHOLD = 0.7;

async function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve({ base64, mime: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const AdminFoodAI = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [editedFoods, setEditedFoods] = useState<FoodItem[]>([]);
  const [reviewMode, setReviewMode] = useState(false);

  const [mealType, setMealType] = useState<string>("almoco");
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["food-ai-students", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from("profiles").select("user_id, full_name, email");
      if (displayRole === "consultor") {
        const { data: links } = await supabase.from("consultant_students").select("student_id").eq("consultant_id", user.id);
        const ids = (links || []).map((l: any) => l.student_id);
        if (!ids.length) return [];
        q = q.in("user_id", ids);
      }
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredStudents = useMemo(() => {
    if (studentSearch.trim().length < 2) return [];
    const q = normalizeSearch(studentSearch);
    return (students as any[]).filter(
      (s) => normalizeSearch(s.full_name || "").includes(q) || normalizeSearch(s.email || "").includes(q),
    ).slice(0, 20);
  }, [students, studentSearch]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const analyze = async () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    if (mode === "text" && !text.trim()) {
      toast.error("Descreva a refeição");
      return;
    }
    if ((mode === "photo" || mode === "label") && !file) {
      toast.error("Envie uma imagem");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setReviewMode(false);
    setLogId(null);
    const started = Date.now();

    try {
      let payload: any = { mode };
      if (mode === "text") payload.text = text;
      if (file && mode !== "text") {
        const { base64, mime } = await fileToBase64(file);
        payload.image = base64;
        payload.mime = mime;
      }
      payload.audit_source = "admin_console";
      payload.student_id = selectedStudent.user_id;
      payload.admin_id = user?.id ?? null;
      // Admin console writes its own richer log (meal_type, log_date, meal_label).
      payload.skip_server_log = true;

      const { data, error } = await supabase.functions.invoke("food-ai-analyze", { body: payload });

      const duration = Date.now() - started;

      if (error || (data as any)?.error) {
        const errMsg = (data as any)?.details || (data as any)?.error || error?.message || "erro desconhecido";
        const errCode = (data as any)?.code || "STH-500";

        await supabase.from("food_ai_logs").insert({
          student_id: selectedStudent.user_id,
          admin_id: user?.id,
          source: "admin",
          mode,
          input_text: mode === "text" ? text : null,
          input_image_meta: file ? { name: file.name, size: file.size, type: file.type } : null,
          meal_type: mealType,
          meal_label: MEAL_TYPES.find((m) => m.key === mealType)?.label || mealType,
          log_date: logDate,
          status: "error",
          error_code: errCode,
          error_details: String(errMsg).slice(0, 2000),
          duration_ms: duration,
        });
        toast.error(`Falha na análise (${errCode})`);
        return;
      }

      const r = data as AnalyzeResult;
      setResult(r);
      setEditedFoods(r.foods.map((f) => ({ ...f })));

      const lowConfidence = (r.confidence ?? 0) < CONFIDENCE_THRESHOLD || r.foods.some((f) => (f.confidence ?? 0) < CONFIDENCE_THRESHOLD);
      setReviewMode(lowConfidence);

      const { data: logRow, error: logErr } = await supabase
        .from("food_ai_logs")
        .insert({
          student_id: selectedStudent.user_id,
          admin_id: user?.id,
          source: "admin",
          mode,
          input_text: mode === "text" ? text : null,
          input_image_meta: file ? { name: file.name, size: file.size, type: file.type } : null,
          meal_type: mealType,
          meal_label: MEAL_TYPES.find((m) => m.key === mealType)?.label || mealType,
          log_date: logDate,
          confidence: r.confidence ?? null,
          quality_score: r.quality_score ?? null,
          classification: r.classification || null,
          foods: r.foods as any,
          totals: r.totals as any,
          alerts: r.alerts as any,
          notes: r.notes || null,
          ai_source: r.source || null,
          reconciled_count: r.reconciled_count || 0,
          total_count: r.total_count || r.foods.length,
          status: lowConfidence ? "pending_review" : "analyzed",
          needs_review: lowConfidence,
          duration_ms: duration,
        })
        .select("id")
        .single();

      if (logErr) console.error("food_ai_logs insert", logErr);
      else setLogId(logRow?.id || null);

      if (lowConfidence) {
        toast.warning("Confiança baixa — revise antes de registrar no diário");
      } else {
        toast.success("Análise concluída");
      }
    } catch (e: any) {
      toast.error("Erro inesperado na análise");
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateFood = (idx: number, patch: Partial<FoodItem>) => {
    setEditedFoods((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const removeFood = (idx: number) => {
    setEditedFoods((prev) => prev.filter((_, i) => i !== idx));
  };

  const addFood = () => {
    setEditedFoods((prev) => [
      ...prev,
      {
        name: "",
        estimated_weight_g: 100,
        unit: "g",
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sodium_mg: 0,
        confidence: 1,
      },
    ]);
  };

  const editedTotals = useMemo<Totals>(() => {
    const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 };
    editedFoods.forEach((f) => {
      t.calories += Number(f.calories) || 0;
      t.protein_g += Number(f.protein_g) || 0;
      t.carbs_g += Number(f.carbs_g) || 0;
      t.fat_g += Number(f.fat_g) || 0;
      t.fiber_g += Number(f.fiber_g) || 0;
      t.sodium_mg += Number(f.sodium_mg) || 0;
    });
    return {
      calories: +t.calories.toFixed(1),
      protein_g: +t.protein_g.toFixed(2),
      carbs_g: +t.carbs_g.toFixed(2),
      fat_g: +t.fat_g.toFixed(2),
      fiber_g: +t.fiber_g.toFixed(2),
      sodium_mg: +t.sodium_mg.toFixed(1),
    };
  }, [editedFoods]);

  const saveToDiary = async () => {
    if (!selectedStudent || !editedFoods.length) return;
    setSaving(true);
    try {
      const mealLabel = MEAL_TYPES.find((m) => m.key === mealType)?.label || mealType;
      const rows = editedFoods
        .filter((f) => f.name.trim())
        .map((f, i) => ({
          user_id: selectedStudent.user_id,
          log_date: logDate,
          meal_type: mealType,
          meal_label: mealLabel,
          item_name: f.name,
          quantity: Number(f.estimated_weight_g) || 0,
          unit: f.unit || "g",
          energy_kcal: Number(f.calories) || 0,
          protein_g: Number(f.protein_g) || 0,
          carbs_g: Number(f.carbs_g) || 0,
          fat_g: Number(f.fat_g) || 0,
          fiber_g: Number(f.fiber_g) || 0,
          sodium_mg: Number(f.sodium_mg) || 0,
          sort_order: i,
        }));

      if (!rows.length) {
        toast.error("Nenhum item válido para salvar");
        setSaving(false);
        return;
      }

      const { data: inserted, error } = await supabase
        .from("food_diary_entries")
        .insert(rows)
        .select("id");

      if (error) {
        toast.error("Falha ao salvar no diário");
        console.error(error);
        return;
      }

      if (logId) {
        await supabase
          .from("food_ai_logs")
          .update({
            status: "saved",
            needs_review: false,
            foods: editedFoods as any,
            totals: editedTotals as any,
            diary_entry_ids: (inserted || []).map((r) => r.id) as any,
          })
          .eq("id", logId);
      }

      toast.success(`${rows.length} item(ns) adicionado(s) ao diário`);
      // Reset
      setResult(null);
      setEditedFoods([]);
      setReviewMode(false);
      setLogId(null);
      setFile(null);
      setPreview(null);
      setText("");
    } catch (e) {
      toast.error("Erro ao salvar");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (logId) {
      await supabase.from("food_ai_logs").update({ status: "discarded" }).eq("id", logId);
    }
    setResult(null);
    setEditedFoods([]);
    setReviewMode(false);
    setLogId(null);
    toast.info("Análise descartada");
  };

  return (
    <DashboardLayout role="admin" title="STH Food AI">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">STH Food AI — Console Admin</h1>
              <p className="text-xs text-muted-foreground">Analise foto, rótulo ou texto e registre direto no diário do aluno</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/food-ai/logs")}>
            <History className="w-4 h-4 mr-2" /> Ver histórico
          </Button>
        </div>

        {/* Aluno */}
        <Card>
          <CardHeader><CardTitle className="text-base">1. Aluno</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div>
                  <div className="font-medium">{selectedStudent.full_name}</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.email}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(null); setResult(null); }}>Trocar</Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar aluno por nome ou email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                {filteredStudents.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.user_id}
                        onClick={() => { setSelectedStudent(s); setStudentSearch(""); }}
                        className="w-full text-left p-3 hover:bg-muted/60 transition"
                      >
                        <div className="text-sm font-medium">{s.full_name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Contexto de refeição */}
        {selectedStudent && (
          <Card>
            <CardHeader><CardTitle className="text-base">2. Refeição</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Refeição</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((m) => (
                      <SelectItem key={m.key} value={m.key}>{m.icon} {m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análise */}
        {selectedStudent && (
          <Card>
            <CardHeader><CardTitle className="text-base">3. Análise STHIA</CardTitle></CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setResult(null); }}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="photo"><Camera className="w-4 h-4 mr-1" /> Foto</TabsTrigger>
                  <TabsTrigger value="label"><Tag className="w-4 h-4 mr-1" /> Rótulo</TabsTrigger>
                  <TabsTrigger value="text"><Type className="w-4 h-4 mr-1" /> Texto</TabsTrigger>
                </TabsList>

                <TabsContent value="photo" className="space-y-3 pt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" /> {file ? "Trocar imagem" : "Selecionar foto do prato"}
                  </Button>
                  {preview && <img src={preview} alt="preview" className="max-h-64 rounded-lg border" />}
                </TabsContent>

                <TabsContent value="label" className="space-y-3 pt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Tag className="w-4 h-4 mr-2" /> {file ? "Trocar rótulo" : "Selecionar foto do rótulo"}
                  </Button>
                  {preview && <img src={preview} alt="preview" className="max-h-64 rounded-lg border" />}
                </TabsContent>

                <TabsContent value="text" className="space-y-3 pt-3">
                  <Textarea
                    rows={4}
                    placeholder="Ex: 150g arroz integral, 120g peito de frango grelhado, salada verde com azeite..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </TabsContent>
              </Tabs>

              <div className="pt-4">
                <Button onClick={analyze} disabled={analyzing} className="w-full sm:w-auto">
                  {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Analisar com STHIA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {result && (
          <Card className={reviewMode ? "border-amber-500/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">4. Resultado & Confirmação</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">Fonte: {result.source}</Badge>
                  <Badge variant={result.classification === "🟢 Bom" ? "default" : result.classification === "🔴 Ruim" ? "destructive" : "secondary"}>
                    {result.classification}
                  </Badge>
                  <Badge variant={reviewMode ? "destructive" : "default"}>
                    Confiança {Math.round((result.confidence || 0) * 100)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewMode && (
                <Alert variant="destructive">
                  <ShieldAlert className="w-4 h-4" />
                  <AlertTitle>Revisão necessária</AlertTitle>
                  <AlertDescription>
                    A confiança está abaixo de {Math.round(CONFIDENCE_THRESHOLD * 100)}%. Revise nome, porção e macros de cada item antes de registrar no diário do aluno.
                  </AlertDescription>
                </Alert>
              )}

              {result.alerts?.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <div className="font-medium mb-1">Alertas nutricionais</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                    {result.alerts.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {editedFoods.map((f, i) => {
                  const lowConf = (f.confidence ?? 1) < CONFIDENCE_THRESHOLD;
                  return (
                    <div key={i} className={`rounded-lg border p-3 space-y-2 ${lowConf ? "border-amber-500/50 bg-amber-500/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <Input
                          className="font-medium"
                          value={f.name}
                          onChange={(e) => updateFood(i, { name: e.target.value })}
                          placeholder="Nome do alimento"
                        />
                        {lowConf && <Badge variant="destructive" className="whitespace-nowrap">Baixa {Math.round((f.confidence || 0) * 100)}%</Badge>}
                        <Button variant="ghost" size="icon" onClick={() => removeFood(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Porção</Label>
                          <div className="flex gap-1">
                            <Input type="number" step="0.1" value={f.estimated_weight_g} onChange={(e) => updateFood(i, { estimated_weight_g: parseFloat(e.target.value) || 0 })} />
                            <Select value={f.unit} onValueChange={(v) => updateFood(i, { unit: v as "g" | "ml" })}>
                              <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="ml">ml</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">kcal</Label>
                          <Input type="number" step="0.1" value={f.calories} onChange={(e) => updateFood(i, { calories: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label className="text-xs text-emerald-600">Proteína (g)</Label>
                          <Input type="number" step="0.1" value={f.protein_g} onChange={(e) => updateFood(i, { protein_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label className="text-xs text-amber-600">Carbo (g)</Label>
                          <Input type="number" step="0.1" value={f.carbs_g} onChange={(e) => updateFood(i, { carbs_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label className="text-xs text-rose-600">Gordura (g)</Label>
                          <Input type="number" step="0.1" value={f.fat_g} onChange={(e) => updateFood(i, { fat_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label className="text-xs">Fibra (g)</Label>
                          <Input type="number" step="0.1" value={f.fiber_g} onChange={(e) => updateFood(i, { fiber_g: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label className="text-xs">Sódio (mg)</Label>
                          <Input type="number" step="0.1" value={f.sodium_mg} onChange={(e) => updateFood(i, { sodium_mg: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" onClick={addFood}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar item
                </Button>
              </div>

              <div className="rounded-lg border p-3 bg-muted/40">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Totais</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-sm">
                  <div><div className="text-muted-foreground text-xs">kcal</div><div className="font-semibold">{editedTotals.calories}</div></div>
                  <div><div className="text-emerald-600 text-xs">P</div><div className="font-semibold">{editedTotals.protein_g}g</div></div>
                  <div><div className="text-amber-600 text-xs">C</div><div className="font-semibold">{editedTotals.carbs_g}g</div></div>
                  <div><div className="text-rose-600 text-xs">G</div><div className="font-semibold">{editedTotals.fat_g}g</div></div>
                  <div><div className="text-muted-foreground text-xs">Fibra</div><div className="font-semibold">{editedTotals.fiber_g}g</div></div>
                  <div><div className="text-muted-foreground text-xs">Sódio</div><div className="font-semibold">{editedTotals.sodium_mg}mg</div></div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Qualidade nutricional: {result.quality_score}/10</div>
                  <Progress value={(result.quality_score || 0) * 10} />
                </div>
              </div>

              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="ghost" onClick={discard}>Descartar</Button>
                <Button onClick={saveToDiary} disabled={saving || editedFoods.length === 0}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {reviewMode ? "Confirmar e registrar no diário" : "Registrar no diário"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminFoodAI;