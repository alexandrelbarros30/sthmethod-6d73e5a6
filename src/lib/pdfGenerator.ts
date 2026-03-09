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
}

interface PDFContentOptions {
  type: 'diet' | 'protocol';
  title: string;
  content: string;
  studentInfo: StudentInfo;
  createdAt: string;
  logoUrl?: string;
}

export const generateStudentPDF = async (options: PDFContentOptions): Promise<Blob> => {
  const { type, title, content, studentInfo, createdAt, logoUrl } = options;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = '#16a34a'; // emerald-600
  const darkText = '#1f2937'; // gray-800
  const lightText = '#6b7280'; // gray-500

  // Page margins
  const marginLeft = 15;
  const marginTop = 15;
  const pageWidth = 210; // A4 width in mm
  const contentWidth = pageWidth - (marginLeft * 2);

  let currentY = marginTop;

  // Header section
  pdf.setFontSize(22);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  
  // Main title with styling similar to the document
  if (type === 'diet') {
    pdf.text('STH', marginLeft, currentY);
    pdf.setFontSize(10);
    pdf.text('performance', marginLeft + 25, currentY - 3);
    pdf.text('saude', marginLeft + 25, currentY + 5);
    pdf.setFontSize(18);
    pdf.text('consultoria', marginLeft + 50, currentY);
  } else {
    pdf.text('STH', marginLeft, currentY);
    pdf.setFontSize(10);
    pdf.text('performance', marginLeft + 25, currentY - 3);
    pdf.setFontSize(18);
    pdf.text('consultoria', marginLeft + 50, currentY);
  }

  currentY += 25;

  // Student information section
  pdf.setFontSize(12);
  pdf.setTextColor(darkText);
  pdf.setFont('helvetica', 'normal');

  const studentInfoLines = [
    `Nome: ${studentInfo.name}`,
    studentInfo.age ? `Idade: ${studentInfo.age} anos` : null,
    (studentInfo.weight && studentInfo.height) ? `Peso / Altura: ${studentInfo.weight} kg / ${studentInfo.height} m` : null,
    studentInfo.goal ? `Objetivo: ${studentInfo.goal}` : null,
    `Data de Início: ${studentInfo.startDate || new Date(createdAt).toLocaleDateString('pt-BR')}`,
    studentInfo.hydration ? `Hidratação: ${studentInfo.hydration}` : null,
    studentInfo.energyTotal ? `Energia total: ${studentInfo.energyTotal}` : null,
  ].filter(Boolean) as string[];

  studentInfoLines.forEach(line => {
    pdf.text(line, marginLeft, currentY);
    currentY += 6;
  });

  currentY += 10;

  // Document title
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  
  const documentTitle = type === 'diet' ? 'ROTINA ALIMENTAR' : title.toUpperCase();
  pdf.text(documentTitle, marginLeft, currentY);
  currentY += 15;

  // Content processing
  pdf.setFontSize(10);
  pdf.setTextColor(darkText);
  pdf.setFont('helvetica', 'normal');

  const lines = content.split('\n');
  const lineHeight = 5;
  const maxWidth = contentWidth;

  for (const line of lines) {
    // Check if we need a new page
    if (currentY > 280) { // Near bottom of page
      pdf.addPage();
      currentY = marginTop;
    }

    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      currentY += lineHeight / 2;
      continue;
    }

    // Check if it's a header (starts with # or all caps)
    const isHeader = trimmedLine.startsWith('#') || 
                    (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && !trimmedLine.includes(':'));

    if (isHeader) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(primaryColor);
      
      const headerText = trimmedLine.replace(/^#+\s*/, '');
      const headerLines = pdf.splitTextToSize(headerText, maxWidth);
      
      headerLines.forEach((headerLine: string) => {
        pdf.text(headerLine, marginLeft, currentY);
        currentY += lineHeight + 2;
      });
      
      currentY += 3;
    } else {
      // Regular content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(darkText);
      
      const textLines = pdf.splitTextToSize(trimmedLine, maxWidth);
      
      textLines.forEach((textLine: string) => {
        if (currentY > 280) {
          pdf.addPage();
          currentY = marginTop;
        }
        
        pdf.text(textLine, marginLeft, currentY);
        currentY += lineHeight;
      });
    }
  }

  // Footer with generation info
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(lightText);
    pdf.setFont('helvetica', 'normal');
    
    const footerText = `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`;
    const textWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, pageWidth - textWidth - marginLeft, 287);
  }

  return pdf.output('blob');
};

// Helper to check if student has premium plan (currently disabled for all plans)
export const canDownloadPDF = (planName?: string): boolean => {
  return false;
};