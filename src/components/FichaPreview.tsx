import React from 'react';
import { FichaTCC } from '../types';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { getSignatureForProfessor, OFFICIAL_FAATESP_LOGO } from '../utils/signatures';
import { storageService } from '../services/storage';

interface FichaPreviewProps {
  ficha: FichaTCC;
  idToCapture?: string;
  className?: string;
}

export const FichaPreview: React.FC<FichaPreviewProps> = ({
  ficha,
  idToCapture = 'ficha-preview-container',
  className = ''
}) => {
  const orientacoes = ficha.orientacoes || [];
  const semestreText = ficha.semestre || '7º Semestre 2026/2';
  const institutionalLogo = storageService.getInstitutionalLogo() || ficha.logoUrl || OFFICIAL_FAATESP_LOGO;
  const orientadorSignature = ficha.assinaturaUrl || getSignatureForProfessor(ficha.professorOrientador);

  return (
    <div className={`w-full max-w-[794px] mx-auto ${className}`}>
      {/* Official A4 Sheet Canvas - Single Page Strictly Constrained */}
      <div
        id={idToCapture}
        className="print-container"
        style={{
          width: '100%',
          maxWidth: '794px',
          minHeight: '1080px',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '76px 30px 24px 30px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11px',
          lineHeight: '1.3',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* 1. Header Block with Centered Institutional Logo */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 0 24px 0' }}>
            <img
              src={institutionalLogo}
              alt="Logotipo Oficial FAATESP"
              style={{ maxHeight: '88px', width: 'auto', maxWidth: '420px', display: 'block', objectFit: 'contain' }}
              referrerPolicy="no-referrer"
            />
          </div>
          <div
            style={{
              backgroundColor: '#071526',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '4px 12px 6px 12px',
              textAlign: 'center',
              fontWeight: 900,
              fontSize: '12.5px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '28px'
            }}
          >
            <span style={{ transform: 'translateY(-1.5px)', display: 'inline-block' }}>
              FICHA DE ACOMPANHAMENTO DE TCC
            </span>
          </div>

          <div style={{ borderBottom: '1.5px solid #071526', marginTop: '8px', marginBottom: '10px' }} />
        </div>

        {/* 2. Academic Identification Table - Semantic HTML Table for 100% Reliable Rendering */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1.5px solid #071526',
            marginBottom: '10px',
            backgroundColor: '#ffffff'
          }}
        >
          <tbody>
            {/* Row 1: Nome do Aluno & Semestre / Ano */}
            <tr>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '72%',
                  verticalAlign: 'top',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  NOME DO ALUNO(A):
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', display: 'block', marginTop: '3px' }}>
                  {ficha.nomeAluno || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>Não informado</span>}
                </span>
              </td>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '28%',
                  verticalAlign: 'top',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0056b3', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  SEMESTRE / ANO:
                </span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#0066cc', display: 'block', marginTop: '3px' }}>
                  {semestreText}
                </span>
              </td>
            </tr>

            {/* Row 2: Curso & Professor Orientador */}
            <tr>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '72%',
                  verticalAlign: 'top',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  CURSO:
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '3px' }}>
                  {ficha.curso || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>Não informado</span>}
                </span>
              </td>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '28%',
                  verticalAlign: 'top',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  PROFESSOR(A) ORIENTADOR(A):
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginTop: '3px' }}>
                  {ficha.professorOrientador || 'Profa. Marinês Borba'}
                </span>
              </td>
            </tr>

            {/* Row 3: Título do Trabalho & Nota Final */}
            <tr>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '72%',
                  verticalAlign: 'top',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  TÍTULO DO TRABALHO DE CONCLUSÃO DE CURSO (TCC):
                </span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', display: 'block', marginTop: '3px', lineHeight: '1.35' }}>
                  {ficha.tituloTrabalho || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>Título não preenchido</span>}
                </span>
              </td>
              <td
                style={{
                  border: '1px solid #94a3b8',
                  padding: '6px 10px',
                  width: '28%',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569', display: 'block', textTransform: 'uppercase', lineHeight: '1' }}>
                  NOTA FINAL:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#0066cc', display: 'block', marginTop: '3px' }}>
                  {ficha.nota ? `${ficha.nota} / 10` : '___ / 10'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Numbered Sections (1: Situação-Problema, 2: Hipótese, 3: Bibliografia) */}
        <div style={{ marginBottom: '10px' }}>
          {/* 1) Situação-problema */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#071526',
                color: '#ffffff',
                padding: '3px 8px 5px 8px',
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                borderRadius: '2px 2px 0 0',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                minHeight: '22px'
              }}
            >
              <span style={{ transform: 'translateY(-1.5px)', display: 'inline-block' }}>
                1) SITUAÇÃO-PROBLEMA
              </span>
            </div>
            <div
              style={{
                border: '1.5px solid #071526',
                borderTop: 'none',
                padding: '10px 18px',
                backgroundColor: '#ffffff',
                fontSize: '10.5px',
                color: '#0f172a',
                textAlign: 'justify',
                lineHeight: '1.45',
                minHeight: '52px',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap'
              }}
            >
              {ficha.situacaoProblema || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhum conteúdo informado.</span>}
            </div>
          </div>

          {/* 2) Hipótese */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#071526',
                color: '#ffffff',
                padding: '3px 8px 5px 8px',
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                borderRadius: '2px 2px 0 0',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                minHeight: '22px'
              }}
            >
              <span style={{ transform: 'translateY(-1.5px)', display: 'inline-block' }}>
                2) HIPÓTESE
              </span>
            </div>
            <div
              style={{
                border: '1.5px solid #071526',
                borderTop: 'none',
                padding: '10px 18px',
                backgroundColor: '#ffffff',
                fontSize: '10.5px',
                color: '#0f172a',
                textAlign: 'justify',
                lineHeight: '1.45',
                minHeight: '42px',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap'
              }}
            >
              {ficha.hipotese || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhum conteúdo informado.</span>}
            </div>
          </div>

          {/* 3) Referências Bibliográficas */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                backgroundColor: '#071526',
                color: '#ffffff',
                padding: '3px 8px 5px 8px',
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                borderRadius: '2px 2px 0 0',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                minHeight: '22px'
              }}
            >
              <span style={{ transform: 'translateY(-1.5px)', display: 'inline-block' }}>
                3) REFERÊNCIAS BIBLIOGRÁFICAS
              </span>
            </div>
            <div
              style={{
                border: '1.5px solid #071526',
                borderTop: 'none',
                padding: '10px 18px',
                backgroundColor: '#ffffff',
                fontSize: '10px',
                color: '#0f172a',
                textAlign: 'justify',
                lineHeight: '1.45',
                minHeight: '40px',
                boxSizing: 'border-box'
              }}
            >
              {ficha.bibliografia ? (
                ficha.bibliografia.split(/\r?\n+/).map((item, idx, arr) => (
                  <p key={idx} style={{ margin: 0, marginBottom: idx === arr.length - 1 ? 0 : '8px' }}>
                    {item.trim()}
                  </p>
                ))
              ) : (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhuma referência informada.</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Quadros de Orientações Presenciais LADO A LADO */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              backgroundColor: '#071526',
              color: '#ffffff',
              padding: '3px 8px 5px 8px',
              fontWeight: 'bold',
              fontSize: '11px',
              borderRadius: '2px 2px 0 0',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '22px'
            }}
          >
            <span style={{ transform: 'translateY(-1.5px)', display: 'inline-block' }}>
              REGISTRO DE ORIENTAÇÕES PRESENCIAIS (MÍNIMO DE 2 ORIENTAÇÕES)
            </span>
            <span style={{ fontSize: '9px', fontWeight: 'normal', color: '#cbd5e1', transform: 'translateY(-1.5px)', display: 'inline-block' }}>
              Total: {orientacoes.length} orientação(ões)
            </span>
          </div>

          <div
            style={{
              border: '1.5px solid #071526',
              borderTop: 'none',
              padding: '8px',
              backgroundColor: '#f8fafc'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px 0' }}>
              <tbody>
                <tr>
                  {orientacoes.length > 0 ? (
                    orientacoes.slice(0, 2).map((ori, index) => (
                      <td
                        key={ori.id || index}
                        style={{
                          width: '50%',
                          verticalAlign: 'top',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          padding: '8px'
                        }}
                      >
                        <div>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#0f172a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar style={{ width: '12px', height: '12px', color: '#2563eb', flexShrink: 0 }} />
                              <span>{index + 1}ª Orientação Presencial</span>
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#334155' }}>
                              {ori.data ? new Date(ori.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}{' '}
                              {ori.horario ? `às ${ori.horario}` : ''}
                            </span>
                          </div>

                          {/* Observations */}
                          <div style={{ fontSize: '10px', color: '#1e293b', lineHeight: '1.4', minHeight: '32px' }}>
                            {ori.observacao || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sem observações registradas</span>}
                          </div>
                        </div>

                        {/* Status */}
                        <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                          {ori.confirmado ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: 'bold' }}>
                              <CheckCircle style={{ width: '12px', height: '12px', color: '#16a34a', flexShrink: 0 }} />
                              <span>Confirmado pelo Orientador</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 500 }}>
                              <Clock style={{ width: '12px', height: '12px', color: '#d97706', flexShrink: 0 }} />
                              <span>Aguardando Validação</span>
                            </div>
                          )}
                          {ori.dataConfirmacao && (
                            <span style={{ fontSize: '8px', color: '#64748b', fontFamily: 'monospace' }}>
                              {ori.dataConfirmacao.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    ))
                  ) : (
                    <td
                      colSpan={2}
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        fontSize: '11px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    >
                      Nenhuma orientação registrada no formulário.
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Parecer e Nota do Orientador (Se houver) */}
        {(ficha.parecerOrientador || ficha.nota) && (
          <div style={{ marginBottom: '10px', padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', fontSize: '10px' }}>
                Parecer do Professor Orientador:
              </span>
              {ficha.nota && (
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#1e40af', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  Nota: {ficha.nota}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: '#334155', fontStyle: 'italic', lineHeight: '1.3' }}>
              "{ficha.parecerOrientador || 'Trabalho de TCC acompanhado conforme o cronograma acadêmico institucional.'}"
            </p>
          </div>
        )}

        {/* 6. Bloco Oficial de Assinatura (Somente Orientador à Direita) */}
        <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
            {/* Orientador Signature */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '280px' }}>
              <div
                style={{
                  width: '100%',
                  borderBottom: '1.5px solid #0b192c',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '2px'
                }}
              >
                {orientadorSignature ? (
                  <img
                    src={orientadorSignature}
                    alt={`Assinatura - ${ficha.professorOrientador || 'Orientador'}`}
                    style={{ maxHeight: '52px', width: 'auto', maxWidth: '240px', display: 'block', objectFit: 'contain' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#334155' }}>
                    {ficha.professorOrientador || 'Profa. Marinês Borba'}
                  </span>
                )}
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a', textTransform: 'uppercase', margin: '3px 0 0 0' }}>
                {ficha.professorOrientador || 'Profa. Marinês Borba'}
              </p>
              <p style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', margin: '1px 0 0 0' }}>
                Professor(a) Orientador(a)
              </p>
            </div>
          </div>

          {/* Footer Date and Project Attribution */}
          <div style={{ textAlign: 'center', marginTop: '12px', paddingTop: '6px', fontSize: '9px', color: '#64748b', fontWeight: 500, borderTop: '1px solid #f1f5f9' }}>
            <div>
              São Paulo, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ color: '#0f172a', fontWeight: 'bold', marginTop: '2px' }}>
              Project Maket by Mister Roger 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
