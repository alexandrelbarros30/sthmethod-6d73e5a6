import { useCallback, useEffect, useState } from "react";

export type AiThemeMode = "ocean" | "classic" | "midnight";

const KEY = "sth-ai-theme-mode";
const EVT = "sth-ai-theme-mode-change";

const MODES: AiThemeMode[] = ["ocean", "classic", "midnight"];

export function getAiThemeMode(): AiThemeMode {
  if (typeof window === "undefined") return "ocean";
  const raw = localStorage.getItem(KEY) as AiThemeMode | null;
  return raw && MODES.includes(raw) ? raw : "ocean";
}

export function setAiThemeMode(mode: AiThemeMode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent<AiThemeMode>(EVT, { detail: mode }));
}

/** Modo de tema do STH AI: Ocean Premium (padrão), STH Clássico (verde) ou Midnight (escuro). */
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
    const i = MODES.indexOf(getAiThemeMode());
    setAiThemeMode(MODES[(i + 1) % MODES.length]);
  }, []);

  return { mode, setMode: setAiThemeMode, toggle };
}

export default useAiThemeMode;
