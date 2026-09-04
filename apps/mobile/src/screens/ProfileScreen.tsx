import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Actividad ligera',
  moderate: 'Actividad moderada',
  active: 'Activo',
  very_active: 'Muy activo',
};

const GOAL_LABELS: Record<string, string> = {
  lose: 'Bajar de peso',
  maintain: 'Mantener',
  gain: 'Ganar masa muscular',
};

export function ProfileScreen() {
  const { profile, goals } = useAppState();
  const { session, signOut } = useAuth();

  if (!profile || !goals) return null;

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        {session?.user.email && <Text style={styles.email}>{session.user.email}</Text>}
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Datos personales</Text>
        <Row label="Edad" value={`${profile.age} años`} />
        <Row label="Altura" value={`${profile.heightCm} cm`} />
        <Row label="Peso" value={`${profile.weightKg} kg`} />
        <Row label="Actividad" value={ACTIVITY_LABELS[profile.activityLevel]} />
        <Row label="Objetivo" value={GOAL_LABELS[profile.goal]} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Metas diarias</Text>
        <Row label="Calorías" value={`${goals.calories} kcal`} />
        <Row label="Proteína" value={`${goals.proteinG} g`} />
        <Row label="Carbohidratos" value={`${goals.carbsG} g`} />
        <Row label="Grasas" value={`${goals.fatG} g`} />
        <Row label="Agua" value={`${(goals.waterMl / 1000).toFixed(1)} L`} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.premiumRow}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>NutriApp Premium</Text>
            <Text style={styles.premiumText}>
              Fotos ilimitadas, planes de comida personalizados y reportes en PDF.
            </Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.white },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  signOutButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: colors.danger },
  card: { marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  premiumRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  premiumText: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
