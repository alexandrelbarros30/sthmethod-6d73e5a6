import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ClipboardCheck, Loader2, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSearch } from "@/lib/utils";
import { toast } from "sonner";

type MealRow = {
  meal_number: number;
  meal_name: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  _source?: "taco" | "fatsecret";
};

type AnalyzeResult = {
  meals: MealRow[];
  total: { energy_kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  _meta?: {
    model?: string;
    usage?: any;
    fatsecret?: {
      meals_reconciled?: number;
      per_meal?: Array<{ meal_number: number; source: string; items_resolved?: number; items_total?: number; reason?: string }>;
      skipped?: Array<{ meal_number: number; reason: string }>;
    };
  };
};

const AdminDietAudit = () => {
  const { user, role } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["audit-students", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase.from("profiles").select("user_id, full_name, email");
      if (displayRole === "consultor") {
        const { data: links } = await supabase.from("consultant_students").select("student_id").eq("consultant_id", user.id);
        const ids = (links || []).map((l: any) => l.student_id);
        if (!ids.length) return [];
        q = q.in("user_id", ids);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: diets = [] } = useQuery({
    queryKey: ["audit-diets", selectedStudent?.user_id],
    queryFn: async () => {
      if (!selectedStudent?.user_id) return [];
      const { data } = await supabase
        .from("student_diets")
        .select("id, title, content, updated_at, is_active, energy_kcal, protein_g, carbs_g, fat_g")
        .eq("user_id", selectedStudent.user_id)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedStudent?.user_id,
  });

  const filtered = search.trim().length < 2
    ? []
    : students.filter((s: any) => {
        const q = normalizeSearch(search);
        return normalizeSearch(s.full_name || "").includes(q) || normalizeSearch(s.email || "").includes(q);
      });

  const analyze = async (diet: any) => {
    if (!diet?.content?.replace(/<[^>]+>/g, "").trim()) {
      toast.error("Dieta sem conteúdo para auditar.");
      return;
    }
    setSelectedDiet(diet);
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-diet", {
        body: { dietContent: diet.content },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as AnalyzeResult);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao auditar dieta");
    } finally {
      setLoading(false);
    }
  };

  if (selectedDiet) {
    const fs = result?._meta?.fatsecret;
    return (
      <DashboardLayout role={displayRole} title="Auditoria FatSecret" subtitle={`${selectedStudent?.full_name} · ${selectedDiet.title}`}>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedDiet(null); setResult(null); }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button size="sm" variant="outline" onClick={() => analyze(selectedDiet)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-1" />}
            Reanalisar
          </Button>
        </div>

        {loading && (
          <Card><CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Executando analyze-diet + FatSecret...
          </CardContent></Card>
        )}

        {result && (
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Refeições reconciliadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.meals.map((m, i) => {
                  const perMeal = fs?.per_meal?.find(p => p.meal_number === m.meal_number);
                  const source = m._source || perMeal?.source || "taco";
                  const isFS = source === "fatsecret";
                  return (
                    <div key={i} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">Refeição {m.meal_number}</Badge>
                          <span className="text-xs text-muted-foreground">{m.meal_name}</span>
                        </div>
                        <Badge className={`text-[10px] ${isFS ? "bg-primary/20 text-primary border-primary/40" : "bg-muted text-muted-foreground border-border"}`}>
                          {isFS ? "FatSecret" : "TACO"}
                          {perMeal?.items_resolved != null && perMeal?.items_total != null && (
                            <span className="ml-1 opacity-70">{perMeal.items_resolved}/{perMeal.items_total}</span>
                          )}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="font-semibold text-orange-600">🔥 {Math.round(m.energy_kcal)} kcal</span>
                        <span className="font-semibold text-primary">💪 {Math.round(m.protein_g)}g P</span>
                        <span className="font-semibold text-blue-600">🍞 {Math.round(m.carbs_g)}g C</span>
                        <span className="font-semibold text-yellow-700">🥑 {Math.round(m.fat_g)}g G</span>
                      </div>
                      {perMeal?.reason && (
                        <p className="text-[10px] text-muted-foreground mt-1">Motivo: {perMeal.reason}</p>
                      )}
                    </div>
                  );
                })}

                {!!fs?.skipped?.length && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs font-semibold mb-1 text-amber-700">Skipped ({fs.skipped.length})</p>
                    <ul className="space-y-0.5">
                      {fs.skipped.map((s, i) => (
                        <li key={i} className="text-[11px] text-amber-800">
                          Refeição {s.meal_number}: {s.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Totais finais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Calorias</span><span className="font-semibold">{Math.round(result.total.energy_kcal)} kcal</span></div>
                  <div className="flex justify-between"><span>Proteína</span><span className="font-semibold">{Math.round(result.total.protein_g)} g</span></div>
                  <div className="flex justify-between"><span>Carboidrato</span><span className="font-semibold">{Math.round(result.total.carbs_g)} g</span></div>
                  <div className="flex justify-between"><span>Gordura</span><span className="font-semibold">{Math.round(result.total.fat_g)} g</span></div>
                </div>

                <div className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <p className="font-semibold mb-1">Metadados</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Modelo</span><span>{result._meta?.model || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Refeições reconciliadas</span><span>{fs?.meals_reconciled ?? 0}/{result.meals.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Skipped</span><span>{fs?.skipped?.length ?? 0}</span></div>
                </div>

                {selectedDiet.energy_kcal != null && (
                  <div className="rounded-lg border border-dashed border-border p-3 text-xs">
                    <p className="font-semibold mb-1">Valores salvos na dieta</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">kcal</span><span>{Math.round(Number(selectedDiet.energy_kcal))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Prot</span><span>{Math.round(Number(selectedDiet.protein_g || 0))} g</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Carb</span><span>{Math.round(Number(selectedDiet.carbs_g || 0))} g</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gord</span><span>{Math.round(Number(selectedDiet.fat_g || 0))} g</span></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    );
  }

  if (selectedStudent) {
    return (
      <DashboardLayout role={displayRole} title="Auditoria FatSecret" subtitle={selectedStudent.full_name}>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-display">Selecione uma dieta para auditar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diets.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma dieta salva.</p>}
            {diets.map((d: any) => (
              <button
                key={d.id}
                onClick={() => analyze(d)}
                className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{d.title} {d.is_active && <Badge variant="secondary" className="ml-1 text-[9px]">ativa</Badge>}</p>
                  <p className="text-[11px] text-muted-foreground">
                    atualizada em {new Date(d.updated_at).toLocaleString("pt-BR")}
                    {d.energy_kcal != null && ` · ${Math.round(Number(d.energy_kcal))} kcal salvas`}
                  </p>
                </div>
                <ClipboardCheck className="w-4 h-4 text-primary" />
              </button>
            ))}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={displayRole} title="Auditoria FatSecret" subtitle="Reconciliação por refeição (TACO vs FatSecret)">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Selecione um aluno
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {search.trim().length < 2 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Digite pelo menos 2 caracteres.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s: any) => (
                <button
                  key={s.user_id}
                  onClick={() => setSelectedStudent(s)}
                  className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <p className="text-sm font-medium break-words">{s.full_name || "Sem nome"}</p>
                  <p className="text-[11px] text-muted-foreground break-words">{s.email}</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-8">Nenhum aluno encontrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDietAudit;