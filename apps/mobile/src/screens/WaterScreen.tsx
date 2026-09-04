import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';

const QUICK_AMOUNTS = [200, 330, 500];

export function WaterScreen() {
  const { goals, water, addWater } = useAppState();

  if (!goals) return null;

  const totalMl = water.reduce((sum, w) => sum + w.amountMl, 0);
  const glasses = Math.round(totalMl / 250);
  const targetGlasses = Math.round(goals.waterMl / 250);

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Ionicons name="water" size={36} color={colors.accentWater} />
        <Text style={styles.summaryValue}>{(totalMl / 1000).toFixed(2)} L</Text>
        <Text style={styles.summaryLabel}>de {(goals.waterMl / 1000).toFixed(1)} L recomendados hoy</Text>

        <View style={styles.progressWrap}>
          <ProgressBar label="Progreso" current={totalMl} target={goals.waterMl} unit="ml" color={colors.accentWater} />
        </View>

        <Text style={styles.glassesText}>
          {glasses} / {targetGlasses} vasos (250 ml)
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Agregar rápido</Text>
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((amount) => (
          <TouchableOpacity key={amount} style={styles.quickButton} onPress={() => addWater(amount)}>
            <Ionicons name="water-outline" size={20} color={colors.accentWater} />
            <Text style={styles.quickButtonText}>{amount} ml</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  summaryCard: { alignItems: 'center', paddingVertical: 30, marginBottom: 24 },
  summaryValue: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 10 },
  summaryLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  progressWrap: { width: '100%', marginTop: 4 },
  glassesText: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 18,
  },
  quickButtonText: { fontSize: 13, fontWeight: '700', color: colors.text },
});
