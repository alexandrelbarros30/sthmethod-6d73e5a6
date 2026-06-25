import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PUBLIC_PREFIXES = [
  "/login", "/forgot-password", "/reset-password", "/cadastro",
  "/questionario", "/install", "/como-funciona", "/free",
  "/tendencias", "/promo", "/evolucao", "/fila",
  "/cas", "/mead",
];

const isPublicPath = (p: string) => {
  if (p === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
};

/**
 * Forces dark theme for AUTHENTICATED areas only (admin, consultor, students).
 * Public/external pages keep the Apple light theme (handled by usePublicAppleTheme).
 */
export function useAdminTheme() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (isPublicPath(pathname)) {
      // Public area: ensure light Apple theme
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("app-theme", "light");
    } else {
      // Student area: respect accessibility theme override (light palettes)
      if (pathname.startsWith("/dashboard")) {
        const a11y = localStorage.getItem("a11y-theme");
        if (a11y && a11y !== "default") {
          root.classList.remove("dark");
          root.classList.add("light");
          return;
        }
      }
      // Authenticated area: force dark
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("app-theme", "dark");
    }
  }, [pathname]);

  return "dark" as const;
}
