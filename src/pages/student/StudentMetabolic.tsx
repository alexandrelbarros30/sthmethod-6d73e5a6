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
import RichContentRenderer from "@/components/shared/RichContentRenderer";
import { cn } from "@/lib/utils";
import { usePreviewAs } from "@/hooks/usePreviewAs";

const STH_GREEN = "hsl(142 76% 56%)";
const protocolProseClasses = cn(
  "max-w-none font-mono text-foreground/85 tracking-tight",
  "[&_p]:!font-mono [&_p]:!text-[13px] [&_p]:!leading-[1.65] [&_p]:!text-foreground/85 [&_p]:my-2",
  "[&_h1]:font-display [&_h1]:!text-[18px] [&_h1]:!leading-snug [&_h1]:!font-bold [&_h1]:!uppercase [&_h1]:tracking-tight [&_h1]:!text-foreground [&_h1]:mt-4 [&_h1]:mb-2",
  "[&_h2]:font-display [&_h2]:!text-[15px] [&_h2]:!leading-snug [&_h2]:!font-medium [&_h2]:tracking-tight [&_h2]:!text-foreground [&_h2]:mt-3 [&_h2]:mb-2",
  "[&_h3]:font-sans [&_h3]:!text-[9px] [&_h3]:!font-medium [&_h3]:tracking-[0.22em] [&_h3]:!uppercase [&_h3]:!text-[color:var(--sth-green)]/70 [&_h3]:mt-3 [&_h3]:mb-1",
  "[&_strong]:!text-foreground [&_strong]:font-semibold",
  "[&_em]:italic [&_em]:!text-foreground/75",
  "[&_u]:underline [&_u]:decoration-emerald-400/50 [&_u]:underline-offset-2",
  "[&_ul]:!list-none [&_ul]:!pl-0 [&_ul]:my-2 [&_ul]:space-y-1.5 [&_ul]:[list-style:none]",
  "[&_ol]:!list-none [&_ol]:!pl-0 [&_ol]:my-2 [&_ol]:space-y-1.5 [&_ol]:[list-style:none]",
  "[&_li]:!font-mono [&_li]:!text-[13px] [&_li]:!leading-[1.65] [&_li]:!text-foreground/85",
  "[&_li]:!list-none [&_li]:[list-style:none] [&_li]:marker:!content-none [&_li]:pl-0",
  "[&_hr]:border-white/10 [&_hr]:my-3",
  "[&_mark]:bg-emerald-400/15 [&_mark]:!text-emerald-300 [&_mark]:px-1 [&_mark]:py-0 [&_mark]:rounded",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-emerald-400/60 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:!text-foreground/70 [&_blockquote]:my-2.5 [&_blockquote]:!text-[13px] [&_blockquote]:!leading-[1.65]",
  "[&_a]:!text-emerald-300 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-emerald-400/50",
  "[&_code]:!font-mono [&_code]:!text-[12px] [&_code]:!text-emerald-300 [&_code]:bg-emerald-400/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
);

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
                {!isClosed && (
                  <div
                    className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-3.5 py-3 sm:px-4 sm:py-3.5"
                    style={{ ["--sth-green" as any]: STH_GREEN }}
                  >
                    <RichContentRenderer
                      content={p.content}
                      className={protocolProseClasses}
                      showParagraphBullets={false}
                      stripLeadingMarkers
                      showZebra={false}
                    />
                  </div>
                )}
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
