import React, { useState, useEffect } from 'react';
import { ActiveScreen, FichaTCC, User } from './types';
import { storageService, isMarineuza } from './services/storage';
import { cloudStorageService } from './services/cloudStorage';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { MainDashboard } from './components/MainDashboard';
import { FichaForm } from './components/FichaForm';
import { FichaPreview } from './components/FichaPreview';
import { PreviewWithExport } from './components/PreviewWithExport';
import { HistoricoScreen } from './components/HistoricoScreen';
import { ConsultaOrientadorScreen } from './components/ConsultaOrientadorScreen';
import { ManualScreen } from './components/ManualScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('main');
  const [fichas, setFichas] = useState<FichaTCC[]>([]);
  const [activeFicha, setActiveFicha] = useState<FichaTCC | null>(null);

  // Initial screen must ALWAYS be the Login Screen (do not auto-login on startup)
  useEffect(() => {
    setUser(null);
    setActiveFicha(null);
    try {
      localStorage.removeItem('pm_faatesp_active_ficha_id');
    } catch {
      // ignore
    }
  }, []);

  // Single Get query to Firestore strictly executed once on initial startup
  useEffect(() => {
    loadFichasData(null, false);
  }, []);

  const loadFichasData = async (currentUser?: User | null, forceFresh = false) => {
    const activeUser = currentUser !== undefined ? currentUser : user;
    const allFichas = await cloudStorageService.getFichas(forceFresh);
    setFichas(allFichas);

    if (!activeUser) {
      setActiveFicha(null);
      return;
    }

    if (activeUser.role === 'aluno') {
      const studentFicha = await cloudStorageService.getStudentFicha(activeUser);
      setActiveFicha(studentFicha);
      storageService.setActiveFichaId(studentFicha.id);
    } else {
      // For Professor Orientador:
      // If an active ficha was previously selected to review, preserve it
      const activeId = storageService.getActiveFichaId();
      if (activeId) {
        const found = allFichas.find((f) => f.id === activeId);
        if (found) {
          setActiveFicha(found);
        }
      }
    }
  };

  const handleLoginSuccess = async (loggedUser: User) => {
    storageService.setLoggedUser(loggedUser);
    cloudStorageService.logUserAccess(loggedUser, 'login');
    // Clear any previous active ficha from other users or outdated sessions
    try {
      localStorage.removeItem('pm_faatesp_active_ficha_id');
      localStorage.removeItem('pm_faatesp_active_ficha');
    } catch {}
    setActiveFicha(null);
    await loadFichasData(loggedUser);
    setUser(loggedUser);
    if (loggedUser.role === 'orientador') {
      setActiveScreen('consulta');
    } else {
      setActiveScreen('main');
    }
  };

  const handleLogout = () => {
    if (user) {
      cloudStorageService.logUserAccess(user, 'logout');
    }
    storageService.logoutUser();
    setUser(null);
    setActiveFicha(null);
    try {
      localStorage.removeItem('pm_faatesp_active_ficha_id');
      localStorage.removeItem('pm_faatesp_active_ficha');
    } catch {
      // ignore
    }
    setActiveScreen('main');
  };

  const handleSaveFicha = async (updatedFicha: FichaTCC) => {
    // 1. Immediately update React state synchronously (0 ms)
    setFichas((prevFichas) => {
      const idx = prevFichas.findIndex((f) => f.id === updatedFicha.id);
      if (idx >= 0) {
        const copy = [...prevFichas];
        copy[idx] = updatedFicha;
        return copy;
      }
      return [updatedFicha, ...prevFichas];
    });
    setActiveFicha(updatedFicha);
    storageService.setActiveFichaId(updatedFicha.id);
    storageService.saveFicha(updatedFicha);

    // 2. Persist to cloud/backend asynchronously without blocking UI
    try {
      await cloudStorageService.saveFicha(updatedFicha);
    } catch (err) {
      console.warn('Erro ao salvar no cloudStorage:', err);
    }
  };

  const handleCreateNew = async () => {
    if (!user) return;
    const newFicha = storageService.createNewFicha(user);
    await cloudStorageService.saveFicha(newFicha);
    await loadFichasData(user);
    setActiveFicha(newFicha);
    storageService.setActiveFichaId(newFicha.id);
    setActiveScreen('editar');
  };

  const handleSelectFichaFromHistory = (
    id: string,
    action: 'editar' | 'preview'
  ) => {
    const selected = fichas.find((f) => f.id === id) || storageService.getFichaById(id);
    if (selected) {
      storageService.setActiveFichaId(id);
      setActiveFicha(selected);
      setActiveScreen(action);
    }
  };

  const handleDeleteFicha = async (id: string) => {
    await cloudStorageService.deleteFicha(id);
    await loadFichasData(user);
  };

  // 1. Separate Login Screen Gate
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Safe resolution of current ficha: NEVER fall back to a blank ficha or another student's ficha for an aluno!
  const userEmailNorm = (user.email || '').trim().toLowerCase();
  const currentFicha = activeFicha || (
    user.role === 'aluno'
      ? (isMarineuza(user)
          ? (fichas.find(f => isMarineuza(f)) ?? storageService.getStudentFicha(user))
          : (fichas.find(f => (f.usuarioEmail || '').trim().toLowerCase() === userEmailNorm) ?? storageService.getStudentFicha(user)))
      : ((storageService.getActiveFichaId() ? fichas.find(f => f.id === storageService.getActiveFichaId()) : null) || fichas[0] || storageService.getStudentFicha(user))
  );

  return (
    <div className="min-h-screen bg-[#070C18] font-sans text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        user={user}
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onLogout={handleLogout}
        hasUnreadParecer={Boolean(currentFicha?.parecerOrientador?.trim() && !currentFicha?.parecerAtendido)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {activeScreen === 'main' && (
          <MainDashboard
            user={user}
            activeFicha={currentFicha}
            onNavigate={setActiveScreen}
            onCreateNew={handleCreateNew}
          />
        )}

        {activeScreen === 'consulta' && (
          <ConsultaOrientadorScreen
            currentUser={user}
            fichas={fichas}
            onSaveFicha={handleSaveFicha}
            onDeleteFicha={handleDeleteFicha}
            onRefreshFichas={() => loadFichasData(user, true)}
            onSelectFichaForPreview={(ficha) => {
              storageService.setActiveFichaId(ficha.id);
              setActiveFicha(ficha);
              setActiveScreen('preview');
            }}
            onNavigateToEdit={(ficha) => {
              storageService.setActiveFichaId(ficha.id);
              setActiveFicha(ficha);
              setActiveScreen('editar');
            }}
            onNavigateMain={() => setActiveScreen('main')}
          />
        )}

        {activeScreen === 'editar' && (
          <FichaForm
            ficha={currentFicha}
            currentUser={user}
            onSave={handleSaveFicha}
            onPreview={() => setActiveScreen('preview')}
            onNavigateMain={() => setActiveScreen('main')}
          />
        )}

        {activeScreen === 'preview' && (
          <PreviewWithExport
            ficha={currentFicha}
            onNavigateMain={() => setActiveScreen('main')}
            onNavigateEdit={() => setActiveScreen('editar')}
          />
        )}

        {activeScreen === 'historico' && user.role === 'orientador' && (
          <HistoricoScreen
            fichas={fichas}
            activeFichaId={currentFicha.id}
            currentUser={user}
            onSelectFicha={handleSelectFichaFromHistory}
            onRefreshFichas={loadFichasData}
            onCreateNew={handleCreateNew}
          />
        )}

        {activeScreen === 'manual' && (
          <ManualScreen
            currentUser={user}
            onNavigateMain={() => setActiveScreen('main')}
          />
        )}
      </main>

      {/* Global off-screen canvas element for PDF generation from any screen */}
      <div
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '0px',
          width: '794px',
          zIndex: -9999,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        <div style={{ width: '794px', backgroundColor: '#ffffff' }}>
          <FichaPreview ficha={currentFicha} idToCapture="global-export-preview-canvas" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 text-center no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-300">
            Project Maker - Faculdade Faatesp.
          </p>
          <p className="text-[11px] text-slate-300 font-bold">
            2026 - Todos os direitos reservados by Mister Roger
          </p>
        </div>
      </footer>
    </div>
  );
}
