import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the admin-configured theme from landing_settings and applies it
 * to the document root. Falls back to "light" if not set.
 */
export function useAdminTheme() {
  const { data: themeSetting } = useQuery({
    queryKey: ["admin-theme"],
    queryFn: async () => {
      const { data } = await supabase
        .from("landing_settings")
        .select("value")
        .eq("key", "site_theme")
        .maybeSingle();
      return (data?.value as "light" | "dark") ?? "light";
    },
    staleTime: 1000 * 60 * 5,
  });

  const theme = themeSetting ?? "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  return theme;
}
