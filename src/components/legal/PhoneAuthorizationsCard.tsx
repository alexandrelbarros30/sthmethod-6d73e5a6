import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, ShieldAlert, Loader2, XCircle, CheckCircle2, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Contact = {
  id: string;
  holder_name: string;
  phone: string;
  relationship: string;
  status: string;
  reason: string | null;
  created_at: string;
  revoked_at?: string | null;
  revoked_reason?: string | null;
};

const REL: Record<string, string> = {
  marido: "Marido", esposa: "Esposa", parceiro: "Parceiro(a)", pai_mae: "Pai/Mãe",
  filho_filha: "Filho(a)", responsavel: "Responsável", outro: "Outro",
};

function statusBadge(s: string) {
  if (s === "approved") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Aprovada</Badge>;
  if (s === "revoked") return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Revogada</Badge>;
  if (s === "rejected") return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Recusada</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
}

export default function PhoneAuthorizationsCard({
  userId, moduleEnabled = true, planName, compact,
}: { userId: string; moduleEnabled?: boolean; planName?: string | null; compact?: boolean }) {
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Contact | null>(null);
  const [reason, setReason] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("authorized_contacts")
      .select("id, holder_name, phone, relationship, status, reason, created_at, revoked_at, revoked_reason")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRows((data as Contact[]) || []);
    setLoading(false);
  }
  useEffect(() => { if (userId) load(); }, [userId]);

  async function revoke() {
    if (!target) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("authorized_contacts")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_reason: reason.trim() || null,
      })
      .eq("id", target.id)
      .eq("user_id", userId);
    setSaving(false);
    if (error) { toast.error(error.message || "Não foi possível revogar."); return; }
    toast.success("Autorização de telefone revogada.");
    setTarget(null); setReason(""); setAcknowledge(false);
    load();
  }

  if (!moduleEnabled) {
    return (
      <div className={`rounded-2xl border border-dashed border-border bg-muted/30 ${compact ? "p-4" : "p-5"}`} id="telefones">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Autorização de contato por telefone</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
              Este recurso não está disponível no seu plano atual{planName ? ` (${planName})` : ""}. Fale com a equipe para habilitar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-5"} space-y-3`} id="telefones">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Contatos autorizados a falar por você</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
              Pessoas que você autorizou a tratar de assuntos do seu acompanhamento com a equipe.
              Você pode revogar essa autorização a qualquer momento.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Carregando…</div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum contato autorizado até o momento.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{r.holder_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {REL[r.relationship] || r.relationship} · {r.phone}
                    </p>
                    {r.revoked_reason && (
                      <p className="text-[11px] text-muted-foreground mt-1">Motivo da revogação: “{r.revoked_reason}”</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(r.status)}
                    {r.status === "approved" && (
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/5"
                        onClick={() => { setTarget(r); setReason(""); setAcknowledge(false); }}>
                        Revogar
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!target} onOpenChange={(o) => !saving && !o && setTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <AlertDialogTitle>Revogar autorização de telefone</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-[12.5px] leading-relaxed">
                <p>
                  Você está prestes a revogar a autorização concedida a
                  {" "}<strong>{target?.holder_name}</strong>{" "}
                  ({target?.phone}) para falar por você com a equipe STH METHOD.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>A equipe deixará de tratar assuntos do seu acompanhamento com este contato.</li>
                  <li>Mensagens em andamento com este contato serão encerradas.</li>
                  <li>A revogação fica registrada no seu histórico de autorizações, com data e motivo.</li>
                  <li>Você pode conceder uma nova autorização a qualquer momento pelo painel do aluno.</li>
                </ul>
                <div>
                  <Label htmlFor="revoke-phone-reason" className="text-[12px]">Motivo (opcional)</Label>
                  <Textarea id="revoke-phone-reason" value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex.: contato não é mais necessário…"
                    className="mt-1 min-h-[70px] text-[12px]" />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={acknowledge} onCheckedChange={(v) => setAcknowledge(v === true)} />
                  <span className="text-[12px]">
                    Confirmo que desejo revogar esta autorização e autorizo o registro deste consentimento no meu histórico.
                  </span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={!acknowledge || saving}
              onClick={(e) => { e.preventDefault(); revoke(); }}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirmar revogação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}