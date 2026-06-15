/**
 * Testes de integração — Fluxo de Check-in
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

require('../setup');

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
      expect(labels.length).toBe(8);
    });
  });
});
