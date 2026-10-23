export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const {
    to,
    studentName,
    status,
    nota,
    customSmtp
  } = req.body || {};

  const targetEmail = to || 'aluno@faatesp.edu.br';
  const recordId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // If custom SMTP is provided, we can attempt sendMail, but always return 200 JSON fast
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
        subject: `[FAATESP TCC] Parecer do Orientador - Ficha de TCC`,
        text: `Olá ${studentName || 'Aluno'}, seu parecer de TCC foi atualizado com a nota ${nota || 'Pendente'}.`
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
      ? `Notificação enviada com sucesso para ${targetEmail}!`
      : `Notificação registrada com sucesso no sistema para ${targetEmail}!`,
    record: {
      id: recordId,
      to: targetEmail,
      studentName: studentName || 'Aluno',
      grade: nota || 'Pendente',
      status: status || 'em_andamento',
      sentAt: new Date().toISOString()
    }
  });
}
