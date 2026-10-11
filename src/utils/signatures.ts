import { OFFICIAL_FAATESP_LOGO, OFFICIAL_SIGNATURE_MARINES, OFFICIAL_SIGNATURE_ROGERIO } from './signaturesData';

export { OFFICIAL_FAATESP_LOGO, OFFICIAL_SIGNATURE_MARINES, OFFICIAL_SIGNATURE_ROGERIO };
export const FAATESP_LOGO_ORIGINAL = OFFICIAL_FAATESP_LOGO;
export const SIGNATURE_MARINES_BORBA = OFFICIAL_SIGNATURE_MARINES;
export const SIGNATURE_ROGERIO_AUGUSTO = OFFICIAL_SIGNATURE_ROGERIO;

// Fallback constant name for backwards compatibility
export const FAATESP_LOGO_SVG = OFFICIAL_FAATESP_LOGO;

export function getSignatureForProfessor(professorName?: string): string {
  if (!professorName || !professorName.trim()) {
    return SIGNATURE_MARINES_BORBA;
  }
  // Normalize accents so "marinês", "marines", "rogério", "rogerio" match perfectly
  const lower = professorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lower.includes('rogerio') || lower.includes('augusto') || lower.includes('roger')) {
    return SIGNATURE_ROGERIO_AUGUSTO;
  }
  if (lower.includes('marines') || lower.includes('borba') || lower.includes('mari')) {
    return SIGNATURE_MARINES_BORBA;
  }
  return SIGNATURE_MARINES_BORBA;
}
