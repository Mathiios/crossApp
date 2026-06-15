/**
 * dateUtils.js
 *
 * Funções utilitárias de data extraídas de WODScreen, CheckinScreen e HomeScreen
 * para eliminar duplicação e facilitar testes.
 */

const DAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DAYS_SHORT_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 * @param {Date} [date] - Data opcional (default: agora)
 * @returns {string}
 */
export function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formata uma key YYYY-MM-DD para exibição brasileira completa.
 * Ex: "Segunda-feira, 25/10/2023"
 * @param {string} key
 * @returns {string}
 */
export function formatDateBR(key) {
  const [y, m, d] = key.split('-');
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  return `${DAYS_PT[date.getDay()]}, ${d}/${m}/${y}`;
}

/**
 * Formata uma key YYYY-MM-DD para exibição brasileira curta.
 * Ex: "Segunda, 25/10/2023"
 * @param {string} key
 * @returns {string}
 */
export function formatDateShortBR(key) {
  const [y, m, d] = key.split('-');
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  return `${DAYS_SHORT_PT[date.getDay()]}, ${d}/${m}/${y}`;
}

/**
 * Formata a data atual no estilo "Segunda, 5 de jan".
 * @param {Date} [date] - Data opcional (default: agora)
 * @returns {string}
 */
export function formatCurrentDateBR(date = new Date()) {
  return `${DAYS_SHORT_PT[date.getDay()]}, ${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`;
}
