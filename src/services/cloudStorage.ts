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

        // Also update local cache for offline/fast load
        if (remoteFichas.length > 0) {
          localStorage.setItem('pm_faatesp_fichas', JSON.stringify(remoteFichas));
        }
        callback(remoteFichas);
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
        localStorage.setItem('pm_faatesp_fichas', JSON.stringify(remoteFichas));
        return remoteFichas;
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

      // 1. Direct match by student email or student user ID
      let found = all.find(
        (f) =>
          (f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === userEmailNorm) ||
          f.usuarioId === userId
      );

      // 2. Direct match by student name
      if (!found && user.name) {
        const userNameNorm = user.name.trim().toLowerCase();
        found = all.find(
          (f) => f.nomeAluno && f.nomeAluno.trim().toLowerCase() === userNameNorm
        );
      }

      // 3. Fallback: Check active ficha in local session
      if (!found) {
        const activeId = storageService.getActiveFichaId();
        if (activeId) {
          const candidate = all.find((f) => f.id === activeId);
          if (candidate && (candidate.tituloTrabalho || candidate.nomeAluno)) {
            found = candidate;
          }
        }
      }

      // 4. Fallback: If only one non-empty ficha exists in the system, bind it to this student
      if (!found && all.length > 0) {
        const withContent = all.filter(f => f.tituloTrabalho || f.nomeAluno);
        if (withContent.length === 1) {
          found = withContent[0];
        } else if (all.length === 1) {
          found = all[0];
        }
      }

      if (!found) {
        found = storageService.createNewFicha(user);
        await this.saveFicha(found);
      } else {
        let needsUpdate = false;
        if (found.usuarioEmail !== user.email) {
          found.usuarioEmail = user.email;
          needsUpdate = true;
        }
        if (found.usuarioId !== user.id) {
          found.usuarioId = user.id;
          needsUpdate = true;
        }
        if (!found.nomeAluno && user.name) {
          found.nomeAluno = user.name;
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
