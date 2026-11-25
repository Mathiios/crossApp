/**
 * Testes unitários — RegisterScreen.js
 *
 * RNTL v14 + React 19: render() é async, e userEvent é necessário para
 * inputs com secureTextEntry atualizarem o estado corretamente.
 */

import React from 'react';
import { render, userEvent, waitFor, cleanup } from '@testing-library/react-native';

const mockRegister = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import RegisterScreen from '../RegisterScreen';

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: jest.fn() };

beforeEach(() => {
  mockRegister.mockReset();
  mockRegister.mockResolvedValue(undefined);
  mockNavigate.mockReset();
});

afterEach(() => {
  cleanup();
});

async function renderScreen() {
  return await render(<RegisterScreen navigation={mockNavigation} />);
}

// ─── Renderização ────────────────────────────────────────────────────────────

describe('RegisterScreen — Renderização', () => {
  test('renderiza todos os campos', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    expect(getByPlaceholderText('Seu nome completo')).toBeTruthy();
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(getByTestId('input-password')).toBeTruthy();
    expect(getByTestId('input-confirm-password')).toBeTruthy();
    expect(getByText('CADASTRAR')).toBeTruthy();
  });

  test('renderiza link de volta ao login', async () => {
    const { getByTestId } = await renderScreen();
    expect(getByTestId('go-login-btn')).toBeTruthy();
  });
});

// ─── Validação ───────────────────────────────────────────────────────────────

describe('RegisterScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    const { getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('Preencha todos os campos.')).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('exibe erro para nome muito curto', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'A');
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.type(getByTestId('input-confirm-password'), 'Password1');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/mínimo 2 caracteres/i)).toBeTruthy());
  });

  test('exibe erro para e-mail inválido', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'Test User');
    await user.type(getByPlaceholderText('seu@email.com'), 'invalid');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.type(getByTestId('input-confirm-password'), 'Password1');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('Formato de e-mail inválido.')).toBeTruthy());
  });

  test('exibe erro quando senhas não conferem', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'Test User');
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.type(getByTestId('input-confirm-password'), 'Password2');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('As senhas não conferem.')).toBeTruthy());
  });

  test('exibe erro para senha sem maiúscula', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'Test User');
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'password1');
    await user.type(getByTestId('input-confirm-password'), 'password1');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/maiúscula/)).toBeTruthy());
  });

  test('exibe erro para senha curta', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'Test User');
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'Ab1');
    await user.type(getByTestId('input-confirm-password'), 'Ab1');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/mínimo 8 caracteres/i)).toBeTruthy());
  });
});

// ─── Registro com sucesso ────────────────────────────────────────────────────

describe('RegisterScreen — Registro com sucesso', () => {
  test('chama register com dados válidos', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    const user = userEvent.setup();
    await user.type(getByPlaceholderText('Seu nome completo'), 'Test User');
    await user.type(getByPlaceholderText('seu@email.com'), 'user@test.com');
    await user.type(getByTestId('input-password'), 'Password1');
    await user.type(getByTestId('input-confirm-password'), 'Password1');
    await user.press(getByText('CADASTRAR'));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('user@test.com', 'Password1', 'Test User')
    );
  });
});

// ─── Navegação ────────────────────────────────────────────────────────────────

describe('RegisterScreen — Navegação', () => {
  test('navega para Login ao tocar em Entrar', async () => {
    const { getByTestId } = await renderScreen();
    const user = userEvent.setup();
    await user.press(getByTestId('go-login-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
