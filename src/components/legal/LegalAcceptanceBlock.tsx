import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { LEGAL } from "@/lib/legal-version";
import { supabase } from "@/integrations/supabase/client";

export type ImageConsent = "nao_autorizo" | "sem_identificacao" | "com_identificacao";

export interface LegalAcceptanceState {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptNature: boolean;
  acceptMarketing: boolean;
  imageConsent: ImageConsent;
  isComplete: boolean;
}

interface Props {
  email?: string;
  context?: string;
  onChange?: (state: LegalAcceptanceState) => void;
}

/**
 * Bloco padronizado de aceites legais para checkout/cadastro.
 * - Termo, Privacidade e Natureza do Programa são OBRIGATÓRIOS.
 * - Comunicações comerciais é OPCIONAL.
 * - Autorização de imagem possui 3 opções (rádio).
 */
const LegalAcceptanceBlock = ({ email, context, onChange }: Props) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptNature, setAcceptNature] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [imageConsent, setImageConsent] = useState<ImageConsent>("nao_autorizo");

  const isComplete = acceptTerms && acceptPrivacy && acceptNature;

  useEffect(() => {
    onChange?.({ acceptTerms, acceptPrivacy, acceptNature, acceptMarketing, imageConsent, isComplete });
  }, [acceptTerms, acceptPrivacy, acceptNature, acceptMarketing, imageConsent, isComplete, onChange]);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 text-sm">
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">Resumo do Programa</h3>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Você está contratando um <strong>Programa de Acompanhamento em Saúde e Performance por prazo determinado</strong>.
          Durante a vigência, terá acesso aos recursos da plataforma. Ao final do período contratado, o acesso é encerrado.
          A STH METHOD não garante resultados específicos.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(!!v)} />
          <span className="text-[13px] leading-relaxed text-foreground">
            Li e aceito o{" "}
            <Link to="/termo" target="_blank" className="text-primary underline">Termo de Adesão</Link>.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} />
          <span className="text-[13px] leading-relaxed text-foreground">
            Li e aceito a{" "}
            <Link to="/privacidade" target="_blank" className="text-primary underline">Política de Privacidade</Link> (LGPD).
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={acceptNature} onCheckedChange={(v) => setAcceptNature(!!v)} />
          <span className="text-[13px] leading-relaxed text-foreground">
            Estou ciente de que se trata de um <strong>Programa de Acompanhamento por prazo determinado</strong> — não compro
            dietas, treinos ou protocolos em definitivo, e o acesso encerra ao fim do plano.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={acceptMarketing} onCheckedChange={(v) => setAcceptMarketing(!!v)} />
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            (Opcional) Quero receber novidades, promoções e conteúdos da STH METHOD por e-mail e WhatsApp.
          </span>
        </label>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="font-semibold text-foreground text-[13px]">Autorização de uso de imagem</p>
        <p className="text-muted-foreground text-[12px]">
          Sua escolha é facultativa e não interfere na prestação dos serviços. Pode ser alterada a qualquer momento.
        </p>
        <RadioGroup value={imageConsent} onValueChange={(v) => setImageConsent(v as ImageConsent)} className="space-y-2 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <RadioGroupItem value="nao_autorizo" id="ic_no" className="mt-0.5" />
            <span className="text-[13px] text-foreground">Não autorizo qualquer utilização da minha imagem, voz, depoimentos ou evolução.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <RadioGroupItem value="sem_identificacao" id="ic_anon" className="mt-0.5" />
            <span className="text-[13px] text-foreground">Autorizo a divulgação apenas sem identificação pessoal.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <RadioGroupItem value="com_identificacao" id="ic_full" className="mt-0.5" />
            <span className="text-[13px] text-foreground">Autorizo a divulgação com identificação.</span>
          </label>
        </RadioGroup>
      </div>
    </div>
  );
};

/**
 * Persiste todos os aceites em legal_acceptances. Chame após o pagamento confirmado
 * ou após a criação da conta — passando o user_id quando já disponível.
 */
export async function recordLegalAcceptances(opts: {
  state: LegalAcceptanceState;
  userId?: string | null;
  email?: string | null;
  context?: string;
}) {
  const { state, userId, email, context } = opts;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const base = { user_id: userId ?? null, email: email ?? null, user_agent: ua, context: context ?? null } as const;
  const rows = [
    {
      ...base,
      document_type: "terms" as const,
      document_version: LEGAL.termsVersion,
      accepted: state.acceptTerms,
    },
    {
      ...base,
      document_type: "privacy" as const,
      document_version: LEGAL.privacyVersion,
      accepted: state.acceptPrivacy,
    },
    {
      ...base,
      document_type: "program_nature" as const,
      document_version: LEGAL.termsVersion,
      accepted: state.acceptNature,
    },
    {
      ...base,
      document_type: "marketing" as const,
      document_version: LEGAL.termsVersion,
      accepted: state.acceptMarketing,
    },
    {
      ...base,
      document_type: "image_use" as const,
      document_version: LEGAL.termsVersion,
      accepted: state.imageConsent !== "nao_autorizo",
      option_value: state.imageConsent,
    },
  ];
  try {
    await supabase.from("legal_acceptances").insert(rows as any);
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          image_consent_choice: state.imageConsent,
          image_consent_updated_at: new Date().toISOString(),
          marketing_opt_in: state.acceptMarketing,
        } as any)
        .eq("id", userId);
    }
  } catch (err) {
    console.error("[legal] failed to record acceptances", err);
  }
}

export default LegalAcceptanceBlock;