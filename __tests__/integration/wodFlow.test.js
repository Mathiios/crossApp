/**
 * Testes de integração — Fluxo de WOD
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

require('../setup');

import { setDoc } from 'firebase/firestore';

const mockAuthValues = { canManageWOD: true };
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ canManageWOD: mockAuthValues.canManageWOD }),
}));

import WODScreen from '../../src/screens/main/WODScreen';

beforeEach(() => { jest.clearAllMocks(); mockAuthValues.canManageWOD = true; });

describe('Integração WOD — Visualização', () => {
  test('renderiza header com título WOD', async () => {
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('WOD')).toBeTruthy());
  });

  test('exibe mensagem quando não há treino', async () => {
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('Treino não cadastrado')).toBeTruthy());
  });

  test('professor vê botão "Editar"', async () => {
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('Editar')).toBeTruthy());
  });
});

describe('Integração WOD — Modo Edição', () => {
  test('abre modo edição ao clicar em Editar', async () => {
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('Editar')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByText('Editar')));
    await waitFor(() => expect(screen.getByText('Editar Treino de Hoje')).toBeTruthy());
  });

  test('cancelar edição volta ao modo visualização', async () => {
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('Editar')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByText('Editar')));
    await waitFor(() => expect(screen.getByText('Cancelar')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByText('Cancelar')));
    await waitFor(() => expect(screen.getByText('Treino não cadastrado')).toBeTruthy());
  });
});

describe('Integração WOD — Permissões', () => {
  test('aluno não vê botão Editar', async () => {
    mockAuthValues.canManageWOD = false;
    render(<WODScreen />);
    await waitFor(() => expect(screen.getByText('WOD')).toBeTruthy());
    expect(screen.queryByText('Editar')).toBeNull();
  });
});
