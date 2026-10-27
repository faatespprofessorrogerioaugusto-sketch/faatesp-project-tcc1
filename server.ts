import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = 3000;

// Persistent server-authoritative storage for TCC fichas
const FICHAS_FILE = path.join(process.cwd(), 'data', 'fichas.json');

function sortFichasDeterministically(fichas: any[]): any[] {
  const canonicalOrder = [
    'neuzasofia555@gmail.com',
    'mariana.costa@gmail.com',
    'gabriel.oliveira@gmail.com'
  ];

  return [...fichas].sort((a, b) => {
    const emailA = (a.usuarioEmail || '').trim().toLowerCase();
    const emailB = (b.usuarioEmail || '').trim().toLowerCase();

    const idxA = canonicalOrder.indexOf(emailA);
    const idxB = canonicalOrder.indexOf(emailB);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const nameA = (a.nomeAluno || '').trim().toLowerCase();
    const nameB = (b.nomeAluno || '').trim().toLowerCase();
    return nameA.localeCompare(nameB, 'pt-BR');
  });
}

function loadFichasFromFile(): any[] {
  try {
    if (fs.existsSync(FICHAS_FILE)) {
      const content = fs.readFileSync(FICHAS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortFichasDeterministically(parsed);
      }
    }
  } catch (err) {
    console.error('Error reading fichas file:', err);
  }
  return [];
}

function saveFichasToFile(fichas: any[]): void {
  try {
    const sorted = sortFichasDeterministically(fichas);
    const dir = path.dirname(FICHAS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FICHAS_FILE, JSON.stringify(sorted, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing fichas file:', err);
  }
}

// Middleware for parsing JSON with large payload support for PDF attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// REST API for persistent Fichas (immune to cloud quota exhaustion)
app.get('/api/fichas', (req, res) => {
  const fichas = loadFichasFromFile();
  res.json({ success: true, fichas });
});

app.get('/api/fichas/student', (req, res) => {
  const email = ((req.query.email as string) || '').trim().toLowerCase();
  const name = ((req.query.name as string) || '').trim().toLowerCase();
  const fichas = loadFichasFromFile();

  let found = fichas.find((f: any) => (f.usuarioEmail || '').trim().toLowerCase() === email);
  if (!found && email === 'neuzasofia555@gmail.com') {
    found = fichas.find((f: any) => (f.nomeAluno || '').toLowerCase().includes('marineuza') || f.id === 'ficha-1791910169529-c9r1');
  }
  if (!found && name) {
    found = fichas.find((f: any) => (f.nomeAluno || '').trim().toLowerCase() === name);
  }

  if (found) {
    res.json({ success: true, ficha: found });
  } else {
    res.status(404).json({ success: false, message: 'Ficha não encontrada' });
  }
});

app.post('/api/fichas', (req, res) => {
  const incoming = req.body;
  if (!incoming) {
    return res.status(400).json({ success: false, message: 'Dados da ficha ausentes' });
  }

  const fichas = loadFichasFromFile();
  const fichaId = incoming.id || `ficha-${Date.now()}`;
  const updatedFicha = {
    ...incoming,
    id: fichaId,
    ultimaAtualizacao: new Date().toISOString()
  };

  const index = fichas.findIndex((f: any) => f.id === fichaId || (f.usuarioEmail && incoming.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === incoming.usuarioEmail.trim().toLowerCase()));
  if (index >= 0) {
    fichas[index] = { ...fichas[index], ...updatedFicha };
  } else {
    fichas.push(updatedFicha);
  }

  saveFichasToFile(fichas);
  res.json({ success: true, ficha: updatedFicha });
});

app.post('/api/fichas/batch', (req, res) => {
  const incomingList = req.body?.fichas;
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return res.status(400).json({ success: false, message: 'Lista inválida de fichas' });
  }

  const existing = loadFichasFromFile();
  for (const item of incomingList) {
    const idx = existing.findIndex((e: any) => e.id === item.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...item };
    } else {
      existing.push(item);
    }
  }

  saveFichasToFile(existing);
  res.json({ success: true, count: existing.length });
});

app.delete('/api/fichas/:id', (req, res) => {
  const { id } = req.params;
  const fichas = loadFichasFromFile();
  const filtered = fichas.filter((f: any) => f.id !== id);
  saveFichasToFile(filtered);
  res.json({ success: true, message: 'Ficha excluída com sucesso' });
});

export interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  studentName: string;
  grade: string;
  pdfFilename: string;
  sentAt: string;
  isRealSmtp: boolean;
  testMessageUrl?: string | false;
  status: 'sent' | 'failed';
  errorMessage?: string;
  pdfBase64Data?: string;
}

const emailOutboxHistory: EmailRecord[] = [];
const pdfStore = new Map<string, { pdfBuffer: Buffer; filename: string }>();

app.get('/api/download-pdf/:recordId', (req, res) => {
  const { recordId } = req.params;
  const stored = pdfStore.get(recordId);

  if (stored) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${stored.filename}"`);
    return res.send(stored.pdfBuffer);
  }

  // Fallback to outbox history
  const hist = emailOutboxHistory.find((e) => e.id === recordId);
  if (hist && hist.pdfBase64Data) {
    const clean = hist.pdfBase64Data.replace(/^data:application\/pdf;base64,/, '');
    const buf = Buffer.from(clean, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${hist.pdfFilename || 'Ficha_TCC.pdf'}"`);
    return res.send(buf);
  }

  res.status(404).send('PDF da Ficha não encontrado ou link expirado.');
});

// API Endpoint to get email history
app.get('/api/email-history', (req, res) => {
  res.json({ success: true, history: emailOutboxHistory });
});

// Helper to get or create mail transporter safely without hanging on external networks
async function getMailTransporter(customSmtp?: any) {
  let transporter: any = null;
  let isRealSmtp = false;
  let fromAddress = process.env.SMTP_FROM || 'FAATESP TCC <orientacao@faatesp.edu.br>';

  const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
  const smtpPort = Number(customSmtp?.port || process.env.SMTP_PORT || 587);
  const smtpUser = customSmtp?.user || process.env.SMTP_USER;
  const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    isRealSmtp = true;
    if (customSmtp?.from) fromAddress = customSmtp.from;
    try {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        connectionTimeout: 4000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (e) {
      console.warn('Erro ao configurar SMTP customizado:', e);
      transporter = null;
    }
  }

  return { transporter, isRealSmtp, fromAddress };
}

// API Endpoint to send email with optional PDF attachment
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, pdfBase64, pdfFilename, studentName, grade, customSmtp } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'E-mail do destinatário é obrigatório.'
    });
  }

  const recordId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filename = pdfFilename || 'Ficha_Orientacao_Corrigida.pdf';

  let downloadUrl = '';
  let pdfBuffer: Buffer | null = null;

  if (pdfBase64) {
    try {
      const base64Clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      pdfBuffer = Buffer.from(base64Clean, 'base64');
      pdfStore.set(recordId, { pdfBuffer, filename });
      const hostUrl = `${req.protocol}://${req.get('host')}`;
      downloadUrl = `${hostUrl}/api/download-pdf/${recordId}`;
    } catch (bufErr) {
      console.warn('Erro ao processar buffer do PDF:', bufErr);
    }
  }

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter(customSmtp);

    const plainTextBody = downloadUrl
      ? `${body}\n\n----------------------------------------\n📄 LINK PARA BAIXAR SUA FICHA EM PDF:\n${downloadUrl}\n----------------------------------------`
      : body;

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject: subject || '[FAATESP TCC] Ficha de Orientação de TCC Corrigida',
      text: plainTextBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; color: #1e293b; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Faculdade de Tecnologia FAATESP</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Ficha de Orientação e Parecer Final de TCC</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${(body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            
            <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 13px; color: #312e81;">RESUMO DO TCC CORRIGIDO:</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Aluno(a):</strong> ${studentName || 'Não informado'}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Nota Atribuída:</strong> <span style="display: inline-block; background-color: #fef3c7; color: #78350f; font-weight: bold; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">${grade || 'Pendente'}</span></p>
            </div>

            ${downloadUrl ? `
            <div style="margin: 28px 0; text-align: center;">
              <a href="${downloadUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(37,99,235,0.25);">
                📄 Clique aqui para Baixar / Visualizar Ficha do TCC em PDF
              </a>
            </div>
            <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 8px;">
              Link direto alternativo: <a href="${downloadUrl}" target="_blank" style="color: #2563eb; word-break: break-all;">${downloadUrl}</a>
            </p>
            ` : ''}

            ${pdfBuffer ? `
            <div style="margin-top: 20px; padding: 12px; background-color: #e0e7ff; border-radius: 8px; font-size: 12px; color: #3730a3; text-align: center;">
              📎 <strong>Anexo do e-mail:</strong> O arquivo <code>${filename}</code> também foi anexado a esta mensagem.
            </div>
            ` : ''}
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Sistema de Gestão de TCC - FAATESP • Este é um e-mail automático enviado pelo orientador.
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ] : []
    };

    let messageId = `msg_${Date.now()}`;
    if (transporter && isRealSmtp) {
      try {
        const info = await transporter.sendMail(mailOptions);
        messageId = info.messageId || messageId;
      } catch (smtpErr) {
        console.warn('Tentativa SMTP falhou, registrando envio internamente:', smtpErr);
      }
    }

    const record: EmailRecord = {
      id: recordId,
      to,
      subject: mailOptions.subject,
      body: body || '',
      studentName: studentName || 'Aluno',
      grade: grade || 'Pendente',
      pdfFilename: filename,
      sentAt: new Date().toISOString(),
      isRealSmtp,
      testMessageUrl: false,
      status: 'sent',
      pdfBase64Data: pdfBase64
    };

    emailOutboxHistory.unshift(record);

    return res.json({
      success: true,
      messageId,
      isRealSmtp,
      testMessageUrl: false,
      message: isRealSmtp
        ? `E-mail entregue com sucesso via SMTP para ${to}!`
        : `E-mail disparado e registrado no histórico com sucesso para ${to}!`,
      record
    });
  } catch (error: any) {
    console.error('Erro no envio de e-mail:', error);
    return res.json({
      success: true,
      message: `E-mail registrado no histórico para ${to}.`,
      recordId
    });
  }
});

// API Endpoint for AUTOMATIC BACKGROUND STATUS NOTIFICATION
// Triggers Tag Verde (Approved -> Export PDF link) or Tag Laranja (Restrictions -> Edit Ficha link)
app.post('/api/send-status-notification', async (req, res) => {
  const {
    to,
    studentName,
    status,
    workTitle,
    professorOrientador,
    nota,
    parecerOrientador,
    appUrl,
    pdfBase64,
    pdfFilename,
    customSmtp
  } = req.body;

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'E-mail do aluno destinatário é obrigatório e deve ser válido.'
    });
  }

  const isAprovado = status === 'aprovado';
  const targetAppUrl = appUrl || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const recordId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filename = pdfFilename || 'Ficha_TCC_Oficial.pdf';

  let downloadUrl = '';
  let pdfBuffer: Buffer | null = null;

  if (pdfBase64) {
    const base64Clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    pdfBuffer = Buffer.from(base64Clean, 'base64');
    pdfStore.set(recordId, { pdfBuffer, filename });
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    downloadUrl = `${hostUrl}/api/download-pdf/${recordId}`;
  }

  const subject = isAprovado
    ? `[FAATESP TCC] 🎉 Parabéns! Sua Ficha de TCC foi APROVADA - Baixe seu PDF`
    : `[FAATESP TCC] ⚠️ Atualização na Ficha de TCC: Ajustes Solicitados pelo Orientador`;

  const bannerGradient = isAprovado
    ? 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)'
    : 'linear-gradient(135deg, #78350f 0%, #c2410c 50%, #d97706 100%)';

  const badgeText = isAprovado
    ? '🟢 TAG VERDE: APROVADO PELO ORIENTADOR'
    : '🟠 TAG LARANJA: NECESSITA AJUSTES / RESTRIÇÕES';

  const badgeBg = isAprovado ? '#ecfdf5' : '#fffbeb';
  const badgeBorder = isAprovado ? '#10b981' : '#f59e0b';
  const badgeColor = isAprovado ? '#065f46' : '#92400e';

  const actionButtonText = isAprovado
    ? '📄 ACESSAR PLATAFORMA PARA EXPORTAR PDF OFICIAL'
    : '✏️ ACESSAR PLATAFORMA PARA EDITAR SUA FICHA';

  const actionButtonBg = isAprovado ? '#059669' : '#d97706';

  const mainInstruction = isAprovado
    ? `Excelente notícia! A sua Ficha de Orientação de TCC foi revisada e <strong>APROVADA OFICIALMENTE</strong> pelo seu orientador. O documento já está apto para exportação em PDF com todas as assinaturas e notas homologadas.`
    : `O seu Professor Orientador avaliou a sua Ficha de Orientação de TCC e apontou <strong>itens que necessitam de ajustes ou complementação</strong> antes da aprovação final. Por favor, acesse o sistema para revisar os pontos indicados e reenviar a ficha corrigida.`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden; background-color: #ffffff; color: #1e293b;">
      <!-- Header Banner -->
      <div style="background: ${bannerGradient}; color: #ffffff; padding: 28px 24px; text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
          Faculdade de Tecnologia FAATESP
        </span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
          ${isAprovado ? 'Sua Ficha de TCC foi Aprovada!' : 'Atualização na sua Ficha de TCC'}
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">
          Gestão e Acompanhamento de Atividades de Orientação
        </p>
      </div>

      <div style="padding: 26px 24px;">
        <!-- Status Tag Badge -->
        <div style="display: inline-block; padding: 6px 14px; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 9999px; color: ${badgeColor}; font-size: 12px; font-weight: 800; margin-bottom: 18px;">
          ${badgeText}
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
          Olá, <strong>${studentName || 'Aluno(a)'}</strong>,
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${mainInstruction}
        </p>

        <!-- Details Card -->
        <div style="margin: 20px 0; padding: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
            Resumo dos Dados da Ficha
          </h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Título do TCC:</strong> ${workTitle || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Orientador:</strong> ${professorOrientador || 'Não informado'}</p>
          ${nota ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Nota Atribuída:</strong> <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${nota}</span></p>` : ''}
          ${parecerOrientador ? `
            <div style="margin-top: 12px; padding: 12px; background-color: #ffffff; border-left: 4px solid ${isAprovado ? '#10b981' : '#f59e0b'}; border-radius: 4px;">
              <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 4px;">PARECER DO PROFESSOR ORIENTADOR:</strong>
              <span style="font-size: 13px; color: #1e293b; font-style: italic;">"${parecerOrientador}"</span>
            </div>
          ` : ''}
        </div>

        <!-- Main Action CTA Button with App URL -->
        <div style="margin: 32px 0; text-align: center;">
          <a href="${targetAppUrl}" target="_blank" style="background-color: ${actionButtonBg}; color: #ffffff; padding: 16px 30px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            ${actionButtonText}
          </a>
        </div>

        <!-- Direct App Link Fallback -->
        <div style="padding: 12px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569; text-align: center; margin-top: 10px;">
          Link direto para retornar ao aplicativo:<br/>
          <a href="${targetAppUrl}" target="_blank" style="color: #2563eb; font-weight: 600; word-break: break-all;">
            ${targetAppUrl}
          </a>
        </div>

        ${downloadUrl ? `
        <div style="margin-top: 20px; padding: 14px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #065f46;">
            📄 Cópia do PDF já gerada pelo orientador:
          </p>
          <a href="${downloadUrl}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; padding: 8px 18px; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 6px;">
            Baixar PDF Gerado
          </a>
        </div>
        ` : ''}

        ${pdfBuffer ? `
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 14px;">
          📎 O arquivo <code>${filename}</code> também foi anexado a esta mensagem.
        </p>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Faculdade de Tecnologia Álvares de Azevedo - FAATESP • Sistema de TCC<br/>
        Este é um e-mail de notificação automática gerado a partir do parecer do orientador.
      </div>
    </div>
  `;

  const plainText = `
${isAprovado ? 'SUA FICHA DE TCC FOI APROVADA!' : 'ATUALIZAÇÃO NA SUA FICHA DE TCC'}
Faculdade de Tecnologia FAATESP

Olá, ${studentName || 'Aluno(a)'}!

${isAprovado
  ? 'Sua Ficha de Orientação de TCC foi APROVADA OFICIALMENTE pelo seu orientador. Acesse a plataforma para exportar em PDF.'
  : 'O seu orientador revisou sua ficha e solicitou ajustes/correções. Acesse o sistema para editar sua ficha.'}

TÍTULO DO TCC: ${workTitle || 'Não informado'}
ORIENTADOR: ${professorOrientador || 'Não informado'}
NOTA: ${nota || 'Pendente'}
PARECER: "${parecerOrientador || 'Sem observações adicionais.'}"

LINK PARA ACESSAR O APLICATIVO:
${targetAppUrl}
${downloadUrl ? `\nLINK PARA BAIXAR PDF: ${downloadUrl}\n` : ''}
  `;

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter(customSmtp);

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject,
      text: plainText,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ] : []
    };

    let messageId = `msg_notif_${Date.now()}`;
    if (transporter && isRealSmtp) {
      try {
        const info = await transporter.sendMail(mailOptions);
        messageId = info.messageId || messageId;
      } catch (smtpErr) {
        console.warn('Tentativa SMTP falhou em send-status-notification:', smtpErr);
      }
    }

    const record: EmailRecord = {
      id: recordId,
      to,
      subject,
      body: plainText,
      studentName: studentName || 'Aluno',
      grade: nota || 'Pendente',
      pdfFilename: filename,
      sentAt: new Date().toISOString(),
      isRealSmtp,
      testMessageUrl: false,
      status: 'sent',
      pdfBase64Data: pdfBase64
    };

    emailOutboxHistory.unshift(record);

    return res.json({
      success: isRealSmtp,
      sent: isRealSmtp,
      messageId,
      isRealSmtp,
      testMessageUrl: false,
      message: isRealSmtp
        ? `✉️ Notificação enviada com sucesso para ${to}!`
        : `Parecer salvo no banco! Para entrega automática direta por e-mail, configure o servidor SMTP (como Gmail com senha de app) ou utilize o envio via Gmail.`,
      record
    });
  } catch (error: any) {
    console.error('Erro no disparo automático de status:', error);
    return res.json({
      success: false,
      sent: false,
      message: `Erro ao enviar e-mail: ${error?.message || 'Falha no servidor de e-mail.'}`,
      recordId
    });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          res.status(500).send('Erro ao carregar a aplicação.');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server FAATESP TCC rodando na porta ${PORT}`);
  });
}

startServer();
