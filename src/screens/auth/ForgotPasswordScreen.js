import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/inputValidation';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleReset = async () => {
    if (!email) {
      setError('Digite seu e-mail.');
      return;
    }

    // Validação de e-mail
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError('Nao foi possivel enviar o e-mail. Verifique o endereco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>@</Text>
            </View>
          </View>

          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            Digite seu e-mail e enviaremos as instrucoes para redefinir sua senha.
          </Text>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {sent ? (
            <View style={styles.successBox}>
              <View style={styles.successIconBox}>
                <Text style={styles.successIconText}>OK</Text>
              </View>
              <Text style={styles.successTitle}>E-mail Enviado!</Text>
              <Text style={styles.successText}>
                Verifique sua caixa de entrada e siga as instrucoes.
              </Text>
              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backToLoginText}>Voltar ao Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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

              <TouchableOpacity
                style={[styles.resetBtn, loading && styles.btnDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetBtnText}>ENVIAR E-MAIL</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backBtn: { marginBottom: 32 },
  backText: { color: '#CC0000', fontSize: 15, fontWeight: '600' },

  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCCCC',
  },
  iconText: { color: '#CC0000', fontSize: 28, fontWeight: '900' },

  title: { color: '#1A1A1A', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

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

  inputGroup: { marginBottom: 20 },
  label: { color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#1A1A1A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  resetBtn: {
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
  btnDisabled: { opacity: 0.6 },
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

  successBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C6F6D5',
  },
  successIconText: { color: '#22C55E', fontWeight: '900', fontSize: 16 },
  successTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  successText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  backToLoginBtn: { backgroundColor: '#CC0000', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  backToLoginText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
