import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, Apple, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NutritionMealBuilder, { type MealData, computeTotalsFromMeals } from "@/components/nutrition/NutritionMealBuilder";
import NutritionSummaryPanel, { type NutritionTotals } from "@/components/nutrition/NutritionSummaryPanel";
import NutritionPdfPreview from "@/components/nutrition/NutritionPdfPreview";
import { normalizeSearch } from "@/lib/utils";

const AdminNutrition = () => {
  const { role, user } = useAuth();
  const displayRole = role === "consultor" ? "consultor" : "admin";
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [localMeals, setLocalMeals] = useState<MealData[]>([]);
  const [localTotals, setLocalTotals] = useState<NutritionTotals | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const handleMealsChange = useCallback((meals: MealData[]) => {
    setLocalMeals(meals);
    setLocalTotals(meals.length > 0 ? computeTotalsFromMeals(meals) : null);
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ["nutrition-students", displayRole, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let profilesQuery = supabase
        .from("profiles")
        .select("user_id, full_name, email, weight, tdee, daily_calories, objective, protein_g, carbs_g, fat_g");

      if (displayRole === "consultor") {
        const { data: links, error: linksError } = await supabase
          .from("consultant_students")
          .select("student_id")
          .eq("consultant_id", user.id);

        if (linksError) throw linksError;

        const studentIds = (links || []).map((link: any) => link.student_id);
        if (studentIds.length === 0) return [];
        profilesQuery = profilesQuery.in("user_id", studentIds);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      return (profiles || []).map((p: any) => ({
        ...p,
        initials: p.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?",
      }));
    },
    enabled: !!user?.id,
  });

  const filtered = search.trim().length < 2
    ? []
    : students.filter((s: any) => {
        const q = normalizeSearch(search);
        return normalizeSearch(s.full_name).includes(q) || normalizeSearch(s.email).includes(q);
      });

  if (selectedStudent) {
    return (
      <DashboardLayout role={displayRole} title="Cardápio Nutricional" subtitle={selectedStudent.full_name}>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)} disabled={localMeals.every(m => m.foods.length === 0)}>
            <FileDown className="w-4 h-4 mr-1" /> Gerar PDF
          </Button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <NutritionMealBuilder
              studentId={selectedStudent.user_id}
              studentName={selectedStudent.full_name}
              onMealsChange={handleMealsChange}
            />
          </div>
          <div>
            <NutritionSummaryPanel
              studentId={selectedStudent.user_id}
              weight={selectedStudent.weight}
              tdee={selectedStudent.tdee}
              objective={selectedStudent.objective}
              totals={localTotals}
            />
          </div>
        </div>
        <NutritionPdfPreview
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          meals={localMeals}
          totals={localTotals}
          studentName={selectedStudent.full_name}
          weight={selectedStudent.weight}
          tdee={selectedStudent.tdee}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={displayRole} title="Cardápio Nutricional" subtitle="Monte cardápios com dados TACO/TBCA">
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Apple className="w-5 h-5 text-primary" /> Selecione um Aluno
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {search.trim().length < 2 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Digite pelo menos 2 caracteres para buscar alunos.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s: any) => (
                <button key={s.user_id} onClick={() => setSelectedStudent(s)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{s.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm font-body break-words">{s.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground font-body break-words">{s.email}</p>
                    {s.weight && <p className="text-xs text-muted-foreground mt-0.5">{s.weight}kg</p>}
                  </div>
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

export default AdminNutrition;
