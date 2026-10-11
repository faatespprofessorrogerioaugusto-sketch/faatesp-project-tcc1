import React, { useState } from 'react';
import { ActiveScreen, FichaTCC, User } from '../types';
import {
  FileEdit,
  Eye,
  FileDown,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  SearchCheck,
  Loader2,
  Check,
  FileType,
  FileText,
  Bell,
  ArrowRight
} from 'lucide-react';
import { generatePdf } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';
import { FichaPreview } from './FichaPreview';

interface MainDashboardProps {
  user: User;
  activeFicha: FichaTCC;
  onNavigate: (screen: ActiveScreen) => void;
  onCreateNew: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  user,
  activeFicha,
  onNavigate,
  onCreateNew
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const orientacoesCount = activeFicha.orientacoes?.length || 0;
  const orientacoesConfirmadas = activeFicha.orientacoes?.filter((o) => o.confirmado).length || 0;
  const meetsMinOrientations = orientacoesCount >= 2;
  const hasProblem = Boolean(activeFicha.situacaoProblema?.trim());
  const hasHypothesis = Boolean(activeFicha.hipotese?.trim());
  const hasBiblio = Boolean(activeFicha.bibliografia?.trim());

  const handleDirectExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportNotice(null);
      await generatePdf('global-export-preview-canvas', activeFicha);
      setExportNotice('Arquivo PDF baixado com sucesso! Você permaneceu nesta tela.');
      setTimeout(() => setExportNotice(null), 4000);
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
      await generateDocx(activeFicha);
      setExportNotice('Arquivo Word (.DOCX) baixado com sucesso! Você permaneceu nesta tela.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setExportNotice('Erro ao gerar DOCX.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Welcome & FAATESP Institutional Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Plataforma Acadêmica FAATESP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Olá, {user.name}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Bem-vindo ao <strong>Project Maker - Faatesp</strong>. Preencha, acompanhe, salve e exporte sua ficha de acompanhamento de atividades presenciais de TCC.
            </p>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 text-center shrink-0 min-w-[200px]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
              Nota Atual / Status
            </span>
            <span className="text-2xl font-black text-blue-400 block my-1">
              {activeFicha.nota ? `${activeFicha.nota} / 10` : 'Pendente'}
            </span>
            <span className="text-[11px] font-semibold text-amber-300 block">
              Perfil: {user.role === 'orientador' ? 'Professor Orientador' : 'Aluno'}
            </span>
          </div>
        </div>
      </div>

      {/* Special Orientador Module Card */}
      {user.role === 'orientador' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 p-5 rounded-2xl border border-amber-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shrink-0">
              <SearchCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700">
                Módulo do Professor Orientador
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Consulta & Parecer em Fichas de Alunos
              </h3>
              <p className="text-xs text-slate-300">
                Pesquise fichas enviadas, forneça o parecer de correção, atribua notas e exporte a folha final corrigida em PDF.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('consulta')}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <SearchCheck className="w-4 h-4" />
            <span>Acessar Consulta de Fichas</span>
          </button>
        </div>
      )}

      {/* Pulsing Card: Notificação de Parecer do Orientador para o Aluno (desaparece quando ajustado e salvo) */}
      {activeFicha.parecerOrientador?.trim() && !activeFicha.parecerAtendido && (
        <div
          onClick={() => onNavigate('editar')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onNavigate('editar');
            }
          }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 p-5 sm:p-6 shadow-[0_0_30px_rgba(251,191,36,0.35)] transition-all duration-300 hover:scale-[1.01] hover:border-amber-300 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-pulse"
        >
          {/* Animated decorative beacon in corner */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              Nova Correção
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-500/20 text-amber-300 border-2 border-amber-400/60 rounded-2xl shrink-0 shadow-lg">
                <Bell className="w-7 h-7 text-amber-300 animate-bounce" />
              </div>
              <div className="space-y-1.5 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/50">
                    Atenção Aluno
                  </span>
                  {activeFicha.professorOrientador && (
                    <span className="text-xs text-slate-300">
                      por <strong className="text-white">{activeFicha.professorOrientador}</strong>
                    </span>
                  )}
                  {activeFicha.nota && (
                    <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                      Nota: {activeFicha.nota}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                  <span>Parecer e Orientações de Correção Disponíveis!</span>
                </h3>

                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed bg-black/30 p-3 rounded-xl border border-amber-500/30 italic">
                  "{activeFicha.parecerOrientador.length > 200
                    ? `${activeFicha.parecerOrientador.substring(0, 200)}...`
                    : activeFicha.parecerOrientador}"
                </p>

                <p className="text-[11px] text-amber-300/80 font-medium">
                  Seu orientador avaliou sua ficha. Clique neste card para abrir a edição e aplicar os ajustes solicitados.
                </p>
              </div>
            </div>

            <div className="shrink-0 pt-2 md:pt-0">
              <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl group-hover:bg-amber-300 transition-colors">
                <span>Abrir Edição de Ficha</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Ficha Card Summary */}
      <div className="bg-[#0D1527] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-800/80">
              Ficha em Andamento
            </span>
            <h2 className="text-lg font-bold text-white mt-1.5 leading-snug">
              {activeFicha.tituloTrabalho || 'Título do Trabalho não informado'}
            </h2>
          </div>

          {user.role !== 'aluno' ? (
            <button
              onClick={onCreateNew}
              className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Ficha TCC</span>
            </button>
          ) : (
            <div className="self-start sm:self-auto px-3 py-1 bg-blue-950/80 text-blue-300 border border-blue-800/80 rounded-lg text-xs font-semibold shrink-0">
              Ficha Única do Aluno
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#070C18] p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Aluno</span>
            <p className="font-semibold text-white truncate">{activeFicha.nomeAluno || '—'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Curso</span>
            <p className="font-semibold text-white truncate">{activeFicha.curso || '—'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Semestre</span>
            <p className="font-semibold text-white truncate">{activeFicha.semestre || '—'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Orientador</span>
            <p className="font-semibold text-white truncate">{activeFicha.professorOrientador || '—'}</p>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Verificação de Requisitos da Ficha FAATESP:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${hasProblem ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasProblem ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>1) Situação-Problema</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${hasHypothesis ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasHypothesis ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>2) Hipótese</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${hasBiblio ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasBiblio ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>3) Referências Bibliográficas</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${meetsMinOrientations ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-amber-950/60 border-amber-800 text-amber-300'}`}>
              {meetsMinOrientations ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span>Mínimo 2 Orientações ({orientacoesCount}/2)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {exportNotice && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Main Navigation Actions Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${user.role === 'orientador' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {/* Edit Action */}
        <button
          onClick={() => onNavigate('editar')}
          className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 hover:border-blue-500/60 hover:shadow-xl transition-all text-left space-y-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Editar Ficha TCC</h3>
            <p className="text-xs text-slate-400 mt-1">
              Preencha dados, situação-problema, hipótese e orientações.
            </p>
          </div>
        </button>

        {/* Direct PDF Export Action */}
        <button
          type="button"
          onClick={handleDirectExportPdf}
          disabled={isExportingPdf}
          className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 hover:border-rose-500/60 hover:shadow-xl transition-all text-left space-y-3 group cursor-pointer disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
            {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileType className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Exportar PDF</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isExportingPdf ? 'Gerando arquivo PDF...' : 'Baixe o PDF oficial de TCC diretamente nesta tela.'}
            </p>
          </div>
        </button>

        {/* Direct DOCX Export Action */}
        <button
          type="button"
          onClick={handleDirectExportDocx}
          disabled={isExportingDocx}
          className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 hover:border-blue-500/60 hover:shadow-xl transition-all text-left space-y-3 group cursor-pointer disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {isExportingDocx ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Exportar Word (.DOCX)</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isExportingDocx ? 'Gerando arquivo Word...' : 'Baixe o documento Word oficial diretamente nesta tela.'}
            </p>
          </div>
        </button>

        {/* Real-Time Preview Action */}
        <button
          onClick={() => onNavigate('preview')}
          className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/60 hover:shadow-xl transition-all text-left space-y-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Pré-Visualização</h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualize a folha A4 oficial no formato visual original.
            </p>
          </div>
        </button>

        {/* History Action (Exclusively for Orientador) */}
        {user.role === 'orientador' && (
          <button
            onClick={() => onNavigate('historico')}
            className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 hover:border-amber-500/60 hover:shadow-xl transition-all text-left space-y-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Histórico de Fichas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Acesse e gerencie fichas gravadas anteriormente.
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
