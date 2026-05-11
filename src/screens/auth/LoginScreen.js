import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') setError('Usuário não encontrado.');
      else if (code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (code === 'auth/invalid-credential') setError('E-mail ou senha incorretos.');
      else if (code === 'auth/too-many-requests') setError('Muitas tentativas. Tente mais tarde.');
      else setError(`Erro: ${code || err?.message || 'desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoX}>✕</Text>
            </View>
            <Text style={styles.appName}>crossApp</Text>
            <Text style={styles.tagline}>Seu Box de CrossFit no Bolso</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabs}>
              <View style={[styles.tab, styles.activeTab]}>
                <Text style={[styles.tabText, styles.activeTabText]}>Entrar</Text>
              </View>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.tabText}>Cadastrar</Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#BBBBBB"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#BBBBBB"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'ocultar' : 'ver'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Esqueceu a senha */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>ENTRAR</Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Logins opcionais</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.socialBtnText}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, styles.socialBtnFb]}>
                <Text style={[styles.socialBtnText, { color: '#fff' }]}>f</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoX: { color: '#fff', fontSize: 38, fontWeight: '900' },
  appName: { color: '#1A1A1A', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { color: '#888', fontSize: 13, marginTop: 4, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  activeTab: { backgroundColor: '#CC0000' },
  tabText: { color: '#999', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: '#fff' },

  // Error
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: { color: '#CC0000', fontSize: 13, fontWeight: '600' },

  // Inputs
  inputGroup: { marginBottom: 14 },
  label: { color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#1A1A1A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  eyeText: { fontSize: 12, color: '#999', fontWeight: '600' },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotText: { color: '#CC0000', fontSize: 13, fontWeight: '600' },

  // Login button
  loginBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EBEBEB' },
  dividerText: { color: '#BBBBBB', fontSize: 12, marginHorizontal: 10, fontWeight: '500' },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialBtnFb: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  socialBtnText: { fontSize: 18, fontWeight: '800', color: '#555' },
});
