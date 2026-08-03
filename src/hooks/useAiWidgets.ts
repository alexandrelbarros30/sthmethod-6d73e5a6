import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "sth_ai_home_widgets_v1";

export interface WidgetMeta {
  id: string;
  label: string;
}

interface StoredLayout {
  order: string[];
  hidden: string[];
}

function read(): StoredLayout {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { order: [], hidden: [] };
    const parsed = JSON.parse(raw) as Partial<StoredLayout>;
    return { order: parsed.order ?? [], hidden: parsed.hidden ?? [] };
  } catch {
    return { order: [], hidden: [] };
  }
}

/**
 * Layout editável da tela inicial do STH AI: o aluno reordena e oculta widgets,
 * como no Samsung Health. Persistido no dispositivo.
 */
export function useAiWidgets(defaults: WidgetMeta[]) {
  const [layout, setLayout] = useState<StoredLayout>(() => read());

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(layout));
  }, [layout]);

  const ordered = useMemo(() => {
    const known = new Set(defaults.map((d) => d.id));
    const fromStore = layout.order.filter((id) => known.has(id));
    const rest = defaults.map((d) => d.id).filter((id) => !fromStore.includes(id));
    return [...fromStore, ...rest];
  }, [defaults, layout.order]);

  const hidden = useMemo(() => new Set(layout.hidden), [layout.hidden]);

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      setLayout((prev) => {
        const known = new Set(defaults.map((d) => d.id));
        const base = [
          ...prev.order.filter((x) => known.has(x)),
          ...defaults.map((d) => d.id).filter((x) => !prev.order.includes(x)),
        ];
        const i = base.indexOf(id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= base.length) return prev;
        const next = [...base];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...prev, order: next };
      });
    },
    [defaults],
  );

  const toggle = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id) ? prev.hidden.filter((x) => x !== id) : [...prev.hidden, id],
    }));
  }, []);

  const reset = useCallback(() => setLayout({ order: [], hidden: [] }), []);

  return { ordered, hidden, move, toggle, reset };
}
