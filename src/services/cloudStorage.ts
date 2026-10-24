import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { FichaTCC, User, AccessLog } from '../types';
import { storageService, sortFichasDeterministically, cleanForStorage, isMarineuza, isFichaEmpty } from './storage';

const FICHAS_COLLECTION = 'fichas';
const CONFIG_COLLECTION = 'systemConfig';
const ACCESS_LOGS_COLLECTION = 'accessLogs';

// In-memory cache and timestamp to strictly protect against repeated calls and respect Firestore read quota limits
let inMemoryFichasCache: FichaTCC[] = [];
let lastFetchTimestamp = 0;
const SINGLE_GET_COOLDOWN_MS = 25000; // 25 seconds cooldown between automatic Single Get queries

function sanitizeForFirestore(data: any): any {
  if (data === undefined) {
    return null;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    } else {
      clean[key] = null;
    }
  }
  return clean;
}

export function normalizePersonName(name?: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // remove spaces and special characters
}

export const cloudStorageService = {
  /**
   * Single Get query from Firestore.
   * STRICTLY runs a single read per invocation.
   * Prohibits real-time listeners (onSnapshot) or automatic polling loops to ensure zero quota exhaustion.
   */
  async loadFichasSingleGet(forceFresh = false): Promise<FichaTCC[]> {
    const now = Date.now();
    if (!forceFresh && inMemoryFichasCache.length > 0 && (now - lastFetchTimestamp < SINGLE_GET_COOLDOWN_MS)) {
      return inMemoryFichasCache;
    }

    let firestoreFichas: FichaTCC[] = [];

    // 1. Single Get from Firestore
    try {
      const colRef = collection(db, FICHAS_COLLECTION);
      const snapshot = await getDocs(colRef);
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Partial<FichaTCC>;
        const fichaId = docSnap.id;
        const orientacoes = Array.isArray(raw.orientacoes) ? raw.orientacoes : [];

        const ficha: FichaTCC = {
          id: fichaId,
          tituloTrabalho: raw.tituloTrabalho || '',
          nomeAluno: raw.nomeAluno || '',
          curso: raw.curso || 'Licenciatura em Pedagogia',
          semestre: raw.semestre || '7º Semestre 2026/2',
          professorOrientador: raw.professorOrientador || 'Prof. Rogério Augusto',
          situacaoProblema: raw.situacaoProblema || '',
          hipotese: raw.hipotese || '',
          bibliografia: raw.bibliografia || '',
          orientacoes,
          nota: raw.nota !== undefined && raw.nota !== null ? String(raw.nota) : '',
          status: raw.status || 'em_andamento',
          dataCriacao: raw.dataCriacao || new Date().toISOString(),
          ultimaAtualizacao: raw.ultimaAtualizacao || new Date().toISOString(),
          usuarioId: raw.usuarioId || '',
          usuarioEmail: raw.usuarioEmail || '',
          parecerOrientador: raw.parecerOrientador || '',
          parecerAtendido: raw.parecerAtendido || false,
          assinaturaUrl: (raw.assinaturaUrl && raw.assinaturaUrl.length < 500) ? raw.assinaturaUrl : '',
          logoUrl: (raw.logoUrl && raw.logoUrl.length < 500) ? raw.logoUrl : ''
        };

        // Canonical mapping for Marineuza Lina de Souza
        if (isMarineuza(ficha)) {
          ficha.id = 'ficha-1790973147343-i0su';
          ficha.nomeAluno = 'Marineuza Lina de Souza';
          ficha.curso = 'Licenciatura em Pedagogia';
          ficha.tituloTrabalho = raw.tituloTrabalho || 'Apresentação da teoria de Emilia Ferreiro e sua relevância.';
          ficha.usuarioEmail = 'neuzasofia555@gmail.com';
        }

        // Only collect fichas with actual student content
        if (!isFichaEmpty(ficha)) {
          firestoreFichas.push(ficha);
        }
      });
    } catch (err) {
      console.warn('Firestore Single Get notice (retrieving from persistent storage):', err);
    }

    const deletedIds = storageService.getDeletedFichaIds();
    firestoreFichas = firestoreFichas.filter((f) => !deletedIds.includes(f.id) && !isFichaEmpty(f));

    if (firestoreFichas.length > 0) {
      const sorted = sortFichasDeterministically(firestoreFichas);
      inMemoryFichasCache = sorted;
      lastFetchTimestamp = now;

      // Update localStorage cleanly (without oversize base64 images)
      try {
        localStorage.setItem('pm_faatesp_fichas', JSON.stringify(cleanForStorage(sorted)));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      // Sync server-side JSON in background
      try {
        fetch('/api/fichas/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fichas: cleanForStorage(sorted) })
        }).catch(() => {});
      } catch {}

      return sorted;
    }

    // 2. Fallback to server API
    try {
      const res = await fetch('/api/fichas');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.fichas) && data.fichas.length > 0) {
          const sorted = sortFichasDeterministically(data.fichas);
          inMemoryFichasCache = sorted;
          lastFetchTimestamp = now;
          return sorted;
        }
      }
    } catch {}

    // 3. Fallback to local storage / pre-registered canonical students
    const local = storageService.getFichas();
    inMemoryFichasCache = local;
    return local;
  },

  /**
   * Fetch all fichas (via Single Get or cached memory)
   */
  async getFichas(forceFresh = false): Promise<FichaTCC[]> {
    return this.loadFichasSingleGet(forceFresh);
  },

  /**
   * Save or update ficha in server, Firestore and local
   */
  async saveFicha(ficha: FichaTCC): Promise<void> {
    // CRITICAL: Block saving 100% empty ghost fichas to Firestore and database
    if (isFichaEmpty(ficha)) {
      return;
    }

    const fichaId = ficha.id || `ficha-${Date.now()}`;
    const dataToSave: FichaTCC = {
      ...ficha,
      id: fichaId,
      ultimaAtualizacao: new Date().toISOString()
    };

    // Update in-memory cache immediately
    const idx = inMemoryFichasCache.findIndex((f) => f.id === fichaId);
    if (idx >= 0) {
      inMemoryFichasCache[idx] = dataToSave;
    } else {
      inMemoryFichasCache.unshift(dataToSave);
    }
    inMemoryFichasCache = sortFichasDeterministically(inMemoryFichasCache);

    // 1. Update local storage immediately
    storageService.saveFicha(dataToSave);

    // 2. Save to persistent server API
    try {
      await fetch('/api/fichas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanForStorage([dataToSave])[0])
      });
    } catch (e) {
      console.warn('Server save warning:', e);
    }

    // 3. Single Write to Firestore in background (with timeout protection so UI never blocks)
    try {
      const fichaDocRef = doc(db, FICHAS_COLLECTION, fichaId);
      const sanitized = sanitizeForFirestore(cleanForStorage([dataToSave])[0]);
      await Promise.race([
        setDoc(fichaDocRef, sanitized, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500))
      ]);
    } catch (e) {
      console.warn('Firestore write note:', e);
    }
  },

  /**
   * Delete ficha in server, Firestore and local
   */
  async deleteFicha(id: string): Promise<void> {
    inMemoryFichasCache = inMemoryFichasCache.filter((f) => f.id !== id);
    storageService.deleteFicha(id);

    try {
      await fetch(`/api/fichas/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Server delete error:', e);
    }

    try {
      const fichaDocRef = doc(db, FICHAS_COLLECTION, id);
      await deleteDoc(fichaDocRef);
    } catch (e) {
      console.warn('Firestore delete note:', e);
    }
  },

  /**
   * Retrieve student ficha (from cloud single get or fallback)
   */
  async getStudentFicha(user: User): Promise<FichaTCC> {
    try {
      // 0. Direct priority for Marineuza Lina de Souza (Pedagogia)
      if (isMarineuza(user)) {
        const canonical = storageService.getStudentFicha(user);
        storageService.setActiveFichaId(canonical.id);
        return canonical;
      }

      const all = await this.getFichas();
      const userEmailNorm = (user.email || '').trim().toLowerCase();
      const userId = user.id;

      // 1. Direct match by student email (strictly required)
      let found = all.find(
        (f) => f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === userEmailNorm
      );

      // 2. Direct match by student user ID
      if (!found) {
        found = all.find((f) => f.usuarioId === userId);
      }

      // 3. If orientador, return the active or default template
      if (!found && user.role === 'orientador') {
        found = all[0];
      }

      // 4. If still not found, create an in-memory draft for this student (DO NOT auto-save empty ficha)
      if (!found) {
        found = storageService.createNewFicha(user);
        found.usuarioEmail = user.email;
        found.usuarioId = user.id;
        if (user.role === 'orientador' && user.name) {
          found.nomeAluno = user.name;
        }
        // In-memory draft only: will ONLY be saved if student fills fields and clicks Salvar!
      }

      storageService.setActiveFichaId(found.id);
      return found;
    } catch {
      return storageService.getStudentFicha(user);
    }
  },

  /**
   * Institutional logo cloud sync
   */
  async saveInstitutionalLogo(logoUrl: string): Promise<void> {
    storageService.setInstitutionalLogo(logoUrl);
    try {
      const configDoc = doc(db, CONFIG_COLLECTION, 'main');
      await setDoc(configDoc, { institutionalLogo: logoUrl, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Error saving institutional logo to cloud:', e);
    }
  },

  async getInstitutionalLogo(): Promise<string> {
    try {
      const configDoc = doc(db, CONFIG_COLLECTION, 'main');
      const snap = await getDoc(configDoc);
      if (snap.exists() && snap.data()?.institutionalLogo) {
        const logo = snap.data()!.institutionalLogo;
        localStorage.setItem('pm_faatesp_institutional_logo', logo);
        return logo;
      }
    } catch (e) {
      console.warn('Error getting cloud logo:', e);
    }
    return storageService.getInstitutionalLogo();
  },

  /**
   * Log user access into Firestore & Local
   */
  async logUserAccess(user: User, action: 'login' | 'logout'): Promise<void> {
    storageService.recordUserAccess(user);
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logDoc = doc(db, ACCESS_LOGS_COLLECTION, logId);
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' às ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newLog: AccessLog = {
        id: logId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        timestamp: now.toISOString(),
        formattedDate,
        sessionCount: storageService.getUserAccessCount(user.email || user.id)
      };
      await setDoc(logDoc, { ...newLog, action });
    } catch (e) {
      console.warn('Access log cloud save failed:', e);
    }
  }
};
