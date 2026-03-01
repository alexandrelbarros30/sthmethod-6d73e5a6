import { Link, useLocation, useNavigate } from "react-router-dom";
import { Salad, Dumbbell, FlaskConical, BookOpen, LayoutDashboard, LogOut, User, CreditCard, Palette, PanelTop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  role: "student" | "admin";
}

const studentLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
  { to: "/dashboard/diet", icon: Salad, label: "Dieta" },
  { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
  { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
  { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
  { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
];

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/students", icon: User, label: "Alunos" },
  { to: "/admin/plans", icon: CreditCard, label: "Planos" },
  { to: "/admin/diet", icon: Salad, label: "Dietas" },
  { to: "/admin/training", icon: Dumbbell, label: "Treinos" },
  { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
  { to: "/admin/content", icon: Palette, label: "Personalização" },
  { to: "/admin/layout", icon: PanelTop, label: "Layout Externo" },
];

const DashboardSidebar = ({ role }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const links = role === "admin" ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col border-r border-sidebar-border z-40">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">ST</span>
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">ST&H</span>
        </Link>
        <p className="text-xs text-sidebar-foreground/50 mt-1 font-body">
          {role === "admin" ? "Painel Administrativo" : "Área do Aluno"}
        </p>
        {profile?.full_name && (
          <p className="text-xs text-sidebar-foreground/70 mt-1 font-body truncate">
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
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

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors font-body w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
