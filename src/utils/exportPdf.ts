import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FichaTCC } from '../types';
import { OFFICIAL_FAATESP_LOGO, getSignatureForProfessor } from './signatures';
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

  // 1. Header with Official FAATESP Logo Image (Enlarged, centered, and positioned higher with breathing room)
  try {
    const logoData = ficha.logoUrl || OFFICIAL_FAATESP_LOGO;
    pdf.addImage(logoData, 'PNG', 36, 18, 138, 24);
  } catch (e) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('FAATESP - FACULDADE ÁLVARES DE AZEVEDO', 105, 28, { align: 'center' });
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('FICHA DE ACOMPANHAMENTO DE TCC', 105, 48, { align: 'center' });
  pdf.setLineWidth(0.4);
  pdf.line(15, 51, 195, 51);

  // Student Details Box
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NOME DO ALUNO(A):', 15, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ficha.nomeAluno || 'Não informado', 55, 57);

  pdf.setFont('helvetica', 'bold');
  pdf.text('CURSO:', 15, 63);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ficha.curso || 'Não informado', 55, 63);

  pdf.setFont('helvetica', 'bold');
  pdf.text('SEMESTRE:', 130, 63);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 75, 153);
  pdf.text(ficha.semestre || '7º Semestre 2026/2', 155, 63);
  pdf.setTextColor(0, 0, 0);

  pdf.setFont('helvetica', 'bold');
  pdf.text('ORIENTADOR:', 15, 69);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ficha.professorOrientador || 'Não informado', 55, 69);

  pdf.setFont('helvetica', 'bold');
  pdf.text('TÍTULO DO TCC:', 15, 75);
  pdf.setFont('helvetica', 'normal');
  const splitTitle = pdf.splitTextToSize(ficha.tituloTrabalho || 'Não informado', 135);
  pdf.text(splitTitle, 55, 75);

  let currentY = 75 + (splitTitle.length * 4.5) + 3;

  // Grade Box
  pdf.setFillColor(245, 247, 250);
  pdf.rect(15, currentY, 180, 10, 'F');
  pdf.rect(15, currentY, 180, 10, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('NOTA FINAL ATRIBUÍDA:', 20, currentY + 6.5);
  pdf.setFontSize(9.5);
  pdf.setTextColor(0, 75, 153);
  pdf.text(ficha.nota ? `${ficha.nota} / 10.0` : 'Pendente de avaliação', 65, currentY + 6.5);
  pdf.setTextColor(0, 0, 0);

  currentY += 14;

  // 1) Situação-Problema (with inset horizontal margins)
  pdf.setFillColor(11, 25, 44);
  pdf.rect(15, currentY, 180, 5.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('1) SITUAÇÃO-PROBLEMA', 18, currentY + 3.8);
  pdf.setTextColor(0, 0, 0);
  currentY += 6.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const splitProblem = pdf.splitTextToSize(ficha.situacaoProblema || 'Não informada.', 174);
  pdf.text(splitProblem.slice(0, 7), 18, currentY);
  currentY += Math.min(splitProblem.length, 7) * 3.8 + 4;

  // 2) Hipótese (with inset horizontal margins)
  pdf.setFillColor(11, 25, 44);
  pdf.rect(15, currentY, 180, 5.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('2) HIPÓTESE', 18, currentY + 3.8);
  pdf.setTextColor(0, 0, 0);
  currentY += 6.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const splitHypo = pdf.splitTextToSize(ficha.hipotese || 'Não informada.', 174);
  pdf.text(splitHypo.slice(0, 5), 18, currentY);
  currentY += Math.min(splitHypo.length, 5) * 3.8 + 4;

  // 3) Bibliografia (with inset horizontal margins)
  pdf.setFillColor(11, 25, 44);
  pdf.rect(15, currentY, 180, 5.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('3) REFERÊNCIAS BIBLIOGRÁFICAS', 18, currentY + 3.8);
  pdf.setTextColor(0, 0, 0);
  currentY += 6.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  const rawBibLines = (ficha.bibliografia || 'Não informada.').split(/\r?\n+/).filter(l => l.trim().length > 0);
  for (let i = 0; i < rawBibLines.length; i++) {
    const splitLines = pdf.splitTextToSize(rawBibLines[i].trim(), 174);
    pdf.text(splitLines, 18, currentY);
    currentY += splitLines.length * 3.4 + (i === rawBibLines.length - 1 ? 3 : 2.5);
  }

  // Side-by-side Orientations
  pdf.setFillColor(11, 25, 44);
  pdf.rect(15, currentY, 180, 5.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('REGISTRO DE ORIENTAÇÕES PRESENCIAIS (MÍNIMO DE 2 ORIENTAÇÕES)', 17, currentY + 3.8);
  pdf.setTextColor(0, 0, 0);
  currentY += 7.5;

  const ori1 = ficha.orientacoes?.[0];
  const ori2 = ficha.orientacoes?.[1];

  // Box 1 (Left column)
  pdf.rect(15, currentY, 87, 28);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('1ª Orientação Presencial', 18, currentY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`Data: ${ori1?.data || '—'}  Horário: ${ori1?.horario || '—'}`, 18, currentY + 10);
  const obs1 = pdf.splitTextToSize(ori1?.observacao || 'Sem observações registradas.', 81);
  pdf.text(obs1.slice(0, 2), 18, currentY + 15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(ori1?.confirmado ? '✓ VALIDADO PELO ORIENTADOR' : 'PENDENTE DE VALIDAÇÃO', 18, currentY + 25);

  // Box 2 (Right column)
  pdf.rect(108, currentY, 87, 28);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('2ª Orientação Presencial', 111, currentY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`Data: ${ori2?.data || '—'}  Horário: ${ori2?.horario || '—'}`, 111, currentY + 10);
  const obs2 = pdf.splitTextToSize(ori2?.observacao || 'Sem observações registradas.', 81);
  pdf.text(obs2.slice(0, 2), 111, currentY + 15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(ori2?.confirmado ? '✓ VALIDADO PELO ORIENTADOR' : 'PENDENTE DE VALIDAÇÃO', 111, currentY + 25);

  currentY += 32;

  // Parecer
  if (ficha.parecerOrientador) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('PARECER DO PROFESSOR ORIENTADOR:', 15, currentY);
    currentY += 3.5;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    const splitParecer = pdf.splitTextToSize(`"${ficha.parecerOrientador}"`, 180);
    pdf.text(splitParecer.slice(0, 2), 15, currentY);
    currentY += 10;
  }

  // Signature Block with REAL SIGNATURE IMAGE on the right
  const sigY = Math.max(currentY, 256);
  const sigImage = ficha.assinaturaUrl || getSignatureForProfessor(ficha.professorOrientador);
  if (sigImage) {
    try {
      pdf.addImage(sigImage, 'PNG', 147, sigY - 16, 16, 15);
    } catch {
      // Ignore image render fallback
    }
  }

  pdf.line(125, sigY, 185, sigY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(ficha.professorOrientador || 'Assinatura do Professor Orientador', 155, sigY + 4, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Professor(a) Orientador(a)', 155, sigY + 8, { align: 'center' });

  // Footer: Date and Project Attribution
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`São Paulo, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 282, { align: 'center' });
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  const projectLabel = 'Project Maket by Mister Roger 2026';
  pdf.text(projectLabel, 105, 287, { align: 'center' });

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
    console.warn('Fallback para gerador nativo PDF File devido a:', err);
    if (fichaFallback) {
      const blob = buildNativeJsPdfBlob(fichaFallback);
      return new File([blob], fileName, { type: 'application/pdf' });
    }
    return null;
  }
}

export async function generatePdfBase64(elementId: string, _customFileName?: string, fichaFallback?: FichaTCC): Promise<string> {
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
    console.warn('Fallback para gerador nativo PDF Base64 devido a:', err);
    if (fichaFallback) {
      const blob = buildNativeJsPdfBlob(fichaFallback);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
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
