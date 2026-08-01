import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Preview {
  state: "valid" | "invalid" | "expired" | "redeemed";
  business_name?: string;
  logo_url?: string | null;
  student_name?: string | null;
}

const CoachPublicInvite = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("coach_invite_preview", { _token: token });
      if (cancelled) return;
      if (error) setPreview({ state: "invalid" });
      else setPreview((data as unknown as Preview) ?? { state: "invalid" });
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleRedeem = async () => {
    if (!user) {
      navigate(`/coach/entrar?modo=criar&redirect=${encodeURIComponent(`/coach/convite/${token}`)}`);
      return;
    }
    setRedeeming(true);
    try {
      const { error } = await supabase.rpc("coach_redeem_invite", { _token: token });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["coach-context"] });
      toast.success("Convite aceito");
      navigate("/coach/aluno", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível aceitar o convite");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="p-7 rounded-2xl border-border/60 text-center">
          {!preview ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-12 rounded-2xl mx-auto" />
              <Skeleton className="h-5 w-40 mx-auto" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ) : preview.state !== "valid" ? (
            <>
              <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground mb-4" strokeWidth={1.7} />
              <p className="text-[14px] font-semibold tracking-[-0.02em]">
                {preview.state === "redeemed" ? "Convite já utilizado" : preview.state === "expired" ? "Convite expirado" : "Convite inválido"}
              </p>
              <p className="mt-2 text-[12.5px] text-muted-foreground font-light">
                Peça um novo link ao seu treinador.
              </p>
              <Button asChild variant="outline" className="mt-6 rounded-full w-full">
                <Link to="/coach">Voltar</Link>
              </Button>
            </>
          ) : (
            <>
              {preview.logo_url ? (
                <img src={preview.logo_url} alt={`Logo ${preview.business_name}`} className="h-14 w-14 rounded-2xl object-cover mx-auto" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <Dumbbell className="h-6 w-6 text-primary" strokeWidth={1.9} />
                </div>
              )}
              <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
                {preview.business_name}
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground font-light leading-relaxed">
                {preview.student_name ? `${preview.student_name}, você` : "Você"} foi convidado para treinar com este profissional
                na plataforma STH METHOD COACH.
              </p>
              <Button onClick={handleRedeem} disabled={redeeming || authLoading} className="mt-7 w-full rounded-full">
                {redeeming ? "Confirmando..." : user ? "Aceitar convite" : "Criar conta e aceitar"}
              </Button>
              {!user && (
                <Link
                  to={`/coach/entrar?redirect=${encodeURIComponent(`/coach/convite/${token}`)}`}
                  className="mt-4 block text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Já tenho conta — entrar
                </Link>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default CoachPublicInvite;