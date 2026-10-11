import React, { useState } from 'react';
import { FichaTCC, User } from '../types';
import { storageService } from '../services/storage';
import { cloudStorageService } from '../services/cloudStorage';
import {
  Plus,
  Search,
  FileText,
  FileEdit,
  Eye,
  FileType,
  Trash2,
  Calendar,
  CheckCircle2,
  User as UserIcon,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { generatePdf } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';

interface HistoricoScreenProps {
  fichas: FichaTCC[];
  activeFichaId: string | null;
  currentUser: User;
  onSelectFicha: (id: string, action: 'editar' | 'preview') => void;
  onRefreshFichas: () => void;
  onCreateNew: () => void;
}

export const HistoricoScreen: React.FC<HistoricoScreenProps> = ({
  fichas,
  activeFichaId,
  currentUser,
  onSelectFicha,
  onRefreshFichas,
  onCreateNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState<string | null>(null);
  const [fichaToDelete, setFichaToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDownloadPdf = async (ficha: FichaTCC) => {
    try {
      setDownloadingPdfId(ficha.id);
      await generatePdf(ficha);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadDocx = async (ficha: FichaTCC) => {
    try {
      setDownloadingDocxId(ficha.id);
      await generateDocx(ficha);
    } catch (err) {
      console.error('Erro ao baixar DOCX:', err);
    } finally {
      setDownloadingDocxId(null);
    }
  };

  const filteredFichas = fichas.filter(
    (f) =>
      f.nomeAluno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tituloTrabalho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.curso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.professorOrientador?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, title: string) => {
    setFichaToDelete({ id, title });
  };

  const confirmDelete = async () => {
    if (!fichaToDelete) return;
    await cloudStorageService.deleteFicha(fichaToDelete.id);
    onRefreshFichas();
    setFichaToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-[#0d1527] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Histórico de Fichas de TCC</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie, altere, consulte e recupere todas as fichas gravadas no sistema.
          </p>
        </div>

        {(currentUser.role !== 'aluno' || fichas.length === 0) && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Ficha TCC</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          id="search_history_fichas"
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome do aluno, título, curso ou professor orientador..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0b1325] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Fichas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFichas.map((ficha) => {
          const isActive = ficha.id === activeFichaId;
          const orientacoesCount = ficha.orientacoes?.length || 0;
          const orientacoesConfirmadas = ficha.orientacoes?.filter((o) => o.confirmado).length || 0;

          return (
            <div
              key={ficha.id}
              className={`bg-[#0d1527] rounded-2xl border p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0b1b36] text-blue-400 border border-blue-800/60">
                    {ficha.curso || 'Curso FAATESP'}
                  </span>

                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      Ficha Ativa Em Uso
                    </span>
                  )}
                </div>

                {/* Title & Student */}
                <div>
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                    {ficha.tituloTrabalho || 'Sem título definido'}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    <p className="flex items-center space-x-1.5 font-medium">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{ficha.nomeAluno || 'Aluno não informado'}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Orientador: {ficha.professorOrientador || 'Não informado'}</span>
                    </p>
                  </div>
                </div>

                {/* Details Pill */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(ficha.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 justify-end">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>
                      {orientacoesConfirmadas}/{orientacoesCount} Orientações
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onSelectFicha(ficha.id, 'editar')}
                    className="px-2.5 py-1.5 bg-[#0b1b36] hover:bg-blue-900/40 text-blue-300 font-medium text-xs rounded-lg border border-blue-800/60 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => onSelectFicha(ficha.id, 'preview')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pré-Visualização</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingPdfId === ficha.id}
                    onClick={() => handleDownloadPdf(ficha)}
                    className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900/60 text-rose-300 font-medium text-xs rounded-lg border border-rose-800/60 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    title="Baixar PDF diretamente"
                  >
                    {downloadingPdfId === ficha.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileType className="w-3.5 h-3.5" />}
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingDocxId === ficha.id}
                    onClick={() => handleDownloadDocx(ficha)}
                    className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900/60 text-blue-300 font-medium text-xs rounded-lg border border-blue-800/60 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    title="Baixar Word (.DOCX) diretamente"
                  >
                    {downloadingDocxId === ficha.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Word</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(ficha.id, ficha.tituloTrabalho)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Ficha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredFichas.length === 0 && (
          <div className="col-span-full bg-[#0d1527] p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">Nenhuma ficha encontrada</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não há fichas correspondentes ao termo de busca. Clique no botão abaixo para registrar uma nova ficha de TCC.
            </p>
            {(currentUser.role !== 'aluno' || fichas.length === 0) && (
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Nova Ficha</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Ficha Modal */}
      {fichaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0d1527] rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-white">Excluir Ficha de TCC?</h4>
            <p className="text-xs text-slate-300">
              Deseja realmente excluir a ficha "{fichaToDelete.title || 'Sem título'}"? Esta ação removerá a ficha permanentemente.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setFichaToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
