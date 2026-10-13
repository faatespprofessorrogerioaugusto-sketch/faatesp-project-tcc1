/**
 * Utilitário de validação e formatação de Nome Completo do Aluno
 * Requisito: Nome e Sobrenome no formato Maiúscula e minúscula (ex: "Maria da Silva", "João Carlos Santos")
 */

// Palavras de ligação/preposições que podem permanecer em minúsculas
const LOWERCASE_CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'van', 'von', 'del']);

/**
 * Converte qualquer texto de nome para o padrão correto com iniciais Maiúsculas e minúsculas
 */
export function formatToTitleCase(input: string): string {
  if (!input) return '';
  const clean = input.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');

  return parts
    .map((word, index) => {
      if (!word) return '';
      const lower = word.toLowerCase();
      // Preposições no meio do nome continuam minúsculas
      if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export interface NameValidationResult {
  isValid: boolean;
  message?: string;
  suggestedName?: string;
}

/**
 * Valida se o nome está no formato completo (nome e sobrenome)
 * e no padrão Maiúsculas e minúsculas exigido
 */
export function validateStudentFullName(name: string): NameValidationResult {
  const trimmed = (name || '').trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return {
      isValid: false,
      message: 'O campo Nome do Aluno(a) é obrigatório. Digite seu nome e sobrenome.'
    };
  }

  const parts = trimmed.split(' ').filter(Boolean);

  // 1. Deve conter pelo menos Nome e Sobrenome (duas palavras)
  if (parts.length < 2) {
    return {
      isValid: false,
      message: 'Informe o nome completo (Nome e Sobrenome). Apenas um nome não é permitido.',
      suggestedName: formatToTitleCase(trimmed)
    };
  }

  // Se o aluno digitou apenas letras com 1 caractere no sobrenome (ex: "Maria S")
  if (parts.some((p) => p.length < 2 && !LOWERCASE_CONNECTORS.has(p.toLowerCase()))) {
    return {
      isValid: false,
      message: 'Não utilize apenas abreviações de uma letra. Digite o sobrenome completo.',
      suggestedName: formatToTitleCase(trimmed)
    };
  }

  // 2. Não pode ser tudo em MAIÚSCULAS
  const lettersOnly = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (lettersOnly.length > 3 && trimmed === trimmed.toUpperCase()) {
    return {
      isValid: false,
      message: 'Nome todo em LETRAS MAIÚSCULAS não é aceito. Utilize o formato Maiúscula e minúscula (ex: Maria da Silva).',
      suggestedName: formatToTitleCase(trimmed)
    };
  }

  // 3. Não pode ser tudo em minúsculas
  if (lettersOnly.length > 3 && trimmed === trimmed.toLowerCase()) {
    return {
      isValid: false,
      message: 'Nome todo em letras minúsculas não é aceito. Utilize o formato Maiúscula e minúscula (ex: Maria da Silva).',
      suggestedName: formatToTitleCase(trimmed)
    };
  }

  // 4. Cada parte do nome deve começar com Maiúscula e o resto em minúsculas (exceto conectores permitidos)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isConnector = i > 0 && LOWERCASE_CONNECTORS.has(part.toLowerCase());

    if (isConnector) {
      continue;
    }

    const firstChar = part.charAt(0);
    // Deve ser letra maiúscula
    if (firstChar !== firstChar.toUpperCase() || firstChar === firstChar.toLowerCase()) {
      return {
        isValid: false,
        message: `O nome "${part}" deve começar com letra Maiúscula (ex: "${formatToTitleCase(trimmed)}").`,
        suggestedName: formatToTitleCase(trimmed)
      };
    }

    const restOfWord = part.slice(1);
    // As demais letras devem ser minúsculas
    if (restOfWord && restOfWord !== restOfWord.toLowerCase()) {
      return {
        isValid: false,
        message: `As demais letras de "${part}" devem ser minúsculas (ex: "${formatToTitleCase(trimmed)}"). Evite letras maiúsculas no meio da palavra.`,
        suggestedName: formatToTitleCase(trimmed)
      };
    }
  }

  return {
    isValid: true
  };
}
