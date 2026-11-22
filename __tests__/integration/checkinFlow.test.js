/**
 * Testes de integração — Fluxo de Check-in
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

require('../setup');

// Mock dateUtils para retornar horários fixos independente da hora atual.
// Sem esse mock, horários como 06:00/07:00 são filtrados se o teste rodar depois das 07h.
jest.mock('../../src/utils/dateUtils', () => {
  const TODAY = '2026-11-16'; // Segunda-feira
  return {
    getTodayKey: jest.fn(() => TODAY),
    formatDateShortBR: jest.fn(() => 'Segunda, 16/11/2026'),
    getWeekDays: jest.fn(() => [
      { key: '2026-11-16', label: 'Seg', dayNum: 16, monthLabel: 'nov', isToday: true,  isPast: false },
      { key: '2026-11-17', label: 'Ter', dayNum: 17, monthLabel: 'nov', isToday: false, isPast: false },
      { key: '2026-11-18', label: 'Qua', dayNum: 18, monthLabel: 'nov', isToday: false, isPast: false },
      { key: '2026-11-19', label: 'Qui', dayNum: 19, monthLabel: 'nov', isToday: false, isPast: false },
      { key: '2026-11-20', label: 'Sex', dayNum: 20, monthLabel: 'nov', isToday: false, isPast: false },
      { key: '2026-11-21', label: 'Sáb', dayNum: 21, monthLabel: 'nov', isToday: false, isPast: false },
    ]),
  };
});

// Sobrescreve Date() sem quebrar Date.now ou new Date(args)
// Simula meia-noite para garantir que todos os 7 horários apareçam como "futuros"
const OriginalDate = global.Date;
const MOCK_NOW = new OriginalDate('2026-11-16T00:01:00');
global.Date = class extends OriginalDate {
  constructor(...args) {
    if (args.length === 0) {
      super('2026-11-16T00:01:00');
    } else {
      super(...args);
    }
  }
  static now() { return MOCK_NOW.getTime(); }
};

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', displayName: 'Test User', email: 'test@test.com' },
    canManageCheckins: false,
  }),
}));

import CheckinScreen from '../../src/screens/main/CheckinScreen';

beforeEach(() => jest.clearAllMocks());

describe('Integração Check-in — Visualização', () => {
  test('renderiza header "Agendar Aula"', async () => {
    render(<CheckinScreen />);
    await waitFor(() => expect(screen.getByText('Agendar Aula')).toBeTruthy());
  });

  test('exibe horários das aulas', async () => {
    render(<CheckinScreen />);
    await waitFor(() => {
      expect(screen.getByText('06:00')).toBeTruthy();
      expect(screen.getByText('07:00')).toBeTruthy();
      expect(screen.getByText('18:40')).toBeTruthy();
    });
  });

  test('exibe banner quando nenhuma aula marcada', async () => {
    render(<CheckinScreen />);
    await waitFor(() => expect(screen.getByText('Selecione uma aula para fazer o check-in')).toBeTruthy());
  });

  test('exibe label "CrossFit" em cada slot', async () => {
    render(<CheckinScreen />);
    await waitFor(() => {
      const labels = screen.getAllByText('CrossFit');
      expect(labels.length).toBe(7); // CLASS_TIMES tem 7 horários
    });
  });
});
