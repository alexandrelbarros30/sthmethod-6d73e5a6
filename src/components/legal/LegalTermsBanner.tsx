import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEGAL } from "@/lib/legal-version";
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
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const LegalTermsBanner = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LegalAcceptanceState | null>(null);
  const [saving, setSaving] = useState(false);

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

      // Respeita o dismiss temporário do aluno (7 dias)
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
          const ts = Number(raw);
          if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
        }
      } catch {}

      if (!cancelled) setNeedsAcceptance(true);
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
      <div className="mb-4 rounded-2xl border border-border bg-card/80 backdrop-blur p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            Atualizamos o Termo de Adesão e a Política de Privacidade
          </p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            Seu acesso atual <strong>continua liberado normalmente</strong>. Quando puder,
            leia e registre seu aceite da versão vigente — leva menos de 1 minuto.
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
              Mais tarde
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Termo de Adesão e Política de Privacidade</DialogTitle>
            <DialogDescription>
              Versão vigente {LEGAL.termsVersion}. Seu acesso já está ativo — este aceite mantém seu
              cadastro em conformidade com a nova redação.
            </DialogDescription>
          </DialogHeader>

          <LegalAcceptanceBlock
            email={email ?? undefined}
            context="active_student_banner"
            onChange={setState}
          />

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Fechar
            </Button>
            <Button onClick={handleAccept} disabled={!state?.isComplete || saving}>
              {saving ? "Registrando..." : "Confirmar aceite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LegalTermsBanner;