import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCQ_M_oBwqEOL7gz_c4tLpoqVCEiwR7Pes",
  authDomain: "crossapp-7accc.firebaseapp.com",
  projectId: "crossapp-7accc",
  storageBucket: "crossapp-7accc.firebasestorage.app",
  messagingSenderId: "35963886162",
  appId: "1:35963886162:web:63e532706e099f761f5d8b",
};

// Evita dupla inicialização no Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth: Web usa localStorage; nativo usa AsyncStorage para persistir login
let auth;
try {
  auth = initializeAuth(app, {
    persistence: Platform.OS === 'web'
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth já foi chamado (Fast Refresh)
  auth = getAuth(app);
}

// Firestore: usa memoryLocalCache para garantir dados sempre atualizados
// do servidor, sem interferência de cache offline
let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} catch {
  // initializeFirestore já foi chamado (Fast Refresh)
  db = getFirestore(app);
}

export const functions = getFunctions(app, 'us-central1');
export { auth, db };
export default app;
