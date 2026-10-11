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
  ArrowRight
} from 'lucide-react';
import { getSignatureForProfessor } from '../utils/signatures';
import { storageService } from '../services/storage';
import { generatePdf } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';

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
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Sincronizado');
  const isFirstRender = useRef(true);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleDirectExportPdf = async () => {
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

  // Sync state ONLY when switching to a completely different ficha
  useEffect(() => {
    if (ficha.id !== formData.id) {
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
  }, [ficha.id]);

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
    const timer = setTimeout(() => {
      const isStudent = currentUser.role === 'aluno';
      const fichaToSave: FichaTCC = {
        ...formData,
        usuarioId: formData.usuarioId || (isStudent ? currentUser.id : ''),
        usuarioEmail: formData.usuarioEmail || (isStudent ? currentUser.email : ''),
        logoUrl: storageService.getInstitutionalLogo() || formData.logoUrl || ''
      };
      storageService.saveFicha(fichaToSave);
      lastSavedJson.current = currentJson;
      setAutoSaveStatus('Sincronizado');
    }, 1200);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfessorOrientadorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProf = e.target.value;
    const autoSig = getSignatureForProfessor(selectedProf);
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const isStudent = currentUser.role === 'aluno';
    const fichaToSave: FichaTCC = {
      ...formData,
      usuarioId: formData.usuarioId || (isStudent ? currentUser.id : ''),
      usuarioEmail: formData.usuarioEmail || (isStudent ? currentUser.email : ''),
      parecerAtendido: isStudent && Boolean(formData.parecerOrientador?.trim()) ? true : formData.parecerAtendido,
      dataAtendimentoParecer: isStudent && Boolean(formData.parecerOrientador?.trim()) ? new Date().toISOString() : formData.dataAtendimentoParecer,
      logoUrl: storageService.getInstitutionalLogo() || formData.logoUrl || ''
    };
    setFormData(fichaToSave);
    storageService.saveFicha(fichaToSave);
    onSave(fichaToSave);
    setIsSaving(false);
    setJustSaved(true);
    setSaveSuccessMsg('Ficha salva com sucesso! Os dados estão sincronizados na nuvem.');
    setTimeout(() => {
      setJustSaved(false);
      setSaveSuccessMsg('');
    }, 4000);
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
            type="submit"
            className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Ficha</span>
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

      {exportNotice && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-200 rounded-xl text-sm font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Teacher Feedback / Parecer Banner in Editor */}
      {formData.parecerOrientador?.trim() && (
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
      <div className="bg-[#0d1527] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800/80 pb-2 flex items-center justify-between">
          <span>Identificação Acadêmica</span>
          <span className="text-xs font-normal text-slate-400 lowercase">cabeçalho oficial FAATESP</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Trabalho de Conclusão (TCC)
            </label>
            <input
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
              placeholder="Ex: Desenvolvimento de Sistema Web para Gestão de Atividades de TCC"
              className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Aluno(a)
            </label>
            <input
              type="text"
              name="nomeAluno"
              id="field_tcc_aluno_nome"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              value={formData.nomeAluno || ''}
              onChange={handleChange}
              placeholder="Digite o nome completo do aluno(a)"
              className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-blue-400/70"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Curso
            </label>
            <select
              name="curso"
              id="field_tcc_curso"
              data-lpignore="true"
              value={formData.curso || ''}
              onChange={handleChange}
              className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Professor(a) Orientador(a)
            </label>
            <select
              name="professorOrientador"
              id="field_tcc_orientador"
              data-lpignore="true"
              value={formData.professorOrientador || ''}
              onChange={handleProfessorOrientadorChange}
              className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium"
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
        <h3 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800/80 pb-2">
          Conteúdo do Projeto de TCC
        </h3>

        {/* 1) Situação-problema */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            1) Situação-Problema
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
            value={formData.situacaoProblema}
            onChange={handleChange}
            rows={4}
            placeholder="Digite aqui a situação-problema do TCC: apresente a contextualização do tema, a justificativa e o problema central a ser investigado..."
            className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500"
          />
        </div>

        {/* 2) Hipótese */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            2) Hipótese
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
            value={formData.hipotese}
            onChange={handleChange}
            rows={4}
            placeholder="Digite aqui a hipótese do TCC: apresente a premissa, suposição teórica ou solução esperada para resolver a situação-problema..."
            className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500"
          />
        </div>

        {/* 3) Referências Bibliográficas */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            3) Referências Bibliográficas
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
            value={formData.bibliografia}
            onChange={handleChange}
            rows={4}
            placeholder="Digite aqui as referências bibliográficas iniciais conforme as normas da ABNT (livros, artigos científicos, teses, legislação, etc.)..."
            className="w-full bg-[#0b1325] text-white border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs placeholder:text-slate-500"
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
