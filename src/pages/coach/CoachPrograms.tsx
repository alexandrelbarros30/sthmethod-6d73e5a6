import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Dumbbell, Plus, Trash2 } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const GOALS = ["Hipertrofia", "Emagrecimento", "Recomposição corporal", "Condicionamento", "Força", "Performance"];

const CoachPrograms = () => {
  const qc = useQueryClient();
  const { tenant } = useCoachContext();
  const tenantId = tenant?.id;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", weeks: "4", description: "" });

  const { data: programs } = useQuery({
    queryKey: ["coach-programs", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_programs")
        .select("id, name, goal, weeks, description, created_at, coach_workouts(id), coach_student_programs(id)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("coach_programs").insert({
        tenant_id: tenantId,
        name: form.name.trim(),
        goal: form.goal.trim() || null,
        weeks: Number(form.weeks) || 4,
        description: form.description.trim() || null,
      });
      if (error) throw error;
      toast.success("Programa criado");
      setOpen(false);
      setForm({ name: "", goal: "", weeks: "4", description: "" });
      qc.invalidateQueries({ queryKey: ["coach-programs"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível criar o programa");
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (program: any) => {
    if (!tenantId) return;
    try {
      const { data: newProgram, error } = await supabase.from("coach_programs").insert({
        tenant_id: tenantId,
        name: `${program.name} (cópia)`,
        goal: program.goal,
        weeks: program.weeks,
        description: program.description,
      }).select("id").single();
      if (error) throw error;

      const { data: workouts } = await supabase
        .from("coach_workouts")
        .select("id, name, day_label, notes, order_index")
        .eq("program_id", program.id)
        .order("order_index");

      for (const w of workouts || []) {
        const { data: nw } = await supabase.from("coach_workouts").insert({
          tenant_id: tenantId, program_id: newProgram.id,
          name: w.name, day_label: w.day_label, notes: w.notes, order_index: w.order_index,
        }).select("id").single();
        const { data: exs } = await supabase
          .from("coach_workout_exercises")
          .select("name, source, media_url, thumb_url, muscle_group, sets, reps, load_text, rest_seconds, tempo, group_type, group_key, notes, order_index")
          .eq("workout_id", w.id)
          .order("order_index");
        if (nw && exs?.length) {
          await supabase.from("coach_workout_exercises").insert(
            exs.map((ex: any) => ({ ...ex, tenant_id: tenantId, workout_id: nw.id }))
          );
        }
      }
      toast.success("Programa duplicado");
      qc.invalidateQueries({ queryKey: ["coach-programs"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível duplicar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este programa e todos os seus treinos?")) return;
    const { error } = await supabase.from("coach_programs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Programa excluído");
    qc.invalidateQueries({ queryKey: ["coach-programs"] });
  };

  return (
    <CoachLayout
      title="Treinos"
      subtitle="Monte programas de treino e atribua para cada aluno."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-1.5" /> Novo programa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo programa de treino</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div>
                <Label className="text-[12px]">Nome do programa</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex.: Hipertrofia 1.0" className="mt-1.5 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px]">Objetivo</Label>
                  <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Hipertrofia" className="mt-1.5 rounded-xl" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {GOALS.map((g) => (
                      <button key={g} type="button" onClick={() => setForm({ ...form, goal: g })}
                        className="text-[11px] rounded-full border border-border/70 px-2.5 py-1 hover:bg-muted">
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[12px]">Duração (semanas)</Label>
                  <Input type="number" min={1} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })} className="mt-1.5 rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-[12px]">Descrição / orientações</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5 rounded-xl" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-xl">
                {saving ? "Criando…" : "Criar programa"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {!programs?.length ? (
        <Card className="p-10 rounded-2xl border-border/60 text-center">
          <Dumbbell className="h-6 w-6 text-primary mx-auto mb-3" strokeWidth={1.8} />
          <p className="text-[14px] font-semibold tracking-[-0.02em]">Nenhum programa ainda</p>
          <p className="text-[13px] text-muted-foreground font-light mt-1.5">
            Crie o primeiro programa e monte os treinos exercício por exercício.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p: any) => (
            <Card key={p.id} className="p-5 rounded-2xl border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-[-0.02em] truncate">{p.name}</p>
                  <p className="text-[12px] text-muted-foreground font-light mt-1">
                    {p.goal || "Sem objetivo definido"} · {p.weeks} semanas
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => duplicate(p)} aria-label="Duplicar">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {p.coach_workouts?.length || 0} treinos
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-normal">
                  {p.coach_student_programs?.length || 0} alunos
                </Badge>
              </div>
              <Button asChild variant="outline" className="w-full mt-4 rounded-xl">
                <Link to={`/coach/treinos/${p.id}`}>Abrir editor</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </CoachLayout>
  );
};

export default CoachPrograms;