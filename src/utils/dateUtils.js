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

/**
 * Retorna os dias úteis (Seg–Sáb) da semana corrente.
 * Cada item: { key: 'YYYY-MM-DD', label: 'Seg', dayNum: 7, monthLabel: 'out', isToday: bool, isPast: bool }
 * @returns {Array}
 */
export function getWeekDays() {
  const today = new Date();
  const todayStr = getTodayKey(today);
  const dayOfWeek = today.getDay(); // 0 = Domingo

  // Calcula segunda-feira desta semana
  const monday = new Date(today);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // se Domingo, volta 6 dias
  monday.setDate(today.getDate() + diff);

  const LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = [];

  for (let i = 0; i < 6; i++) { // Seg a Sáb
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = getTodayKey(d);
    days.push({
      key,
      label: LABELS[i],
      dayNum: d.getDate(),
      monthLabel: MONTHS_PT[d.getMonth()],
      isToday: key === todayStr,
      isPast: key < todayStr,
    });
  }

  return days;
}
