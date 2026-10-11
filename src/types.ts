export type UserRole = 'aluno' | 'orientador';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  cursoDefault?: string;
}

export interface Orientation {
  id: string;
  data: string;
  horario: string;
  observacao: string;
  confirmado: boolean;
  nomeOrientador?: string;
  dataConfirmacao?: string;
  assinaturaDigital?: string;
}

export interface FichaTCC {
  id: string;
  tituloTrabalho: string;
  nomeAluno: string;
  curso: string;
  semestre: string;
  professorOrientador: string;
  situacaoProblema: string;
  hipotese: string;
  bibliografia: string;
  orientacoes: Orientation[];
  nota: string;
  status: 'rascunho' | 'em_andamento' | 'concluido' | 'aprovado';
  dataCriacao: string;
  ultimaAtualizacao: string;
  usuarioId: string;
  usuarioEmail?: string;
  logoUrl?: string;
  assinaturaUrl?: string;
  parecerOrientador?: string;
}

export type ActiveScreen = 'main' | 'editar' | 'preview' | 'historico' | 'consulta';

export interface AccessLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  timestamp: string;
  formattedDate: string;
  sessionCount: number;
}
