// Parser de fases gamificadas a partir do conteúdo (HTML/texto) do protocolo.
// Detecta blocos delimitados por emoji-âncora e extrai campos estruturados.

export type PhaseStatus = "done" | "pending" | "unlocked" | "locked";

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
const PHASE_MAP: Array<{ rx: RegExp; key: string; flow: string; emoji: string }> = [
  { rx: /[\u2600\u{1F305}\u{1F31E}\u{1F31F}]/u, key: "manha",     flow: "Hormonal Flow Active", emoji: "☀️" },
  { rx: /[\u{1F37D}\u{1F957}\u{1F374}\u{1F35C}]/u, key: "almoco", flow: "Cardio Shield On",     emoji: "🍽" },
  { rx: /[\u{1F3CB}\u{1F4AA}\u{1F525}]/u,         key: "pre-treino", flow: "Oxygen Carry +",    emoji: "🏋️" },
  { rx: /[\u{1F319}\u{1F31B}\u{1F30C}]/u,         key: "noite",   flow: "Recovery Mode On",     emoji: "🌙" },
];

// Fallback por palavra-chave quando o admin esquece o emoji-âncora.
const KEYWORD_MAP: Array<{ rx: RegExp; key: string; flow: string; emoji: string; title: string }> = [
  { rx: /^(manh[ãa]|manha)\b/i,                    key: "manha",      flow: "Hormonal Flow Active", emoji: "☀️", title: "MANHÃ" },
  { rx: /^(almo[çc]o)\b/i,                         key: "almoco",     flow: "Cardio Shield On",     emoji: "🍽",  title: "ALMOÇO" },
  { rx: /^(pr[ée]\s*[-\s]?\s*treino|pre\s*treino)\b/i, key: "pre-treino", flow: "Oxygen Carry +",   emoji: "🏋️", title: "PRÉ-TREINO" },
  { rx: /^(noite|notte)\b/i,                       key: "noite",      flow: "Recovery Mode On",     emoji: "🌙", title: "NOITE" },
];

const STATUS_MAP: Array<{ rx: RegExp; status: PhaseStatus }> = [
  { rx: /\u2705/u, status: "done" },
  { rx: /\u23F3/u, status: "pending" },
  { rx: /\u{1F513}/u, status: "unlocked" },
  { rx: /\u{1F512}/u, status: "locked" },
];

// Regex que captura QUALQUER emoji "âncora" suportado no início de uma linha (após trim)
const ANCHOR_RX = /^([\u2600\u{1F305}\u{1F31E}\u{1F31F}\u{1F37D}\u{1F957}\u{1F374}\u{1F35C}\u{1F3CB}\u{1F4AA}\u{1F525}\u{1F319}\u{1F31B}\u{1F30C}])\s*(.+)$/u;

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

function detectPhase(line: string): { key: string; emoji: string; flow: string; rest: string } | null {
  const m = line.trim().match(ANCHOR_RX);
  if (m) {
    const emoji = m[1];
    const rest = m[2];
    for (const p of PHASE_MAP) {
      if (p.rx.test(emoji)) return { key: p.key, emoji, flow: p.flow, rest };
    }
    return { key: `extra-${emoji}`, emoji, flow: "Phase Unlocked", rest };
  }
  // Fallback por palavra-chave (linha começa com MANHÃ/ALMOÇO/PRÉ-TREINO/NOITE)
  const trimmed = line.trim();
  for (const k of KEYWORD_MAP) {
    if (k.rx.test(trimmed)) {
      return { key: k.key, emoji: k.emoji, flow: k.flow, rest: trimmed };
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
  const lines = text.split("\n").map((l) => l.replace(/\u00A0/g, " ").trim()).filter(Boolean);

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

  for (const line of lines) {
    const phase = detectPhase(line);
    if (phase) {
      pushCurrent();
      const status = detectStatus(line);
      const titleRaw = stripStatus(phase.rest);
      current = {
        key: phase.key,
        emoji: phase.emoji,
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
  return phases;
}