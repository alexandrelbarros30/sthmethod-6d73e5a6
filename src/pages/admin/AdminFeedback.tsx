import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Star, AlertTriangle, History } from "lucide-react";

type ScopeFilter = "all" | "workout" | "program";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

const normalize = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const AdminFeedback = () => {
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [studentQ, setStudentQ] = useState<string>("");
  const [painOnly, setPainOnly] = useState<boolean>(false);
  const [auditRow, setAuditRow] = useState<null | { scope: "workout" | "program"; id: string; title: string }>(null);

  const { data: sessions } = useQuery({
    queryKey: ["af-sessions", from, to],
    queryFn: async () => {
      let q = supabase.from("student_workout_sessions")
        .select("*, workout_templates(title, training_programs(title)), profiles!inner(full_name, email)")
        .order("finished_at", { ascending: false })
        .limit(500);
      if (from) q = q.gte("finished_at", from);
      if (to) q = q.lte("finished_at", `${to}T23:59:59`);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: progFbs } = useQuery({
    queryKey: ["af-progfb", from, to],
    queryFn: async () => {
      let q = supabase.from("student_program_feedback")
        .select("*, training_programs(title), profiles!inner(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(500);
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
      subtitle: s.workout_templates?.training_programs?.title,
      studentName: s.profiles?.full_name || s.profiles?.email || "",
      difficulty: s.difficulty_rating, energy: s.energy_level, mood: s.mood_rating,
      pain: s.pain_reported, feedback: s.feedback,
    }));
    const pg = (progFbs || []).map((p: any) => ({
      kind: "program" as const, id: p.id, date: p.created_at,
      title: p.training_programs?.title || "Programa",
      subtitle: null as any,
      studentName: p.profiles?.full_name || p.profiles?.email || "",
      difficulty: p.difficulty_rating, energy: null, mood: null,
      pain: false,
      overall: p.overall_rating, results: p.results_rating, would_repeat: p.would_repeat,
      feedback: [p.highlights && `Destaques: ${p.highlights}`, p.improvements && `Melhorias: ${p.improvements}`, p.notes && `Obs: ${p.notes}`].filter(Boolean).join("\n"),
    }));
    let merged = [...wk, ...pg];
    if (scope !== "all") merged = merged.filter((r) => r.kind === scope);
    if (painOnly) merged = merged.filter((r) => r.pain);
    if (studentQ.trim()) {
      const q = normalize(studentQ);
      merged = merged.filter((r) => normalize(r.studentName).includes(q));
    }
    return merged.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [sessions, progFbs, scope, painOnly, studentQ]);

  return (
    <DashboardLayout role="admin" title="Feedback dos Alunos" subtitle="Histórico de treinos e programas.">
      <div className="space-y-4 max-w-6xl">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Aluno</Label>
              <Input value={studentQ} onChange={(e) => setStudentQ(e.target.value)} placeholder="Nome/email" />
            </div>
            <div className="flex items-end">
              <Button variant={painOnly ? "default" : "outline"} className="w-full" onClick={() => setPainOnly((v) => !v)}>
                <AlertTriangle className="w-4 h-4 mr-1" /> {painOnly ? "Mostrando dor" : "Só com dor"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">{items.length} registro(s)</p>

        {items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum feedback no filtro.</CardContent></Card>
        ) : items.map((r) => (
          <Card key={`${r.kind}-${r.id}`} className={r.pain ? "border-destructive/40" : ""}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={r.kind === "workout" ? "secondary" : "default"}>{r.kind === "workout" ? "Treino" : "Programa"}</Badge>
                    <p className="font-semibold text-foreground">{r.studentName}</p>
                    <span className="text-xs text-muted-foreground">· {r.title}</span>
                    {r.subtitle && <span className="text-xs text-muted-foreground">({r.subtitle})</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{r.date ? new Date(r.date).toLocaleString("pt-BR") : "-"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setAuditRow({ scope: r.kind, id: r.id, title: r.title })}>
                  <History className="w-3 h-3 mr-1" /> Auditoria
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {r.kind === "workout" ? (
                  <>
                    <div className="flex items-center gap-1">Dif: <Stars value={r.difficulty || 0} /></div>
                    <div className="flex items-center gap-1">Energia: <Stars value={r.energy || 0} /></div>
                    <div className="flex items-center gap-1">Humor: <Stars value={r.mood || 0} /></div>
                    <div className={r.pain ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {r.pain ? <><AlertTriangle className="inline w-3 h-3 mr-1" />Dor reportada</> : "Sem dor"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">Geral: <Stars value={(r as any).overall || 0} /></div>
                    <div className="flex items-center gap-1">Dif: <Stars value={r.difficulty || 0} /></div>
                    <div className="flex items-center gap-1">Resultados: <Stars value={(r as any).results || 0} /></div>
                    <div className="text-muted-foreground">Repetiria: {(r as any).would_repeat === true ? "Sim" : (r as any).would_repeat === false ? "Não" : "-"}</div>
                  </>
                )}
              </div>
              {r.feedback && <p className="text-sm text-foreground bg-muted/30 rounded-md p-2 whitespace-pre-wrap">{r.feedback}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {auditRow && (
        <AuditDialog scope={auditRow.scope} id={auditRow.id} title={auditRow.title} onClose={() => setAuditRow(null)} />
      )}
    </DashboardLayout>
  );
};

function AuditDialog({ scope, id, title, onClose }: { scope: "workout" | "program"; id: string; title: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["af-audit", scope, id],
    queryFn: async () => {
      const { data } = await supabase.from("student_feedback_audit")
        .select("*")
        .eq("feedback_scope", scope)
        .eq("feedback_id", id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Auditoria: {title}</DialogTitle></DialogHeader>
        {(!data || data.length === 0) ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma alteração registrada.</p>
        ) : (
          <div className="space-y-3">
            {data.map((a: any) => (
              <div key={a.id} className="border border-border rounded-md p-3 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  <span>Por: {a.changed_by === a.user_id ? "aluno" : "staff"}</span>
                </div>
                <p className="text-xs mb-1"><strong>Campos alterados:</strong> {(a.changed_fields || []).join(", ") || "—"}</p>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-muted-foreground">Ver antes/depois</summary>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <pre className="bg-muted/40 p-2 rounded overflow-auto max-h-40">{JSON.stringify(a.before_data, null, 2)}</pre>
                    <pre className="bg-muted/40 p-2 rounded overflow-auto max-h-40">{JSON.stringify(a.after_data, null, 2)}</pre>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AdminFeedback;