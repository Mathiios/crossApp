/**
 * Testes unitários — RegisterScreen.js
 *
 * RNTL v14 + React 19: render() é assíncrono, deve ser aguardado com await.
 */

import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';

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

describe('RegisterScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    const { getByText } = await renderScreen();
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('Preencha todos os campos.')).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('exibe erro para nome muito curto', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'A');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(getByTestId('input-password'), 'Password1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'Password1');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/mínimo 2 caracteres/i)).toBeTruthy());
  });

  test('exibe erro para e-mail inválido', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'invalid');
    fireEvent.changeText(getByTestId('input-password'), 'Password1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'Password1');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('Formato de e-mail inválido.')).toBeTruthy());
  });

  test('exibe erro quando senhas não conferem', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(getByTestId('input-password'), 'Password1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'Password2');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText('As senhas não conferem.')).toBeTruthy());
  });

  test('exibe erro para senha sem maiúscula', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(getByTestId('input-password'), 'password1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'password1');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/maiúscula/)).toBeTruthy());
  });

  test('exibe erro para senha curta', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(getByTestId('input-password'), 'Ab1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'Ab1');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() => expect(getByText(/mínimo 8 caracteres/i)).toBeTruthy());
  });
});

describe('RegisterScreen — Registro com sucesso', () => {
  test('chama register com dados válidos', async () => {
    const { getByPlaceholderText, getByTestId, getByText } = await renderScreen();
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(getByTestId('input-password'), 'Password1');
    fireEvent.changeText(getByTestId('input-confirm-password'), 'Password1');
    fireEvent.press(getByText('CADASTRAR'));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('user@test.com', 'Password1', 'Test User')
    );
  });
});

describe('RegisterScreen — Navegação', () => {
  test('navega para Login ao tocar em Entrar', async () => {
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId('go-login-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
