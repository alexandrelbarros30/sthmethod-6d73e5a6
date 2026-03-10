import React from "react";

/**
 * Renders diet content with:
 * - Quantities & units highlighted in primary (green)
 * - Dotted separator between food items within a meal
 * - Solid separator between meals (REFEIÇÃO / REFEICAO headings)
 */

const MEAL_HEADING_RE = /^(REFEIC[ÃA]O\s*\d+|REFEI[CÇ][ÃA]O\s*\d+|PRE[- ]?TREINO|P[OÓ]S[- ]?TREINO|CEIA|LANCHE\s*\d*|CAFÉ\s*DA\s*MANH[ÃA]|ALMO[CÇ]O|JANTAR)/i;
const QTY_UNIT_RE = /(\d+[.,\/]?\d*)\s*(g|gr|grama|gramas|kg|mg|mcg|ml|l|litro|litros|un|und|unidade|unidades|colher|colheres|c\.?s\.?|c\.?ch\.?|xícara|xícaras|xic|fatia|fatias|cápsula|cápsulas|cap|caps|saches?|sachês?|sachê|porç[ãa]o|porções|porcao|scoop|scoops|dose|doses|gota|gotas|pedaço|pedaços|pote|potes|copo|copos|punhado|punhados|pitada|pitadas|lata|latas|tablete|tabletes|barra|barras|ovo|ovos|clara|claras|pç|pçs|tb|tbs|ud)\b/gi;
// Also match standalone numbers at start of line (e.g. "2 ovos", "1 banana")
const STANDALONE_NUM_RE = /^(\d+[.,\/]?\d*)\s+/i;

function highlightUnits(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Combined regex: qty+unit OR standalone number at word boundary followed by space
  const combinedSource = `(\\d+[.,\\/]?\\d*)\\s*(g|gr|grama|gramas|kg|mg|mcg|ml|l|litro|litros|un|und|unidade|unidades|colher|colheres|c\\.?s\\.?|c\\.?ch\\.?|xícara|xícaras|xic|fatia|fatias|cápsula|cápsulas|cap|caps|saches?|sachês?|sachê|porç[ãa]o|porções|porcao|scoop|scoops|dose|doses|gota|gotas|pedaço|pedaços|pote|potes|copo|copos|punhado|punhados|pitada|pitadas|lata|latas|tablete|tabletes|barra|barras|ovo|ovos|clara|claras|pç|pçs|tb|tbs|ud)\\b`;
  const regex = new RegExp(combinedSource, "gi");

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-primary font-semibold">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no unit matches found, try to highlight leading standalone numbers
  if (parts.length <= 1) {
    const standaloneMatch = STANDALONE_NUM_RE.exec(text);
    if (standaloneMatch) {
      return [
        <span key="num" className="text-primary font-semibold">
          {standaloneMatch[1]}
        </span>,
        text.slice(standaloneMatch[1].length),
      ];
    }
  }

  return parts;
}

interface DietContentRendererProps {
  content: string;
}

const DietContentRenderer: React.FC<DietContentRendererProps> = ({ content }) => {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let prevWasContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      prevWasContent = false;
      continue;
    }

    const isMealHeading = MEAL_HEADING_RE.test(line);

    if (isMealHeading) {
      // Solid line before meal headings (except the very first element)
      if (elements.length > 0) {
        elements.push(
          <div key={`solid-${i}`} className="border-t border-foreground/30 mt-7 mb-5" />
        );
      }
      elements.push(
        <p key={`heading-${i}`} className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
          {line}
        </p>
      );
      prevWasContent = false;
    } else {
      // Dotted line between food items within same meal
      if (prevWasContent) {
        elements.push(
          <div key={`dotted-${i}`} className="border-t border-dashed border-foreground/15 my-1.5" />
        );
      }
      elements.push(
        <p key={`food-${i}`} className="text-sm text-foreground font-body leading-relaxed">
          {highlightUnits(line)}
        </p>
      );
      prevWasContent = true;
    }
  }

  return <div className="space-y-0">{elements}</div>;
};

export default DietContentRenderer;
