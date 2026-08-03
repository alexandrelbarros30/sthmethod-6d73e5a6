import { useEffect } from "react";
import { useAiManifest } from "./useAiManifest";
import { useAiThemeMode } from "./useAiThemeMode";

/**
 * Tema do STH AI. Dois modos:
 *  - "ocean"   → Ocean Premium (paleta Ocean Deep + Urbanist/Epilogue)
 *  - "classic" → STH clássico (Apple Light #F5F5F7 + verde STH #0FA968)
 */
export function useSthAiTheme() {
  useAiManifest();
  const { mode } = useAiThemeMode();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "midnight");
    // Midnight é um tema escuro completo: não pode herdar as superfícies
    // claras do tema STH green / Ocean.
    root.classList.toggle("theme-sth-green", mode !== "midnight");
    root.classList.toggle("theme-sth-ai", mode === "ocean");
    root.classList.toggle("theme-sth-ai-classic", mode === "classic");
    root.classList.toggle("theme-sth-ai-midnight", mode === "midnight");
    return () => {
      root.classList.remove("theme-sth-green", "theme-sth-ai", "theme-sth-ai-classic", "theme-sth-ai-midnight", "dark");
    };
  }, [mode]);

  return mode;
}

export default useSthAiTheme;
