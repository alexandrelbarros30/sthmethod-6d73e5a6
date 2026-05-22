import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBlock from "@/components/SubscriptionBlock";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Microscope, AlertCircle, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import DietContentRenderer from "@/components/student/DietContentRenderer";
import { usePreviewAs } from "@/hooks/usePreviewAs";

const StudentMetabolic = () => {
  const { user } = useAuth();
  const { isActive, isLoading: guardLoading, previewUnlocked } = useSubscriptionGuard();
  const { isPreviewing } = usePreviewAs();
  const qc = useQueryClient();
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
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
    return <DashboardLayout role="student" title="Central de Análise"><SubscriptionBlock /></DashboardLayout>;
  }

  return (
    <DashboardLayout role="student" title="Central de Análise">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : panels.length > 0 ? (
          panels.map((p: any) => {
            const isClosed = closedIds.has(p.id);
            const toggle = () => {
              setClosedIds((prev) => {
                const next = new Set(prev);
                if (next.has(p.id)) next.delete(p.id);
                else next.add(p.id);
                return next;
              });
            };
            return (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground">Central de Análise</p>
                    <p className="text-[11px] text-muted-foreground font-light tracking-tight mt-1">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                    onClick={toggle}
                    aria-label={isClosed ? "Abrir" : "Fechar"}
                  >
                    {isClosed ? <ChevronDown className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </Button>
                </div>
                {!isClosed && <DietContentRenderer content={p.content} showHeader={false} />}
              </div>
            );
          })
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
