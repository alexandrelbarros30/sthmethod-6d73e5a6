import { useEffect } from "react";

/**
 * Aplica a identidade visual oficial do STH METHOD (Apple Light Premium
 * #F5F5F7 + verde STH #0FA968) em todas as telas do STH AI, inclusive em
 * dialogs/popovers portalizados — igual ao portal do aluno.
 */
export function useSthAiTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("theme-sth-green");
    return () => root.classList.remove("theme-sth-green");
  }, []);
}

export default useSthAiTheme;