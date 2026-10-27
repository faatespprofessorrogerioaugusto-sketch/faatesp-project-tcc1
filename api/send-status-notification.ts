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
    workTitle,
    professorOrientador,
    nota,
    parecerOrientador,
    appUrl,
    pdfBase64,
    pdfFilename,
    customSmtp
  } = req.body || {};

  const targetEmail = (to || '').trim();
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      sent: false,
      message: 'E-mail do aluno destinatário é inválido ou não informado.'
    });
  }

  const isAprovado = status === 'aprovado' || status === 'concluido';
  const subject = isAprovado
    ? `[FAATESP TCC] 🎉 Parabéns! Sua Ficha de TCC foi APROVADA - Nota: ${nota || '10'}`
    : `[FAATESP TCC] ⚠️ Atualização: Ajustes Solicitados pelo Orientador no TCC`;

  const bannerColor = isAprovado ? '#059669' : '#d97706';
  const statusBadge = isAprovado ? '🟢 APROVADO' : '🟠 NECESSITA AJUSTES';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${bannerColor}; color: #ffffff; padding: 22px; text-align: center;">
        <h2 style="margin: 0; font-size: 19px; font-weight: bold;">Faculdade de Tecnologia FAATESP</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.95;">Parecer Oficial de Orientação de TCC</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Olá, <strong>${studentName || 'Aluno(a)'}</strong>,</p>
        <p style="font-size: 13px; line-height: 1.6;">
          ${isAprovado 
            ? 'Sua Ficha de Orientação de TCC foi revisada e <strong>APROVADA OFICIALMENTE</strong> pelo seu orientador.'
            : 'O seu orientador revisou sua Ficha de Orientação de TCC e apontou <strong>itens que necessitam de correções ou ajustes</strong> antes da aprovação final.'}
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid ${bannerColor}; padding: 14px; margin: 18px 0; border-radius: 6px;">
          <p style="margin: 0 0 6px; font-size: 12px;"><strong>Título do TCC:</strong> ${workTitle || 'Não informado'}</p>
          <p style="margin: 0 0 6px; font-size: 12px;"><strong>Orientador(a):</strong> ${professorOrientador || 'Prof. Orientador'}</p>
          <p style="margin: 0 0 6px; font-size: 12px;"><strong>Situação:</strong> <span style="color: ${bannerColor}; font-weight: bold;">${statusBadge}</span></p>
          <p style="margin: 0; font-size: 12px;"><strong>Nota Atribuída:</strong> <strong>${nota || 'Pendente'}</strong></p>
        </div>

        <div style="margin: 18px 0;">
          <p style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #0f172a;">Parecer do Orientador:</p>
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 14px; border-radius: 8px; font-style: italic; font-size: 12px; color: #92400e; line-height: 1.5;">
            "${parecerOrientador || 'Sem observações adicionais.'}"
          </div>
        </div>

        ${appUrl ? `
          <div style="text-align: center; margin: 26px 0 16px 0;">
            <a href="${appUrl}" style="background-color: ${bannerColor}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">
              Acessar Ficha no Sistema FAATESP
            </a>
          </div>
        ` : ''}

        <p style="font-size: 11px; color: #64748b; margin-top: 20px;">
          * Se o arquivo PDF oficial da Ficha foi anexado a esta mensagem, você pode baixá-lo diretamente pelo seu cliente de e-mail.
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        FAATESP • Faculdade Álvares de Azevedo — Sistema Integrado de TCC
      </div>
    </div>
  `;

  const plainText = `FAATESP - Sistema de TCC\n\nOlá ${studentName || 'Aluno'},\n\nSua Ficha de Orientação de TCC foi atualizada pelo professor orientador:\n\nSituação: ${statusBadge}\nNota: ${nota || 'Pendente'}\nTítulo: ${workTitle || ''}\nOrientador: ${professorOrientador || ''}\n\nParecer:\n"${parecerOrientador || ''}"\n\nAcesse a plataforma: ${appUrl || ''}`;

  // Check if SMTP is configured
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
        subject,
        text: plainText,
        html: htmlBody,
        attachments
      });

      return res.status(200).json({
        success: true,
        sent: true,
        message: `✉️ E-mail oficial entregue com sucesso para ${targetEmail} via servidor SMTP (${smtpHost})!`
      });
    } catch (smtpErr: any) {
      console.error('Erro na entrega via SMTP:', smtpErr);
      return res.status(200).json({
        success: false,
        sent: false,
        error: smtpErr?.message,
        message: `Parecer salvo no banco, mas a entrega ao e-mail ${targetEmail} falhou no servidor SMTP (${smtpHost}): ${smtpErr?.message || 'Erro de autenticação'}. Verifique host, porta e senha de app.`
      });
    }
  }

  // If no SMTP configured, do not pretend email was sent! Return clear warning with direct mail links!
  return res.status(200).json({
    success: false,
    sent: false,
    needsConfig: true,
    message: `Parecer e nota foram salvos com sucesso no banco de dados! Porém, o e-mail não foi entregue porque nenhum servidor SMTP (como Gmail com senha de app) está configurado. Utilize o botão "Enviar via Gmail" ou configure o SMTP nas opções.`
  });
}
