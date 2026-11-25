/**
 * Testes unitários — Lógica de ordenação do Ranking
 *
 * Testa as regras de negócio do ranking:
 *  - scoringType === 'reps' → ordenação DESCENDENTE (mais repetições primeiro)
 *  - scoringType === 'time' → ordenação ASCENDENTE  (menor tempo primeiro)
 */

import {
  sortScores,
  parseTimeInput,
  formatTime,
  formatScore,
  getDiff,
} from '../../../utils/rankingUtils';

// ── Dados de fixture ─────────────────────────────────────────────────────────

const repsScores = [
  { id: 'u1', athleteName: 'Alice', score: 85 },
  { id: 'u2', athleteName: 'Bob',   score: 120 },
  { id: 'u3', athleteName: 'Carol', score: 95 },
  { id: 'u4', athleteName: 'Dave',  score: 120 }, // empate com Bob
];

const timeScores = [
  { id: 'u1', athleteName: 'Alice', score: 310 },  // 5:10
  { id: 'u2', athleteName: 'Bob',   score: 245 },  // 4:05
  { id: 'u3', athleteName: 'Carol', score: 180 },  // 3:00
  { id: 'u4', athleteName: 'Dave',  score: 420 },  // 7:00
];

// ── Testes: sortScores ───────────────────────────────────────────────────────

describe('Ranking — Ordenação por repetições (reps)', () => {
  let sorted;

  beforeEach(() => {
    sorted = sortScores(repsScores, 'reps');
  });

  test('ordena em ordem descendente (mais reps primeiro)', () => {
    const scores = sorted.map(s => s.score);
    expect(scores).toEqual([120, 120, 95, 85]);
  });

  test('o primeiro lugar tem a maior pontuação', () => {
    expect(sorted[0].score).toBe(120);
  });

  test('o último lugar tem a menor pontuação', () => {
    expect(sorted[sorted.length - 1].score).toBe(85);
  });

  test('não altera o array original', () => {
    const original = repsScores.map(s => s.score);
    expect(original).toEqual([85, 120, 95, 120]);
  });
});

describe('Ranking — Ordenação por tempo (time)', () => {
  let sorted;

  beforeEach(() => {
    sorted = sortScores(timeScores, 'time');
  });

  test('ordena em ordem ascendente (menor tempo primeiro)', () => {
    const scores = sorted.map(s => s.score);
    expect(scores).toEqual([180, 245, 310, 420]);
  });

  test('o primeiro lugar tem o menor tempo', () => {
    expect(sorted[0].athleteName).toBe('Carol'); // 3:00 = 180s
  });

  test('o último lugar tem o maior tempo', () => {
    expect(sorted[sorted.length - 1].athleteName).toBe('Dave'); // 7:00 = 420s
  });

  test('não altera o array original', () => {
    const original = timeScores.map(s => s.score);
    expect(original).toEqual([310, 245, 180, 420]);
  });
});

describe('Ranking — Casos extremos', () => {
  test('lista vazia retorna array vazio', () => {
    expect(sortScores([], 'reps')).toEqual([]);
    expect(sortScores([], 'time')).toEqual([]);
  });

  test('único atleta é o primeiro colocado', () => {
    const result = sortScores([{ id: 'u1', score: 50 }], 'reps');
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(50);
  });

  test('score null em reps vai para o final (trata como 0)', () => {
    const data = [
      { id: 'u1', score: 100 },
      { id: 'u2', score: null },
      { id: 'u3', score: 50 },
    ];
    const result = sortScores(data, 'reps');
    expect(result[0].score).toBe(100);
    expect(result[result.length - 1].score).toBeNull();
  });

  test('score null em time vai para o final (trata como Infinity)', () => {
    const data = [
      { id: 'u1', score: 300 },
      { id: 'u2', score: null },
      { id: 'u3', score: 150 },
    ];
    const result = sortScores(data, 'time');
    expect(result[0].score).toBe(150);
    expect(result[result.length - 1].score).toBeNull();
  });
});

// ── Testes: parseTimeInput ───────────────────────────────────────────────────

describe('parseTimeInput', () => {
  test('converte mm:ss para segundos', () => {
    expect(parseTimeInput('4:05')).toBe(245);
    expect(parseTimeInput('3:00')).toBe(180);
    expect(parseTimeInput('10:30')).toBe(630);
  });

  test('aceita segundos puros', () => {
    expect(parseTimeInput('245')).toBe(245);
    expect(parseTimeInput('0')).toBe(0);
  });

  test('retorna null para entrada vazia ou inválida', () => {
    expect(parseTimeInput('')).toBeNull();
    expect(parseTimeInput(null)).toBeNull();
    expect(parseTimeInput('abc')).toBeNull();
    expect(parseTimeInput('1:60')).toBeNull(); // segundos >= 60
    expect(parseTimeInput('1:2:3')).toBeNull(); // 3 partes
  });
});

// ── Testes: formatTime ───────────────────────────────────────────────────────

describe('formatTime', () => {
  test('formata segundos em mm:ss', () => {
    expect(formatTime(245)).toBe('4:05');
    expect(formatTime(180)).toBe('3:00');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(0)).toBe('0:00');
  });

  test('retorna -- para null', () => {
    expect(formatTime(null)).toBe('--');
  });
});

// ── Testes: formatScore ──────────────────────────────────────────────────────

describe('formatScore', () => {
  test('formata reps com sufixo "reps"', () => {
    expect(formatScore(120, 'reps')).toBe('120 reps');
  });

  test('formata time em mm:ss', () => {
    expect(formatScore(245, 'time')).toBe('4:05');
  });

  test('retorna -- para score null', () => {
    expect(formatScore(null, 'reps')).toBe('--');
    expect(formatScore(null, 'time')).toBe('--');
  });
});

// ── Testes: getDiff ──────────────────────────────────────────────────────────

describe('getDiff', () => {
  test('retorna string vazia para o líder (mesmo score)', () => {
    expect(getDiff(120, 120, 'reps')).toBe('');
    expect(getDiff(180, 180, 'time')).toBe('');
  });

  test('calcula diferença negativa para reps', () => {
    expect(getDiff(85, 120, 'reps')).toBe('-35 reps');
    expect(getDiff(95, 120, 'reps')).toBe('-25 reps');
  });

  test('calcula diferença positiva para time', () => {
    expect(getDiff(310, 180, 'time')).toBe('+2:10'); // 310-180=130s = 2:10
    expect(getDiff(245, 180, 'time')).toBe('+1:05'); // 245-180=65s = 1:05
  });

  test('retorna string vazia quando score ou leader são null', () => {
    expect(getDiff(null, 120, 'reps')).toBe('');
    expect(getDiff(85, null, 'reps')).toBe('');
  });
});
