import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState('aluno');
  const [loading, setLoading]   = useState(true);

  // Listener de autenticação
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole('aluno');
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Listener do documento do usuário no Firestore
  // Se o documento for excluído ou marcado como desativado → logout forçado
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, 'users', user.uid);
    const timeout = setTimeout(() => setLoading(false), 8000);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        clearTimeout(timeout);

        // ── Documento excluído pelo admin ──
        if (!snap.exists()) {
          setLoading(false);
          signOut(auth); // força logout imediato
          return;
        }

        const data = snap.data();

        // ── Conta desativada/excluída pelo admin ──
        if (data.status === 'deleted' || data.status === 'disabled') {
          setLoading(false);
          signOut(auth); // força logout imediato
          return;
        }

        setUserRole(data.role || 'aluno');
        setLoading(false);
      },
      () => {
        clearTimeout(timeout);
        setUserRole('aluno');
        setLoading(false);
      }
    );

    return () => { clearTimeout(timeout); unsub(); };
  }, [user?.uid]);

  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      role:      'aluno',
      status:    'active',
      createdAt: new Date().toISOString(),
    });
    setUser({ ...cred.user, displayName: name.trim() });
    return cred;
  };

  const login        = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout       = ()                => signOut(auth);
  const resetPassword = (email)          => sendPasswordResetEmail(auth, email);

  const isAluno     = userRole === 'aluno';
  const isProfessor = userRole === 'professor';
  const isAdmin     = userRole === 'admin';
  const canManageWOD      = isProfessor || isAdmin;
  const canManageCheckins = isProfessor || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, userRole, loading,
      register, login, logout, resetPassword,
      isAluno, isProfessor, isAdmin,
      canManageWOD, canManageCheckins,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
