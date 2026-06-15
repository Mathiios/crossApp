/**
 * Testes unitários — LoginScreen.js
 *
 * Usa act() para garantir que render completa antes de consultar screen.
 * Em React 19 com RNTL v14, render é async — precisamos de act + waitFor.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

// Setup mocks
require('../../../../__tests__/setup');

// Mock do useAuth
const mockLogin = jest.fn(() => Promise.resolve());
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

import LoginScreen from '../LoginScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

afterEach(cleanup);
beforeEach(() => jest.clearAllMocks());

async function renderScreen() {
  await act(async () => {
    render(<LoginScreen navigation={mockNavigation} />);
  });
}

describe('LoginScreen — Renderização', () => {
  test('renderiza campos de e-mail e senha', async () => {
    await renderScreen();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
  });

  test('renderiza botão Entrar', async () => {
    await renderScreen();
    expect(screen.getByText('ENTRAR')).toBeTruthy();
  });

  test('renderiza link "Esqueceu a senha?"', async () => {
    await renderScreen();
    expect(screen.getByText('Esqueceu a senha?')).toBeTruthy();
  });

  test('renderiza tab Cadastrar', async () => {
    await renderScreen();
    expect(screen.getByText('Cadastrar')).toBeTruthy();
  });
});

describe('LoginScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('ENTRAR')));
    expect(screen.getByText('Preencha todos os campos.')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('exibe erro para e-mail inválido', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'invalido');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Password1');
    await act(async () => fireEvent.press(screen.getByText('ENTRAR')));
    expect(screen.getByText('Formato de e-mail inválido.')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('chama login com dados válidos', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Password1');
    await act(async () => fireEvent.press(screen.getByText('ENTRAR')));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Password1'));
  });

  test('exibe erro de credenciais inválidas', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await act(async () => fireEvent.press(screen.getByText('ENTRAR')));
    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });
});

describe('LoginScreen — Navegação', () => {
  test('navega para Register ao tocar em Cadastrar', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('Cadastrar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  test('navega para ForgotPassword', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('Esqueceu a senha?'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
