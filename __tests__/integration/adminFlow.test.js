/**
 * Testes de integração — Fluxo de Admin
 *
 * O AdminScreen usa onSnapshot com collection ref (não doc ref).
 * O mock padrão do setup.js retorna snapshot de doc, mas AdminScreen
 * espera snapshot de collection com propriedade `docs`.
 * Aqui sobrescrevemos o onSnapshot mock para fornecer docs corretos.
 */
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react-native';

require('../setup');

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'admin-uid-123', displayName: 'Admin User', email: 'admin@test.com' },
    isAdmin: true, userRole: 'admin',
  }),
}));

// Sobrescreve o mock de onSnapshot para retornar snapshot de collection
const { onSnapshot } = require('firebase/firestore');
onSnapshot.mockImplementation((ref, onNext, onError) => {
  if (onNext) {
    setTimeout(() => {
      onNext({
        docs: [
          {
            id: 'user-1',
            data: () => ({ name: 'João Silva', email: 'joao@test.com', role: 'aluno', status: 'active' }),
          },
          {
            id: 'user-2',
            data: () => ({ name: 'Maria Santos', email: 'maria@test.com', role: 'professor', status: 'active' }),
          },
        ],
      });
    }, 0);
  }
  return jest.fn(); // unsubscribe
});

import AdminScreen from '../../src/screens/main/AdminScreen';

afterEach(() => cleanup());
beforeEach(() => jest.clearAllMocks());

describe('Integração Admin — Renderização', () => {
  test('renderiza header "Usuarios"', async () => {
    render(<AdminScreen />);
    await waitFor(() => expect(screen.getByText('Usuarios')).toBeTruthy());
  });

  test('exibe legenda de roles', async () => {
    render(<AdminScreen />);
    await waitFor(() => {
      expect(screen.getAllByText('Aluno').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Professor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('exibe barra de pesquisa', async () => {
    render(<AdminScreen />);
    await waitFor(() => expect(screen.getByPlaceholderText('Buscar por nome ou e-mail...')).toBeTruthy());
  });
});

describe('Integração Admin — Validação de Segurança', () => {
  test('validateUID rejeita path traversal', () => {
    const { validateUID } = require('../../src/utils/inputValidation');
    expect(validateUID('../../../etc/passwd').valid).toBe(false);
  });

  test('validateRole rejeita roles inválidos', () => {
    const { validateRole } = require('../../src/utils/inputValidation');
    expect(validateRole('superadmin').valid).toBe(false);
    expect(validateRole('aluno').valid).toBe(true);
  });
});
