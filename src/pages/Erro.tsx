import { useNavigate, useSearchParams } from "react-router-dom";
import { getLastRequestId } from "@/lib/request-id";

/**
 * Rota pública /erro?code=STH-500&title=...&msg=...&ref=...
 * Layout consistente para qualquer erro exibido ao aluno/público.
 */
export default function Erro() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const code = params.get("code") || "STH-000";
  const title = params.get("title") || "Algo não saiu como esperado";
  const msg =
    params.get("msg") ||
    "Tivemos um contratempo momentâneo. Tente novamente em instantes.";
  const ref = params.get("ref") || getLastRequestId();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
          !
        </div>
        <h1 className="text-lg font-display font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{msg}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-mono text-muted-foreground">
            Código: <span className="text-foreground">{code}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-mono text-muted-foreground">
            Ref: <span className="text-foreground">{ref}</span>
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-full text-sm font-medium border border-border/70 text-foreground hover:bg-muted/50 transition"
          >
            Ir para o início
          </button>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Se o problema persistir, fale com a equipe STH METHOD informando o
          <b className="text-foreground"> Código </b> e a <b className="text-foreground">Ref</b> acima.
        </p>
      </div>
    </div>
  );
}