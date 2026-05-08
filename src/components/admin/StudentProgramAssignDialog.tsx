import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Layers, Check, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  userName?: string;
}

const StudentProgramAssignDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: programs } = useQuery({
    queryKey: ["all-programs-for-student-assign"],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_programs")
        .select("id, title, status, objective, difficulty")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
  });

  const { data: templates } = useQuery({
    queryKey: ["all-templates-by-program"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_templates").select("id, program_id").not("program_id", "is", null);
      return data || [];
    },
    enabled: open,
  });

  const { data: assignments } = useQuery({
    queryKey: ["student-assignments", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("student_workout_assignments")
        .select("id, template_id, active")
        .eq("user_id", userId);
      return data || [];
    },
    enabled: open && !!userId,
  });

  const programAssigned = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!templates || !assignments) return map;
    const activeTemplateIds = new Set(assignments.filter((a: any) => a.active).map((a: any) => a.template_id));
    (programs || []).forEach((p: any) => {
      const tIds = templates.filter((t: any) => t.program_id === p.id).map((t: any) => t.id);
      map[p.id] = tIds.length > 0 && tIds.every((id: string) => activeTemplateIds.has(id));
    });
    return map;
  }, [programs, templates, assignments]);

  const assignMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!userId) throw new Error("Aluno inválido");
      const tIds = (templates || []).filter((t: any) => t.program_id === programId).map((t: any) => t.id);
      if (!tIds.length) throw new Error("Programa sem treinos. Adicione treinos antes de atribuir.");
      const rows = tIds.map((templateId) => ({
        user_id: userId, template_id: templateId, assigned_by: user!.id, active: true, seen_by_student: false,
      }));
      const { error } = await supabase
        .from("student_workout_assignments")
        .upsert(rows as any, { onConflict: "user_id,template_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Programa atribuído ao aluno!");
      qc.invalidateQueries({ queryKey: ["student-assignments", userId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atribuir."),
  });

  const unassignMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!userId) throw new Error("Aluno inválido");
      const tIds = (templates || []).filter((t: any) => t.program_id === programId).map((t: any) => t.id);
      if (!tIds.length) return;
      const { error } = await supabase
        .from("student_workout_assignments")
        .delete()
        .eq("user_id", userId)
        .in("template_id", tIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Programa removido do aluno.");
      qc.invalidateQueries({ queryKey: ["student-assignments", userId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao desatribuir."),
  });

  const pending = assignMutation.isPending || unassignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Programas de Treino
          </DialogTitle>
          {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto divide-y border rounded-lg">
          {(programs || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum programa criado.</p>
          )}
          {(programs || []).map((p: any) => {
            const assigned = programAssigned[p.id];
            const tCount = (templates || []).filter((t: any) => t.program_id === p.id).length;
            return (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    {p.status === "draft" && <Badge variant="secondary" className="text-[10px]">Rascunho</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{tCount} treino(s)</p>
                </div>
                {assigned ? (
                  <Button size="sm" variant="outline" disabled={pending}
                    onClick={() => unassignMutation.mutate(p.id)}>
                    {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />} Desatribuir
                  </Button>
                ) : (
                  <Button size="sm" disabled={pending || tCount === 0}
                    onClick={() => assignMutation.mutate(p.id)}>
                    {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Atribuir
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgramAssignDialog;