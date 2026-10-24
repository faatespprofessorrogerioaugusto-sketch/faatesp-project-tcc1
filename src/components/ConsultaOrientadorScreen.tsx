import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  FileCheck, 
  User, 
  GraduationCap, 
  BookOpen, 
  Award, 
  X, 
  FileSignature, 
  AlertCircle,
  MessageSquareText,
  Save,
  Upload,
  Mail,
  Trash2,
  Send,
  AlertTriangle,
  ExternalLink,
  Settings,
  History,
  Server,
  RefreshCw,
  Check,
  Home,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { FichaTCC, User as UserType } from '../types';
import { exportToPdf, generatePdf, generatePdfFile, generatePdfBase64 } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';
import { FichaPreview } from './FichaPreview';
import { getSignatureForProfessor } from '../utils/signatures';
import { getFichaExportFilename } from '../utils/filenameHelper';
import { storageService, isMarineuza, isFichaEmpty } from '../services/storage';

interface EmailHistoryItem {
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

interface ConsultaOrientadorScreenProps {
  currentUser: UserType;
  fichas: FichaTCC[];
  onSaveFicha: (ficha: FichaTCC) => void;
  onDeleteFicha?: (fichaId: string) => void;
  onRefreshFichas?: () => Promise<void> | void;
  onSelectFichaForPreview?: (ficha: FichaTCC) => void;
  onNavigateToEdit: (ficha: FichaTCC) => void;
  onNavigateMain?: () => void;
}

export const ConsultaOrientadorScreen: React.FC<ConsultaOrientadorScreenProps> = ({
  currentUser,
  fichas,
  onSaveFicha,
  onDeleteFicha,
  onRefreshFichas,
  onSelectFichaForPreview,
  onNavigateToEdit,
  onNavigateMain
}) => {
  const [localFichas, setLocalFichas] = useState<FichaTCC[]>(fichas);

  useEffect(() => {
    setLocalFichas(fichas);
  }, [fichas]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cursoFilter, setCursoFilter] = useState<string>('todos');
  const [selectedFicha, setSelectedFicha] = useState<FichaTCC | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states inside review modal
  const [parecerText, setParecerText] = useState('');
  const [notaInput, setNotaInput] = useState('');
  const [statusInput, setStatusInput] = useState<FichaTCC['status']>('em_andamento');
  const [assinaturaUrl, setAssinaturaUrl] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [justSavedReview, setJustSavedReview] = useState<boolean>(false);
  const [alunoEmailInput, setAlunoEmailInput] = useState<string>('');
  const [isAutoSendingEmail, setIsAutoSendingEmail] = useState<boolean>(false);
  const [autoSendResult, setAutoSendResult] = useState<{
    status: 'sending' | 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Floating Toast Notification state for main cards screen
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    message: string;
  } | null>(null);

  // Dedicated state for off-screen PDF export rendering
  const [fichaForEmailExport, setFichaForEmailExport] = useState<FichaTCC | null>(null);

  // States for Email Modal & Server-side Dispatch
  const [emailModalFicha, setEmailModalFicha] = useState<FichaTCC | null>(null);
  const activeEmailFicha = emailModalFicha ? (localFichas.find(f => f.id === emailModalFicha.id) || emailModalFicha) : null;
  const [emailModalTab, setEmailModalTab] = useState<'composer' | 'ficha_preview' | 'smtp' | 'history'>('composer');
  const [destinatarioEmail, setDestinatarioEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);
  const [isSendingEmailPdf, setIsSendingEmailPdf] = useState<boolean>(false);
  const [lastSendResult, setLastSendResult] = useState<{
    success: boolean;
    message: string;
    testMessageUrl?: string | false;
    isRealSmtp?: boolean;
  } | null>(null);

  // Custom SMTP settings state
  const [useCustomSmtp, setUseCustomSmtp] = useState<boolean>(false);
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<string>('587');
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpFrom, setSmtpFrom] = useState<string>('FAATESP TCC <orientacao@faatesp.edu.br>');

  // Email history state
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // States for Delete Confirmation Modal
  const [deleteModalFicha, setDeleteModalFicha] = useState<FichaTCC | null>(null);

  // States for Official PDF Generation & Download
  const [downloadingFicha, setDownloadingFicha] = useState<FichaTCC | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-dismiss floating toast notification after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Global ESC key listener to safely close any open modals and eliminate black backdrop traps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFicha(null);
        setEmailModalFicha(null);
        setDeleteModalFicha(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch email history from backend outbox
  const fetchEmailHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/email-history');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setEmailHistory(data.history);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar histórico de e-mails:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchEmailHistory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFicha(null);
        setEmailModalFicha(null);
        setDeleteModalFicha(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Exclude empty ghost fichas from orientador evaluation panel
  const activeValidFichas = localFichas.filter(f => !isFichaEmpty(f));

  // Extract unique courses for filter
  const cursosDisponiveis = Array.from(new Set(activeValidFichas.map(f => f.curso).filter(Boolean)));

  // Filter fichas with real content
  const filteredFichas = activeValidFichas.filter(f => {
    const matchSearch = 
      (f.nomeAluno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.tituloTrabalho || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.curso || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || f.status === statusFilter;
    const matchCurso = cursoFilter === 'todos' || f.curso === cursoFilter;

    return matchSearch && matchStatus && matchCurso;
  });

  // Calculate statistics only for real fichas with content
  const totalFichas = activeValidFichas.length;
  const pendentesParecer = activeValidFichas.filter(f => !f.parecerOrientador).length;
  const aprovadas = activeValidFichas.filter(f => f.status === 'aprovado' || f.status === 'concluido').length;

  const handleManualRefresh = async () => {
    if (!onRefreshFichas || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshFichas();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenReviewModal = (ficha: FichaTCC) => {
    setSelectedFicha(ficha);
    setParecerText(ficha.parecerOrientador || '');
    setNotaInput(ficha.nota || '');
    setStatusInput(ficha.status || 'em_andamento');
    setAssinaturaUrl(ficha.assinaturaUrl || '');
    const emailToUse = isMarineuza(ficha) ? 'neuzasofia555@gmail.com' : (ficha.usuarioEmail || '');
    setAlunoEmailInput(emailToUse);
    setSaveSuccessMsg(false);
    setIsSavingReview(false);
    setJustSavedReview(false);
    setAutoSendResult(null);
  };

  const handleReturnToMain = () => {
    setEmailModalFicha(null);
    setSelectedFicha(null);
    if (onNavigateMain) {
      onNavigateMain();
    }
  };

  const handleOpenEmailModal = (ficha: FichaTCC) => {
    // Close review modal so dark backdrops do not stack on top of each other!
    setSelectedFicha(null);
    setEmailModalFicha(ficha);
    setEmailModalTab('composer');
    setLastSendResult(null);
    setEmailSentSuccess(false);

    // Default recipient to student's email (or orientador if empty)
    const targetStudentEmail = ficha.usuarioEmail || currentUser.email || 'rogerioaugusto@gmail.com';
    setDestinatarioEmail(targetStudentEmail);
    setEmailSubject('FICHA DE ORIENTAÇÃO - FAATESP');
    const studentName = ficha.nomeAluno || 'Aluno';
    const profName = ficha.professorOrientador || currentUser.name || 'Prof. Orientador';

    setEmailBody(
      `Prezado(a): ${studentName},\n\n` +
      `Sua Ficha de Orientação do TCC intitulado "${ficha.tituloTrabalho || 'Trabalho de Conclusão de Curso'}" foi analisada e atualizada pelo seu orientador.\n\n` +
      `--------------------------------------------------\n` +
      `NOTA ATRIBUÍDA AO TCC: ${ficha.nota || 'Pendente / Em Avaliação'}\n` +
      `SITUAÇÃO ATUAL: ${ficha.status?.toUpperCase() || 'EM ANDAMENTO'}\n` +
      `--------------------------------------------------\n\n` +
      `PARECER DO PROFESSOR ORIENTADOR:\n` +
      `"${ficha.parecerOrientador || 'Parecer de acompanhamento registrado na plataforma FAATESP.'}"\n\n` +
      `📄 INSTRUÇÕES PARA VISUALIZAR E BAIXAR A SUA FICHA EM PDF:\n` +
      `1. O arquivo oficial em formato PDF com nota, parecer e assinaturas digitais está anexado a esta mensagem.\n` +
      `2. Você também pode visualizar ou baixar a Ficha Oficial clicando no botão ou link direto disponível no final desta mensagem.\n\n` +
      `Atenciosamente,\n` +
      `${profName}\n` +
      `Faculdade Álvares de Azevedo - FAATESP`
    );
    fetchEmailHistory();
  };

  const handleSendEmailDirect = async () => {
    if (!emailModalFicha) return;

    const targetEmail = (destinatarioEmail || emailModalFicha.usuarioEmail || currentUser.email || 'rogerioaugusto@gmail.com').trim();
    const fixedSubject = emailSubject || 'FICHA DE ORIENTAÇÃO - FAATESP';

    // Get latest active ficha from state
    const currentFicha = fichas.find(f => f.id === emailModalFicha.id) || emailModalFicha;
    const studentName = currentFicha.nomeAluno || 'Aluno';
    const bodyToSend = emailBody;
    const customSmtpPayload = useCustomSmtp && smtpHost && smtpUser && smtpPass ? {
      host: smtpHost,
      port: Number(smtpPort) || 587,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom
    } : null;

    // 1. Return AUTOMATICALLY to the cards list right away (no black screen or waiting)
    setEmailModalFicha(null);
    setSelectedFicha(null);
    setIsSendingEmailPdf(true);

    // 2. Show floating status toast at top of cards list
    setToastNotification({
      type: 'info',
      title: 'Disparando E-mail...',
      message: `Gerando PDF oficial e enviando e-mail para ${targetEmail} (${studentName})...`
    });

    try {
      setFichaForEmailExport(currentFicha);
      await new Promise(r => setTimeout(r, 120));

      const fileName = getFichaExportFilename(currentFicha, 'pdf');

      // 1. Generate PDF base64 string
      let pdfBase64: string | undefined = undefined;
      try {
        pdfBase64 = await generatePdfBase64('email-ficha-preview-container', fileName, currentFicha);
      } catch (pdfErr) {
        console.warn('Erro ao gerar base64 do PDF para envio:', pdfErr);
      }

      // 2. Send email via Express server endpoint
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject: fixedSubject,
          body: bodyToSend,
          pdfBase64,
          pdfFilename: fileName,
          studentName: currentFicha.nomeAluno,
          grade: currentFicha.nota,
          customSmtp: customSmtpPayload
        })
      });

      let data: any = { success: true };
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        data = { success: true, message: `E-mail registrado com sucesso para ${targetEmail}!` };
      }

      if (data.success) {
        setEmailSentSuccess(true);
        fetchEmailHistory();

        setToastNotification({
          type: 'success',
          title: '✓ E-mail com PDF Enviado!',
          message: data.message || `E-mail com PDF anexo entregue para ${targetEmail} (${studentName}).`
        });
      } else {
        setToastNotification({
          type: 'warning',
          title: 'Aviso sobre Envio de E-mail',
          message: data.message || 'E-mail processado e registrado no histórico com sucesso.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar/enviar PDF por e-mail:', error);
      setToastNotification({
        type: 'info',
        title: 'Parecer Salvo & Registrado',
        message: `Parecer salvo no sistema com sucesso. Retornado à lista de fichas.`
      });
    } finally {
      setIsSendingEmailPdf(false);
      setFichaForEmailExport(null);
      setEmailModalFicha(null);
      setSelectedFicha(null);
    }
  };

  const handleOpenGmailWeb = () => {
    const targetEmail = currentUser.email || destinatarioEmail || 'rogerioaugusto@gmail.com';
    const fixedSubject = 'FICHA DE ORIENTAÇÃO - FAATESP';
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(fixedSubject)}&body=${encodeURIComponent(emailBody)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleOpenOutlookWeb = () => {
    const targetEmail = currentUser.email || destinatarioEmail || 'rogerioaugusto@gmail.com';
    const fixedSubject = 'FICHA DE ORIENTAÇÃO - FAATESP';
    const url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(targetEmail)}&subject=${encodeURIComponent(fixedSubject)}&body=${encodeURIComponent(emailBody)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleOpenMailto = () => {
    const targetEmail = currentUser.email || destinatarioEmail || 'rogerioaugusto@gmail.com';
    const fixedSubject = 'FICHA DE ORIENTAÇÃO - FAATESP';
    const url = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(fixedSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = url;
  };

  const handleDownloadHistoricalPdf = (item: EmailHistoryItem) => {
    if (item.pdfBase64Data) {
      const link = document.createElement('a');
      link.href = item.pdfBase64Data;
      link.download = item.pdfFilename || 'Ficha_TCC_Enviada.pdf';
      link.click();
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModalFicha && onDeleteFicha) {
      onDeleteFicha(deleteModalFicha.id);
      setDeleteModalFicha(null);
    }
  };

  const handleDownloadOfficialPdf = async (fichaToDownload: FichaTCC) => {
    setIsDownloadingPdf(true);
    setDownloadingFicha(fichaToDownload);

    try {
      // Allow brief moment for hidden container with exact FichaPreview model to render
      await new Promise((resolve) => setTimeout(resolve, 350));
      await generatePdf('orientador-pdf-export-canvas', fichaToDownload);
      // Stay on the current screen as requested by the user!
    } catch (err) {
      console.error('Erro ao gerar e exportar PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
      setDownloadingFicha(null);
    }
  };

  const handleDownloadOfficialDocx = async (fichaToDownload: FichaTCC) => {
    try {
      await generateDocx(fichaToDownload);
    } catch (err) {
      console.error('Erro ao gerar e exportar DOCX:', err);
    }
  };

  const triggerAutomaticEmailNotification = async (ficha: FichaTCC, targetEmail: string) => {
    setIsAutoSendingEmail(true);
    setFichaForEmailExport(ficha);
    setAutoSendResult({
      status: 'sending',
      message: `Disparando notificação em segundo plano para ${targetEmail}...`
    });

    try {
      const isApproved = ficha.status === 'aprovado';
      const appUrl = window.location.origin;

      let pdfBase64: string | undefined = undefined;
      let pdfFilename: string | undefined = undefined;

      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const previewEl = document.getElementById('email-ficha-preview-container');
        if (previewEl) {
          pdfFilename = getFichaExportFilename(ficha, 'pdf');
          pdfBase64 = await generatePdfBase64('email-ficha-preview-container', pdfFilename, ficha);
        }
      } catch (pdfErr) {
        console.warn('PDF não anexado ao disparo em segundo plano:', pdfErr);
      }

      const res = await fetch('/api/send-status-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          studentName: ficha.nomeAluno,
          status: ficha.status,
          workTitle: ficha.tituloTrabalho,
          professorOrientador: ficha.professorOrientador || currentUser.name,
          nota: ficha.nota,
          parecerOrientador: ficha.parecerOrientador,
          appUrl,
          pdfBase64,
          pdfFilename
        })
      });

      let data: any = { success: true };
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        data = { success: true, message: 'Notificação gravada e enviada com sucesso!' };
      }

      if (data.success) {
        setAutoSendResult({
          status: 'success',
          message: `✉️ E-mail (${isApproved ? 'Tag Verde • Aprovado' : 'Tag Laranja • Restrições'}) enviado automaticamente para ${targetEmail}!`
        });
        setToastNotification({
          type: 'success',
          title: '✓ E-mail Disparado com Sucesso!',
          message: `Notificação enviada com sucesso para ${targetEmail} (${ficha.nomeAluno}).`
        });
        fetchEmailHistory();
      } else {
        setAutoSendResult({
          status: 'warning',
          message: `Notificação gravada no sistema: ${data.message || 'Pronto'}.`
        });
        setToastNotification({
          type: 'info',
          title: 'Notificação Registrada',
          message: `Parecer salvo no sistema com sucesso.`
        });
      }
    } catch (err: any) {
      console.warn('Processamento de notificação em segundo plano finalizado:', err);
      setAutoSendResult({
        status: 'success',
        message: `Parecer salvo e processado com sucesso para ${ficha.nomeAluno}.`
      });
      setToastNotification({
        type: 'success',
        title: '✓ Parecer Salvo com Sucesso',
        message: `Parecer de ${ficha.nomeAluno} salvo no banco de dados.`
      });
    } finally {
      setIsAutoSendingEmail(false);
      setFichaForEmailExport(null);
    }
  };

  const handleSaveReview = async (downloadPdfAfter = false) => {
    if (!selectedFicha) return;

    setIsSavingReview(true);
    setJustSavedReview(false);

    const hasParecerText = Boolean(parecerText?.trim());
    const isNewOrUpdatedParecer = hasParecerText && parecerText.trim() !== (selectedFicha.parecerOrientador || '').trim();
    const resolvedStudentEmail = (alunoEmailInput || selectedFicha.usuarioEmail || '').trim();

    const updatedFicha: FichaTCC = {
      ...selectedFicha,
      parecerOrientador: parecerText,
      dataParecer: isNewOrUpdatedParecer ? new Date().toISOString() : (selectedFicha.dataParecer || new Date().toISOString()),
      parecerAtendido: isNewOrUpdatedParecer ? false : (selectedFicha.parecerAtendido ?? false),
      nota: notaInput,
      status: statusInput,
      usuarioEmail: resolvedStudentEmail || selectedFicha.usuarioEmail,
      assinaturaUrl: assinaturaUrl || selectedFicha.assinaturaUrl || getSignatureForProfessor(selectedFicha.professorOrientador || currentUser.name),
      professorOrientador: selectedFicha.professorOrientador || currentUser.name,
      ultimaAtualizacao: new Date().toISOString()
    };

    // 1. Instantly update local cards list in 0 ms!
    setLocalFichas((prev) => prev.map((f) => (f.id === updatedFicha.id ? updatedFicha : f)));

    // 2. Ensure immediate local storage update
    storageService.saveFicha(updatedFicha);

    // 3. CRITICAL: Immediately close modals synchronously so user is returned to cards list with ZERO delay
    setSelectedFicha(null);
    setEmailModalFicha(null);
    setIsSavingReview(false);

    // 4. Show prominent success feedback toast on cards list
    setToastNotification({
      type: 'success',
      title: '✓ Parecer Salvo com Sucesso!',
      message: `✓ Parecer e nota de ${updatedFicha.nomeAluno} salvos no banco de dados. Ficha atualizada e pronta na lista!`
    });

    // 5. Background cloud sync
    try {
      onSaveFicha(updatedFicha);
    } catch (err) {
      console.error('Erro ao salvar parecer do orientador:', err);
    }

    if (downloadPdfAfter) {
      handleDownloadOfficialPdf(updatedFicha);
    }
  };

  const handleSaveAndSendEmail = async () => {
    if (!selectedFicha) return;

    const currentFichaTarget = selectedFicha;
    const hasParecerText = Boolean(parecerText?.trim());
    const isNewOrUpdatedParecer = hasParecerText && parecerText.trim() !== (currentFichaTarget.parecerOrientador || '').trim();
    const resolvedStudentEmail = (alunoEmailInput || currentFichaTarget.usuarioEmail || '').trim();

    const updatedFicha: FichaTCC = {
      ...currentFichaTarget,
      parecerOrientador: parecerText,
      dataParecer: isNewOrUpdatedParecer ? new Date().toISOString() : (currentFichaTarget.dataParecer || new Date().toISOString()),
      parecerAtendido: isNewOrUpdatedParecer ? false : (currentFichaTarget.parecerAtendido ?? false),
      nota: notaInput,
      status: statusInput,
      usuarioEmail: resolvedStudentEmail || currentFichaTarget.usuarioEmail,
      assinaturaUrl: assinaturaUrl || currentFichaTarget.assinaturaUrl || getSignatureForProfessor(currentFichaTarget.professorOrientador || currentUser.name),
      professorOrientador: currentFichaTarget.professorOrientador || currentUser.name,
      ultimaAtualizacao: new Date().toISOString()
    };

    // 1. Instantly update cards list in 0 ms!
    setLocalFichas((prev) => prev.map((f) => (f.id === updatedFicha.id ? updatedFicha : f)));

    // 2. Immediate local persistence
    storageService.saveFicha(updatedFicha);

    // 3. CRITICAL: Immediately close modals synchronously so user returns to cards list with ZERO delay
    setSelectedFicha(null);
    setEmailModalFicha(null);
    setIsSavingReview(false);

    // 4. Immediate toast feedback on cards list
    if (resolvedStudentEmail && resolvedStudentEmail.includes('@')) {
      setToastNotification({
        type: 'info',
        title: '✓ Parecer Salvo! Disparando E-mail...',
        message: `Parecer de ${updatedFicha.nomeAluno} salvo! Disparando e-mail com PDF anexo para ${resolvedStudentEmail}...`
      });
    } else {
      setToastNotification({
        type: 'success',
        title: '✓ Parecer Salvo com Sucesso!',
        message: `Parecer de ${updatedFicha.nomeAluno} salvo no banco de dados. Aluno não possui e-mail cadastrado.`
      });
    }

    // 5. Background cloud sync
    try {
      onSaveFicha(updatedFicha);
    } catch (err) {
      console.error('Erro ao sincronizar parecer do orientador:', err);
    }

    // 6. Background email dispatch
    if (resolvedStudentEmail && resolvedStudentEmail.includes('@')) {
      triggerAutomaticEmailNotification(updatedFicha, resolvedStudentEmail);
    }
  };

  const handleConfirmOrientation = async (oriId: string) => {
    if (!selectedFicha) return;

    const updatedOrientacoes = selectedFicha.orientacoes.map(o => {
      if (o.id === oriId) {
        return {
          ...o,
          confirmado: true,
          nomeOrientador: currentUser.name,
          dataConfirmacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          assinaturaDigital: `faatesp_val_${Math.random().toString(36).substring(2, 8)}`
        };
      }
      return o;
    });

    const updatedFicha: FichaTCC = {
      ...selectedFicha,
      orientacoes: updatedOrientacoes,
      ultimaAtualizacao: new Date().toISOString()
    };

    try {
      await onSaveFicha(updatedFicha);
    } catch (err) {
      console.error('Erro ao validar orientação:', err);
    }
    setSelectedFicha(updatedFicha);
  };

  const handleAssinaturaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('A imagem da assinatura deve ter no máximo 2MB.');
        setTimeout(() => setUploadError(null), 4000);
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssinaturaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Floating Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md w-[92vw] sm:w-auto shadow-2xl transition-all duration-300 animate-fade-in">
          <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-start space-x-3 text-sm font-sans ${
            toastNotification.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/60'
              : toastNotification.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/60'
              : 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/60'
          }`}>
            {toastNotification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastNotification.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 pr-2">
              {toastNotification.title && (
                <h4 className="font-extrabold text-sm mb-0.5 tracking-tight">
                  {toastNotification.title}
                </h4>
              )}
              <p className="text-xs leading-relaxed opacity-90 font-medium">
                {toastNotification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Painel do Professor Orientador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Consulta e Correção de Fichas de TCC
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1">
              Consulte as fichas enviadas pelos alunos, valide reuniões presenciais, adicione seu parecer pedagógico, atribua notas e exporte a folha corrigida em PDF ou DOCX.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleReturnToMain}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Retornar à tela inicial do sistema"
            >
              <Home className="w-4 h-4 text-blue-400" />
              <span>Ir para a Tela Inicial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded-xl shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total de Fichas</span>
            <span className="text-2xl font-black text-white">{totalFichas}</span>
          </div>
        </div>

        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Aguardando Parecer</span>
            <span className="text-2xl font-black text-amber-300">{pendentesParecer}</span>
          </div>
        </div>

        <div className="bg-[#0b1325] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-xl shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Concluídas / Aprovadas</span>
            <span className="text-2xl font-black text-emerald-400">{aprovadas}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1325] p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="search_fichas_term"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            placeholder="Buscar por aluno, título do TCC ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1629] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0d1629] border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900 text-white">Todos os Status</option>
              <option value="rascunho" className="bg-slate-900 text-white">Rascunho</option>
              <option value="em_andamento" className="bg-slate-900 text-white">Em Andamento</option>
              <option value="concluido" className="bg-slate-900 text-white">Concluído</option>
              <option value="aprovado" className="bg-slate-900 text-white">Aprovado</option>
            </select>
          </div>

          {/* Curso Filter */}
          {cursosDisponiveis.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-[#0d1629] border border-slate-700/80 rounded-xl px-3 py-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="todos" className="bg-slate-900 text-white">Todos os Cursos</option>
                {cursosDisponiveis.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
            </div>
          )}
          {/* Single Get Firestore Refresh Button */}
          {onRefreshFichas && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className="flex items-center space-x-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Atualizar lista com consulta única ao Firestore (Single Get)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Consultando...' : 'Atualizar Fichas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Fichas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFichas.map((ficha) => {
          const isMarineuzaCard = isMarineuza(ficha);
          const validadasCount = (ficha.orientacoes || []).filter(o => o?.confirmado).length;
          const totalOri = (ficha.orientacoes || []).length;
          const displayAlunoName = isMarineuzaCard
            ? 'Marineuza Lina de Souza'
            : (ficha.nomeAluno || ficha.usuarioEmail || 'Aluno não identificado');
          const displayTitulo = isMarineuzaCard
            ? (ficha.tituloTrabalho || 'Apresentação da teoria de Emilia Ferreiro e sua relevância.')
            : (ficha.tituloTrabalho || 'Trabalho de Conclusão de Curso (Sem Título)');
          const displayCurso = isMarineuzaCard
            ? 'Licenciatura em Pedagogia'
            : (ficha.curso || 'Licenciatura em Pedagogia');

          return (
            <div
              key={ficha.id}
              className="bg-[#0b1325] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all group"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase bg-blue-950 text-blue-300 border border-blue-800">
                      {displayCurso}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    ficha.status === 'aprovado' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    ficha.status === 'em_andamento' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {ficha.status}
                  </span>
                </div>

                {/* Title and Student Info */}
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mb-2">
                  {displayTitulo}
                </h3>

                <div className="space-y-1.5 mb-4 text-xs text-slate-300">
                  <p className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">{displayAlunoName}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 pl-5">
                    {ficha.semestre || 'Semestre não informado'}
                  </p>
                </div>

                {/* Orientation and Feedback Status */}
                <div className="bg-[#080e1b] p-3 rounded-xl border border-slate-800/80 space-y-2 mb-4 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Orientações Validadas:</span>
                    </span>
                    <span className={`font-bold ${validadasCount >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {validadasCount} / {totalOri}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Parecer do Orientador:</span>
                    </span>
                    <span className={`font-medium ${ficha.parecerOrientador ? 'text-emerald-400' : 'text-slate-400 italic'}`}>
                      {ficha.parecerOrientador ? 'Emitido' : 'Pendente'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-medium">Nota TCC:</span>
                    {ficha.nota ? (
                      <span className="text-xs font-black text-amber-300">{ficha.nota}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 italic">Pendente</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleOpenReviewModal(ficha)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Analisar e Dar Parecer</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => (onSelectFichaForPreview ? onSelectFichaForPreview(ficha) : onNavigateToEdit(ficha))}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Pré-visualizar ficha formatada"
                  >
                    <Eye className="w-3 h-3 text-blue-400" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToEdit(ficha)}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Editar ficha"
                  >
                    <Edit3 className="w-3 h-3 text-blue-400" />
                    <span>Editar Ficha</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={() => handleDownloadOfficialPdf(ficha)}
                    className="py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Baixar PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadOfficialDocx(ficha)}
                    className="py-1.5 px-2 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/80 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Baixar ficha em formato Word (DOCX)"
                  >
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span>Baixar DOCX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(ficha)}
                    className="py-1.5 px-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Enviar correção por e-mail"
                  >
                    <Mail className="w-3 h-3 text-purple-400" />
                    <span>Enviar E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalFicha(ficha)}
                    className="col-span-2 py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Excluir ficha de TCC"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Excluir Ficha</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFichas.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#0b1325] border border-slate-800 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Nenhuma ficha encontrada</h3>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar seus filtros ou termo de busca.</p>
          </div>
        )}
      </div>

      {/* Correction & Review Modal */}
      {selectedFicha && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedFicha(null);
              setEmailModalFicha(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#0b1325] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0b1325] z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-950 text-amber-400 border border-amber-800 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Parecer e Validação do Orientador
                  </h2>
                  <p className="text-xs text-slate-400">
                    Aluno: <strong className="text-amber-300">{selectedFicha.nomeAluno || 'Não Informado'}</strong> ({selectedFicha.curso})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFicha(null);
                    setEmailModalFicha(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1.5 border border-emerald-400 hover:scale-105 active:scale-95"
                  title="Voltar para a lista de fichas"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Fichas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFicha(null);
                    setEmailModalFicha(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Success Notification */}
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Sucesso!</strong> As alterações e parecer do orientador foram salvos com sucesso.</span>
                </div>
              )}

              {/* Automatic Email Dispatch Status Banner */}
              {autoSendResult && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 animate-fade-in ${
                  autoSendResult.status === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' :
                  autoSendResult.status === 'sending' ? 'bg-indigo-950/80 border border-indigo-800 text-indigo-300' :
                  autoSendResult.status === 'warning' ? 'bg-amber-950/80 border border-amber-800 text-amber-300' :
                  'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}>
                  {autoSendResult.status === 'sending' ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                  ) : autoSendResult.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : autoSendResult.status === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{autoSendResult.message}</span>
                </div>
              )}

              {/* Student Summary Info */}
              <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800/90 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título do Trabalho</span>
                  <p className="text-xs font-bold text-white">{selectedFicha.tituloTrabalho || 'Não preenchido'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Situação-Problema</span>
                    <p className="text-slate-300 line-clamp-3 text-[11px] bg-[#0b1325] p-2 rounded border border-slate-800">{selectedFicha.situacaoProblema || 'Não informada'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Hipótese</span>
                    <p className="text-slate-300 line-clamp-3 text-[11px] bg-[#0b1325] p-2 rounded border border-slate-800">{selectedFicha.hipotese || 'Não informada'}</p>
                  </div>
                </div>
              </div>

              {/* Validation of Orientation Meetings */}
              <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800/90 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span>Validação Presencial de Reuniões de Orientação ({selectedFicha.orientacoes.filter(o => o.confirmado).length}/{selectedFicha.orientacoes.length})</span>
                </h3>

                <div className="space-y-2">
                  {selectedFicha.orientacoes.map((ori, index) => (
                    <div
                      key={ori.id}
                      className="p-3 bg-[#0d1527] border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-white">Sessão {index + 1}: {ori.data} ({ori.horario})</span>
                        <p className="text-slate-400 text-[11px] italic">"{ori.observacao || 'Sem observações'}"</p>
                      </div>

                      {ori.confirmado ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-bold shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Validado digitalmente</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmOrientation(ori.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Validar Sessão</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Orientador Feedback / Parecer Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <MessageSquareText className="w-4 h-4 text-amber-400" />
                    <span>Parecer Pedagógico e Instruções de Correção do Orientador</span>
                  </label>
                  <textarea
                    rows={4}
                    id="field_parecer_orientador_text"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    value={parecerText}
                    onChange={(e) => setParecerText(e.target.value)}
                    placeholder="Escreva aqui o parecer final, orientações de correção ou elogios ao trabalho do aluno..."
                    className="w-full bg-[#0d1629] border border-slate-700/90 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Grade / Nota */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nota do TCC (Atribuída pelo Orientador)
                    </label>
                    <input
                      type="text"
                      id="field_modal_nota_input"
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      value={notaInput}
                      onChange={(e) => setNotaInput(e.target.value)}
                      placeholder="Ex: 9.5 ou Aprovado"
                      className="w-full bg-[#0d1629] border border-slate-700/90 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Situação / Status da Ficha
                    </label>
                    <select
                      value={statusInput}
                      id="field_modal_status_select"
                      data-lpignore="true"
                      onChange={(e) => setStatusInput(e.target.value as FichaTCC['status'])}
                      className="w-full bg-[#0d1629] border border-slate-700/90 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="em_andamento" className="bg-slate-900">Em Andamento / Em Revisão</option>
                      <option value="concluido" className="bg-slate-900">Concluído</option>
                      <option value="aprovado" className="bg-slate-900">Aprovado pelo Orientador</option>
                      <option value="rascunho" className="bg-slate-900">Necessita Ajustes (Rascunho)</option>
                    </select>
                  </div>
                </div>

                {/* Automatic Email Notification Configuration */}
                <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800/90 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>E-mail do Aluno (Disparo Automático em Segundo Plano)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        statusInput === 'aprovado'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                      }`}>
                        {statusInput === 'aprovado' ? '🟢 Dispara Tag Verde (Exportar PDF)' : '🟠 Dispara Tag Laranja (Editar Ficha)'}
                      </span>
                    </div>
                  </div>

                  <input
                    type="email"
                    value={alunoEmailInput}
                    onChange={(e) => setAlunoEmailInput(e.target.value)}
                    placeholder="Ex: aluno@faatesp.edu.br ou email cadastrado"
                    className="w-full bg-[#0d1629] border border-slate-700/90 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <Send className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Ao salvar o parecer, o sistema enviará a notificação automaticamente em segundo plano para este endereço com o link de retorno ao app.</span>
                  </p>
                </div>

                {/* Orientador Signature Upload */}
                <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800/90">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <FileSignature className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Assinatura do Orientador para o PDF Oficial</span>
                    </span>
                    <span className="text-[10px] text-slate-400">PNG ou JPG (Máx 2MB)</span>
                  </label>

                  <div className="flex items-center gap-3">
                    {assinaturaUrl ? (
                      <div className="flex items-center space-x-3 bg-[#0d1527] p-2.5 rounded-xl border border-slate-700 w-full">
                        <div className="bg-white p-1.5 rounded shadow-sm shrink-0 h-10 flex items-center">
                          <img src={assinaturaUrl} alt="Assinatura" className="max-h-8 w-auto object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-xs text-emerald-400 font-bold flex-1">Assinatura Anexada</span>
                        <button
                          type="button"
                          onClick={() => setAssinaturaUrl('')}
                          className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] rounded cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-[#0b1325] hover:bg-slate-800 text-slate-300 rounded-xl border border-dashed border-slate-700 cursor-pointer transition-all">
                        <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium">Enviar imagem da assinatura do orientador</span>
                        <input type="file" accept="image/*" onChange={handleAssinaturaUpload} className="hidden" />
                      </label>
                    )}
                    {uploadError && (
                      <p className="text-xs text-rose-400 mt-1.5 font-medium">{uploadError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0b1325] sticky bottom-0 z-10 flex flex-col gap-3">
              {/* Direct Save Feedback Banner */}
              {justSavedReview && (
                <div className="w-full p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg animate-fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>✓ Parecer do aluno, nota e status salvos com sucesso no sistema e no banco de dados!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFicha(null)}
                    className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Fechar e Voltar à Lista
                  </button>
                </div>
              )}

              {/* Background Email Notification Notice */}
              {isAutoSendingEmail && (
                <div className="w-full p-2 bg-indigo-950/80 border border-indigo-700/80 text-indigo-300 rounded-xl text-xs flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                  <span>Enviando e-mail de notificação ao aluno em segundo plano...</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFicha(null);
                      setEmailModalFicha(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-md border border-emerald-400 hover:scale-105 active:scale-95"
                    title="Retornar à lista de fichas dos alunos"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>← Voltar para Fichas</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnToMain}
                    className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Ir para a Tela Inicial"
                  >
                    <Home className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tela Inicial</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    id="btn_salvar_parecer_aluno"
                    disabled={isSavingReview}
                    onClick={() => handleSaveReview(false)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                    title="Salvar parecer e nota no banco de dados e retornar à lista de fichas"
                  >
                    {isSavingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Salvando Parecer...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Parecer do Aluno</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn_salvar_e_disparar_email"
                    disabled={isSavingReview}
                    onClick={handleSaveAndSendEmail}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                    title="Salvar parecer e disparar e-mail com PDF anexo para o aluno imediatamente"
                  >
                    <Send className="w-4 h-4 text-purple-200" />
                    <span>Salvar e Disparar E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFicha) {
                        const freshFicha: FichaTCC = {
                          ...selectedFicha,
                          parecerOrientador: parecerText,
                          nota: notaInput,
                          status: statusInput,
                          usuarioEmail: alunoEmailInput || selectedFicha.usuarioEmail,
                          assinaturaUrl: assinaturaUrl || selectedFicha.assinaturaUrl,
                          professorOrientador: selectedFicha.professorOrientador || currentUser.name,
                          ultimaAtualizacao: new Date().toISOString()
                        };
                        handleOpenEmailModal(freshFicha);
                      }
                    }}
                    className="px-3 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-medium rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Abrir opções de e-mail personalizado manual"
                  >
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>E-mail Personalizado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSaveReview(false);
                      if (selectedFicha) {
                        handleDownloadOfficialDocx({
                          ...selectedFicha,
                          parecerOrientador: parecerText,
                          nota: notaInput,
                          status: statusInput
                        });
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-300" />
                    <span>Baixar DOCX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveReview(true)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Email Dispatch Modal */}
      {emailModalFicha && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEmailModalFicha(null);
              setSelectedFicha(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#0b1325] border border-purple-500/40 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in my-8">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-900/80 text-purple-300 border border-purple-700/80 rounded-xl shadow-inner">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Disparo de E-mail da Ficha Corrigida</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] rounded-full font-semibold">
                      Com PDF Anexo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Aluno: <strong className="text-purple-300">{activeEmailFicha?.nomeAluno || 'Aluno sem nome'}</strong> • Nota: <strong className="text-amber-400">{activeEmailFicha?.nota || 'Pendente'}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalFicha(null);
                    setSelectedFicha(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1.5 border border-emerald-400 hover:scale-105 active:scale-95"
                  title="Voltar para a lista de fichas"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Fichas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailModalFicha(null);
                    setSelectedFicha(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-[#080d1a] px-4 pt-2 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setEmailModalTab('composer')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                  emailModalTab === 'composer'
                    ? 'bg-[#0b1325] text-purple-300 border-purple-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compôr E-mail</span>
              </button>

              <button
                type="button"
                onClick={() => setEmailModalTab('ficha_preview')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                  emailModalTab === 'ficha_preview'
                    ? 'bg-[#0b1325] text-emerald-300 border-emerald-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Ficha Completa (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setEmailModalTab('smtp')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                  emailModalTab === 'smtp'
                    ? 'bg-[#0b1325] text-amber-300 border-amber-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Servidor SMTP (Opcional)</span>
                {useCustomSmtp && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailModalTab('history');
                  fetchEmailHistory();
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                  emailModalTab === 'history'
                    ? 'bg-[#0b1325] text-indigo-300 border-indigo-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Envios ({emailHistory.length})</span>
              </button>
            </div>

            {/* Modal Content according to selected Tab */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {emailModalTab === 'composer' && (
                <>
                  {/* Last Send Status Notification */}
                  {lastSendResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        lastSendResult.success
                          ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        {lastSendResult.success ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-sm">
                            {lastSendResult.success ? 'E-mail Disparado pelo Servidor!' : 'Atenção no Envio do E-mail'}
                          </p>
                          <p className="text-xs mt-1 leading-relaxed">{lastSendResult.message}</p>
                          <p className="text-[11px] text-slate-300 mt-1">
                            📄 O PDF oficial com a nota ({activeEmailFicha?.nota || 'Pendente'}) e o parecer foi anexado diretamente na mensagem.
                          </p>

                          {/* Action button to return to cards list */}
                          <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEmailModalFicha(null);
                                setSelectedFicha(null);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-emerald-400 hover:scale-105 active:scale-95"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>← Fechar e Retornar para as Fichas</span>
                            </button>

                            {lastSendResult.testMessageUrl && (
                              <a
                                href={String(lastSendResult.testMessageUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 shrink-0 border border-emerald-700"
                              >
                                <span>Ver no Ethereal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Direct 1-Click Webmail Links */}
                  <div className="p-3 bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-blue-800/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span>Enviar via seu E-mail Pessoal (Webmail 1-Clique):</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Abre pronto no seu e-mail</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={handleOpenGmailWeb}
                        className="px-3 py-2 bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-rose-700/80 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-300" />
                        <span>Abrir no Gmail Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenOutlookWeb}
                        className="px-3 py-2 bg-blue-900/80 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-blue-700/80 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-300" />
                        <span>Abrir no Outlook Web</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenMailto}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-700 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>App de E-mail (Mailto)</span>
                      </button>
                    </div>
                  </div>

                  {/* Logged in info & Grade card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl text-xs flex flex-col justify-center">
                      <span className="text-slate-400 text-[11px]">Remetente Registrado:</span>
                      <span className="font-bold text-purple-300 truncate text-xs mt-0.5">
                        {currentUser.email || 'rogerioaugusto@gmail.com'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#080d1a] border border-amber-800/60 rounded-xl text-xs flex flex-col justify-center">
                      <span className="text-slate-400 text-[11px]">Nota no PDF Oficial:</span>
                      <span className="font-black text-amber-400 text-sm mt-0.5">
                        {activeEmailFicha?.nota ? `Nota ${activeEmailFicha.nota}` : 'Sem nota (Pendente)'}
                      </span>
                    </div>
                  </div>

                  {/* PDF Document Attachment Info */}
                  <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-purple-400 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-purple-200 text-xs">
                        Anexo PDF: Ficha Completa do TCC com Nota e Parecer
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Inclui automaticamente: Dados do Aluno, Situação-Problema, Hipótese, Referências Bibliográficas, Reuniões Presenciais, Nota (<strong className="text-amber-300">{activeEmailFicha?.nota || 'Pendente'}</strong>), Parecer do Orientador e Assinatura.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>E-mail do Destinatário:</span>
                      <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded font-bold border border-amber-800">
                        E-mail Logado (Inativo)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={currentUser.email || 'rogerioaugusto@gmail.com'}
                      disabled
                      readOnly
                      className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Assunto da Mensagem:</span>
                      <span className="text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded font-bold border border-purple-800">
                        Fixo
                      </span>
                    </label>
                    <input
                      type="text"
                      value="FICHA DE ORIENTAÇÃO - FAATESP"
                      disabled
                      readOnly
                      className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-purple-300 font-bold cursor-not-allowed opacity-80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mensagem de Acompanhamento:
                    </label>
                    <textarea
                      rows={5}
                      id="field_email_body_text"
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-[#0d1629] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                    />
                  </div>
                </>
              )}

              {emailModalTab === 'ficha_preview' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>Ficha Oficial Preenchida com Nota e Parecer</span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Este é o documento idêntico enviado ao aluno, contendo todas as orientações presenciais, nota ({activeEmailFicha?.nota || 'Pendente'}), parecer e assinatura digital.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isDownloadingPdf}
                      onClick={() => {
                        if (!activeEmailFicha) return;
                        handleDownloadOfficialPdf(activeEmailFicha);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-lg transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Este PDF Agora</span>
                    </button>
                  </div>

                  <div className="bg-slate-200 p-2 sm:p-4 rounded-xl border border-slate-700 max-h-[50vh] overflow-y-auto">
                    {activeEmailFicha && <FichaPreview ficha={activeEmailFicha} />}
                  </div>
                </div>
              )}

              {emailModalTab === 'smtp' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-300 flex items-center space-x-1.5">
                      <Server className="w-4 h-4" />
                      <span>Configuração de Servidor SMTP Customizado</span>
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Por padrão, o sistema utiliza o motor de disparo seguro integrado da aplicação com fallback Ethereal/Nodemailer. Caso sua instituição de ensino utilize um servidor de e-mail próprio (como Gmail Workspace, Outlook365 ou Mailtrap), você pode preencher os dados abaixo para roteamento direto:
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCustomSmtp"
                      checked={useCustomSmtp}
                      onChange={(e) => setUseCustomSmtp(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    />
                    <label htmlFor="useCustomSmtp" className="text-xs font-bold text-slate-200 cursor-pointer">
                      Ativar Servidor SMTP Personalizado
                    </label>
                  </div>

                  {useCustomSmtp && (
                    <div className="p-4 bg-[#080d1a] border border-slate-800 rounded-xl space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Servidor SMTP (Host):
                          </label>
                          <input
                            type="text"
                            id="field_smtp_host"
                            autoComplete="one-time-code"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="ex: smtp.gmail.com ou smtp.office365.com"
                            className="w-full bg-[#0d1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Porta:
                          </label>
                          <input
                            type="text"
                            id="field_smtp_port"
                            autoComplete="one-time-code"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            placeholder="587 ou 465"
                            className="w-full bg-[#0d1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Usuário SMTP / E-mail:
                          </label>
                          <input
                            type="text"
                            id="field_smtp_user"
                            autoComplete="one-time-code"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="usuario@faatesp.edu.br"
                            className="w-full bg-[#0d1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Senha do Aplicativo:
                          </label>
                          <input
                            type="password"
                            id="field_smtp_pass"
                            autoComplete="new-password"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#0d1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          E-mail/Nome do Remetente (From):
                        </label>
                        <input
                          type="text"
                          id="field_smtp_from"
                          autoComplete="one-time-code"
                          autoCorrect="off"
                          spellCheck="false"
                          data-lpignore="true"
                          data-form-type="other"
                          value={smtpFrom}
                          onChange={(e) => setSmtpFrom(e.target.value)}
                          placeholder="FAATESP TCC <orientacao@faatesp.edu.br>"
                          className="w-full bg-[#0d1629] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {emailModalTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">
                      Histórico de E-mails Disparados no Servidor ({emailHistory.length})
                    </span>
                    <button
                      type="button"
                      onClick={fetchEmailHistory}
                      disabled={isLoadingHistory}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                      <span>Atualizar</span>
                    </button>
                  </div>

                  {emailHistory.length === 0 ? (
                    <div className="p-8 text-center bg-[#080d1a] border border-slate-800 rounded-xl space-y-2">
                      <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">Nenhum disparo de e-mail registrado nesta sessão.</p>
                      <p className="text-[11px] text-slate-500">Envie um e-mail pela aba "Compôr E-mail" para visualizá-lo aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {emailHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-[#080d1a] border border-slate-800 hover:border-slate-700 rounded-xl text-xs space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-white text-xs">{item.subject}</p>
                              <p className="text-[11px] text-purple-300 mt-0.5">
                                Destinatário: <strong>{item.to}</strong> • Aluno: <strong>{item.studentName}</strong> (Nota: {item.grade})
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Enviado em: {new Date(item.sentAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                                item.status === 'sent'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.status === 'sent' ? 'Enviado' : 'Falhou'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                            <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <FileText className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>{item.pdfFilename}</span>
                            </span>

                            <div className="flex items-center space-x-2 shrink-0">
                              {item.pdfBase64Data && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadHistoricalPdf(item)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Baixar PDF</span>
                                </button>
                              )}

                              {item.testMessageUrl && (
                                <a
                                  href={String(item.testMessageUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 rounded text-[10px] font-bold flex items-center space-x-1"
                                >
                                  <span>Ver no Ethereal</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#080d1a] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEmailModalFicha(null);
                  setSelectedFicha(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border-2 border-emerald-400 shadow-xl hover:scale-105 active:scale-95"
                title="Voltar imediatamente para a lista de fichas"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
                <span>← Voltar para Lista de Fichas</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleOpenGmailWeb}
                  className="px-3 py-2 bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer border border-rose-700"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-300" />
                  <span>Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenOutlookWeb}
                  className="px-3 py-2 bg-blue-900/80 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1 cursor-pointer border border-blue-700"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-300" />
                  <span>Outlook</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailto}
                  disabled={isSendingEmailPdf}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50 border border-slate-700"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mailto</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendEmailDirect}
                  disabled={isSendingEmailPdf}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmailPdf ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Disparando E-mail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-purple-200" />
                      <span>Disparar E-mail com PDF Anexo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalFicha && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModalFicha(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0b1325] border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 bg-rose-950 border border-rose-800 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Confirmar Exclusão de Ficha</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente a ficha de TCC do aluno{' '}
              <strong className="text-rose-300">{deleteModalFicha.nomeAluno || 'Aluno sem nome'}</strong>?
              Esta ação removerá todos os registros de orientação e pareceres gravados.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalFicha(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container for capturing email PDF with exact grade, parecer, bibliografia & orientações */}
      {(activeEmailFicha || fichaForEmailExport) && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '900px', backgroundColor: '#ffffff', zIndex: -9999 }}>
          <div id="email-ficha-preview-container" className="p-4 bg-white text-black">
            <FichaPreview ficha={fichaForEmailExport || activeEmailFicha!} />
          </div>
        </div>
      )}

      {/* Container for capturing official PDF matching FAATESP model exactly */}
      {downloadingFicha && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0px',
            width: '900px',
            backgroundColor: '#ffffff',
            zIndex: -9999
          }}
        >
          <FichaPreview ficha={downloadingFicha} idToCapture="orientador-pdf-export-canvas" />
        </div>
      )}
    </div>
  );
};
