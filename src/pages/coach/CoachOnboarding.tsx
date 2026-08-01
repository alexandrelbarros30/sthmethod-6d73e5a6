import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { COACH_PLANS, getCoachPlan, CoachPlanId } from "@/lib/coach-plans";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CoachOnboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { member, student, loading } = useCoachContext();

  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [cref, setCref] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22A05E");
  const [secondaryColor, setSecondaryColor] = useState("#0A0A0A");
  const [plan, setPlan] = useState<CoachPlanId>((params.get("plano") as CoachPlanId) || "start");
  const [saving, setSaving] = useState(false);

  if (!authLoading && !user) {
    navigate(`/coach/entrar?modo=criar&redirect=${encodeURIComponent("/coach/comecar")}`, { replace: true });
  }
  if (!loading && member) navigate("/coach/painel", { replace: true });
  if (!loading && !member && student) navigate("/coach/aluno", { replace: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const selected = getCoachPlan(plan);
      const { error } = await supabase.from("coach_tenants").insert({
        owner_id: user.id,
        business_name: businessName.trim(),
        legal_name: legalName.trim() || null,
        tax_id: taxId.trim() || null,
        cref: cref.trim() || null,
        phone: phone.trim() || null,
        email: user.email ?? null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        plan,
        student_limit: selected.studentLimit,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["coach-context"] });
      toast.success("Ambiente criado");
      navigate("/coach/painel", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível criar o ambiente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <Card className="p-7 rounded-2xl border-border/60">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.02em]">Criar ambiente</p>
              <p className="text-[11px] text-muted-foreground">Seu espaço isolado no STH METHOD COACH</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bn" className="text-[12px]">Nome comercial *</Label>
              <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required maxLength={120} placeholder="Ex.: Studio Alpha Performance" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ln" className="text-[12px]">Nome / razão social</Label>
                <Input id="ln" value={legalName} onChange={(e) => setLegalName(e.target.value)} maxLength={140} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tid" className="text-[12px]">CPF / CNPJ</Label>
                <Input id="tid" value={taxId} onChange={(e) => setTaxId(e.target.value)} maxLength={20} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cref" className="text-[12px]">CREF</Label>
                <Input id="cref" value={cref} onChange={(e) => setCref(e.target.value)} maxLength={30} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ph" className="text-[12px]">Telefone</Label>
                <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pc" className="text-[12px]">Cor principal</Label>
                <div className="flex gap-2">
                  <Input id="pc" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 p-1" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} maxLength={9} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sc" className="text-[12px]">Cor secundária</Label>
                <div className="flex gap-2">
                  <Input id="sc" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-14 p-1" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} maxLength={9} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Plano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as CoachPlanId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COACH_PLANS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.price}{p.priceNote} · até {p.studentLimit.toLocaleString("pt-BR")} alunos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                O limite de alunos ativos é aplicado automaticamente. Cobrança será ativada em breve.
              </p>
            </div>

            <Button type="submit" disabled={saving} className="w-full rounded-full">
              {saving ? "Criando..." : "Criar ambiente"}
            </Button>
          </form>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            É aluno de um treinador? <Link to="/coach/entrar" className="underline">Use o link de convite recebido.</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default CoachOnboarding;