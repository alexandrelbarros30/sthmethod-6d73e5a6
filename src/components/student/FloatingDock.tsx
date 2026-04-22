import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Salad, FlaskConical, Activity, User, Dumbbell, TrendingUp, BookOpen, CreditCard, ListChecks, LogOut, FileText, Shield, Microscope, Megaphone, Newspaper } from "lucide-react";
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
  { to: "/dashboard/metabolic", icon: Microscope, label: "Painel Metabólico" },
  { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
  { to: "/dashboard/ads", icon: Megaphone, label: "Propagandas" },
  { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
];

const FloatingDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
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
          className="relative flex items-center justify-around rounded-[26px] border border-white/[0.08] bg-black/70 backdrop-blur-xl px-2 py-2.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            if (item.center) {
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="relative -mt-5 flex flex-col items-center"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    animate={{ boxShadow: [
                      "0 0 0 0 hsl(var(--primary) / 0.45), 0 8px 24px -6px hsl(var(--primary) / 0.5)",
                      "0 0 0 8px hsl(var(--primary) / 0), 0 8px 24px -6px hsl(var(--primary) / 0.5)",
                    ]}}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                    className={cn(
                      "w-[54px] h-[54px] rounded-full flex items-center justify-center bg-primary"
                    )}
                  >
                    <Icon className="w-[22px] h-[22px] text-primary-foreground drop-shadow-[0_0_6px_rgb(255_255_255_/_0.6)]" />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-0.5 py-1 px-1 min-w-[3rem]"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary shadow-[0_0_14px_-2px_hsl(var(--primary)/0.55),inset_0_0_8px_hsl(var(--primary)/0.15)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-[18px] h-[18px]", active && "neon-icon")} />
                </motion.div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
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
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200",
                menuOpen
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={profile?.avatar_url || ""} alt={firstName} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {firstName.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>
            </motion.button>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}>
              Perfil
            </span>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                className="absolute bottom-full right-0 mb-3 w-52 rounded-2xl bg-card border border-border shadow-apple-lg p-1.5 space-y-0.5"
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-accent"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
                <div className="h-px bg-border/40 my-1" />
                <button
                  onClick={() => { signOut(); navigate("/"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-destructive hover:bg-destructive/8 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
