import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  TableLayoutType,
  convertInchesToTwip,
  Footer
} from 'docx';
import { FichaTCC } from '../types';
import { downloadBlob } from './exportPdf';
import { getSignatureForProfessor, OFFICIAL_FAATESP_LOGO } from './signatures';
import { storageService } from '../services/storage';
import { getFichaExportFilename } from './filenameHelper';

const TOTAL_PAGE_WIDTH_DXA = 10800; // Total printable table width in twips (11906 - 2*553)
const COL_HALF_WIDTH_DXA = 5400; // Exactly 50% for 2 columns

function base64ToUint8Array(dataUrl: string): Uint8Array {
  try {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('Erro ao converter imagem base64 para Uint8Array:', e);
    return new Uint8Array(0);
  }
}

export async function generateDocx(ficha: FichaTCC): Promise<void> {
  const fileName = getFichaExportFilename(ficha, 'docx');

  const orientacoes = ficha.orientacoes || [];
  const ori1 = orientacoes[0];
  const ori2 = orientacoes[1];

  const institutionalLogo = storageService.getInstitutionalLogo() || ficha.logoUrl || OFFICIAL_FAATESP_LOGO;
  const orientadorSignature = ficha.assinaturaUrl || getSignatureForProfessor(ficha.professorOrientador);

  const logoBytes = institutionalLogo ? base64ToUint8Array(institutionalLogo) : null;
  const signatureBytes = orientadorSignature ? base64ToUint8Array(orientadorSignature) : null;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.66),
              bottom: convertInchesToTwip(0.28),
              left: convertInchesToTwip(0.38),
              right: convertInchesToTwip(0.38)
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 10, after: 10 },
                children: [
                  new TextRun({
                    text: `São Paulo, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
                    font: 'Arial',
                    size: 15,
                    italics: true,
                    color: '64748B'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 10 },
                children: [
                  new TextRun({
                    text: 'Project Maket by Mister Roger 2026',
                    font: 'Arial',
                    size: 15,
                    bold: true,
                    color: '0F172A'
                  })
                ]
              })
            ]
          })
        },
        children: [
          // 1. Institutional Logo (Centered, enlarged with higher spacing above black banner)
          ...(logoBytes && logoBytes.length > 0
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 140 },
                  children: [
                    new ImageRun({
                      data: logoBytes,
                      type: 'png',
                      transformation: {
                        width: 325,
                        height: 54
                      }
                    })
                  ]
                })
              ]
            : [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 140 },
                  children: [
                    new TextRun({
                      text: 'FAATESP - FACULDADE ÁLVARES DE AZEVEDO',
                      bold: true,
                      size: 26,
                      font: 'Arial',
                      color: '003366'
                    })
                  ]
                })
              ]),

          // Dark Banner "FICHA DE ACOMPANHAMENTO DE TCC"
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [TOTAL_PAGE_WIDTH_DXA],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
                    shading: { fill: '071526' },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 35, after: 35 },
                        children: [
                          new TextRun({
                            text: 'FICHA DE ACOMPANHAMENTO DE TCC',
                            bold: true,
                            size: 20,
                            font: 'Arial',
                            color: 'FFFFFF'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { before: 40 } }),

          // 2. Academic Identification Table (Exact match to PDF/Preview: 3 Rows, 72% / 28%)
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [7776, 3024], // 72% / 28%
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' }
            },
            rows: [
              // Row 1: Nome do Aluno & Semestre / Ano
              new TableRow({
                children: [
                  createFieldCell('NOME DO ALUNO(A):', ficha.nomeAluno || 'Não informado', true, 7776),
                  createFieldCell('SEMESTRE / ANO:', ficha.semestre || '7º Semestre 2026/2', true, 3024, '0066CC')
                ]
              }),
              // Row 2: Curso & Professor Orientador
              new TableRow({
                children: [
                  createFieldCell('CURSO:', ficha.curso || 'Não informado', false, 7776),
                  createFieldCell('PROFESSOR(A) ORIENTADOR(A):', ficha.professorOrientador || 'Profa. Marinês Borba', false, 3024)
                ]
              }),
              // Row 3: Título do Trabalho & Nota Final
              new TableRow({
                children: [
                  createFieldCell('TÍTULO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC):', ficha.tituloTrabalho || 'Título não preenchido', true, 7776),
                  createGradeCell(ficha.nota, 3024)
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { before: 45 } }),

          // 3. Numbered Sections
          // 1) Situação-Problema
          createSectionHeader('1) SITUAÇÃO-PROBLEMA'),
          createContentBox(ficha.situacaoProblema || 'Nenhum conteúdo informado.'),

          new Paragraph({ spacing: { before: 35 } }),

          // 2) Hipótese
          createSectionHeader('2) HIPÓTESE'),
          createContentBox(ficha.hipotese || 'Nenhum conteúdo informado.'),

          new Paragraph({ spacing: { before: 35 } }),

          // 3) Referências Bibliográficas (Cleanly separated paragraphs, Arial font, justified)
          createSectionHeader('3) REFERÊNCIAS BIBLIOGRÁFICAS'),
          createContentBox(ficha.bibliografia || 'Nenhuma referência informada.'),

          new Paragraph({ spacing: { before: 45 } }),

          // 4. Orientations Section Header (Full width bar)
          createOrientationsHeader(orientacoes.length),

          // 5. Orientations Table (Strict 50% / 50% layout with exact fixed width columns)
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [COL_HALF_WIDTH_DXA, COL_HALF_WIDTH_DXA],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '071526' }
            },
            rows: [
              new TableRow({
                children: [
                  createOrientationCell(1, ori1, COL_HALF_WIDTH_DXA),
                  createOrientationCell(2, ori2, COL_HALF_WIDTH_DXA)
                ]
              })
            ]
          }),

          // 6. Parecer do Orientador (if present)
          ...(ficha.parecerOrientador
            ? [
                new Paragraph({ spacing: { before: 35 } }),
                createSectionHeader('PARECER DO PROFESSOR ORIENTADOR'),
                createContentBox(`"${ficha.parecerOrientador}"`)
              ]
            : []),

          new Paragraph({ spacing: { before: 50 } }),

          // 7. Signature Block (Right aligned with real signature image above the line, NO borders on outer container)
          new Table({
            layout: TableLayoutType.FIXED,
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: [5800, 5000],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5800, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [new Paragraph({ children: [] })]
                  }),
                  new TableCell({
                    width: { size: 5000, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [
                      // Signature Image (With perfect natural aspect ratio to avoid distortion)
                      ...(signatureBytes && signatureBytes.length > 0
                        ? [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              spacing: { after: 0 },
                              children: [
                                new ImageRun({
                                  data: signatureBytes,
                                  type: 'png',
                                  transformation: {
                                    width: 58,
                                    height: 55
                                  }
                                })
                              ]
                            })
                          ]
                        : []),
                      // Solid Line
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 5, after: 10 },
                        children: [
                          new TextRun({
                            text: '______________________________________',
                            bold: true,
                            font: 'Arial',
                            color: '071526'
                          })
                        ]
                      }),
                      // Professor Name
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 5 },
                        children: [
                          new TextRun({
                            text: ficha.professorOrientador || 'Profa. Marinês Borba',
                            bold: true,
                            font: 'Arial',
                            size: 18,
                            color: '0F172A'
                          })
                        ]
                      }),
                      // Subtitle
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 10 },
                        children: [
                          new TextRun({
                            text: 'PROFESSOR(A) ORIENTADOR(A)',
                            font: 'Arial',
                            size: 14,
                            color: '64748B'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName);
}

function createSectionHeader(title: string): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [TOTAL_PAGE_WIDTH_DXA],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            shading: { fill: '071526' },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                spacing: { before: 35, after: 35 },
                children: [
                  new TextRun({
                    text: ` ${title}`,
                    bold: true,
                    size: 18,
                    font: 'Arial',
                    color: 'FFFFFF'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createOrientationsHeader(total: number): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [TOTAL_PAGE_WIDTH_DXA],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            shading: { fill: '071526' },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                spacing: { before: 35, after: 35 },
                children: [
                  new TextRun({
                    text: ' REGISTRO DE ORIENTAÇÕES PRESENCIAIS (MÍNIMO DE 2 ORIENTAÇÕES)',
                    bold: true,
                    size: 18,
                    font: 'Arial',
                    color: 'FFFFFF'
                  }),
                  new TextRun({
                    text: `   (Total: ${total} registrada(s))`,
                    font: 'Arial',
                    size: 15,
                    color: 'CBD5E1'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createContentBox(text: string): Table {
  const rawLines = text ? text.split(/\r?\n+/) : [];
  const paragraphs = rawLines.map(l => l.trim()).filter(l => l.length > 0);
  const displayParagraphs = paragraphs.length > 0 ? paragraphs : [text || 'Nenhum conteúdo informado.'];

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [TOTAL_PAGE_WIDTH_DXA],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_PAGE_WIDTH_DXA, type: WidthType.DXA },
            shading: { fill: 'FFFFFF' },
            margins: {
              top: 50,
              bottom: 50,
              left: 220,
              right: 220
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '071526' }
            },
            children: displayParagraphs.map((paraText, idx) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                indent: {
                  left: 100,
                  right: 100
                },
                spacing: {
                  before: idx === 0 ? 25 : 55,
                  after: idx === displayParagraphs.length - 1 ? 25 : 55
                },
                children: [
                  new TextRun({
                    text: paraText,
                    font: 'Arial',
                    size: 17, // 8.5pt
                    color: '0F172A'
                  })
                ]
              })
            )
          })
        ]
      })
    ]
  });
}

function createFieldCell(label: string, value: string, boldValue = false, widthDxa: number, valueColor = '0F172A'): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' }
    },
    children: [
      new Paragraph({
        spacing: { before: 25, after: 10 },
        children: [
          new TextRun({
            text: label,
            bold: true,
            font: 'Arial',
            size: 14,
            color: '64748B'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 25 },
        children: [
          new TextRun({
            text: value,
            bold: boldValue,
            font: 'Arial',
            size: 18,
            color: valueColor
          })
        ]
      })
    ]
  });
}

function createGradeCell(nota?: string, widthDxa: number = 3024): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' }
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 25, after: 10 },
        children: [
          new TextRun({
            text: 'NOTA FINAL:',
            bold: true,
            font: 'Arial',
            size: 14,
            color: '475569'
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 25 },
        children: [
          new TextRun({
            text: nota ? `${nota} / 10` : '___ / 10',
            bold: true,
            font: 'Arial',
            size: 20,
            color: '0066CC'
          })
        ]
      })
    ]
  });
}

function createOrientationCell(index: number, ori?: { data?: string; horario?: string; observacao?: string; confirmado?: boolean; nomeOrientador?: string; dataConfirmacao?: string }, widthDxa: number = COL_HALF_WIDTH_DXA): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '071526' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '071526' }
    },
    children: [
      new Paragraph({
        spacing: { before: 30, after: 15 },
        children: [
          new TextRun({
            text: `${index}ª Orientação Presencial`,
            bold: true,
            font: 'Arial',
            size: 17,
            color: '0F172A'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `Data: ${ori?.data || '—'}   Horário: ${ori?.horario ? 'às ' + ori.horario : '—'}`,
            font: 'Arial',
            size: 15,
            color: '475569'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: `Observações: ${ori?.observacao || 'Sem observações registradas.'}`,
            font: 'Arial',
            size: 16,
            color: '1E293B'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: ori?.confirmado
              ? `✓ CONFIRMADO (${ori.nomeOrientador || 'Orientador'} - ${ori.dataConfirmacao || ''})`
              : 'PENDENTE DE CONFIRMAÇÃO DO ORIENTADOR',
            bold: true,
            font: 'Arial',
            size: 14,
            color: ori?.confirmado ? '15803D' : 'B45309'
          })
        ]
      })
    ]
  });
}


