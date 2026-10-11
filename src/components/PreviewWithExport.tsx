import React, { useState } from 'react';
import { FichaTCC } from '../types';
import { FichaPreview } from './FichaPreview';
import { generatePdf, printDirectly } from '../utils/exportPdf';
import { generateDocx } from '../utils/exportDocx';
import {
  FileText,
  FileEdit,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileType
} from 'lucide-react';

interface PreviewWithExportProps {
  ficha: FichaTCC;
  onNavigateMain?: () => void;
  onNavigateEdit: () => void;
}

export const PreviewWithExport: React.FC<PreviewWithExportProps> = ({
  ficha,
  onNavigateMain,
  onNavigateEdit
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setStatusMessage(null);
      await generatePdf(ficha);
      setStatusMessage({
        type: 'success',
        text: 'Download do PDF iniciado com sucesso!'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Erro ao gerar o arquivo PDF. Tente novamente.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      setStatusMessage(null);
      await generateDocx(ficha);
      setStatusMessage({
        type: 'success',
        text: 'Download do documento Word (.DOCX) iniciado com sucesso!'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Erro ao gerar arquivo Word (.DOCX). Tente novamente.'
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printDirectly('ficha-preview-container', ficha);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="bg-[#0D1527] p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Pré-Visualização da Ficha TCC</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modelo oficial formatado para impressão e exportação em tamanho A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNavigateEdit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5 text-blue-400" />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileType className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            {isExportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingDocx ? 'Gerando...' : 'Word (.DOCX)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            {isPrinting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Render Document */}
      <div className="overflow-x-auto flex justify-center py-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4">
        <FichaPreview ficha={ficha} />
      </div>
    </div>
  );
};
