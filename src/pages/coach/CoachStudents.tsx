import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
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

const CoachStudents = () => {
  const qc = useQueryClient();
  const { tenant } = useCoachContext();
  const tenantId = tenant?.id;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", birth_date: "", gender: "",
    height_cm: "", weight_kg: "", goal: "", notes: "",
  });

  const { data: students } = useQuery({
    queryKey: ["coach-students", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_students")
        .select("id, full_name, email, phone, goal, status, created_at")
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
      });
      if (error) throw error;
      toast.success("Aluno cadastrado");
      setOpen(false);
      setForm({ full_name: "", email: "", phone: "", birth_date: "", gender: "", height_cm: "", weight_kg: "", goal: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["coach-students"] });
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível cadastrar");
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
          {filtered.map((s: any) => (
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
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 rounded-2xl border-border/60 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.7} />
          <p className="text-[13px] text-muted-foreground font-light">
            {search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado ainda."}
          </p>
        </Card>
      )}
    </CoachLayout>
  );
};

export default CoachStudents;