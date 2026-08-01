import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, Settings, CreditCard, LogOut, Dumbbell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCoachContext } from "@/hooks/useCoachTenant";

type Item = { to: string; icon: any; label: string };

const PRO_ITEMS: Item[] = [
  { to: "/coach", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/coach/alunos", icon: Users, label: "Alunos" },
  { to: "/coach/convites", icon: UserPlus, label: "Convites" },
  { to: "/coach/planos", icon: CreditCard, label: "Plano" },
  { to: "/coach/configuracoes", icon: Settings, label: "Configurações" },
];

const STUDENT_ITEMS: Item[] = [
  { to: "/coach/aluno", icon: LayoutDashboard, label: "Meu Treino" },
  { to: "/coach/aluno/ficha", icon: Users, label: "Minha Ficha" },
];

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  audience?: "professional" | "student";
  actions?: ReactNode;
}

const CoachLayout = ({ children, title, subtitle, audience = "professional", actions }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { tenant } = useCoachContext();
  const items = audience === "student" ? STUDENT_ITEMS : PRO_ITEMS;

  const handleSignOut = async () => {
    await signOut();
    navigate("/coach/entrar", { replace: true });
  };

  const Brand = () => (
    <div className="flex items-center gap-3 px-5 py-6">
      {tenant?.logo_url ? (
        <img src={tenant.logo_url} alt={`Logo ${tenant.business_name}`} className="h-9 w-9 rounded-xl object-cover" />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold tracking-[-0.02em] truncate">
          {tenant?.business_name || "STH METHOD COACH"}
        </p>
        <p className="text-[11px] text-muted-foreground tracking-tight">STH METHOD COACH</p>
      </div>
    </div>
  );

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 px-3 space-y-1">
      {items.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-tight transition-colors",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      <Brand />
      <Nav onNavigate={onNavigate} />
      <div className="p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.9} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-full bg-background overflow-x-hidden">
      {isMobile ? (
        <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur px-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarBody />
            </SheetContent>
          </Sheet>
          <span className="text-[13px] font-semibold tracking-[-0.02em] truncate">
            {tenant?.business_name || "STH METHOD COACH"}
          </span>
        </header>
      ) : (
        <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-border/60 bg-card/40 backdrop-blur">
          <SidebarBody />
        </aside>
      )}

      <main
        className={cn(
          "min-w-0 overflow-x-hidden",
          isMobile ? "w-full pt-16 px-4 pb-10" : "ml-60 w-[calc(100%-15rem)] px-6 py-8 lg:px-10"
        )}
      >
        <div className="max-w-5xl mx-auto">
          {(title || actions) && (
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.035em] leading-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-[13px] text-muted-foreground mt-2 font-light tracking-tight">{subtitle}</p>
                )}
              </div>
              {actions}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default CoachLayout;