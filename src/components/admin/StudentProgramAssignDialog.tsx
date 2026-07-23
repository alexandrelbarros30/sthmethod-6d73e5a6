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
import { Layers, Check, X, Loader2, Calendar, Save, Dumbbell, Target, Gauge, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Search } from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const getWindowStatus = (start?: string | null, end?: string | null, visible?: boolean | null) => {
  if (visible === false) return { label: "Oculto", cls: "bg-muted text-muted-foreground border-muted" };
  const t = todayISO();
  if (start && start > t) return { label: "Agendado", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
  if (end && end < t) return { label: "Expirado", cls: "bg-red-500/15 text-red-600 border-red-500/30" };
  return { label: "Ativo", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
};

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
  const [expandedProgram, setExpandedProgram] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const normalize = (s: string) =>
    (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const { data: programs } = useQuery({
    queryKey: ["all-programs-for-student-assign"],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_programs")
        .select("id, title, status, objective, difficulty, poster_url, subtitle")
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
        .select("id, template_id, active, start_date, end_date, visible, created_at")
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
      // Espelha a atribuição no ST Coach (await para garantir disparo + surfaçar erro)
      try {
        const { data, error: sErr } = await supabase.functions.invoke(
          "supercoach-assign-program",
          { body: { userId, programId, action: "assign" } },
        );
        if (sErr || (data as any)?.ok === false) {
          toast.warning("Atribuído no STH; ST Coach falhou: " + ((data as any)?.error || sErr?.message || "erro"));
        } else if ((data as any)?.status === "assigned") {
          toast.success("Espelhado no ST Coach.");
        }
      } catch (e: any) {
        toast.warning("Atribuído no STH; ST Coach falhou: " + (e?.message || "erro"));
      }
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
      try {
        const { data, error: sErr } = await supabase.functions.invoke(
          "supercoach-assign-program",
          { body: { userId, programId, action: "unassign" } },
        );
        if (sErr || (data as any)?.ok === false) {
          toast.warning("Removido no STH; ST Coach falhou: " + ((data as any)?.error || sErr?.message || "erro"));
        } else if ((data as any)?.status === "unassigned") {
          toast.success("Removido também do ST Coach.");
        }
      } catch (e: any) {
        toast.warning("Removido no STH; ST Coach falhou: " + (e?.message || "erro"));
      }
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

  const resyncMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!userId) throw new Error("Aluno inválido");
      const { data, error } = await supabase.functions.invoke(
        "supercoach-assign-program",
        { body: { userId, programId, action: "assign" } },
      );
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Falha ao sincronizar");
      return data as any;
    },
    onSuccess: (d: any) => {
      if (d?.status === "already_assigned") toast.info("Já estava atribuído no ST Coach.");
      else toast.success("Sincronizado no ST Coach.");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao sincronizar ST Coach."),
  });

  const importFromSC = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Aluno inválido");
      const { data, error } = await supabase.functions.invoke(
        "supercoach-import-student-assignments",
        { body: { userId } },
      );
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error || "Falha ao importar");
      return data as any;
    },
    onSuccess: (d: any) => {
      if (d?.notFound && !d?.matched) {
        toast.warning("Aluno não encontrado no ST Coach.");
      } else if ((d?.programsAssigned || 0) === 0) {
        toast.info("Nenhum programa novo do ST Coach para importar.");
      } else {
        toast.success(`Importados ${d.programsAssigned} programa(s) do ST Coach (${d.templatesUpserted} treinos).`);
      }
      qc.invalidateQueries({ queryKey: ["student-assignments", userId] });
    },
    onError: (e: any) => toast.error(e.message || "Falha na importação do ST Coach."),
  });
  const activeAssignments = (assignments || []).filter((a: any) => a.active);

  // Agrupa por programa (via template.program_id) e ordena por data de atribuição (mais antiga → mais recente)
  const assignedGroups = (() => {
    if (!templates || !programs) return [] as any[];
    const byProgram: Record<string, { program: any; items: any[]; firstAssignedAt: string }> = {};
    activeAssignments.forEach((a: any) => {
      const tpl = templates.find((t: any) => t.id === a.template_id);
      if (!tpl?.program_id) return;
      const prog = programs.find((p: any) => p.id === tpl.program_id);
      if (!prog) return;
      if (!byProgram[prog.id]) byProgram[prog.id] = { program: prog, items: [], firstAssignedAt: a.created_at };
      byProgram[prog.id].items.push({ ...a, templateTitle: tpl.title });
      if (a.created_at < byProgram[prog.id].firstAssignedAt) byProgram[prog.id].firstAssignedAt = a.created_at;
    });
    return Object.values(byProgram).sort((a, b) =>
      a.firstAssignedAt < b.firstAssignedAt ? -1 : 1
    );
  })();

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Programas de Treino
          </DialogTitle>
          {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-2.5 bg-primary/5">
          <div className="min-w-0">
            <p className="text-xs font-medium">Espelhar do ST Coach</p>
            <p className="text-[10px] text-muted-foreground">Traz para o STH os programas já atribuídos a este aluno no ST Coach.</p>
          </div>
          <Button size="sm" variant="secondary" disabled={importFromSC.isPending}
            onClick={() => importFromSC.mutate()}>
            {importFromSC.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              : <Download className="w-3.5 h-3.5 mr-1" />}
            Importar
          </Button>
        </div>

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
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar programa pelo nome…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="max-h-[35vh] overflow-y-auto divide-y border rounded-lg">
          {(programs || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum programa criado.</p>
          )}
          {(() => {
            const q = normalize(search);
            const filtered = q
              ? (programs || []).filter((p: any) =>
                  normalize(p.title).includes(q) ||
                  normalize(p.subtitle || "").includes(q) ||
                  normalize(p.objective || "").includes(q)
                )
              : (programs || []);
            if ((programs || []).length > 0 && filtered.length === 0) {
              return <p className="text-xs text-muted-foreground text-center py-6">Nenhum programa encontrado para “{search}”.</p>;
            }
            return filtered.map((p: any) => {
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
            });
          })()}
        </div>

        {activeAssignments.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Programas atribuídos
                  <Badge variant="secondary" className="text-[10px]">{assignedGroups.length}</Badge>
                </h4>
                <span className="text-[10px] text-muted-foreground">ordenado por data (antigo → recente)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                {assignedGroups.map((g: any, idx: number) => {
                  const p = g.program;
                  const expanded = !!expandedProgram[p.id];
                  const agg = (() => {
                    const t = todayISO();
                    let active = 0, scheduled = 0, expired = 0, hidden = 0;
                    g.items.forEach((a: any) => {
                      if (a.visible === false) hidden++;
                      else if (a.start_date && a.start_date > t) scheduled++;
                      else if (a.end_date && a.end_date < t) expired++;
                      else active++;
                    });
                    return { active, scheduled, expired, hidden };
                  })();
                  return (
                    <div key={p.id} className="relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white text-[10px] font-semibold">
                        {idx + 1}
                      </div>
                      <div className="absolute top-2 right-2 z-10">
                        <Button size="icon" variant="destructive" className="h-7 w-7" disabled={pending}
                          onClick={() => unassignMutation.mutate(p.id)} title="Remover programa">
                          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      {p.poster_url ? (
                        <div className="h-28 w-full bg-muted overflow-hidden">
                          <img src={p.poster_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="h-20 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                          <Dumbbell className="w-8 h-8 text-primary/40" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight line-clamp-2">{p.title}</p>
                          {p.subtitle && <p className="text-[11px] text-muted-foreground line-clamp-1">{p.subtitle}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.objective && (
                            <Badge variant="outline" className="text-[10px] gap-1"><Target className="w-2.5 h-2.5" />{p.objective}</Badge>
                          )}
                          {p.difficulty && (
                            <Badge variant="outline" className="text-[10px] gap-1"><Gauge className="w-2.5 h-2.5" />{p.difficulty}</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] gap-1"><Dumbbell className="w-2.5 h-2.5" />{g.items.length} treino(s)</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {agg.active > 0 && <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">{agg.active} ativo</Badge>}
                          {agg.scheduled > 0 && <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-600 border-amber-500/30" variant="outline">{agg.scheduled} agendado</Badge>}
                          {agg.expired > 0 && <Badge className="text-[9px] px-1.5 py-0 h-4 bg-red-500/15 text-red-600 border-red-500/30" variant="outline">{agg.expired} expirado</Badge>}
                          {agg.hidden > 0 && <Badge className="text-[9px] px-1.5 py-0 h-4" variant="outline">{agg.hidden} oculto</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" /> Atribuído em <span className="font-medium text-foreground">{fmtDate(g.firstAssignedAt)}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="w-full h-7 text-[11px]"
                          onClick={() => setExpandedProgram((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}>
                          {expanded ? <><ChevronUp className="w-3 h-3 mr-1" /> Ocultar treinos</> : <><ChevronDown className="w-3 h-3 mr-1" /> Editar janelas ({g.items.length})</>}
                        </Button>
                        <Button size="sm" variant="outline" className="w-full h-7 text-[11px]"
                          disabled={resyncMutation.isPending}
                          onClick={() => resyncMutation.mutate(p.id)}
                          title="Reenvia a atribuição deste programa ao ST Coach">
                          {resyncMutation.isPending
                            ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            : <Download className="w-3 h-3 mr-1 rotate-180" />}
                          Sincronizar ST Coach
                        </Button>
                        {expanded && (
                          <div className="border-t pt-2 space-y-2">
                            {g.items
                              .slice()
                              .sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1))
                              .map((a: any) => {
                                const w = editingWindows[a.id] || { start: a.start_date || "", end: a.end_date || "" };
                                const dirty = w.start !== (a.start_date || "") || w.end !== (a.end_date || "");
                                const s = getWindowStatus(a.start_date, a.end_date, a.visible);
                                return (
                                  <div key={a.id} className="rounded-md border bg-muted/30 p-2 space-y-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-[11px] font-medium truncate flex-1">{a.templateTitle}</p>
                                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${s.cls}`}>{s.label}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <Label className="text-[9px]">Início</Label>
                                        <Input type="date" value={w.start} className="h-7 text-[11px]"
                                          onChange={(e) => setEditingWindows((pp) => ({ ...pp, [a.id]: { ...w, start: e.target.value } }))} />
                                      </div>
                                      <div>
                                        <Label className="text-[9px]">Fim</Label>
                                        <Input type="date" value={w.end} className="h-7 text-[11px]"
                                          onChange={(e) => setEditingWindows((pp) => ({ ...pp, [a.id]: { ...w, end: e.target.value } }))} />
                                      </div>
                                    </div>
                                    <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || updateWindow.isPending}
                                      className="w-full h-7 text-[10px]"
                                      onClick={() => updateWindow.mutate({ id: a.id, start: w.start, end: w.end })}>
                                      <Save className="w-3 h-3 mr-1" /> Salvar janela
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
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