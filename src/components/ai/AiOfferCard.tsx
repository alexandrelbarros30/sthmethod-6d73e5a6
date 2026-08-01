import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiOffer, offerLabel } from "@/hooks/useAiGrowth";
import { AI_PLANS } from "@/hooks/useAiApp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, X } from "lucide-react";

function priceOf(plan: string) {
  const raw = AI_PLANS.find((p) => p.id === plan)?.price ?? "";
  return Number(raw.replace("R$", "").replace(/\s/g, "").replace(".", "").replace(",", ".")) || 0;
}

export default function AiOfferCard({
  offer,
  onDismiss,
  compact,
}: {
  offer: AiOffer;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const base = priceOf(offer.plan);
  const final = base * (1 - offer.discount_pct / 100);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function checkout() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("sth-ai-subscribe", {
        body: { plan: offer.plan, offer_id: offer.id },
      });
      if (error) throw error;
      const url = (data as any)?.init_point;
      if (!url) throw new Error((data as any)?.error || "Checkout indisponível");
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível iniciar o pagamento.");
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-primary/5 p-5">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dispensar oferta"
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1"><Sparkles className="h-3 w-3" /> {offerLabel(offer.kind)}</Badge>
            {offer.discount_pct > 0 && <Badge variant="secondary">-{offer.discount_pct}%</Badge>}
          </div>
          <p className="mt-2 text-sm font-semibold capitalize">Plano {offer.plan}</p>
          {!compact && offer.reason && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{offer.reason}</p>
          )}
          {base > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="line-through">{fmt(base)}</span>{" "}
              <span className="text-lg font-semibold text-foreground">{fmt(final)}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Válida até {new Date(offer.expires_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={() => navigate("/ai/assinatura")}>Ver planos</Button>
          <Button onClick={checkout} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Aproveitar
          </Button>
        </div>
      </div>
    </Card>
  );
}
