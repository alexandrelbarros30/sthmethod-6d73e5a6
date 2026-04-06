import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Microscope, AlertCircle } from "lucide-react";
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const StudentMetabolic = () => {
  const { user } = useAuth();
  const { isActive, isLoading: guardLoading } = useSubscriptionGuard();
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

  if (!guardLoading && !isActive) {
    return <DashboardLayout role="student" title="Painel Metabólico"><SubscriptionBlock /></DashboardLayout>;
  }

  return (
    <DashboardLayout role="student" title="Painel Metabólico">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : panels.length > 0 ? (
          panels.map((p: any) => (
            <Card key={p.id} className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Microscope className="w-5 h-5 text-primary" />
                  Painel Metabólico
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <RichContentRenderer content={p.content} />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <AlertCircle className="w-10 h-10 opacity-40" />
                <p className="text-sm">Nenhuma análise metabólica disponível no momento.</p>
                <p className="text-xs opacity-60">Seu consultor publicará aqui os resultados assim que estiverem prontos.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </DashboardLayout>
  );
};

export default StudentMetabolic;
