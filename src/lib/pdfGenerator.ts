import jsPDF from 'jspdf';
import { parseProtocolPhases, type ProtocolPhase } from './protocol-phase-parser';

interface StudentInfo {
  name: string;
  cpf?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  startDate?: string;
  hydration?: string;
  energyTotal?: string;
  carbsTotal?: string;
  proteinTotal?: string;
  fatTotal?: string;
}

interface PDFContentOptions {
  type: 'diet' | 'protocol';
  title: string;
  content: string;
  studentInfo: StudentInfo;
  createdAt: string;
  logoUrl?: string;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Keep meal label as "REFEIÇÃO N" or "REFEIÇÃO EXTRA"
const cleanMealName = (line: string): string => {
  let cleaned = line.replace(/^#+\s*/, '').trim();
  const refeicaoMatch = cleaned.match(/^(refei[cç][ãa]o\s*(?:\d+|extra))\s*[-–:].*/i);
  if (refeicaoMatch) return refeicaoMatch[1].trim().toUpperCase();
  const justNumber = cleaned.match(/^refei[cç][ãa]o\s*(\d+|extra)\s*$/i);
  if (justNumber) return `REFEIÇÃO ${justNumber[1].toUpperCase()}`;
  const descMap: [RegExp, string][] = [
    [/^caf[eé]\s*da\s*manh[ãa]/i, 'REFEIÇÃO 1'],
    [/^lanche\s*da\s*manh[ãa]/i, 'REFEIÇÃO 2'],
    [/^almo[cç]o/i, 'REFEIÇÃO 3'],
    [/^lanche\s*da\s*tarde/i, 'REFEIÇÃO 4'],
    [/^lanche/i, 'REFEIÇÃO 2'],
    [/^jantar/i, 'REFEIÇÃO 5'],
    [/^ceia/i, 'REFEIÇÃO 6'],
    [/^pr[eé][- ]?treino/i, 'PRÉ-TREINO'],
    [/^p[oó]s[- ]?treino/i, 'PÓS-TREINO'],
  ];
  for (const [re, label] of descMap) {
    if (re.test(cleaned)) return label;
  }
  return cleaned.toUpperCase();
};

const isMealHeading = (line: string) =>
  /^(#+\s*)?(refei[cç][ãa]o\s*(\d+|extra)|caf[eé]\s*da\s*manh[ãa]|lanche|almo[cç]o|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino)/i.test(line.trim());

const isSectionTitle = (line: string) =>
  /^(ROTINA\s*ALIMENTAR|PLANO\s*ALIMENTAR|DIETA)\b/i.test(line.trim());

// ---------------- HTML parsing for faithful screen-like rendering ----------------

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z0-9#]+;/gi, " ");

const stripInlineTags = (html: string) =>
  decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();

type HtmlBlock =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

/** Extract structured blocks from a meal HTML chunk. */
const parseMealHtml = (html: string): HtmlBlock[] => {
  const blocks: HtmlBlock[] = [];
  // Unwrap nested lists inside <li> so siblings don't get swallowed.
  // We must PRESERVE any text/inline content that appears in the parent <li>
  // BEFORE the nested list (this is the "base"/"alimentação principal" item).
  // Strategy: wrap the leading text in <p>...</p> so the main blockRe captures it,
  // then keep the nested list as its own block.
  let normalized = html;
  for (let i = 0; i < 3; i++) {
    const before = normalized;
    normalized = normalized.replace(
      /<li\b[^>]*>([\s\S]*?)(<(?:ol|ul)\b[\s\S]*?<\/(?:ol|ul)>)([\s\S]*?)<\/li>/gi,
      (_full, pre: string, nested: string, post: string) => {
        const preTrim = pre.replace(/\s+/g, " ").trim();
        const postTrim = post.replace(/\s+/g, " ").trim();
        const preBlock = preTrim ? `<p>${preTrim}</p>` : "";
        const postBlock = postTrim ? `<p>${postTrim}</p>` : "";
        return `${preBlock}${nested}${postBlock}`;
      }
    );
    if (normalized === before) break;
  }

  const blockRe = /<(h[1-6]|ul|ol|p|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(normalized)) !== null) {
    const tag = m[1].toLowerCase();
    const inner = m[3];
    if (/^h[1-6]$/.test(tag)) {
      const text = stripInlineTags(inner);
      if (text) blocks.push({ kind: "heading", text });
    } else if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let liM: RegExpExecArray | null;
      while ((liM = liRe.exec(inner)) !== null) {
        // Skip <li>s that contain nested lists (they are unwrapped above)
        if (/<(ol|ul)\b/i.test(liM[1])) continue;
        const t = stripInlineTags(liM[1]);
        if (!t) continue;
        if (/^\s*(alimentos|substitui[cç][õo]es|op[cç][õo]es)\s*[:\-–]?\s*$/i.test(t)) continue;
        items.push(t);
      }
      if (items.length) blocks.push({ kind: tag === "ol" ? "ol" : "ul", items });
    } else {
      // p / div — split lines
      const text = stripInlineTags(inner);
      if (!text) continue;
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((line) => {
          if (/^(alimenta[cç][ãa]o\s+(principal|base)|op[cç][õo]es|substitui[cç][õo]es|notas|observa[cç][õo]es)\b/i.test(line)) {
            blocks.push({ kind: "heading", text: line });
          } else {
            blocks.push({ kind: "para", text: line });
          }
        });
    }
  }
  return blocks;
};

// Quantity+unit regex for bolding
const QTY_RE = /(\d+[.,\/]?\d*)\s*(g|gr|grama|gramas|kg|mg|mcg|ml|l|litro|litros|un|und|unidade|unidades|colher|colheres|xícara|xícaras|fatia|fatias|cápsula|cápsulas|cap|caps|scoop|scoops|dose|doses|gota|gotas|pedaço|pedaços|pote|potes|copo|copos|ovo|ovos|clara|claras|barra|barras|tablete|tabletes|lata|latas|sachê|saches|porção|porções)\b/gi;

/**
 * Renders a line with bold quantities and "ou" segments.
 * Uses jsPDF text drawing with font toggling.
 */
function renderFormattedLine(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  dark: string,
): number {
  // Split by "ou" to handle bold segments around quantities
  // We'll parse and render inline: bold for qty+unit, normal for rest
  pdf.setFontSize(fontSize);

  // Tokenize: split into segments of (normal text | qty+unit)
  const tokens: { text: string; bold: boolean }[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(QTY_RE.source, 'gi');

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ text: text.slice(lastIdx, match.index), bold: false });
    }
    tokens.push({ text: match[0], bold: true });
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) {
    tokens.push({ text: text.slice(lastIdx), bold: false });
  }
  if (tokens.length === 0) tokens.push({ text, bold: false });

  // Simple approach: render as full line with splitTextToSize, using bold for entire line if it has quantities
  // For proper inline bold, we'd need character-level positioning. 
  // Instead, use jsPDF's approach of rendering full text blocks.
  // The model uses justified text with bold quantities inline — we'll approximate by rendering the full line.
  
  // For simplicity and faithful reproduction, render the whole line as normal text
  // but if a line is mostly a quantity description, render bold.
  const hasBoldContent = tokens.some(t => t.bold);
  
  // Check if line starts with quantity (like "150g BATATA...") 
  const startsWithQty = /^\d/.test(text.trim());
  
  // Check for parenthetical notes
  const isNote = text.trim().startsWith('(') && text.trim().endsWith(')');
  
  if (isNote) {
    pdf.setFont('times', 'bolditalic');
  } else {
    pdf.setFont('times', 'normal');
  }
  
  pdf.setTextColor(dark);
  
  const wrapped = pdf.splitTextToSize(text, maxWidth);
  let totalH = 0;
  const lineH = fontSize * 0.45; // ~mm per line at this font size
  
  for (const wl of wrapped) {
    pdf.text(wl, x, y + totalH, { align: 'justify', maxWidth });
    totalH += lineH;
  }
  
  return totalH;
}

export const generateStudentPDF = async (options: PDFContentOptions): Promise<Blob> => {
  const { type, title, content, studentInfo, createdAt } = options;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const dark = '#1f2937';
  const black = '#000000';
  const ml = 25; // margin left (matching DOCX ~2.5cm)
  const mr = 25;
  const pw = 210;
  const cw = pw - ml - mr;
  const fontSize = 12; // Times 12pt like the model
  const lineH = 5.5; // line height for 12pt
  const bottomLimit = 275;

  let y = 18;

  const ensurePage = (need: number = lineH) => {
    if (y + need > bottomLimit) { pdf.addPage(); y = 18; }
  };

  // --- Logo centered at top ---
  try {
    const logoImg = await loadImage('/sth-logo.jpeg');
    const logoH = 22;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    const logoX = (pw - logoW) / 2;
    pdf.addImage(logoImg, 'JPEG', logoX, y, logoW, logoH);
    y += logoH + 10;
  } catch {
    // Fallback text logo
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(black);
    pdf.text('MÉTODO', pw / 2, y + 8, { align: 'center' });
    y += 18;
  }

  // --- Student info block (plain text, bold labels) ---
  pdf.setFontSize(fontSize);

  const infoLines: { label: string; value: string }[] = [];
  infoLines.push({ label: 'Nome', value: studentInfo.name.toUpperCase() });
  if (studentInfo.age) infoLines.push({ label: 'Idade', value: `${studentInfo.age} anos` });
  if (studentInfo.weight && studentInfo.height) {
    const heightM = studentInfo.height >= 100 ? (studentInfo.height / 100).toFixed(2) : String(studentInfo.height);
    infoLines.push({ label: 'Peso / Altura', value: `${studentInfo.weight} kg / ${heightM} m` });
  }
  if (studentInfo.goal) infoLines.push({ label: 'Objetivo', value: studentInfo.goal });
  infoLines.push({ label: 'Data de Início', value: studentInfo.startDate || new Date(createdAt).toLocaleDateString('pt-BR') });
  if (studentInfo.hydration) infoLines.push({ label: 'Hidratação', value: studentInfo.hydration });
  if (studentInfo.energyTotal) infoLines.push({ label: 'Energia total', value: studentInfo.energyTotal });
  if (studentInfo.carbsTotal) infoLines.push({ label: 'Carboidratos', value: `~${studentInfo.carbsTotal.replace(/^~/, '')}` });
  if (studentInfo.proteinTotal) infoLines.push({ label: 'Proteína', value: `~${studentInfo.proteinTotal.replace(/^~/, '')}` });
  if (studentInfo.fatTotal) infoLines.push({ label: 'Lipídios', value: `~${studentInfo.fatTotal.replace(/^~/, '')}` });

  for (const { label, value } of infoLines) {
    ensurePage();
    pdf.setFont('times', 'bold');
    pdf.setTextColor(black);
    pdf.text(`${label}: `, ml, y);
    const labelW = pdf.getTextWidth(`${label}: `);
    pdf.setFont('times', 'normal');
    pdf.text(value, ml + labelW, y);
    y += lineH;
  }

  y += 8;

  // --- Thin separator line ---
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(ml + 10, y, pw - mr - 10, y);
  y += 6;

  // --- "ROTINA ALIMENTAR" centered bold title ---
  if (type === 'diet') {
    ensurePage(lineH * 2);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(black);
    pdf.text('ROTINA ALIMENTAR', pw / 2, y, { align: 'center' });
    y += 10;
  } else {
    ensurePage(lineH * 2);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(black);
    pdf.text('PROTOCOLO', pw / 2, y, { align: 'center' });
    y += 10;
  }

  // --- Content lines ---
  pdf.setFontSize(fontSize);
  pdf.setTextColor(black);

  const lines = content.split('\n');

  // Helper renderers shared across modes
  const renderSubHeading = (text: string) => {
    ensurePage(lineH * 2);
    y += lineH * 0.4;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(black);
    const wrapped = pdf.splitTextToSize(text, cw);
    for (const wl of wrapped) {
      ensurePage();
      pdf.text(wl, ml, y);
      y += lineH;
    }
    y += 1;
  };

  const renderBodyLine = (text: string, indent = 0) => {
    ensurePage();
    const isNote = text.startsWith('(') && text.endsWith(')');
    pdf.setFont('times', isNote ? 'bolditalic' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(black);
    const wrapped = pdf.splitTextToSize(text, cw - indent);
    for (const wl of wrapped) {
      ensurePage();
      pdf.text(wl, ml + indent, y);
      y += lineH;
    }
  };

  // ---------------- PROTOCOL: render as phases (same style as REFEIÇÃO) ----------------
  if (type === 'protocol') {
    const phases = parseProtocolPhases(content);

    const renderPhaseHeading = (titleText: string) => {
      y += lineH * 1.5;
      ensurePage(lineH * 2);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(black);
      const upper = titleText.toUpperCase();
      pdf.text(upper, ml, y);
      const tw = pdf.getTextWidth(upper);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.4);
      pdf.line(ml, y + 1, ml + tw, y + 1);
      y += lineH + 3;
    };

    const renderPhase = (p: ProtocolPhase, skipBody = false) => {
      renderPhaseHeading(p.title || p.key);
      if (skipBody) return;
      if (p.headline) {
        const hl = p.headline.replace(/[“”]/g, '"');
        const text = hl.startsWith('"') ? hl : `"${hl}"`;
        pdf.setFont('times', 'italic');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(black);
        const wrapped = pdf.splitTextToSize(text, cw);
        for (const wl of wrapped) { ensurePage(); pdf.text(wl, ml, y); y += lineH; }
        y += 1;
      }
      const fields: { label: string; value?: string }[] = [
        { label: 'Ação', value: p.action },
        { label: 'Stack', value: p.stack },
        { label: 'Timing', value: p.timing },
        { label: 'Foco', value: p.focus },
      ];
      for (const f of fields) {
        if (!f.value) continue;
        ensurePage();
        pdf.setFont('times', 'bold');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(black);
        pdf.text(`${f.label}: `, ml, y);
        const lw = pdf.getTextWidth(`${f.label}: `);
        pdf.setFont('times', 'normal');
        const wrapped = pdf.splitTextToSize(f.value, cw - lw);
        wrapped.forEach((wl: string, idx: number) => {
          if (idx > 0) { y += lineH; ensurePage(); }
          pdf.text(wl, ml + (idx === 0 ? lw : 0), y);
        });
        y += lineH;
      }
    };

    if (phases.length > 0) {
      for (const p of phases) {
        const hasSub = !!p.subWeeks?.length;
        renderPhase(p, hasSub);
        if (hasSub) {
          for (const sw of p.subWeeks) renderPhase(sw);
        }
      }
    } else {
      // Fallback: render plain text content
      const plain = content.replace(/<br\s*\/?>(?!\n)/gi, '\n').replace(/<\/(p|div|h[1-6]|li)>/gi, '\n').replace(/<[^>]+>/g, '').split('\n');
      for (const raw of plain) {
        const t = raw.trim();
        if (!t) { y += lineH * 0.5; continue; }
        renderBodyLine(t);
      }
    }

    // Footer + return early to skip diet loop
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont('times', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor('#6b7280');
      const footer = `Gerado em ${new Date().toLocaleDateString('pt-BR')} — Página ${p} de ${totalPages}`;
      pdf.text(footer, pw - mr, 287, { align: 'right' });
    }
    return pdf.output('blob');
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      y += lineH * 0.5;
      continue;
    }

    if (isSectionTitle(trimmed)) continue;

    // ----- Structured HTML block from screen -----
    if (trimmed === '__HTML_BLOCK_START__') {
      const buf: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '__HTML_BLOCK_END__') {
        buf.push(lines[i]);
        i++;
      }
      const html = buf.join('\n');
      const blocks = parseMealHtml(html);
      for (const b of blocks) {
        if (b.kind === 'heading') {
          renderSubHeading(b.text);
        } else if (b.kind === 'para') {
          renderBodyLine(b.text);
          y += 1;
        } else if (b.kind === 'ul') {
          for (const it of b.items) {
            renderBodyLine(`• ${it}`, 4);
            y += 0.5;
          }
        } else if (b.kind === 'ol') {
          b.items.forEach((it, idx) => {
            renderBodyLine(`${idx + 1}. ${it}`, 4);
            y += 0.5;
          });
        }
      }
      continue;
    }

    if (isMealHeading(trimmed)) {
      // Extra spacing before meal heading
      y += lineH * 1.5;
      ensurePage(lineH * 2);

      const mealName = cleanMealName(trimmed);

      // Bold + underlined meal heading (matching model)
      pdf.setFont('times', 'bold');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(black);
      pdf.text(mealName, ml, y);

      // Underline
      const textW = pdf.getTextWidth(mealName);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.4);
      pdf.line(ml, y + 1, ml + textW, y + 1);

      y += lineH + 3;
      continue;
    }

    // Regular food line
    ensurePage();
    let cleanLine = trimmed.replace(/^[•\-*]\s*/, '');
    // Remove duplicate leading quantity
    cleanLine = cleanLine.replace(/^([\d.,\/]+\s*(?:g|gr|kg|mg|ml|l|un|und|colher|colheres|xícara|xícaras|fatia|fatias|cápsula|cápsulas|cap|caps|scoop|scoops|dose|doses|gota|gotas|pedaço|pedaços|pote|potes|copo|copos|ovo|ovos|clara|claras|barra|barras|tablete|tabletes|lata|latas|sachê|saches|porção|porções|unidade|unidades)\b)\s+\1/i, '$1');

    const isNote = cleanLine.startsWith('(') && cleanLine.endsWith(')');

    if (isNote) {
      pdf.setFont('times', 'bolditalic');
    } else {
      pdf.setFont('times', 'normal');
    }
    pdf.setFontSize(fontSize);
    pdf.setTextColor(black);

    const wrapped = pdf.splitTextToSize(cleanLine, cw);
    for (const wl of wrapped) {
      ensurePage();
      pdf.text(wl, ml, y);
      y += lineH;
    }
    // Small spacing between food items
    y += 1;
  }

  // --- Footer on all pages ---
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor('#6b7280');
    const footer = `Gerado em ${new Date().toLocaleDateString('pt-BR')} — Página ${p} de ${totalPages}`;
    pdf.text(footer, pw - mr, 287, { align: 'right' });
  }

  return pdf.output('blob');
};

export const canDownloadPDF = (planName?: string): boolean => {
  // Permite download para qualquer plano ativo (todos os planos STH são pagos)
  return !!planName && planName.trim().length > 0 && planName.toLowerCase() !== "free";
};
