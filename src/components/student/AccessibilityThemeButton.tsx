import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Accessibility, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAccessibilityTheme, A11Y_THEMES, type A11yTheme } from "@/hooks/useAccessibilityTheme";
import { cn } from "@/lib/utils";

const AccessibilityThemeButton = () => {
  const { pathname } = useLocation();
  const { theme, setTheme } = useAccessibilityTheme();
  const [open, setOpen] = useState(false);

  if (!pathname.startsWith("/dashboard")) return null;

  const handlePick = (id: A11yTheme) => {
    setTheme(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed z-50 rounded-full h-11 w-11 shadow-apple-lg border-2 border-white/20 text-white hover:opacity-90"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 164px)",
            right: "calc(env(safe-area-inset-right) + 12px)",
            backgroundColor: "#0A84FF",
          }}
          aria-label="Acessibilidade visual"
          title="Acessibilidade visual"
        >
          <Accessibility className="h-5 w-5 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-72 p-2">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">Conforto visual</p>
          <p className="text-xs text-muted-foreground">Escolha uma paleta mais harmônica</p>
        </div>
        <div className="space-y-1">
          {A11Y_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handlePick(t.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent",
                theme === t.id && "bg-accent"
              )}
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{t.label}</span>
                <span className="block text-xs text-muted-foreground truncate">{t.description}</span>
              </span>
              {theme === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityThemeButton;
