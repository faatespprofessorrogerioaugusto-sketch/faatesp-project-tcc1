import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FichaTCC } from '../types';
import { OFFICIAL_FAATESP_LOGO, getSignatureForProfessor } from './signatures';
import { storageService } from '../services/storage';
import { getFichaExportFilename } from './filenameHelper';

/**
 * Sanitizes all loaded document.styleSheets by replacing 'oklch(...)' or modern colors.
 * This prevents html2canvas's internal parser from throwing "unsupported color function".
 */
function sanitizeStyleSheets(): void {
  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i];
          if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('color-mix') || rule.cssText.includes('light-dark'))) {
            try {
              const cleanText = rule.cssText
                .replace(/oklch\([^)]+\)/gi, '#1e293b')
                .replace(/color-mix\([^)]+\)/gi, '#1e293b')
                .replace(/light-dark\([^)]+\)/gi, '#1e293b');
              sheet.deleteRule(i);
              sheet.insertRule(cleanText, i);
            } catch {
              // Ignore single rule replace error
            }
          }
        }
      } catch {
        // Ignore cross-origin stylesheet access restrictions
      }
    }
  } catch {
    // Ignore overall stylesheet access errors
  }
}

/**
 * Renders an element to HTMLCanvasElement safely.
 */
async function renderElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  sanitizeStyleSheets();

  return await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc: Document) => {
      // 1. Clean style elements
      clonedDoc.querySelectorAll('style').forEach((styleEl) => {
        if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('color-mix'))) {
          styleEl.textContent = styleEl.textContent
            .replace(/oklch\([^)]+\)/gi, '#1e293b')
            .replace(/color-mix\([^)]+\)/gi, '#1e293b');
        }
      });
      // 2. Clean inline styles
      clonedDoc.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style && htmlEl.style.cssText && (htmlEl.style.cssText.includes('oklch') || htmlEl.style.cssText.includes('color-mix'))) {
          htmlEl.style.cssText = htmlEl.style.cssText
            .replace(/oklch\([^)]+\)/gi, '#1e293b')
            .replace(/color-mix\([^)]+\)/gi, '#1e293b');
        }
      });
    }
  });
}

function findTargetElement(elementId?: string): HTMLElement {
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) return el;
  }
  const primary = document.getElementById('ficha-preview-container');
  if (primary) return primary;
  const global = document.getElementById('global-export-preview-canvas');
  if (global) return global;
  const dashboard = document.getElementById('dashboard-export-target-preview');
  if (dashboard) return dashboard;
  const secondary = document.getElementById('export-preview-canvas');
  if (secondary) return secondary;
  const byClass = document.querySelector('.print-container') as HTMLElement;
  if (byClass) return byClass;
  throw new Error('Elemento visual da Ficha TCC não encontrado na página.');
}

/**
 * Generates a clean PDF document natively with jsPDF if html2canvas ever fails.
 * Includes the OFFICIAL LOGO and the OFFICIAL SIGNATURE IMAGE.
 */
export function buildNativeJsPdfBlob(ficha: FichaTCC): Blob {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const marginX = 13.5;
  const contentWidth = pageWidth - (marginX * 2); // 183 mm

  // 1. Header with Official FAATESP Logo Image (Centered)
  try {
    const logoData = storageService.getInstitutionalLogo() || ficha.logoUrl || OFFICIAL_FAATESP_LOGO;
    pdf.addImage(logoData, 'PNG', 45, 9, 120, 20);
  } catch {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 51, 102);
    pdf.text('FAATESP - FACULDADE ÁLVARES DE AZEVEDO', 105, 20, { align: 'center' });
  }

  // 2. Official Header Banner "FICHA DE ACOMPANHAMENTO DE TCC" - Clean White Background
  let currentY = 32;
  pdf.setFillColor(255, 255, 255); // 100% White background
  pdf.setDrawColor(15, 23, 42); // #0f172a
  pdf.setLineWidth(0.4);
  pdf.rect(marginX, currentY, contentWidth, 7.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('FICHA DE ACOMPANHAMENTO DE TCC', 105, currentY + 5.2, { align: 'center' });

  currentY += 10;

  // 3. Academic Identification Table (3 Rows, 72% / 28% exactly like DOCX & Preview)
  const col1Width = contentWidth * 0.72; // ~131.76 mm
  const col2Width = contentWidth * 0.28; // ~51.24 mm
  const col2X = marginX + col1Width;

  pdf.setDrawColor(148, 163, 184); // #94a3b8
  pdf.setLineWidth(0.3);

  // Row 1: Nome do Aluno & Semestre / Ano (Height: 9.5 mm)
  const row1H = 9.5;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(marginX, currentY, col1Width, row1H, 'FD');
  pdf.rect(col2X, currentY, col2Width, row1H, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139); // #64748b
  pdf.text('NOME DO ALUNO(A):', marginX + 2, currentY + 3.5);
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42); // #0f172a
  pdf.text(ficha.nomeAluno || 'Não informado', marginX + 2, currentY + 7.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('SEMESTRE / ANO:', col2X + 2, currentY + 3.5);
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(ficha.semestre || '7º Semestre 2026/2', col2X + 2, currentY + 7.5);

  currentY += row1H;

  // Row 2: Curso & Professor Orientador (Height: 9.5 mm)
  const row2H = 9.5;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(marginX, currentY, col1Width, row2H, 'FD');
  pdf.rect(col2X, currentY, col2Width, row2H, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CURSO:', marginX + 2, currentY + 3.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(ficha.curso || 'Não informado', marginX + 2, currentY + 7.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('PROFESSOR(A) ORIENTADOR(A):', col2X + 2, currentY + 3.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(ficha.professorOrientador || 'Profa. Marinês Borba', col2X + 2, currentY + 7.5);

  currentY += row2H;

  // Row 3: Título do Trabalho & Nota Final (Height: 12.5 mm)
  const row3H = 12.5;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(marginX, currentY, col1Width, row3H, 'FD');
  pdf.rect(col2X, currentY, col2Width, row3H, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('TÍTULO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC):', marginX + 2, currentY + 3.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  const splitTitle = pdf.splitTextToSize(ficha.tituloTrabalho || 'Título não preenchido', col1Width - 4);
  pdf.text(splitTitle.slice(0, 2), marginX + 2, currentY + 7.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('NOTA FINAL:', col2X + (col2Width / 2), currentY + 4, { align: 'center' });
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(ficha.nota ? `${ficha.nota} / 10` : '___ / 10', col2X + (col2Width / 2), currentY + 9.5, { align: 'center' });

  currentY += row3H + 3.5;

  // Helper function to render numbered sections with clean white background and dark text
  const renderNumberedSection = (title: string, content: string, maxLines = 5) => {
    // Header Bar - White background with dark border and text
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.35);
    pdf.rect(marginX, currentY, contentWidth, 5.2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(title, marginX + 2.5, currentY + 3.7);
    currentY += 5.2;

    // Content Box
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    pdf.setTextColor(15, 23, 42);
    const lines = pdf.splitTextToSize(content || 'Nenhum conteúdo informado.', contentWidth - 5);
    const displayLines = lines.slice(0, maxLines);
    const boxHeight = Math.max(10, (displayLines.length * 3.4) + 4);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(148, 163, 184);
    pdf.rect(marginX, currentY, contentWidth, boxHeight, 'FD');
    pdf.text(displayLines, marginX + 2.5, currentY + 4);

    currentY += boxHeight + 2.5;
  };

  // 4. Numbered Sections:
  // 1) Situação-Problema
  renderNumberedSection('1) SITUAÇÃO-PROBLEMA', ficha.situacaoProblema || '', 5);

  // 2) Hipótese
  renderNumberedSection('2) HIPÓTESE', ficha.hipotese || '', 4);

  // 3) Referências Bibliográficas
  renderNumberedSection('3) REFERÊNCIAS BIBLIOGRÁFICAS', ficha.bibliografia || '', 5);

  // 5. Orientations Section (2 Columns, 50% / 50% exactly like DOCX) - Clean White Background
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.35);
  pdf.rect(marginX, currentY, contentWidth, 5.2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('REGISTRO DE ORIENTAÇÕES PRESENCIAIS (MÍNIMO DE 2 ORIENTAÇÕES)', marginX + 2.5, currentY + 3.7);
  currentY += 5.2;

  const ori1 = ficha.orientacoes?.[0];
  const ori2 = ficha.orientacoes?.[1];
  const oriColWidth = contentWidth / 2; // 91.5 mm
  const oriCol2X = marginX + oriColWidth;
  const oriBoxHeight = 25;

  const renderOriCol = (colX: number, title: string, ori?: any) => {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(148, 163, 184);
    pdf.setLineWidth(0.3);
    pdf.rect(colX, currentY, oriColWidth, oriBoxHeight, 'FD');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(title, colX + 3, currentY + 4);

    // Date & Time
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Data: ${ori?.data || '—'}  |  Horário: ${ori?.horario || '—'}`, colX + 3, currentY + 8);

    // Observação
    pdf.setFontSize(7.2);
    pdf.setTextColor(15, 23, 42);
    const obsLines = pdf.splitTextToSize(ori?.observacao || 'Sem observações registradas.', oriColWidth - 6);
    pdf.text(obsLines.slice(0, 2), colX + 3, currentY + 12.5);

    // Status Badge
    const isVal = Boolean(ori?.confirmado);
    const badgeY = currentY + 18.5;
    const badgeW = oriColWidth - 6;
    const badgeH = 4.5;

    if (isVal) {
      pdf.setFillColor(240, 253, 244); // #f0fdf4
      pdf.setDrawColor(187, 247, 208); // #bbf7d0
      pdf.rect(colX + 3, badgeY, badgeW, badgeH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(21, 128, 61); // #15803d
      pdf.text('✓ VALIDADO PELO ORIENTADOR', colX + (oriColWidth / 2), badgeY + 3.2, { align: 'center' });
    } else {
      pdf.setFillColor(254, 252, 232); // #fefce8
      pdf.setDrawColor(254, 240, 138); // #fef08a
      pdf.rect(colX + 3, badgeY, badgeW, badgeH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(161, 98, 7); // #a16207
      pdf.text('PENDENTE DE VALIDAÇÃO', colX + (oriColWidth / 2), badgeY + 3.2, { align: 'center' });
    }
  };

  renderOriCol(marginX, '1ª Orientação Presencial', ori1);
  renderOriCol(oriCol2X, '2ª Orientação Presencial', ori2);

  currentY += oriBoxHeight + 2.5;

  // 6. Parecer do Professor Orientador (if present) - Clean White Background
  if (ficha.parecerOrientador?.trim()) {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.35);
    pdf.rect(marginX, currentY, contentWidth, 5.2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('PARECER DO PROFESSOR ORIENTADOR', marginX + 2.5, currentY + 3.7);
    currentY += 5.2;

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.4);
    pdf.setTextColor(15, 23, 42);
    const pLines = pdf.splitTextToSize(`"${ficha.parecerOrientador.trim()}"`, contentWidth - 6);
    const pBoxH = Math.max(9, (pLines.slice(0, 3).length * 3.4) + 3.5);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(148, 163, 184);
    pdf.rect(marginX, currentY, contentWidth, pBoxH, 'FD');
    pdf.text(pLines.slice(0, 3), marginX + 3, currentY + 3.8);

  }

  // 7. Signature Block (Right aligned, exactly like DOCX & Preview)
  const sigY = Math.max(currentY + 12, 258);
  const orientadorSig = ficha.assinaturaUrl || getSignatureForProfessor(ficha.professorOrientador);

  if (orientadorSig) {
    try {
      pdf.addImage(orientadorSig, 'PNG', 151, sigY - 13, 24, 12);
    } catch {
      // ignore
    }
  }

  pdf.setDrawColor(7, 21, 38);
  pdf.setLineWidth(0.4);
  pdf.line(134, sigY, 192, sigY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(ficha.professorOrientador || 'Assinatura do Professor Orientador', 163, sigY + 3.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Professor(a) Orientador(a)', 163, sigY + 7, { align: 'center' });

  // 8. Footer: Date & Project attribution
  pdf.setFontSize(7.2);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`São Paulo, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 283, { align: 'center' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Project Maket by Mister Roger 2026', 105, 287.5, { align: 'center' });

  return pdf.output('blob');
}

/**
 * Safely triggers browser download of a blob without iframe/window navigation.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore cleanup error
    }
  }, 2000);
}

/**
 * Downloads single page PDF directly from Ficha data.
 */
export async function generatePdf(fichaOrElement: FichaTCC | string, customFileNameOrFicha?: string | FichaTCC): Promise<void> {
  let ficha: FichaTCC;
  let customFileName: string | undefined;

  if (typeof fichaOrElement === 'object' && fichaOrElement !== null) {
    ficha = fichaOrElement;
    if (typeof customFileNameOrFicha === 'string') {
      customFileName = customFileNameOrFicha;
    }
  } else if (typeof customFileNameOrFicha === 'object' && customFileNameOrFicha !== null) {
    ficha = customFileNameOrFicha;
  } else {
    throw new Error('Dados da ficha TCC não fornecidos.');
  }

  const defaultFileName = getFichaExportFilename(ficha, 'pdf');
  const fileName = customFileName ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`) : defaultFileName;

  const blob = buildNativeJsPdfBlob(ficha);
  downloadBlob(blob, fileName);
}

export async function exportToPdf(
  fichaOrElement: string | FichaTCC,
  customFileName?: string,
  fichaFallback?: FichaTCC
): Promise<void> {
  let ficha: FichaTCC | undefined;

  if (typeof fichaOrElement === 'object' && fichaOrElement !== null) {
    ficha = fichaOrElement;
  } else if (fichaFallback) {
    ficha = fichaFallback;
  }

  if (ficha) {
    const defaultFileName = getFichaExportFilename(ficha, 'pdf');
    const fileName = customFileName ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`) : defaultFileName;
    const blob = buildNativeJsPdfBlob(ficha);
    downloadBlob(blob, fileName);
    return;
  }

  const fileName = `${customFileName || 'FICHA DE TCC'}.pdf`;
  try {
    const element = findTargetElement(typeof fichaOrElement === 'string' ? fichaOrElement : undefined);
    const canvas = await renderElementToCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pdfWidth / (canvas.width / 2), pdfHeight / (canvas.height / 2));
    const renderWidth = (canvas.width / 2) * ratio;
    const renderHeight = (canvas.height / 2) * ratio;
    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = 0;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
    const blob = pdf.output('blob');
    downloadBlob(blob, fileName);
  } catch (err) {
    console.error('Falha na captura de tela para PDF:', err);
  }
}

export async function generatePdfFile(elementId: string, customFileName?: string, fichaFallback?: FichaTCC): Promise<File | null> {
  const defaultFileName = fichaFallback ? getFichaExportFilename(fichaFallback, 'pdf') : 'FICHA DE TCC.pdf';
  const fileName = customFileName ? (customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`) : defaultFileName;

  if (fichaFallback) {
    const blob = buildNativeJsPdfBlob(fichaFallback);
    return new File([blob], fileName, { type: 'application/pdf' });
  }

  try {
    const element = findTargetElement(elementId);
    const canvas = await renderElementToCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pdfWidth / (canvas.width / 2), pdfHeight / (canvas.height / 2));
    const renderWidth = (canvas.width / 2) * ratio;
    const renderHeight = (canvas.height / 2) * ratio;
    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = 0;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Falha ao gerar arquivo PDF:', err);
    return null;
  }
}

export async function generatePdfBase64(elementId: string, _customFileName?: string, fichaFallback?: FichaTCC): Promise<string> {
  if (fichaFallback) {
    const blob = buildNativeJsPdfBlob(fichaFallback);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  try {
    const element = findTargetElement(elementId);
    const canvas = await renderElementToCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pdfWidth / (canvas.width / 2), pdfHeight / (canvas.height / 2));
    const renderWidth = (canvas.width / 2) * ratio;
    const renderHeight = (canvas.height / 2) * ratio;
    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = 0;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
    return pdf.output('datauristring');
  } catch (err) {
    console.error('Falha ao gerar PDF Base64:', err);
    throw err;
  }
}

export async function printDirectly(elementId: string = 'ficha-preview-container', fichaFallback?: FichaTCC): Promise<void> {
  const targetElement = document.getElementById(elementId) || document.querySelector(`[id="${elementId}"]`);

  // 1. Build a clean printable HTML document
  let contentHtml = '';
  if (targetElement) {
    contentHtml = targetElement.outerHTML;
  } else if (fichaFallback) {
    // If not found, use a fallback layout message
    contentHtml = `<div style="padding: 20px; font-family: sans-serif;"><h2>Ficha de Acompanhamento TCC - ${fichaFallback.nomeAluno || 'Aluno'}</h2><p>Por favor, utilize o botão Exportar PDF para salvar sua ficha.</p></div>`;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Impressão - Ficha de Acompanhamento TCC</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .print-container, #${elementId} {
      width: 100% !important;
      max-width: 100% !important;
      min-height: auto !important;
      box-shadow: none !important;
      border: 1px solid #94a3b8 !important;
      margin: 0 auto !important;
      padding: 16px 20px !important;
      background: #ffffff !important;
    }
    img {
      max-width: 100% !important;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  try {
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);
    const iframeDoc = printIframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 3000);
      }, 350);
      return;
    }
  } catch {
    window.focus();
    window.print();
  }
}
