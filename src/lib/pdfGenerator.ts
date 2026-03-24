import jsPDF from 'jspdf';

interface StudentInfo {
  name: string;
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

// Strip "Refeição N" prefix, keep only descriptive name
const cleanMealName = (line: string): string => {
  // Remove "REFEIÇÃO 1 -", "REFEIÇÃO 2:", "Refeição Extra" etc
  let cleaned = line.replace(/^#+\s*/, '').trim();
  // Match "REFEIÇÃO N" or "REFEICAO N" followed by optional separator and descriptive name
  const refeicaoMatch = cleaned.match(/^refei[cç][ãa]o\s*(\d+|extra)\s*[-–:]\s*(.+)$/i);
  if (refeicaoMatch && refeicaoMatch[2]) {
    return refeicaoMatch[2].trim().toUpperCase();
  }
  // If it's just "REFEIÇÃO N" without descriptive name, map to default
  const justNumber = cleaned.match(/^refei[cç][ãa]o\s*(\d+|extra)\s*$/i);
  if (justNumber) {
    const num = justNumber[1].toLowerCase();
    if (num === 'extra') return 'REFEIÇÃO EXTRA';
    const defaults: Record<string, string> = {
      '1': 'CAFÉ DA MANHÃ', '2': 'LANCHE DA MANHÃ', '3': 'ALMOÇO',
      '4': 'LANCHE DA TARDE', '5': 'JANTAR', '6': 'CEIA',
    };
    return defaults[num] || `REFEIÇÃO ${num}`;
  }
  return cleaned;
};

// Meal header colors (muted, elegant tones)
const MEAL_COLORS: string[] = [
  '#16a34a', // green
  '#0d9488', // teal
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#ea580c', // orange
  '#64748b', // slate
];

export const generateStudentPDF = async (options: PDFContentOptions): Promise<Blob> => {
  const { type, title, content, studentInfo, createdAt } = options;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primary = '#16a34a';
  const dark = '#1f2937';
  const muted = '#6b7280';
  const ml = 18; // margin left
  const mr = 18;
  const pw = 210;
  const cw = pw - ml - mr;
  const lh = 4.8; // line height for size 11
  const bottomLimit = 276;

  let y = 16;
  let mealIndex = 0;

  const ensurePage = (need: number = lh) => {
    if (y + need > bottomLimit) { pdf.addPage(); y = 16; }
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  // --- Logo ---
  try {
    const logoImg = await loadImage('/sth-logo.jpeg');
    const logoH = 24;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    const logoX = (pw - logoW) / 2;
    pdf.addImage(logoImg, 'JPEG', logoX, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(primary);
    pdf.text('STH', ml, y + 6);
    pdf.setFontSize(9);
    pdf.setFont('times', 'normal');
    pdf.text('performance | saúde | consultoria', ml + 18, y + 6);
    y += 14;
  }

  // --- Thin separator ---
  pdf.setDrawColor(primary);
  pdf.setLineWidth(0.4);
  pdf.line(ml, y, pw - mr, y);
  y += 6;

  // --- Student info block ---
  const infoItems: { label: string; value: string }[] = [
    { label: 'Nome', value: studentInfo.name },
  ];
  if (studentInfo.age) infoItems.push({ label: 'Idade', value: `${studentInfo.age} anos` });
  if (studentInfo.weight && studentInfo.height)
    infoItems.push({ label: 'Peso / Altura', value: `${studentInfo.weight} kg / ${studentInfo.height} m` });
  if (studentInfo.goal) infoItems.push({ label: 'Objetivo', value: studentInfo.goal });
  infoItems.push({ label: 'Data de Início', value: studentInfo.startDate || new Date(createdAt).toLocaleDateString('pt-BR') });
  if (studentInfo.hydration) infoItems.push({ label: 'Hidratação', value: studentInfo.hydration });

  const macros: string[] = [];
  if (studentInfo.energyTotal) macros.push(`Energia: ${studentInfo.energyTotal}`);
  if (studentInfo.carbsTotal) macros.push(`Carb: ${studentInfo.carbsTotal}`);
  if (studentInfo.proteinTotal) macros.push(`Prot: ${studentInfo.proteinTotal}`);
  if (studentInfo.fatTotal) macros.push(`Lip: ${studentInfo.fatTotal}`);

  const infoBlockH = infoItems.length * 5 + (macros.length ? 7 : 0) + 6;
  pdf.setFillColor(240, 253, 244);
  pdf.roundedRect(ml, y - 2, cw, infoBlockH, 2, 2, 'F');

  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);

  infoItems.forEach(({ label, value }) => {
    pdf.setTextColor(muted);
    pdf.text(`${label}:`, ml + 4, y + 2);
    pdf.setTextColor(dark);
    pdf.setFont('times', 'bold');
    const labelW = pdf.getTextWidth(`${label}: `);
    pdf.text(value, ml + 4 + labelW, y + 2);
    pdf.setFont('times', 'normal');
    y += 5;
  });

  if (macros.length) {
    y += 2;
    pdf.setFontSize(9);
    pdf.setTextColor(primary);
    pdf.setFont('times', 'bold');
    pdf.text(macros.join('   |   '), ml + 4, y + 2);
    pdf.setFont('times', 'normal');
    y += 5;
  }

  y += 8;

  // --- Document title ---
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(primary);
  const docTitle = type === 'diet' ? 'ROTINA ALIMENTAR' : title.toUpperCase();
  pdf.text(docTitle, pw / 2, y, { align: 'center' });
  y += 8;

  pdf.setDrawColor(primary);
  pdf.setLineWidth(0.3);
  pdf.line(ml, y, pw - mr, y);
  y += 6;

  // --- Content ---
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(dark);

  const lines = content.split('\n');
  let itemInMeal = 0;

  const isMealHeading = (line: string) => {
    return /^(#+\s*)?(refei[cç][ãa]o\s*(\d+|extra)|caf[eé]\s*da\s*manh[ãa]|lanche|almo[cç]o|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino)/i.test(line.trim());
  };

  const isSectionTitle = (line: string) => {
    return /^(ROTINA\s*ALIMENTAR|PLANO\s*ALIMENTAR|DIETA)\b/i.test(line.trim());
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      y += lh * 0.4;
      continue;
    }

    if (isSectionTitle(trimmed)) continue; // skip, we already have the title

    if (isMealHeading(trimmed)) {
      // Double space before meal (except first)
      if (mealIndex > 0) {
        // Zebra separator line
        ensurePage(lh * 3);
        y += lh;
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.15);
        pdf.line(ml, y, pw - mr, y);
        y += lh;
      }

      ensurePage(lh * 2);
      const mealName = cleanMealName(trimmed);
      const color = hexToRgb(MEAL_COLORS[mealIndex % MEAL_COLORS.length]);

      // Colored left accent bar + meal name
      pdf.setFillColor(color.r, color.g, color.b);
      pdf.rect(ml, y - 3, 1.5, 5, 'F');

      pdf.setFont('times', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(color.r, color.g, color.b);
      pdf.text(mealName, ml + 5, y);

      y += lh + 2;
      itemInMeal = 0;
      mealIndex++;
      continue;
    }

    // Regular food line
    ensurePage();
    const cleanLine = trimmed.replace(/^[•\-*]\s*/, '');
    const isNote = cleanLine.startsWith('(') && cleanLine.endsWith(')');

    // Subtle zebra row background for alternating items
    if (!isNote && itemInMeal % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(ml, y - 3.2, cw, lh + 0.4, 'F');
    }

    pdf.setFont('times', isNote ? 'italic' : 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(isNote ? muted : dark);

    const prefix = isNote ? '' : '  · ';
    const textLines = pdf.splitTextToSize(prefix + cleanLine, cw - 4);
    textLines.forEach((tl: string) => {
      ensurePage();
      pdf.text(tl, ml + 2, y);
      y += lh;
    });

    if (!isNote) itemInMeal++;
  }

  // --- Footer on all pages ---
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(muted);
    const footer = `Gerado em ${new Date().toLocaleDateString('pt-BR')} — Página ${p} de ${totalPages}`;
    pdf.text(footer, pw - mr, 287, { align: 'right' });
    pdf.setDrawColor(primary);
    pdf.setLineWidth(0.2);
    pdf.line(ml, 284, pw - mr, 284);
  }

  return pdf.output('blob');
};

export const canDownloadPDF = (planName?: string): boolean => {
  return false;
};
