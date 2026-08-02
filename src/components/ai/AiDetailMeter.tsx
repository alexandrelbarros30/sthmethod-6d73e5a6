import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import type { AiKind } from "@/hooks/useAiApp";

type Topic = { label: string; words: string[] };

const TOPICS: Record<AiKind, Topic[]> = {
  diet: [
    { label: "Preferências / restrições alimentares", words: ["não gosto", "nao gosto", "restri", "alergi", "intoleran", "lactose", "gluten", "glúten", "evitar", "prefiro", "vegetarian", "vegan"] },
    { label: "Horários das refeições", words: ["horário", "horario", "hora", "manhã", "manha", "almoço", "almoco", "jantar", "café", "cafe", "ceia", "lanche", "h "] },
    { label: "Rotina e local das refeições", words: ["trabalho", "marmita", "casa", "rua", "escritório", "escritorio", "faculdade", "plantão", "plantao", "viagem", "rotina"] },
    { label: "Preparo / orçamento", words: ["cozinh", "preparo", "prático", "pratico", "rápido", "rapido", "barato", "custo", "orçamento", "orcamento", "mercado"] },
    { label: "Suplementos / treino", words: ["whey", "creatina", "supleme", "treino", "academia", "pré-treino", "pre treino"] },
  ],
  workout: [
    { label: "Local e equipamentos", words: ["academia", "casa", "condomínio", "condominio", "halter", "barra", "máquina", "maquina", "elástico", "elastico", "peso livre", "equipament"] },
    { label: "Frequência e duração", words: ["dias", "vezes", "semana", "min", "hora", "x por", "frequ"] },
    { label: "Lesões / limitações", words: ["dor", "lesão", "lesao", "hérnia", "hernia", "cirurgia", "limita", "joelho", "ombro", "lombar", "coluna", "tendin"] },
    { label: "Preferências de exercícios", words: ["gosto", "não gosto", "nao gosto", "evitar", "prefiro", "agachamento", "supino", "terra", "remada"] },
    { label: "Nível / cargas / objetivo", words: ["iniciante", "intermediário", "intermediario", "avançado", "avancado", "kg", "carga", "hipertrofia", "força", "forca", "emagrec", "prioridade"] },
  ],
  analysis: [
    { label: "Data / condições do exame", words: ["jejum", "coleta", "data", "/20", "exame de", "laborat"] },
    { label: "Sintomas atuais", words: ["sono", "cansaç", "cansac", "energia", "libido", "humor", "digest", "dor", "ansiedade", "queda de cabelo", "sintoma"] },
    { label: "Medicamentos / suplementos", words: ["medicament", "remédio", "remedio", "uso ", "mg", "supleme", "vitamina", "anticoncep"] },
    { label: "Comorbidades / histórico", words: ["diabet", "hipertens", "tireoid", "colesterol", "histórico", "historico", "família", "familia", "diagnóst", "diagnost"] },
    { label: "Dúvidas específicas", words: ["quero entender", "dúvida", "duvida", "por que", "porque", "gostaria de saber", "?"] },
  ],
};

export type DetailScore = {
  score: number;
  level: "fraco" | "razoável" | "bom" | "excelente";
  covered: { label: string; ok: boolean }[];
  words: number;
};

export function scoreDetail(text: string, kind: AiKind): DetailScore {
  const raw = (text || "").trim();
  const lower = raw.toLowerCase();
  const words = raw ? raw.split(/\s+/).length : 0;
  const topics = TOPICS[kind];
  const covered = topics.map((t) => ({ label: t.label, ok: t.words.some((w) => lower.includes(w)) }));
  const topicHits = covered.filter((c) => c.ok).length;

  const lengthScore = Math.min(50, (words / 60) * 50);
  const topicScore = (topicHits / topics.length) * 50;
  const score = Math.round(Math.min(100, lengthScore + topicScore));

  const level: DetailScore["level"] =
    score >= 80 ? "excelente" : score >= 60 ? "bom" : score >= 35 ? "razoável" : "fraco";

  return { score, level, covered, words };
}

const LEVEL_TEXT: Record<DetailScore["level"], string> = {
  fraco: "Poucos detalhes — o resultado tende a ficar genérico.",
  "razoável": "Está no caminho. Adicione mais contexto para ganhar precisão.",
  bom: "Bom nível de detalhe.",
  excelente: "Excelente detalhamento — entrega altamente personalizada.",
};

const LEVEL_CLASS: Record<DetailScore["level"], string> = {
  fraco: "text-destructive",
  "razoável": "text-amber-500",
  bom: "text-primary",
  excelente: "text-emerald-500",
};

export default function AiDetailMeter({ text, kind }: { text: string; kind: AiKind }) {
  const result = useMemo(() => scoreDetail(text, kind), [text, kind]);
  const missing = result.covered.filter((c) => !c.ok);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Detalhe suficiente</span>
        <span className={`font-semibold capitalize ${LEVEL_CLASS[result.level]}`}>
          {result.score}% · {result.level}
        </span>
      </div>
      <Progress value={result.score} className="h-2" />
      <p className="text-xs text-muted-foreground">{LEVEL_TEXT[result.level]}</p>
      {missing.length > 0 && (
        <ul className="space-y-1 pt-1">
          {result.covered.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {c.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Circle className="h-3.5 w-3.5 opacity-50" />
              )}
              <span className={c.ok ? "line-through opacity-60" : ""}>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
