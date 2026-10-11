import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  GraduationCap,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Mail,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

// Allowed emails for Professor Orientador (Docente)
const ALLOWED_ORIENTADOR_EMAILS = [
  'faatesp.professor.rogerioaugusto@gmail.com',
  'marines.borba1@gmail.com'
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isOrientadorAuthorized(email: string): boolean {
  if (!email) return false;
  return ALLOWED_ORIENTADOR_EMAILS.includes(normalizeEmail(email));
}

function getPredefinedNameForEmail(email: string, role: UserRole): string {
  const norm = normalizeEmail(email);
  if (norm === 'faatesp.professor.rogerioaugusto@gmail.com') {
    return 'Prof. Rogério Augusto';
  }
  if (norm === 'marines.borba1@gmail.com') {
    return 'Profa. Marinês Borba';
  }
  // Generate friendly name from email username part for alunos
  const username = email.split('@')[0] || 'Aluno';
  return username
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('aluno');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail para prosseguir.');
      return;
    }

    // Basic email format validation
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, insira um formato de e-mail válido (exemplo: usuario@gmail.com).');
      return;
    }

    const isAuthorizedDocente = isOrientadorAuthorized(cleanEmail);

    // If user selected "Professor Orientador", check if email is authorized
    if (role === 'orientador') {
      if (!isAuthorizedDocente) {
        setErrorMessage(
          'Acesso Negado: O e-mail informado não possui autorização para o perfil "Professor Orientador". Por favor, selecione o perfil "Aluno" para prosseguir.'
        );
        return;
      }
    }

    // Vice-versa: If an authorized professor selected "Aluno", alert them to select Professor Orientador
    if (role === 'aluno') {
      if (isAuthorizedDocente) {
        setErrorMessage(
          'Atenção: Este e-mail é cadastrado como Professor Orientador. Por favor, selecione o perfil "Professor Orientador" para acessar suas ferramentas de docente.'
        );
        return;
      }
    }

    const userName = getPredefinedNameForEmail(cleanEmail, role);
    const stableUserId = `user_${cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const user: User = {
      id: stableUserId,
      name: userName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`,
      role: role,
      cursoDefault: ''
    };

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Soft background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10 space-y-6">
        {/* FAATESP Header Logo */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white mb-4 shadow-xl shadow-blue-500/25 border border-blue-400/30">
            <GraduationCap className="w-10 h-10" />
          </div>

          <div className="block mb-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#0b1b36] text-blue-400 border border-blue-800/60 text-[11px] font-semibold tracking-wide">
              Plataforma Oficial TCC
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
            Project Maker
          </h1>
          <p className="text-blue-500 font-extrabold text-xs tracking-widest uppercase mb-3">
            FAATESP
          </p>

          <p className="text-slate-400 text-xs sm:text-sm text-center leading-relaxed max-w-sm mx-auto">
            Sistema de elaboração, acompanhamento presencial e exportação oficial da Ficha de Atividades de TCC.
          </p>
        </div>

        {/* Primary Login Form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          data-lpignore="true"
          className="bg-[#0D1527] rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4 shadow-2xl"
        >
          {/* Hidden inputs to prevent aggressive browser autofill and address manager popups */}
          <input type="text" name="prevent_autofill_user" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="new-password" />

          <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Acesso ao Sistema</span>
            </h2>
            <span className="text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-medium">
              Controle de Acesso
            </span>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-white text-xs font-bold flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span>E-mail</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="email"
                required
                id="login_auth_user_field"
                name="usr_login_identifier_unfilled"
                autoComplete="one-time-code"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ex: seu.email@gmail.com, hotmail.com, etc."
                className="w-full bg-[#0b1325] text-white border border-slate-700/90 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Informe seu e-mail institucional ou pessoal.
            </p>
          </div>

          {/* Profile / Role Selector Dropdown */}
          <div className="space-y-1.5 pt-1">
            <label className="text-white text-xs font-bold flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Perfil de Acesso</span>
              <span className="text-rose-400 font-bold">*</span>
            </label>

            <div className="relative">
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full bg-[#0b1325] text-white font-bold border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-all pr-10"
              >
                <option value="aluno" className="bg-slate-900 text-white py-1">
                  Aluno (Discente)
                </option>
                <option value="orientador" className="bg-slate-900 text-white py-1">
                  Professor Orientador (Docente)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <p className="text-[11px] text-slate-400">
              {role === 'aluno'
                ? 'Acesso aberto a todos os alunos para preenchimento de ficha de TCC.'
                : 'Acesso restrito exclusivamente aos e-mails dos professores orientadores autorizados.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-600/80 rounded-xl text-rose-200 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
            >
              <span>Acessar Plataforma</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="pt-1 text-center text-xs text-slate-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Plataforma Acadêmica Oficial · FAATESP</span>
        </div>
      </div>
    </div>
  );
};
