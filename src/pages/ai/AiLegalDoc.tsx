import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { getAiLegalDoc } from "@/data/ai-legal-docs";

export default function AiLegalDoc() {
  const { slug } = useParams();
  const navigate = useNavigate();
  useSthAiTheme();
  const doc = getAiLegalDoc(slug);

  if (!doc) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <h1 className="text-xl font-semibold">Documento não encontrado</h1>
          <Button variant="outline" onClick={() => navigate("/ai/legal")}>
            Ver documentos disponíveis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={() => navigate("/ai/legal")}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Documentos
          </button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <header className="space-y-2 border-b border-border pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">STH AI</p>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
          <p className="text-[11px] text-muted-foreground/70">
            Código: {doc.code} · Versão: {doc.version} · Status: {doc.status}
          </p>
        </header>

        <article className="space-y-7">
          {doc.sections.map((s) => (
            <section key={s.title} className="space-y-2">
              <h2 className="text-base font-semibold">{s.title}</h2>
              {s.paragraphs?.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="ml-4 list-disc space-y-1">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <Button variant="outline" className="w-full print:hidden" onClick={() => navigate("/ai/legal")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para os documentos
        </Button>
      </div>
    </div>
  );
}
