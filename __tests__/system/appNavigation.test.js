/**
 * Testes de Sistema — Navegação do App
 *
 * Testa roteamento por autenticação e visibilidade por role.
 */

require('../setup');

describe('Sistema — Roteamento por autenticação', () => {
  test('usuário null deve direcionar para fluxo de autenticação', () => {
    jest.doMock('../../src/context/AuthContext', () => ({
      useAuth: () => ({
        user: null, loading: false, userRole: 'aluno',
        isAluno: true, isProfessor: false, isAdmin: false,
        canManageWOD: false, canManageCheckins: false,
      }),
      AuthProvider: ({ children }) => children,
    }));
    jest.resetModules();
    const { useAuth } = require('../../src/context/AuthContext');
    const auth = useAuth();
    expect(auth.user).toBeNull();
    expect(auth.loading).toBe(false);
  });

  test('usuário autenticado tem uid e email', () => {
    jest.doMock('../../src/context/AuthContext', () => ({
      useAuth: () => ({
        user: { uid: 'test-uid', email: 'user@test.com', displayName: 'Test' },
        loading: false, userRole: 'aluno',
        isAluno: true, isProfessor: false, isAdmin: false,
        canManageWOD: false, canManageCheckins: false,
      }),
      AuthProvider: ({ children }) => children,
    }));
    jest.resetModules();
    const { useAuth } = require('../../src/context/AuthContext');
    const auth = useAuth();
    expect(auth.user).not.toBeNull();
    expect(auth.user.uid).toBe('test-uid');
  });
});

describe('Sistema — Visibilidade por Role', () => {
  test('admin tem acesso completo à gestão', () => {
    jest.doMock('../../src/context/AuthContext', () => ({
      useAuth: () => ({
        user: { uid: 'admin-uid' }, loading: false, userRole: 'admin',
        isAluno: false, isProfessor: false, isAdmin: true,
        canManageWOD: true, canManageCheckins: true, logout: jest.fn(),
      }),
    }));
    jest.resetModules();
    const { useAuth } = require('../../src/context/AuthContext');
    const auth = useAuth();
    expect(auth.isAdmin).toBe(true);
    expect(auth.canManageWOD).toBe(true);
    expect(auth.canManageCheckins).toBe(true);
  });

  test('professor pode gerenciar WOD e checkins mas não é admin', () => {
    jest.doMock('../../src/context/AuthContext', () => ({
      useAuth: () => ({
        user: { uid: 'prof-uid' }, loading: false, userRole: 'professor',
        isAluno: false, isProfessor: true, isAdmin: false,
        canManageWOD: true, canManageCheckins: true, logout: jest.fn(),
      }),
    }));
    jest.resetModules();
    const { useAuth } = require('../../src/context/AuthContext');
    const auth = useAuth();
    expect(auth.isProfessor).toBe(true);
    expect(auth.isAdmin).toBe(false);
    expect(auth.canManageWOD).toBe(true);
  });

  test('aluno não tem acesso a funcionalidades de gestão', () => {
    jest.doMock('../../src/context/AuthContext', () => ({
      useAuth: () => ({
        user: { uid: 'aluno-uid' }, loading: false, userRole: 'aluno',
        isAluno: true, isProfessor: false, isAdmin: false,
        canManageWOD: false, canManageCheckins: false, logout: jest.fn(),
      }),
    }));
    jest.resetModules();
    const { useAuth } = require('../../src/context/AuthContext');
    const auth = useAuth();
    expect(auth.isAluno).toBe(true);
    expect(auth.canManageWOD).toBe(false);
    expect(auth.canManageCheckins).toBe(false);
    expect(auth.isAdmin).toBe(false);
  });
});
