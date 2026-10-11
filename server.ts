import express from 'express';
import path from 'path';
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

// Middleware for parsing JSON with large payload support for PDF attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// API Endpoint to download PDF file directly via link from email
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

// API Endpoint to send email with PDF attachment
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, pdfBase64, pdfFilename, studentName, grade, customSmtp } = req.body;

  if (!to || !pdfBase64) {
    return res.status(400).json({
      success: false,
      message: 'E-mail do destinatário e arquivo PDF são obrigatórios.'
    });
  }

  const recordId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filename = pdfFilename || 'Ficha_Orientacao_Corrigida.pdf';

  // Convert base64 PDF data to Buffer and store for download link endpoint
  const base64Clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const pdfBuffer = Buffer.from(base64Clean, 'base64');
  pdfStore.set(recordId, { pdfBuffer, filename });

  const hostUrl = `${req.protocol}://${req.get('host')}`;
  const downloadUrl = `${hostUrl}/api/download-pdf/${recordId}`;

  try {
    let transporter: any;
    let isRealSmtp = false;
    let fromAddress = process.env.SMTP_FROM || 'FAATESP TCC <orientacao@faatesp.edu.br>';

    // 1. Check custom user SMTP or Environment SMTP
    const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
    const smtpPort = Number(customSmtp?.port || process.env.SMTP_PORT || 587);
    const smtpUser = customSmtp?.user || process.env.SMTP_USER;
    const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      isRealSmtp = true;
      if (customSmtp?.from) fromAddress = customSmtp.from;
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // 2. Fallback to Ethereal Email test account for real preview link
      console.log('Nenhum servidor SMTP real configurado em .env. Criando conta Ethereal para teste real...');
      const testAccount = await nodemailer.createTestAccount();
      fromAddress = `"FAATESP TCC (Simulador)" <${testAccount.user}>`;
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const plainTextBody = `${body}\n\n----------------------------------------\n📄 LINK PARA BAIXAR SUA FICHA EM PDF:\n${downloadUrl}\n----------------------------------------`;

    // Mail options
    const mailOptions = {
      from: fromAddress,
      to,
      subject: subject || '[FAATESP TCC] Ficha de Orientação de TCC Corrigida com Nota',
      text: plainTextBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; color: #1e293b; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Faculdade de Tecnologia FAATESP</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Ficha de Orientação e Parecer Final de TCC</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            
            <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px;">
              <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 13px; color: #312e81;">RESUMO DO TCC CORRIGIDO:</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Aluno(a):</strong> ${studentName || 'Não informado'}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Nota Atribuída:</strong> <span style="display: inline-block; background-color: #fef3c7; color: #78350f; font-weight: bold; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">${grade || 'Pendente'}</span></p>
            </div>

            <!-- Direct Download Button inside Email Body -->
            <div style="margin: 28px 0; text-align: center;">
              <a href="${downloadUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(37,99,235,0.25);">
                📄 Clique aqui para Baixar / Visualizar Ficha do TCC em PDF
              </a>
            </div>

            <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 8px;">
              Link direto alternativo: <a href="${downloadUrl}" target="_blank" style="color: #2563eb; word-break: break-all;">${downloadUrl}</a>
            </p>

            <div style="margin-top: 20px; padding: 12px; background-color: #e0e7ff; border-radius: 8px; font-size: 12px; color: #3730a3; text-align: center;">
              📎 <strong>Anexo do e-mail:</strong> O arquivo <code>${filename}</code> também foi anexado a esta mensagem.
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Sistema de Gestão de TCC - FAATESP • Este é um e-mail automático enviado pelo orientador.
          </div>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    const testMessageUrl = isRealSmtp ? false : nodemailer.getTestMessageUrl(info);

    const record: EmailRecord = {
      id: recordId,
      to,
      subject,
      body,
      studentName: studentName || 'Aluno',
      grade: grade || 'Pendente',
      pdfFilename: filename,
      sentAt: new Date().toISOString(),
      isRealSmtp,
      testMessageUrl,
      status: 'sent',
      pdfBase64Data: pdfBase64
    };

    emailOutboxHistory.unshift(record);

    res.json({
      success: true,
      messageId: info.messageId,
      isRealSmtp,
      testMessageUrl,
      message: isRealSmtp
        ? `E-mail com PDF entregue com sucesso via SMTP real para ${to}!`
        : `E-mail processado com sucesso no servidor. (Para enviar direto para a caixa do ${to} sem restrição de SPAM do Google, use a opção 'Abrir no Gmail Web' no topo ou informe sua Senha de App do Gmail na aba Servidor SMTP).`,
      record
    });
  } catch (error: any) {
    console.error('Erro no envio de e-mail:', error);
    
    const record: EmailRecord = {
      id: recordId,
      to,
      subject,
      body,
      studentName: studentName || 'Aluno',
      grade: grade || 'Pendente',
      pdfFilename: filename,
      sentAt: new Date().toISOString(),
      isRealSmtp: false,
      status: 'failed',
      errorMessage: error.message || 'Erro no servidor de e-mail',
      pdfBase64Data: pdfBase64
    };
    emailOutboxHistory.unshift(record);

    res.status(500).json({
      success: false,
      message: `Erro ao enviar e-mail: ${error.message || 'Falha no servidor SMTP'}. O PDF continuará disponível para download local.`,
      error: error.message
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
