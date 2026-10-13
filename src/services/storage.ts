import { AccessLog, FichaTCC, User } from '../types';
import { FAATESP_LOGO_SVG } from '../utils/signatures';

const STORAGE_KEY_USER = 'pm_faatesp_user';
const STORAGE_KEY_FICHAS = 'pm_faatesp_fichas';
const STORAGE_KEY_ACTIVE_FICHA = 'pm_faatesp_active_ficha_id';
const STORAGE_KEY_ACCESS_LOGS = 'pm_faatesp_access_logs';
const STORAGE_KEY_INSTITUTIONAL_LOGO = 'pm_faatesp_institutional_logo';

// Sample initial data matching FAATESP TCC activity sheet requirements
const INITIAL_FICHAS: FichaTCC[] = [
  {
    id: 'ficha-1791910169529-c9r1',
    tituloTrabalho: 'A Gestão por Processos na Otimização da Eficiência Operacional e Produtividade Organizacional',
    nomeAluno: 'Marineuza Lina de Souza',
    curso: 'Tecnologia em Processos Gerenciais',
    semestre: '7º Semestre 2026/2',
    professorOrientador: 'Prof. Rogério Augusto',
    situacaoProblema: 'Gargalos operacionais recorrentes e falta de padronização nos fluxos de processos administrativos que impactam a produtividade da equipe e geram retrabalho.',
    hipotese: 'A modelagem, padronização e implementação do mapeamento de processos (BPM) reduzem o tempo de execução das atividades em até 40% e elevam os índices de conformidade operacional.',
    bibliografia: 'CHIAVENATO, Idalberto. Introdução à Teoria Geral da Administração. 9. ed. Barueri: Atlas, 2014.\nMEIRELLES, Manuel. Gestão por Processos: Teoria e Aplicações. São Paulo: Atlas, 2018.\nPAIM, Rafael et al. Gestão de Processos: Pensar, Agir e Transformar. Porto Alegre: Bookman, 2020.',
    orientacoes: [
      {
        id: 'ori-neuza-001',
        data: '2026-03-24',
        horario: '14:30',
        observacao: 'Definição do tema da pesquisa, delimitação da situação-problema e metodologia de coleta de dados operacionais.',
        confirmado: true,
        nomeOrientador: 'Prof. Rogério Augusto',
        dataConfirmacao: '2026-03-24 15:00',
        assinaturaDigital: 'faatesp_val_neuza_01'
      },
      {
        id: 'ori-neuza-002',
        data: '2026-04-28',
        horario: '15:00',
        observacao: 'Análise dos fluxogramas de processos, revisão da hipótese e estruturação do referencial bibliográfico segundo as normas FAATESP.',
        confirmado: true,
        nomeOrientador: 'Prof. Rogério Augusto',
        dataConfirmacao: '2026-04-28 15:30',
        assinaturaDigital: 'faatesp_val_neuza_02'
      }
    ],
    nota: '9.5',
    status: 'em_andamento',
    dataCriacao: '2026-03-10T14:00:00.000Z',
    ultimaAtualizacao: '2026-10-13T17:15:00.000Z',
    usuarioId: 'user_neuzasofia555_gmail_com',
    usuarioEmail: 'neuzasofia555@gmail.com',
    parecerOrientador: 'Trabalho muito bem estruturado com excelente relevância prática. Continue aprofundando a fundamentação teórica nas próximas etapas.',
    parecerAtendido: true
  },
  {
    id: 'ficha-faatesp-002',
    tituloTrabalho: 'Gestão Estratégica da Cadeia de Suprimentos na Indústria Farmacêutica',
    nomeAluno: 'Mariana Costa Ribeiro',
    curso: 'Bacharel em Administração',
    semestre: '7º Semestre 2026/2',
    professorOrientador: 'Prof. Rogério Augusto',
    situacaoProblema: 'Inoperância no controle de estoque de insumos refrigerados durante o transporte de longa distância.',
    hipotese: 'O uso de sensores IoT integrados a redes blockchain reduz perdas por variação de temperatura em até 85%.',
    bibliografia: 'CHOPRA, S. Gestão da Cadeia de Suprimentos. Rio de Janeiro: Pearson, 2021.\nBALLOU, Ronald H. Logística Empresarial. São Paulo: Atlas, 2019.',
    orientacoes: [
      {
        id: 'ori-201',
        data: '2026-03-18',
        horario: '16:00',
        observacao: 'Apresentação do tema e justificativa mercadológica do projeto de pesquisa.',
        confirmado: true,
        nomeOrientador: 'Prof. Rogério Augusto',
        dataConfirmacao: '2026-03-18 16:30',
        assinaturaDigital: 'faatesp_val_f71120'
      },
      {
        id: 'ori-202',
        data: '2026-05-02',
        horario: '14:00',
        observacao: 'Análise de dados quantitativos e elaboração dos gráficos de resultados esperados.',
        confirmado: false
      }
    ],
    nota: '',
    status: 'rascunho',
    dataCriacao: new Date(Date.now() - 86400000 * 15).toISOString(),
    ultimaAtualizacao: new Date(Date.now() - 86400000 * 1).toISOString(),
    usuarioId: 'user_mariana_costa_gmail_com',
    usuarioEmail: 'mariana.costa@gmail.com'
  },
  {
    id: 'ficha-faatesp-003',
    tituloTrabalho: 'Metodologias Ativas no Ensino Fundamental: Desafios Pedagógicos',
    nomeAluno: 'Gabriel Oliveira Santos',
    curso: 'Licenciatura em Pedagogia',
    semestre: '7º Semestre 2026/2',
    professorOrientador: 'Profa. Marinês Borba',
    situacaoProblema: 'Dificuldades dos educadores na implementação prática de dinâmicas ativas em salas de aula inclusivas.',
    hipotese: 'O planejamento baseado em projetos interdisciplinares aumenta em 70% o engajamento e a retenção do aprendizado.',
    bibliografia: 'FREIRE, Paulo. Pedagogia da Autonomia: Saberes Necessários à Prática Educativa. São Paulo: Paz e Terra, 2019.\nMORAN, José. Metodologias Ativas. Porto Alegre: Penso, 2018.',
    orientacoes: [
      {
        id: 'ori-301',
        data: '2026-02-20',
        horario: '10:00',
        observacao: 'Delimitação do problema de pesquisa e alinhamento do cronograma acadêmico.',
        confirmado: true,
        nomeOrientador: 'Profa. Marinês Borba',
        dataConfirmacao: '2026-02-20 10:40',
        assinaturaDigital: 'faatesp_val_098abc'
      },
      {
        id: 'ori-302',
        data: '2026-04-10',
        horario: '11:00',
        observacao: 'Revisão das normas técnicas e formatação conforme diretrizes FAATESP.',
        confirmado: true,
        nomeOrientador: 'Profa. Marinês Borba',
        dataConfirmacao: '2026-04-10 11:30',
        assinaturaDigital: 'faatesp_val_5543ef'
      }
    ],
    nota: '10.0',
    status: 'aprovado',
    dataCriacao: new Date(Date.now() - 86400000 * 45).toISOString(),
    ultimaAtualizacao: new Date(Date.now() - 86400000 * 5).toISOString(),
    usuarioId: 'user_gabriel_oliveira_gmail_com',
    usuarioEmail: 'gabriel.oliveira@gmail.com',
    parecerOrientador: 'Trabalho exemplar, aprovado sem ressalvas pela comissão de orientação.'
  },
  {
    id: 'ficha-faatesp-004',
    tituloTrabalho: 'Práticas Pedagógicas Inclusivas e Desenvolvimento Cognitivo na Educação Infantil',
    nomeAluno: 'Antonia Capristano da Silva Santos',
    curso: 'Licenciatura em Pedagogia',
    semestre: '7º Semestre 2026/2',
    professorOrientador: 'Profa. Marinês Borba',
    situacaoProblema: 'Desafios na adaptação curricular e estratégias pedagógicas para alunos com necessidades específicas.',
    hipotese: 'A utilização de recursos multissensoriais articulados ao plano de ensino individualizado amplia o desenvolvimento cognitivo em mais de 60%.',
    bibliografia: 'MANTOAN, Maria Teresa Eglér. Inclusão Escolar. São Paulo: Moderna, 2017.\nVYGOTSKY, L. S. A Formação Social da Mente. São Paulo: Martins Fontes, 2019.',
    orientacoes: [
      {
        id: 'ori-antonia-01',
        data: '2026-03-12',
        horario: '15:00',
        observacao: 'Alinhamento dos objetivos gerais e específicos da pesquisa sobre inclusão educacional.',
        confirmado: true,
        nomeOrientador: 'Profa. Marinês Borba',
        dataConfirmacao: '2026-03-12 15:30',
        assinaturaDigital: 'faatesp_val_antonia_01'
      },
      {
        id: 'ori-antonia-02',
        data: '2026-04-20',
        horario: '14:30',
        observacao: 'Revisão dos instrumentos de observação e fundamentação teórica de autores contemporâneos.',
        confirmado: true,
        nomeOrientador: 'Profa. Marinês Borba',
        dataConfirmacao: '2026-04-20 15:00',
        assinaturaDigital: 'faatesp_val_antonia_02'
      }
    ],
    nota: '9.5',
    status: 'em_andamento',
    dataCriacao: new Date(Date.now() - 86400000 * 30).toISOString(),
    ultimaAtualizacao: new Date(Date.now() - 86400000 * 2).toISOString(),
    usuarioId: 'user_antoniacapristanodasilvasantos_gmail_com',
    usuarioEmail: 'antoniacapristanodasilvasantos@gmail.com'
  }
];

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
      const data = localStorage.getItem(STORAGE_KEY_FICHAS);
      const institutionalLogo = this.getInstitutionalLogo();

      let currentFichas: FichaTCC[] = [];

      if (data === null) {
        currentFichas = [...INITIAL_FICHAS];
        localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(currentFichas));
      } else {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          currentFichas = parsed;
        } else {
          currentFichas = [...INITIAL_FICHAS];
        }
      }

      // Guarantee essential pre-registered students (e.g. Marineuza Lina de Souza) exist in the list
      let hasMerged = false;
      for (const initFicha of INITIAL_FICHAS) {
        const exists = currentFichas.some(
          (f) =>
            f.id === initFicha.id ||
            (f.usuarioEmail && initFicha.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === initFicha.usuarioEmail.trim().toLowerCase())
        );
        if (!exists) {
          currentFichas.push(initFicha);
          hasMerged = true;
        }
      }

      let changed = hasMerged;
      const cleaned = currentFichas.map((f: FichaTCC) => {
        let cursoVal = f.curso || '';
        let nomeVal = f.nomeAluno || '';

        // If the student name was literally identical to the raw email prefix (e.g. "neuzasofia555"), clear it
        // BUT NEVER clear valid academic full names that contain spaces (e.g. "Marineuza Lina de Souza")
        if (nomeVal && f.usuarioEmail && !nomeVal.includes(' ')) {
          const rawPrefix = f.usuarioEmail.split('@')[0];
          const cleanPrefix = rawPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cleanNome = nomeVal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cleanNome === cleanPrefix) {
            nomeVal = '';
            changed = true;
          }
        }

        // If sheet is a blank draft without title & student, guarantee curso is empty
        if (!f.tituloTrabalho && !nomeVal) {
          cursoVal = '';
        }

        if (f.curso !== cursoVal || f.nomeAluno !== nomeVal) {
          changed = true;
        }
        return {
          ...f,
          nomeAluno: nomeVal,
          curso: cursoVal,
          semestre: f.semestre || '7º Semestre 2026/2',
          logoUrl: institutionalLogo || f.logoUrl || ''
        };
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(cleaned));
      }
      return cleaned;
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
   * is always loaded when returning, based on user email, ID, or active reference.
   */
  getStudentFicha(user: User): FichaTCC {
    const allFichas = this.getFichas();
    const userEmailNorm = (user.email || '').trim().toLowerCase();
    const userId = user.id;

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

    // 2. Specific alias match for pre-registered students
    if (!found && userEmailNorm === 'neuzasofia555@gmail.com') {
      found = allFichas.find(
        (f) =>
          f.id === 'ficha-1791910169529-c9r1' ||
          (f.nomeAluno && normalizePersonName(f.nomeAluno).includes('marineuza')) ||
          (f.usuarioEmail && f.usuarioEmail.trim().toLowerCase() === 'neuzasofia555@gmail.com')
      );
    }

    if (!found && userEmailNorm.includes('antoniacapristano')) {
      found = allFichas.find(
        (f) =>
          f.id === 'ficha-faatesp-004' ||
          (f.nomeAluno && normalizePersonName(f.nomeAluno).includes('antonia'))
      );
    }

    // 3. Direct match by student user ID
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
        fichas.unshift(updatedFicha);
      }

      localStorage.setItem(STORAGE_KEY_FICHAS, JSON.stringify(fichas));
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
