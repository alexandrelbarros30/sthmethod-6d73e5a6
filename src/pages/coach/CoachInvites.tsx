import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Plus, Link2, Check } from "lucide-react";
import CoachLayout from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from "@/hooks/useCoachTenant";
import { toast } from "sonner";

const CoachInvites = () => {
  const qc = useQueryClient();
  const { tenant, member } = useCoachContext();
  const tenantId = tenant?.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: invites } = useQuery({
    queryKey: ["coach-invites", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_invites")
        .select("id, token, student_name, student_email, redeemed_at, expires_at, created_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const inviteUrl = (token: string) => `${window.location.origin}/coach/convite/${token}`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("coach_invites").insert({
        tenant_id: tenantId,
        created_by: member?.user_id ?? null,
        student_name: name.trim() || null,
        student_email: email.trim() || null,
      });
      if (error) throw error;
      setName(""); setEmail("");
      toast.success("Convite gerado");
      qc.invalidateQueries({ queryKey: ["coach-invites"] });
      qc.invalidateQueries({ queryKey: ["coach-dashboard"] });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível gerar o convite");
    } finally {
      setCreating(false);
    }
  };

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(inviteUrl(token));
    setCopied(token);
    toast.success("Link copiado");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <CoachLayout title="Convites" subtitle="Gere um link ou QR Code para o aluno entrar no seu ambiente.">
      <Card className="p-6 rounded-2xl border-border/60">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Nome do aluno (opcional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">E-mail (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
          </div>
          <Button type="submit" disabled={creating} className="rounded-full">
            <Plus className="mr-1.5 h-4 w-4" /> Gerar convite
          </Button>
        </form>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(invites || []).map((inv: any) => {
          const expired = inv.expires_at && new Date(inv.expires_at) < new Date();
          const used = !!inv.redeemed_at;
          return (
            <Card key={inv.id} className="p-5 rounded-2xl border-border/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold tracking-[-0.02em] truncate">
                    {inv.student_name || "Convite aberto"}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground font-light truncate">
                    {inv.student_email || "Sem e-mail vinculado"}
                  </p>
                </div>
                <Badge variant={used ? "secondary" : expired ? "outline" : "default"} className="rounded-full text-[10px] shrink-0">
                  {used ? "Utilizado" : expired ? "Expirado" : "Ativo"}
                </Badge>
              </div>

              {!used && !expired && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="rounded-xl bg-white p-2 shrink-0">
                    <QRCodeCanvas value={inviteUrl(inv.token)} size={82} includeMargin={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground break-all leading-snug">{inviteUrl(inv.token)}</p>
                    <Button variant="outline" size="sm" onClick={() => copy(inv.token)} className="mt-2 rounded-full text-[12px]">
                      {copied === inv.token ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                      Copiar link
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!invites?.length && (
        <Card className="mt-5 p-10 rounded-2xl border-border/60 text-center">
          <Link2 className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.7} />
          <p className="text-[13px] text-muted-foreground font-light">Nenhum convite gerado ainda.</p>
        </Card>
      )}
    </CoachLayout>
  );
};

export default CoachInvites;