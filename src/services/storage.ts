import { AccessLog, FichaTCC, User } from '../types';
import { FAATESP_LOGO_SVG } from '../utils/signatures';
import { CANONICAL_FICHAS } from './canonicalFichas';

const STORAGE_KEY_USER = 'pm_faatesp_user';
const STORAGE_KEY_FICHAS = 'pm_faatesp_fichas';
const STORAGE_KEY_ACTIVE_FICHA = 'pm_faatesp_active_ficha_id';
const STORAGE_KEY_ACCESS_LOGS = 'pm_faatesp_access_logs';
const STORAGE_KEY_INSTITUTIONAL_LOGO = 'pm_faatesp_institutional_logo';
const STORAGE_KEY_SCHEMA_VERSION = 'pm_faatesp_schema_version';
const CURRENT_SCHEMA_VERSION = 'v20261014_single_get_firestore_v2';

export function isMarineuza(item?: { id?: string; usuarioEmail?: string; email?: string; nomeAluno?: string; name?: string } | null): boolean {
  if (!item) return false;
  const id = item.id || '';
  if (id === 'ficha-1790973147343-i0su') return true;
  const email = (item.usuarioEmail || item.email || '').trim().toLowerCase();
  if (
    email === 'neuzasofia555@gmail.com' ||
    email === 'marineuza.souza@gmail.com' ||
    email === 'nauzasofia555@gmail.com'
  ) {
    return true;
  }
  const name = (item.nomeAluno || item.name || '').trim().toLowerCase();
  if (name.includes('marineuza') || name.includes('marineusa')) return true;
  return false;
}

export function sortFichasDeterministically(fichas: FichaTCC[]): FichaTCC[] {
  return [...fichas].sort((a, b) => {
    // Marineuza Lina de Souza always has top priority
    const isMarA = isMarineuza(a);
    const isMarB = isMarineuza(b);
    if (isMarA && !isMarB) return -1;
    if (!isMarA && isMarB) return 1;

    // Fichas with a defined project title come before empty drafts
    const hasTitleA = Boolean(a.tituloTrabalho && a.tituloTrabalho.trim());
    const hasTitleB = Boolean(b.tituloTrabalho && b.tituloTrabalho.trim());
    if (hasTitleA && !hasTitleB) return -1;
    if (!hasTitleA && hasTitleB) return 1;

    // Alphabetical order by student name or email
    const nameA = (a.nomeAluno || a.usuarioEmail || '').trim().toLowerCase();
    const nameB = (b.nomeAluno || b.usuarioEmail || '').trim().toLowerCase();
    return nameA.localeCompare(nameB, 'pt-BR');
  });
}

export function cleanForStorage(fichas: FichaTCC[]): FichaTCC[] {
  return fichas.map((f) => {
    const clone = { ...f };
    if (clone.logoUrl && clone.logoUrl.length > 500) {
      clone.logoUrl = '';
    }
    if (clone.assinaturaUrl && clone.assinaturaUrl.length > 500) {
      clone.assinaturaUrl = '';
    }
    return clone;
  });
}

// Canonical initial data with ALL real student records from Firestore
const INITIAL_FICHAS: FichaTCC[] = CANONICAL_FICHAS;

export const storageService = {
  // User Authentication persistence
  getLoggedUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setLoggedUser(user: User): void {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user session', e);
    }
  },

  logoutUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (e) {
      console.error('Error logging out', e);
    }
  },

  // Institutional Logo Management (Global for all sheets and users)
  getInstitutionalLogo(): string {
    try {
      return localStorage.getItem(STORAGE_KEY_INSTITUTIONAL_LOGO) || FAATESP_LOGO_SVG;
    } catch {
      return FAATESP_LOGO_SVG;
    }
  },

  setInstitutionalLogo(logoUrl: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_INSTITUTIONAL_LOGO, logoUrl);
      // Also propagate to all current stored fichas
      const fichas = this.getFichas();
      const updated = fichas.map((f) => ({
        ...f,
        logoUrl: logoUrl
      }));
      localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving institutional logo', e);
    }
  },

  removeInstitutionalLogo(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_INSTITUTIONAL_LOGO);
      const fichas = this.getFichas();
      const updated = fichas.map((f) => ({
        ...f,
        logoUrl: ''
      }));
      localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing institutional logo', e);
    }
  },

  // Access Logs Management
  getAllAccessLogs(): AccessLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCESS_LOGS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  recordUserAccess(user: User): { logs: AccessLog[]; userTotalCount: number } {
    try {
      const allLogs = this.getAllAccessLogs();
      const userEmailNorm = (user.email || '').trim().toLowerCase();
      const userIdNorm = user.id;

      // Count prior entries of this user
      const priorUserLogs = allLogs.filter(
        (l) =>
          (l.userEmail && l.userEmail.trim().toLowerCase() === userEmailNorm) ||
          l.userId === userIdNorm
      );
      const newSessionCount = priorUserLogs.length + 1;

      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' às ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newLog: AccessLog = {
        id: `access-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        role: user.role,
        timestamp: now.toISOString(),
        formattedDate,
        sessionCount: newSessionCount
      };

      const updatedLogs = [newLog, ...allLogs].slice(0, 100); // keep last 100 logs
      localStorage.setItem(STORAGE_KEY_ACCESS_LOGS, JSON.stringify(updatedLogs));

      return { logs: updatedLogs, userTotalCount: newSessionCount };
    } catch (e) {
      console.error('Error recording access log', e);
      return { logs: [], userTotalCount: 1 };
    }
  },

  getUserAccessLogs(userEmailOrId?: string): AccessLog[] {
    const all = this.getAllAccessLogs();
    if (!userEmailOrId) return all;
    const clean = userEmailOrId.trim().toLowerCase();
    return all.filter(
      (l) =>
        (l.userEmail && l.userEmail.trim().toLowerCase() === clean) ||
        l.userId === userEmailOrId
    );
  },

  getUserAccessCount(userEmailOrId?: string): number {
    return this.getUserAccessLogs(userEmailOrId).length;
  },

  // Fichas Management
  getFichas(): FichaTCC[] {
    try {
      const storedVersion = localStorage.getItem(STORAGE_KEY_SCHEMA_VERSION);
      if (storedVersion !== CURRENT_SCHEMA_VERSION) {
        // Automatically flush obsolete browser cache from earlier sessions
        localStorage.removeItem(STORAGE_KEY_FICHAS);
        localStorage.removeItem(STORAGE_KEY_ACTIVE_FICHA);
        localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
      }

      const data = localStorage.getItem(STORAGE_KEY_FICHAS);
      const institutionalLogo = this.getInstitutionalLogo();

      let currentFichas: FichaTCC[] = [];

      if (data === null) {
        currentFichas = JSON.parse(JSON.stringify(INITIAL_FICHAS));
        localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(currentFichas));
      } else {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentFichas = parsed;
        } else {
          currentFichas = JSON.parse(JSON.stringify(INITIAL_FICHAS));
        }
      }

      // Guarantee each canonical pre-registered student is updated with correct course & title
      let hasChanged = false;
      for (const canonical of INITIAL_FICHAS) {
        const index = currentFichas.findIndex(
          (f) =>
            f.id === canonical.id ||
            (f.usuarioEmail && canonical.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === canonical.usuarioEmail.trim().toLowerCase())
        );
        if (index >= 0) {
          // If cached version has wrong course or title, replace it completely!
          if (
            currentFichas[index].curso !== canonical.curso ||
            currentFichas[index].tituloTrabalho !== canonical.tituloTrabalho
          ) {
            currentFichas[index] = { ...canonical, logoUrl: institutionalLogo || canonical.logoUrl || '' };
            hasChanged = true;
          }
        } else {
          currentFichas.unshift({ ...canonical, logoUrl: institutionalLogo || canonical.logoUrl || '' });
          hasChanged = true;
        }
      }

      // Always sort deterministically to prevent fichas from shuffling or being out of order
      currentFichas = sortFichasDeterministically(currentFichas);

      try {
        localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(cleanForStorage(currentFichas)));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }
      return currentFichas;
    } catch {
      return [...INITIAL_FICHAS];
    }
  },

  getFichaById(id: string): FichaTCC | null {
    const fichas = this.getFichas();
    return fichas.find((f) => f.id === id) || null;
  },

  /**
   * Resilient student retrieval: guarantees that student's saved data
   * clones the exact ficha present in Orientador mode.
   */
  getStudentFicha(user: User): FichaTCC {
    const allFichas = this.getFichas();
    const userEmailNorm = (user.email || '').trim().toLowerCase();
    const userId = user.id;

    // 0. Direct match for Marineuza Lina de Souza
    if (isMarineuza(user)) {
      const marineuzaFicha = allFichas.find((f) => isMarineuza(f));
      if (marineuzaFicha) {
        this.setActiveFichaId(marineuzaFicha.id);
        return marineuzaFicha;
      }
    }

    const normalizePersonName = (name?: string): string => {
      if (!name) return '';
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    };

    // 1. Direct match by student email
    let found = allFichas.find(
      (f) => f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === userEmailNorm
    );

    // 1.1 Direct fallback for Marineuza
    if (!found && isMarineuza(user)) {
      found = allFichas.find((f) => isMarineuza(f));
    }

    // 2. Direct match by student user ID
    if (!found) {
      found = allFichas.find((f) => f.usuarioId === userId);
    }

    // 4. Match by student name with accent and space normalization
    if (!found && user.name) {
      const normTarget = normalizePersonName(user.name);
      if (normTarget.length >= 4) {
        found = allFichas.find((f) => {
          if (f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() !== userEmailNorm) {
            return false;
          }
          const normFicha = normalizePersonName(f.nomeAluno);
          if (normFicha.length < 4) return false;
          return normFicha === normTarget || normFicha.includes(normTarget) || normTarget.includes(normFicha);
        });
      }
    }

    // 4. Match by email username prefix against student name (NEVER match a ficha belonging to another email)
    if (!found && user.email) {
      const emailPrefix = normalizePersonName(user.email.split('@')[0]);
      if (emailPrefix.length >= 4) {
        found = allFichas.find((f) => {
          if (f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() !== userEmailNorm) {
            return false;
          }
          const normFicha = normalizePersonName(f.nomeAluno);
          if (normFicha.length < 4) return false;
          return normFicha === emailPrefix || normFicha.includes(emailPrefix) || emailPrefix.includes(normFicha);
        });
      }
    }

    // 5. If none exists, create and bind a brand new persistent ficha for this student
    if (!found) {
      found = this.createNewFicha(user);
      found.usuarioEmail = user.email;
      found.usuarioId = user.id;
      // Do NOT pre-fill student name from email username. Leave empty for mandatory student input.
      if (user.role === 'orientador' && user.name) {
        found.nomeAluno = user.name;
      }
      this.saveFicha(found);
    } else {
      // Ensure user credentials and institutional logo are linked
      let needsUpdate = false;
      if (found.usuarioEmail !== user.email) {
        found.usuarioEmail = user.email;
        needsUpdate = true;
      }
      if (found.usuarioId !== user.id) {
        found.usuarioId = user.id;
        needsUpdate = true;
      }
      if (found.id === 'ficha-faatesp-001' && !found.tituloTrabalho) {
        found.curso = '';
        needsUpdate = true;
      }
      if (needsUpdate) {
        this.saveFicha(found);
      }
    }

    this.setActiveFichaId(found.id);
    return found;
  },

  saveFicha(ficha: FichaTCC): void {
    try {
      const fichas = this.getFichas();
      const index = fichas.findIndex((f) => f.id === ficha.id);
      const institutionalLogo = this.getInstitutionalLogo();

      const updatedFicha: FichaTCC = {
        ...ficha,
        logoUrl: institutionalLogo || ficha.logoUrl || '',
        ultimaAtualizacao: new Date().toISOString()
      };

      if (index >= 0) {
        fichas[index] = updatedFicha;
      } else {
        fichas.push(updatedFicha);
      }

      const sortedFichas = sortFichasDeterministically(fichas);
      localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(sortedFichas));
      this.setActiveFichaId(ficha.id);
    } catch (e) {
      console.error('Error saving ficha', e);
    }
  },

  deleteFicha(id: string): void {
    try {
      const fichas = this.getFichas().filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(fichas));
      if (this.getActiveFichaId() === id) {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_FICHA);
      }
    } catch (e) {
      console.error('Error deleting ficha', e);
    }
  },

  getActiveFichaId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_FICHA);
    } catch {
      return null;
    }
  },

  setActiveFichaId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_FICHA, id);
    } catch (e) {
      console.error('Error setting active ficha id', e);
    }
  },

  createNewFicha(user?: User): FichaTCC {
    const institutionalLogo = this.getInstitutionalLogo();
    const newFicha: FichaTCC = {
      id: `ficha-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tituloTrabalho: '',
      nomeAluno: '',
      curso: '',
      semestre: '7º Semestre 2026/2',
      professorOrientador: user?.role === 'orientador' ? user.name : '',
      situacaoProblema: '',
      hipotese: '',
      bibliografia: '',
      orientacoes: [
        {
          id: `ori-${Date.now()}-1`,
          data: '',
          horario: '',
          observacao: '',
          confirmado: false
        },
        {
          id: `ori-${Date.now()}-2`,
          data: '',
          horario: '',
          observacao: '',
          confirmado: false
        }
      ],
      nota: '',
      status: 'rascunho',
      dataCriacao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      usuarioId: user?.id || `aluno-${Date.now()}`,
      usuarioEmail: user?.email || '',
      logoUrl: institutionalLogo || ''
    };

    this.saveFicha(newFicha);
    return newFicha;
  }
};
