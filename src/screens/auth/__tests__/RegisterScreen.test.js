/**
 * Testes unitários — RegisterScreen.js
 *
 * Usa act() para garantir que render completa antes de consultar screen.
 * Em React 19 com RNTL v14, render é async — precisamos de act + waitFor.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

require('../../../../__tests__/setup');

const mockRegister = jest.fn(() => Promise.resolve());
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import RegisterScreen from '../RegisterScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

afterEach(cleanup);
beforeEach(() => jest.clearAllMocks());

async function renderScreen() {
  await act(async () => {
    render(<RegisterScreen navigation={mockNavigation} />);
  });
}

describe('RegisterScreen — Renderização', () => {
  test('renderiza todos os campos', async () => {
    await renderScreen();
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeTruthy();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeTruthy();
    expect(screen.getByPlaceholderText('Repita a senha')).toBeTruthy();
    expect(screen.getByText('CADASTRAR')).toBeTruthy();
  });

  test('renderiza link de volta ao login', async () => {
    await renderScreen();
    expect(screen.getByText('Entrar')).toBeTruthy();
  });
});

describe('RegisterScreen — Validação', () => {
  test('exibe erro se campos vazios', async () => {
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText('Preencha todos os campos.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('exibe erro para nome muito curto', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'A');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Password1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'Password1');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText(/mínimo 2 caracteres/i)).toBeTruthy();
  });

  test('exibe erro para e-mail inválido', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'invalid');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Password1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'Password1');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText('Formato de e-mail inválido.')).toBeTruthy();
  });

  test('exibe erro quando senhas não conferem', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Password1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'Password2');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
  });

  test('exibe erro para senha sem maiúscula', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'password1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'password1');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText(/maiúscula/)).toBeTruthy();
  });

  test('exibe erro para senha curta', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Ab1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'Ab1');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeTruthy();
  });
});

describe('RegisterScreen — Registro com sucesso', () => {
  test('chama register com dados válidos', async () => {
    await renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Test User');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'Password1');
    fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'Password1');
    await act(async () => fireEvent.press(screen.getByText('CADASTRAR')));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('user@test.com', 'Password1', 'Test User'));
  });
});

describe('RegisterScreen — Navegação', () => {
  test('navega para Login ao tocar em Entrar', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('Entrar'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
