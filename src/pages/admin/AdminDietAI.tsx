import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Save, Search, RefreshCw, ClipboardCheck, Wand2, Download, UserCog, Stethoscope, FileText, History, Lock, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSearch } from "@/lib/utils";
import DietContentRenderer from "@/components/student/DietContentRenderer";
import { toast } from "sonner";

type Meal = {
  meal_number: number;
  meal_name: string;
  items: string[];
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type GenResult = {
  diet_text: string;
  meals: Meal[];
  total: { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  hydration_l?: number;
  notes?: string;
  targets?: { energy_kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
  deviation_pct?: { energy_kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number };
  _meta?: { usage?: any; photos_used?: number };
};

type ReviewResult = {
  overall_score: number;
  summary: string;
  issues: string[];
  suggestions: string[];
  revised_diet?: string;
  _meta?: { usage?: any };
};

type AdviceResult = {
  advice_html: string;
  key_points?: string[];
  cautions?: string[];
};

const htmlToPlain = (html: string) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripMealMacroLines = (html: string) =>
  (html || "")
    .replace(/<p[^>]*>\s*(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o[\s\S]*?<\/p>\s*/gi, "")
    .replace(
      /(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o\s*\d*\s*:\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*/gi,
      "",
    )
    .replace(/<p[^>]*>\s*(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO[\s\S]*?<\/p>\s*/gi, "")
    .replace(
      /(?:<[^>]+>\s*)*TOTAL\s+DI[ÁA]RIO\s*:?\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*/gi,
      "",
    );

const AdminDietAI = () => {
  const { role, user } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";
  const queryClient = useQueryClient();

  // Student selection
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Brief
  const [objective, setObjective] = useState("hipertrofia");
  const [kcalTarget, setKcalTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");
  const [numMeals, setNumMeals] = useState("5");
  const [restrictions, setRestrictions] = useState("");
  const [preferences, setPreferences] = useState("");
  const [freeText, setFreeText] = useState("");
  const [usePhotos, setUsePhotos] = useState(true);

  // Protocolo do aluno
  const [protocolText, setProtocolText] = useState("");
  const [protocolTitle, setProtocolTitle] = useState("");
  const [useProtocol, setUseProtocol] = useState(true);

  // Orientação (consulta STHIA)
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [adviceExtra, setAdviceExtra] = useState("");
  const [useAdvice, setUseAdvice] = useState(true);

  const [result, setResult] = useState<GenResult | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Contra-resposta (correção do cardápio já gerado)
  const [counterNote, setCounterNote] = useState("");
  const [counterHistory, setCounterHistory] = useState<string[]>([]);

  // Histórico de orientações (restrito a admin/consultor)
  const { data: consultHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["diet-consultations", selectedStudent?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_consultations")
        .select("id, title, advice_html, key_points, cautions, protocol_title, created_at")
        .eq("student_id", selectedStudent.user_id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudent?.user_id,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["diet-ai-students", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from("profiles").select("user_id, full_name, email, weight, height, birth_date, gender, objective, tdee, protein_g, carbs_g, fat_g, daily_calories");
      if (displayRole === "consultor") {
        const { data: links } = await supabase.from("consultant_students").select("student_id").eq("consultant_id", user.id);
        const ids = (links || []).map((l: any) => l.student_id);
        if (!ids.length) return [];
        q = q.in("user_id", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filtered = studentSearch.trim().length < 2
    ? []
    : (students as any[]).filter((s) => {
        const q = normalizeSearch(studentSearch);
        return normalizeSearch(s.full_name || "").includes(q) || normalizeSearch(s.email || "").includes(q);
      });

  const applyStudentMacros = async (s: any) => {
    if (!s?.user_id) return;
    try {
      // Prioridade absoluta: última dieta prescrita ao aluno (mais recente por updated_at)
      const { data: latestDiet } = await supabase
        .from("student_diets")
        .select("energy_kcal, protein_g, carbs_g, fat_g, title, updated_at")
        .eq("user_id", s.user_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const kcal = latestDiet?.energy_kcal ?? s?.daily_calories ?? null;
      const p = latestDiet?.protein_g ?? s?.protein_g ?? null;
      const c = latestDiet?.carbs_g ?? s?.carbs_g ?? null;
      const g = latestDiet?.fat_g ?? s?.fat_g ?? null;

      if (kcal) setKcalTarget(String(Math.round(Number(kcal))));
      if (p) setProteinTarget(String(Math.round(Number(p))));
      if (c) setCarbsTarget(String(Math.round(Number(c))));
      if (g) setFatTarget(String(Math.round(Number(g))));
      if (s?.objective) setObjective(s.objective);

      if (latestDiet?.energy_kcal) {
        toast.success(`Macros puxados da última dieta: ${latestDiet.title || "sem título"}`);
      } else {
        toast.message("Sem dieta anterior — usando macros do perfil do aluno.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao puxar macros");
    }
  };

  const pickStudent = async (s: any) => {
    setSelectedStudent(s);
    setProtocolText("");
    setProtocolTitle("");
    setAdvice(null);
    // Não auto-preenche o briefing — o admin decide via botão "Puxar macros"
  };

  const pullProtocol = async () => {
    if (!selectedStudent?.user_id) return;
    try {
      const { data, error } = await supabase
        .from("student_protocols")
        .select("title, content, updated_at")
        .eq("user_id", selectedStudent.user_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const plain = htmlToPlain((data as any)?.content || "");
      if (!plain) {
        toast.message("Este aluno não tem protocolo com conteúdo salvo.");
        return;
      }
      setProtocolText(plain.slice(0, 8000));
      setProtocolTitle((data as any)?.title || "Protocolo atual");
      setUseProtocol(true);
      toast.success(`Protocolo puxado: ${(data as any)?.title || "sem título"}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao puxar protocolo");
    }
  };

  const saveMacrosToProfile = async () => {
    if (!selectedStudent) return;
    try {
      const patch: any = {
        daily_calories: kcalTarget ? Number(kcalTarget) : null,
        protein_g: proteinTarget ? Number(proteinTarget) : null,
        carbs_g: carbsTarget ? Number(carbsTarget) : null,
        fat_g: fatTarget ? Number(fatTarget) : null,
        objective,
      };
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", selectedStudent.user_id);
      if (error) throw error;
      setSelectedStudent({ ...selectedStudent, ...patch });
      toast.success("Macros atualizados no perfil do aluno");
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar macros");
    }
  };

  const generateMut = useMutation({
    mutationFn: async (opts?: { correction?: string }) => {
      const correction = (opts?.correction || "").trim();
      const brief = {
        aluno: selectedStudent?.full_name || null,
        peso_kg: selectedStudent?.weight || null,
        altura_cm: selectedStudent?.height || null,
        idade: selectedStudent?.age || null,
        objetivo: objective,
        kcal_alvo: kcalTarget ? Number(kcalTarget) : null,
        proteina_g_alvo: proteinTarget ? Number(proteinTarget) : null,
        carboidrato_g_alvo: carbsTarget ? Number(carbsTarget) : null,
        lipidio_g_alvo: fatTarget ? Number(fatTarget) : null,
        numero_refeicoes: Number(numMeals) || 5,
        restricoes: restrictions,
        preferencias: preferences,
      };
      const { data, error } = await supabase.functions.invoke("generate-diet-ai", {
        body: {
          mode: "generate",
          brief,
          freeText: [freeText, adviceExtra.trim() ? `Ajustes adicionais do admin após a consulta:\n${adviceExtra.trim()}` : ""].filter(Boolean).join("\n\n"),
          studentId: selectedStudent?.user_id || null,
          includePhotos: usePhotos,
          protocolText: useProtocol ? protocolText : "",
          adviceText: useAdvice && advice?.advice_html ? htmlToPlain(advice.advice_html) : "",
          correction,
          previousDiet: correction ? htmlToPlain(result?.diet_text || "").slice(0, 20000) : "",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { ...(data as GenResult), _correction: correction } as GenResult & { _correction?: string };
    },
    onSuccess: (data: any) => {
      setResult({ ...data, diet_text: stripMealMacroLines(data.diet_text) });
      setReview(null);
      if (data?._correction) {
        setCounterHistory((h) => [...h, data._correction]);
        setCounterNote("");
        // A contra-resposta pode redefinir metas (ex.: kcal 2300) — reflete no briefing.
        const t = (data as any)?.targets;
        if (t?.energy_kcal) setKcalTarget(String(t.energy_kcal));
        toast.success("Cardápio corrigido com a sua contra-resposta");
      } else {
        setCounterHistory([]);
        toast.success("Cardápio gerado pela STHIA");
      }
    },
    onError: (e: any) => {
      const msg = e.message || "";
      const details = e?.details || "";
      if (msg.includes("Edge Function returned a non-2xx status code")) {
        toast.error("O cérebro da STHIA está pronto e calibrado. Por favor, tente gerar o cardápio novamente.", { duration: 10000 });
      } else {
        toast.error(`${msg}${details ? ` - ${details}` : ""}` || "Falha ao gerar");
      }
    },
  });

  const adviceMut = useMutation({
    mutationFn: async () => {
      const brief = {
        aluno: selectedStudent?.full_name || null,
        peso_kg: selectedStudent?.weight || null,
        altura_cm: selectedStudent?.height || null,
        objetivo: objective,
        kcal_alvo: kcalTarget ? Number(kcalTarget) : null,
        proteina_g_alvo: proteinTarget ? Number(proteinTarget) : null,
        carboidrato_g_alvo: carbsTarget ? Number(carbsTarget) : null,
        lipidio_g_alvo: fatTarget ? Number(fatTarget) : null,
        numero_refeicoes: Number(numMeals) || 5,
        restricoes: restrictions,
        preferencias: preferences,
      };
      const { data, error } = await supabase.functions.invoke("generate-diet-ai", {
        body: {
          mode: "advice",
          brief,
          freeText,
          studentId: selectedStudent?.user_id || null,
          includePhotos: usePhotos,
          protocolText: useProtocol ? protocolText : "",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as AdviceResult;
    },
    onSuccess: async (data) => {
      setAdvice(data);
      setUseAdvice(true);
      toast.success("Orientação de consulta gerada pela STHIA");
      // Grava no histórico da conta do aluno (visível apenas para admin/consultor)
      if (selectedStudent?.user_id && user?.id && data?.advice_html) {
        const { error } = await supabase.from("diet_consultations").insert({
          student_id: selectedStudent.user_id,
          created_by: user.id,
          title: `Orientação — consulta STHIA (${new Date().toLocaleDateString("pt-BR")})`,
          advice_html: data.advice_html,
          key_points: (data.key_points || []) as any,
          cautions: (data.cautions || []) as any,
          brief: {
            objetivo: objective,
            kcal_alvo: kcalTarget ? Number(kcalTarget) : null,
            proteina_g_alvo: proteinTarget ? Number(proteinTarget) : null,
            carboidrato_g_alvo: carbsTarget ? Number(carbsTarget) : null,
            lipidio_g_alvo: fatTarget ? Number(fatTarget) : null,
            numero_refeicoes: Number(numMeals) || 5,
            restricoes: restrictions,
            preferencias: preferences,
            observacoes: freeText,
          } as any,
          protocol_title: useProtocol && protocolTitle ? protocolTitle : null,
        });
        if (error) {
          toast.error("Orientação gerada, mas falhou ao gravar no histórico do aluno.");
        } else {
          queryClient.invalidateQueries({ queryKey: ["diet-consultations", selectedStudent.user_id] });
          toast.success("Orientação registrada na ficha do aluno (acesso restrito à equipe)");
        }
      }
    },
    onError: (e: any) => toast.error(e.message || "Falha ao gerar orientação"),
  });

  const reviewMut = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("Gere um cardápio primeiro");
      const { data, error } = await supabase.functions.invoke("generate-diet-ai", {
        body: { mode: "review", dietContent: result.diet_text },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as ReviewResult;
    },
    onSuccess: (data) => {
      setReview(data);
      toast.success("Revisão concluída");
    },
    onError: (e: any) => toast.error(e.message || "Falha na revisão"),
  });

  const applyRevised = () => {
    if (!review?.revised_diet || !result) return;
    setResult({ ...result, diet_text: stripMealMacroLines(review.revised_diet) });
    toast.success("Cardápio revisado aplicado");
  };

  const saveToStudent = async () => {
    if (!result) {
      toast.error("Gere um cardápio antes de salvar.");
      return;
    }
    if (!selectedStudent) {
      toast.error("Selecione um aluno para salvar o rascunho na ficha.");
      return;
    }
    const defaultName = `Dieta IA — ${new Date().toLocaleDateString("pt-BR")}`;
    const name = window.prompt("Nome do rascunho da dieta:", defaultName);
    if (name === null) return; // cancelado
    const title = name.trim() || defaultName;
    setSaving(true);
    try {
      const cleanContent = stripMealMacroLines(result.diet_text || "");

      const { data: dietRow, error } = await supabase.from("student_diets").insert({
        user_id: selectedStudent.user_id,
        title,
        tab_label: title,
        content: cleanContent,
        energy_kcal: result.total.energy_kcal,
        protein_g: result.total.protein_g,
        carbs_g: result.total.carbs_g,
        fat_g: result.total.fat_g,
        hydration_l: result.hydration_l || null,
        app_context: 'sth_method',
      } as any).select("id").single();
      if (error) throw error;

      // Create diet_meals + placeholder diet_foods so the student's interactive
      // screen shows per-meal macros (kcal / P / C / G) instead of an equal split.
      const dietId = (dietRow as any)?.id as string | undefined;
      const meals = Array.isArray(result.meals) ? result.meals : [];
      if (dietId && meals.length > 0) {
        const defaultTime = (idx: number) => {
          // 07:00, 10:00, 12:00, 15:00, 19:00, 21:00 for 6 meals, else spaced from 07:00
          const fallback = ["07:00","10:00","12:00","15:00","19:00","21:00","23:00","05:00"];
          return fallback[idx] || `${String(7 + idx * 3).padStart(2, "0")}:00`;
        };
        const mealRows = meals
          .slice()
          .sort((a, b) => (a.meal_number || 0) - (b.meal_number || 0))
          .map((m, idx) => ({
            user_id: selectedStudent.user_id,
            diet_id: dietId,
            name: (m.meal_name || `Refeição ${m.meal_number || idx + 1}`).toString().slice(0, 120),
            time: defaultTime(idx),
            sort_order: idx,
          }));
        const { data: insertedMeals, error: mealsErr } = await supabase
          .from("diet_meals")
          .insert(mealRows.map(m => ({ ...m, app_context: 'sth_method' })) as any)
          .select("id, sort_order");
        if (mealsErr) throw mealsErr;

        const orderedMeals = (insertedMeals || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
        const foodRows = orderedMeals.map((row: any, idx: number) => {
          const m = meals[idx];
          const summary = Array.isArray(m?.items) && m.items.length
            ? (m.items[0] || "").toString().slice(0, 200)
            : (m?.meal_name || "Refeição");
          return {
            meal_id: row.id,
            item: summary || "Refeição",
            quantity: "1 porção",
            sort_order: 0,
            energy_kcal: Math.round(m?.energy_kcal || 0),
            protein_g: Math.round(m?.protein_g || 0),
            carbs_g: Math.round(m?.carbs_g || 0),
            fat_g: Math.round(m?.fat_g || 0),
            fiber_g: 0,
            sugar_g: 0,
            sodium_mg: 0,
            cholesterol_mg: 0,
            notes: "Macros por refeição gerados pela STHIA",
          };
        });
        if (foodRows.length) {
          const { error: foodsErr } = await supabase.from("diet_foods").insert(foodRows as any);
          if (foodsErr) throw foodsErr;
        }
      }

      toast.success("Cardápio salvo como rascunho na ficha do aluno");
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role={displayRole} title="Cardápio IA (beta)" subtitle="Criador paralelo com STHIA Cloud">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT: brief */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Search className="w-4 h-4 text-primary" /> Aluno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Buscar por nome ou e-mail (2+ letras)"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              {studentSearch.trim().length >= 2 && !selectedStudent && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.slice(0, 20).map((s) => (
                    <button
                      key={s.user_id}
                      onClick={() => pickStudent(s)}
                      className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                    >
                      <div className="font-medium">{s.full_name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-xs text-muted-foreground">Nenhum encontrado.</p>}
                </div>
              )}
              {selectedStudent && (
                <div className="p-3 rounded bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{selectedStudent.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.weight ? `${selectedStudent.weight}kg` : ""} {selectedStudent.objective || ""}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedStudent(null); setStudentSearch(""); }}>
                      Trocar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <Badge variant="outline">{selectedStudent.daily_calories ? `${Math.round(selectedStudent.daily_calories)} kcal` : "kcal —"}</Badge>
                    <Badge variant="outline">P {selectedStudent.protein_g ? Math.round(selectedStudent.protein_g) : "—"}g</Badge>
                    <Badge variant="outline">C {selectedStudent.carbs_g ? Math.round(selectedStudent.carbs_g) : "—"}g</Badge>
                    <Badge variant="outline">G {selectedStudent.fat_g ? Math.round(selectedStudent.fat_g) : "—"}g</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => applyStudentMacros(selectedStudent)}>
                    <Download className="w-3 h-3 mr-1" /> Puxar macros do aluno para o briefing
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={pullProtocol}>
                    <FileText className="w-3 h-3 mr-1" /> Puxar protocolo do aluno
                  </Button>
                  {protocolText && (
                    <div className="rounded border border-border bg-background/60 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium truncate">{protocolTitle}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">Usar</span>
                          <Switch checked={useProtocol} onCheckedChange={setUseProtocol} />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {protocolText.slice(0, 900)}
                      </p>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setProtocolText(""); setProtocolTitle(""); }}>
                        Remover protocolo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" /> Briefing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Objetivo</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="recomposicao">Recomposição</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Kcal alvo</Label>
                  <Input type="number" value={kcalTarget} onChange={(e) => setKcalTarget(e.target.value)} placeholder="2500" />
                </div>
                <div>
                  <Label className="text-xs">Nº refeições</Label>
                  <Input type="number" value={numMeals} onChange={(e) => setNumMeals(e.target.value)} placeholder="5" />
                </div>
                <div>
                  <Label className="text-xs">Proteína (g)</Label>
                  <Input type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} placeholder="180" />
                </div>
                <div>
                  <Label className="text-xs">Carbo (g)</Label>
                  <Input type="number" value={carbsTarget} onChange={(e) => setCarbsTarget(e.target.value)} placeholder="300" />
                </div>
                <div>
                  <Label className="text-xs">Lipídio (g)</Label>
                  <Input type="number" value={fatTarget} onChange={(e) => setFatTarget(e.target.value)} placeholder="70" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Restrições</Label>
                <Input value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Sem lactose, sem glúten..." />
              </div>
              <div>
                <Label className="text-xs">Preferências</Label>
                <Input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="Gosta de tapioca, salmão, ovos..." />
              </div>
              <div>
                <Label className="text-xs">Observações livres (prompt)</Label>
                <Textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Ex: dividir carbo em 4 refeições, colocar pré-treino sólido, ceia com whey + pasta de amendoim..."
                  rows={4}
                />
              </div>

              <Button
                variant="secondary"
                onClick={() => adviceMut.mutate()}
                disabled={adviceMut.isPending}
                className="w-full"
              >
                {adviceMut.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Consultando...</>
                ) : (
                  <><Stethoscope className="w-4 h-4 mr-2" /> Gerar orientação — consulta STHIA</>
                )}
              </Button>
              <Button
                onClick={() => generateMut.mutate({})}
                disabled={generateMut.isPending}
                className="w-full"
              >
                {generateMut.isPending ? (
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>STHIA Processando...</span>
                      <span>6.0% Tolerância</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                      <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full origin-left" />
                    </div>
                    <div className="flex items-center justify-center gap-2 py-1 text-xs text-primary animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Consultando FatSecret & TACO...
                    </div>
                  </div>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Gerar cardápio com STHIA</>
                )}
              </Button>
              {selectedStudent && (
                <div className="flex items-center justify-between rounded border border-border p-2 text-xs">
                  <div>
                    <p className="font-medium">Analisar fotos de evolução</p>
                    <p className="text-muted-foreground">STHIA observa as últimas fotos (frente/costas/perfil) para calibrar o cardápio. Briefing tem prioridade.</p>
                  </div>
                  <Switch checked={usePhotos} onCheckedChange={setUsePhotos} />
                </div>
              )}
              {selectedStudent && (
                <Button variant="outline" size="sm" className="w-full" onClick={saveMacrosToProfile}>
                  <UserCog className="w-4 h-4 mr-2" /> Salvar macros no perfil do aluno
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: result */}
        <div className="xl:col-span-3 space-y-4">
          {selectedStudent && consultHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex flex-wrap items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Histórico de orientações — {selectedStudent.full_name}
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Lock className="w-3 h-3" /> Visível só para admin/consultor
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(consultHistory as any[]).map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleString("pt-BR")}
                          {c.protocol_title ? ` · protocolo: ${c.protocol_title}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdvice({
                              advice_html: c.advice_html,
                              key_points: (c.key_points || []) as string[],
                              cautions: (c.cautions || []) as string[],
                            });
                            setUseAdvice(true);
                            toast.success("Orientação carregada do histórico");
                          }}
                        >
                          Reabrir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!window.confirm("Excluir esta orientação do histórico?")) return;
                            const { error } = await supabase.from("diet_consultations").delete().eq("id", c.id);
                            if (error) return toast.error("Falha ao excluir");
                            refetchHistory();
                            toast.success("Orientação excluída");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {advice && (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" /> Orientação — consulta STHIA
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Usar como base</span>
                    <Switch checked={useAdvice} onCheckedChange={setUseAdvice} />
                    <Button size="sm" variant="outline" onClick={() => adviceMut.mutate()} disabled={adviceMut.isPending}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Reconsultar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm max-h-[420px] overflow-y-auto rounded-lg border border-border bg-card p-4"
                  dangerouslySetInnerHTML={{ __html: advice.advice_html || "" }}
                />
                {advice.key_points?.length ? (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Pontos-chave</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {advice.key_points.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </div>
                ) : null}
                {advice.cautions?.length ? (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Cuidados</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {advice.cautions.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs">Ratificar / complementar o briefing antes de gerar o cardápio</Label>
                  <Textarea
                    rows={3}
                    value={adviceExtra}
                    onChange={(e) => setAdviceExtra(e.target.value)}
                    placeholder="Ex: manter a estratégia da consulta, mas trocar o pré-treino por tapioca e reduzir lactose..."
                  />
                  <Button
                    className="w-full"
                    onClick={() => generateMut.mutate({})}
                    disabled={generateMut.isPending}
                  >
                    {generateMut.isPending ? (
                      <div className="space-y-2 w-full">
                        <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                          <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full origin-left" />
                        </div>
                        <p className="text-[10px] text-center text-primary animate-pulse">Sincronizando com FatSecret & TACO...</p>
                      </div>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" /> Gerar cardápio ratificando a orientação</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!result && !advice && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                Puxe macros/protocolo do aluno, gere a <span className="font-medium">orientação de consulta</span> e depois o <span className="font-medium">cardápio</span>.
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Cardápio gerado
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => generateMut.mutate({})} disabled={generateMut.isPending}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Regerar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending}>
                        {reviewMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-1" />}
                        Revisar com IA
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveToStudent}
                        disabled={saving}
                        title={!selectedStudent ? "Selecione um aluno na coluna da esquerda para salvar" : undefined}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? "Salvando..." : selectedStudent ? "Salvar como rascunho" : "Selecionar aluno e salvar"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(["energy_kcal","protein_g","carbs_g","fat_g"] as const).map((k) => {
                      const label = k === "energy_kcal" ? "kcal" : k === "protein_g" ? "P" : k === "carbs_g" ? "C" : "G";
                      const val = Math.round((result.total as any)[k]);
                      const target = result.targets?.[k] ?? null;
                      const dev = result.deviation_pct?.[k];
                      const off = typeof dev === "number" && Math.abs(dev) > 3;
                      return (
                        <Badge key={k} variant={off ? "destructive" : "outline"} title={target ? `Meta: ${target}${k === "energy_kcal" ? " kcal" : "g"} · Δ ${dev}%` : undefined}>
                          {label === "kcal" ? `${val} kcal` : `${label} ${val}g`}
                          {target ? ` / ${target}${k === "energy_kcal" ? "" : "g"}` : ""}
                          {typeof dev === "number" ? ` (${dev > 0 ? "+" : ""}${dev}%)` : ""}
                        </Badge>
                      );
                    })}
                    {result.hydration_l && <Badge variant="outline">💧 {result.hydration_l}L</Badge>}
                    {result._meta?.photos_used ? <Badge variant="outline">📷 {result._meta.photos_used} foto(s) analisada(s)</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border bg-card p-4 max-h-[600px] overflow-y-auto">
                    <DietContentRenderer content={result.diet_text} showHeader={false} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.meals.map((m) => (
                      <div key={m.meal_number} className="p-3 rounded border border-border text-xs">
                        <div className="font-medium mb-1">Refeição {m.meal_number} — {m.meal_name}</div>
                        <div className="text-muted-foreground">
                          {Math.round(m.energy_kcal)} kcal · P {Math.round(m.protein_g)}g · C {Math.round(m.carbs_g)}g · G {Math.round(m.fat_g)}g
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.notes && (
                    <p className="mt-3 text-xs text-muted-foreground italic">{result.notes}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" /> Contra-resposta — corrigir este cardápio
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Achou erro no cardápio ratificado? Descreva o que está errado e a STHIA refaz corrigindo, mantendo o restante.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {counterHistory.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                      <p className="text-xs font-medium">Correções já aplicadas</p>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                        {counterHistory.map((c, i) => <li key={i}>{c}</li>)}
                      </ol>
                    </div>
                  )}
                  <Textarea
                    rows={3}
                    value={counterNote}
                    onChange={(e) => setCounterNote(e.target.value)}
                    placeholder="Ex: a refeição 3 está com carboidrato acima do combinado; trocar o whey da ceia por ovos; retirar lactose da refeição 1..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => generateMut.mutate({ correction: counterNote })}
                      disabled={generateMut.isPending || !counterNote.trim()}
                    >
                      {generateMut.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Corrigindo cardápio...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" /> Gerar cardápio corrigido</>
                      )}
                    </Button>
                    {counterNote.trim() && (
                      <Button variant="ghost" onClick={() => setCounterNote("")} disabled={generateMut.isPending}>
                        Limpar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {review && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-primary" /> Revisão da IA
                      <Badge>{review.overall_score}/10</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>{review.summary}</p>
                    {review.issues?.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Pontos de atenção</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {review.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                        </ul>
                      </div>
                    )}
                    {review.suggestions?.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Sugestões</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {review.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {review.revised_diet && (
                      <Button size="sm" variant="outline" onClick={applyRevised}>
                        <Wand2 className="w-4 h-4 mr-1" /> Aplicar versão revisada
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDietAI;