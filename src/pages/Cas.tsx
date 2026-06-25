import { useEffect, useRef, useState } from "react";
import { Search, Loader2, FileDown, ArrowLeft, FileText, ListChecks, Lightbulb, HelpCircle, ShieldCheck, BookMarked, Paperclip, X as XIcon, Camera, GraduationCap, Check, ChevronRight, Sparkles, Command, History, Zap, BookOpen, GitCompare, ListOrdered, Scale, Clock, Quote, ArrowUpRight, CornerDownLeft, User as UserIcon, LogOut, IdCard } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, Link } from "react-router-dom";
import pdfAsset from "@/assets/apostilas-provas-cas.pdf.asset.json";
import questoesAsset from "@/assets/questoes-prova-cas.pdf.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCasAuth } from "@/contexts/CasAuthContext";
import { casAuthApi } from "@/lib/casAuthClient";
import meadLogo from "@/assets/mead-logo.png.asset.json";
import { useMeadManifest } from "@/hooks/useMeadManifest";

function PdfsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition">
        <FileDown className="h-3.5 w-3.5" />
        PDFs
        <ChevronRight className="h-3 w-3 rotate-90 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-[#86868b]">Materiais oficiais</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={pdfAsset.url} download="apostilas-provas-cas.pdf" className="flex items-center gap-2 cursor-pointer">
            <BookOpen className="h-3.5 w-3.5 text-[#0071e3]" />
            <span className="flex-1">Apostila CAS-PMERJ</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={questoesAsset.url} download="questoes-prova-cas.pdf" className="flex items-center gap-2 cursor-pointer">
            <ListChecks className="h-3.5 w-3.5 text-amber-600" />
            <span className="flex-1">Questões de provas</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function openSourceInPdf(m: Match) {
  const isQuiz = m.source === "questoes";
  const base = isQuiz ? questoesAsset.url : pdfAsset.url;
  const page = !isQuiz && m.page_start ? `#page=${m.page_start}` : "";
  window.open(`${base}${page}`, "_blank", "noopener,noreferrer");
}

function ProfileMenu() {
  const { user, logout } = useCasAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = (user.full_name || user.email || "?")
    .split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/cas/login", { replace: true });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white pl-1 pr-3 py-1 text-[12px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-[10px] font-semibold text-white">
            {initials || <UserIcon className="h-3 w-3" />}
          </span>
          <span className="hidden sm:inline max-w-[140px] truncate">{user.full_name?.split(" ")[0] || "Perfil"}</span>
          <ChevronRight className="h-3 w-3 rotate-90 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="pb-1">
            <div className="text-[13px] font-semibold text-[#1d1d1f] truncate">{user.full_name}</div>
            <div className="text-[11px] font-normal text-[#86868b] truncate">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(true)} className="cursor-pointer">
            <IdCard className="h-3.5 w-3.5 text-[#0071e3] mr-2" />
            <span className="flex-1">Meu cadastro</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700">
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span className="flex-1">Sair do sistema</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1d1d1f]">Meu cadastro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e8e8ed]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3] text-[15px] font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#1d1d1f] truncate">{user.full_name}</div>
                <div className="text-[12px] text-[#86868b] truncate">{user.email}</div>
              </div>
            </div>
            {[
              { label: "Nome completo", value: user.full_name },
              { label: "E-mail", value: user.email },
              { label: "Data de nascimento", value: formatDate(user.birth_date) },
              { label: "Telefone", value: user.phone || "—" },
              { label: "RG", value: user.rg || "—" },
              { label: "Último acesso", value: user.last_login_at ? new Date(user.last_login_at).toLocaleString("pt-BR") : "—" },
              { label: "Cadastro criado em", value: formatDate(user.created_at) },
            ].map((f) => (
              <div key={f.label} className="flex items-start justify-between gap-3 text-[13px]">
                <span className="text-[#86868b] uppercase text-[10px] tracking-[0.14em] pt-0.5">{f.label}</span>
                <span className="text-[#1d1d1f] font-medium text-right break-words max-w-[60%]">{f.value}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-[#e8e8ed] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair do sistema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
  source?: "apostila" | "questoes";
  discipline: string;
  page_start: number;
  page_end: number;
  content: string;
  similarity: number;
  exam?: string;
  question_num?: number;
  statement?: string;
  options?: { A: string; B: string; C: string; D: string };
  correct_answer?: "A" | "B" | "C" | "D";
};

type StructuredAnswer = {
  resposta_curta?: string;
  resposta_completa?: string;
  pontos_chave?: string[];
  conceitos?: { termo: string; definicao: string }[];
  analise_por_fonte?: { fonte_index: number; tipo?: "apostila" | "questoes"; resumo: string }[];
  questoes_relacionadas?: string[];
  confianca?: "alta" | "media" | "baixa";
  encontrado?: boolean;
};

type SearchUiState = "idle" | "loading" | "success" | "no_response" | "quota_exhausted" | "fallback_active" | "cache_hit";

type SearchMeta = {
  cacheHit?: boolean;
  fallbackUsed?: boolean;
  fallbackProvider?: string | null;
  externalStatus?: number | null;
  durationMs?: number;
  status?: string;
};

type Chunk = {
  id: number;
  page_start: number;
  page_end: number;
  content: string;
};

type Mode = "search" | "book" | "simulado" | "study";

type AnswerSection = {
  kind: "answer" | "source";
  title?: string;
  content: string;
  sourceNumber?: number;
};

function splitAnswerIntoCards(markdown: string): AnswerSection[] {
  const lines = markdown.split("\n");
  const sections: AnswerSection[] = [];
  let current: AnswerSection = { kind: "answer", content: "" };

  const flush = () => {
    const content = current.content.trim();
    if (content) sections.push({ ...current, content });
  };

  for (const line of lines) {
    const sourceMatch = line.match(/^#{2,4}\s*Fonte\s+(\d+)\s*(?:[—-]\s*(.*))?$/i);
    if (sourceMatch) {
      flush();
      current = {
        kind: "source",
        sourceNumber: Number(sourceMatch[1]),
        title: sourceMatch[2]?.trim() || `Fonte ${sourceMatch[1]}`,
        content: "",
      };
      continue;
    }
    current.content += `${line}\n`;
  }

  flush();
  return sections.length > 0 ? sections : [{ kind: "answer", content: markdown }];
}

function extractHighlightTerms(query: string): string[] {
  if (!query) return [];
  const STOP = new Set([
    "o","a","os","as","de","da","do","das","dos","e","ou","que","qual","quais","quando","como","onde","por","para","pra","em","no","na","nos","nas","um","uma","uns","umas","se","sao","são","é","eh","ser","com","sem","ao","aos","à","às","sobre","tem","têm","ter","ha","há","mais","menos","entre","cada","quanto","quanta","qto","qtos","seu","sua","seus","suas","este","esta","isso","aquilo","esse","essa","pode","podem","deve","devem","ate","até","apenas","tambem","também"
  ]);
  const cleaned = query.replace(/[¿?!.,;:()"']/g, " ").toLowerCase();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (const t of tokens) {
    if (t.length < 4) continue;
    if (STOP.has(t)) continue;
    out.add(t);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

function useHighlight(ref: React.RefObject<HTMLElement>, terms: string[], deps: any[]) {
  useEffect(() => {
    const root = ref.current;
    if (!root || terms.length === 0) return;
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`(${escaped.join("|")})`, "giu");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const p = (n as Text).parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === "MARK" || tag === "CODE" || tag === "PRE" || tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if (!(n as Text).nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const targets: Text[] = [];
    let cur: Node | null;
    while ((cur = walker.nextNode())) targets.push(cur as Text);
    for (const node of targets) {
      const text = node.nodeValue ?? "";
      if (!re.test(text)) { re.lastIndex = 0; continue; }
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        const mark = document.createElement("mark");
        mark.textContent = m[0];
        mark.style.background = "#fff3a8";
        mark.style.color = "#1d1d1f";
        mark.style.padding = "0 2px";
        mark.style.borderRadius = "3px";
        frag.appendChild(mark);
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      node.parentNode?.replaceChild(frag, node);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function MarkdownAnswerCards({ markdown, highlightTerms = [], readingMode = false }: { markdown: string; highlightTerms?: string[]; readingMode?: boolean }) {
  const sections = splitAnswerIntoCards(markdown);

  const formatForReading = (text: string): string => {
    const blocks: string[] = [];
    let t = text.replace(/```[\s\S]*?```/g, (m) => {
      blocks.push(m);
      return `\u0000B${blocks.length - 1}\u0000`;
    });
    const citations: string[] = [];
    t = t.replace(/\[Fonte\s+\d+[^\]]*\]/gi, (m) => {
      citations.push(m);
      return `\u0000F${citations.length - 1}\u0000`;
    });

    // Força itens de prova/apostila a nascerem em novo parágrafo, mesmo quando a IA
    // devolve tudo condensado: "texto anterior 1) item", "texto A) opção", "2 - tópico".
    t = t.replace(/([^\n])\s+(?=(?:\(?[A-Ea-e]\)?\s*[).:\-]\s+))/g, "$1\n\n");
    t = t.replace(/([^\n])\s+(?=(?:\d{1,2}\s*[).:\-]\s+))/g, "$1\n\n");
    t = t.replace(/([^\n])\s+(?=(?:\d{1,2}\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}\p{M}]{2,})))/gu, "$1\n\n");
    t = t.replace(
      /(^|\n\n|\n)\s*\(?([A-Ea-e])\)?\s*[).:\-]\s+/g,
      (_m, pre, letter) => `${pre || "\n\n"}**${String(letter).toUpperCase()})**\n\n`,
    );
    t = t.replace(
      /(^|\n\n|\n)\s*(\d{1,2})\s*[).:\-]\s+/g,
      (_m, pre, num) => `${pre || "\n\n"}**${num}.**\n\n`,
    );
    t = t.replace(
      /(^|\n\n|\n)\s*(\d{1,2})\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}\p{M}]{2,})/gu,
      (_m, pre, num) => `${pre || "\n\n"}**${num}.**\n\n`,
    );

    t = t.replace(/([?!])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"(])/g, "$1\n\n");
    t = t.replace(
      /(^|[.;:!?]\s+|\n)([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}[A-ZÁÉÍÓÚÂÊÔÃÕÇ])(?=\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"(])/g,
      (_m, pre, title) => `${pre === "\n" ? "" : pre}\n\n### ${title.trim()}\n\n`,
    );
    {
      const parts = t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"(])/);
      const grouped: string[] = [];
      for (let i = 0; i < parts.length; i += 2) {
        grouped.push(parts.slice(i, i + 2).join(" "));
      }
      t = grouped.join("\n\n");
    }
    t = t.replace(/\n{3,}/g, "\n\n").trimStart();
    t = t.replace(/\u0000F(\d+)\u0000/g, (_m, i) => citations[Number(i)]);
    t = t.replace(/\u0000B(\d+)\u0000/g, (_m, i) => blocks[Number(i)]);
    return t;
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <AnswerSectionCard
          key={`${section.kind}-${section.sourceNumber ?? index}`}
          section={section}
          formatted={formatForReading(section.content)}
          highlightTerms={highlightTerms}
          readingMode={readingMode}
        />
      ))}
    </div>
  );
}

function AnswerSectionCard({ section, formatted, highlightTerms, readingMode = false }: { section: { kind: "answer" | "source"; sourceNumber?: number; title?: string; content: string }; formatted: string; highlightTerms: string[]; readingMode?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useHighlight(ref, highlightTerms, [formatted, highlightTerms.join("|")]);
  return (
    <article
      className={cn(
        "rounded-3xl border overflow-hidden relative",
        section.kind === "source" ? "bg-[#f5f5f7] border-[#d2d2d7] p-7" : "bg-white border-[#d2d2d7]",
        // Apple Fitness — blue lateral bar no card de resposta
        section.kind === "answer" && "before:content-[''] before:absolute before:left-0 before:top-6 before:bottom-6 before:w-[3px] before:rounded-r-full before:bg-[#0071e3]",
      )}
    >
      {section.kind === "source" && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1d1d1f] text-white">
            Fonte {String(section.sourceNumber).padStart(2, "0")}
          </span>
          {section.title && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1d1d1f]">
              {section.title}
            </span>
          )}
        </div>
      )}
      <div
        ref={ref}
        className="prose prose-neutral max-w-none text-[#1d1d1f] prose-headings:font-semibold prose-strong:text-[#1d1d1f] prose-p:text-left prose-p:my-0 prose-p:mb-4 prose-li:my-2 prose-headings:mt-6 prose-headings:mb-3 prose-h3:text-[13pt] prose-h3:uppercase prose-h3:tracking-wide"
        style={{
          fontFamily: readingMode
            ? '"New York", "Iowan Old Style", "Charter", "Times New Roman", serif'
            : '"Times New Roman", Times, serif',
          fontSize: readingMode ? "14pt" : "12pt",
          lineHeight: readingMode ? 1.85 : 1.6,
          padding: readingMode ? "2.5rem 3rem" : "2rem 2.5rem",
          maxWidth: readingMode ? "68ch" : undefined,
          margin: readingMode ? "0 auto" : undefined,
          textAlign: "left",
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatted}</ReactMarkdown>
      </div>
    </article>
  );
}

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
  useMeadManifest();
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
  const [searchState, setSearchState] = useState<SearchUiState>("idle");
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [occurrences, setOccurrences] = useState<{ term: string; isPhrase: boolean; total: number; chunks: number } | null>(null);

  // Book mode
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunkLoading, setChunkLoading] = useState(false);

  useEffect(() => {
    document.title = "MEAD · CAS — Assistente de Aprendizagem";
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
    setSearchState("loading");
    setSearchMeta(null);
    setOccurrences(null);
    try {
      const { data, error } = await supabase.functions.invoke("cas-search", {
        body: {
          query: q,
          discipline: filterDisc || undefined,
          withAnswer: true,
          matchCount: 18,
          attachment: attachment ? { mime: attachment.mime, data: attachment.data } : undefined,
        },
      });
      if (error) throw error;
      const payload = (data ?? {}) as any;
      const nextAnswer = payload?.answer ?? null;
      const nextStructured = (payload?.structured ?? null) as StructuredAnswer | null;
      const nextMatches = ((payload?.matches ?? []) as Match[]);
      const meta: SearchMeta = {
        ...(payload?.metrics ?? {}),
        cacheHit: Boolean(payload?.cacheHit || payload?.metrics?.cacheHit),
        fallbackUsed: Boolean(payload?.fallbackUsed || payload?.metrics?.fallbackUsed),
        fallbackProvider: payload?.fallbackProvider ?? null,
        status: payload?.status,
      };
      setAnswer(nextAnswer);
      setStructured(nextStructured);
      setAnswerError(payload?.answerError ?? payload?.error ?? null);
      setError(payload?.error && !nextAnswer && !nextStructured ? payload.error : null);
      setMatches(nextMatches);
      setSearchMeta(meta);
      setOccurrences((payload?.occurrences ?? null) as any);
      const uiState = (payload?.uiState ?? "success") as SearchUiState;
      setSearchState(meta.cacheHit ? "cache_hit" : uiState);
      const ex = (data as any)?.extractedQuery as string | null;
      if (ex) { setExtracted(ex); setQuery(ex); }
    } catch (err: any) {
      setError(err?.message ?? "Falha na busca");
      setAnswerError(err?.message ?? "Falha na busca");
      setSearchState("no_response");
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
    <div className="min-h-screen bg-background text-foreground" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Header — Apple style */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-4">
          <Link to="/cas" className="flex items-center gap-2.5 shrink-0">
            <img src={meadLogo.url} alt="MEAD — Assistente de Aprendizagem" className="h-9 sm:h-12 md:h-14 w-auto object-contain" />
            <span className="hidden sm:inline text-[12px] text-[#86868b] font-medium tracking-[0.18em] uppercase">· CAS</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 min-w-0">
            <div className="hidden md:inline-flex rounded-full bg-[#f5f5f7] p-0.5">
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
              <button
                onClick={() => setMode("study")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-medium transition",
                  mode === "study" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]",
                )}
              >
                Estudar
              </button>
            </div>
            <PdfsMenu />
            <ProfileMenu />
          </div>
        </div>
        {/* Mobile tabs — horizontal scroll */}
        <div className="md:hidden border-t border-[#ececef] bg-white/60">
          <div className="max-w-6xl mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {([
              ["search", "Pesquisar"],
              ["book", "Disciplinas"],
              ["simulado", "Simulado"],
              ["study", "Estudar"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setMode(key as Mode); if (key === "book") setSelectedDisc(null); }}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition border",
                  mode === key
                    ? "bg-[#1d1d1f] text-white border-[#1d1d1f]"
                    : "bg-white text-[#6e6e73] border-[#e6e6e8] hover:text-[#1d1d1f]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Breadcrumb persistente — MEAD › CAS › Modo */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 pt-1">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-[11px] text-[#86868b] font-medium">
            <span className="text-[#1d1d1f]/70">MEAD</span>
            <span className="text-[#d2d2d7]">/</span>
            <span className="text-[#1d1d1f]/70">CAS</span>
            <span className="text-[#d2d2d7]">/</span>
            <span className="text-[#1d1d1f] font-semibold uppercase tracking-[0.18em]">
              {mode === "search" ? "Pesquisar" : mode === "book" ? (selectedDisc ?? "Disciplinas") : mode === "simulado" ? "Simulado" : "Estudar"}
            </span>
            {mode === "book" && selectedDisc && (
              <>
                <button
                  onClick={() => setSelectedDisc(null)}
                  className="ml-2 text-[10px] uppercase tracking-wider text-[#0071e3] hover:underline"
                >
                  ← voltar
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {mode === "search" ? (
          <SearchPanel
            query={query} setQuery={setQuery}
            filterDisc={filterDisc} setFilterDisc={setFilterDisc}
            loading={loading} answer={answer} structured={structured} answerError={answerError} matches={matches} error={error}
            searchState={searchState} searchMeta={searchMeta}
            occurrences={occurrences}
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
        ) : mode === "simulado" ? (
          <SimuladoPanel />
        ) : (
          <StudyPanel />
        )}
      </main>
    </div>
  );
}

function SearchPanel(props: {
  query: string; setQuery: (v: string) => void;
  filterDisc: string; setFilterDisc: (v: string) => void;
  loading: boolean; answer: string | null; structured: StructuredAnswer | null; answerError: string | null; matches: Match[]; error: string | null;
  searchState: SearchUiState; searchMeta: SearchMeta | null;
  occurrences: { term: string; isPhrase: boolean; total: number; chunks: number } | null;
  attachment: { name: string; mime: string; data: string; preview?: string } | null;
  setAttachment: (v: { name: string; mime: string; data: string; preview?: string } | null) => void;
  extracted: string | null;
  onSubmit: (e?: React.FormEvent) => void;
  onOpenDiscipline: (d: string) => void;
}) {
  const { query, setQuery, filterDisc, setFilterDisc, loading, answer, structured, answerError, matches, error, searchState, searchMeta, occurrences, attachment, setAttachment, extracted, onSubmit } = props;
  const setQueryAndScroll = (q: string) => { setQuery(q); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const [openSource, setOpenSource] = useState<{ match: Match; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"direta" | "aprofundar" | "pontos" | "conceitos" | "fontes">("direta");
  const [readingMode, setReadingMode] = useState<boolean>(() => {
    try { return localStorage.getItem("cas:reading-mode") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("cas:reading-mode", readingMode ? "1" : "0"); } catch {}
  }, [readingMode]);
  const { user: casUser } = useCasAuth();
  const [recent, setRecent] = useState<string[]>([]);
  const [history, setHistory] = useState<{ id: string; query: string; discipline: string | null; has_answer: boolean; created_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [metrics, setMetrics] = useState<{
    hourly: Array<{ total_requests: number; avg_duration_ms: number; failure_rate_pct: number; fallback_uses: number; cache_hits: number; rate_limited_count: number; upstream_5xx_count: number }>;
    logs: Array<{ id: string; created_at: string; duration_ms: number; status: string; cache_hit: boolean; fallback_used: boolean; external_status: number | null }>;
  } | null>(null);

  // Recent searches (localStorage) — fallback quando não autenticado
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cas_recent_v1");
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // Histórico server-side por aluno autenticado
  const loadHistory = async () => {
    if (!casUser) { setHistory([]); return; }
    setHistoryLoading(true);
    try {
      const { items } = await casAuthApi.historyList(30);
      setHistory(items);
    } catch {} finally { setHistoryLoading(false); }
  };
  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [casUser?.id]);

  useEffect(() => {
    if (!loading && (structured || answer) && query.trim()) {
      setRecent((prev) => {
        const next = [query.trim(), ...prev.filter((q) => q !== query.trim())].slice(0, 6);
        try { localStorage.setItem("cas_recent_v1", JSON.stringify(next)); } catch {}
        return next;
      });
      setTab("direta");
      if (casUser) {
        casAuthApi.historyAdd({
          query: query.trim(),
          discipline: filterDisc || null,
          has_answer: Boolean(structured || answer),
        }).then(loadHistory).catch(() => {});
      }
    }
  }, [loading, structured, answer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⌘K / Ctrl+K focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Streaming-feel loader steps
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    setLoadingStep(0);
    const id = setInterval(() => setLoadingStep((s) => Math.min(s + 1, 3)), 900);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: hourly }, { data: logs }] = await Promise.all([
        (supabase as any).from("cas_search_metrics_hourly").select("total_requests,avg_duration_ms,failure_rate_pct,fallback_uses,cache_hits,rate_limited_count,upstream_5xx_count").limit(1),
        (supabase as any).from("cas_search_logs").select("id,created_at,duration_ms,status,cache_hit,fallback_used,external_status").order("created_at", { ascending: false }).limit(5),
      ]);
      if (alive && ((hourly?.length ?? 0) > 0 || (logs?.length ?? 0) > 0)) setMetrics({ hourly: hourly ?? [], logs: logs ?? [] });
    })().catch(() => {});
    return () => { alive = false; };
  }, [searchState]);

  const INTENTS: Array<{ key: string; label: string; icon: React.ReactNode; prefix: string }> = [
    { key: "def", label: "Definir", icon: <BookOpen className="h-3.5 w-3.5" />, prefix: "O que é " },
    { key: "cmp", label: "Comparar", icon: <GitCompare className="h-3.5 w-3.5" />, prefix: "Qual a diferença entre " },
    { key: "proc", label: "Procedimento", icon: <ListOrdered className="h-3.5 w-3.5" />, prefix: "Como se procede " },
    { key: "hip", label: "Hipóteses", icon: <Clock className="h-3.5 w-3.5" />, prefix: "Em que hipóteses " },
    { key: "vf", label: "Verdadeiro/Falso", icon: <Scale className="h-3.5 w-3.5" />, prefix: "É correto afirmar que " },
  ];
  const SUGGESTIONS = [
    "O que é poder disciplinar?",
    "Diferença entre IPM e sindicância",
    "Quando cabe prisão em flagrante?",
    "Como instaurar inquérito policial militar?",
    "Princípios da administração pública",
    "Hipóteses de transgressão disciplinar grave",
  ];

  const statusNotice = (() => {
    if (loading) {
      return {
        tone: "blue",
        title: "Carregando consulta EAD",
        text: "O sistema está pesquisando a apostila, sintetizando a resposta e validando as fontes.",
      };
    }
    return null;
  })();

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
    <div className="space-y-8">
      {/* Hero — Apple Fitness direction: split search + activity rings */}
      <section className="rounded-[32px] border border-[#d2d2d7] bg-white p-6 sm:p-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[10px] font-bold tracking-[0.18em] uppercase text-[#1d1d1f]">
              <Zap className="h-3 w-3 text-[#0071e3]" /> MEAD · CAS · núcleo de consulta inteligente
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#1d1d1f] leading-[1.02]">
              Pergunte.<br /><span className="text-[#86868b]">A apostila responde.</span>
            </h2>

            <form onSubmit={onSubmit}>
            <div className="relative flex items-center bg-white rounded-2xl border-2 border-[#d2d2d7] focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/10 transition shadow-sm">
              <Search className="absolute left-5 h-4 w-4 text-[#6e6e73]" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="O que você quer aprender hoje?"
                className="pl-12 pr-56 h-16 text-[15px] bg-transparent border-0 rounded-2xl focus-visible:ring-0 placeholder:text-[#86868b]"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <kbd className="hidden md:inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#f5f5f7] border border-[#e8e8ed] text-[10px] font-mono text-[#86868b]">
                  <Command className="h-3 w-3" />K
                </kbd>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition"
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
                  className="h-12 px-5 rounded-xl bg-black hover:bg-[#1d1d1f] text-white text-[13px] font-medium gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Consultar <CornerDownLeft className="h-3.5 w-3.5 opacity-70" /></>}
                </Button>
              </div>
            </div>

            {/* Intent quick actions */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {INTENTS.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    setQuery(it.prefix);
                    setTimeout(() => {
                      inputRef.current?.focus();
                      const v = it.prefix;
                      inputRef.current?.setSelectionRange(v.length, v.length);
                    }, 0);
                  }}
                  className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#1d1d1f] hover:bg-white transition"
                >
                  {it.icon} {it.label}
                </button>
              ))}
            </div>
            </form>
          </div>

          {/* Right — Activity Rings */}
          <div className="bg-[#f5f5f7] rounded-[28px] p-6 sm:p-8 border border-[#d2d2d7] flex items-center justify-center gap-6 sm:gap-8">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
              <svg viewBox="0 0 192 192" className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="#d2d2d7" strokeOpacity="0.4" strokeWidth="16" fill="transparent" />
                <circle cx="96" cy="96" r="80" stroke="#0071e3" strokeWidth="16" fill="transparent" strokeDasharray="502" strokeDashoffset="125" strokeLinecap="round" />
                <circle cx="96" cy="96" r="58" stroke="#d2d2d7" strokeOpacity="0.4" strokeWidth="16" fill="transparent" />
                <circle cx="96" cy="96" r="58" stroke="#1d1d1f" strokeWidth="16" fill="transparent" strokeDasharray="365" strokeDashoffset="110" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-[#86868b] uppercase tracking-[0.18em]">Cobertura</span>
                <span className="text-2xl font-bold tracking-tight text-[#1d1d1f]">CAS</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0071e3]" />
                  <div className="text-[9px] font-bold text-[#0071e3] uppercase tracking-[0.18em]">Trechos indexados</div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">1.297</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1d1d1f]" />
                  <div className="text-[9px] font-bold text-[#1d1d1f] uppercase tracking-[0.18em]">Questões CAS</div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">479</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#86868b]" />
                  <div className="text-[9px] font-bold text-[#86868b] uppercase tracking-[0.18em]">Disciplinas</div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-[#1d1d1f] mt-1">20</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        <div className="max-w-3xl mx-auto text-left bg-[#f5f5f7] rounded-2xl p-4">
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-1 flex items-center gap-1.5">
              <Camera className="h-3 w-3" /> Enunciado lido do arquivo
            </div>
            <p className="text-[13px] text-[#1d1d1f] whitespace-pre-wrap">{extracted}</p>
          </div>
        )}

      {/* Discipline filter */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] pt-2 shrink-0">Filtro</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterDisc("")}
            className={cn(
              "text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-full transition",
              filterDisc === "" ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
            )}
          >
            Todas as 20
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
      </div>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {statusNotice && !loading && (
        <div className={cn(
          "max-w-3xl mx-auto p-4 rounded-2xl border",
          statusNotice.tone === "red" && "border-red-200 bg-red-50 text-red-800",
          statusNotice.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
          statusNotice.tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-800",
          statusNotice.tone === "blue" && "border-[#0071e3]/20 bg-[#0071e3]/5 text-[#1d1d1f]",
        )}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {statusNotice.tone === "green" ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-semibold">{statusNotice.title}</p>
              <p className="text-[12px] leading-relaxed opacity-85">{statusNotice.text}</p>
              {/* metadados técnicos ocultos do usuário final */}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#d2d2d7] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-[#86868b]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0071e3]" /> Processando consulta
          </div>
          <ol className="space-y-2 text-[13px]">
            {[
              "Indexando termos e sinônimos jurídicos",
              "Buscando trechos relevantes na apostila oficial",
              "Sintetizando resposta técnico-didática",
              "Citando fontes e organizando conceitos",
            ].map((label, i) => (
              <li key={i} className={cn(
                "flex items-center gap-2 transition-colors",
                i < loadingStep ? "text-[#1d1d1f]" : i === loadingStep ? "text-[#0071e3]" : "text-[#c7c7cc]",
              )}>
                {i < loadingStep ? <Check className="h-3.5 w-3.5 text-emerald-600" /> :
                  i === loadingStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                  <span className="h-3.5 w-3.5 rounded-full border border-current opacity-40" />}
                {label}
              </li>
            ))}
          </ol>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-[#f5f5f7] rounded animate-pulse" />
            <div className="h-3 w-11/12 bg-[#f5f5f7] rounded animate-pulse" />
            <div className="h-3 w-9/12 bg-[#f5f5f7] rounded animate-pulse" />
          </div>
        </div>
      )}

      {(structured || answer) && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Question header */}
          <article className="bg-white rounded-3xl border border-[#d2d2d7] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] flex items-center gap-1.5">
                <Quote className="h-3 w-3" /> Pergunta
              </div>
              <div className="flex items-center gap-2">
                {structured?.confianca && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                    structured.confianca === "alta" && "bg-emerald-50 text-emerald-700",
                    structured.confianca === "media" && "bg-amber-50 text-amber-700",
                    structured.confianca === "baixa" && "bg-rose-50 text-rose-700",
                  )}>
                    <ShieldCheck className="h-3 w-3" /> confiança {structured.confianca}
                  </span>
                )}
                {matches.length > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]">
                    {matches.length} fontes
                  </span>
                )}
                {occurrences && occurrences.total > 0 && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]"
                    title={`${occurrences.isPhrase ? "Frase" : "Termo"} "${occurrences.term}" — ${occurrences.total} ocorrência(s) em ${occurrences.chunks} trecho(s) da apostila (ignora acentos e pontuação).`}
                  >
                    {occurrences.isPhrase ? "frase" : "termo"} · {occurrences.total}× em {occurrences.chunks} trechos
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-[22px] font-semibold text-[#1d1d1f] leading-snug">{query}</h3>
            {structured?.encontrado === false && (
              <p className="mt-3 text-[12px] text-amber-700">
                Conteúdo não localizado diretamente — tente reformular ou filtrar por disciplina.
              </p>
            )}
          </article>

          {/* Direct answer — destaque */}
          {structured?.resposta_curta && (
            <article className="rounded-3xl bg-gradient-to-br from-[#1d1d1f] to-[#2d2d33] text-white p-7">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-3">Resposta direta</div>
              <p className="text-[19px] font-medium leading-[1.55]">{structured.resposta_curta}</p>
            </article>
          )}

          {/* Tabs */}
          <div className="sticky top-[80px] z-10 -mx-2 px-2 py-2 bg-white/85 backdrop-blur-xl rounded-2xl border border-[#d2d2d7]">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {([
                { k: "direta", label: "Aprofundamento", icon: <BookOpen className="h-3.5 w-3.5" /> },
                { k: "pontos", label: "Pontos-chave", icon: <ListChecks className="h-3.5 w-3.5" />, count: structured?.pontos_chave?.length },
                { k: "conceitos", label: "Conceitos", icon: <Lightbulb className="h-3.5 w-3.5" />, count: structured?.conceitos?.length },
                { k: "fontes", label: "Fontes", icon: <Quote className="h-3.5 w-3.5" />, count: matches.length },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as any)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap transition",
                    tab === t.k ? "bg-[#1d1d1f] text-white" : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]",
                  )}
                >
                  {t.icon}{t.label}
                  {"count" in t && t.count ? (
                    <span className={cn("ml-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded", tab === t.k ? "bg-white/15" : "bg-[#f5f5f7]")}>{t.count}</span>
                  ) : null}
                </button>
              ))}
              <button
                onClick={() => setReadingMode((v) => !v)}
                title={readingMode ? "Sair do modo leitura (Apple Books)" : "Ativar modo leitura (Apple Books)"}
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap transition border",
                  readingMode
                    ? "bg-[#1d1d1f] text-white border-[#1d1d1f]"
                    : "text-[#6e6e73] border-[#d2d2d7] hover:text-[#1d1d1f] hover:border-[#1d1d1f]",
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Leitura
              </button>
            </div>
          </div>

          {tab === "direta" && (structured?.resposta_completa || answer) && (
            <>
              <MarkdownAnswerCards
                markdown={structured?.resposta_completa ?? answer ?? ""}
                highlightTerms={extractHighlightTerms(query)}
                readingMode={readingMode}
              />
              <p className="text-[11px] text-[#86868b] italic px-2 pt-2">
                Esta consulta é um apoio de estudo e <strong className="not-italic font-semibold text-[#1d1d1f]">não substitui a leitura integral das apostilas</strong>.
              </p>
            </>
          )}

          {tab === "pontos" && structured?.pontos_chave && structured.pontos_chave.length > 0 && (
            <article className="bg-[#f5f5f7] rounded-3xl p-7">
              <ul className="space-y-3">
                {structured.pontos_chave.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[#1d1d1f]">
                    <span className="text-[#0071e3] font-mono font-semibold shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {tab === "conceitos" && structured?.conceitos && structured.conceitos.length > 0 && (
            <article className="bg-white rounded-3xl border border-[#d2d2d7] p-7">
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                {structured.conceitos.map((c, i) => (
                  <div key={i} className="border-l-2 border-[#0071e3] pl-3">
                    <dt className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wide">{c.termo}</dt>
                    <dd className="text-[13px] text-[#6e6e73] mt-1 leading-relaxed">{c.definicao}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )}

          {tab === "fontes" && matches.length > 0 && (
            <div className="space-y-6">
              {(() => {
                const apostilaMatches = matches.map((m, i) => ({ m, i })).filter(({ m }) => m.source !== "questoes");
                const quizMatches = matches.map((m, i) => ({ m, i })).filter(({ m }) => m.source === "questoes");
                const renderCard = ({ m, i }: { m: Match; i: number }) => {
                  const isQuiz = m.source === "questoes";
                  const analise = structured?.analise_por_fonte?.find((a) => a.fonte_index === i + 1);
                  const correctText = isQuiz && m.correct_answer && m.options ? m.options[m.correct_answer] : null;
                  return (
                  <article
                    key={`${m.source ?? "apostila"}-${m.id}`}
                    className={cn(
                      "rounded-2xl border p-5 hover:border-[#1d1d1f] transition cursor-pointer group",
                      isQuiz ? "bg-[#fffaf0] border-[#f0e0bf]" : "bg-white border-[#d2d2d7]",
                    )}
                    onClick={() => openSourceInPdf(m)}
                    title={isQuiz ? "Abrir caderno de questões em nova aba" : `Abrir apostila na página ${m.page_start}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1d1d1f] text-white">F{String(i + 1).padStart(2, "0")}</span>
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
                          isQuiz ? "bg-amber-600 text-white" : "bg-[#0071e3] text-white",
                        )}>
                          {isQuiz ? "Questões" : "Apostila"}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); props.onOpenDiscipline(m.discipline); }}
                          className="text-[12px] font-semibold uppercase tracking-wide text-[#1d1d1f] hover:text-[#0071e3] text-left"
                        >
                          {m.discipline}
                        </button>
                        <span className="text-[11px] text-[#86868b] font-mono">
                          {isQuiz
                            ? `${m.exam ?? "Prova"} · Q${m.question_num ?? "?"}`
                            : `p.${m.page_start}${m.page_end !== m.page_start ? `–${m.page_end}` : ""}`}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold px-2.5 py-1 rounded-full transition",
                          isQuiz
                            ? "bg-amber-900 text-white group-hover:bg-amber-950"
                            : "bg-[#1d1d1f] text-white group-hover:bg-black",
                        )}
                      >
                        Abrir PDF <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                    {isQuiz && m.statement ? (
                      <div className="space-y-2">
                        {correctText && (
                          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
                            <div className="text-[13px] text-emerald-900 leading-snug">
                              <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-700 block mb-0.5">Gabarito oficial · alternativa {m.correct_answer}</span>
                              {correctText}
                            </div>
                          </div>
                        )}
                        <p className="text-[13px] text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">{m.statement}</p>
                        {m.options && (
                          <ul className="text-[12px] text-[#6e6e73] space-y-0.5">
                            {(["A", "B", "C", "D"] as const).map((k) => (
                              <li
                                key={k}
                                className={cn(
                                  "flex gap-2 px-2 py-1 rounded",
                                  m.correct_answer === k && "bg-emerald-50 text-emerald-800 font-medium",
                                )}
                              >
                                <span className="font-mono font-semibold">{k})</span>
                                <span>{m.options![k]}</span>
                                {m.correct_answer === k && <Check className="h-3 w-3 ml-auto shrink-0" />}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap line-clamp-6">
                        {m.content}
                      </p>
                    )}
                    {analise?.resumo && (
                      <div className="mt-3 pt-3 border-t border-dashed border-[#e8e8ed]">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-[#86868b] mb-1">Como esta fonte responde</div>
                        <p className="text-[12px] text-[#1d1d1f] leading-relaxed">{analise.resumo}</p>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-dashed border-[#e8e8ed] flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#86868b]">
                        {isQuiz ? "Caderno oficial de questões" : `Apostila CAS-PMERJ · página ${m.page_start}`}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenSource({ match: m, index: i }); }}
                        className="text-[10px] uppercase tracking-wider text-[#6e6e73] hover:text-[#1d1d1f]"
                      >
                        Pré-visualizar trecho
                      </button>
                    </div>
                  </article>
                  );
                };
                return (
                  <>
                    {apostilaMatches.length > 0 && (
                      <section className="space-y-3">
                        <header className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1d1d1f]">Apostila oficial</h3>
                          <span className="text-[11px] text-[#86868b] font-mono">{apostilaMatches.length}</span>
                        </header>
                        <div className="space-y-3">{apostilaMatches.map(renderCard)}</div>
                      </section>
                    )}
                    {quizMatches.length > 0 && (
                      <section className="space-y-3">
                        <header className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1d1d1f]">Questões de provas anteriores · com gabarito</h3>
                          <span className="text-[11px] text-[#86868b] font-mono">{quizMatches.length}</span>
                        </header>
                        <div className="space-y-3">{quizMatches.map(renderCard)}</div>
                      </section>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Continue estudando */}
          {structured?.questoes_relacionadas && structured.questoes_relacionadas.length > 0 && (
            <article className="bg-white rounded-3xl border border-[#d2d2d7] p-7">
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
                    <ChevronRight className="h-4 w-4 text-[#86868b] group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </article>
          )}

          <p className="text-[11px] text-[#86868b] text-center font-mono">
            CAS-PMERJ · 1.297 trechos indexados · resposta rastreável às fontes
          </p>
        </div>
      )}

      {/* Painel de "Resposta parcial" removido a pedido — apresentamos apenas as fontes encontradas. */}

      {!loading && searchState === "idle" && !answer && !structured && matches.length === 0 && (
        <div className="max-w-3xl mx-auto grid gap-5 md:grid-cols-2">
          <div className="bg-white rounded-3xl border border-[#d2d2d7] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#0071e3]" />
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#1d1d1f]">Sugestões para começar</div>
            </div>
            <ul className="space-y-1">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                    className="w-full text-left py-2 px-3 rounded-xl text-[13px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition flex items-center justify-between gap-2 group"
                  >
                    <span>{s}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#86868b] opacity-0 group-hover:opacity-100 transition" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl border border-[#d2d2d7] p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-[#1d1d1f]" />
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#1d1d1f]">Suas últimas buscas</div>
              {casUser && history.length > 0 && (
                <button
                  onClick={async () => { if (confirm("Limpar histórico de consultas?")) { await casAuthApi.historyClear(); setHistory([]); } }}
                  className="ml-auto text-[10px] uppercase tracking-wider text-[#86868b] hover:text-[#1d1d1f]"
                >Limpar</button>
              )}
            </div>
            {casUser ? (
              historyLoading ? (
                <p className="text-[13px] text-[#86868b] py-2">Carregando histórico…</p>
              ) : history.length === 0 ? (
                <p className="text-[13px] text-[#86868b] py-2">Você ainda não fez consultas. Pergunte algo e seu histórico aparecerá aqui.</p>
              ) : (
                <ul className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => { setQuery(h.query); inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="w-full text-left py-2 px-3 rounded-xl text-[13px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition flex items-start gap-2"
                      >
                        <Search className="h-3.5 w-3.5 text-[#86868b] mt-0.5 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{h.query}</span>
                          <span className="block text-[10px] text-[#86868b] mt-0.5 uppercase tracking-wider">
                            {new Date(h.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            {h.discipline ? ` · ${h.discipline}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : recent.length === 0 ? (
              <p className="text-[13px] text-[#86868b] py-2">Suas perguntas recentes aparecem aqui para revisão rápida.</p>
            ) : (
              <ul className="space-y-1">
                {recent.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                      className="w-full text-left py-2 px-3 rounded-xl text-[13px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition flex items-center gap-2"
                    >
                      <Search className="h-3.5 w-3.5 text-[#86868b]" />
                      <span className="truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-[#e8e8ed] grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] font-mono">20</div>
                <div className="text-[10px] uppercase tracking-wider text-[#86868b]">disciplinas</div>
              </div>
              <div>
                <div className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] font-mono">1.297</div>
                <div className="text-[10px] uppercase tracking-wider text-[#86868b]">trechos</div>
              </div>
              <div>
                <div className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] font-mono">479</div>
                <div className="text-[10px] uppercase tracking-wider text-[#86868b]">questões</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {metrics && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#d2d2d7] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#86868b]">Métricas do endpoint cas-search</div>
              <div className="text-[13px] text-[#1d1d1f] mt-1">Tempo, falhas, cache e fallback das últimas consultas.</div>
            </div>
            {metrics.hourly[0] && (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-[#f5f5f7] px-3 py-2"><div className="text-[15px] font-mono text-[#1d1d1f]">{metrics.hourly[0].avg_duration_ms || 0}ms</div><div className="text-[9px] uppercase text-[#86868b]">média</div></div>
                <div className="rounded-xl bg-[#f5f5f7] px-3 py-2"><div className="text-[15px] font-mono text-[#1d1d1f]">{metrics.hourly[0].failure_rate_pct || 0}%</div><div className="text-[9px] uppercase text-[#86868b]">falha</div></div>
                <div className="rounded-xl bg-[#f5f5f7] px-3 py-2"><div className="text-[15px] font-mono text-[#1d1d1f]">{metrics.hourly[0].fallback_uses || 0}</div><div className="text-[9px] uppercase text-[#86868b]">fallback</div></div>
                <div className="rounded-xl bg-[#f5f5f7] px-3 py-2"><div className="text-[15px] font-mono text-[#1d1d1f]">{metrics.hourly[0].cache_hits || 0}</div><div className="text-[9px] uppercase text-[#86868b]">cache</div></div>
              </div>
            )}
          </div>
          {metrics.logs.length > 0 && (
            <div className="divide-y divide-[#e8e8ed]">
              {metrics.logs.map((l) => (
                <div key={l.id} className="py-2 flex items-center justify-between gap-3 text-[11px] font-mono text-[#6e6e73]">
                  <span>{new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{l.duration_ms}ms</span>
                  <span className={cn("px-2 py-0.5 rounded-full", l.status === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{l.status}</span>
                  {l.external_status ? <span>HTTP {l.external_status}</span> : <span>local</span>}
                  <span>{l.cache_hit ? "cache" : l.fallback_used ? "fallback" : "direto"}</span>
                </div>
              ))}
            </div>
          )}
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
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded text-white",
                  openSource.match.source === "questoes" ? "bg-amber-600" : "bg-[#0071e3]",
                )}>
                  {openSource.match.source === "questoes" ? "Questões" : "Apostila"}
                </span>
                <button
                  onClick={() => { props.onOpenDiscipline(openSource.match.discipline); setOpenSource(null); }}
                  className="text-[14px] font-semibold uppercase tracking-wide text-[#1d1d1f] hover:text-[#0071e3]"
                >
                  {openSource.match.discipline}
                </button>
                <span className="text-[12px] text-[#86868b]">
                  {openSource.match.source === "questoes"
                    ? `${openSource.match.exam ?? "Prova oficial"} · Questão ${openSource.match.question_num ?? "?"}`
                    : `página ${openSource.match.page_start}${openSource.match.page_end !== openSource.match.page_start ? `–${openSource.match.page_end}` : ""}`}
                </span>
                <button
                  onClick={() => openSourceInPdf(openSource.match)}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[#0071e3] hover:underline"
                >
                  Abrir apostila <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto bg-[#f5f5f7] rounded-2xl p-5 space-y-3">
                {openSource.match.source === "questoes" && openSource.match.statement ? (
                  <>
                    <p className="text-[14px] leading-[1.7] text-[#1d1d1f] font-medium">
                      {openSource.match.statement}
                    </p>
                    {openSource.match.options && (
                      <ul className="space-y-1.5">
                        {(["A", "B", "C", "D"] as const).map((k) => (
                          <li
                            key={k}
                            className={cn(
                              "flex gap-2 px-3 py-2 rounded-lg text-[13px]",
                              openSource.match.correct_answer === k
                                ? "bg-emerald-100 text-emerald-900 font-medium"
                                : "bg-white text-[#1d1d1f]",
                            )}
                          >
                            <span className="font-mono font-semibold">{k})</span>
                            <span>{openSource.match.options![k]}</span>
                            {openSource.match.correct_answer === k && (
                              <span className="ml-auto text-[10px] uppercase tracking-wider">Gabarito</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] leading-[1.7] whitespace-pre-wrap text-[#1d1d1f]">
                    {openSource.match.content}
                  </p>
                )}
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

// ─────────────────────────────────────────────────────────────
// EAD: Sessão de estudo (questão + micro-lição da apostila)
// ─────────────────────────────────────────────────────────────
type StudyChunk = { id: number; discipline: string; page_start: number; page_end: number; content: string };

function StudyPanel() {
  const [step, setStep] = useState<"setup" | "session" | "done">("setup");
  const [discipline, setDiscipline] = useState<string>(""); // "" = misto
  const [sessionSize, setSessionSize] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ ok: 0, wrong: 0 });
  const [related, setRelated] = useState<StudyChunk[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("cas_quiz_questions").select("discipline");
      const c: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { c[r.discipline] = (c[r.discipline] ?? 0) + 1; });
      setCounts(c);
    })();
  }, []);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("cas_quiz_questions")
        .select("id,exam,discipline,statement,option_a,option_b,option_c,option_d,correct_answer");
      if (discipline) q = q.eq("discipline", discipline);
      const { data, error } = await q;
      if (error) throw error;
      const pool = (data ?? []) as QuizQuestion[];
      if (pool.length === 0) throw new Error("Nenhuma questão disponível para esta disciplina.");
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, sessionSize);
      setQueue(shuffled);
      setIdx(0);
      setPicked(null);
      setRevealed(false);
      setScore({ ok: 0, wrong: 0 });
      setStep("session");
      await loadRelated(shuffled[0]);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao iniciar sessão");
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated(q: QuizQuestion) {
    if (!q) return;
    setLoadingRelated(true);
    setRelated([]);
    try {
      // Extrai palavras-chave (>4 letras, sem stopwords óbvias)
      const stop = new Set(["sobre","quando","qual","quais","como","para","entre","pode","podem","deve","devem","seja","sejam","esta","este","essa","esse","aquele","aquela","mesmo","mesma","onde","ainda","então","pelas","pelos","pela","pelo","das","dos","uma","uns","umas","das","com","sem","por","que","não","sim","mais","menos","todo","toda","todos","todas"]);
      const words = q.statement
        .toLowerCase()
        .replace(/[^\p{L}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4 && !stop.has(w));
      const top = Array.from(new Set(words)).slice(0, 6).join(" ");
      const { data, error } = await supabase.rpc("search_cas_chunks_fts", {
        q: top || q.statement.slice(0, 80),
        match_count: 3,
        filter_discipline: q.discipline,
      });
      if (error) throw error;
      setRelated((data ?? []) as StudyChunk[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRelated(false);
    }
  }

  function choose(letter: "A" | "B" | "C" | "D") {
    if (revealed) return;
    setPicked(letter);
    setRevealed(true);
    const current = queue[idx];
    if (letter === current.correct_answer) setScore((s) => ({ ...s, ok: s.ok + 1 }));
    else setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
  }

  async function next() {
    if (idx + 1 >= queue.length) {
      setStep("done");
      return;
    }
    const ni = idx + 1;
    setIdx(ni);
    setPicked(null);
    setRevealed(false);
    await loadRelated(queue[ni]);
  }

  // ─── SETUP ───
  if (step === "setup") {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] text-[11px] uppercase tracking-wider text-[#6e6e73]">
            <GraduationCap className="h-3.5 w-3.5" /> EAD · Preparação para o simulado
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">Sessão de estudo</h2>
          <p className="text-[15px] text-[#6e6e73] max-w-xl mx-auto">
            Questão por questão com correção imediata e o trecho da apostila que ensina o tema. Aprenda fazendo.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#d2d2d7] p-8 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#86868b] mb-3">Disciplina</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDiscipline("")}
                className={cn(
                  "text-[12px] px-3 py-1.5 rounded-full transition",
                  discipline === "" ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
                )}
              >
                Misto (todas)
              </button>
              {DISCIPLINES.map((d) => {
                const n = counts[d] ?? 0;
                const disabled = n === 0;
                return (
                  <button
                    key={d}
                    onClick={() => !disabled && setDiscipline(d)}
                    disabled={disabled}
                    className={cn(
                      "text-[12px] px-3 py-1.5 rounded-full transition",
                      disabled && "opacity-40 cursor-not-allowed",
                      discipline === d ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
                    )}
                  >
                    {shortName(d)} {n > 0 && <span className="text-[10px] opacity-70">· {n}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#86868b] mb-3">Tamanho da sessão</div>
            <div className="flex gap-2">
              {[5, 10, 20, 40].map((n) => (
                <button
                  key={n}
                  onClick={() => setSessionSize(n)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-medium transition",
                    sessionSize === n ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]",
                  )}
                >
                  {n} questões
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[13px] text-red-600">{error}</p>}

          <Button
            onClick={startSession}
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#1d1d1f] hover:bg-[#0071e3] text-white text-[14px] font-medium"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Iniciar estudo</>}
          </Button>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (step === "done") {
    const total = queue.length;
    const pct = total > 0 ? Math.round((score.ok / total) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-[#1d1d1f] text-white rounded-3xl p-10 text-center">
          <div className="text-[11px] tracking-[0.2em] uppercase text-[#86868b] mb-2">Sessão concluída</div>
          <div className="text-[64px] font-semibold tracking-tight leading-none">{score.ok}/{total}</div>
          <div className="text-[14px] text-[#a1a1a6] mt-2">{pct}% de acerto</div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setStep("setup")} variant="outline" className="flex-1 rounded-full">Nova sessão</Button>
          <Button onClick={startSession} className="flex-1 rounded-full bg-[#0071e3] hover:bg-[#0077ed]">Repetir configuração</Button>
        </div>
      </div>
    );
  }

  // ─── SESSION ───
  const current = queue[idx];
  const opts: Array<["A" | "B" | "C" | "D", string]> = [
    ["A", current.option_a], ["B", current.option_b], ["C", current.option_c], ["D", current.option_d],
  ];
  const progress = ((idx + 1) / queue.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setStep("setup")} className="inline-flex items-center gap-1.5 text-[12px] text-[#6e6e73] hover:text-[#1d1d1f]">
          <ArrowLeft className="h-3.5 w-3.5" /> Sair
        </button>
        <div className="flex items-center gap-3 text-[12px] text-[#6e6e73]">
          <span className="text-emerald-600 font-semibold">✓ {score.ok}</span>
          <span className="text-red-500 font-semibold">✗ {score.wrong}</span>
          <span className="font-medium text-[#1d1d1f]">{idx + 1}/{queue.length}</span>
        </div>
      </div>
      <div className="h-1 bg-[#f5f5f7] rounded-full overflow-hidden">
        <div className="h-full bg-[#0071e3] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Questão */}
      <article className="bg-white rounded-3xl border border-[#d2d2d7] p-6 sm:p-8">
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b] mb-3">
          {shortName(current.discipline)} · {current.exam}
        </div>
        <p className="text-[16px] leading-[1.65] text-[#1d1d1f] mb-5 whitespace-pre-wrap">{current.statement}</p>
        <div className="space-y-2">
          {opts.map(([letter, text]) => {
            const isCorrect = revealed && letter === current.correct_answer;
            const isWrong = revealed && picked === letter && letter !== current.correct_answer;
            const isSelected = picked === letter;
            return (
              <button
                key={letter}
                onClick={() => choose(letter)}
                disabled={revealed}
                className={cn(
                  "w-full text-left flex gap-3 p-3 rounded-xl border transition text-[14px] leading-snug",
                  isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" :
                  isWrong ? "border-red-400 bg-red-50 text-red-900" :
                  isSelected ? "border-[#0071e3] bg-[#0071e3]/5" :
                  "border-[#d2d2d7] hover:border-[#86868b]",
                  revealed && "cursor-default",
                )}
              >
                <span className="font-semibold w-5 shrink-0">{letter})</span>
                <span className="flex-1">{text}</span>
                {isCorrect && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </article>

      {/* Explicação / micro-lição */}
      {revealed && (
        <article className="bg-[#f5f5f7] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#1d1d1f]" />
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#1d1d1f]">
              Estude este tema na apostila
            </div>
          </div>
          {loadingRelated ? (
            <div className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando trechos…
            </div>
          ) : related.length === 0 ? (
            <p className="text-[13px] text-[#6e6e73]">Sem trechos diretos — use a aba Pesquisar para aprofundar.</p>
          ) : (
            <div className="space-y-3">
              {related.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-[#d2d2d7] p-4">
                  <div className="text-[10px] uppercase tracking-wider text-[#86868b] mb-1.5">
                    {c.discipline} · p. {c.page_start}{c.page_end !== c.page_start ? `–${c.page_end}` : ""}
                  </div>
                  <p className="text-[13px] leading-[1.6] text-[#1d1d1f] whitespace-pre-wrap line-clamp-[8]">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {/* Ações */}
      <div className="flex justify-end">
        {revealed ? (
          <Button onClick={next} className="rounded-full bg-[#1d1d1f] hover:bg-[#0071e3] text-white">
            {idx + 1 >= queue.length ? "Ver resultado" : "Próxima questão"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <span className="text-[12px] text-[#86868b]">Escolha uma alternativa para revelar a resposta e a explicação.</span>
        )}
      </div>
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

// ─────────────────────────────────────────────────────────────
// Simulado: 40 questões aleatórias com gabarito no final
// ─────────────────────────────────────────────────────────────
function SimuladoPanel() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [submitted, setSubmitted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setAnswers({});
    try {
      // Busca um pool amplo e amostra 40 client-side respeitando proporção de disciplinas
      const { data, error } = await supabase
        .from("cas_quiz_questions")
        .select("id,exam,discipline,statement,option_a,option_b,option_c,option_d,correct_answer");
      if (error) throw error;
      const pool = (data ?? []) as QuizQuestion[];
      // Agrupa por disciplina e amostra proporcionalmente até 40
      const byDisc = new Map<string, QuizQuestion[]>();
      pool.forEach((q) => {
        const arr = byDisc.get(q.discipline) ?? [];
        arr.push(q);
        byDisc.set(q.discipline, arr);
      });
      const total = pool.length;
      const picks: QuizQuestion[] = [];
      byDisc.forEach((arr, _disc) => {
        const target = Math.max(1, Math.round((arr.length / total) * 40));
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        picks.push(...shuffled.slice(0, target));
      });
      // Ajusta para exatamente 40
      let final = picks.sort(() => Math.random() - 0.5);
      if (final.length > 40) final = final.slice(0, 40);
      while (final.length < 40 && pool.length > final.length) {
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (!final.find((q) => q.id === candidate.id)) final.push(candidate);
      }
      setQuestions(final);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar simulado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const acertos = questions.filter((q) => answers[q.id] === q.correct_answer).length;

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#6e6e73]">
        <Loader2 className="h-4 w-4 animate-spin" /> Montando simulado…
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  const respondidas = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">Simulado CAS</h2>
          <p className="text-[13px] text-[#6e6e73] mt-1">
            40 questões aleatórias misturando provas e anos, proporcionais às disciplinas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] text-[#6e6e73]">
            Respondidas <span className="font-semibold text-[#1d1d1f]">{respondidas}/40</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            Novo simulado
          </Button>
          {!submitted && (
            <Button size="sm" onClick={handleSubmit} disabled={respondidas === 0} className="rounded-full bg-[#0071e3] hover:bg-[#0077ed]">
              Finalizar e ver gabarito
            </Button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {submitted && (
        <div ref={resultsRef} className="bg-[#1d1d1f] text-white rounded-2xl p-6">
          <div className="text-[11px] tracking-[0.2em] uppercase text-[#86868b] mb-2">Resultado</div>
          <div className="flex items-baseline gap-3">
            <div className="text-[44px] font-semibold tracking-tight">{acertos}/40</div>
            <div className="text-[14px] text-[#a1a1a6]">
              {((acertos / 40) * 100).toFixed(0)}% de aproveitamento
            </div>
          </div>
        </div>
      )}

      {/* Questões */}
      <ol className="space-y-4">
        {questions.map((q, idx) => {
          const userAns = answers[q.id];
          const opts: Array<["A" | "B" | "C" | "D", string]> = [
            ["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d],
          ];
          return (
            <li key={q.id} className="bg-white rounded-2xl border border-[#d2d2d7] p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#86868b]">
                  Questão {idx + 1} · {shortName(q.discipline)} · {q.exam}
                </div>
                {submitted && (
                  <div className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    userAns === q.correct_answer ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                  )}>
                    {userAns === q.correct_answer ? "Correta" : userAns ? "Errada" : "Em branco"}
                  </div>
                )}
              </div>
              <p className="text-[15px] leading-[1.6] text-[#1d1d1f] mb-4 whitespace-pre-wrap">{q.statement}</p>
              <div className="space-y-2">
                {opts.map(([letter, text]) => {
                  const isCorrect = submitted && letter === q.correct_answer;
                  const isWrongPick = submitted && userAns === letter && letter !== q.correct_answer;
                  const isSelected = userAns === letter;
                  return (
                    <label
                      key={letter}
                      className={cn(
                        "flex gap-3 p-3 rounded-xl border cursor-pointer transition text-[14px] leading-snug",
                        isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" :
                        isWrongPick ? "border-red-400 bg-red-50 text-red-900" :
                        isSelected ? "border-[#0071e3] bg-[#0071e3]/5" :
                        "border-[#d2d2d7] hover:border-[#86868b]",
                        submitted && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={letter}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => setAnswers((p) => ({ ...p, [q.id]: letter }))}
                        className="mt-1"
                      />
                      <span className="font-semibold w-5">{letter})</span>
                      <span className="flex-1">{text}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={respondidas === 0} className="rounded-full bg-[#0071e3] hover:bg-[#0077ed]">
            Finalizar e ver gabarito
          </Button>
        </div>
      )}

      {/* Gabarito final */}
      {submitted && (
        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] mb-4">Gabarito</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {questions.map((q, idx) => {
              const userAns = answers[q.id];
              const ok = userAns === q.correct_answer;
              return (
                <div key={q.id} className={cn(
                  "rounded-lg border px-2 py-1.5 text-center",
                  ok ? "border-emerald-500 bg-emerald-50" :
                  userAns ? "border-red-400 bg-red-50" :
                  "border-[#d2d2d7] bg-[#f5f5f7]",
                )}>
                  <div className="text-[10px] text-[#6e6e73]">Q{idx + 1}</div>
                  <div className="text-[13px] font-semibold text-[#1d1d1f]">{q.correct_answer}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}