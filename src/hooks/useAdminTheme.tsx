import { useEffect } from "react";

/**
 * Forces dark theme globally for all users (admin, consultor, students, etc).
 * Pure black background with green accents — Apple-style premium dark look.
 */
export function useAdminTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.setItem("app-theme", "dark");
  }, []);

  return "dark" as const;
}
