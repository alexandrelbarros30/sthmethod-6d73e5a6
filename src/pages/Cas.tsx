import { useEffect, useRef, useState } from "react";
import { Search, Loader2, FileDown, ArrowLeft, FileText, ListChecks, Lightbulb, HelpCircle, ShieldCheck, BookMarked, Paperclip, X as XIcon, Camera } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import pdfAsset from "@/assets/apostilas-provas-cas.pdf.asset.json";
import questoesAsset from "@/assets/questoes-prova-cas.pdf.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type StructuredAnswer = {
  resposta_curta?: string;
  resposta_completa?: string;
  pontos_chave?: string[];
  conceitos?: { termo: string; definicao: string }[];
  questoes_relacionadas?: string[];
  confianca?: "alta" | "media" | "baixa";
  encontrado?: boolean;
};

type Chunk = {
  id: number;
  page_start: number;
  page_end: number;
  content: string;
};

type Mode = "search" | "book" | "simulado";

type QuizQuestion = {
  id: number;
  exam: string;
  discipline: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
};

export default function Cas() {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [filterDisc, setFilterDisc] = useState<string | "">("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [structured, setStructured] = useState<StructuredAnswer | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; mime: string; data: string; preview?: string } | null>(null);
  const [extracted, setExtracted] = useState<string | null>(null);

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
    if (!q && !attachment) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setStructured(null);
    setAnswerError(null);
    setMatches([]);
    setExtracted(null);
    try {
      const { data, error } = await supabase.functions.invoke("cas-search", {
        body: {
          query: q,
          discipline: filterDisc || undefined,
          withAnswer: true,
          matchCount: 10,
          attachment: attachment ? { mime: attachment.mime, data: attachment.data } : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnswer((data as any)?.answer ?? null);
      setStructured(((data as any)?.structured ?? null) as StructuredAnswer | null);
      setAnswerError((data as any)?.answerError ?? null);
      setMatches(((data as any)?.matches ?? []) as Match[]);
      const ex = (data as any)?.extractedQuery as string | null;
      if (ex) { setExtracted(ex); setQuery(ex); }
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
      {/* Header — Apple style */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-[#1d1d1f]" />
            <h1 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">CAS · Consulta Avançada</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-full bg-[#f5f5f7] p-0.5">
              <button
                onClick={() => setMode("search")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-medium transition",
                  mode === "search" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]",
                )}
              >
                Pesquisar
              </button>
              <button
                onClick={() => { setMode("book"); setSelectedDisc(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-medium transition",
                  mode === "book" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]",
                )}
              >
                Disciplinas
              </button>
              <button
                onClick={() => setMode("simulado")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-medium transition",
                  mode === "simulado" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]",
                )}
              >
                Simulado
              </button>
            </div>
            <a
              href={pdfAsset.url}
              download="apostilas-provas-cas.pdf"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:underline"
            >
              <FileDown className="h-3.5 w-3.5" />
              Apostila
            </a>
            <a
              href={questoesAsset.url}
              download="questoes-prova-cas.pdf"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:underline"
            >
              <FileDown className="h-3.5 w-3.5" />
              Questões
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {mode === "search" ? (
          <SearchPanel
            query={query} setQuery={setQuery}
            filterDisc={filterDisc} setFilterDisc={setFilterDisc}
          loading={loading} answer={answer} structured={structured} answerError={answerError} matches={matches} error={error}
            attachment={attachment} setAttachment={setAttachment} extracted={extracted}
            onSubmit={runSearch}
            onOpenDiscipline={(d) => { setMode("book"); openDiscipline(d); }}
          />
        ) : mode === "book" ? (
          <BookPanel
            selectedDisc={selectedDisc}
            chunks={chunks}
            loading={chunkLoading}
            onSelect={openDiscipline}
            onBack={() => setSelectedDisc(null)}
          />
        ) : (
          <SimuladoPanel />
        )}
      </main>
    </div>
  );
}

function SearchPanel(props: {
  query: string; setQuery: (v: string) => void;
  filterDisc: string; setFilterDisc: (v: string) => void;
  loading: boolean; answer: string | null; structured: StructuredAnswer | null; answerError: string | null; matches: Match[]; error: string | null;
  attachment: { name: string; mime: string; data: string; preview?: string } | null;
  setAttachment: (v: { name: string; mime: string; data: string; preview?: string } | null) => void;
  extracted: string | null;
  onSubmit: (e?: React.FormEvent) => void;
  onOpenDiscipline: (d: string) => void;
}) {
  const { query, setQuery, filterDisc, setFilterDisc, loading, answer, structured, answerError, matches, error, attachment, setAttachment, extracted, onSubmit } = props;
  const setQueryAndScroll = (q: string) => { setQuery(q); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const [openSource, setOpenSource] = useState<{ match: Match; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { alert("Arquivo muito grande (máx 8MB)."); return; }
    const buf = await f.arrayBuffer();
    let bin = ""; const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
    setAttachment({ name: f.name, mime: f.type || "application/octet-stream", data: b64, preview });
  };

  return (
    <div className="space-y-10">
      {/* Hero search — Apple search style */}
      <section className="text-center space-y-6 pt-4">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">
          O que você quer consultar?
        </h2>
        <p className="text-[15px] text-[#6e6e73] max-w-xl mx-auto">
          Digite a pergunta ou envie a foto/PDF da questão. Respostas diretas, citadas e prontas para a prova.
        </p>
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-[#f5f5f7] rounded-full border border-transparent focus-within:border-[#0071e3] focus-within:bg-white transition shadow-sm">
            <Search className="absolute left-5 h-4 w-4 text-[#6e6e73]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: o que é poder disciplinar? · por que existe IPM? · como instaurar..."
              className="pl-12 pr-44 h-14 text-[15px] bg-transparent border-0 rounded-full focus-visible:ring-0 placeholder:text-[#86868b]"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute right-[7.5rem] h-9 w-9 inline-flex items-center justify-center rounded-full text-[#6e6e73] hover:bg-[#e8e8ed] hover:text-[#1d1d1f] transition"
              title="Anexar imagem ou PDF da questão"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
            />
            <Button
              type="submit"
              disabled={loading || (!query.trim() && !attachment)}
              className="absolute right-1.5 h-11 px-6 rounded-full bg-[#1d1d1f] hover:bg-[#0071e3] text-white text-[13px] font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
            </Button>
          </div>
        </form>

        {attachment && (
          <div className="max-w-2xl mx-auto flex items-center gap-3 bg-white border border-[#d2d2d7] rounded-2xl p-3 text-left">
            {attachment.preview ? (
              <img src={attachment.preview} alt="" className="h-14 w-14 rounded-lg object-cover border border-[#e8e8ed]" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-[#f5f5f7] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#6e6e73]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[#1d1d1f] truncate">{attachment.name}</div>
              <div className="text-[11px] text-[#86868b]">Será lido pelo sistema para extrair o enunciado.</div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
              title="Remover anexo"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {extracted && (
          <div className="max-w-2xl mx-auto text-left bg-[#f5f5f7] rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-1 flex items-center gap-1.5">
              <Camera className="h-3 w-3" /> Enunciado lido do arquivo
            </div>
            <p className="text-[13px] text-[#1d1d1f] whitespace-pre-wrap">{extracted}</p>
          </div>
        )}

        {/* Discipline filter chips */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-4xl mx-auto pt-2">
          <button
            type="button"
            onClick={() => setFilterDisc("")}
            className={cn(
              "text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-full transition",
              filterDisc === "" ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
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
                "text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-full transition",
                filterDisc === d ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
              )}
            >
              {shortName(d).toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-[#f5f5f7] flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#1d1d1f]" />
          <span className="text-sm text-[#6e6e73]">Consultando a apostila…</span>
        </div>
      )}

      {(structured || answer) && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Q + Direct answer — Apple card */}
          <article className="bg-white rounded-3xl border border-[#d2d2d7] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-2">Pergunta</div>
            <h3 className="text-[22px] font-semibold text-[#1d1d1f] leading-snug mb-6">{query}</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b]">Resposta</div>
              {structured?.confianca && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                    structured.confianca === "alta" && "bg-emerald-50 text-emerald-700",
                    structured.confianca === "media" && "bg-amber-50 text-amber-700",
                    structured.confianca === "baixa" && "bg-rose-50 text-rose-700",
                  )}
                >
                  <ShieldCheck className="h-3 w-3" /> {structured.confianca}
                </span>
              )}
            </div>
            <p className="text-[19px] font-medium leading-relaxed text-[#1d1d1f]">
              {structured?.resposta_curta ?? (answer ? answer.slice(0, 240) + (answer.length > 240 ? "…" : "") : "")}
            </p>
            {structured?.encontrado === false && (
              <p className="mt-3 text-[12px] text-amber-700">
                Conteúdo não localizado diretamente — tente reformular ou filtrar por disciplina.
              </p>
            )}
          </article>

          {(structured?.resposta_completa || answer) && (
            <article className="bg-white rounded-3xl border border-[#d2d2d7] p-8">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-4">Aprofundamento</div>
              <div className="prose prose-neutral max-w-none text-[#1d1d1f] leading-[1.7] prose-headings:font-semibold prose-strong:text-[#1d1d1f] prose-li:my-1 prose-p:my-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {structured?.resposta_completa ?? answer ?? ""}
                </ReactMarkdown>
              </div>
            </article>
          )}

          {structured?.pontos_chave && structured.pontos_chave.length > 0 && (
            <article className="bg-[#f5f5f7] rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-4 w-4 text-[#1d1d1f]" />
                <div className="text-[13px] font-semibold uppercase tracking-wider text-[#1d1d1f]">Pontos-chave</div>
              </div>
              <ul className="space-y-3">
                {structured.pontos_chave.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[#1d1d1f]">
                    <span className="text-[#0071e3] font-semibold shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {structured?.conceitos && structured.conceitos.length > 0 && (
            <article className="bg-white rounded-3xl border border-[#d2d2d7] p-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4 text-[#1d1d1f]" />
                <div className="text-[13px] font-semibold uppercase tracking-wider text-[#1d1d1f]">Conceitos</div>
              </div>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {structured.conceitos.map((c, i) => (
                  <div key={i}>
                    <dt className="text-[14px] font-semibold text-[#1d1d1f] uppercase tracking-wide">{c.termo}</dt>
                    <dd className="text-[13px] text-[#6e6e73] mt-1 leading-relaxed">{c.definicao}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )}

          {structured?.questoes_relacionadas && structured.questoes_relacionadas.length > 0 && (
            <article className="bg-white rounded-3xl border border-[#d2d2d7] p-8">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-4 w-4 text-[#1d1d1f]" />
                <div className="text-[13px] font-semibold uppercase tracking-wider text-[#1d1d1f]">Continue estudando</div>
              </div>
              <div className="flex flex-col divide-y divide-[#e8e8ed]">
                {structured.questoes_relacionadas.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQueryAndScroll(q)}
                    className="text-left py-3 text-[15px] text-[#1d1d1f] hover:text-[#0071e3] transition flex items-center justify-between gap-3 group"
                  >
                    <span>{q}</span>
                    <span className="text-[#86868b] group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition">→</span>
                  </button>
                ))}
              </div>
            </article>
          )}

          <p className="text-[11px] text-[#86868b] text-center">
            Conteúdo extraído integralmente da apostila oficial CAS-PMERJ.
          </p>
        </div>
      )}

      {!answer && answerError && matches.length > 0 && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-[12px] text-amber-800">
            Consulta sintetizada temporariamente indisponível. Os trechos da apostila abaixo respondem diretamente à sua pergunta.
          </p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#86868b]">Fontes na apostila</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {matches.map((m, i) => (
                <button
                  key={`chip-${m.id}`}
                  onClick={() => setOpenSource({ match: m, index: i })}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white transition"
                  title={`${m.discipline} · p. ${m.page_start}`}
                >
                  [Fonte {String(i + 1).padStart(2, "0")}]
                </button>
              ))}
            </div>
          </div>
          {matches.map((m, i) => (
            <article
              key={m.id}
              className="bg-white rounded-2xl border border-[#d2d2d7] p-5 hover:border-[#1d1d1f] transition cursor-pointer"
              onClick={() => setOpenSource({ match: m, index: i })}
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]">Fonte {String(i + 1).padStart(2, "0")}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); props.onOpenDiscipline(m.discipline); }}
                    className="text-[12px] font-semibold uppercase tracking-wide text-[#1d1d1f] hover:text-[#0071e3] text-left"
                  >
                    {m.discipline}
                  </button>
                  <span className="text-[11px] text-[#86868b]">
                    p. {m.page_start}{m.page_end !== m.page_start ? `–${m.page_end}` : ""}
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap line-clamp-6">
                {m.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {!loading && !answer && matches.length === 0 && (
        <div className="max-w-3xl mx-auto p-10 text-center">
          <FileText className="h-8 w-8 text-[#86868b] mx-auto mb-3" />
          <p className="text-[14px] text-[#6e6e73]">
            Pesquise sobre qualquer uma das 20 disciplinas do CAS.
          </p>
        </div>
      )}

      <Dialog open={!!openSource} onOpenChange={(o) => !o && setOpenSource(null)}>
        <DialogContent className="max-w-2xl bg-white border-[#d2d2d7] text-[#1d1d1f]">
          <DialogHeader>
            <DialogTitle className="text-[11px] tracking-[0.2em] uppercase text-[#86868b] font-medium">
              Fonte {openSource ? String(openSource.index + 1).padStart(2, "0") : ""}
            </DialogTitle>
          </DialogHeader>
          {openSource && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { props.onOpenDiscipline(openSource.match.discipline); setOpenSource(null); }}
                  className="text-[14px] font-semibold uppercase tracking-wide text-[#1d1d1f] hover:text-[#0071e3]"
                >
                  {openSource.match.discipline}
                </button>
                <span className="text-[12px] text-[#86868b]">
                  página {openSource.match.page_start}
                  {openSource.match.page_end !== openSource.match.page_start ? `–${openSource.match.page_end}` : ""}
                </span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto bg-[#f5f5f7] rounded-2xl p-5">
                <p className="text-[14px] leading-[1.7] whitespace-pre-wrap text-[#1d1d1f]">
                  {openSource.match.content}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">As 20 Disciplinas.</h2>
          <p className="text-[15px] text-[#6e6e73]">Selecione um capítulo para ler na íntegra.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DISCIPLINES.map((d, idx) => (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className="text-left p-6 rounded-2xl bg-white border border-[#d2d2d7] hover:border-[#1d1d1f] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition group min-h-[140px] flex flex-col justify-between"
            >
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b]">
                Capítulo {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="text-[15px] font-semibold uppercase tracking-wide text-[#1d1d1f] leading-snug">
                {d}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-[#0071e3] hover:underline mb-6 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todas as disciplinas
      </button>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] uppercase mb-2">{selectedDisc}</h2>
      <p className="text-[12px] text-[#86868b] mb-8">{chunks.length} trechos · Ctrl/Cmd+F para localizar termos</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#6e6e73]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      ) : (
        <div className="space-y-6">
          {chunks.map((c) => (
            <article key={c.id} className="bg-white rounded-2xl border border-[#d2d2d7] p-6">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-2">
                Página {c.page_start}{c.page_end !== c.page_start ? `–${c.page_end}` : ""}
              </div>
              <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-[#1d1d1f]">{c.content}</p>
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