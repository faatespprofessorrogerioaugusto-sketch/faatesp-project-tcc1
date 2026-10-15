import React, { useState, useEffect, useRef } from 'react';
import { FichaTCC, Orientation, User } from '../types';
import {
  Plus,
  Trash2,
  CheckCircle,
  Save,
  FileDown,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  FileType,
  FileText,
  Loader2,
  Bell,
  Check,
  Home,
  ArrowRight,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { getSignatureForProfessor } from '../utils/signatures';
import { storageService } from '../services/storage';
import { generatePdf } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';
import {
  validateStudentFullName,
  formatToTitleCase,
  NameValidationResult
} from '../utils/nameValidator';

interface FichaFormProps {
  ficha: FichaTCC;
  currentUser: User;
  onSave: (ficha: FichaTCC) => void;
  onPreview?: () => void;
  onNavigateMain?: () => void;
}

export const FichaForm: React.FC<FichaFormProps> = ({
  ficha,
  currentUser,
  onSave,
  onPreview,
  onNavigateMain
}) => {
  const [formData, setFormData] = useState<FichaTCC>(() => {
    const instLogo = storageService.getInstitutionalLogo() || ficha.logoUrl || '';
    const prof = ficha.professorOrientador || (currentUser.role === 'orientador' ? currentUser.name : '');
    const sig = ficha.assinaturaUrl || getSignatureForProfessor(prof);
    const initialCurso = (!ficha.tituloTrabalho && !ficha.nomeAluno) ? '' : (ficha.curso || '');
    return {
      ...ficha,
      curso: initialCurso,
      semestre: '7º Semestre 2026/2',
      logoUrl: instLogo,
      professorOrientador: prof,
      assinaturaUrl: sig,
      usuarioId: ficha.usuarioId || (currentUser.role === 'aluno' ? currentUser.id : ''),
      usuarioEmail: ficha.usuarioEmail || (currentUser.role === 'aluno' ? currentUser.email : '')
    };
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Sincronizado');
  const isFirstRender = useRef(true);

  // References to highlight / focus fields
  const titleInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Validation states
  // Requisito 2: obrigar a preencher o título/tema senão não pode entrar nos outros campos
  const isTituloPreenchido = Boolean(formData.tituloTrabalho && formData.tituloTrabalho.trim().length >= 3);

  // Requisito 1: forçar o aluno a colocar o nome completo no formato Maiúscula e minúscula com o nome e sobrenome
  const studentNameValidation: NameValidationResult = validateStudentFullName(formData.nomeAluno || '');
  const hasStartedTypingName = Boolean(formData.nomeAluno && formData.nomeAluno.trim().length > 0);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleApplySuggestedName = () => {
    const formatted = formatToTitleCase(formData.nomeAluno || '');
    if (formatted) {
      setFormData((prev) => ({
        ...prev,
        nomeAluno: formatted
      }));
      setErrorMessage(null);
    }
  };

  const handleStudentNameBlur = () => {
    const trimmed = (formData.nomeAluno || '').trim();
    if (trimmed) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        // Auto-correct casing if typed in all caps or all lowercase
        const formatted = formatToTitleCase(trimmed);
        if (formatted !== trimmed) {
          setFormData((prev) => ({
            ...prev,
            nomeAluno: formatted
          }));
        }
      }
    }
  };

  const handleDirectExportPdf = async () => {
    // 1. Validar Título/Tema
    if (!isTituloPreenchido) {
      setErrorMessage('Atenção: O preenchimento do Título/Tema do TCC é obrigatório para exportar a ficha.');
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus();
      return;
    }

    // 2. Validar Nome do Aluno
    if (!studentNameValidation.isValid) {
      setErrorMessage(
        studentNameValidation.message ||
          'Por favor, preencha o seu nome completo com Nome e Sobrenome no formato com iniciais Maiúsculas e minúsculas (Ex: Maria da Silva).'
      );
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
      return;
    }

    try {
      setIsExportingPdf(true);
      setExportNotice(null);
      // Auto save first
      onSave(formData);
      await generatePdf(formData);
      setExportNotice('Arquivo PDF baixado com sucesso! Você permaneceu nesta tela.');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error(err);
      setExportNotice('Erro ao gerar PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDirectExportDocx = async () => {
    // 1. Validar Título/Tema
    if (!isTituloPreenchido) {
      setErrorMessage('Atenção: O preenchimento do Título/Tema do TCC é obrigatório para exportar a ficha.');
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus();
      return;
    }

    // 2. Validar Nome do Aluno
    if (!studentNameValidation.isValid) {
      setErrorMessage(
        studentNameValidation.message ||
          'Por favor, preencha o seu nome completo com Nome e Sobrenome no formato com iniciais Maiúsculas e minúsculas (Ex: Maria da Silva).'
      );
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
      return;
    }

    try {
      setIsExportingDocx(true);
      setExportNotice(null);
      onSave(formData);
      await generateDocx(formData);
      setExportNotice('Arquivo Word (.DOCX) baixado com sucesso! Você permaneceu nesta tela.');
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error(err);
      setExportNotice('Erro ao gerar Word (.DOCX).');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Sync state when switching to a different ficha or when real data arrives
  useEffect(() => {
    const isFormDataEmpty = !formData.tituloTrabalho && !formData.nomeAluno;
    const hasIncomingData = Boolean(ficha.tituloTrabalho || ficha.nomeAluno);
    if (ficha.id !== formData.id || (isFormDataEmpty && hasIncomingData)) {
      const instLogo = storageService.getInstitutionalLogo() || ficha.logoUrl || '';
      const prof = ficha.professorOrientador || (currentUser.role === 'orientador' ? currentUser.name : '');
      const sig = ficha.assinaturaUrl || getSignatureForProfessor(prof);
      const syncCurso = (!ficha.tituloTrabalho && !ficha.nomeAluno) ? '' : (ficha.curso || '');
      setFormData({
        ...ficha,
        curso: syncCurso,
        semestre: '7º Semestre 2026/2',
        logoUrl: instLogo,
        professorOrientador: prof,
        assinaturaUrl: sig
      });
      lastSavedJson.current = JSON.stringify(ficha);
      setAutoSaveStatus('Sincronizado');
    }
  }, [ficha.id, ficha.tituloTrabalho, ficha.nomeAluno]);

  // Debounced local auto-save without infinite render loops
  const lastSavedJson = useRef<string>(JSON.stringify(formData));

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentJson = JSON.stringify(formData);
    if (currentJson === lastSavedJson.current) {
      return;
    }

    setAutoSaveStatus('Salvando...');
    const timer = setTimeout(async () => {
      const isStudent = currentUser.role === 'aluno';
      const fichaToSave: FichaTCC = {
        ...formData,
        usuarioId: formData.usuarioId || (isStudent ? currentUser.id : ''),
        usuarioEmail: formData.usuarioEmail || (isStudent ? currentUser.email : ''),
        logoUrl: storageService.getInstitutionalLogo() || formData.logoUrl || ''
      };
      storageService.saveFicha(fichaToSave);
      try {
        await onSave(fichaToSave);
      } catch (err) {
        console.warn('Auto-save cloud sync:', err);
      }
      lastSavedJson.current = currentJson;
      setAutoSaveStatus('Sincronizado');
    }, 1200);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfessorOrientadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProf = e.target.value;
    const autoSig = getSignatureForProfessor(selectedProf);
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData((prev) => ({
      ...prev,
      professorOrientador: selectedProf,
      assinaturaUrl: autoSig || prev.assinaturaUrl
    }));
  };

  const handleClearForm = () => {
    setShowClearConfirm(true);
  };

  const executeClearForm = () => {
    setFormData((prev) => ({
      ...prev,
      tituloTrabalho: '',
      nomeAluno: '',
      curso: '',
      situacaoProblema: '',
      hipotese: '',
      bibliografia: '',
      nota: '',
      orientacoes: [
        {
          id: `ori-${Date.now()}-1`,
          data: new Date().toISOString().split('T')[0],
          horario: '14:00',
          observacao: '',
          confirmado: false
        },
        {
          id: `ori-${Date.now()}-2`,
          data: new Date().toISOString().split('T')[0],
          horario: '15:00',
          observacao: '',
          confirmado: false
        }
      ]
    }));
    setErrorMessage(null);
    setSaveSuccessMsg('Campos limpos. Suas alterações foram salvas.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    setShowClearConfirm(false);
  };

  const handleOrientationChange = (index: number, field: keyof Orientation, value: any) => {
    const updatedOrientacoes = [...formData.orientacoes];
    updatedOrientacoes[index] = {
      ...updatedOrientacoes[index],
      [field]: value
    };
    setFormData((prev) => ({
      ...prev,
      orientacoes: updatedOrientacoes
    }));
  };

  const addOrientation = () => {
    const newOri: Orientation = {
      id: `ori-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      horario: '14:00',
      observacao: '',
      confirmado: false
    };
    setFormData((prev) => ({
      ...prev,
      orientacoes: [...prev.orientacoes, newOri]
    }));
  };

  const removeOrientation = (index: number) => {
    if (formData.orientacoes.length <= 1) {
      setExportNotice('A ficha deve manter ao menos um registro de orientação.');
      setTimeout(() => setExportNotice(null), 3500);
      return;
    }
    const updated = formData.orientacoes.filter((_, idx) => idx !== index);
    setFormData((prev) => ({
      ...prev,
      orientacoes: updated
    }));
  };

  const toggleConfirmOrientation = (index: number) => {
    const updatedOrientacoes = [...formData.orientacoes];
    const current = updatedOrientacoes[index];
    const isNowConfirmed = !current.confirmado;

    updatedOrientacoes[index] = {
      ...current,
      confirmado: isNowConfirmed,
      nomeOrientador: isNowConfirmed
        ? currentUser.name || formData.professorOrientador
        : undefined,
      dataConfirmacao: isNowConfirmed
        ? new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : undefined,
      assinaturaDigital: isNowConfirmed
        ? `${currentUser.name} (Confirmado digitalmente via FAATESP)`
        : undefined
    };

    setFormData((prev) => ({
      ...prev,
      orientacoes: updatedOrientacoes
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // 1. Validar Título/Tema do TCC (apenas para alunos)
    if (!isTituloPreenchido && currentUser.role !== 'orientador') {
      setErrorMessage(
        'Atenção: O preenchimento do Título/Tema do TCC é obrigatório para liberar os outros campos e salvar a ficha.'
      );
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus();
      return;
    }

    // 2. Formatar ou validar Nome do Aluno
    let finalStudentName = (formData.nomeAluno || '').trim();
    if (!studentNameValidation.isValid) {
      if (studentNameValidation.suggestedName) {
        finalStudentName = studentNameValidation.suggestedName;
      } else if (currentUser.role === 'orientador') {
        finalStudentName = formatToTitleCase(finalStudentName);
      } else if (!finalStudentName) {
        setErrorMessage(
          'Por favor, preencha o seu nome completo com Nome e Sobrenome (Ex: Maria da Silva).'
        );
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current?.focus();
        return;
      }
    }

    setIsSaving(true);
    const isStudent = currentUser.role === 'aluno';
    const fichaToSave: FichaTCC = {
      ...formData,
      nomeAluno: finalStudentName || formData.nomeAluno,
      usuarioId: formData.usuarioId || (isStudent ? currentUser.id : ''),
      usuarioEmail: formData.usuarioEmail || (isStudent ? currentUser.email : ''),
      parecerAtendido: isStudent && Boolean(formData.parecerOrientador?.trim()) ? true : formData.parecerAtendido,
      dataAtendimentoParecer: isStudent && Boolean(formData.parecerOrientador?.trim()) ? new Date().toISOString() : formData.dataAtendimentoParecer,
      logoUrl: storageService.getInstitutionalLogo() || formData.logoUrl || ''
    };
    setFormData(fichaToSave);
    storageService.saveFicha(fichaToSave);
    try {
      await onSave(fichaToSave);
    } catch (err) {
      console.error('Erro ao salvar ficha:', err);
    }
    setIsSaving(false);
    setJustSaved(true);
    setSaveSuccessMsg('✅ Ficha salva com sucesso! Os dados estão sincronizados na nuvem.');
    setTimeout(() => {
      setJustSaved(false);
      setSaveSuccessMsg('');
    }, 4500);
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      data-lpignore="true"
      className="space-y-8 max-w-4xl mx-auto pb-12"
    >
      {/* Hidden inputs to shield against aggressive browser autofill */}
      <input type="text" name="prevent_autofill_user_ficha" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pwd_ficha" className="hidden" tabIndex={-1} autoComplete="new-password" />

      {/* Top Banner & Quick Actions */}
      <div className="bg-[#0d1527] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">
              Editar Ficha de Atividade TCC
            </h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{autoSaveStatus}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seus dados são salvos continuamente para que você possa sair e voltar sem perder nenhuma alteração.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleClearForm}
            className="flex-1 sm:flex-initial px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-medium text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Limpar campos editáveis do formulário"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Limpar Campos</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSaving}
            className={`flex-1 sm:flex-initial px-4 py-2 font-bold text-xs sm:text-sm rounded-lg shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              justSaved
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 scale-[1.02]'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/50 active:scale-95'
            }`}
            title="Salvar alterações na ficha de TCC"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Salvando...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Ficha</span>
              </>
            )}
          </button>

          {/* Direct Export Buttons staying in place */}
          <button
            type="button"
            onClick={handleDirectExportPdf}
            disabled={isExportingPdf}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Exportar PDF diretamente sem sair da tela"
          >
            {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />}
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDirectExportDocx}
            disabled={isExportingDocx}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Exportar Word (.DOCX) diretamente sem sair da tela"
          >
            {isExportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Word</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/95 border-2 border-rose-500 text-rose-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-950/95 border-2 border-emerald-500 text-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg('')}
            className="text-xs px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {exportNotice && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-200 rounded-xl text-sm font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Teacher Feedback / Parecer Banner in Editor (some assim que os ajustes são salvos) */}
      {formData.parecerOrientador?.trim() && !formData.parecerAtendido && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 p-5 rounded-2xl border-2 border-amber-400 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-amber-500/20 text-amber-300 border border-amber-400/50 rounded-xl">
                <Bell className="w-5 h-5 text-amber-300" />
              </span>
              <div>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  Parecer do Professor Orientador
                </h4>
                <p className="text-xs text-slate-300">
                  {formData.professorOrientador ? `Emitido por ${formData.professorOrientador}` : 'Orientações para o seu trabalho'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {formData.parecerAtendido ? (
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1">
                  <span>✓ Ajustes Salvos</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500/80 font-bold text-xs rounded-lg shadow-sm animate-pulse">
                  Aguardando Ajustes
                </span>
              )}
              {formData.nota && (
                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-sm">
                  Nota: {formData.nota}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-amber-500/30 text-amber-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {formData.parecerOrientador}
          </div>
          <p className="text-[11px] text-amber-300/80">
            💡 Revise os campos do formulário abaixo com base nestas instruções e clique em "Salvar Alterações".
          </p>
        </div>
      )}

      {/* 1. Identification Block */}
      <div className="bg-[#0d1527] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center space-x-2">
            <span>Identificação Acadêmica</span>
          </h3>
          <span className="text-xs font-normal text-slate-400 lowercase">cabeçalho oficial FAATESP</span>
        </div>

        {/* Título do TCC - Campo Chave Obrigatório Inicial */}
        <div className="bg-[#070c18] p-4 rounded-xl border border-slate-700/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label htmlFor="field_tcc_titulo" className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>Título do Trabalho de Conclusão (TCC) / Tema</span>
              <span className="text-rose-400">*</span>
            </label>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 self-start sm:self-auto ${
                isTituloPreenchido
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                  : 'bg-amber-950 text-amber-300 border border-amber-600/80 animate-pulse'
              }`}
            >
              {isTituloPreenchido ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Título Preenchido — Campos Liberados</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Etapa 1: Obrigatório para liberar os demais campos</span>
                </>
              )}
            </span>
          </div>

          <input
            ref={titleInputRef}
            type="text"
            name="tituloTrabalho"
            id="field_tcc_titulo"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            value={formData.tituloTrabalho}
            onChange={handleChange}
            placeholder="Digite o título ou tema do seu TCC (ex: Desenvolvimento de Sistema Web para Gestão de TCC)"
            className={`w-full text-white border rounded-lg px-3.5 py-2.5 text-sm transition-all focus:ring-2 placeholder:text-slate-500 font-medium ${
              !isTituloPreenchido
                ? 'bg-amber-950/20 border-amber-500/80 ring-2 ring-amber-500/30 focus:ring-amber-500 focus:border-amber-500'
                : 'bg-[#0b1325] border-emerald-600/80 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />

          {!isTituloPreenchido ? (
            <p className="text-[11px] text-amber-300/90 flex items-center space-x-1.5 font-medium pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> É obrigatório preencher o Título/Tema do TCC acima para que os outros campos do formulário sejam desbloqueados.
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium pt-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Título preenchido com sucesso! O acesso a todos os outros campos está liberado.</span>
            </p>
          )}
        </div>

        {/* Banner de bloqueio caso o título ainda não tenha sido preenchido */}
        {!isTituloPreenchido && (
          <div className="p-3.5 bg-slate-900/90 border border-amber-600/50 rounded-xl flex items-center space-x-3 text-xs text-amber-300 animate-fadeIn">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block font-bold text-amber-200">Demais campos bloqueados</strong>
              <span>
                Preencha o campo <em>"Título do Trabalho de Conclusão (TCC)"</em> acima para liberar o preenchimento do Nome do Aluno, Curso, Situação-Problema, Hipótese e Bibliografia.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome do Aluno(a) com validação forçada de formato Maiúscula e minúscula com Nome e Sobrenome */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <span>Nome do Aluno(a)</span>
                <span className="text-rose-400">*</span>
              </span>
              {isTituloPreenchido && (
                <span className="text-[10px] text-slate-400">
                  Nome e Sobrenome (iniciais Maiúsculas)
                </span>
              )}
            </label>

            <div className="relative">
              <input
                ref={nameInputRef}
                type="text"
                name="nomeAluno"
                id="field_tcc_aluno_nome"
                autoComplete="one-time-code"
                autoCorrect="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                disabled={!isTituloPreenchido}
                value={formData.nomeAluno || ''}
                onChange={handleChange}
                onBlur={handleStudentNameBlur}
                placeholder={
                  !isTituloPreenchido
                    ? '🔒 Preencha o Título do TCC para desbloquear'
                    : 'Digite seu nome completo (ex: Maria da Silva)'
                }
                className={`w-full text-white border rounded-lg px-3 py-2 text-sm transition-all ${
                  !isTituloPreenchido
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                    : hasStartedTypingName && !studentNameValidation.isValid
                    ? 'bg-[#0b1325] border-rose-500 ring-2 ring-rose-500/40 focus:ring-rose-500 focus:border-rose-500 text-rose-100 font-medium'
                    : hasStartedTypingName && studentNameValidation.isValid
                    ? 'bg-[#0b1325] border-emerald-500 text-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-[#0b1325] border-slate-700 text-white focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500'
                }`}
              />
              {!isTituloPreenchido && (
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              )}
              {isTituloPreenchido && hasStartedTypingName && studentNameValidation.isValid && (
                <Check className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
              )}
            </div>

            {/* Aviso quando bloqueado */}
            {!isTituloPreenchido && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Bloqueado até o preenchimento do Título/Tema</span>
              </p>
            )}

            {/* Feedback de Validação do Nome quando desbloqueado */}
            {isTituloPreenchido && (
              <>
                {!hasStartedTypingName && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digite seu nome e sobrenome com iniciais Maiúsculas e minúsculas (Ex: Maria da Silva, João Pereira).
                  </p>
                )}

                {hasStartedTypingName && !studentNameValidation.isValid && (
                  <div className="mt-1.5 p-2.5 bg-rose-950/80 border border-rose-700/80 rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="flex items-start space-x-1.5 text-xs text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium">{studentNameValidation.message}</span>
                    </div>
                    {studentNameValidation.suggestedName && (
                      <button
                        type="button"
                        onClick={handleApplySuggestedName}
                        className="w-full text-left px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-600/70 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>✨ Clique para formatar automaticamente: <strong>"{studentNameValidation.suggestedName}"</strong></span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 ml-1" />
                      </button>
                    )}
                  </div>
                )}

                {hasStartedTypingName && studentNameValidation.isValid && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Nome completo e formato correto (Maiúsculas e minúsculas)</span>
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Curso</span>
              {!isTituloPreenchido && (
                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Bloqueado</span>
                </span>
              )}
            </label>
            <select
              name="curso"
              id="field_tcc_curso"
              data-lpignore="true"
              disabled={!isTituloPreenchido}
              value={formData.curso || ''}
              onChange={handleChange}
              className={`w-full text-white border rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                !isTituloPreenchido
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                  : 'bg-[#0b1325] border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
              }`}
            >
              <option value="" className="text-slate-400 bg-slate-900">
                Selecione o Curso
              </option>
              <option value="Bacharel em Administração" className="bg-slate-900 text-white">
                Bacharel em Administração
              </option>
              <option value="Licenciatura em Pedagogia" className="bg-slate-900 text-white">
                Licenciatura em Pedagogia
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Semestre / Ano Letivo</span>
              <span className="text-[10px] text-blue-400 font-normal">Fixo Institucional</span>
            </label>
            <input
              type="text"
              name="semestre"
              id="field_tcc_semestre"
              autoComplete="one-time-code"
              data-lpignore="true"
              value="7º Semestre 2026/2"
              readOnly
              className="w-full bg-[#0b1325]/90 text-slate-200 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Professor(a) Orientador(a)</span>
              {!isTituloPreenchido && (
                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Bloqueado</span>
                </span>
              )}
            </label>
            <select
              name="professorOrientador"
              id="field_tcc_orientador"
              data-lpignore="true"
              disabled={!isTituloPreenchido}
              value={formData.professorOrientador || ''}
              onChange={handleProfessorOrientadorChange}
              className={`w-full text-white border rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                !isTituloPreenchido
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                  : 'bg-[#0b1325] border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
              }`}
            >
              <option value="" disabled className="text-slate-500">
                Selecione o Professor Orientador
              </option>
              <option value="Prof. Rogério Augusto">Prof. Rogério Augusto</option>
              <option value="Profa. Marinês Borba">Profa. Marinês Borba</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Nota Final (0.0 a 10.0)</span>
              {currentUser.role === 'orientador' ? (
                <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded font-bold border border-amber-800">
                  Campo do Orientador
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-medium border border-slate-800">
                  Definido pelo Orientador
                </span>
              )}
            </label>
            <input
              type="text"
              name="nota"
              id="field_tcc_nota_val"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              value={formData.nota || ''}
              onChange={handleChange}
              placeholder={currentUser.role === 'orientador' ? "Ex: 9.5" : "Atribuído pelo orientador"}
              readOnly={currentUser.role !== 'orientador'}
              className={`w-full bg-[#0b1325] text-blue-400 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-slate-500 ${
                currentUser.role !== 'orientador' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Numbered Content Fields */}
      <div className="bg-[#0d1527] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Conteúdo do Projeto de TCC
          </h3>
          {!isTituloPreenchido && (
            <span className="text-xs text-amber-400 font-semibold flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Bloqueado até o preenchimento do Título/Tema</span>
            </span>
          )}
        </div>

        {/* 1) Situação-problema */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span>1) Situação-Problema</span>
            {!isTituloPreenchido && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Descreva a contextualização e a problemática central investigada no TCC.
          </p>
          <textarea
            name="situacaoProblema"
            id="field_tcc_situacao"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            disabled={!isTituloPreenchido}
            value={formData.situacaoProblema}
            onChange={handleChange}
            rows={4}
            placeholder={
              !isTituloPreenchido
                ? '🔒 Preencha o Título do TCC acima para liberar o preenchimento da situação-problema...'
                : 'Digite aqui a situação-problema do TCC: apresente a contextualização do tema, a justificativa e o problema central a ser investigado...'
            }
            className={`w-full text-white border rounded-lg p-3 text-sm transition-all placeholder:text-slate-500 ${
              !isTituloPreenchido
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                : 'bg-[#0b1325] border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 2) Hipótese */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span>2) Hipótese</span>
            {!isTituloPreenchido && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Especifique a hipótese proposta ou premissa a ser testada/desenvolvida.
          </p>
          <textarea
            name="hipotese"
            id="field_tcc_hipotese"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            disabled={!isTituloPreenchido}
            value={formData.hipotese}
            onChange={handleChange}
            rows={4}
            placeholder={
              !isTituloPreenchido
                ? '🔒 Preencha o Título do TCC acima para liberar o preenchimento da hipótese...'
                : 'Digite aqui a hipótese do TCC: apresente a premissa, suposição teórica ou solução esperada para resolver a situação-problema...'
            }
            className={`w-full text-white border rounded-lg p-3 text-sm transition-all placeholder:text-slate-500 ${
              !isTituloPreenchido
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                : 'bg-[#0b1325] border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 3) Referências Bibliográficas */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span>3) Referências Bibliográficas</span>
            {!isTituloPreenchido && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Liste as referências bibliográficas iniciais utilizadas (livros, artigos, normas ABNT).
          </p>
          <textarea
            name="bibliografia"
            id="field_tcc_biblio"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
            disabled={!isTituloPreenchido}
            value={formData.bibliografia}
            onChange={handleChange}
            rows={4}
            placeholder={
              !isTituloPreenchido
                ? '🔒 Preencha o Título do TCC acima para liberar o preenchimento das referências bibliográficas...'
                : 'Digite aqui as referências bibliográficas iniciais conforme as normas da ABNT (livros, artigos científicos, teses, legislação, etc.)...'
            }
            className={`w-full text-white border rounded-lg p-3 text-sm font-mono text-xs transition-all placeholder:text-slate-500 ${
              !isTituloPreenchido
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed select-none opacity-60'
                : 'bg-[#0b1325] border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* 3. Registro de Orientações Presenciais (Exclusivo para o Modo Orientador) */}
      {currentUser.role === 'orientador' && (
        <div className="bg-[#0d1527] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Registro de Orientações Presenciais
              </h3>
              <p className="text-xs text-slate-400">
                O regulamento exige no mínimo <strong className="text-white">2 orientações presenciais</strong> registradas e validadas.
              </p>
            </div>

            <button
              type="button"
              onClick={addOrientation}
              className="px-3 py-1.5 bg-[#0b1b36] text-blue-400 hover:bg-blue-900/40 font-semibold text-xs rounded-lg border border-blue-800/60 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Orientação</span>
            </button>
          </div>

          {formData.orientacoes.length < 2 && (
            <div className="p-3 bg-amber-950/80 border border-amber-800/80 text-amber-300 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Adicione ao menos mais uma orientação para cumprir o requisito mínimo de 2 orientações.</span>
            </div>
          )}

          {/* Orientações Cards / List */}
          <div className="space-y-4">
            {formData.orientacoes.map((ori, index) => (
              <div
                key={ori.id || index}
                className={`p-4 rounded-xl border transition-all ${
                  ori.confirmado
                    ? 'bg-emerald-950/30 border-emerald-800/80'
                    : 'bg-[#0b1325] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span>Orientação Presencial #{index + 1}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleConfirmOrientation(index)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                        ori.confirmado
                          ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{ori.confirmado ? 'Confirmado pelo Orientador' : 'Confirmar Orientação'}</span>
                    </button>

                    {formData.orientacoes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrientation(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Excluir orientação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Data da Orientação
                    </label>
                    <input
                      type="date"
                      autoComplete="off"
                      data-lpignore="true"
                      value={ori.data}
                      onChange={(e) => handleOrientationChange(index, 'data', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-[#070c18] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      autoComplete="off"
                      data-lpignore="true"
                      value={ori.horario}
                      onChange={(e) => handleOrientationChange(index, 'horario', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-[#070c18] text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Observação / Apontamentos da Orientação Presencial
                    </label>
                    <textarea
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      value={ori.observacao}
                      onChange={(e) => handleOrientationChange(index, 'observacao', e.target.value)}
                      rows={2}
                      placeholder="Ex: Alinhamento inicial do tema de TCC e definição do escopo..."
                      className="w-full p-2 text-xs border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-[#070c18] text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {ori.confirmado && (
                  <div className="mt-2 pt-2 border-t border-emerald-800/80 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>✓ Validação do Orientador: {ori.nomeOrientador || 'Prof. Orientador'}</span>
                    <span>{ori.dataConfirmacao}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Save Status Notice Banner (at the footer where the user is looking!) */}
      {justSaved && (
        <div className="p-4 bg-emerald-950/95 border-2 border-emerald-500 text-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Ficha salva com sucesso! Os dados estão sincronizados na nuvem.</span>
          </div>
          {onNavigateMain && (
            <button
              type="button"
              onClick={onNavigateMain}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <span>Ir para Tela Inicial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Save Button Footer */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleDirectExportPdf}
          disabled={isExportingPdf}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          title="Exportar PDF diretamente sem sair da tela"
        >
          {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType className="w-4 h-4" />}
          <span>Exportar PDF</span>
        </button>

        <button
          type="button"
          onClick={handleDirectExportDocx}
          disabled={isExportingDocx}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          title="Exportar Word (.DOCX) diretamente sem sair da tela"
        >
          {isExportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>Exportar Word</span>
        </button>

        {onNavigateMain && (
          <button
            type="button"
            onClick={() => {
              handleSubmit();
              setTimeout(() => {
                onNavigateMain();
              }, 400);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Salvar alterações e voltar para a Tela Inicial"
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span>Salvar & Voltar</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className={`px-6 py-2.5 font-bold text-sm rounded-xl shadow-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
            justSaved
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 scale-[1.02]'
              : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-blue-900/50'
          }`}
          title="Salvar alterações permanentemente"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando dados...</span>
            </>
          ) : justSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Alterações Salvas com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>
      {/* Clear Form Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0d1527] rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-white">Limpar Campos?</h4>
            <p className="text-xs text-slate-300">
              Tem certeza que deseja limpar os campos editáveis do formulário? Esta ação reiniciará os dados locais desta ficha.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeClearForm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
