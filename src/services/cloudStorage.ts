import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { FichaTCC, User, AccessLog } from '../types';
import { storageService } from './storage';

const FICHAS_COLLECTION = 'fichas';
const CONFIG_COLLECTION = 'systemConfig';
const ACCESS_LOGS_COLLECTION = 'accessLogs';

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
   * Sync from Firestore or subscribe in real time
   */
  subscribeToFichas(callback: (fichas: FichaTCC[]) => void): Unsubscribe {
    const colRef = collection(db, FICHAS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const remoteFichas: FichaTCC[] = [];
        snapshot.forEach((docSnap) => {
          remoteFichas.push({ ...(docSnap.data() as FichaTCC), id: docSnap.id });
        });

        remoteFichas.sort((a, b) => {
          const tA = new Date(a.ultimaAtualizacao || a.dataCriacao || 0).getTime();
          const tB = new Date(b.ultimaAtualizacao || b.dataCriacao || 0).getTime();
          return tB - tA;
        });

        // Also update local cache for offline/fast load and clean any email-derived student names
        const sanitizedRemote = remoteFichas.map(f => {
          let nomeVal = f.nomeAluno || '';
          if (nomeVal && f.usuarioEmail) {
            const rawPrefix = f.usuarioEmail.split('@')[0];
            const cleanPrefix = rawPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cleanNome = nomeVal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cleanNome === cleanPrefix || (!nomeVal.includes(' ') && cleanPrefix.includes(cleanNome))) {
              nomeVal = '';
            }
          }
          return { ...f, nomeAluno: nomeVal };
        });

        if (sanitizedRemote.length > 0) {
          localStorage.setItem('pm_faatesp_fichas', JSON.stringify(sanitizedRemote));
        }
        callback(sanitizedRemote);
      },
      (error) => {
        console.warn('Firestore subscription fallback to local storage:', error);
        callback(storageService.getFichas());
      }
    );
  },

  /**
   * Fetch all fichas from Firestore
   */
  async getFichas(): Promise<FichaTCC[]> {
    try {
      const colRef = collection(db, FICHAS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const remoteFichas: FichaTCC[] = [];
      snapshot.forEach((docSnap) => {
        remoteFichas.push({ ...(docSnap.data() as FichaTCC), id: docSnap.id });
      });

      if (remoteFichas.length > 0) {
        remoteFichas.sort((a, b) => {
          const tA = new Date(a.ultimaAtualizacao || a.dataCriacao || 0).getTime();
          const tB = new Date(b.ultimaAtualizacao || b.dataCriacao || 0).getTime();
          return tB - tA;
        });

        const sanitizedRemote = remoteFichas.map(f => {
          let nomeVal = f.nomeAluno || '';
          if (nomeVal && f.usuarioEmail) {
            const rawPrefix = f.usuarioEmail.split('@')[0];
            const cleanPrefix = rawPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cleanNome = nomeVal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cleanNome === cleanPrefix || (!nomeVal.includes(' ') && cleanPrefix.includes(cleanNome))) {
              nomeVal = '';
            }
          }
          return { ...f, nomeAluno: nomeVal };
        });

        localStorage.setItem('pm_faatesp_fichas', JSON.stringify(sanitizedRemote));
        return sanitizedRemote;
      }
      return storageService.getFichas();
    } catch (e) {
      console.warn('Error fetching from cloud, using local cache:', e);
      return storageService.getFichas();
    }
  },

  /**
   * Save or update ficha in Firestore and local
   */
  async saveFicha(ficha: FichaTCC): Promise<void> {
    storageService.saveFicha(ficha); // update local instantly
    try {
      const fichaId = ficha.id || `ficha-${Date.now()}`;
      const fichaDocRef = doc(db, FICHAS_COLLECTION, fichaId);
      const dataToSave = sanitizeForFirestore({
        ...ficha,
        id: fichaId,
        ultimaAtualizacao: new Date().toISOString()
      });
      await setDoc(fichaDocRef, dataToSave, { merge: true });
    } catch (e) {
      console.error('Error saving ficha to Firestore:', e);
    }
  },

  /**
   * Delete ficha in Firestore and local
   */
  async deleteFicha(id: string): Promise<void> {
    storageService.deleteFicha(id); // update local instantly
    try {
      const fichaDocRef = doc(db, FICHAS_COLLECTION, id);
      await deleteDoc(fichaDocRef);
    } catch (e) {
      console.error('Error deleting ficha from Firestore:', e);
    }
  },

  /**
   * Retrieve student ficha (from cloud or fallback)
   */
  async getStudentFicha(user: User): Promise<FichaTCC> {
    try {
      const all = await this.getFichas();
      const userEmailNorm = (user.email || '').trim().toLowerCase();
      const userId = user.id;

      // 1. Direct match by student email
      let found = all.find(
        (f) => f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === userEmailNorm
      );

      // 2. Direct match by student user ID
      if (!found) {
        found = all.find((f) => f.usuarioId === userId);
      }

      // 3. Match by student name with accent and space normalization (NEVER match a ficha belonging to another email)
      if (!found && user.name) {
        const normTarget = normalizePersonName(user.name);
        if (normTarget.length >= 4) {
          found = all.find((f) => {
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
          found = all.find((f) => {
            if (f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() !== userEmailNorm) {
              return false;
            }
            const normFicha = normalizePersonName(f.nomeAluno);
            if (normFicha.length < 4) return false;
            return normFicha === emailPrefix || normFicha.includes(emailPrefix) || emailPrefix.includes(normFicha);
          });
        }
      }

      // 5. If still not found, create a brand-new persistent personal ficha for this student
      if (!found) {
        found = storageService.createNewFicha(user);
        found.usuarioEmail = user.email;
        found.usuarioId = user.id;
        // Do NOT auto-fill student name from email username. Leave empty for mandatory student input.
        if (user.role === 'orientador' && user.name) {
          found.nomeAluno = user.name;
        }
        await this.saveFicha(found);
      } else {
        // Guarantee user's email, ID are securely bound to their ficha
        let needsUpdate = false;
        if (found.usuarioEmail !== user.email) {
          found.usuarioEmail = user.email;
          needsUpdate = true;
        }
        if (found.usuarioId !== user.id) {
          found.usuarioId = user.id;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await this.saveFicha(found);
        }
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
