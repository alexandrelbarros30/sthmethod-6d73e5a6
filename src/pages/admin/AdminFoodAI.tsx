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
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 [font-feature-settings:'ss01','cv11'] antialiased">
        {/* Hero */}
        <section className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Sparkles className="w-5 h-5 text-[#34C759]" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-[26px] md:text-[32px] font-semibold tracking-[-0.022em] leading-tight text-[#1D1D1F]">
                STH Food AI
              </h1>
              <p className="text-[13px] text-[#6E6E73] tracking-[-0.01em] mt-0.5">
                Análise inteligente de foto, rótulo ou texto — direto ao diário do aluno.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/food-ai/logs")}
            className="rounded-full border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] font-medium h-9 px-4"
          >
            <History className="w-4 h-4 mr-2" /> Histórico
          </Button>
        </section>

        {/* Aluno */}
        <Card className="rounded-3xl border-[#E5E5EA] shadow-none bg-white overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
              <span className="text-[#86868B] font-normal mr-2">01</span>Aluno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedStudent ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7]">
                <div>
                  <div className="font-medium text-[15px] text-[#1D1D1F] tracking-[-0.01em]">{selectedStudent.full_name}</div>
                  <div className="text-[12px] text-[#6E6E73] mt-0.5">{selectedStudent.email}</div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full text-[#0071E3] hover:bg-white/60 hover:text-[#0071E3]" onClick={() => { setSelectedStudent(null); setResult(null); }}>Trocar</Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
                  <Input
                    className="pl-10 h-11 rounded-2xl border-[#E5E5EA] bg-[#F5F5F7] focus-visible:ring-1 focus-visible:ring-[#34C759] focus-visible:border-[#34C759] text-[14px] placeholder:text-[#86868B]"
                    placeholder="Buscar aluno por nome ou email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                {filteredStudents.length > 0 && (
                  <div className="border border-[#E5E5EA] rounded-2xl divide-y divide-[#F2F2F7] max-h-64 overflow-auto bg-white">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.user_id}
                        onClick={() => { setSelectedStudent(s); setStudentSearch(""); }}
                        className="w-full text-left p-3.5 hover:bg-[#F5F5F7] transition-colors"
                      >
                        <div className="text-[14px] font-medium text-[#1D1D1F] tracking-[-0.01em]">{s.full_name}</div>
                        <div className="text-[12px] text-[#6E6E73] mt-0.5">{s.email}</div>
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
          <Card className="rounded-3xl border-[#E5E5EA] shadow-none bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                <span className="text-[#86868B] font-normal mr-2">02</span>Refeição
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-medium text-[#6E6E73] tracking-[-0.01em]">Data</Label>
                <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="h-11 rounded-2xl border-[#E5E5EA] bg-[#F5F5F7] focus-visible:ring-1 focus-visible:ring-[#34C759] focus-visible:border-[#34C759]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-medium text-[#6E6E73] tracking-[-0.01em]">Refeição</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="h-11 rounded-2xl border-[#E5E5EA] bg-[#F5F5F7] focus:ring-1 focus:ring-[#34C759]"><SelectValue /></SelectTrigger>
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
          <Card className="rounded-3xl border-[#E5E5EA] shadow-none bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                <span className="text-[#86868B] font-normal mr-2">03</span>Análise STHIA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setResult(null); }}>
                <TabsList className="grid grid-cols-3 w-full h-11 rounded-2xl bg-[#F5F5F7] p-1 gap-1">
                  <TabsTrigger value="photo" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06)] data-[state=active]:text-[#1D1D1F] text-[#6E6E73] font-medium text-[13px]"><Camera className="w-4 h-4 mr-1.5" /> Foto</TabsTrigger>
                  <TabsTrigger value="label" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06)] data-[state=active]:text-[#1D1D1F] text-[#6E6E73] font-medium text-[13px]"><Tag className="w-4 h-4 mr-1.5" /> Rótulo</TabsTrigger>
                  <TabsTrigger value="text" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06)] data-[state=active]:text-[#1D1D1F] text-[#6E6E73] font-medium text-[13px]"><Type className="w-4 h-4 mr-1.5" /> Texto</TabsTrigger>
                </TabsList>

                <TabsContent value="photo" className="space-y-3 pt-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-[#D1D1D6] bg-[#F5F5F7] hover:border-[#34C759] hover:bg-[#F0FAF3] transition-colors p-8 text-center group"
                  >
                    <Camera className="w-6 h-6 mx-auto mb-2 text-[#34C759]" strokeWidth={2} />
                    <div className="text-[14px] font-medium text-[#1D1D1F]">{file ? "Trocar imagem" : "Selecionar foto do prato"}</div>
                    <div className="text-[12px] text-[#86868B] mt-0.5">JPG, PNG · até 10 MB</div>
                  </button>
                  {preview && <img src={preview} alt="preview" className="max-h-72 rounded-2xl border border-[#E5E5EA] mx-auto" />}
                </TabsContent>

                <TabsContent value="label" className="space-y-3 pt-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-[#D1D1D6] bg-[#F5F5F7] hover:border-[#34C759] hover:bg-[#F0FAF3] transition-colors p-8 text-center group"
                  >
                    <Tag className="w-6 h-6 mx-auto mb-2 text-[#34C759]" strokeWidth={2} />
                    <div className="text-[14px] font-medium text-[#1D1D1F]">{file ? "Trocar rótulo" : "Selecionar foto do rótulo"}</div>
                    <div className="text-[12px] text-[#86868B] mt-0.5">Painel nutricional visível</div>
                  </button>
                  {preview && <img src={preview} alt="preview" className="max-h-72 rounded-2xl border border-[#E5E5EA] mx-auto" />}
                </TabsContent>

                <TabsContent value="text" className="space-y-3 pt-5">
                  <Textarea
                    rows={5}
                    placeholder="Ex: 150g arroz integral, 120g peito de frango grelhado, salada verde com azeite..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="rounded-2xl border-[#E5E5EA] bg-[#F5F5F7] focus-visible:ring-1 focus-visible:ring-[#34C759] focus-visible:border-[#34C759] text-[14px] placeholder:text-[#86868B] resize-none p-4"
                  />
                </TabsContent>
              </Tabs>

              <div className="pt-6">
                <Button
                  onClick={analyze}
                  disabled={analyzing}
                  className="w-full sm:w-auto h-11 px-6 rounded-full bg-[#1D1D1F] hover:bg-[#000] text-white font-medium tracking-[-0.01em] shadow-none"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Analisar com STHIA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {result && (
          <Card className={`rounded-3xl shadow-none bg-white ${reviewMode ? "border-[#FF9500]/40" : "border-[#E5E5EA]"}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                  <span className="text-[#86868B] font-normal mr-2">04</span>Resultado & confirmação
                </CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="rounded-full border-[#E5E5EA] bg-[#F5F5F7] text-[#6E6E73] font-normal text-[11px] px-2.5">{result.classification}</Badge>
                  <Badge className={`rounded-full font-medium text-[11px] px-2.5 border ${reviewMode ? "bg-[#FFF7EB] text-[#B25E00] border-[#FF9500]/30" : "bg-[#F0FAF3] text-[#0F7B3B] border-[#34C759]/30"}`}>
                    {Math.round((result.confidence || 0) * 100)}% confiança
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {reviewMode && (
                <Alert className="rounded-2xl border-[#FF9500]/30 bg-[#FFF7EB] text-[#8A5A00]">
                  <ShieldAlert className="w-4 h-4 !text-[#B25E00]" />
                  <AlertTitle className="text-[#8A5A00] font-semibold tracking-[-0.01em]">Revisão recomendada</AlertTitle>
                  <AlertDescription className="text-[#8A5A00]/90 text-[13px]">
                    A confiança está abaixo de {Math.round(CONFIDENCE_THRESHOLD * 100)}%. Revise nome, porção e macros de cada item antes de registrar no diário do aluno.
                  </AlertDescription>
                </Alert>
              )}

              {result.alerts?.length > 0 && (
                <div className="rounded-2xl border border-[#FF9500]/25 bg-[#FFF7EB] p-4 text-[13px]">
                  <div className="font-semibold text-[#8A5A00] mb-1.5 tracking-[-0.01em]">Alertas nutricionais</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[#8A5A00]/85">
                    {result.alerts.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {editedFoods.map((f, i) => {
                  const lowConf = (f.confidence ?? 1) < CONFIDENCE_THRESHOLD;
                  return (
                    <div key={i} className={`rounded-2xl border p-4 space-y-3 transition-colors ${lowConf ? "border-[#FF9500]/40 bg-[#FFF7EB]" : "border-[#E5E5EA] bg-[#FBFBFD]"}`}>
                      <div className="flex items-center gap-2">
                        <Input
                          className="font-medium h-10 rounded-xl border-[#E5E5EA] bg-white focus-visible:ring-1 focus-visible:ring-[#34C759] focus-visible:border-[#34C759] text-[14px] tracking-[-0.01em]"
                          value={f.name}
                          onChange={(e) => updateFood(i, { name: e.target.value })}
                          placeholder="Nome do alimento"
                        />
                        {lowConf && <Badge className="whitespace-nowrap rounded-full bg-[#FF9500]/15 text-[#B25E00] border border-[#FF9500]/30 font-medium text-[11px]">Baixa {Math.round((f.confidence || 0) * 100)}%</Badge>}
                        <Button variant="ghost" size="icon" className="rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF0F0]" onClick={() => removeFood(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <Label className="text-[11px] font-medium text-[#86868B] uppercase tracking-[0.02em]">Porção</Label>
                          <div className="flex gap-1 mt-1">
                            <Input type="number" step="0.1" value={f.estimated_weight_g} onChange={(e) => updateFood(i, { estimated_weight_g: parseFloat(e.target.value) || 0 })} className="h-9 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                            <Select value={f.unit} onValueChange={(v) => updateFood(i, { unit: v as "g" | "ml" })}>
                              <SelectTrigger className="w-16 h-9 rounded-lg border-[#E5E5EA] bg-white text-[13px]"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="ml">ml</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#86868B] uppercase tracking-[0.02em]">kcal</Label>
                          <Input type="number" step="0.1" value={f.calories} onChange={(e) => updateFood(i, { calories: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#34C759] uppercase tracking-[0.02em]">Proteína</Label>
                          <Input type="number" step="0.1" value={f.protein_g} onChange={(e) => updateFood(i, { protein_g: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#FF9500] uppercase tracking-[0.02em]">Carbo</Label>
                          <Input type="number" step="0.1" value={f.carbs_g} onChange={(e) => updateFood(i, { carbs_g: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#FF3B30] uppercase tracking-[0.02em]">Gordura</Label>
                          <Input type="number" step="0.1" value={f.fat_g} onChange={(e) => updateFood(i, { fat_g: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#86868B] uppercase tracking-[0.02em]">Fibra</Label>
                          <Input type="number" step="0.1" value={f.fiber_g} onChange={(e) => updateFood(i, { fiber_g: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-[#86868B] uppercase tracking-[0.02em]">Sódio</Label>
                          <Input type="number" step="0.1" value={f.sodium_mg} onChange={(e) => updateFood(i, { sodium_mg: parseFloat(e.target.value) || 0 })} className="h-9 mt-1 rounded-lg border-[#E5E5EA] bg-white text-[13px]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" onClick={addFood} className="rounded-full border-[#E5E5EA] bg-white text-[#0071E3] hover:bg-[#F5F5F7] hover:text-[#0071E3] h-9">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar item
                </Button>
              </div>

              <div className="rounded-2xl border border-[#E5E5EA] p-5 bg-[#F5F5F7]">
                <div className="text-[11px] uppercase tracking-[0.06em] text-[#86868B] mb-3 font-medium">Totais</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">kcal</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{Math.round(editedTotals.calories)}</div></div>
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#34C759]">Proteína</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{editedTotals.protein_g.toFixed(0)}<span className="text-[13px] text-[#86868B] font-normal ml-0.5">g</span></div></div>
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#FF9500]">Carbo</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{editedTotals.carbs_g.toFixed(0)}<span className="text-[13px] text-[#86868B] font-normal ml-0.5">g</span></div></div>
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#FF3B30]">Gordura</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{editedTotals.fat_g.toFixed(0)}<span className="text-[13px] text-[#86868B] font-normal ml-0.5">g</span></div></div>
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Fibra</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{editedTotals.fiber_g.toFixed(0)}<span className="text-[13px] text-[#86868B] font-normal ml-0.5">g</span></div></div>
                  <div><div className="text-[10px] uppercase tracking-[0.04em] text-[#86868B]">Sódio</div><div className="text-[20px] font-semibold text-[#1D1D1F] tracking-[-0.02em] tabular-nums">{Math.round(editedTotals.sodium_mg)}<span className="text-[13px] text-[#86868B] font-normal ml-0.5">mg</span></div></div>
                </div>
                <div className="mt-5 pt-4 border-t border-[#E5E5EA]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] text-[#6E6E73] tracking-[-0.01em]">Qualidade nutricional</div>
                    <div className="text-[13px] font-semibold text-[#1D1D1F] tabular-nums">{result.quality_score}<span className="text-[#86868B] font-normal">/10</span></div>
                  </div>
                  <Progress value={(result.quality_score || 0) * 10} className="h-1.5 bg-white [&>div]:bg-[#34C759]" />
                </div>
              </div>

              <div className="flex gap-2 justify-end flex-wrap pt-1">
                <Button variant="ghost" onClick={discard} className="rounded-full text-[#6E6E73] hover:text-[#FF3B30] hover:bg-[#FFF0F0] h-11 px-5">Descartar</Button>
                <Button onClick={saveToDiary} disabled={saving || editedFoods.length === 0} className="rounded-full h-11 px-6 bg-[#34C759] hover:bg-[#2FB550] text-white font-medium tracking-[-0.01em] shadow-none disabled:opacity-40">
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