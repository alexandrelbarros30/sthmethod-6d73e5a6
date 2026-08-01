import React, { useMemo, useState } from "react";
import { Clock, Utensils, ChevronDown, ChevronRight, Star, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import DietContentRenderer from "@/components/student/DietContentRenderer";
import { computeBaseMacros } from "../../../supabase/functions/_shared/diet-macros";

interface ParsedOption {
  label: string;
  text: string;
  isBase: boolean;
}

interface ParsedMeal {
  index: number;
  name: string;
  subtitle?: string;
  time?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  options: ParsedOption[];
}

const HEADER_RE = /^\s*Refei[çc][ãa]o\s*(\d+)\s*[:\-–]\s*([^(—\-]+?)(?:\s*\(([^)]*)\))?\s*(?:[—–-]\s*(.*))?$/i;
// Fallback: cabeçalhos markdown do tipo "### 1. Café da manhã" / "### Almoço (Sustentação) — 12:30 · 750 kcal"
const MD_HEADER_RE = /^#{2,4}\s*(?:(\d+)[.)]\s*)?([^(—–|]+?)(?:\s*\(([^)]*)\))?\s*(?:[—–]\s*(.*))?$/;
const MEAL_WORDS = /(desjejum|caf[ée]|cola[çc][ãa]o|almo[çc]o|lanche|pr[ée][- ]?treino|p[óo]s[- ]?treino|jantar|ceia|refei[çc][ãa]o)/i;
// Seções que NÃO são refeições (orientações gerais, hidratação, suplementação etc.)
const NOTE_WORDS = /(orienta[çc][õo]e?s|observa[çc][õo]e?s|hidrata[çc][ãa]o|suplementa[çc][ãa]o|suplementos|import(ante|ância)|dicas?|estrat[ée]gia|recomenda[çc][õo]es|considera[çc][õo]es|resumo|treino|aviso|notas?)/i;

function stripTags(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function num(re: RegExp, s: string) {
  const m = s.match(re);
  return m ? parseInt(m[1], 10) : 0;
}

function applyMeta(meal: ParsedMeal, meta: string) {
  meal.time = meal.time ?? meta.match(/(\d{1,2}:\d{2})/)?.[1];
  meal.kcal = meal.kcal || num(/(\d+)\s*kcal/i, meta);
  meal.protein = meal.protein || num(/(?:P|PTN|Prote[íi]na)\s*:?\s*(\d+)\s*g/i, meta) || num(/(\d+)\s*g\s*(?:PTN|prote[íi]na)/i, meta);
  meal.carbs = meal.carbs || num(/(?:C|CHO|Carbo\w*)\s*:?\s*(\d+)\s*g/i, meta) || num(/(\d+)\s*g\s*(?:CHO|carbo\w*)/i, meta);
  meal.fat = meal.fat || num(/(?:G|GOR|Gordura)\s*:?\s*(\d+)\s*g/i, meta) || num(/(\d+)\s*g\s*(?:GOR|gordura)/i, meta);
}

export function parseMeals(content: string): ParsedMeal[] {
  return parseDiet(content).meals;
}

export function parseDiet(content: string): { meals: ParsedMeal[]; notes: string[] } {
  const blocks = content
    .split(/<\/p>|<\/h[1-6]>|<br\s*\/?>|\n/gi)
    .map((b) => stripTags(b))
    .flatMap((b) => b.split("\n"))
    .map((b) => b.replace(/\*\*/g, "").trim())
    .filter(Boolean);

  const meals: ParsedMeal[] = [];
  const notes: string[] = [];
  let currentMeal: ParsedMeal | null = null;
  let inNotes = false;

  for (const raw of blocks) {
    const line = raw.replace(/^"+|"+$/g, "").trim();
    if (!line) continue;
    const h = line.match(HEADER_RE);
    const mdh = !h && /^#{2,4}\s/.test(line) ? line.match(MD_HEADER_RE) : null;
    const isMealHeader = h || (mdh && MEAL_WORDS.test(mdh[2] ?? ""));
    if (isMealHeader) {
      inNotes = false;
      const g = (h ?? mdh)!;
      currentMeal = {
        index: parseInt(g[1] ?? "", 10) || meals.length + 1,
        name: (g[2] ?? "").trim(),
        subtitle: g[3]?.trim(),
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        options: [],
      };
      applyMeta(currentMeal, g[4] ?? "");
      meals.push(currentMeal);
      continue;
    }
    // Início de uma seção de orientações (não é alimento)
    const isNoteHeading =
      (/^#{2,4}\s/.test(line) && NOTE_WORDS.test(line)) ||
      /^(⚠️|💧|💊|📌|ℹ️)/.test(line) ||
      (NOTE_WORDS.test(line) && /^[^a-z0-9]*[A-ZÀ-Ú][^.!?]{0,60}:?\s*$/.test(line.replace(/^#{2,4}\s*/, "")));
    if (isNoteHeading) {
      inNotes = true;
      currentMeal = null;
      notes.push(line.replace(/^#{2,4}\s*/, ""));
      continue;
    }
    if (inNotes) {
      notes.push(line);
      continue;
    }
    if (!currentMeal) continue;
    // Linha de totais da refeição (formato markdown): "Total: 766 kcal | 34 g PTN | 94 g CHO | 30 g GOR"
    if (/^total\b/i.test(line)) {
      applyMeta(currentMeal, line);
      continue;
    }
    const optMatch = line.match(/^"?\s*(⭐?\s*BASE|Op[çc][ãa]o\s*\d+)\s*[:\-]\s*(.*)$/i);
    if (optMatch) {
      currentMeal.options.push({
        label: /base/i.test(optMatch[1]) ? "BASE" : optMatch[1].replace(/\s+/g, " ").trim(),
        text: optMatch[2].replace(/^"+|"+$/g, "").trim(),
        isBase: /base/i.test(optMatch[1]),
      });
    } else if (/^[-•*]\s+/.test(line)) {
      // Itens em lista compõem a refeição BASE
      const item = line.replace(/^[-•*]\s+/, "").trim();
      const base = currentMeal.options.find((o) => o.isBase);
      if (base) base.text = `${base.text} + ${item}`;
      else currentMeal.options.push({ label: "BASE", text: item, isBase: true });
    } else if (currentMeal.options.length > 0) {
      const last = currentMeal.options[currentMeal.options.length - 1];
      last.text = `${last.text} ${line.replace(/^"+|"+$/g, "")}`.trim();
    }
  }

  // Metodologia STH METHOD: kcal/macros da refeição vêm SEMPRE da refeição BASE.
  // As opções são equivalentes e nunca somam ao total do dia.
  for (const meal of meals) {
    const base = meal.options.find((o) => o.isBase) ?? meal.options[0];
    if (!base) continue;
    const computed = computeBaseMacros(base.text);
    if (computed.coverage >= 0.7 && computed.macro.kcal > 0) {
      meal.kcal = Math.round(computed.macro.kcal);
      meal.protein = Math.round(computed.macro.p);
      meal.carbs = Math.round(computed.macro.c);
      meal.fat = Math.round(computed.macro.f);
    } else if (!meal.kcal || !meal.protein || !meal.carbs || !meal.fat) {
      applyMeta(meal, base.text);
    }
  }

  return { meals: meals.filter((m) => m.options.length > 0), notes };
}

const MacroChip = ({ label, value, tone }: { label: string; value: number; tone: "prot" | "carb" | "fat" }) => {
  const styles =
    tone === "prot"
      ? "border-info/25 bg-info/10 text-info"
      : tone === "carb"
      ? "border-warning/25 bg-warning/10 text-warning"
      : "border-[hsl(25_85%_55%/0.25)] bg-[hsl(25_85%_55%/0.1)] text-[hsl(25_85%_50%)]";
  return (
    <div className={cn("rounded-lg border px-2 py-1 text-center", styles)}>
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="text-[13px] font-extrabold leading-tight tabular-nums">
        {Math.round(value)}
        <span className="text-[9px] font-semibold opacity-70">g</span>
      </p>
    </div>
  );
};

const AiDietPlan: React.FC<{ content: string }> = ({ content }) => {
  const { meals, notes } = useMemo(() => parseDiet(content), [content]);
  const [open, setOpen] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  if (meals.length === 0) {
    return <DietContentRenderer content={content} showHeader={false} />;
  }

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const totalG = totals.protein + totals.carbs + totals.fat || 1;

  return (
    <div className="space-y-4">
      {/* Daily summary */}
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total do dia</p>
          <p className="text-lg font-extrabold tabular-nums text-foreground">
            {Math.round(totals.kcal)} <span className="text-xs font-semibold text-muted-foreground">kcal</span>
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MacroChip label="Proteína" value={totals.protein} tone="prot" />
          <MacroChip label="Carboidrato" value={totals.carbs} tone="carb" />
          <MacroChip label="Gordura" value={totals.fat} tone="fat" />
        </div>
        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-info" style={{ width: `${(totals.protein / totalG) * 100}%` }} />
          <div className="h-full bg-warning" style={{ width: `${(totals.carbs / totalG) * 100}%` }} />
          <div className="h-full" style={{ width: `${(totals.fat / totalG) * 100}%`, background: "hsl(25 85% 55%)" }} />
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Refeições do dia · {meals.length}
      </p>

      {meals.map((meal) => {
        const isOpen = open === meal.index;
        const Chevron = isOpen ? ChevronDown : ChevronRight;
        const mealG = meal.protein + meal.carbs + meal.fat || 1;
        return (
          <div
            key={meal.index}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/20"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : meal.index)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Utensils className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold uppercase tracking-tight text-foreground">
                  Refeição {String(meal.index).padStart(2, "0")} · {meal.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                  {meal.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {meal.time}
                    </span>
                  )}
                  <span className="font-bold tabular-nums text-foreground">{Math.round(meal.kcal)}</span>
                  <span className="text-[10px]">kcal</span>
                  {meal.subtitle && <span className="truncate text-[10px] italic">{meal.subtitle}</span>}
                </div>
              </div>
              <Chevron className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                <MacroChip label="Prot" value={meal.protein} tone="prot" />
                <MacroChip label="Carb" value={meal.carbs} tone="carb" />
                <MacroChip label="Gord" value={meal.fat} tone="fat" />
              </div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-info" style={{ width: `${(meal.protein / mealG) * 100}%` }} />
                <div className="h-full bg-warning" style={{ width: `${(meal.carbs / mealG) * 100}%` }} />
                <div className="h-full" style={{ width: `${(meal.fat / mealG) * 100}%`, background: "hsl(25 85% 55%)" }} />
              </div>

              {isOpen && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {meal.options.map((opt, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3",
                        opt.isBase ? "border-foreground/20 bg-muted/50" : "border-border bg-transparent"
                      )}
                    >
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {opt.isBase && <Star className="h-3 w-3 text-warning" />}
                        {opt.isBase ? "Base" : opt.label}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">{opt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {notes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Info className="h-4 w-4" />
            </div>
            <p className="flex-1 font-display text-sm font-bold uppercase tracking-tight text-foreground">
              Orientações gerais
            </p>
            {notesOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
          {notesOpen && (
            <div className="space-y-2 border-t border-border px-4 pb-4 pt-4">
              {notes.map((n, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {n.replace(/^[-•*]\s+/, "• ")}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiDietPlan;
