import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LEGAL } from "@/lib/legal-version";
import type { ImageConsent } from "@/components/legal/LegalAcceptanceBlock";

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

const ImageConsentChoice = ({ userId, initialValue, email, onSaved, compact }: Props) => {
  const [value, setValue] = useState<ImageConsent>(initialValue || "nao_autorizo");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  async function save() {
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
        context: "student_profile_update",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }] as any);

      // Cascata: atualiza registros anteriores em image_consents deste aluno
      // para refletir a nova decisão (revogação/atualização).
      const nowIso = new Date().toISOString();
      const cascadePayload =
        value === "nao_autorizo"
          ? { authorized: false, allow_tagging: false, responded_at: nowIso, notes: "Revogado pelo aluno via painel" }
          : value === "sem_identificacao"
          ? { authorized: true, allow_tagging: false, responded_at: nowIso, notes: "Atualizado pelo aluno via painel" }
          : { authorized: true, allow_tagging: true, responded_at: nowIso, notes: "Atualizado pelo aluno via painel" };
      await supabase
        .from("image_consents")
        .update(cascadePayload as any)
        .eq("user_id", userId);

      toast.success(
        value === "nao_autorizo"
          ? "Autorização de imagem revogada."
          : "Preferência de imagem atualizada."
      );
      setDirty(false);
      onSaved?.(value);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
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
        <Button size="sm" disabled={!dirty || saving} onClick={save}>
          {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Salvar preferência
        </Button>
      </div>
    </div>
  );
};

export default ImageConsentChoice;