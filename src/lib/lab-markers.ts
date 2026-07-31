import { normalizeClinicalHtml } from "@/lib/clinical-html";

export type LabStatus = "low" | "optimal" | "attention" | "high" | "unknown";

export interface LabMarker {
  name: string;
  value: string;
  numericValue: number | null;
  unit: string;
  reference: string;
  refMin: number | null;
  refMax: number | null;
  /** posição 0-1 do valor dentro da faixa (com margem de 20% fora) */
  position: number | null;
  statusLabel: string;
  status: LabStatus;
  reading: string;
}

const num = (s: string): number | null => {
  const m = s.replace(/\./g, "#").replace(/,/g, ".").replace(/#/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

function parseReference(ref: string): { min: number | null; max: number | null } {
  const t = ref.replace(/\s+/g, " ").trim();
  const range = t.match(/(-?\d+[.,]?\d*)\s*(?:a|até|-|–|—|to)\s*(-?\d+[.,]?\d*)/i);
  if (range) return { min: num(range[1]), max: num(range[2]) };
  const lt = t.match(/(?:<|≤|menor que|até)\s*(-?\d+[.,]?\d*)/i);
  if (lt) return { min: null, max: num(lt[1]) };
  const gt = t.match(/(?:>|≥|maior que|acima de)\s*(-?\d+[.,]?\d*)/i);
  if (gt) return { min: num(gt[1]), max: null };
  return { min: null, max: null };
}

function classify(statusText: string, value: number | null, min: number | null, max: number | null): LabStatus {
  const s = statusText.toLowerCase();
  if (/(baixo|abaixo|reduzid|deficien|insuficien)/.test(s)) return "low";
  if (/(alto|elevad|acima|aument)/.test(s)) return "high";
  if (/(atenç|aten[cç]ao|limítrofe|limitrofe|border|alerta|subótim|suboptim)/.test(s)) return "attention";
  if (/(ótim|otim|normal|adequad|ideal|dentro)/.test(s)) return "optimal";
  if (value != null) {
    if (min != null && value < min) return "low";
    if (max != null && value > max) return "high";
    if (min != null || max != null) return "optimal";
  }
  return "unknown";
}

function positionOf(value: number | null, min: number | null, max: number | null): number | null {
  if (value == null) return null;
  if (min != null && max != null && max > min) {
    const span = max - min;
    const padded = (value - (min - span * 0.25)) / (span * 1.5);
    return Math.min(1, Math.max(0, padded));
  }
  if (max != null && max !== 0) return Math.min(1, Math.max(0, (value / (max * 1.5))));
  if (min != null && min !== 0) return Math.min(1, Math.max(0, value / (min * 2)));
  return null;
}

const txt = (el: Element | null | undefined) => (el?.textContent || "").replace(/\s+/g, " ").trim();

const HEAD_HINTS = {
  name: /(marcador|exame|par[âa]metro)/i,
  value: /(valor|resultado)/i,
  ref: /(refer|faixa|intervalo)/i,
  status: /status|situa/i,
  reading: /(leitura|interpret|coment|clínic|clinic)/i,
};

/**
 * Extrai os marcadores do quadro "INTERPRETAÇÃO LABORATORIAL" do parecer STHIA.
 */
export function extractLabMarkers(rawHtml: string | null | undefined): LabMarker[] {
  if (!rawHtml || typeof document === "undefined") return [];
  const host = document.createElement("div");
  host.innerHTML = normalizeClinicalHtml(rawHtml);

  const tables = Array.from(host.querySelectorAll("table"));
  if (!tables.length) return [];

  const scored = tables
    .map((table) => {
      const head = txt(table.querySelector("tr")).toLowerCase();
      let score = 0;
      if (HEAD_HINTS.name.test(head)) score += 2;
      if (HEAD_HINTS.value.test(head)) score += 2;
      if (HEAD_HINTS.ref.test(head)) score += 2;
      if (HEAD_HINTS.status.test(head)) score += 1;
      return { table, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 4) return [];

  const rows = Array.from(best.table.querySelectorAll("tr"));
  if (rows.length < 2) return [];

  const headers = Array.from(rows[0].querySelectorAll("th,td")).map((c) => txt(c).toLowerCase());
  const idxOf = (re: RegExp, fallback: number) => {
    const i = headers.findIndex((h) => re.test(h));
    return i >= 0 ? i : fallback;
  };
  const iName = idxOf(HEAD_HINTS.name, 0);
  const iValue = idxOf(HEAD_HINTS.value, 1);
  const iRef = idxOf(HEAD_HINTS.ref, 2);
  const iStatus = idxOf(HEAD_HINTS.status, 3);
  const iRead = idxOf(HEAD_HINTS.reading, 4);

  const markers: LabMarker[] = [];
  for (const row of rows.slice(1)) {
    const cells = Array.from(row.querySelectorAll("td,th")).map((c) => txt(c));
    if (!cells.length) continue;
    const name = cells[iName] || "";
    if (!name || /^marcador$/i.test(name)) continue;
    const value = cells[iValue] || "";
    const reference = cells[iRef] || "";
    const statusLabel = cells[iStatus] || "";
    const reading = cells[iRead] || "";
    const numericValue = num(value);
    const { min, max } = parseReference(reference);
    markers.push({
      name,
      value,
      numericValue,
      unit: (value.replace(/-?\d+[.,]?\d*/, "").trim() || "").slice(0, 14),
      reference,
      refMin: min,
      refMax: max,
      position: positionOf(numericValue, min, max),
      statusLabel,
      status: classify(statusLabel, numericValue, min, max),
      reading,
    });
  }
  return markers;
}

export const STATUS_META: Record<LabStatus, { label: string; tone: string; dot: string; bar: string; ring: string }> = {
  low: { label: "Baixo", tone: "text-sky-400", dot: "bg-sky-400", bar: "from-sky-500/70 to-sky-400", ring: "border-sky-500/30 bg-sky-500/[0.06]" },
  optimal: { label: "Ótimo", tone: "text-emerald-400", dot: "bg-emerald-400", bar: "from-emerald-500/70 to-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/[0.06]" },
  attention: { label: "Atenção", tone: "text-amber-400", dot: "bg-amber-400", bar: "from-amber-500/70 to-amber-400", ring: "border-amber-500/30 bg-amber-500/[0.06]" },
  high: { label: "Alto", tone: "text-red-400", dot: "bg-red-400", bar: "from-red-500/70 to-red-400", ring: "border-red-500/30 bg-red-500/[0.06]" },
  unknown: { label: "—", tone: "text-muted-foreground", dot: "bg-muted-foreground/50", bar: "from-muted-foreground/40 to-muted-foreground/60", ring: "border-border bg-muted/20" },
};