/**
 * Testes unitários — inputValidation.js
 *
 * Testa todas as funções de validação e sanitização de input.
 */

import {
  validateEmail,
  validatePassword,
  validateName,
  validateUID,
  validateRole,
  sanitizeText,
  CONSTANTS,
} from '../inputValidation';

// ════════════════════════════════════════════
//  validateEmail
// ════════════════════════════════════════════

describe('validateEmail', () => {
  test('aceita e-mail válido', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  test('aceita e-mail com subdomínio', () => {
    expect(validateEmail('user@mail.example.com')).toEqual({ valid: true });
  });

  test('aceita e-mail com + e .', () => {
    expect(validateEmail('user.name+tag@domain.co')).toEqual({ valid: true });
  });

  test('rejeita null', () => {
    const result = validateEmail(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejeita string vazia', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
  });

  test('rejeita string de espaços', () => {
    const result = validateEmail('   ');
    expect(result.valid).toBe(false);
  });

  test('rejeita e-mail sem @', () => {
    const result = validateEmail('userdomain.com');
    expect(result.valid).toBe(false);
  });

  test('rejeita e-mail sem domínio', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  test('rejeita e-mail sem TLD', () => {
    const result = validateEmail('user@domain');
    expect(result.valid).toBe(false);
  });

  test('rejeita e-mail muito longo (>254 chars)', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
  });

  test('aceita e-mail com trim', () => {
    expect(validateEmail('  user@example.com  ')).toEqual({ valid: true });
  });
});

// ════════════════════════════════════════════
//  validatePassword
// ════════════════════════════════════════════

describe('validatePassword', () => {
  test('aceita senha forte (Abc12345)', () => {
    expect(validatePassword('Abc12345')).toEqual({ valid: true });
  });

  test('aceita senha complexa', () => {
    expect(validatePassword('MyP@ss1word')).toEqual({ valid: true });
  });

  test('rejeita null', () => {
    expect(validatePassword(null).valid).toBe(false);
  });

  test('rejeita string vazia', () => {
    expect(validatePassword('').valid).toBe(false);
  });

  test('rejeita senha curta (<8 chars)', () => {
    const result = validatePassword('Ab1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('8');
  });

  test('rejeita senha sem minúscula', () => {
    const result = validatePassword('ABCD1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('minúscula');
  });

  test('rejeita senha sem maiúscula', () => {
    const result = validatePassword('abcd1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maiúscula');
  });

  test('rejeita senha sem número', () => {
    const result = validatePassword('Abcdefgh');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('número');
  });

  test('rejeita senha muito longa (>128 chars)', () => {
    const longPass = 'Aa1' + 'x'.repeat(130);
    const result = validatePassword(longPass);
    expect(result.valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  validateName
// ════════════════════════════════════════════

describe('validateName', () => {
  test('aceita nome válido', () => {
    expect(validateName('João Silva')).toEqual({ valid: true });
  });

  test('aceita nome com acentos', () => {
    expect(validateName('José André')).toEqual({ valid: true });
  });

  test('rejeita null', () => {
    expect(validateName(null).valid).toBe(false);
  });

  test('rejeita nome curto (<2 chars)', () => {
    expect(validateName('A').valid).toBe(false);
  });

  test('rejeita nome muito longo (>100 chars)', () => {
    const longName = 'A'.repeat(101);
    expect(validateName(longName).valid).toBe(false);
  });

  test('rejeita nome com tag <script>', () => {
    const result = validateName('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('não permitidos');
  });

  test('rejeita nome com javascript:', () => {
    const result = validateName('javascript:void(0)');
    expect(result.valid).toBe(false);
  });

  test('rejeita nome com event handler', () => {
    const result = validateName('name onerror=alert(1)');
    expect(result.valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  validateUID
// ════════════════════════════════════════════

describe('validateUID', () => {
  test('aceita UID alfanumérico válido', () => {
    expect(validateUID('abc123XYZ')).toEqual({ valid: true });
  });

  test('aceita UID de 128 chars', () => {
    expect(validateUID('a'.repeat(128))).toEqual({ valid: true });
  });

  test('rejeita null', () => {
    expect(validateUID(null).valid).toBe(false);
  });

  test('rejeita string vazia', () => {
    expect(validateUID('').valid).toBe(false);
  });

  test('rejeita UID com caracteres especiais', () => {
    expect(validateUID('uid-with-dashes').valid).toBe(false);
  });

  test('rejeita UID com espaços', () => {
    expect(validateUID('uid with spaces').valid).toBe(false);
  });

  test('rejeita UID muito longo (>128 chars)', () => {
    expect(validateUID('a'.repeat(129)).valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  validateRole
// ════════════════════════════════════════════

describe('validateRole', () => {
  test('aceita role "aluno"', () => {
    expect(validateRole('aluno')).toEqual({ valid: true });
  });

  test('aceita role "professor"', () => {
    expect(validateRole('professor')).toEqual({ valid: true });
  });

  test('aceita role "admin"', () => {
    expect(validateRole('admin')).toEqual({ valid: true });
  });

  test('rejeita null', () => {
    expect(validateRole(null).valid).toBe(false);
  });

  test('rejeita role inválido', () => {
    const result = validateRole('superadmin');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('inválido');
  });

  test('rejeita role vazio', () => {
    expect(validateRole('').valid).toBe(false);
  });
});

// ════════════════════════════════════════════
//  sanitizeText
// ════════════════════════════════════════════

describe('sanitizeText', () => {
  test('retorna texto limpo sem alteração', () => {
    expect(sanitizeText('Texto normal')).toBe('Texto normal');
  });

  test('retorna string vazia para null', () => {
    expect(sanitizeText(null)).toBe('');
  });

  test('retorna string vazia para undefined', () => {
    expect(sanitizeText(undefined)).toBe('');
  });

  test('remove tags HTML', () => {
    const result = sanitizeText('Hello <b>world</b>');
    expect(result).toBe('Hello world');
  });

  test('remove tag <script>', () => {
    const result = sanitizeText('Normal <script>alert("xss")</script> text');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  test('remove event handlers', () => {
    const result = sanitizeText('img onerror=alert(1) src=x');
    expect(result).not.toContain('onerror=');
  });

  test('remove caracteres de controle', () => {
    const result = sanitizeText('Hello\x00World\x08Test');
    expect(result).toBe('HelloWorldTest');
  });

  test('preserva newlines e tabs', () => {
    const result = sanitizeText('Line1\nLine2\tTab');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  test('limita tamanho máximo', () => {
    const longText = 'A'.repeat(10000);
    const result = sanitizeText(longText);
    expect(result.length).toBeLessThanOrEqual(CONSTANTS.TEXT_MAX_LENGTH);
  });

  test('faz trim do resultado', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });
});
