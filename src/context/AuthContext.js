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
import { validateEmail, validatePassword, validateName, sanitizeText } from '../utils/inputValidation';

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
    // Validação de inputs
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) throw new Error(emailCheck.error);

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) throw new Error(passwordCheck.error);

    const nameCheck = validateName(name);
    if (!nameCheck.valid) throw new Error(nameCheck.error);

    // Sanitização
    const safeName = sanitizeText(name.trim());
    const safeEmail = email.trim().toLowerCase();

    const cred = await createUserWithEmailAndPassword(auth, safeEmail, password);
    await updateProfile(cred.user, { displayName: safeName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name:      safeName,
      email:     safeEmail,
      role:      'aluno',
      status:    'active',
      createdAt: new Date().toISOString(),
    });
    setUser({ ...cred.user, displayName: safeName });
    return cred;
  };

  const login = (email, password) => {
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return Promise.reject({ code: 'auth/invalid-email', message: emailCheck.error });
    return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  };

  const logout       = ()                => signOut(auth);
  const resetPassword = (email)          => sendPasswordResetEmail(auth, email.trim().toLowerCase());

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
