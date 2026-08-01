import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, Search, Users } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase();

const formatDate = (d?: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR") : null;

const daysLeft = (end?: string | null) => {
  if (!end) return null;
  const diff = new Date(`${end}T23:59:59`).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const addMonths = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

const GOAL_PRESETS = [
  "Hipertrofia",
  "Recomposição corporal",
  "Emagrecimento",
  "Bulking",
  "Cutting",
  "Off-season",
  "Finalização",
  "Manutenção",
  "Performance",
  "Condicionamento",
  "Saúde e qualidade de vida",
  "Reabilitação",
];

const CoachStudents = () => {
  const qc = useQueryClient();
  const { tenant } = useCoachContext();
  const tenantId = tenant?.id;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [period, setPeriod] = useState({ start_date: "", end_date: "" });
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", birth_date: "", gender: "",
    height_cm: "", weight_kg: "", goal: "", notes: "",
    start_date: today(), end_date: "",
  });

  const { data: students } = useQuery({
    queryKey: ["coach-students", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_students")
        .select("id, full_name, email, phone, goal, status, created_at, start_date, end_date")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return students || [];
    return (students || []).filter((s: any) =>
      normalize(`${s.full_name} ${s.email || ""} ${s.phone || ""}`).includes(q)
    );
  }, [students, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("coach_students").insert({
        tenant_id: tenantId,
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        goal: form.goal.trim() || null,
        notes: form.notes.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      if (error) throw error;
      toast.success("Aluno cadastrado");
      setOpen(false);
      setForm({ full_name: "", email: "", phone: "", birth_date: "", gender: "", height_cm: "", weight_kg: "", goal: "", notes: "", start_date: today(), end_date: "" });
      qc.invalidateQueries({ queryKey: ["coach-students"] });
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível cadastrar");
    } finally {
      setSaving(false);
    }
  };

  const openPeriod = (s: any) => {
    setEditing(s);
    setPeriod({ start_date: s.start_date || today(), end_date: s.end_date || "" });
  };

  const savePeriod = async () => {
    if (!editing) return;
    if (period.start_date && period.end_date && period.end_date < period.start_date) {
      toast.error("A data final deve ser posterior à inicial");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("coach_students")
        .update({ start_date: period.start_date || null, end_date: period.end_date || null })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Vigência atualizada");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["coach-students"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachLayout
      title="Alunos"
      subtitle="Cadastre, acompanhe e organize sua base."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Plus className="mr-1.5 h-4 w-4" /> Novo aluno</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="tracking-[-0.02em]">Cadastrar aluno</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Nome completo *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={120} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Sexo</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Altura (cm)</Label>
                  <Input type="number" min={80} max={260} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Peso (kg)</Label>
                  <Input type="number" step="0.1" min={20} max={400} value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Objetivo</Label>
                <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} maxLength={160} placeholder="Ex.: hipertrofia, emagrecimento, performance" />
              </div>
              <div className="rounded-xl border border-border/60 p-3.5 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  <Label className="text-[12px]">Período de vigência</Label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Início</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Término</Label>
                    <Input type="date" min={form.start_date || undefined} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 3, 6, 12].map((m) => (
                    <Button key={m} type="button" variant="outline" size="sm" className="rounded-full h-7 text-[11px]"
                      onClick={() => setForm({ ...form, start_date: form.start_date || today(), end_date: addMonths(m) })}>
                      {m} {m === 1 ? "mês" : "meses"}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground font-light">Datas livres — defina o período conforme o contrato do aluno.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Observações</Label>
                <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-full">
                {saving ? "Salvando..." : "Cadastrar aluno"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone"
          className="pl-9 rounded-xl"
        />
      </div>

      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s: any) => {
            const left = daysLeft(s.end_date);
            return (
            <Card key={s.id} className="p-5 rounded-2xl border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] truncate">{s.full_name}</p>
                  <p className="text-[12px] text-muted-foreground font-light truncate">{s.email || s.phone || "Sem contato"}</p>
                </div>
                <Badge variant={s.status === "active" ? "secondary" : "outline"} className="rounded-full text-[10px] shrink-0">
                  {s.status === "active" ? "Ativo" : s.status}
                </Badge>
              </div>
              {s.goal && <p className="mt-3 text-[12px] text-muted-foreground font-light">Objetivo: {s.goal}</p>}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-light truncate">
                    {s.start_date || s.end_date
                      ? `Vigência: ${formatDate(s.start_date) || "—"} → ${formatDate(s.end_date) || "sem término"}`
                      : "Vigência não definida"}
                  </p>
                  {left !== null && (
                    <Badge variant={left < 0 ? "destructive" : left <= 7 ? "outline" : "secondary"} className="mt-1.5 rounded-full text-[10px]">
                      {left < 0 ? `Vencido há ${Math.abs(left)} dia(s)` : `Faltam ${left} dia(s)`}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="rounded-full text-[11px] shrink-0" onClick={() => openPeriod(s)}>
                  <CalendarClock className="mr-1 h-3.5 w-3.5" /> Vigência
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 rounded-2xl border-border/60 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.7} />
          <p className="text-[13px] text-muted-foreground font-light">
            {search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado ainda."}
          </p>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="tracking-[-0.02em]">Período de vigência</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-[12px] text-muted-foreground font-light">{editing?.full_name}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Início</Label>
                <Input type="date" value={period.start_date} onChange={(e) => setPeriod({ ...period, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Término</Label>
                <Input type="date" min={period.start_date || undefined} value={period.end_date} onChange={(e) => setPeriod({ ...period, end_date: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[1, 3, 6, 12].map((m) => (
                <Button key={m} type="button" variant="outline" size="sm" className="rounded-full h-7 text-[11px]"
                  onClick={() => setPeriod({ start_date: period.start_date || today(), end_date: addMonths(m) })}>
                  {m} {m === 1 ? "mês" : "meses"}
                </Button>
              ))}
              <Button type="button" variant="ghost" size="sm" className="rounded-full h-7 text-[11px]"
                onClick={() => setPeriod({ ...period, end_date: "" })}>
                Sem término
              </Button>
            </div>
            <Button onClick={savePeriod} disabled={saving} className="w-full rounded-full">
              {saving ? "Salvando..." : "Salvar vigência"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CoachLayout>
  );
};

export default CoachStudents;