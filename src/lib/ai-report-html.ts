/**
 * Utilitários para o relatório inteligente de evolução (STH AI).
 * Limpa marcações cruas (cercas de código, HTML de wrapper) e converte
 * markdown simples em HTML — o suficiente para o painel de leitura visual
 * laboratorial reaproveitar o mesmo parser do STH Method.
 */

/** Remove cercas de código e ruídos que a IA às vezes deixa no texto. */
export function cleanAiReport(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/^\uFEFF/, "")
    .replace(/```(?:html|markdown|md)?/gi, "")
    .replace(/^\s*<\/?(?:html|body|head)[^>]*>\s*$/gim, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const inline = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isDivider = (l: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");
const cells = (l: string) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** Converte markdown simples (títulos, listas, tabelas GFM) em HTML. */
export function aiReportToHtml(raw: string | null | undefined): string {
  const src = cleanAiReport(raw);
  if (!src) return "";
  if (/<table[\s>]/i.test(src)) return src; // já é HTML

  const lines = src.split("\n");
  const out: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isTableRow(line) && isTableRow(lines[i + 1] ?? "") && isDivider(lines[i + 1])) {
      flushList();
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        body.push(cells(lines[i]));
        i++;
      }
      i--;
      out.push(
        `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead>` +
          `<tbody>${body
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = Math.min(4, heading[1].length + 1);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    flushList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }
  flushList();
  return out.join("\n");
}
