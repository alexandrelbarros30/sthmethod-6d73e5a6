import { useCallback, useEffect, useState } from "react";

export type AiThemeMode = "ocean" | "classic";

const KEY = "sth-ai-theme-mode";
const EVT = "sth-ai-theme-mode-change";

export function getAiThemeMode(): AiThemeMode {
  if (typeof window === "undefined") return "ocean";
  return localStorage.getItem(KEY) === "classic" ? "classic" : "ocean";
}

export function setAiThemeMode(mode: AiThemeMode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent<AiThemeMode>(EVT, { detail: mode }));
}

/** Modo de tema do STH AI: Ocean Premium (padrão) ou STH Clássico (verde). */
export function useAiThemeMode() {
  const [mode, setMode] = useState<AiThemeMode>(getAiThemeMode);

  useEffect(() => {
    const onChange = (e: Event) => setMode((e as CustomEvent<AiThemeMode>).detail ?? getAiThemeMode());
    const onStorage = () => setMode(getAiThemeMode());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    setAiThemeMode(getAiThemeMode() === "ocean" ? "classic" : "ocean");
  }, []);

  return { mode, setMode: setAiThemeMode, toggle };
}

export default useAiThemeMode;
