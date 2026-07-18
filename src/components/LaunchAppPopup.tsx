import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Sparkles, Download, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import marketingHero from "@/assets/marketing-launch-hero.png";

const STORAGE_KEY = "sth:launch-popup-v1-dismissed";
const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/login", "/cadastro", "/reset-password", "/forgot-password", "/questionario", "/install", "/baixar-app", "/download", "/sobre"];

interface Props {
  /** show only on public site (Landing) when true; else show only inside dashboard */
  scope: "site" | "app";
}

export default function LaunchAppPopup({ scope }: Props) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    if (scope === "site") {
      const path = location.pathname;
      if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return;
    }

    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [scope, location.pathname]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-black shadow-[0_0_120px_-20px_rgba(57,255,20,0.55)] overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src={marketingHero}
          alt="STH METHOD — App disponível"
          width={1280}
          height={720}
          className="w-full h-auto"
        />
        <div className="p-6 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-[10px] tracking-[0.2em] uppercase">
            <Sparkles className="w-3 h-3" /> Novo · v1.0
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            App STH METHOD disponível
          </h3>
          <p className="text-sm text-white/60">
            Dieta, Protocolo e Treino no seu bolso. Baixe agora e leve seu acompanhamento para qualquer lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild size="lg" className="flex-1 rounded-full" onClick={close}>
              <Link to="/baixar-app">
                <Download className="w-4 h-4 mr-2" /> Baixar Android
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/5" onClick={close}>
              <Link to="/baixar-app">
                <Apple className="w-4 h-4 mr-2" /> Instalar iPhone
              </Link>
            </Button>
          </div>
          <button onClick={close} className="text-xs text-white/40 hover:text-white/70 transition pt-1">
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}