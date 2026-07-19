import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Salad, FlaskConical, Activity, User, Dumbbell, TrendingUp, BookOpen, CreditCard, ListChecks, LogOut, FileText, Microscope, Megaphone, Newspaper, Sparkles, Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/dashboard/evolution", icon: TrendingUp, label: "Atualização" },
  { to: "/dashboard/diet", icon: Salad, label: "Dieta", center: true },
  { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
  { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
];

const menuItems = [
  { to: "/dashboard/profile", icon: FileText, label: "Minha Ficha" },
  { to: "/dashboard/bioimpedance", icon: Activity, label: "Bioimpedância" },
  { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
  { to: "/tendencias", icon: Newspaper, label: "STH News" },
  { to: "/dashboard/metabolic", icon: Microscope, label: "Central de Análise" },
  { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
  { to: "/dashboard/ads", icon: Megaphone, label: "Propagandas" },
  { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
  { to: "/baixar-app", icon: Download, label: "Baixar App" },
  { to: "/sobre", icon: Info, label: "Novidades & Versão" },
];

const FloatingDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  // Preserve ?preview_as=<uuid> across student navigation so admins/consultores
  // previewing a student don't get bounced back to /admin by ProtectedRoute.
  const previewAs = new URLSearchParams(location.search).get("preview_as");
  const withPreview = (to: string) => {
    if (!previewAs) return to;
    if (to.startsWith("http")) return to;
    return `${to}${to.includes("?") ? "&" : "?"}preview_as=${previewAs}`;
  };
  const go = (to: string) => navigate(withPreview(to));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const isActive = (path: string) => location.pathname === path;
  const firstName = profile?.full_name?.split(" ")[0] || "";

  return (
    <>
      <div className="h-24" />

      <div className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md" style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.1 }}
          className="relative flex items-center justify-around rounded-full border border-border/60 bg-background/90 backdrop-blur-xl px-2 py-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
        >
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            if (item.center) {
              return (
                <button
                  key={item.to}
                  onClick={() => go(item.to)}
                  className="relative -mt-5 flex flex-col items-center"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="w-[54px] h-[54px] rounded-full flex items-center justify-center bg-foreground shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)]"
                  >
                    <Icon className="w-[22px] h-[22px] text-background" strokeWidth={1.8} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium transition-colors tracking-tight",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.to}
                onClick={() => go(item.to)}
                className="flex flex-col items-center gap-0.5 py-1 px-1 min-w-[3rem]"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.6} />
                </motion.div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors tracking-tight",
                  active ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Profile menu trigger */}
          <div ref={menuRef} className="relative flex flex-col items-center gap-0.5 py-1 px-1 min-w-[3rem]">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                menuOpen ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Avatar className="w-7 h-7 relative z-10">
                <AvatarImage src={profile?.avatar_url || ""} alt={firstName} />
                <AvatarFallback className="text-[10px] font-medium bg-foreground/10 text-foreground">
                  {firstName.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>
            </motion.button>
            <span className={cn(
              "text-[10px] font-medium transition-colors tracking-tight",
              menuOpen ? "text-foreground" : "text-muted-foreground"
            )}>
              Perfil
            </span>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                className="absolute bottom-full right-0 mb-3 w-56 rounded-3xl bg-background border border-border/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] p-2 space-y-0.5"
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <button
                      key={item.to}
                      onClick={() => { go(item.to); setMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors tracking-tight",
                        active
                          ? "bg-foreground/10 text-foreground"
                          : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                      {item.label}
                    </button>
                  );
                })}
                <div className="h-px bg-border/40 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (location.pathname !== "/dashboard") go("/dashboard");
                    setTimeout(() => window.dispatchEvent(new Event("sth:open-welcome-tour")), 250);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors tracking-tight"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.8} />
                  Refazer guia
                </button>
                <button
                  onClick={() => { signOut(); navigate("/"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium text-foreground/60 hover:bg-muted/60 hover:text-foreground transition-colors tracking-tight"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.8} />
                  Sair
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FloatingDock;
