import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { AI_LEGAL_DOCS } from "@/data/ai-legal-docs";

export default function AiLegal() {
  const navigate = useNavigate();
  useSthAiTheme();

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-xl space-y-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos e Termos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos gerais e jurídicos da STH AI. Leia antes de contratar qualquer plano.
          </p>
        </div>

        <div className="space-y-3">
          {AI_LEGAL_DOCS.map((doc) => (
            <button
              key={doc.slug}
              type="button"
              onClick={() => navigate(`/ai/legal/${doc.slug}`)}
              className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{doc.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{doc.subtitle}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {doc.code} · v{doc.version} · {doc.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
          Novos documentos (Política de Privacidade, Política de Planos, Cancelamentos e Reembolsos)
          serão publicados nesta mesma central.
        </p>

        <Button variant="outline" className="w-full" onClick={() => navigate("/ai/app")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o app STH AI
        </Button>
      </div>
    </div>
  );
}
