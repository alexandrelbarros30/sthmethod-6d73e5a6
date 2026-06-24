import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, BookOpen, FileDown, Sparkles, ArrowLeft, FileText } from "lucide-react";
import pdfAsset from "@/assets/apostilas-provas-cas.pdf.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  "ADMINISTRAÇÃO APLICADA A PMERJ",
  "ARMAMENTO I",
  "ARMAMENTO II",
  "ATENDIMENTO PRÉ-HOSPITALAR",
  "CHEFIA E LIDERANÇA",
  "CRIMINALÍSTICA APLICADA",
  "DIREITO ADMINISTRATIVO",
  "DIREITO CONSTITUCIONAL",
  "DIREITO PENAL COMUM",
  "DIREITO PENAL MILITAR",
  "DIREITO PROCESSUAL PENAL COMUM",
  "DIREITO PROCESSUAL PENAL MILITAR",
  "DIREITOS HUMANOS",
  "INTELIGÊNCIA POLICIAL",
  "LEGISLAÇÃO DE TRÂNSITO",
  "LEIS ESPECIAIS",
  "NOÇÕES DE TELECOMUNICAÇÕES",
  "PRÁTICA PROCESSUAL",
  "PROTOCOLOS PARA OCORRÊNCIAS DE VIOLÊNCIA CONTRA A MULHER",
  "ÉTICA E DEONTOLOGIA POLICIAL MILITAR",
] as const;

type Match = {
  id: number;
  discipline: string;
  page_start: number;
  page_end: number;
  content: string;
  similarity: number;
};

type Chunk = {
  id: number;
  page_start: number;
  page_end: number;
  content: string;
};

type Mode = "search" | "book";

export default function Cas() {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [filterDisc, setFilterDisc] = useState<string | "">("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Book mode
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunkLoading, setChunkLoading] = useState(false);

  useEffect(() => {
    document.title = "CAS — Estudo Avançado";
  }, []);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setMatches([]);
    try {
      const { data, error } = await supabase.functions.invoke("cas-search", {
        body: { query: q, discipline: filterDisc || undefined, withAnswer: true, matchCount: 6 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnswer((data as any)?.answer ?? null);
      setMatches(((data as any)?.matches ?? []) as Match[]);
    } catch (err: any) {
      setError(err?.message ?? "Falha na busca");
    } finally {
      setLoading(false);
    }
  }

  async function openDiscipline(disc: string) {
    setSelectedDisc(disc);
    setChunkLoading(true);
    setChunks([]);
    try {
      const { data, error } = await supabase
        .from("cas_chunks")
        .select("id, page_start, page_end, content")
        .eq("discipline", disc)
        .order("chunk_index", { ascending: true });
      if (error) throw error;
      setChunks((data ?? []) as Chunk[]);
    } catch (err) {
      console.error(err);
    } finally {
      setChunkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold tracking-tight">CAS · Estudo Avançado</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-full border border-border p-0.5 bg-card">
              <button
                onClick={() => setMode("search")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition",
                  mode === "search" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                Pesquisar
              </button>
              <button
                onClick={() => { setMode("book"); setSelectedDisc(null); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition",
                  mode === "book" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BookOpen className="inline h-3.5 w-3.5 mr-1" />
                Livro
              </button>
            </div>
            <a
              href={pdfAsset.url}
              download="apostilas-provas-cas.pdf"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {mode === "search" ? (
          <SearchPanel
            query={query} setQuery={setQuery}
            filterDisc={filterDisc} setFilterDisc={setFilterDisc}
            loading={loading} answer={answer} matches={matches} error={error}
            onSubmit={runSearch}
            onOpenDiscipline={(d) => { setMode("book"); openDiscipline(d); }}
          />
        ) : (
          <BookPanel
            selectedDisc={selectedDisc}
            chunks={chunks}
            loading={chunkLoading}
            onSelect={openDiscipline}
            onBack={() => setSelectedDisc(null)}
          />
        )}
      </main>
    </div>
  );
}

function SearchPanel(props: {
  query: string; setQuery: (v: string) => void;
  filterDisc: string; setFilterDisc: (v: string) => void;
  loading: boolean; answer: string | null; matches: Match[]; error: string | null;
  onSubmit: (e?: React.FormEvent) => void;
  onOpenDiscipline: (d: string) => void;
}) {
  const { query, setQuery, filterDisc, setFilterDisc, loading, answer, matches, error, onSubmit } = props;
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Pergunte qualquer coisa sobre a apostila CAS</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: O que diferencia poder disciplinar de poder hierárquico?"
                className="pl-9 h-11 text-sm"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Disciplina:</span>
            <button
              type="button"
              onClick={() => setFilterDisc("")}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition",
                filterDisc === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Todas
            </button>
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilterDisc(filterDisc === d ? "" : d)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition",
                  filterDisc === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {shortName(d)}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {loading && (
        <Card className="p-6 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Buscando na apostila e gerando resposta…</span>
        </Card>
      )}

      {answer && (
        <Card className="p-5 border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Resposta da IA</h2>
          </div>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Resposta baseada apenas em trechos da apostila CAS. Confira as fontes abaixo.
          </p>
        </Card>
      )}

      {matches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fontes na apostila</h3>
          {matches.map((m, i) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">Fonte {i + 1}</Badge>
                  <button
                    onClick={() => props.onOpenDiscipline(m.discipline)}
                    className="text-xs font-semibold text-primary hover:underline text-left"
                  >
                    {m.discipline}
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    p. {m.page_start}{m.page_end !== m.page_start ? `–${m.page_end}` : ""}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {(m.similarity * 100).toFixed(0)}% relevância
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
                {m.content}
              </p>
            </Card>
          ))}
        </div>
      )}

      {!loading && !answer && matches.length === 0 && (
        <Card className="p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Faça uma pergunta sobre as 20 disciplinas do CAS. A IA usa apenas o conteúdo da apostila para responder.
          </p>
        </Card>
      )}
    </div>
  );
}

function BookPanel(props: {
  selectedDisc: string | null;
  chunks: Chunk[];
  loading: boolean;
  onSelect: (d: string) => void;
  onBack: () => void;
}) {
  const { selectedDisc, chunks, loading, onSelect, onBack } = props;

  if (!selectedDisc) {
    return (
      <div>
        <h2 className="text-sm font-semibold mb-4">20 disciplinas — escolha um capítulo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISCIPLINES.map((d, idx) => (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className="text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition group"
            >
              <div className="text-[10px] text-muted-foreground mb-1">Capítulo {String(idx + 1).padStart(2, "0")}</div>
              <div className="text-sm font-semibold group-hover:text-primary transition">{d}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todas as disciplinas
      </button>
      <h2 className="text-xl font-semibold mb-1">{selectedDisc}</h2>
      <p className="text-xs text-muted-foreground mb-6">{chunks.length} trechos · use Ctrl/Cmd+F para localizar termos</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando conteúdo…
        </div>
      ) : (
        <div className="space-y-4">
          {chunks.map((c) => (
            <article key={c.id} className="border-l-2 border-border pl-4 py-1">
              <div className="text-[10px] text-muted-foreground mb-1">
                página {c.page_start}{c.page_end !== c.page_start ? `–${c.page_end}` : ""}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{c.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function shortName(d: string) {
  return d
    .replace("DIREITO ", "Dir. ")
    .replace("PROCESSUAL PENAL ", "Proc. Penal ")
    .replace("ADMINISTRAÇÃO APLICADA A PMERJ", "Adm. PMERJ")
    .replace("ATENDIMENTO PRÉ-HOSPITALAR", "APH")
    .replace("PROTOCOLOS PARA OCORRÊNCIAS DE VIOLÊNCIA CONTRA A MULHER", "Viol. Mulher")
    .replace("ÉTICA E DEONTOLOGIA POLICIAL MILITAR", "Ética/Deontologia")
    .replace("NOÇÕES DE TELECOMUNICAÇÕES", "Telecom")
    .replace("LEGISLAÇÃO DE TRÂNSITO", "Trânsito")
    .replace("CRIMINALÍSTICA APLICADA", "Criminalística")
    .replace("INTELIGÊNCIA POLICIAL", "Inteligência")
    .replace("PRÁTICA PROCESSUAL", "Prática Proc.")
    .replace("CHEFIA E LIDERANÇA", "Chefia/Liderança");
}