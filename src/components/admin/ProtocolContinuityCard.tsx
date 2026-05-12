import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  studentUserId: string;
}

const ProtocolContinuityCard = ({ studentUserId }: Props) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["admin-continuity", studentUserId],
    queryFn: async () => {
      const [{ data: subs }, { data: decisions }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, start_date, end_date, created_at, plan_id, plans(name, duration_days)")
          .eq("user_id", studentUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("protocol_continuity_decisions" as any)
          .select("*")
          .eq("user_id", studentUserId),
      ]);
      return { subs: subs || [], decisions: (decisions as any[]) || [] };
    },
    enabled: !!studentUserId,
  });

  const lastSub = data?.subs?.[0];
  const lastDecision = data?.decisions.find((d) => d.subscription_id === lastSub?.id);

  const decide = useMutation({
    mutationFn: async (decision: "continue" | "restart") => {
      const { error } = await supabase
        .from("protocol_continuity_decisions" as any)
        .update({
          decision,
          decided_by: user?.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", lastDecision.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Decisão registrada.");
      qc.invalidateQueries({ queryKey: ["admin-continuity", studentUserId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao registrar decisão."),
  });

  if (!lastDecision) return null;

  const gap = lastDecision.gap_days ?? 0;
  const planDays = (lastSub as any)?.plans?.duration_days ?? 0;
  const baseWeeks = planDays > 0 ? Math.max(1, Math.floor((planDays * 4) / 30)) : 0;

  // Pending decision: renewal > 15 days, ask admin
  if (lastDecision.decision === "pending") {
    return (
      <Card className="border-amber-500/40 bg-amber-500/[0.06]">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Renovação em {gap} dias</Badge>
            <span className="text-sm font-medium">Dar continuidade ao protocolo anterior?</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A renovação ocorreu após 15 dias. Decida se o protocolo continua de onde parou (libera semanas adicionais) ou reinicia (semanas 1 a {baseWeeks}).
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => decide.mutate("continue")} disabled={decide.isPending}>
              Continuar protocolo
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide.mutate("restart")} disabled={decide.isPending}>
              Reiniciar (semanas 1-{baseWeeks})
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Auto continued or admin chose continue: remind to update HTML if needed
  if (lastDecision.decision === "auto_continue" || lastDecision.decision === "continue") {
    const totalDays = (data?.subs || []).reduce((acc, s: any) => acc + (s.plans?.duration_days || 0), 0);
    const cumulativeWeeks = Math.max(1, Math.floor((totalDays * 4) / 30));
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/[0.05]">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Protocolo continuado</span> — semanas liberadas: 1 a {cumulativeWeeks} (gap de renovação: {gap} dias).
            {cumulativeWeeks > baseWeeks && " Considere atualizar o HTML do protocolo para incluir as semanas adicionais conforme a evolução do aluno."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ProtocolContinuityCard;
