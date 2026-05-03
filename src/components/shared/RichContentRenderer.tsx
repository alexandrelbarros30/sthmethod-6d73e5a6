import { cn } from "@/lib/utils";

interface RichContentRendererProps {
  content: string;
  className?: string;
}

const MEAL_HEADING_RE = /^(REFEIC[ÃA]O\s*\d+|REFEI[CÇ][ÃA]O\s*\d+|PRE[- ]?TREINO|P[OÓ]S[- ]?TREINO|CEIA|LANCHE\s*\d*|CAFÉ\s*DA\s*MANH[ÃA]|ALMO[CÇ]O|JANTAR)/i;
const SECTION_TITLE_RE = /^(ROTINA\s*ALIMENTAR|PLANO\s*ALIMENTAR|DIETA)/i;

function cleanEmptyParagraphs(html: string): string {
  // Remove empty <p> tags (with optional <br>, &nbsp;, whitespace)
  return html.replace(/<p[^>]*>\s*(<br\s*\/?>|\s|&nbsp;)*\s*<\/p>/gi, '');
}

function addBulletsAndZebraToHTML(html: string): string {
  const cleaned = cleanEmptyParagraphs(html);
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
    const bg = itemIndex % 2 === 0 ? 'background:hsl(var(--muted)/0.5);border-radius:0.25rem;' : '';
    return `<p${attrs} style="padding:0.375rem 0.5rem;${bg}"><span style="color:hsl(var(--foreground));font-weight:700;margin-right:0.375rem;">•</span>${inner}</p>`;
  });
}

const RichContentRenderer = ({ content, className }: RichContentRendererProps) => {
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    const processedContent = addBulletsAndZebraToHTML(content);
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
          className
        )}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  }

  return (
    <div className={cn("whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed", className)}>
      {content}
    </div>
  );
};

export default RichContentRenderer;
