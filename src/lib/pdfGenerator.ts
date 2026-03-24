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

export const generateStudentPDF = async (options: PDFContentOptions): Promise<Blob> => {
  const { type, title, content, studentInfo, createdAt } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors matching template
  const primaryColor = '#16a34a';
  const darkText = '#1f2937';
  const lightText = '#6b7280';
  const headerBg = '#f0fdf4';

  const marginLeft = 15;
  const marginTop = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginLeft * 2);

  let currentY = marginTop;

  // --- Logo ---
  try {
    const logoImg = await loadImage('/sth-logo.jpeg');
    const logoH = 28;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    const logoX = (pageWidth - logoW) / 2;
    pdf.addImage(logoImg, 'JPEG', logoX, currentY, logoW, logoH);
    currentY += logoH + 8;
  } catch {
    // fallback text header
    pdf.setFontSize(22);
    pdf.setTextColor(primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STH', marginLeft, currentY + 8);
    pdf.setFontSize(10);
    pdf.text('performance | saúde | consultoria', marginLeft + 25, currentY + 8);
    currentY += 20;
  }

  // --- Separator line ---
  pdf.setDrawColor(primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 8;

  // --- Student info block with background ---
  const infoStartY = currentY;
  const infoLines: { label: string; value: string }[] = [
    { label: 'Nome', value: studentInfo.name },
  ];
  if (studentInfo.age) infoLines.push({ label: 'Idade', value: `${studentInfo.age} anos` });
  if (studentInfo.weight && studentInfo.height)
    infoLines.push({ label: 'Peso / Altura', value: `${studentInfo.weight} kg / ${studentInfo.height} m` });
  if (studentInfo.goal) infoLines.push({ label: 'Objetivo', value: studentInfo.goal });
  infoLines.push({ label: 'Data de Início', value: studentInfo.startDate || new Date(createdAt).toLocaleDateString('pt-BR') });
  if (studentInfo.hydration) infoLines.push({ label: 'Hidratação', value: studentInfo.hydration });

  // Macro row
  const macroValues: string[] = [];
  if (studentInfo.energyTotal) macroValues.push(`Energia total: ${studentInfo.energyTotal}`);
  if (studentInfo.carbsTotal) macroValues.push(`Carboidratos: ${studentInfo.carbsTotal}`);
  if (studentInfo.proteinTotal) macroValues.push(`Proteína: ${studentInfo.proteinTotal}`);
  if (studentInfo.fatTotal) macroValues.push(`Lipídios: ${studentInfo.fatTotal}`);

  const totalInfoLines = infoLines.length + (macroValues.length > 0 ? 1 : 0);
  const infoBlockHeight = totalInfoLines * 6 + 8;

  // Light green background
  pdf.setFillColor(240, 253, 244);
  pdf.roundedRect(marginLeft, infoStartY - 2, contentWidth, infoBlockHeight, 2, 2, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  infoLines.forEach(({ label, value }) => {
    pdf.setTextColor(lightText);
    pdf.text(`${label}:`, marginLeft + 4, currentY);
    pdf.setTextColor(darkText);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, marginLeft + 4 + pdf.getTextWidth(`${label}: `), currentY);
    pdf.setFont('helvetica', 'normal');
    currentY += 6;
  });

  // Macros in a single row
  if (macroValues.length > 0) {
    currentY += 2;
    pdf.setFontSize(9);
    pdf.setTextColor(primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(macroValues.join('   |   '), marginLeft + 4, currentY);
    pdf.setFont('helvetica', 'normal');
    currentY += 6;
  }

  currentY += 10;

  // --- Document title ---
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');

  const documentTitle = type === 'diet' ? 'ROTINA ALIMENTAR' : title.toUpperCase();
  pdf.text(documentTitle, marginLeft, currentY);
  currentY += 12;

  // --- Separator ---
  pdf.setDrawColor(primaryColor);
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 8;

  // --- Content processing ---
  pdf.setFontSize(10);
  pdf.setTextColor(darkText);
  pdf.setFont('helvetica', 'normal');

  const lines = content.split('\n');
  const lineHeight = 5;
  const maxWidth = contentWidth;

  for (const line of lines) {
    if (currentY > 278) {
      pdf.addPage();
      currentY = marginTop;
    }

    const trimmedLine = line.trim();

    if (!trimmedLine) {
      currentY += lineHeight / 2;
      continue;
    }

    const isHeader = trimmedLine.startsWith('#') ||
      (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && !trimmedLine.includes(':'));

    if (isHeader) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(primaryColor);

      const headerText = trimmedLine.replace(/^#+\s*/, '');

      // Green underline accent for meal headers
      const headerLines = pdf.splitTextToSize(headerText, maxWidth);
      headerLines.forEach((headerLine: string) => {
        if (currentY > 278) { pdf.addPage(); currentY = marginTop; }
        pdf.text(headerLine, marginLeft, currentY);
        currentY += lineHeight + 2;
      });

      // Subtle line under header
      pdf.setDrawColor(200, 230, 200);
      pdf.setLineWidth(0.2);
      pdf.line(marginLeft, currentY - 1, marginLeft + pdf.getTextWidth(headerLines[0] || ''), currentY - 1);
      currentY += 3;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(darkText);

      const textLines = pdf.splitTextToSize(trimmedLine, maxWidth);
      textLines.forEach((textLine: string) => {
        if (currentY > 278) { pdf.addPage(); currentY = marginTop; }
        pdf.text(textLine, marginLeft, currentY);
        currentY += lineHeight;
      });
    }
  }

  // --- Footer ---
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(lightText);
    pdf.setFont('helvetica', 'normal');

    const footerText = `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`;
    const textWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, pageWidth - textWidth - marginLeft, 287);

    // Footer green line
    pdf.setDrawColor(primaryColor);
    pdf.setLineWidth(0.3);
    pdf.line(marginLeft, 284, pageWidth - marginLeft, 284);
  }

  return pdf.output('blob');
};

export const canDownloadPDF = (planName?: string): boolean => {
  return false;
};
