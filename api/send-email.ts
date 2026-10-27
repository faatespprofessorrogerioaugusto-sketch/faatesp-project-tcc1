export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const {
    to,
    subject,
    body,
    pdfBase64,
    pdfFilename,
    studentName,
    grade,
    customSmtp
  } = req.body || {};

  const targetEmail = (to || '').trim();
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      sent: false,
      message: 'E-mail destinatário inválido ou não informado.'
    });
  }

  const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
  const smtpPort = Number(customSmtp?.port || process.env.SMTP_PORT || 587);
  const smtpUser = customSmtp?.user || process.env.SMTP_USER;
  const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;
  const smtpFrom = customSmtp?.from || process.env.SMTP_FROM || 'FAATESP TCC <orientacao@faatesp.edu.br>';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const isSecure = smtpPort === 465;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        tls: {
          rejectUnauthorized: false
        }
      });

      const attachments: any[] = [];
      if (pdfBase64) {
        const clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        attachments.push({
          filename: pdfFilename || 'Ficha_TCC_Oficial.pdf',
          content: Buffer.from(clean, 'base64'),
          contentType: 'application/pdf'
        });
      }

      await transporter.sendMail({
        from: smtpFrom,
        to: targetEmail,
        subject: subject || 'FICHA DE ORIENTAÇÃO - FAATESP',
        text: body || `Olá ${studentName || 'Aluno'}, sua ficha de TCC corrigida foi anexada.`,
        attachments
      });

      return res.status(200).json({
        success: true,
        sent: true,
        message: `✉️ E-mail com PDF entregue com sucesso via SMTP para ${targetEmail}!`
      });
    } catch (smtpErr: any) {
      console.error('Erro ao enviar via SMTP:', smtpErr);
      return res.status(200).json({
        success: false,
        sent: false,
        error: smtpErr?.message,
        message: `Falha na entrega via SMTP (${smtpHost}): ${smtpErr?.message || 'Erro de autenticação'}. Verifique host e senha de app.`
      });
    }
  }

  return res.status(200).json({
    success: false,
    sent: false,
    needsConfig: true,
    message: `Envio direto por servidor requer configuração de SMTP (como Gmail com senha de app). Utilize as opções de envio via Gmail/Outlook ou configure o SMTP.`
  });
}
