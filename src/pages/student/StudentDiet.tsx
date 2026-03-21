import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, Download } from "lucide-react";
import DietContentRenderer, { type DietStudentInfo } from "@/components/student/DietContentRenderer";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateStudentPDF, canDownloadPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

const useContentProtection = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.metaKey && e.key === "p") || (e.ctrlKey && e.key === "c") || (e.metaKey && e.key === "c")) {
        e.preventDefault();
        document.body.style.filter = "blur(20px)";
        setTimeout(() => { document.body.style.filter = "none"; }, 1500);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        document.body.style.filter = "blur(20px)";
        navigator.clipboard.writeText("").catch(() => {});
        setTimeout(() => { document.body.style.filter = "none"; }, 1500);
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleVisibilityChange = () => {
      document.body.style.filter = document.visibilityState === "hidden" ? "blur(20px)" : "none";
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.style.filter = "none";
    };
  }, []);
};

const StudentDiet = () => {
  useContentProtection();
  const { user } = useAuth();
  const { isActive, isLoading: subLoading, subscription } = useSubscriptionGuard();

  const { data: diets, isLoading } = useQuery({
    queryKey: ["student-diets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_diets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("visible", true)
        .or(`release_date.is.null,release_date.lte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && isActive,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const buildStudentInfo = (diet: any): DietStudentInfo | undefined => {
    if (!profile) return undefined;
    const age = profile.birth_date
      ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
    // Use diet-level macros if available, otherwise fall back to profile
    const energy = diet.energy_kcal ?? profile.daily_calories ?? undefined;
    const protein = diet.protein_g ?? profile.protein_g ?? undefined;
    const carbs = diet.carbs_g ?? profile.carbs_g ?? undefined;
    const fat = diet.fat_g ?? profile.fat_g ?? undefined;
    // Only include macros if at least one value exists
    const hasMacros = energy || protein || carbs || fat;
    return {
      name: profile.full_name || undefined,
      age,
      weight: profile.weight || undefined,
      height: profile.height || undefined,
      objective: profile.objective || undefined,
      startDate: new Date(diet.created_at).toLocaleDateString("pt-BR"),
      hydration: diet.hydration_l ? `${diet.hydration_l} litros` : undefined,
      totalEnergy: hasMacros ? energy : undefined,
      protein: hasMacros ? protein : undefined,
      carbs: hasMacros ? carbs : undefined,
      fat: hasMacros ? fat : undefined,
    };
  };

  const handleDownloadPDF = async (diet: any) => {
    try {
      const blob = await generateStudentPDF({
        type: 'diet',
        title: diet.title,
        content: diet.content || 'Conteúdo não disponível',
        studentInfo: {
          name: profile?.full_name || 'Aluno',
          age: profile?.birth_date ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
          weight: profile?.weight || undefined,
          height: profile?.height ? (profile.height / 100) : undefined,
          goal: profile?.objective || undefined,
        },
        createdAt: diet.created_at,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${diet.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(diet.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const canDownload = canDownloadPDF(subscription?.plans?.name);

  if (subLoading || isLoading) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <p className="text-muted-foreground font-body text-sm">Carregando...</p>
      </DashboardLayout>
    );
  }

  if (!isActive) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <SubscriptionBlock />
      </DashboardLayout>
    );
  }

  if (!diets || diets.length === 0) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <Card><CardContent className="py-8 text-center">
          <p className="text-muted-foreground font-body">Nenhuma dieta configurada ainda. Aguarde seu consultor.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
      <style>{`
        @media print { .content-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .content-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-4 max-w-4xl content-protected">
        <h3 className="text-sm font-semibold text-muted-foreground font-display flex items-center gap-2">
          <Clock className="w-4 h-4" /> Histórico de Dietas ({diets.length})
        </h3>

        {diets.map((diet: any) => (
          <Card key={diet.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-display">{diet.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {new Date(diet.created_at).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(diet.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                </div>
                {canDownload && diet.content && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(diet)}
                    className="h-7 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
                {/* Student info header + macros */}
                {profile && (
                  <DietContentRenderer
                    content=""
                    studentInfo={buildStudentInfo(diet)}
                    showHeader={true}
                  />
                )}

                {diet.pdf_url && (
                  <div>
                    <p className="text-xs text-primary flex items-center gap-1 mb-2">
                      <FileText className="w-3 h-3" /> Documento PDF
                    </p>
                    <iframe
                      src={diet.pdf_url}
                      className="w-full h-[500px] rounded-lg border border-border"
                      title="Dieta PDF"
                    />
                  </div>
                )}
                {diet.content && (
                  /<[a-z][\s\S]*>/i.test(diet.content)
                    ? <RichContentRenderer content={diet.content} />
                    : <DietContentRenderer
                        content={diet.content}
                        showHeader={false}
                      />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentDiet;
