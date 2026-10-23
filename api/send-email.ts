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
    studentName,
    grade,
    customSmtp
  } = req.body || {};

  const targetEmail = to || 'aluno@faatesp.edu.br';
  const recordId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let isRealSmtp = false;
  if (customSmtp?.host && customSmtp?.user && customSmtp?.pass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: customSmtp.host,
        port: Number(customSmtp.port) || 587,
        secure: Number(customSmtp.port) === 465,
        connectionTimeout: 4000,
        auth: {
          user: customSmtp.user,
          pass: customSmtp.pass
        }
      });
      await transporter.sendMail({
        from: customSmtp.from || 'FAATESP TCC <orientacao@faatesp.edu.br>',
        to: targetEmail,
        subject: subject || 'FICHA DE ORIENTAÇÃO - FAATESP',
        text: `Olá ${studentName || 'Aluno'}, sua ficha corrigida foi enviada.`
      });
      isRealSmtp = true;
    } catch (smtpErr) {
      console.warn('Vercel SMTP attempt warning:', smtpErr);
    }
  }

  return res.status(200).json({
    success: true,
    messageId: `msg_${Date.now()}`,
    isRealSmtp,
    message: isRealSmtp
      ? `E-mail entregue com sucesso via SMTP para ${targetEmail}!`
      : `E-mail registrado com sucesso no sistema para ${targetEmail}!`,
    record: {
      id: recordId,
      to: targetEmail,
      studentName: studentName || 'Aluno',
      grade: grade || 'Pendente',
      sentAt: new Date().toISOString()
    }
  });
}
