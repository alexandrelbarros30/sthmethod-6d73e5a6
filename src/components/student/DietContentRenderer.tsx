import React from "react";
import RichContentRenderer from "@/components/shared/RichContentRenderer";

/**
 * Renders diet content matching the "Rotina Alimentar" document format:
 * - Student info header (optional, passed via props)
 * - Meal headings bold + underlined
 * - Quantities & units highlighted in bold (primary color)
 * - "ou" keyword styled as connector
 * - Clean spacing between food items
 */

// Allow leading emojis/symbols/whitespace before the heading keyword (e.g. "☕ Lanche da tarde", "🍽️ Almoço")
const LEADING_DECOR = "[\\s\\p{Emoji_Presentation}\\p{Extended_Pictographic}\\p{S}\\p{P}]*";
const MEAL_HEADING_RE = new RegExp(`^${LEADING_DECOR}(REFEIC[ÃA]O\\s*\\d*|REFEI[CÇ][ÃA]O\\s*\\d*|PRE[- ]?TREINO|P[OÓ]S[- ]?TREINO|CEIA|LANCHE(\\s+(DA\\s+TARDE|DA\\s+MANH[ÃA]|DA\\s+NOITE))?\\s*\\d*|CAFÉ\\s*DA\\s*MANH[ÃA]|CAFE\\s*DA\\s*MANHA|ALMO[CÇ]O|JANTAR|MANH[ÃA]|TARDE|NOITE|MEDICAMENTOS)`, "iu");
const SECTION_TITLE_RE = new RegExp(`^${LEADING_DECOR}(ROTINA\\s*ALIMENTAR|PLANO\\s*ALIMENTAR|DIETA)`, "iu");

const QTY_UNIT_RE_SOURCE = `(\\d+[.,\\/]?\\d*)\\s*(g|gr|grama|gramas|kg|mg|mcg|ml|l|litro|litros|un|und|unidade|unidades|colher|colheres|c\\.?s\\.?|c\\.?ch\\.?|xícara|xícaras|xic|fatia|fatias|cápsula|cápsulas|cap|caps|saches?|sachês?|sachê|porç[ãa]o|porções|porcao|scoop|scoops|dose|doses|gota|gotas|pedaço|pedaços|pote|potes|copo|copos|punhado|punhados|pitada|pitadas|lata|latas|tablete|tabletes|barra|barras|ovo|ovos|clara|claras|pç|pçs|tb|tbs|ud|kcal)\\b`;
const STANDALONE_NUM_RE = /^(\d+[.,\/]?\d*)\s+/i;

function highlightQuantities(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(QTY_UNIT_RE_SOURCE, "gi");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatOuKeyword(text.slice(lastIndex, match.index), `pre-${match.index}`));
    }
    parts.push(
      <strong key={match.index} className="text-foreground font-bold">
        {match[0]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(formatOuKeyword(text.slice(lastIndex), `end-${lastIndex}`));
  }

  if (parts.length <= 1 && typeof parts[0] === "string") {
    const standaloneMatch = STANDALONE_NUM_RE.exec(text);
    if (standaloneMatch) {
      return [
        <strong key="num" className="text-foreground font-bold">
          {standaloneMatch[1]}
        </strong>,
        formatOuKeyword(text.slice(standaloneMatch[1].length), "rest"),
      ];
    }
  }

  return parts.length > 0 ? parts : [formatOuKeyword(text, "full")];
}

function formatOuKeyword(text: string, keyPrefix: string): React.ReactNode {
  // Highlight " ou " as a subtle connector
  const ouParts = text.split(/(\s+ou\s+)/gi);
  if (ouParts.length <= 1) return text;

  return (
    <React.Fragment key={keyPrefix}>
      {ouParts.map((part, i) =>
        /^\s+ou\s+$/i.test(part) ? (
          <span key={`${keyPrefix}-ou-${i}`} className="text-muted-foreground font-normal italic">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </React.Fragment>
  );
}

export interface DietStudentInfo {
  name?: string;
  age?: number;
  weight?: number;
  height?: number; // in cm
  objective?: string;
  startDate?: string;
  hydration?: string;
  totalEnergy?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

interface DietContentRendererProps {
  content: string;
  studentInfo?: DietStudentInfo;
  showHeader?: boolean;
}

const DietContentRenderer: React.FC<DietContentRendererProps> = ({
  content,
  studentInfo,
  showHeader = true,
}) => {
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(content);

  if (isHtmlContent) {
    return (
      <div className="space-y-0">
        {showHeader && studentInfo && (
          <div className="mb-6 pb-4 border-b border-border">
            <div className="text-center mb-4">
              <h2 className="text-base font-bold tracking-[0.2em] uppercase text-foreground font-display">
                STH METHOD
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
              {studentInfo.name && <InfoRow label="Nome" value={studentInfo.name} />}
              {studentInfo.age && <InfoRow label="Idade" value={`${studentInfo.age} anos`} />}
              {studentInfo.weight && <InfoRow label="Peso" value={`${studentInfo.weight} kg`} />}
              {studentInfo.height && <InfoRow label="Altura" value={`${studentInfo.height} cm`} />}
              {studentInfo.objective && <InfoRow label="Objetivo" value={studentInfo.objective} />}
              {studentInfo.startDate && <InfoRow label="Data de Início" value={studentInfo.startDate} />}
              {studentInfo.hydration && <InfoRow label="Hidratação" value={studentInfo.hydration} />}
            </div>

            {(studentInfo.totalEnergy || studentInfo.protein || studentInfo.carbs || studentInfo.fat) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {studentInfo.totalEnergy && <MacroBadge label="Energia" value={`${studentInfo.totalEnergy} kcal`} />}
                {studentInfo.protein && <MacroBadge label="Proteína" value={`~${studentInfo.protein}g`} accent />}
                {studentInfo.carbs && <MacroBadge label="Carboidratos" value={`~${studentInfo.carbs}g`} />}
                {studentInfo.fat && <MacroBadge label="Lipídios" value={`~${studentInfo.fat}g`} />}
              </div>
            )}
          </div>
        )}

        <RichContentRenderer content={content} />
      </div>
    );
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let foodItemIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isMealHeading = MEAL_HEADING_RE.test(line);
    const isSectionTitle = SECTION_TITLE_RE.test(line);

    if (isSectionTitle) {
      elements.push(
        <div key={`title-${i}`} className="text-center pt-4 pb-6">
          <h2 className="text-base font-bold tracking-[0.2em] uppercase text-foreground font-display">
            {line}
          </h2>
        </div>
      );
    } else if (isMealHeading) {
      foodItemIndex = 0;
      elements.push(
        <div key={`meal-${i}`} className="mt-8 mb-4 first:mt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-display underline underline-offset-4 decoration-primary/60 decoration-2">
            {line}
          </h3>
        </div>
      );
    } else {
      // Check if it's a parenthetical note
      const isNote = line.startsWith("(") && line.endsWith(")");
      foodItemIndex++;

      elements.push(
        <div key={`food-${i}`} className={`py-1.5 px-2 flex items-start gap-2 rounded ${foodItemIndex % 2 === 0 ? 'bg-muted/50' : ''}`}>
          {!isNote && (
            <span className="text-foreground font-bold text-sm leading-relaxed select-none mt-px">•</span>
          )}
          <p
            className={`text-sm leading-relaxed font-body ${
              isNote
                ? "text-muted-foreground italic"
                : "text-foreground"
            }`}
          >
            {isNote ? line : highlightQuantities(line)}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-0">
      {/* Student info header */}
      {showHeader && studentInfo && (
        <div className="mb-6 pb-4 border-b border-border">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-base font-bold tracking-[0.2em] uppercase text-foreground font-display">
              STH METHOD
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
            {studentInfo.name && (
              <InfoRow label="Nome" value={studentInfo.name} />
            )}
             {studentInfo.age && (
              <InfoRow label="Idade" value={`${studentInfo.age} anos`} />
            )}
            {studentInfo.weight && (
              <InfoRow label="Peso" value={`${studentInfo.weight} kg`} />
            )}
            {studentInfo.height && (
              <InfoRow label="Altura" value={`${studentInfo.height} cm`} />
            )}
            {studentInfo.objective && (
              <InfoRow label="Objetivo" value={studentInfo.objective} />
            )}
            {studentInfo.startDate && (
              <InfoRow label="Data de Início" value={studentInfo.startDate} />
            )}
            {studentInfo.hydration && (
              <InfoRow label="Hidratação" value={studentInfo.hydration} />
            )}
          </div>

          {/* Macros summary bar */}
          {(studentInfo.totalEnergy || studentInfo.protein || studentInfo.carbs || studentInfo.fat) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {studentInfo.totalEnergy && (
                <MacroBadge label="Energia" value={`${studentInfo.totalEnergy} kcal`} />
              )}
              {studentInfo.protein && (
                <MacroBadge label="Proteína" value={`~${studentInfo.protein}g`} accent />
              )}
              {studentInfo.carbs && (
                <MacroBadge label="Carboidratos" value={`~${studentInfo.carbs}g`} />
              )}
              {studentInfo.fat && (
                <MacroBadge label="Lipídios" value={`~${studentInfo.fat}g`} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Diet content */}
      {elements.length > 0 && <div>{elements}</div>}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <p className="text-foreground">
    <span className="font-semibold">{label}:</span>{" "}
    <span className="text-muted-foreground">{value}</span>
  </p>
);

const MacroBadge = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div
    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
      accent
        ? "bg-foreground/10 text-foreground border border-foreground/15"
        : "bg-muted text-muted-foreground border border-border"
    }`}
  >
    <span className="block text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    <span className="font-bold text-sm">{value}</span>
  </div>
);

export default DietContentRenderer;
