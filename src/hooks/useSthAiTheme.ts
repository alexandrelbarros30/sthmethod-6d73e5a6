import { useEffect } from "react";
import { useAiManifest } from "./useAiManifest";

/**
 * Aplica a identidade visual oficial do STH METHOD (Apple Light Premium
 * #F5F5F7 + verde STH #0FA968) em todas as telas do STH AI, inclusive em
 * dialogs/popovers portalizados — igual ao portal do aluno.
 */
export function useSthAiTheme() {
  // Identidade PWA própria (STH AI) em todas as telas /ai
  useAiManifest();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("theme-sth-green");
    root.classList.add("theme-sth-ai");
    return () => {
      root.classList.remove("theme-sth-green");
      root.classList.remove("theme-sth-ai");
    };
  }, []);
}

export default useSthAiTheme;