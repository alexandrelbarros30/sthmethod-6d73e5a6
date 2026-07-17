import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Clock, AlertTriangle, History, Pencil } from "lucide-react";
import { toast } from "sonner";

type ScopeFilter = "all" | "workout" | "program";

function Stars({ value, onChange, readOnly }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(value === n ? 0 : n)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star className={`w-4 h-4 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function timeLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

const StudentFeedbackHistory = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [editing, setEditing] = useState<null | { kind: "workout" | "program"; row: any }>(null);

  const { data: sessions } = useQuery({
    queryKey: ["sfh-sessions", user?.id, from, to],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase.from("student_workout_sessions")
        .select("*, workout_templates(title, program_id, training_programs(title))")
        .eq("user_id", user!.id)
        .order("finished_at", { ascending: false });
      if (from) q = q.gte("finished_at", from);
      if (to) q = q.lte("finished_at", `${to}T23:59:59`);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: progFbs } = useQuery({
    queryKey: ["sfh-progfb", user?.id, from, to],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase.from("student_program_feedback")
        .select("*, training_programs(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", `${to}T23:59:59`);
      const { data } = await q;
      return data || [];
    },
  });

  const items = useMemo(() => {
    const wk = (sessions || []).map((s: any) => ({
      kind: "workout" as const, id: s.id, date: s.finished_at || s.started_at,
      title: s.workout_templates?.title || "Treino",
      subtitle: s.workout_templates?.training_programs?.title || null,
      difficulty: s.difficulty_rating, energy: s.energy_level, mood: s.mood_rating,
      pain: s.pain_reported, feedback: s.feedback,
      edit_deadline: s.edit_deadline, raw: s,
    }));
    const pg = (progFbs || []).map((p: any) => ({
      kind: "program" as const, id: p.id, date: p.created_at,
      title: p.training_programs?.title || "Programa",
      subtitle: null,
      difficulty: p.difficulty_rating, energy: null, mood: null,
      pain: false, feedback: [p.highlights, p.improvements, p.notes].filter(Boolean).join(" · "),
      overall: p.overall_rating, results: p.results_rating, would_repeat: p.would_repeat,
      edit_deadline: p.edit_deadline, raw: p,
    }));
    const merged = [...wk, ...pg].filter((r) => scope === "all" || r.kind === scope);
    return merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [sessions, progFbs, scope]);

  return (
    <DashboardLayout role="student" title="Meus Feedbacks" subtitle="Reveja e edite (24h) seus feedbacks.">
      <div className="space-y-4 max-w-4xl">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={scope} onValueChange={(v: ScopeFilter) => setScope(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="workout">Treino</SelectItem>
                  <SelectItem value="program">Programa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">De</Label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum feedback encontrado.</CardContent></Card>
        ) : items.map((r) => {
          const left = timeLeft(r.edit_deadline);
          const canEdit = !!left;
          return (
            <Card key={`${r.kind}-${r.id}`} className={r.pain ? "border-destructive/40" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.kind === "workout" ? "secondary" : "default"}>
                        {r.kind === "workout" ? "Treino" : "Programa"}
                      </Badge>
                      <p className="font-semibold text-foreground">{r.title}</p>
                    </div>
                    {r.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {r.date ? new Date(r.date).toLocaleString("pt-BR") : "-"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {canEdit ? (
                      <>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="w-3 h-3 mr-1" /> {left} p/ editar
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setEditing({ kind: r.kind, row: r.raw })}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Prazo encerrado</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {r.kind === "workout" ? (
                    <>
                      <div>Dificuldade: <Stars value={r.difficulty || 0} readOnly /></div>
                      <div>Energia: <Stars value={r.energy || 0} readOnly /></div>
                      <div>Humor: <Stars value={r.mood || 0} readOnly /></div>
                      <div className={r.pain ? "text-destructive font-semibold" : "text-muted-foreground"}>
                        {r.pain ? <><AlertTriangle className="inline w-3 h-3 mr-1" />Dor reportada</> : "Sem dor"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Geral: <Stars value={(r as any).overall || 0} readOnly /></div>
                      <div>Dificuldade: <Stars value={r.difficulty || 0} readOnly /></div>
                      <div>Resultados: <Stars value={(r as any).results || 0} readOnly /></div>
                      <div className="text-muted-foreground">
                        Repetiria: {(r as any).would_repeat === true ? "Sim" : (r as any).would_repeat === false ? "Não" : "-"}
                      </div>
                    </>
                  )}
                </div>
                {r.feedback && (
                  <p className="text-sm text-foreground bg-muted/30 rounded-md p-2 whitespace-pre-wrap">{r.feedback}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <EditDialog
          key={`${editing.kind}-${editing.row.id}`}
          scope={editing.kind}
          row={editing.row}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["sfh-sessions"] });
            qc.invalidateQueries({ queryKey: ["sfh-progfb"] });
            setEditing(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

function EditDialog({ scope, row, onClose, onSaved }: { scope: "workout" | "program"; row: any; onClose: () => void; onSaved: () => void }) {
  const [state, setState] = useState<any>(() => ({ ...row }));
  const save = useMutation({
    mutationFn: async () => {
      if (scope === "workout") {
        const { error } = await supabase.from("student_workout_sessions").update({
          feedback: state.feedback ?? null,
          difficulty_rating: state.difficulty_rating || null,
          energy_level: state.energy_level || null,
          mood_rating: state.mood_rating || null,
          pain_reported: !!state.pain_reported,
        }).eq("id", row.id);
        if (error) throw error;
      } else {
        if (!state.overall_rating) throw new Error("Nota geral é obrigatória.");
        const { error } = await supabase.from("student_program_feedback").update({
          overall_rating: state.overall_rating,
          difficulty_rating: state.difficulty_rating || null,
          results_rating: state.results_rating || null,
          would_repeat: state.would_repeat,
          highlights: state.highlights || null,
          improvements: state.improvements || null,
          notes: state.notes || null,
        }).eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Feedback atualizado."); onSaved(); },
    onError: (e: any) => toast.error(e?.message?.includes("row-level") ? "Prazo de edição expirado." : (e?.message || "Erro ao salvar.")),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar feedback</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {scope === "workout" ? (
            <>
              <Row label="Dificuldade"><Stars value={state.difficulty_rating || 0} onChange={(n) => setState({ ...state, difficulty_rating: n })} /></Row>
              <Row label="Energia"><Stars value={state.energy_level || 0} onChange={(n) => setState({ ...state, energy_level: n })} /></Row>
              <Row label="Humor"><Stars value={state.mood_rating || 0} onChange={(n) => setState({ ...state, mood_rating: n })} /></Row>
              <div className="flex items-center justify-between">
                <Label>Senti dor / desconforto</Label>
                <Switch checked={!!state.pain_reported} onCheckedChange={(v) => setState({ ...state, pain_reported: v })} />
              </div>
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea rows={4} value={state.feedback || ""} onChange={(e) => setState({ ...state, feedback: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              <Row label="Nota geral"><Stars value={state.overall_rating || 0} onChange={(n) => setState({ ...state, overall_rating: n })} /></Row>
              <Row label="Dificuldade"><Stars value={state.difficulty_rating || 0} onChange={(n) => setState({ ...state, difficulty_rating: n })} /></Row>
              <Row label="Resultados"><Stars value={state.results_rating || 0} onChange={(n) => setState({ ...state, results_rating: n })} /></Row>
              <div className="flex items-center justify-between">
                <Label>Repetiria?</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant={state.would_repeat === true ? "default" : "outline"} onClick={() => setState({ ...state, would_repeat: state.would_repeat === true ? null : true })}>Sim</Button>
                  <Button size="sm" variant={state.would_repeat === false ? "default" : "outline"} onClick={() => setState({ ...state, would_repeat: state.would_repeat === false ? null : false })}>Não</Button>
                </div>
              </div>
              <div><Label className="text-xs">Destaques</Label><Textarea rows={2} value={state.highlights || ""} onChange={(e) => setState({ ...state, highlights: e.target.value })} /></div>
              <div><Label className="text-xs">Melhorias</Label><Textarea rows={2} value={state.improvements || ""} onChange={(e) => setState({ ...state, improvements: e.target.value })} /></div>
              <div><Label className="text-xs">Observações</Label><Textarea rows={2} value={state.notes || ""} onChange={(e) => setState({ ...state, notes: e.target.value })} /></div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export default StudentFeedbackHistory;