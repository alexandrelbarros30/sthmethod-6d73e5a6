import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Force the pure Apple.com light style on all public/external pages.
 * - White background (#ffffff)
 * - Apple gray surface (#f5f5f7) for alternating sections
 * - Black foreground
 * Runs in App.tsx and reacts to route changes.
 */
const PUBLIC_PREFIXES = [
  "/", // landing (exact handled below)
  "/login",
  "/forgot-password",
  "/reset-password",
  "/cadastro",
  "/questionario",
  "/install",
  "/como-funciona",
  "/free",
  "/tendencias",
  "/promo",
  "/evolucao",
  "/fila",
  "/cas",
];

const isPublic = (pathname: string) => {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
  );
};

export function usePublicAppleTheme() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (!isPublic(pathname)) return;

    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.setProperty("--background", "0 0% 100%");
    root.style.setProperty("--foreground", "0 0% 7%");
    root.style.setProperty("--surface", "240 6% 97%");
    root.style.setProperty("--muted", "240 6% 97%");
    root.style.setProperty("--muted-foreground", "0 0% 40%");
    root.style.setProperty("--card", "0 0% 100%");
    root.style.setProperty("--border", "0 0% 91%");

    return () => {
      if (hadDark) root.classList.add("dark");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--surface");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--muted-foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--border");
    };
  }, [pathname]);
}
