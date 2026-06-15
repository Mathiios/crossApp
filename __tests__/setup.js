/**
 * Setup global de testes — mocks para Firebase, AsyncStorage e React Navigation.
 */

// ── Mock AsyncStorage ──
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// ── Mock Firebase Auth ──
const mockUser = {
  uid: 'test-uid-123',
  email: 'test@email.com',
  displayName: 'Test User',
};

const mockAuthStateCallback = jest.fn();

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  browserLocalPersistence: {},
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { ...mockUser } })
  ),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { ...mockUser } })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    mockAuthStateCallback.mockImplementation(callback);
    return jest.fn(); // unsubscribe
  }),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
}));

// ── Mock Firebase Firestore ──
const mockDocData = {};

jest.mock('firebase/firestore', () => {
  const snapshotCallbacks = {};
  return {
    initializeFirestore: jest.fn(() => ({})),
    getFirestore: jest.fn(() => ({})),
    memoryLocalCache: jest.fn(() => ({})),
    persistentLocalCache: jest.fn(() => ({})),
    persistentMultipleTabManager: jest.fn(() => ({})),
    doc: jest.fn((db, collection, id) => ({ _collection: collection, _id: id })),
    collection: jest.fn((db, name) => ({ _name: name })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    getDoc: jest.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({ role: 'aluno', status: 'active', name: 'Test User', email: 'test@email.com' }),
      })
    ),
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: [],
      })
    ),
    onSnapshot: jest.fn((ref, onNext, onError) => {
      const key = `${ref._collection}/${ref._id}`;
      snapshotCallbacks[key] = { onNext, onError };
      // Simula um snapshot vazio por padrão
      if (onNext) {
        setTimeout(() => {
          onNext({
            exists: () => false,
            data: () => null,
          });
        }, 0);
      }
      return jest.fn(); // unsubscribe
    }),
    arrayUnion: jest.fn((...items) => ({ _type: 'arrayUnion', items })),
    arrayRemove: jest.fn((...items) => ({ _type: 'arrayRemove', items })),
    _snapshotCallbacks: snapshotCallbacks,
  };
});

// ── Mock Firebase Functions ──
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() =>
    jest.fn(() => Promise.resolve({ data: { success: true, authDeleted: true } }))
  ),
}));

// ── Mock Firebase App ──
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

// ── Mock React Navigation ──
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }) => children,
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// ── Silenciar console.warn e console.error em testes ──
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // Filtrar warnings conhecidos do React Native
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('act(') || args[0].includes('NativeModule'))
  ) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('act(') || args[0].includes('Warning:'))
  ) {
    return;
  }
  originalError(...args);
};

// Exportar mocks para uso nos testes
module.exports = { mockUser, mockNavigation, mockAuthStateCallback };

