/**
 * Testes unitários — dateUtils.js
 *
 * Testa as funções de formatação e geração de chaves de data.
 */

import { getTodayKey, formatDateBR, formatDateShortBR, formatCurrentDateBR } from '../dateUtils';

// ════════════════════════════════════════════
//  getTodayKey
// ════════════════════════════════════════════

describe('getTodayKey', () => {
  test('retorna formato YYYY-MM-DD', () => {
    const result = getTodayKey();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('pad mês e dia com zero', () => {
    // 5 de janeiro de 2024
    const date = new Date(2024, 0, 5);
    expect(getTodayKey(date)).toBe('2024-01-05');
  });

  test('funciona com data de dezembro', () => {
    const date = new Date(2024, 11, 25);
    expect(getTodayKey(date)).toBe('2024-12-25');
  });

  test('funciona com data de outubro (mês 2 dígitos)', () => {
    const date = new Date(2024, 9, 15);
    expect(getTodayKey(date)).toBe('2024-10-15');
  });

  test('funciona no dia 31', () => {
    const date = new Date(2024, 0, 31);
    expect(getTodayKey(date)).toBe('2024-01-31');
  });

  test('sem argumento usa data atual', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(getTodayKey()).toBe(expected);
  });
});

// ════════════════════════════════════════════
//  formatDateBR
// ════════════════════════════════════════════

describe('formatDateBR', () => {
  test('formata data corretamente (dia da semana completo)', () => {
    // 25 de dezembro de 2024 é quarta-feira
    const result = formatDateBR('2024-12-25');
    expect(result).toBe('Quarta-feira, 25/12/2024');
  });

  test('formata data de domingo', () => {
    // 1 de dezembro de 2024 é domingo
    const result = formatDateBR('2024-12-01');
    expect(result).toBe('Domingo, 01/12/2024');
  });

  test('formata data de sábado', () => {
    // 7 de dezembro de 2024 é sábado
    const result = formatDateBR('2024-12-07');
    expect(result).toBe('Sábado, 07/12/2024');
  });

  test('mantém zeros à esquerda', () => {
    const result = formatDateBR('2024-01-05');
    expect(result).toContain('05/01/2024');
  });
});

// ════════════════════════════════════════════
//  formatDateShortBR
// ════════════════════════════════════════════

describe('formatDateShortBR', () => {
  test('formata com dia da semana curto', () => {
    // 25 de dezembro de 2024 é quarta-feira
    const result = formatDateShortBR('2024-12-25');
    expect(result).toBe('Quarta, 25/12/2024');
  });

  test('formata domingo curto', () => {
    const result = formatDateShortBR('2024-12-01');
    expect(result).toBe('Domingo, 01/12/2024');
  });
});

// ════════════════════════════════════════════
//  formatCurrentDateBR
// ════════════════════════════════════════════

describe('formatCurrentDateBR', () => {
  test('retorna formato "Dia, DD de mmm"', () => {
    const result = formatCurrentDateBR();
    // Deve conter vírgula e "de"
    expect(result).toContain(',');
    expect(result).toContain(' de ');
  });

  test('formata data fixa corretamente', () => {
    // 25 de dezembro de 2024 é quarta-feira
    const date = new Date(2024, 11, 25);
    const result = formatCurrentDateBR(date);
    expect(result).toBe('Quarta, 25 de dez');
  });

  test('formata 1 de janeiro', () => {
    const date = new Date(2024, 0, 1);
    const result = formatCurrentDateBR(date);
    expect(result).toContain('jan');
    expect(result).toContain('1');
  });

  test('sem argumento usa data atual', () => {
    const result = formatCurrentDateBR();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });
});
