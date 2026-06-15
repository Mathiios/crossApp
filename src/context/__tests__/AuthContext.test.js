/**
 * Testes unitários — AuthContext.js
 *
 * Testa derivação de roles, permissões e validação no register/login.
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

// Setup mocks ANTES de importar o componente
require('../../../__tests__/setup');

import { AuthProvider, useAuth } from '../AuthContext';

// Helper: componente que expõe valores do AuthContext
function AuthConsumer({ onValues }) {
  const auth = useAuth();
  React.useEffect(() => {
    onValues(auth);
  }, [auth]);
  return <Text testID="status">{auth.userRole}</Text>;
}

describe('AuthContext — Derivação de Roles', () => {
  test('role padrão é "aluno"', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(capturedAuth).toBeDefined();
      expect(capturedAuth.userRole).toBe('aluno');
    });
  });

  test('isAluno é true quando role é aluno', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(capturedAuth.isAluno).toBe(true);
      expect(capturedAuth.isProfessor).toBe(false);
      expect(capturedAuth.isAdmin).toBe(false);
    });
  });

  test('canManageWOD é false para aluno', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(capturedAuth.canManageWOD).toBe(false);
      expect(capturedAuth.canManageCheckins).toBe(false);
    });
  });

  test('expõe funções de autenticação', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(typeof capturedAuth.register).toBe('function');
      expect(typeof capturedAuth.login).toBe('function');
      expect(typeof capturedAuth.logout).toBe('function');
      expect(typeof capturedAuth.resetPassword).toBe('function');
    });
  });
});

describe('AuthContext — Validação no Register', () => {
  test('register rejeita e-mail inválido', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(capturedAuth.register).toBeDefined());

    await expect(
      capturedAuth.register('invalid-email', 'Password1', 'Test User')
    ).rejects.toThrow();
  });

  test('register rejeita senha fraca', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(capturedAuth.register).toBeDefined());

    await expect(
      capturedAuth.register('user@test.com', '123', 'Test User')
    ).rejects.toThrow();
  });

  test('register rejeita nome vazio', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(capturedAuth.register).toBeDefined());

    await expect(
      capturedAuth.register('user@test.com', 'Password1', '')
    ).rejects.toThrow();
  });
});

describe('AuthContext — Validação no Login', () => {
  test('login rejeita e-mail inválido', async () => {
    let capturedAuth;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthConsumer onValues={(v) => (capturedAuth = v)} />
        </AuthProvider>
      );
    });

    await waitFor(() => expect(capturedAuth.login).toBeDefined());

    await expect(
      capturedAuth.login('not-an-email', 'Password1')
    ).rejects.toMatchObject({ code: 'auth/invalid-email' });
  });
});
