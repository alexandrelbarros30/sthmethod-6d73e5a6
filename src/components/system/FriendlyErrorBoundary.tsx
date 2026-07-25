import React from "react";
import { toFriendlyError, withRef, type FriendlyError } from "@/lib/friendly-errors";

type Props = { children: React.ReactNode };
type State = { friendly: FriendlyError | null };

/**
 * Boundary global: intercepta qualquer erro de renderização e exibe uma
 * tela profissional com código STH-XXX. Nunca mostra stack, Supabase, Lovable etc.
 */
export default class FriendlyErrorBoundary extends React.Component<Props, State> {
  state: State = { friendly: null };

  static getDerivedStateFromError(err: unknown): State {
    return { friendly: withRef(toFriendlyError(err)) };
  }

  componentDidCatch(error: unknown) {
    // Log só no console (dev). Nunca renderiza para o usuário.
    // eslint-disable-next-line no-console
    console.error("[FriendlyErrorBoundary]", error);
  }

  private reset = () => {
    this.setState({ friendly: null });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    const f = this.state.friendly;
    if (!f) return this.props.children;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-display font-semibold text-foreground">{f.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.message}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-mono text-muted-foreground">
              Código: <span className="text-foreground">{f.code}</span>
            </span>
            {f.ref && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-mono text-muted-foreground">
                Ref: <span className="text-foreground">{f.ref}</span>
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Tentar novamente
            </button>
            <button
              onClick={this.reload}
              className="px-4 py-2 rounded-full text-sm font-medium border border-border/70 text-foreground hover:bg-muted/50 transition"
            >
              Recarregar tela
            </button>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Se o problema continuar, fale com a equipe STH METHOD informando o código acima.
          </p>
        </div>
      </div>
    );
  }
}