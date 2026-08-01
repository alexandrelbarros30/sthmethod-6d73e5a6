import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const CoachSettings = () => {
  const qc = useQueryClient();
  const { tenant, isOwner } = useCoachContext();
  const [form, setForm] = useState({
    business_name: "", legal_name: "", tax_id: "", cref: "", phone: "",
    logo_url: "", primary_color: "#22A05E", secondary_color: "#0A0A0A",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      business_name: tenant.business_name || "",
      legal_name: tenant.legal_name || "",
      tax_id: tenant.tax_id || "",
      cref: tenant.cref || "",
      phone: tenant.phone || "",
      logo_url: tenant.logo_url || "",
      primary_color: tenant.primary_color || "#22A05E",
      secondary_color: tenant.secondary_color || "#0A0A0A",
    });
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("coach_tenants")
        .update({
          business_name: form.business_name.trim(),
          legal_name: form.legal_name.trim() || null,
          tax_id: form.tax_id.trim() || null,
          cref: form.cref.trim() || null,
          phone: form.phone.trim() || null,
          logo_url: form.logo_url.trim() || null,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
        })
        .eq("id", tenant.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["coach-context"] });
      toast.success("Configurações salvas");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachLayout title="Configurações" subtitle="Identidade visual e dados do seu ambiente.">
      <Card className="p-6 rounded-2xl border-border/60">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Nome comercial</Label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required maxLength={120} disabled={!isOwner} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Nome / razão social</Label>
              <Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} maxLength={140} disabled={!isOwner} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">CPF / CNPJ</Label>
              <Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} maxLength={20} disabled={!isOwner} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">CREF</Label>
              <Input value={form.cref} onChange={(e) => setForm({ ...form, cref: e.target.value })} maxLength={30} disabled={!isOwner} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} disabled={!isOwner} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">URL da logo</Label>
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} maxLength={500} placeholder="https://..." disabled={!isOwner} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Cor principal</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-14 p-1" disabled={!isOwner} />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} maxLength={9} disabled={!isOwner} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Cor secundária</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-14 p-1" disabled={!isOwner} />
                <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} maxLength={9} disabled={!isOwner} />
              </div>
            </div>
          </div>
          {isOwner ? (
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          ) : (
            <p className="text-[12px] text-muted-foreground font-light">
              Somente o responsável pelo ambiente pode editar estes dados.
            </p>
          )}
        </form>
      </Card>
    </CoachLayout>
  );
};

export default CoachSettings;