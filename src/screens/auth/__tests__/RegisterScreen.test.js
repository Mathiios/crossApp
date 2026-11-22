/**
 * Testes unitários — RegisterScreen.js
 *
 * Usa act() para garantir que render completa antes de consultar screen.
 * Em React 19 com RNTL v14, render é async — precisamos de act + waitFor.
 *
 * Inputs com secureTextEntry são acessados via testID para evitar problemas
 * de placeholder lookup em campos de senha.
 */

import React from 'react';
import { renderAsync, screen, fireEventAsync, waitFor } from '@testing-library/react-native';

require('../../../../__tests__/setup');

const mockRegister = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import RegisterScreen from '../RegisterScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

beforeEach(() => {
  mockRegister.mockReset();
  mockRegister.mockResolvedValue(undefined);
  mockNavigation.navigate.mockReset();
});

async function renderScreen() {
  let result;

  await act(async () => {
    result = render(<RegisterScreen navigation={mockNavigation} />);
  });

  return result;
}

describe('RegisterScreen — Renderização', () => {
  test('renderiza todos os campos', async () => {
    await renderScreen();
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeTruthy();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByTestId('input-password')).toBeTruthy();
    expect(screen.getByTestId('input-confirm-password')).toBeTruthy();
    expect(screen.getByText('CADASTRAR')).toBeTruthy();
  });

  test('renderiza link de volta ao login', async () => {
    await renderScreen();
    expect(screen.getByTestId('go-login-btn')).toBeTruthy();
  });
});

describe('RegisterScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    await renderScreen();
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText('Preencha todos os campos.')).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('exibe erro para nome muito curto', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'A');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'Password1');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText(/mínimo 2 caracteres/i)).toBeTruthy());
  });

  test('exibe erro para e-mail inválido', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'invalid');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'Password1');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText('Formato de e-mail inválido.')).toBeTruthy());
  });

  test('exibe erro quando senhas não conferem', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'Password2');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText('As senhas não conferem.')).toBeTruthy());
  });

  test('exibe erro para senha sem maiúscula', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'password1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'password1');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText(/maiúscula/)).toBeTruthy());
  });

  test('exibe erro para senha curta', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Ab1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'Ab1');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(screen.getByText(/mínimo 8 caracteres/i)).toBeTruthy());
  });
});

describe('RegisterScreen — Registro com sucesso', () => {
  test('chama register com dados válidos', async () => {
    await renderScreen();
    await fireEventAsync.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    await fireEventAsync.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    await fireEventAsync.changeText(screen.getByTestId('input-password'), 'Password1');
    await fireEventAsync.changeText(screen.getByTestId('input-confirm-password'), 'Password1');
    await fireEventAsync.press(screen.getByText('CADASTRAR'));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('user@test.com', 'Password1', 'Test User'));
  });
});

describe('RegisterScreen — Navegação', () => {
  test('navega para Login ao tocar em Entrar', async () => {
    await renderScreen();
    await fireEventAsync.press(screen.getByTestId('go-login-btn'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
