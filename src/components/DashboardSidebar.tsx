import { Link, useLocation, useNavigate } from "react-router-dom";
import { Salad, Dumbbell, FlaskConical, BookOpen, LayoutDashboard, LogOut, User, CreditCard, Palette, PanelTop, Wallet, MessageSquare, Menu, Users, ClipboardList, TrendingUp, ListChecks, Apple, Ticket, Activity, Microscope, Megaphone, Bell, Receipt, Newspaper, ListOrdered, RefreshCw, NotebookPen, ChevronDown, DollarSign, Inbox, Send, Sparkles, CheckSquare, Zap, Workflow, Mail, ImageIcon, Brain } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useEvolutionStatus } from "@/hooks/useEvolutionStatus";

type AppRole = "student" | "admin" | "admin_viewer" | "consultor" | "assistente" | "financeiro";

interface SidebarProps {
  role: AppRole;
}

type NavLeaf = { to: string; icon: any; label: string };
type NavGroup = { group: string; icon: any; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => (item as NavGroup).group !== undefined;

const linksByRole: Record<AppRole, NavItem[]> = {
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
    { to: "/dashboard/profile", icon: ClipboardList, label: "Minha Ficha" },
    { to: "/dashboard/evolution", icon: TrendingUp, label: "Atualização" },
    { to: "/dashboard/bioimpedance", icon: Activity, label: "Bioimpedância" },
    {
      group: "Nutrição",
      icon: Salad,
      children: [
        { to: "/dashboard/diet", icon: Salad, label: "Dieta" },
        { to: "/diario-alimentar", icon: NotebookPen, label: "Diário Alimentar" },
      ],
    },
    {
      group: "Treino",
      icon: Dumbbell,
      children: [
        { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
        { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
      ],
    },
    { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
    { to: "/dashboard/metabolic", icon: Microscope, label: "Central de Análise" },
    {
      group: "Conteúdo",
      icon: BookOpen,
      children: [
        { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
        { to: "/tendencias", icon: Newspaper, label: "STH News" },
        { to: "/dashboard/ads", icon: Megaphone, label: "Propagandas" },
      ],
    },
    { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
  ],
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/admin/plans", icon: CreditCard, label: "Planos" },
    {
      group: "CRM",
      icon: MessageSquare,
      children: [
        { to: "/admin/crm", icon: Inbox, label: "Conversas" },
        { to: "/admin/crm/pipeline", icon: TrendingUp, label: "Pipeline Comercial" },
        { to: "/admin/crm/filas", icon: ListOrdered, label: "Filas" },
        { to: "/admin/crm/campanhas", icon: Send, label: "Campanhas" },
        { to: "/admin/crm/automacoes", icon: Zap, label: "Automações" },
        { to: "/admin/crm/grupos-agenda", icon: Users, label: "Disparos em Grupos" },
        { to: "/admin/crm/templates", icon: NotebookPen, label: "Templates" },
        { to: "/admin/crm/tarefas", icon: CheckSquare, label: "Tarefas" },
        { to: "/admin/crm/ia", icon: Sparkles, label: "IA" },
        { to: "/admin/crm/supercoach", icon: Zap, label: "SuperCoach" },
        { to: "/admin/crm/fluxo", icon: Workflow, label: "Fluxo Atendimento" },
        { to: "/admin/crm/configuracoes", icon: PanelTop, label: "Configurações WhatsApp" },
      ],
    },
    {
      group: "Financeiro",
      icon: DollarSign,
      children: [
        { to: "/admin/payments", icon: Wallet, label: "Pagamentos" },
        { to: "/admin/payment-links", icon: Wallet, label: "Links de Pagamento" },
        { to: "/admin/revenue", icon: TrendingUp, label: "Faturamento" },
      ],
    },
    { to: "/admin/image-consents", icon: ImageIcon, label: "Autorização de Imagens" },
    {
      group: "Nutrição",
      icon: Salad,
      children: [
        { to: "/admin/diet", icon: Salad, label: "Dietas" },
        { to: "/admin/diet-library", icon: BookOpen, label: "Bib. Dietas" },
        { to: "/admin/nutrition", icon: Apple, label: "Cardápio" },
      ],
    },
    {
      group: "Treino",
      icon: Dumbbell,
      children: [
        { to: "/admin/exercise-library", icon: BookOpen, label: "Biblioteca" },
        { to: "/admin/workout-templates", icon: Dumbbell, label: "Programas de Treino" },
      ],
    },
    {
      group: "Protocolos",
      icon: FlaskConical,
      children: [
        { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
        { to: "/admin/protocol-library", icon: BookOpen, label: "Bib. Protocolos" },
      ],
    },
    {
      group: "Conteúdo",
      icon: Palette,
      children: [
        { to: "/admin/content", icon: Palette, label: "Personalização" },
        { to: "/admin/layout", icon: PanelTop, label: "Layout Externo" },
        { to: "/admin/popups", icon: Megaphone, label: "Popups" },
        { to: "/admin/notifications", icon: Bell, label: "Notificações" },
        { to: "/admin/updates", icon: RefreshCw, label: "Atualizações" },
        { to: "/admin/sthia", icon: Brain, label: "STHIA (IA)" },
      ],
    },
    {
      group: "Equipe",
      icon: Users,
      children: [
        { to: "/admin/roles", icon: Users, label: "Permissões" },
        { to: "/admin/staff", icon: ClipboardList, label: "Equipe" },
      ],
    },
    { to: "/admin/coupons", icon: Ticket, label: "Cupons" },
    { to: "/admin/budgets", icon: Receipt, label: "Orçamentos" },
    { to: "/admin/emails", icon: Mail, label: "E-mails" },
  ],
  admin_viewer: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/admin/plans", icon: CreditCard, label: "Planos" },
    {
      group: "Financeiro",
      icon: DollarSign,
      children: [
        { to: "/admin/payments", icon: Wallet, label: "Pagamentos" },
        { to: "/admin/payment-links", icon: Wallet, label: "Links de Pagamento" },
        { to: "/admin/revenue", icon: TrendingUp, label: "Faturamento" },
      ],
    },
    {
      group: "Nutrição",
      icon: Salad,
      children: [
        { to: "/admin/diet", icon: Salad, label: "Dietas" },
        { to: "/admin/nutrition", icon: Apple, label: "Cardápio" },
      ],
    },
    {
      group: "Protocolos",
      icon: FlaskConical,
      children: [
        { to: "/admin/protocol", icon: FlaskConical, label: "Protocolos" },
      ],
    },
    {
      group: "Conteúdo",
      icon: Palette,
      children: [
        { to: "/admin/content", icon: Palette, label: "Personalização" },
      ],
    },
  ],
  consultor: [
    { to: "/consultor", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/consultor/queue", icon: ListOrdered, label: "Fila Atendimento" },
    { to: "/consultor/students", icon: Users, label: "Meus Alunos" },
    { to: "/consultor/image-consents", icon: ImageIcon, label: "Autorização de Imagens" },
    {
      group: "Nutrição",
      icon: Salad,
      children: [
        { to: "/consultor/diet", icon: Salad, label: "Dietas" },
        { to: "/consultor/diet-library", icon: BookOpen, label: "Bib. Dietas" },
        { to: "/consultor/nutrition", icon: Apple, label: "Cardápio" },
      ],
    },
    {
      group: "Protocolos",
      icon: FlaskConical,
      children: [
        { to: "/consultor/protocol", icon: FlaskConical, label: "Protocolos" },
        { to: "/consultor/protocol-library", icon: BookOpen, label: "Bib. Protocolos" },
      ],
    },
    {
      group: "Treino",
      icon: Dumbbell,
      children: [
        { to: "/consultor/exercise-library", icon: BookOpen, label: "Biblioteca" },
        { to: "/consultor/workout-templates", icon: Dumbbell, label: "Programas de Treino" },
      ],
    },
  ],
  assistente: [
    { to: "/assistente", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/assistente/students", icon: Users, label: "Alunos" },
    { to: "/assistente/register", icon: ClipboardList, label: "Cadastrar Aluno" },
  ],
  financeiro: [
    { to: "/financeiro", icon: LayoutDashboard, label: "Dashboard" },
    {
      group: "Financeiro",
      icon: DollarSign,
      children: [
        { to: "/financeiro/payments", icon: Wallet, label: "Pagamentos" },
        { to: "/financeiro/payment-links", icon: Wallet, label: "Links de Pagamento" },
        { to: "/financeiro/billing", icon: Receipt, label: "Faturamento" },
        { to: "/financeiro/revenue", icon: TrendingUp, label: "Receita" },
      ],
    },
    { to: "/financeiro/plans", icon: CreditCard, label: "Planos" },
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

const SidebarNav = ({ role, links, onNavClick }: { role: string; links: NavItem[]; onNavClick?: () => void }) => {
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
        {(links as NavItem[]).map((item) => {
          if (isGroup(item)) {
            return (
              <NavGroupItem key={item.group} group={item} onNavClick={onNavClick} />
            );
          }
          const link = item;
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

const NavGroupItem = ({ group, onNavClick }: { group: NavGroup; onNavClick?: () => void }) => {
  const location = useLocation();
  const hasActive = group.children.some((c) => location.pathname === c.to);
  const [open, setOpen] = useState(hasActive);
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 font-body",
          hasActive
            ? "text-foreground"
            : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
        )}
      >
        <group.icon className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left">{group.group}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="ml-3 pl-3 border-l border-sidebar-border/60 space-y-0.5 max-w-full overflow-x-auto">
          {group.children.map((child) => {
            const active = location.pathname === child.to;
            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 font-body whitespace-nowrap",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <child.icon className="w-[16px] h-[16px] shrink-0" />
                <span className="flex-1 pr-2">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
