import { FichaTCC } from '../types';

/**
 * Extracts "Nome e o 1º sobrenome do aluno", removing accents, special chars,
 * and joining them together in UPPERCASE without any separation symbols (e.g. "ROGERIOAUGUSTO", "JOAOSILVA").
 */
export function getFriendlyStudentName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'ALUNO';

  // Normalize and remove accents (e.g. é -> e, ã -> a, ç -> c)
  const clean = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Split into words, cleaning punctuation/special characters
  const words = clean
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'ALUNO';
  if (words.length === 1) {
    return words[0].toUpperCase();
  }

  const prepositions = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'di']);
  const firstName = words[0];

  // Find 1st surname (first word after first name that is not a preposition/connector)
  let firstSurname = '';
  for (let i = 1; i < words.length; i++) {
    if (!prepositions.has(words[i].toLowerCase())) {
      firstSurname = words[i];
      break;
    }
  }

  if (!firstSurname) {
    firstSurname = words[1];
  }

  return `${firstName}${firstSurname}`.toUpperCase();
}

/**
 * Returns formatted filename in UPPERCASE like "FICHA DE TCC - ROGERIOAUGUSTO.pdf" or "FICHA DE TCC - ROGERIOAUGUSTO.docx"
 */
export function getFichaExportFilename(ficha: FichaTCC, ext: 'pdf' | 'docx'): string {
  const studentPart = getFriendlyStudentName(ficha.nomeAluno);
  return `FICHA DE TCC - ${studentPart}.${ext.toLowerCase()}`;
}
