import { useEffect, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type A11yTheme = "default" | "cream" | "irlen" | "pastel" | "contrast";

export const A11Y_THEMES: { id: A11yTheme; label: string; emoji: string; description: string }[] = [
  { id: "default", label: "Escuro padrão", emoji: "🌙", description: "Tema STH escuro original" },
  { id: "cream", label: "Bege suave", emoji: "🤎", description: "Reduz cansaço visual" },
  { id: "irlen", label: "Amarelo (Irlen)", emoji: "💛", description: "Recomendado para dislexia" },
  { id: "pastel", label: "Lavanda pastel", emoji: "💜", description: "Calmante / sensorial" },
  { id: "contrast", label: "Branco alto contraste", emoji: "⚪", description: "Clean e legível" },
];

const STORAGE_KEY = "a11y-theme";
const ALL_CLASSES = ["theme-a11y-cream", "theme-a11y-irlen", "theme-a11y-pastel", "theme-a11y-contrast"];

const isStudentArea = (p: string) => p.startsWith("/dashboard");

export function applyA11yClass(theme: A11yTheme) {
  const root = document.documentElement;
  ALL_CLASSES.forEach((c) => root.classList.remove(c));
  if (theme === "default") {
    root.classList.add("dark");
    root.classList.remove("light");
    // Restore neon theme if we are in student area; DashboardLayout will reconcile.
    return;
  }
  // Light-based themes: remove dark
  root.classList.remove("dark");
  root.classList.add("light");
  // Strip the neon green overlay so a11y palettes are visible
  root.classList.remove("theme-sth-green");
  root.classList.add(`theme-a11y-${theme}`);
}

export function useAccessibilityTheme() {
  const { pathname } = useLocation();
  const { user, role } = useAuth();
  const [theme, setThemeState] = useState<A11yTheme>("default");

  // Load from localStorage immediately on mount
  useEffect(() => {
    const local = (localStorage.getItem(STORAGE_KEY) as A11yTheme | null) ?? "default";
    setThemeState(local);
  }, []);

  // Load from profile when user is available
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("accessibility_theme")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbTheme = (data?.accessibility_theme as A11yTheme | null) ?? null;
        if (dbTheme) {
          setThemeState(dbTheme);
          localStorage.setItem(STORAGE_KEY, dbTheme);
        }
      });
  }, [user]);

  // Apply only on student area
  useEffect(() => {
    if (role && role !== "student") return;
    if (!isStudentArea(pathname)) return;
    applyA11yClass(theme);
  }, [theme, pathname, role]);

  const setTheme = useCallback(
    async (next: A11yTheme) => {
      setThemeState(next);
      localStorage.setItem(STORAGE_KEY, next);
      applyA11yClass(next);
      // Notify other components (DashboardLayout, useAdminTheme) to reconcile
      window.dispatchEvent(new CustomEvent("a11y-theme-change", { detail: next }));
      if (user) {
        await supabase
          .from("profiles")
          .update({ accessibility_theme: next === "default" ? null : next })
          .eq("user_id", user.id);
      }
    },
    [user]
  );

  return { theme, setTheme };
}
