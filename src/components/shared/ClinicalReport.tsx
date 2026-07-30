import { useEffect, useRef } from "react";
import { normalizeClinicalHtml } from "@/lib/clinical-html";
import { cn } from "@/lib/utils";

interface ClinicalReportProps {
  html: string;
  className?: string;
}

/**
 * Renderiza o parecer clínico STHIA já sanitizado e adiciona uma barra de
 * rolagem horizontal espelhada no TOPO de cada quadro (tabela), sincronizada
 * com a barra inferior nativa.
 */
export default function ClinicalReport({ html, className }: ClinicalReportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const clean = normalizeClinicalHtml(html);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];

    root.querySelectorAll<HTMLElement>(".clinical-table-wrap").forEach((wrap) => {
      if (wrap.previousElementSibling?.classList.contains("clinical-scroll-top")) return;

      const top = document.createElement("div");
      top.className = "clinical-scroll-top";
      const spacer = document.createElement("div");
      top.appendChild(spacer);
      wrap.parentNode?.insertBefore(top, wrap);

      let syncing = false;
      const sync = (from: HTMLElement, to: HTMLElement) => () => {
        if (syncing) return;
        syncing = true;
        to.scrollLeft = from.scrollLeft;
        syncing = false;
      };
      const onTop = sync(top, wrap);
      const onWrap = sync(wrap, top);
      top.addEventListener("scroll", onTop);
      wrap.addEventListener("scroll", onWrap);

      const measure = () => {
        spacer.style.width = `${wrap.scrollWidth}px`;
        const overflow = wrap.scrollWidth > wrap.clientWidth + 1;
        top.style.display = overflow ? "block" : "none";
      };
      measure();

      const ro = new ResizeObserver(measure);
      ro.observe(wrap);
      const table = wrap.querySelector("table");
      if (table) ro.observe(table);

      cleanups.push(() => {
        ro.disconnect();
        top.removeEventListener("scroll", onTop);
        wrap.removeEventListener("scroll", onWrap);
        top.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [clean]);

  return (
    <div
      ref={ref}
      className={cn("clinical-report", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}