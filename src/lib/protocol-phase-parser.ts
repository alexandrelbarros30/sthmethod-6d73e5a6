// Parser de fases gamificadas a partir do conteúdo (HTML/texto) do protocolo.
// Detecta blocos delimitados por emoji-âncora e extrai campos estruturados.

export type PhaseStatus = "done" | "pending" | "unlocked" | "locked";

export const SMART_PROTOCOL_CUTOFF_MS = Date.UTC(2026, 4, 8, 16, 53, 0);

export interface ProtocolPhase {
  key: string;            // slug estável: "manha" | "almoco" | "pre-treino" | "noite" | "extra-N"
  emoji: string;          // emoji original
  title: string;          // ex: "MANHÃ"
  headline?: string;      // frase entre aspas
  action?: string;        // texto após "Ação:"
  stack?: string;         // texto após "Stack:"
  timing?: string;        // texto após "⏱"
  focus?: string;         // texto após "📌"
  rawStatus?: PhaseStatus;// status sugerido pelo emoji (✅⏳🔓🔒)
  flowLabel: string;      // microintera\u00e7\u00e3o textual
}

// Mapeamento emoji -> chave canônica
const PHASE_MAP: Array<{ rx: RegExp; key: string; flow: string }> = [
  { rx: /[\u{1F48A}\u{1F489}\u{1F9EC}\u{1F9EA}\u{2697}]/u, key: "medicamentos", flow: "Bio Stack Active" },
  { rx: /[\u2600\u{1F305}\u{1F31E}\u{1F31F}]/u, key: "manha",     flow: "Hormonal Flow Active" },
  { rx: /[\u{1F37D}\u{1F957}\u{1F374}\u{1F35C}]/u, key: "almoco", flow: "Cardio Shield On" },
  { rx: /[\u{1F375}\u2615\u{1F307}\u{1F306}]/u,   key: "tarde",  flow: "Stability Mode" },
  { rx: /[\u{1F3CB}\u{1F4AA}\u{1F525}]/u,         key: "pre-treino", flow: "Oxygen Carry +" },
  { rx: /[\u{1F9CB}\u{1F6BF}\u{1F4A7}\u{1F95B}]/u, key: "pos-treino", flow: "Recovery Window" },
  { rx: /[\u{1F319}\u{1F31B}\u{1F30C}]/u,         key: "noite",   flow: "Recovery Mode On" },
];

const TITLE_PHASE_MAP: Array<{ rx: RegExp; key: string; flow: string; title: string }> = [
  { rx: /^(medicamentos|horm[oô]nios|pept[ií]deos)\b/i, key: "medicamentos", flow: "Bio Stack Active", title: "MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS" },
  { rx: /^manh[ãa]\b/i, key: "manha", flow: "Hormonal Flow Active", title: "MANHÃ" },
  { rx: /^almo[çc]o\b/i, key: "almoco", flow: "Cardio Shield On", title: "ALMOÇO" },
  { rx: /^tarde\b/i, key: "tarde", flow: "Stability Mode", title: "TARDE" },
  { rx: /^pr[eé]\s*-?\s*treino\b/i, key: "pre-treino", flow: "Oxygen Carry +", title: "PRÉ-TREINO" },
  { rx: /^p[oó]s\s*-?\s*treino\b/i, key: "pos-treino", flow: "Recovery Window", title: "PÓS-TREINO" },
  { rx: /^noite\b/i, key: "noite", flow: "Recovery Mode On", title: "NOITE" },
];

const FALLBACK_EMOJI_BY_KEY: Record<string, string> = {
  medicamentos: "💊",
  manha: "☀️",
  almoco: "🍽️",
  tarde: "☕",
  "pre-treino": "🏋️",
  "pos-treino": "🧊",
  noite: "🌙",
};

const STATUS_MAP: Array<{ rx: RegExp; status: PhaseStatus }> = [
  { rx: /\u2705/u, status: "done" },
  { rx: /\u23F3/u, status: "pending" },
  { rx: /\u{1F513}/u, status: "unlocked" },
  { rx: /\u{1F512}/u, status: "locked" },
];

// Regex que captura QUALQUER emoji "âncora" suportado no início de uma linha (após trim),
// incluindo variação unicode do emoji e resíduos comuns do editor rico.
const ANCHOR_RX = /^[\s\-–—*•·([\]]*([\u2600\u{1F305}\u{1F31E}\u{1F31F}\u{1F37D}\u{1F957}\u{1F374}\u{1F35C}\u{1F3CB}\u{1F4AA}\u{1F525}\u{1F319}\u{1F31B}\u{1F30C}\u{1F48A}\u{1F489}\u{1F9EC}\u{1F9EA}\u2697])(?:\uFE0F)?\s*(.+)$/u;

function htmlToText(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined") {
    // SSR fallback: strip tags
    return input.replace(/<br\s*\/?>(?!\n)/gi, "\n").replace(/<\/(p|div|h[1-6]|li)>/gi, "\n").replace(/<[^>]+>/g, "");
  }
  const div = document.createElement("div");
  div.innerHTML = input
    .replace(/<br\s*\/?>(?!\n)/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "$&\n");
  return div.textContent || div.innerText || "";
}

function sanitizeLine(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function normalizeComparableText(input: string): string {
  return sanitizeLine(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectPhase(line: string): { key: string; emoji: string; flow: string; rest: string } | null {
  const normalizedLine = sanitizeLine(line);
  const m = normalizedLine.match(ANCHOR_RX);
  if (!m) return null;
  const emoji = m[1];
  const rest = m[2].replace(/^[\s\-–—*•·:|]+/, "").trim();
  for (const p of PHASE_MAP) {
    if (p.rx.test(emoji)) return { key: p.key, emoji, flow: p.flow, rest };
  }
  return { key: `extra-${emoji}`, emoji, flow: "Phase Unlocked", rest };
}

function detectPhaseByTitle(line: string): { key: string; emoji: string; flow: string; rest: string } | null {
  const rawLine = sanitizeLine(line).replace(/^[\-–—*•·:|\s]+/, "");
  const normalizedLine = normalizeComparableText(rawLine);
  for (const phase of TITLE_PHASE_MAP) {
    const match = normalizedLine.match(phase.rx);
    if (match) {
      return {
        key: phase.key,
        emoji: "",
        flow: phase.flow,
        rest: rawLine,
      };
    }
  }
  return null;
}

function detectStatus(line: string): PhaseStatus | undefined {
  for (const s of STATUS_MAP) if (s.rx.test(line)) return s.status;
  return undefined;
}

function stripStatus(s: string): string {
  return s.replace(/[\u2705\u23F3\u{1F513}\u{1F512}]/gu, "").trim();
}

function extractQuoted(line: string): string | undefined {
  const m = line.match(/[“"](.+?)[”"]/);
  return m?.[1]?.trim();
}

export function parseProtocolPhases(content: string): ProtocolPhase[] {
  const text = htmlToText(content || "").replace(/\r/g, "");
  if (!text.trim()) return [];
  const lines = text.split("\n").map((l) => sanitizeLine(l)).filter(Boolean);

  // Pré-processa: junta linhas que fazem parte de um headline com aspas multi-linha
  // preservando quebras como \n internas.
  const merged: string[] = [];
  let buffer: string | null = null;
  const openQuoteRx = /[“"]/;
  const closeQuoteRx = /[”"]/;
  for (const line of lines) {
    if (buffer !== null) {
      buffer += "\n" + line;
      if (closeQuoteRx.test(line)) {
        merged.push(buffer);
        buffer = null;
      }
      continue;
    }
    const opens = (line.match(/[“"]/g) || []).length;
    const closes = (line.match(/[”"]/g) || []).length;
    // Se abriu aspas mas não fechou na mesma linha, inicia buffer
    if (openQuoteRx.test(line) && opens + closes === 1) {
      buffer = line;
      continue;
    }
    merged.push(line);
  }
  if (buffer !== null) merged.push(buffer);

  const phases: ProtocolPhase[] = [];
  let current: ProtocolPhase | null = null;
  let usedKeys = new Set<string>();

  const pushCurrent = () => {
    if (!current) return;
    // Garante key única (admin pode repetir emoji)
    let k = current.key;
    let i = 2;
    while (usedKeys.has(k)) k = `${current.key}-${i++}`;
    current.key = k;
    usedKeys.add(k);
    phases.push(current);
    current = null;
  };

  for (const line of merged) {
    const phase = detectPhase(line) || detectPhaseByTitle(line);
    if (phase) {
      pushCurrent();
      const status = detectStatus(line);
      const titleRaw = stripStatus(phase.rest);
      current = {
        key: phase.key,
        emoji: phase.emoji || FALLBACK_EMOJI_BY_KEY[phase.key] || "✨",
        title: titleRaw.replace(/[:\-—]+\s*$/, "").trim(),
        rawStatus: status,
        flowLabel: phase.flow,
      };
      continue;
    }
    if (!current) continue;
    const quoted = extractQuoted(line);
    if (quoted && !current.headline) { current.headline = quoted; continue; }
    if (/^a[çc][aã]o\s*[:\-]/i.test(line))     { current.action = line.replace(/^a[çc][aã]o\s*[:\-]\s*/i, "").trim(); continue; }
    if (/^stack\s*[:\-]/i.test(line))           { current.stack  = line.replace(/^stack\s*[:\-]\s*/i, "").trim(); continue; }
    if (/^[\u23F1\u231A\u23F0]/u.test(line) || /^⏱/.test(line)) { current.timing = line.replace(/^[\u23F1\u231A\u23F0⏱]\s*/u, "").trim(); continue; }
    if (/^[\u{1F4CC}\u{1F4CD}\u{1F4DD}\u{1F3AF}]/u.test(line)) {
      const f = line.replace(/^[\u{1F4CC}\u{1F4CD}\u{1F4DD}\u{1F3AF}]\s*/u, "").replace(/^foco\s*[:\-]\s*/i, "").trim();
      current.focus = f;
      continue;
    }
    // Linha solta vira append no headline ou action
    if (!current.headline) current.headline = line;
    else if (!current.action) current.action = line;
  }
  pushCurrent();
  // Garantir que "MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS" sempre apareça no topo
  phases.sort((a, b) => {
    const am = a.key.startsWith("medicamentos") ? 0 : 1;
    const bm = b.key.startsWith("medicamentos") ? 0 : 1;
    return am - bm;
  });
  // Normaliza título do card de medicamentos para o padrão exigido
  for (const p of phases) {
    if (p.key.startsWith("medicamentos")) {
      p.title = "MEDICAMENTOS, HORMÔNIOS E PEPTÍDEOS";
    }
  }
  return phases;
}

export function hasSmartProtocolStructure(content: string): boolean {
  return parseProtocolPhases(content).length > 0;
}

export function isSmartProtocolEra(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const timestamp = new Date(createdAt).getTime();
  return Number.isFinite(timestamp) && timestamp >= SMART_PROTOCOL_CUTOFF_MS;
}