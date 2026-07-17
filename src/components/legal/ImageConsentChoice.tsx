import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Lock, ShieldAlert } from "lucide-react";
import { Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LEGAL } from "@/lib/legal-version";
import type { ImageConsent } from "@/components/legal/LegalAcceptanceBlock";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Card reutilizável de Autorização de Imagem.
 * Permite ao aluno consultar e alterar a decisão (não autorizo / sem identificação / com identificação)
 * a qualquer momento, refletindo no campo profiles.image_consent_choice e em legal_acceptances.
 */
interface Props {
  userId: string;
  initialValue?: ImageConsent | null;
  email?: string | null;
  onSaved?: (value: ImageConsent) => void;
  compact?: boolean;
  /** Se o plano ativo do aluno permite este módulo. Undefined = liberado. */
  moduleEnabled?: boolean;
  planName?: string | null;
}

const LABELS: Record<ImageConsent, { title: string; desc: string }> = {
  nao_autorizo: {
    title: "Não autorizo",
    desc: "Minha imagem, voz, depoimentos ou evolução não serão utilizados em nenhum material.",
  },
  sem_identificacao: {
    title: "Autorizo sem identificação",
    desc: "Posso aparecer em conteúdos da STH METHOD desde que sem identificação pessoal.",
  },
  com_identificacao: {
    title: "Autorizo com identificação",
    desc: "Aceito ser identificado(a) em publicações e materiais institucionais.",
  },
};

const ImageConsentChoice = ({
  userId, initialValue, email, onSaved, compact,
  moduleEnabled = true, planName,
}: Props) => {
  const [value, setValue] = useState<ImageConsent>(initialValue || "nao_autorizo");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  async function persist(payloadReason: string | null) {
    if (!userId) return;
    setSaving(true);
    try {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          image_consent_choice: value,
          image_consent_updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", userId);
      if (upErr) throw upErr;

      await supabase.from("legal_acceptances").insert([{
        user_id: userId,
        email: email ?? null,
        document_type: "image_use" as any,
        document_version: LEGAL.termsVersion,
        accepted: value !== "nao_autorizo",
        option_value: value,
        context: payloadReason
          ? `student_profile_update | motivo: ${payloadReason}`
          : "student_profile_update",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }] as any);

      // Cascata: atualiza registros anteriores em image_consents deste aluno
      // para refletir a nova decisão (revogação/atualização).
      const nowIso = new Date().toISOString();
      const cascadePayload =
        value === "nao_autorizo"
          ? { authorized: false, allow_tagging: false, responded_at: nowIso, notes: `Revogado pelo aluno via painel${payloadReason ? ` — motivo: ${payloadReason}` : ""}` }
          : value === "sem_identificacao"
          ? { authorized: true, allow_tagging: false, responded_at: nowIso, notes: "Atualizado pelo aluno via painel" }
          : { authorized: true, allow_tagging: true, responded_at: nowIso, notes: "Atualizado pelo aluno via painel" };
      await supabase
        .from("image_consents")
        .update(cascadePayload as any)
        .eq("user_id", userId);

      // Registra motivo explicitamente no histórico
      if (payloadReason) {
        await (supabase as any).from("authorization_audit").insert({
          user_id: userId,
          kind: "image",
          action: value === "nao_autorizo" ? "revoked" : "updated",
          previous_value: initialValue || null,
          new_value: value,
          reason: payloadReason,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        });
      }

      toast.success(
        value === "nao_autorizo"
          ? "Autorização de imagem revogada."
          : "Preferência de imagem atualizada."
      );
      setDirty(false);
      setConfirmOpen(false);
      setReason("");
      setAcknowledge(false);
      onSaved?.(value);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveClick() {
    // Exige confirmação extra ao revogar OU ao trocar de "com identificação" para restrição
    const requiresConfirm =
      value === "nao_autorizo" ||
      (initialValue === "com_identificacao" && value === "sem_identificacao");
    if (requiresConfirm) {
      setConfirmOpen(true);
    } else {
      persist(null);
    }
  }

  if (!moduleEnabled) {
    return (
      <div className={`rounded-2xl border border-dashed border-border bg-muted/30 ${compact ? "p-4" : "p-5"}`} id="imagem">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Autorização de uso de imagem</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
              Este recurso não está disponível no seu plano atual{planName ? ` (${planName})` : ""}.
              A gestão de autorização de imagem faz parte de planos que incluem publicação de resultados
              e materiais institucionais. Fale com a equipe se quiser habilitar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-5"}`} id="imagem">
      <div className="flex items-start gap-3 mb-3">
        <Camera className="w-5 h-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Autorização de uso de imagem</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
            Esta decisão é facultativa, não interfere no atendimento e pode ser alterada a qualquer momento.
          </p>
        </div>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => { setValue(v as ImageConsent); setDirty(true); }}
        className="space-y-2"
      >
        {(Object.keys(LABELS) as ImageConsent[]).map((k) => (
          <label
            key={k}
            className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
              value === k ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem value={k} id={`ic_${k}`} className="mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">{LABELS[k].title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{LABELS[k].desc}</p>
            </div>
          </label>
        ))}
      </RadioGroup>

      <div className="flex justify-end mt-4">
        <Button size="sm" disabled={!dirty || saving} onClick={handleSaveClick}>
          {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Salvar preferência
        </Button>
      </div>

      {initialValue && initialValue !== "nao_autorizo" && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1">
              <p className="text-[12px] font-medium text-foreground">Mudou de ideia?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Você pode revogar a autorização de uso de imagem a qualquer momento, conforme previsto em contrato.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              disabled={saving}
              onClick={() => { setValue("nao_autorizo"); setDirty(true); setConfirmOpen(true); }}
            >
              <Ban className="w-3.5 h-3.5" /> Revogar autorização
            </Button>
          </div>
        </div>
      )}
    </div>

    <AlertDialog open={confirmOpen} onOpenChange={(o) => !saving && setConfirmOpen(o)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <AlertDialogTitle>
              {value === "nao_autorizo" ? "Confirmar revogação da autorização de imagem" : "Confirmar restrição da autorização"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-[12.5px] leading-relaxed">
              <p>
                Você está prestes a {value === "nao_autorizo" ? "revogar totalmente" : "restringir"} a autorização de uso da sua imagem
                em conteúdos da STH METHOD.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Fotos, vídeos e depoimentos com sua imagem deixam de ser publicados em novos materiais.</li>
                <li>Materiais já publicados antes desta data podem permanecer no ar até que sejam substituídos no ciclo natural de conteúdo.</li>
                <li>Sua evolução continua sendo acompanhada normalmente pela equipe — a mudança afeta apenas o uso externo da imagem.</li>
                <li>Esta decisão fica registrada no seu histórico de autorizações, com data e motivo, e pode ser revertida a qualquer momento.</li>
              </ul>
              <div className="pt-1">
                <Label htmlFor="revoke-reason" className="text-[12px]">Motivo (opcional, ajuda a equipe a entender)</Label>
                <Textarea
                  id="revoke-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: preferência pessoal, questões profissionais…"
                  className="mt-1 min-h-[70px] text-[12px]"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={acknowledge} onCheckedChange={(v) => setAcknowledge(v === true)} />
                <span className="text-[12px]">
                  Li e compreendo os efeitos desta alteração. Autorizo o registro deste consentimento no meu histórico.
                </span>
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!acknowledge || saving}
            onClick={(e) => { e.preventDefault(); persist(reason.trim() || null); }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ImageConsentChoice;