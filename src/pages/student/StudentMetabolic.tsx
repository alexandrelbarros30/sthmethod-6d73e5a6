import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Microscope, AlertCircle } from "lucide-react";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { usePreviewAs } from "@/hooks/usePreviewAs";

const StudentMetabolic = () => {
  const { user } = useAuth();
  const { isActive, isLoading: guardLoading, previewUnlocked } = useSubscriptionGuard();
  const { isPreviewing } = usePreviewAs();
  const qc = useQueryClient();
  const { data: panels = [], isLoading } = useQuery({
    queryKey: ["metabolic-panel-student", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metabolic_panels")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const latestPanel = panels[0] || null;

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("metabolic_panels")
        .update({ seen_by_student: true })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metabolic-panel-student"] }),
  });

  if (!guardLoading && !isActive && !previewUnlocked && !isPreviewing) {
    return <DashboardLayout role="student" title="Painel Metabólico"><SubscriptionBlock /></DashboardLayout>;
  }

  return (
    <DashboardLayout role="student" title="Painel Metabólico">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : panels.length > 0 ? (
          panels.map((p: any) => (
            <div key={p.id} className="rounded-3xl border border-border/40 bg-background p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">Painel Metabólico</p>
                  <h3 className="text-[20px] font-semibold text-foreground tracking-[-0.025em] mt-2">Análise</h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-light tracking-tight">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <RichContentRenderer content={p.content} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-border/40 bg-background py-14 px-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
            <p className="text-[14px] text-foreground font-medium tracking-tight">Nenhuma análise disponível</p>
            <p className="text-[12px] text-muted-foreground font-light mt-1.5 tracking-tight">Seu consultor publicará os resultados aqui em breve.</p>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
};

export default StudentMetabolic;
