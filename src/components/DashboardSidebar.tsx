import { Link, useLocation, useNavigate } from "react-router-dom";
import { Salad, Dumbbell, FlaskConical, BookOpen, LayoutDashboard, LogOut, User, CreditCard, Palette, PanelTop, Wallet, MessageSquare, Menu, Users, ClipboardList, TrendingUp, ListChecks, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type AppRole = "student" | "admin" | "consultor" | "assistente" | "financeiro";

interface SidebarProps {
  role: AppRole;
}

const linksByRole: Record<AppRole, { to: string; icon: any; label: string }[]> = {
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
    { to: "/dashboard/diet", icon: Salad, label: "Dieta" },
    { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
    { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
    { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
    { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
    { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
  ],
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/students", icon: User, label: "Alunos" },
    { to: "/admin/plans", icon: CreditCard, label: "Planos" },
    { to: "/admin/payments", icon: Wallet, label: "Pagamentos" },
    { to: "/admin/diet", icon: Salad, label: "Dietas" },
    { to: "/admin/training", icon: Dumbbell, label: "Treinos" },
    { to: "/admin/exercise-library", icon: BookOpen, label: "Biblioteca" },
    { to: "/admin/workout-templates", icon: Layers, label: "ProgramaTreino" },
    { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
    { to: "/admin/messages", icon: MessageSquare, label: "Mensagens" },
    { to: "/admin/content", icon: Palette, label: "Personalização" },
    { to: "/admin/layout", icon: PanelTop, label: "Layout Externo" },
    { to: "/admin/roles", icon: Users, label: "Permissões" },
    { to: "/admin/staff", icon: ClipboardList, label: "Equipe" },
  ],
  consultor: [
    { to: "/consultor", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/consultor/students", icon: Users, label: "Meus Alunos" },
    { to: "/consultor/diet", icon: Salad, label: "Dietas" },
    { to: "/consultor/training", icon: Dumbbell, label: "Treinos" },
    { to: "/consultor/protocol", icon: FlaskConical, label: "Protocolos" },
    { to: "/consultor/exercise-library", icon: BookOpen, label: "Biblioteca" },
    { to: "/consultor/workout-templates", icon: ClipbLayers, label: "ProgramaTreino" },
  ],
  assistente: [
    { to: "/assistente", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/assistente/students", icon: Users, label: "Alunos" },
    { to: "/assistente/register", icon: ClipboardList, label: "Cadastrar Aluno" },
  ],
  financeiro: [
    { to: "/financeiro", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/financeiro/payments", icon: Wallet, label: "Pagamentos" },
    { to: "/financeiro/plans", icon: CreditCard, label: "Planos" },
    { to: "/financeiro/revenue", icon: TrendingUp, label: "Receita" },
  ],
};

const roleLabelMap: Record<AppRole, string> = {
  admin: "Painel Administrativo",
  consultor: "Painel do Consultor",
  assistente: "Painel do Assistente",
  financeiro: "Painel Financeiro",
  student: "Área do Aluno",
};

const SidebarContent = ({ role, links, onNavClick }: { role: string; links: { to: string; icon: any; label: string }[]; onNavClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2" onClick={onNavClick}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">ST</span>
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">ST&H</span>
        </Link>
        <p className="text-xs text-sidebar-foreground/50 mt-1 font-body">
          {roleLabelMap[role as AppRole] || "Painel"}
        </p>
        {profile?.full_name && (
          <p className="text-xs text-sidebar-foreground/70 mt-1 font-body truncate">
            {profile.full_name}
          </p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 font-body",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors font-body w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
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
        <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4 gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <div className="flex flex-col h-full">
                <SidebarContent role={role} links={links} onNavClick={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-xs">ST</span>
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">ST&H</span>
          </Link>
        </div>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col border-r border-sidebar-border z-40">
      <SidebarContent role={role} links={links} />
    </aside>
  );
};

export default DashboardSidebar;
