import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { twemojify } from "@/lib/twemoji";

interface RichContentRendererProps {
  content: string;
  className?: string;
  showParagraphBullets?: boolean;
  stripLeadingMarkers?: boolean;
  showZebra?: boolean;
}


// Allow leading emojis/symbols/whitespace before the heading keyword (e.g. "☕ Lanche da tarde", "🍽️ Almoço")
const LEADING_DECOR = "[\\s\\p{Emoji_Presentation}\\p{Extended_Pictographic}\\p{S}\\p{P}]*";
const MEAL_HEADING_RE = new RegExp(`^${LEADING_DECOR}(REFEIC[ÃA]O\\s*\\d*|REFEI[CÇ][ÃA]O\\s*\\d*|PRE[- ]?TREINO|P[OÓ]S[- ]?TREINO|CEIA|LANCHE(\\s+(DA\\s+TARDE|DA\\s+MANH[ÃA]|DA\\s+NOITE))?\\s*\\d*|CAFÉ\\s*DA\\s*MANH[ÃA]|CAFE\\s*DA\\s*MANHA|ALMO[CÇ]O|JANTAR|MANH[ÃA]|TARDE|NOITE|MEDICAMENTOS)`, "iu");
const SECTION_TITLE_RE = new RegExp(`^${LEADING_DECOR}(ROTINA\\s*ALIMENTAR|PLANO\\s*ALIMENTAR|DIETA)`, "iu");

function cleanEmptyParagraphs(html: string): string {
  // Remove empty <p> tags (with optional <br>, &nbsp;, whitespace)
  return html.replace(/<p[^>]*>\s*(<br\s*\/?>|\s|&nbsp;)*\s*<\/p>/gi, '');
}

function stripLeadingTextMarkers(html: string): string {
  return html.replace(
    /(<(?:p|li)[^>]*>\s*(?:<(?:strong|b|em|i|u|span|mark|code|s)[^>]*>\s*)*)(?:[•·▪◦●\-*]+\s*)+/gi,
    "$1"
  );
}

function addBulletsAndZebraToHTML(
  html: string,
  { showParagraphBullets = true, stripLeadingMarkers = false, showZebra = true }: Pick<RichContentRendererProps, "showParagraphBullets" | "stripLeadingMarkers" | "showZebra"> = {}
): string {
  const cleaned = stripLeadingMarkers ? stripLeadingTextMarkers(cleanEmptyParagraphs(html)) : cleanEmptyParagraphs(html);
  let itemIndex = 0;
  return cleaned.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!text) return '';
    if (SECTION_TITLE_RE.test(text) || MEAL_HEADING_RE.test(text)) {
      itemIndex = 0;
      return match;
    }
    if (text.startsWith("(") && text.endsWith(")")) return match;
    itemIndex++;
    const bg = showZebra && itemIndex % 2 === 0 ? 'background:hsl(var(--muted)/0.5);border-radius:0.25rem;' : '';
    const bulletPrefix = showParagraphBullets
      ? '<span style="color:hsl(var(--foreground));font-weight:700;margin-right:0.375rem;">•</span>'
      : "";
    return `<p${attrs} style="padding:0.375rem 0.5rem;${bg}">${bulletPrefix}${inner}</p>`;
  });
}

const RichContentRenderer = ({
  content,
  className,
  showParagraphBullets = true,
  stripLeadingMarkers = false,
  showZebra = true,
}: RichContentRendererProps) => {
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    const withEmojis = twemojify(content);
    const processedContent = addBulletsAndZebraToHTML(withEmojis, { showParagraphBullets, stripLeadingMarkers, showZebra });
    const safeContent = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: [
        "p", "br", "hr", "span", "div",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "strong", "b", "em", "i", "u", "s", "mark", "code",
        "blockquote", "a", "img",
      ],
      ALLOWED_ATTR: ["style", "class", "href", "target", "rel", "src", "alt", "draggable", "loading"],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none text-foreground",
          "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:text-foreground",
          "[&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-foreground",
          "[&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:text-foreground",
          "[&_p]:mb-1 [&_p]:text-foreground [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-foreground",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-foreground",
          "[&_li]:text-foreground [&_li]:mb-0.5",
          "[&_strong]:font-bold [&_em]:italic [&_u]:underline",
          "[&_mark]:bg-foreground/15 [&_mark]:text-foreground [&_mark]:px-0.5 [&_mark]:rounded",
          "[&_hr]:border-foreground/20 [&_hr]:my-3",
          "[&_s]:line-through",
          "[&_img.twemoji]:inline-block [&_img.twemoji]:h-[1.1em] [&_img.twemoji]:w-[1.1em] [&_img.twemoji]:align-[-0.15em] [&_img.twemoji]:mx-[0.05em] [&_img.twemoji]:my-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />
    );
  }

  return (
    <div
      className={cn(
        "whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed",
        "[&_img.twemoji]:inline-block [&_img.twemoji]:h-[1.1em] [&_img.twemoji]:w-[1.1em] [&_img.twemoji]:align-[-0.15em] [&_img.twemoji]:mx-[0.05em]",
        className
      )}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(twemojify(content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")), {
          ALLOWED_TAGS: ["img", "br"],
          ALLOWED_ATTR: ["src", "alt", "class", "draggable", "loading", "style"],
        }),
      }}
    />
  );
};

export default RichContentRenderer;
