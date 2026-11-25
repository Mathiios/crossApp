/**
 * rankingUtils.js
 *
 * Utilitários de ranking: parsing, formatação e ordenação de scores.
 * Usado por RankingScreen.js e pelos testes unitários.
 */

/** Converte input de tempo (mm:ss ou segundos puros) para total em segundos */
export function parseTimeInput(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) return null;
    return mins * 60 + secs;
  }
  const n = parseInt(trimmed, 10);
  return isNaN(n) || n < 0 ? null : n;
}

/** Formata segundos em mm:ss */
export function formatTime(totalSeconds) {
  if (totalSeconds == null) return '--';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Formata score conforme tipo ('reps' ou 'time') */
export function formatScore(score, scoringType) {
  if (score == null) return '--';
  if (scoringType === 'time') return formatTime(score);
  return `${score} reps`;
}

/** Calcula diferença em relação ao líder */
export function getDiff(score, leaderScore, scoringType) {
  if (score == null || leaderScore == null || score === leaderScore) return '';
  if (scoringType === 'time') {
    const diff = score - leaderScore;
    return `+${formatTime(diff)}`;
  }
  const diff = leaderScore - score;
  return `-${diff} reps`;
}

/**
 * Ordena um array de scores conforme o tipo de pontuação:
 *  - 'reps' → descendente (mais repetições primeiro)
 *  - 'time' → ascendente  (menor tempo primeiro)
 *
 * Não muta o array original.
 */
export function sortScores(rawScores, scoringType) {
  const sorted = [...rawScores];
  if (scoringType === 'time') {
    sorted.sort((a, b) => (a.score || Infinity) - (b.score || Infinity));
  } else {
    sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  return sorted;
}
