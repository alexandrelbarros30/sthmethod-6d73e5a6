import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Salad, FlaskConical, Activity, User, Dumbbell, TrendingUp, BookOpen, CreditCard, ListChecks, Lock, LogOut, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const mainItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/dashboard/bioimpedance", icon: Activity, label: "Bio" },
  { to: "/dashboard/diet", icon: Salad, label: "Dieta", center: true },
  { to: "/dashboard/evolution", icon: TrendingUp, label: "Evolução" },
  { to: "/dashboard/protocol", icon: FlaskConical, label: "Protocolo" },
];

const menuItems = [
  { to: "/dashboard/training", icon: Dumbbell, label: "Treino" },
  { to: "/dashboard/guided-workout", icon: ListChecks, label: "Treino Guiado" },
  { to: "/dashboard/content", icon: BookOpen, label: "Conteúdo" },
  { to: "/dashboard/subscription", icon: CreditCard, label: "Assinatura" },
];

const FloatingDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
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

  return (
    <>
      {/* Spacer so content doesn't hide behind dock */}
      <div className="h-20" />

      {/* Floating Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
          className="relative flex items-center justify-around rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-2"
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
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                      active
                        ? "bg-primary shadow-primary/40"
                        : "bg-primary/80 shadow-primary/20"
                    )}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" />
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
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
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

          {/* Account menu trigger */}
          <div ref={menuRef} className="relative flex flex-col items-center gap-0.5 py-1 px-1 min-w-[3rem]">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                menuOpen
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <User className="w-5 h-5" />
            </motion.button>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}>
              Conta
            </span>

            {/* Dropdown menu */}
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-3 w-52 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-1.5 space-y-0.5"
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/80 hover:bg-muted/60"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
                <div className="h-px bg-border/50 my-1" />
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
