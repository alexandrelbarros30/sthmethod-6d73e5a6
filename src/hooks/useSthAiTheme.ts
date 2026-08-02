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
    root.classList.remove("dark");
    root.classList.add("theme-sth-green");
    root.classList.toggle("theme-sth-ai", mode === "ocean");
    root.classList.toggle("theme-sth-ai-classic", mode === "classic");
    return () => {
      root.classList.remove("theme-sth-green", "theme-sth-ai", "theme-sth-ai-classic");
    };
  }, [mode]);

  return mode;
}

export default useSthAiTheme;
