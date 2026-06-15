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
import { validateEmail, validatePassword, validateName } from '../../utils/inputValidation';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    // Validação de nome
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      setError(nameCheck.error);
      return;
    }

    // Validação de e-mail
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    // Validação de senha forte
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.error);
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else if (code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (code === 'auth/weak-password') setError('Senha muito fraca.');
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
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Header do card */}
            <Text style={styles.cardTitle}>Cadastrar</Text>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nome Completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#BBBBBB"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

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
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#BBBBBB"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Repita a senha"
                placeholderTextColor="#BBBBBB"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* Botão Cadastrar */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerBtnText}>CADASTRAR</Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Já tem conta?{' '}
                <Text style={styles.loginLinkHighlight}>Entrar</Text>
              </Text>
            </TouchableOpacity>
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
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoX: { color: '#fff', fontSize: 34, fontWeight: '900' },
  appName: { color: '#1A1A1A', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },

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
  cardTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },

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

  // Register button
  registerBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

  // Link
  loginLink: { alignItems: 'center', marginTop: 18 },
  loginLinkText: { color: '#888', fontSize: 14 },
  loginLinkHighlight: { color: '#CC0000', fontWeight: '700' },
});
