import { Link, useLocation, useNavigate } from "react-router-dom";
import { Salad, Dumbbell, FlaskConical, BookOpen, LayoutDashboard, LogOut, User, CreditCard, Palette, PanelTop, Wallet, MessageSquare, Menu, Users, ClipboardList, TrendingUp, ListChecks, Layers, Apple, Ticket, Activity, Microscope, Megaphone, Bell, Receipt, Newspaper, ListOrdered, RefreshCw, NotebookPen, AlertCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useEvolutionStatus } from "@/hooks/useEvolutionStatus";

type AppRole = "student" | "admin" | "admin_viewer" | "consultor" | "assistente" | "financeiro";

interface SidebarProps {
  role: AppRole;
}

const linksByRole: Record<AppRole, { to: string; icon: any; label: string }[]> = {
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
    { to: "/dashboard/profile", icon: ClipboardList, label: "Minha Ficha" },
    { to: "/dashboard/evolution", icon: TrendingUp, label: "Atualização" },
    { to: "/dashboard/bioimpedance", icon: Activity, label: "Bioimpedância" },
    { to: "/dashboard/diet", icon: Salad, label: "Dieta" },
    { to: "/diario-alimentar", icon: NotebookPen, label: "Diário Alimentar" },
    { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
    { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
    { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
    { to: "/dashboard/metabolic", icon: Microscope, label: "Central de Análise" },
    { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
    { to: "/tendencias", icon: Newspaper, label: "STH News" },
    { to: "/dashboard/ads", icon: Megaphone, label: "Propagandas" },
    { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
  ],
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/admin/students", icon: User, label: "Alunos" },
    { to: "/admin/plans", icon: CreditCard, label: "Planos" },
    { to: "/admin/payments", icon: Wallet, label: "Pagamentos" },
    { to: "/admin/revenue", icon: TrendingUp, label: "Faturamento" },
    { to: "/admin/billing", icon: AlertCircle, label: "Cobranças e Renovações" },
    { to: "/admin/crm", icon: Megaphone, label: "Campanhas & Ofertas" },
    { to: "/admin/diet", icon: Salad, label: "Dietas" },
    { to: "/admin/diet-library", icon: BookOpen, label: "Bib. Dietas" },
    { to: "/admin/nutrition", icon: Apple, label: "Cardápio" },
    { to: "/admin/exercise-library", icon: BookOpen, label: "Biblioteca" },
    { to: "/admin/workout-templates", icon: Dumbbell, label: "Programas de Treino" },
    { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
    { to: "/admin/protocol-library", icon: BookOpen, label: "Bib. Protocolos" },
    { to: "/admin/messages", icon: MessageSquare, label: "Mensagens" },
    { to: "/admin/content", icon: Palette, label: "Personalização" },
    { to: "/admin/layout", icon: PanelTop, label: "Layout Externo" },
    { to: "/admin/roles", icon: Users, label: "Permissões" },
    { to: "/admin/staff", icon: ClipboardList, label: "Equipe" },
    { to: "/admin/coupons", icon: Ticket, label: "Cupons" },
    { to: "/admin/popups", icon: Megaphone, label: "Popups" },
    { to: "/admin/notifications", icon: Bell, label: "Notificações" },
    { to: "/admin/budgets", icon: Receipt, label: "Orçamentos" },
    { to: "/admin/ads", icon: Megaphone, label: "Propagandas" },
    { to: "/admin/updates", icon: RefreshCw, label: "Atualizações" },
  ],
  admin_viewer: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/admin/students", icon: User, label: "Alunos" },
    { to: "/admin/plans", icon: CreditCard, label: "Planos" },
    { to: "/admin/payments", icon: Wallet, label: "Pagamentos" },
    { to: "/admin/revenue", icon: TrendingUp, label: "Faturamento" },
    { to: "/admin/diet", icon: Salad, label: "Dietas" },
    { to: "/admin/nutrition", icon: Apple, label: "Cardápio" },
    { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
    { to: "/admin/messages", icon: MessageSquare, label: "Mensagens" },
    { to: "/admin/content", icon: Palette, label: "Personalização" },
  ],
  consultor: [
    { to: "/consultor", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/consultor/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/consultor/students", icon: Users, label: "Meus Alunos" },
    { to: "/consultor/billing", icon: AlertCircle, label: "Cobranças e Renovações" },
    { to: "/consultor/crm", icon: Megaphone, label: "Campanhas & Ofertas" },
    { to: "/consultor/diet", icon: Salad, label: "Dietas" },
    { to: "/consultor/diet-library", icon: BookOpen, label: "Bib. Dietas" },
    { to: "/consultor/nutrition", icon: Apple, label: "Cardápio" },
    { to: "/consultor/protocol", icon: FlaskConical, label: "Protocolos" },
    { to: "/consultor/protocol-library", icon: BookOpen, label: "Bib. Protocolos" },
    { to: "/consultor/exercise-library", icon: BookOpen, label: "Biblioteca" },
    { to: "/consultor/workout-templates", icon: Dumbbell, label: "Programas de Treino" },
  ],
  assistente: [
    { to: "/assistente", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/assistente/students", icon: Users, label: "Alunos" },
    { to: "/assistente/register", icon: ClipboardList, label: "Cadastrar Aluno" },
  ],
  financeiro: [
    { to: "/financeiro", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/financeiro/payments", icon: Wallet, label: "Pagamentos" },
    { to: "/financeiro/billing", icon: Receipt, label: "Faturamento" },
    { to: "/financeiro/cobrancas", icon: AlertCircle, label: "Cobranças e Renovações" },
    { to: "/financeiro/plans", icon: CreditCard, label: "Planos" },
    { to: "/financeiro/revenue", icon: TrendingUp, label: "Receita" },
  ],
};

const roleLabelMap: Record<AppRole, string> = {
  admin: "Painel Administrativo",
  admin_viewer: "Painel Admin (Visualização)",
  consultor: "Painel do Consultor",
  assistente: "Painel do Assistente",
  financeiro: "Painel Financeiro",
  student: "Área do Aluno",
};

const SidebarNav = ({ role, links, onNavClick }: { role: string; links: { to: string; icon: any; label: string }[]; onNavClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { data: evolutionStatus } = useEvolutionStatus();
  const evolutionDue = role === "student" && evolutionStatus && (evolutionStatus.status === "due" || evolutionStatus.status === "late" || evolutionStatus.status === "never");

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Header */}
      <div className="px-5 py-5 border-b border-sidebar-border/60">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
            <span className="text-background font-bold text-xs tracking-tight">ST</span>
          </div>
          <span className="font-display text-lg font-semibold text-sidebar-foreground tracking-tight">STH</span>
        </Link>
        <p className="text-[11px] text-muted-foreground mt-1.5 font-body tracking-wide uppercase">
          {roleLabelMap[role as AppRole] || "Painel"}
        </p>
        {profile?.full_name && (
          <p className="text-xs text-sidebar-foreground/70 mt-0.5 font-body truncate">
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          const showBadge = evolutionDue && link.to === "/dashboard/evolution";
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 font-body relative",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <link.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1">{link.label}</span>
              {showBadge && (
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-foreground text-background">
                  •
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border/60 flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors font-body"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <ThemeToggle />
      </div>
    </>
  );
};

const DashboardSidebar = ({ role }: SidebarProps) => {
  const isMobile = useIsMobile();
  const links = linksByRole[role] || linksByRole.student;
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-12 bg-background/80 backdrop-blur-2xl border-b border-border/50 z-50 flex items-center px-4 gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-accent text-foreground/70 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-background border-border/50">
              <div className="flex flex-col h-full">
                <SidebarNav role={role} links={links} onNavClick={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[10px]">ST</span>
            </div>
            <span className="font-display text-base font-semibold text-foreground tracking-tight">STH</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-background/60 backdrop-blur-2xl flex flex-col border-r border-border/50 z-40">
      <SidebarNav role={role} links={links} />
    </aside>
  );
};

export default DashboardSidebar;
