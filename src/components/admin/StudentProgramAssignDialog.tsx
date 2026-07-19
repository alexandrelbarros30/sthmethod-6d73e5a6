import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Layers, Check, X, Loader2, Calendar, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  userName?: string;
}

const StudentProgramAssignDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>("");
  const [editingWindows, setEditingWindows] = useState<Record<string, { start: string; end: string }>>({});

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
      const { data } = await supabase.from("workout_templates").select("id, program_id, title").not("program_id", "is", null);
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
        .select("id, template_id, active, start_date, end_date, visible")
        .eq("user_id", userId);
      return data || [];
    },
    enabled: open && !!userId,
  });

  const programAssigned: Record<string, boolean> = {};
  if (templates && assignments) {
    const activeIds = new Set(assignments.filter((a: any) => a.active).map((a: any) => a.template_id));
    (programs || []).forEach((p: any) => {
      const tIds = templates.filter((t: any) => t.program_id === p.id).map((t: any) => t.id);
      programAssigned[p.id] = tIds.length > 0 && tIds.every((id: string) => activeIds.has(id));
    });
  }

  const templateTitle = (id: string) => (templates || []).find((t: any) => t.id === id)?.title || "Treino";

  const assignMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!userId) throw new Error("Aluno inválido");
      const tIds = (templates || []).filter((t: any) => t.program_id === programId).map((t: any) => t.id);
      if (!tIds.length) throw new Error("Programa sem treinos. Adicione treinos antes de atribuir.");
      const rows = tIds.map((templateId) => ({
        user_id: userId, template_id: templateId, assigned_by: user!.id, active: true, seen_by_student: false,
        start_date: startDate || null, end_date: endDate || null, visible: true,
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

  const updateWindow = useMutation({
    mutationFn: async ({ id, start, end }: { id: string; start: string; end: string }) => {
      const { error } = await supabase
        .from("student_workout_assignments")
        .update({ start_date: start || null, end_date: end || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Programação atualizada.");
      qc.invalidateQueries({ queryKey: ["student-assignments", userId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar programação."),
  });

  const pending = assignMutation.isPending || unassignMutation.isPending;
  const activeAssignments = (assignments || []).filter((a: any) => a.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Programas de Treino
          </DialogTitle>
          {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
        </DialogHeader>

        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5" /> Janela padrão para novas atribuições
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Liberar em</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8" />
            </div>
            <div>
              <Label className="text-[11px]">Encerrar em (opcional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Datas em branco = ativo indefinidamente. Aplicado a todos os treinos do programa atribuído agora.</p>
        </div>

        <div className="max-h-[35vh] overflow-y-auto divide-y border rounded-lg">
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

        {activeAssignments.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Programação individual dos treinos atribuídos
              </h4>
              <div className="border rounded-lg divide-y max-h-[35vh] overflow-y-auto">
                {activeAssignments.map((a: any) => {
                  const w = editingWindows[a.id] || { start: a.start_date || "", end: a.end_date || "" };
                  const dirty = w.start !== (a.start_date || "") || w.end !== (a.end_date || "");
                  return (
                    <div key={a.id} className="p-2 flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs font-medium truncate">{templateTitle(a.template_id)}</p>
                      </div>
                      <div>
                        <Label className="text-[10px]">Início</Label>
                        <Input type="date" value={w.start} className="h-7 w-[130px]"
                          onChange={(e) => setEditingWindows((p) => ({ ...p, [a.id]: { ...w, start: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Fim</Label>
                        <Input type="date" value={w.end} className="h-7 w-[130px]"
                          onChange={(e) => setEditingWindows((p) => ({ ...p, [a.id]: { ...w, end: e.target.value } }))} />
                      </div>
                      <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || updateWindow.isPending}
                        onClick={() => updateWindow.mutate({ id: a.id, start: w.start, end: w.end })}>
                        <Save className="w-3 h-3 mr-1" /> Salvar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgramAssignDialog;