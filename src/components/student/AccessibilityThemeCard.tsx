import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accessibility, Check } from "lucide-react";
import { useAccessibilityTheme, A11Y_THEMES } from "@/hooks/useAccessibilityTheme";
import { cn } from "@/lib/utils";

const AccessibilityThemeCard = () => {
  const { theme, setTheme } = useAccessibilityTheme();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Accessibility className="w-4 h-4" /> Acessibilidade visual
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cores alternativas para conforto visual (TDAH, dislexia, sensibilidade sensorial)
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {A11Y_THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
              theme === t.id ? "border-primary bg-accent" : "border-border"
            )}
          >
            <span className="text-2xl leading-none">{t.emoji}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.description}</span>
            </span>
            {theme === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default AccessibilityThemeCard;
