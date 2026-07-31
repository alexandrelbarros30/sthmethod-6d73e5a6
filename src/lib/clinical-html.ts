import DOMPurify from "dompurify";

/**
 * Normaliza HTML de parecer clínico vindo da STHIA:
 * - remove code fences ```html ... ```
 * - decodifica entidades se o conteúdo veio "escapado" (ex.: &lt;p&gt;)
 * - converte quebras Markdown-lite quando não há tags HTML
 * - sanitiza com DOMPurify no padrão clínico Apple
 */
export function normalizeClinicalHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw).trim();

  // strip ```html ... ``` or ``` ... ``` fences
  s = s.replace(/^```(?:html)?\s*/i, "").replace(/```$/i, "").trim();

  // If content looks fully escaped (no real tags but many entities), decode once
  const hasRealTags = /<\/?(p|div|h[1-6]|table|tr|td|th|ul|ol|li|strong|em|br|hr|span)\b/i.test(s);
  const looksEscaped = /&lt;\/?[a-z][^&]*&gt;/i.test(s);
  if (!hasRealTags && looksEscaped) {
    const doc = new DOMParser().parseFromString(`<!doctype html><body>${s}`, "text/html");
    s = doc.body.textContent || s;
  }

  // If still no HTML tags at all, promote plain text to paragraphs
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    s = s
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  // Remove stray fences/wrappers left behind
  s = s.replace(/<\/?(html|body|head)[^>]*>/gi, "");

  const clean = DOMPurify.sanitize(s, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "span", "div",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "strong", "b", "em", "i", "u", "s", "mark", "code",
      "blockquote", "a",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["class", "href", "target", "rel", "colspan", "rowspan", "scope"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style", "img"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover"],
  });

  return wrapTables(clean);
}

/**
 * Envolve cada <table> em um container com rolagem horizontal.
 * Sem isso, no mobile as colunas colapsam e o texto quebra letra a letra.
 */
function wrapTables(html: string): string {
  if (typeof document === "undefined" || !/<table\b/i.test(html)) return html;
  const host = document.createElement("div");
  host.innerHTML = html;
  host.querySelectorAll("table").forEach((table) => {
    if ((table.parentElement as HTMLElement | null)?.classList.contains("clinical-table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "clinical-table-wrap";
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
  return host.innerHTML;
}

/**
 * Retorna apenas o texto introdutório do parecer — tudo o que vem ANTES do
 * primeiro quadro (tabela). Usado na leitura visual liberada ao aluno, que
 * não deve exibir as tabelas/anexos do parecer completo.
 */
export function extractClinicalIntro(raw: string | null | undefined): string {
  const clean = normalizeClinicalHtml(raw);
  if (!clean || typeof document === "undefined") return clean;
  const host = document.createElement("div");
  host.innerHTML = clean;

  const out = document.createElement("div");
  for (const node of Array.from(host.childNodes)) {
    const el = node as HTMLElement;
    const isTable =
      el.nodeType === 1 &&
      (el.tagName === "TABLE" ||
        el.classList?.contains("clinical-table-wrap") ||
        !!el.querySelector?.("table"));
    if (isTable) break;
    out.appendChild(node.cloneNode(true));
  }

  // Remove títulos "órfãos" no fim (ex.: "🩸 INTERPRETAÇÃO LABORATORIAL" sem tabela abaixo)
  while (out.lastElementChild) {
    const last = out.lastElementChild as HTMLElement;
    const text = (last.textContent || "").trim();
    const isHeadingOnly =
      !text ||
      (text.length < 80 &&
        (/^(H[1-6])$/.test(last.tagName) ||
          last.querySelector("strong")?.textContent?.trim() === text));
    if (!isHeadingOnly) break;
    last.remove();
  }

  // Padroniza o título do parecer
  return out.innerHTML
    .replace(/PARECER GERAL(?!\s+RESUMIDO)/gi, "PARECER GERAL RESUMIDO")
    .trim();
}
