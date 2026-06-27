import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEGAL, getTermsGraceDaysLeft } from "@/lib/legal-version";
import LegalAcceptanceBlock, {
  recordLegalAcceptances,
  type LegalAcceptanceState,
} from "@/components/legal/LegalAcceptanceBlock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Convite NÃO bloqueante para alunos ativos aceitarem a versão vigente
 * do Termo de Adesão e da Política de Privacidade.
 *
 * - Não impede o uso da plataforma.
 * - Dismiss é lembrado por 7 dias (reaparece depois).
 * - Some assim que o aceite for registrado para a versão atual.
 */
const DISMISS_KEY = `mead:legal-banner-dismiss:${LEGAL.termsVersion}`;
// Dismiss curto: 24h. Quando termina a carência, o componente força modal.
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

const LegalTermsBanner = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LegalAcceptanceState | null>(null);
  const [saving, setSaving] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(getTermsGraceDaysLeft());
  const blocking = needsAcceptance && daysLeft <= 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? null;
      if (!uid) return;
      if (cancelled) return;
      setUserId(uid);
      setEmail(u?.user?.email ?? null);

      // Verifica se já existe aceite da versão vigente do TERMO
      const { data: accepted } = await supabase
        .from("legal_acceptances")
        .select("id")
        .eq("user_id", uid)
        .eq("document_type", "terms")
        .eq("document_version", LEGAL.termsVersion)
        .eq("accepted", true)
        .limit(1)
        .maybeSingle();

      if (accepted) return;

      const left = getTermsGraceDaysLeft();
      if (!cancelled) setDaysLeft(left);

      // Se ainda há carência, respeita o dismiss curto (24h).
      // Se a carência acabou, ignora dismiss e força aceite.
      if (left > 0) {
        try {
          const raw = localStorage.getItem(DISMISS_KEY);
          if (raw) {
            const ts = Number(raw);
            if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
          }
        } catch {}
      }

      if (!cancelled) {
        setNeedsAcceptance(true);
        if (left <= 0) setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setNeedsAcceptance(false);
  };

  const handleAccept = async () => {
    if (!state || !state.isComplete) {
      toast.error("Marque os 3 aceites obrigatórios para continuar.");
      return;
    }
    setSaving(true);
    try {
      await recordLegalAcceptances({
        state,
        userId,
        email,
        context: "active_student_banner",
      });
      toast.success("Aceites registrados. Obrigado!");
      setOpen(false);
      setNeedsAcceptance(false);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível registrar agora. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (!needsAcceptance) return null;

  return (
    <>
      {!blocking && (
      <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            Atualizamos o Termo de Adesão e a Política de Privacidade
          </p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            Seu acesso atual <strong>continua liberado normalmente</strong>. Você tem{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
            </strong>{" "}
            para registrar o aceite da versão vigente. Após esse prazo, o acesso ficará
            suspenso até o aceite ser concluído.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" className="rounded-full h-8 px-4 text-[12px]" onClick={() => setOpen(true)}>
              Ler e aceitar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-8 px-3 text-[12px] text-muted-foreground"
              onClick={dismiss}
            >
              Lembrar amanhã
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      )}

      <Dialog
        open={open || blocking}
        onOpenChange={(v) => {
          // Se acabou a carência, não permite fechar.
          if (blocking) return;
          setOpen(v);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            if (blocking) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (blocking) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {blocking
                ? "Aceite obrigatório para continuar"
                : "Termo de Adesão e Política de Privacidade"}
            </DialogTitle>
            <DialogDescription>
              {blocking
                ? `O período de carência de ${LEGAL.graceDays} dias terminou. Para retomar o acesso à plataforma, registre o aceite da versão vigente (${LEGAL.termsVersion}).`
                : `Versão vigente ${LEGAL.termsVersion}. Seu acesso já está ativo — este aceite mantém seu cadastro em conformidade com a nova redação.`}
            </DialogDescription>
          </DialogHeader>

          <LegalAcceptanceBlock
            email={email ?? undefined}
            context="active_student_banner"
            onChange={setState}
          />

          <DialogFooter className="gap-2">
            {!blocking && (
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Fechar
              </Button>
            )}
            <Button onClick={handleAccept} disabled={!state?.isComplete || saving}>
              {saving ? "Registrando..." : "Confirmar aceite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {blocking && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm pointer-events-auto" />
      )}
    </>
  );
};

export default LegalTermsBanner;