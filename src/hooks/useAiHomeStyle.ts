import { useCallback, useEffect, useState } from "react";

const KEY = "sth_ai_home_style_v1";

export type AiHomeStyle = "mosaic" | "dense" | "focus";

export const AI_HOME_STYLES: { id: AiHomeStyle; label: string; hint: string }[] = [
  { id: "mosaic", label: "Mosaico", hint: "faixa em destaque + duplas ao lado" },
  { id: "dense", label: "Compacto", hint: "grade uniforme, mais cards por tela" },
  { id: "focus", label: "Foco", hint: "um card por linha, leitura ampla" },
];

/** Estilo visual da tela inicial (cards e grade), persistido no dispositivo. */
export function useAiHomeStyle() {
  const [style, setStyle] = useState<AiHomeStyle>(() => {
    const raw = localStorage.getItem(KEY);
    return raw === "dense" || raw === "focus" || raw === "mosaic" ? raw : "mosaic";
  });

  useEffect(() => {
    localStorage.setItem(KEY, style);
  }, [style]);

  /** Classe de span do slot conforme o estilo escolhido. */
  const slotSpan = useCallback(
    (index: number) => {
      if (style === "focus") return "col-span-2 lg:col-span-6";
      if (style === "dense") return "col-span-1 lg:col-span-2";
      return index % 3 === 0 ? "col-span-2 lg:col-span-6" : "col-span-2 min-[430px]:col-span-1 lg:col-span-3";
    },
    [style],
  );

  const gridClass =
    style === "dense"
      ? "ai-home-dense grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6"
      : style === "focus"
        ? "ai-home-focus grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6"
        : "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6";

  return { style, setStyle, slotSpan, gridClass };
}
