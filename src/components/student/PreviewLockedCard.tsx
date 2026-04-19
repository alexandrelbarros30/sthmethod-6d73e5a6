import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

interface PreviewLockedCardProps {
  /** Plain-text content already loaded (we'll show first ~5 lines blurred). */
  previewText?: string | null;
  type: "diet" | "protocol";
}

const TITLES = {
  diet: "Sua Dieta Personalizada está Pronta",
  protocol: "Seu Protocolo Personalizado está Pronto",
};

const SUBTITLES = {
  diet:
    "Nosso time já montou seu plano alimentar com base no seu objetivo. Libere agora para acessar todas as refeições, macros, hidratação e PDF.",
  protocol:
    "Seu protocolo de suplementação e estratégias está montado. Libere agora para acessar todas as categorias, dosagens e orientações.",
};

const PreviewLockedCard = ({ previewText, type }: PreviewLockedCardProps) => {
  const allLines = (previewText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Show first 2 lines fully readable (teaser), then 3 progressively blurred
  const visibleLines = allLines.slice(0, 2);
  const blurredLines = allLines.slice(2, 5);

  const hasPreview = allLines.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="border-primary/30 overflow-hidden">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase">
                Pré-estreia liberada
              </p>
              <h2 className="text-lg font-bold font-display text-foreground leading-tight mt-0.5">
                {TITLES[type]}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{SUBTITLES[type]}</p>
            </div>
          </div>

          {hasPreview && (
            <div className="relative rounded-xl border border-border/60 bg-muted/30 p-4 overflow-hidden">
              {/* Teaser real legível */}
              <div className="space-y-1.5 mb-2">
                {visibleLines.map((l, i) => (
                  <p
                    key={`v-${i}`}
                    className="text-sm text-foreground leading-relaxed"
                    style={{ userSelect: "none" }}
                  >
                    {l}
                  </p>
                ))}
              </div>
              {/* Linhas borradas progressivas */}
              {blurredLines.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  {blurredLines.map((l, i) => (
                    <p
                      key={`b-${i}`}
                      className="text-sm text-foreground"
                      style={{
                        filter: `blur(${Math.min(1.5 + i * 1.2, 7)}px)`,
                        opacity: 1 - i * 0.12,
                        userSelect: "none",
                      }}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-background/95 border border-primary/30 rounded-full px-3 py-1.5 shadow-sm">
                  <Lock className="w-3 h-3" /> +{Math.max(allLines.length - 3, 0)} linhas bloqueadas
                </div>
              </div>
            </div>
          )}

          <Button asChild className="w-full" size="lg">
            <Link to="/dashboard/subscription">
              <Sparkles className="w-4 h-4 mr-2" /> Liberar acesso completo agora
            </Link>
          </Button>

          <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Após o pagamento, todo o conteúdo é liberado automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviewLockedCard;
