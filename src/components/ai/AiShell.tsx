import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSthAiTheme } from "@/hooks/useSthAiTheme";
import { useAiThemeMode } from "@/hooks/useAiThemeMode";
import { LayoutGrid, Salad, Dumbbell, LineChart, Flame, LogOut, HeartPulse, UserRound, UtensilsCrossed, Camera, CreditCard, Waves, Leaf, Moon } from "lucide-react";
import AiLogoMark from "@/components/ai/AiLogoMark";

const THEME_UI = {
  ocean: { label: "Ocean", icon: Waves, next: "STH clássico" },
  classic: { label: "Clássico", icon: Leaf, next: "Midnight" },
  midnight: { label: "Midnight", icon: Moon, next: "Ocean Premium" },
} as const;

const NAV = [
  { to: "/ai/app", label: "Início", icon: LayoutGrid },
  { to: "/ai/app/diario", label: "Diário", icon: UtensilsCrossed },
  { to: "/ai/app/cardapio", label: "Cardápio", icon: Salad },
  { to: "/ai/app/treino", label: "Treino", icon: Dumbbell },
  { to: "/ai/app/perfil", label: "Perfil", icon: UserRound },
];

const SECONDARY_NAV = [
  { to: "/ai/app/analise", label: "Análise", icon: LineChart },
  { to: "/ai/app/progresso", label: "Evolução", icon: Flame },
  { to: "/ai/app/imagens", label: "Imagens", icon: Camera },
  { to: "/ai/app/saude", label: "Saúde", icon: HeartPulse },
  { to: "/ai/app/coaches", label: "Coaches", icon: UserRound },
  { to: "/ai/assinatura", label: "Assinatura", icon: CreditCard },
];

export default function AiShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  useSthAiTheme();
  const { mode, toggle } = useAiThemeMode();
  const theme = THEME_UI[mode];
  const ThemeIcon = theme.icon;

  async function logout() {
    await supabase.auth.signOut();
    navigate("/ai");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/ai/app" className="flex items-center gap-2">
            <AiLogoMark className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight">
              STH METHOD <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              aria-label={`Usar tema ${theme.next}`}
              title={`Tema: ${theme.label} · tocar para ${theme.next}`}
              className="gap-1.5 px-2"
            >
              <ThemeIcon className="h-4 w-4" />
              <span className="hidden text-xs sm:inline">{theme.label}</span>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ai/assinatura">Plano</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECONDARY_NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary/30 bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-2">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}