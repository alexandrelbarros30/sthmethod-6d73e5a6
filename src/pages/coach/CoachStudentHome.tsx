import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Dumbbell, KeyRound, Target, User } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const formatDate = (d?: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR") : null;

const CoachStudentHome = () => {
  const { student, tenant } = useCoachContext();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["coach-student-detail", student?.id],
    enabled: !!student?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_students")
        .select("full_name, goal, height_cm, weight_kg, status, start_date, end_date")
        .eq("id", student!.id)
        .maybeSingle();
      return data;
    },
  });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("A senha deve ter no mínimo 8 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada");
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível atualizar a senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachLayout
      audience="student"
      title={`Olá, ${(detail?.full_name || student?.full_name || "aluno").split(" ")[0]}`}
      subtitle={tenant?.business_name ? `Você treina com ${tenant.business_name}.` : undefined}
    >
      <Card className="p-6 rounded-2xl border-border/60">
        <Dumbbell className="h-5 w-5 text-primary mb-3" strokeWidth={1.9} />
        <p className="text-[14px] font-semibold tracking-[-0.02em]">Seus treinos</p>
        <p className="mt-2 text-[13px] text-muted-foreground font-light leading-relaxed">
          Veja os programas montados pelo seu treinador com séries, repetições, cargas e descanso.
        </p>
        <Button asChild className="mt-4 rounded-xl">
          <Link to="/coach/aluno/treinos">Abrir meus treinos</Link>
        </Button>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-6 rounded-2xl border-border/60">
          <Target className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
          <p className="text-[12px] text-muted-foreground font-light">Objetivo</p>
          <p className="text-[14px] font-semibold tracking-[-0.02em] mt-1">
            {detail?.goal || "A definir com seu treinador"}
          </p>
        </Card>
        <Card className="p-6 rounded-2xl border-border/60">
          <User className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
          <p className="text-[12px] text-muted-foreground font-light">Dados atuais</p>
          <p className="text-[14px] font-semibold tracking-[-0.02em] mt-1">
            {detail?.height_cm ? `${detail.height_cm} cm` : "—"} · {detail?.weight_kg ? `${detail.weight_kg} kg` : "—"}
          </p>
        </Card>
      </div>

      {(detail?.start_date || detail?.end_date) && (
        <Card className="mt-4 p-6 rounded-2xl border-border/60">
          <CalendarClock className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
          <p className="text-[12px] text-muted-foreground font-light">Período de vigência</p>
          <p className="text-[14px] font-semibold tracking-[-0.02em] mt-1">
            {formatDate(detail?.start_date) || "—"} → {formatDate(detail?.end_date) || "sem término"}
          </p>
        </Card>
      )}

      <Card className="mt-4 p-6 rounded-2xl border-border/60">
        <KeyRound className="h-4 w-4 text-primary mb-3" strokeWidth={1.9} />
        <p className="text-[14px] font-semibold tracking-[-0.02em]">Alterar minha senha</p>
        <form onSubmit={changePassword} className="mt-4 space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Nova senha (mín. 8 caracteres)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Confirmar nova senha</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} maxLength={72} required />
          </div>
          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? "Salvando..." : "Atualizar senha"}
          </Button>
        </form>
      </Card>
    </CoachLayout>
  );
};

export default CoachStudentHome;