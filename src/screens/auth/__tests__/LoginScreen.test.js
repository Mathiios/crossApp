/**
 * Testes unitários — LoginScreen.js
 *
 * Usa act() para garantir que render completa antes de consultar screen.
 * Em React 19 com RNTL v14, render é async — precisamos de act + waitFor.
 *
 * Inputs com secureTextEntry são acessados via testID para evitar problemas
 * de placeholder lookup em campos de senha.
 */

import React from 'react';
import { renderAsync, screen, fireEventAsync, waitFor } from '@testing-library/react-native';

// Setup mocks
require('../../../../__tests__/setup');

// Mock do useAuth
const mockLogin = jest.fn();
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

beforeEach(() => {
  mockLogin.mockReset();
  mockLogin.mockResolvedValue(undefined);
  mockNavigation.navigate.mockReset();
});

async function renderScreen() {
  let result;

  await act(async () => {
    result = render(<RegisterScreen navigation={mockNavigation} />);
  });

  return result;
}

describe('LoginScreen — Renderização', () => {
  test('renderiza campos de e-mail e senha', async () => {
    await renderScreen();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByTestId('input-password')).toBeTruthy();
  });

  test('renderiza botão Entrar', async () => {
    await renderScreen();
    expect(screen.getByText('ENTRAR')).toBeTruthy();
  });

  test('renderiza link "Esqueceu a senha?"', async () => {
    await renderScreen();
    expect(screen.getByTestId('forgot-btn')).toBeTruthy();
  });

  test('renderiza tab Cadastrar', async () => {
    await renderScreen();
    expect(screen.getByTestId('go-register-btn')).toBeTruthy();
  });
});

describe('LoginScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    await renderScreen();
    await fireEventAsync.press(screen.getByText('ENTRAR'));
    await waitFor(() => expect(screen.getByText('Preencha todos os campos.')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('exibe erro para e-mail inválido', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'invalido');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.press(screen.getByText('ENTRAR'));
    await waitFor(() => expect(screen.getByText('Formato de e-mail inválido.')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('chama login com dados válidos', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.press(screen.getByText('ENTRAR'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Password1'));
  });

  test('exibe erro de credenciais inválidas', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'wrongpass');
    await fireEventAsync.press(screen.getByText('ENTRAR'));
    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });
});

describe('LoginScreen — Navegação', () => {
  test('navega para Register ao tocar em Cadastrar', async () => {
    await renderScreen();
    await fireEventAsync.press(screen.getByTestId('go-register-btn'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  test('navega para ForgotPassword', async () => {
    await renderScreen();
    await fireEventAsync.press(screen.getByTestId('forgot-btn'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
