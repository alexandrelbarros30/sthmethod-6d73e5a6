import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const json = await r.json();
        if (json?.valid) setState("ready");
        else if (json?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("done");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else {
        setState("error");
        setMsg(data?.error || "Não foi possível concluir.");
      }
    } catch (e: any) {
      setState("error");
      setMsg(e?.message || "Erro inesperado.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs tracking-[0.18em] font-semibold text-foreground mb-6">STH METHOD</p>
        {state === "loading" && <p className="text-muted-foreground">Validando link…</p>}
        {state === "invalid" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Link inválido</h1>
            <p className="text-sm text-muted-foreground">Este link de descadastro não é válido ou expirou.</p>
          </>
        )}
        {state === "already" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Você já está descadastrado</h1>
            <p className="text-sm text-muted-foreground">Não enviaremos mais e-mails para este endereço.</p>
          </>
        )}
        {state === "ready" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Cancelar inscrição</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Confirme abaixo para parar de receber e-mails da STH METHOD neste endereço.
            </p>
            <Button onClick={confirm} className="w-full">Confirmar descadastro</Button>
          </>
        )}
        {state === "submitting" && <p className="text-muted-foreground">Processando…</p>}
        {state === "done" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Descadastro concluído ✅</h1>
            <p className="text-sm text-muted-foreground">Você não receberá mais e-mails neste endereço.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">{msg}</p>
          </>
        )}
      </div>
    </div>
  );
}