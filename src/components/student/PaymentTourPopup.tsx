import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const STORAGE_KEY = "sth_payment_tour_last_seen";

const todayKey = () => new Date().toISOString().slice(0, 10);

const PaymentTourPopup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["payment-tour-sub", user?.id],
    queryFn: async () => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status,end_date")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return sub;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    if (data === undefined) return;

    const isExpired = data ? new Date(data.end_date) < new Date() : true;
    const isActive = data?.status === "active" && !isExpired;
    if (isActive) return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (last === todayKey()) return;

    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [user?.id, data]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, todayKey());
    setOpen(false);
  };

  const handleGo = () => {
    localStorage.setItem(STORAGE_KEY, todayKey());
    setOpen(false);
    navigate("/dashboard/subscription");
  };

  const isRenewal = !!data;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-md rounded-3xl border-border/40 p-0 overflow-hidden">
        <div className="p-7">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-muted-foreground">
              {isRenewal ? "Renovação" : "Liberar acesso"}
            </p>
          </div>

          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
            {isRenewal
              ? "Seu plano expirou. Renove em 1 minuto."
              : "Falta só o pagamento para liberar tudo."}
          </h2>
          <p className="text-[13px] text-muted-foreground font-light mt-3 tracking-tight">
            {isRenewal
              ? "Continue seu acompanhamento sem interrupção. Escolha o plano e pague direto pela plataforma."
              : "Seu cadastro foi recebido. Escolha o plano ideal e ative seu acesso agora — Pix ou cartão, tudo dentro da plataforma."}
          </p>

          <div className="mt-6 space-y-3">
            {[
              { n: 1, t: "Escolha seu plano", d: "Mensal, trimestral, semestral ou anual." },
              { n: 2, t: "Pague com Pix ou cartão", d: "Aprovação na hora, 100% seguro." },
              { n: 3, t: "Acesso liberado", d: "Dieta, protocolo e treino destravam automaticamente." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-[11px] font-medium text-foreground shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground tracking-tight">{s.t}</p>
                  <p className="text-[12px] text-muted-foreground font-light tracking-tight">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pagamento processado dentro da plataforma</span>
          </div>

          <div className="mt-7 flex flex-col gap-2">
            <Button onClick={handleGo} className="w-full h-11 rounded-full text-[13px] font-medium">
              <CreditCard className="w-4 h-4 mr-1" />
              {isRenewal ? "Renovar agora" : "Escolher plano e pagar"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <button
              onClick={handleClose}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Agora não
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentTourPopup;