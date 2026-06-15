/**
 * Testes de integração — Fluxo de Autenticação
 *
 * O mock de onAuthStateChanged armazena o callback mas não o chama
 * automaticamente. Precisamos disparar mockAuthStateCallback(null)
 * para simular que o Firebase terminou de verificar se há usuário.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';

const { mockAuthStateCallback } = require('../setup');

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

function TestApp() {
  const { user, userRole, loading, login, register, logout, isAdmin, canManageWOD } = useAuth();
  if (loading) return <Text testID="loading">Carregando...</Text>;
  return (
    <View>
      <Text testID="user-status">{user ? 'logged-in' : 'logged-out'}</Text>
      <Text testID="user-role">{userRole}</Text>
      <Text testID="is-admin">{isAdmin ? 'yes' : 'no'}</Text>
      <Text testID="can-manage-wod">{canManageWOD ? 'yes' : 'no'}</Text>
      <TouchableOpacity testID="login-btn" onPress={() => login('user@test.com', 'Password1')} />
      <TouchableOpacity testID="register-btn" onPress={() => register('new@test.com', 'Password1', 'New User')} />
      <TouchableOpacity testID="logout-btn" onPress={logout} />
    </View>
  );
}

afterEach(() => cleanup());

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * Helper: renderiza TestApp dentro de AuthProvider e
 * dispara o callback de onAuthStateChanged com null (sem usuário).
 * Avança timers para que o onSnapshot setTimeout também execute.
 */
async function renderWithAuth() {
  render(<AuthProvider><TestApp /></AuthProvider>);

  // Simula: Firebase Auth terminou de verificar → sem usuário logado
  await act(async () => {
    mockAuthStateCallback(null);
    jest.runAllTimers();
  });
}

describe('Integração — Fluxo de Login', () => {
  test('estado inicial carrega e depois exibe status', async () => {
    await renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user-status')).toBeTruthy());
    expect(screen.getByTestId('user-status').props.children).toBe('logged-out');
  });

  test('login chama signInWithEmailAndPassword', async () => {
    await renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('login-btn')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('login-btn')));
    expect(signInWithEmailAndPassword).toHaveBeenCalled();
  });
});

describe('Integração — Fluxo de Registro', () => {
  test('register cria usuario no Auth e no Firestore', async () => {
    await renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('register-btn')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('register-btn')));
    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(updateProfile).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
  });

  test('register salva com role "aluno" e status "active"', async () => {
    await renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('register-btn')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('register-btn')));
    const userData = setDoc.mock.calls[0][1];
    expect(userData.role).toBe('aluno');
    expect(userData.status).toBe('active');
    expect(userData.email).toBe('new@test.com');
    expect(userData.name).toBe('New User');
  });
});

describe('Integração — Fluxo de Logout', () => {
  test('logout chama signOut do Firebase', async () => {
    await renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('logout-btn')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('logout-btn')));
    expect(signOut).toHaveBeenCalled();
  });
});

describe('Integração — Permissões por Role', () => {
  test('role padrão é aluno sem permissões de gestão', async () => {
    await renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('user-role').props.children).toBe('aluno');
      expect(screen.getByTestId('is-admin').props.children).toBe('no');
      expect(screen.getByTestId('can-manage-wod').props.children).toBe('no');
    });
  });
});
