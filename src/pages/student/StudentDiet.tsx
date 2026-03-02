import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

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
  const { isActive, isLoading: subLoading } = useSubscriptionGuard();

  const { data: diet, isLoading } = useQuery({
    queryKey: ["student-diet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_diets" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isActive,
  });

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

  if (!diet) {
    return (
      <DashboardLayout role="student" title="Dieta" subtitle="Seu plano alimentar personalizado.">
        <Card><CardContent className="py-8 text-center">
          <p className="text-muted-foreground font-body">Nenhuma dieta configurada ainda. Aguarde seu consultor.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" title={(diet as any).title || "Dieta"} subtitle="Seu plano alimentar personalizado.">
      <style>{`
        @media print { .content-protected { display: none !important; } body::after { content: "Impressão não permitida"; display: flex; align-items: center; justify-content: center; font-size: 2rem; height: 100vh; } }
        .content-protected { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; -webkit-touch-callout: none; }
      `}</style>
      <div className="space-y-6 max-w-4xl content-protected">
        {(diet as any).pdf_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documento PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                src={(diet as any).pdf_url}
                className="w-full h-[600px] rounded-lg border border-border"
                title="Dieta PDF"
              />
            </CardContent>
          </Card>
        )}

        {(diet as any).content && (
          <Card>
            <CardHeader><CardTitle className="text-base font-display">Detalhes</CardTitle></CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed">
                {(diet as any).content}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDiet;
