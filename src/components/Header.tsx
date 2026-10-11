import React from 'react';
import { ActiveScreen, User } from '../types';
import {
  GraduationCap,
  LayoutDashboard,
  FileEdit,
  Eye,
  FileDown,
  History,
  LogOut,
  UserCheck,
  User as UserIcon,
  SearchCheck
} from 'lucide-react';

interface HeaderProps {
  user: User;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  hasUnreadParecer?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeScreen,
  onNavigate,
  onLogout,
  hasUnreadParecer = false
}) => {
  const navItems = [
    { id: 'main' as ActiveScreen, label: 'Início', icon: LayoutDashboard },
    ...(user.role === 'orientador'
      ? [{ id: 'consulta' as ActiveScreen, label: 'Consultar & Corrigir', icon: SearchCheck }]
      : []),
    { id: 'editar' as ActiveScreen, label: 'Editar Ficha', icon: FileEdit },
    { id: 'preview' as ActiveScreen, label: 'Pré-Visualização', icon: Eye },
    ...(user.role === 'orientador'
      ? [{ id: 'historico' as ActiveScreen, label: 'Histórico', icon: History }]
      : [])
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('main')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">
                Project Maker
              </span>
              <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase block">
                FAATESP TCC
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === 'editar' && hasUnreadParecer && (
                    <span className="relative flex h-2 w-2" title="Novo parecer do orientador">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {/* Cloud Sync Status Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 shadow-sm" title="Banco de dados em nuvem ativo e sincronizado">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Nuvem Ativa</span>
            </div>

            {/* Fixed Logged-in Mode Badge */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                user.role === 'orientador'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                  : 'bg-blue-950/80 text-blue-300 border-blue-600/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{user.role === 'orientador' ? 'Modo: Orientador' : 'Modo: Aluno'}</span>
            </div>

            {/* User Avatar & Name */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sair do aplicativo"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-1 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'editar' && hasUnreadParecer && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
