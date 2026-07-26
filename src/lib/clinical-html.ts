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

  return DOMPurify.sanitize(s, {
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
}
