import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Save, Search, RefreshCw, ClipboardCheck, Wand2, Download, UserCog } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
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

const stripMealMacroLines = (html: string) =>
  (html || "")
    .replace(/<p[^>]*>\s*(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o[\s\S]*?<\/p>\s*/gi, "")
    .replace(
      /(?:<[^>]+>\s*)*Macros\s+da\s+Refei[cç][aã]o\s*\d*\s*:\s*\d+\s*kcal\s*\|\s*P\s*:\s*\d+\s*g\s*\|\s*C\s*:\s*\d+\s*g\s*\|\s*G\s*:\s*\d+\s*g\s*(?:<[^>]+>\s*)*/gi,
      "",
    );

const AdminDietAI = () => {
  const { role, user } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";

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

  const [result, setResult] = useState<GenResult | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [saving, setSaving] = useState(false);

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

  const applyStudentMacros = (s: any) => {
    if (s?.daily_calories) setKcalTarget(String(Math.round(s.daily_calories)));
    if (s?.protein_g) setProteinTarget(String(Math.round(s.protein_g)));
    if (s?.carbs_g) setCarbsTarget(String(Math.round(s.carbs_g)));
    if (s?.fat_g) setFatTarget(String(Math.round(s.fat_g)));
    if (s?.objective) setObjective(s.objective);
  };

  const pickStudent = async (s: any) => {
    setSelectedStudent(s);
    // Não auto-preenche o briefing — o admin decide via botão "Puxar macros"
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
    mutationFn: async () => {
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
        body: { mode: "generate", brief, freeText, studentId: selectedStudent?.user_id || null, includePhotos: usePhotos },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as GenResult;
    },
    onSuccess: (data) => {
      setResult({ ...data, diet_text: stripMealMacroLines(data.diet_text) });
      setReview(null);
      toast.success("Cardápio gerado pela STHIA");
    },
    onError: (e: any) => toast.error(e.message || "Falha ao gerar"),
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
    if (!selectedStudent || !result) return;
    const defaultName = `Dieta IA — ${new Date().toLocaleDateString("pt-BR")}`;
    const name = window.prompt("Nome do rascunho da dieta:", defaultName);
    if (name === null) return; // cancelado
    const title = name.trim() || defaultName;
    setSaving(true);
    try {
      const cleanContent = stripMealMacroLines(result.diet_text || "");

      const { error } = await supabase.from("student_diets").insert({
        user_id: selectedStudent.user_id,
        title,
        tab_label: title,
        content: cleanContent,
        energy_kcal: result.total.energy_kcal,
        protein_g: result.total.protein_g,
        carbs_g: result.total.carbs_g,
        fat_g: result.total.fat_g,
        hydration_l: result.hydration_l || null,
      } as any);
      if (error) throw error;
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
                onClick={() => generateMut.mutate()}
                disabled={generateMut.isPending}
                className="w-full"
              >
                {generateMut.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
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
          {!result && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                Preencha o briefing e clique em <span className="font-medium">Gerar cardápio</span> para começar.
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
                      <Button size="sm" variant="outline" onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Regerar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending}>
                        {reviewMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-1" />}
                        Revisar com IA
                      </Button>
                      <Button size="sm" onClick={saveToStudent} disabled={saving || !selectedStudent}>
                        <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar como rascunho"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline">{Math.round(result.total.energy_kcal)} kcal</Badge>
                    <Badge variant="outline">P {Math.round(result.total.protein_g)}g</Badge>
                    <Badge variant="outline">C {Math.round(result.total.carbs_g)}g</Badge>
                    <Badge variant="outline">G {Math.round(result.total.fat_g)}g</Badge>
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