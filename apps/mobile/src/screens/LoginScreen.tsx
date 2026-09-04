import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        // Con la sesión creada, el navigator cambia solo de pantalla.
      } else {
        const loggedIn = await signUp(email, password);
        if (!loggedIn) setConfirmSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal, probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmSent(false);
  }

  if (confirmSent) {
    return (
      <View style={styles.confirmWrap}>
        <View style={styles.confirmIcon}>
          <Ionicons name="mail-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Revisá tu mail</Text>
        <Text style={styles.confirmText}>
          Te mandamos un link a <Text style={styles.bold}>{email.trim()}</Text> para confirmar tu
          cuenta. Cuando lo abras, volvé acá e iniciá sesión.
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => switchMode('signin')}>
          <Text style={styles.linkText}>Ir a iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="restaurant" size={28} color={colors.white} />
          </View>
          <Text style={styles.brandName}>Morfisano</Text>
        </View>

        <Text style={styles.title}>
          {mode === 'signin' ? 'Bienvenido de vuelta' : 'Creá tu cuenta'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Entrá para seguir registrando tus comidas.'
            : 'Empezá a llevar tus calorías, macros y entrenamientos.'}
        </Text>

        <Text style={styles.label}>Mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="vos@mail.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
        />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          <Text style={styles.linkText}>
            {mode === 'signin' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingTop: 80, paddingBottom: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 22, fontWeight: '800', color: colors.text },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: '600' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  linkButton: { paddingVertical: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  confirmWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  bold: { fontWeight: '700', color: colors.text },
});
