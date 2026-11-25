/**
 * Testes unitários — LoginScreen.js
 *
 * RNTL v14 + React 19: render() é async, e userEvent é necessário para
 * inputs com secureTextEntry atualizarem o estado corretamente.
 */

import React from 'react';
import { render, userEvent, waitFor, cleanup } from '@testing-library/react-native';

const mockLogin = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import LoginScreen from '../LoginScreen';

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: jest.fn() };

beforeEach(() => {
  mockLogin.mockReset();
  mockLogin.mockResolvedValue(undefined);
  mockNavigate.mockReset();
});

afterEach(() => {
  cleanup();
});

async function renderScreen() {
  return await render(<LoginScreen navigation={mockNavigation} />);
}

// ─── Renderização ───────────────────────────────────────────────────────────

describe('LoginScreen — Renderização', () => {
  test('renderiza campos de e-mail e senha', async () => {
    const { getByPlaceholderText, getByTestId } = await renderScreen();
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(getByTestId('input-password')).toBeTruthy();
  });

  test('renderiza botão Entrar', async () => {
    const { getByText } = await renderScreen();
    expect(getByText('ENTRAR')).toBeTruthy();
  });

  test('renderiza link "Esqueceu a senha?"', async () => {
    const { getByTestId } = await renderScreen();
    expect(getByTestId('forgot-btn')).toBeTruthy();
  });

  test('renderiza tab Cadastrar', async () => {
    const { getByTestId } = await renderScreen();
    expect(getByTestId('go-register-btn')).toBeTruthy();
  });
});

// ─── Validação ───────────────────────────────────────────────────────────────

describe('LoginScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    const { getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.press(getByText('ENTRAR'));
    await waitFor(() => expect(getByText('Preencha todos os campos.')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('exibe erro para e-mail inválido', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('seu@email.com'), 'invalido');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.press(getByText('ENTRAR'));
    await waitFor(() => expect(getByText('Formato de e-mail inválido.')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('chama login com dados válidos', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.press(getByText('ENTRAR'));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Password1')
    );
  });

  test('exibe erro de credenciais inválidas', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'wrongpass');
    await user.press(getByText('ENTRAR'));
    await waitFor(() => expect(getByText('E-mail ou senha incorretos.')).toBeTruthy());
  });
});

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('LoginScreen — Navegação', () => {
  test('navega para Register ao tocar em Cadastrar', async () => {
    const { getByTestId } = await renderScreen();
    const user = userEvent.setup();
    await user.press(getByTestId('go-register-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  test('navega para ForgotPassword', async () => {
    const { getByTestId } = await renderScreen();
    const user = userEvent.setup();
    await user.press(getByTestId('forgot-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
