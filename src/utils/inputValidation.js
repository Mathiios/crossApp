/**
 * inputValidation.js
 *
 * Módulo centralizado de validação e sanitização de inputs.
 * Todas as funções retornam { valid: boolean, error?: string }.
 * sanitizeText retorna a string limpa.
 */

// ── Constantes ──

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FIREBASE_UID_REGEX = /^[a-zA-Z0-9]{1,128}$/;
const DANGEROUS_PATTERNS = /<script[\s>]|<\/script>|javascript\s*:|on\w+\s*=/gi;
const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 5000;

const VALID_ROLES = ['aluno', 'professor', 'admin'];

// ── Validação de E-mail ──

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'E-mail é obrigatório.' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'E-mail é obrigatório.' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'E-mail muito longo.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Formato de e-mail inválido.' };
  }

  return { valid: true };
}

// ── Validação de Senha ──

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Senha é obrigatória.' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: 'Senha muito longa.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um número.' };
  }

  return { valid: true };
}

// ── Validação de Nome ──

export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < NAME_MIN_LENGTH) {
    return { valid: false, error: `Nome deve ter no mínimo ${NAME_MIN_LENGTH} caracteres.` };
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, error: `Nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.` };
  }

  // Rejeitar padrões perigosos
  DANGEROUS_PATTERNS.lastIndex = 0;
  if (DANGEROUS_PATTERNS.test(trimmed)) {
    return { valid: false, error: 'Nome contém caracteres não permitidos.' };
  }

  return { valid: true };
}

// ── Validação de UID Firebase ──

export function validateUID(uid) {
  if (!uid || typeof uid !== 'string') {
    return { valid: false, error: 'UID é obrigatório.' };
  }

  if (!FIREBASE_UID_REGEX.test(uid)) {
    return { valid: false, error: 'UID inválido.' };
  }

  return { valid: true };
}

// ── Validação de Role ──

export function validateRole(role) {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role é obrigatório.' };
  }

  if (!VALID_ROLES.includes(role)) {
    return { valid: false, error: `Role inválido. Valores permitidos: ${VALID_ROLES.join(', ')}.` };
  }

  return { valid: true };
}

// ── Sanitização de Texto ──

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remover caracteres de controle (exceto \n e \t)
  sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');

  // Remover tags HTML
  sanitized = sanitized.replace(HTML_TAG_REGEX, '');

  // Remover padrões perigosos de script
  sanitized = sanitized.replace(DANGEROUS_PATTERNS, '');

  // Limitar tamanho
  if (sanitized.length > TEXT_MAX_LENGTH) {
    sanitized = sanitized.substring(0, TEXT_MAX_LENGTH);
  }

  return sanitized.trim();
}

// ── Exportar constantes para testes ──

export const CONSTANTS = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  TEXT_MAX_LENGTH,
  VALID_ROLES,
};
