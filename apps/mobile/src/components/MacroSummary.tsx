import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ProgressBar } from './ProgressBar';
import type { DailyGoals, MacroBreakdown } from '../types';

interface Props {
  goals: DailyGoals;
  consumed: MacroBreakdown;
}

export function MacroSummary({ goals, consumed }: Props) {
  const remaining = Math.max(0, goals.calories - consumed.calories);

  return (
    <View>
      <View style={styles.calorieRow}>
        <View>
          <Text style={styles.calorieValue}>{Math.round(remaining)}</Text>
          <Text style={styles.calorieLabel}>kcal restantes</Text>
        </View>
        <View style={styles.calorieMeta}>
          <Text style={styles.calorieMetaText}>Meta: {goals.calories} kcal</Text>
          <Text style={styles.calorieMetaText}>Consumidas: {Math.round(consumed.calories)} kcal</Text>
        </View>
      </View>

      <ProgressBar
        label="Proteína"
        current={consumed.proteinG}
        target={goals.proteinG}
        unit="g"
        color={colors.accentProtein}
      />
      <ProgressBar
        label="Carbohidratos"
        current={consumed.carbsG}
        target={goals.carbsG}
        unit="g"
        color={colors.accentCarbs}
      />
      <ProgressBar
        label="Grasas"
        current={consumed.fatG}
        target={goals.fatG}
        unit="g"
        color={colors.accentFat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  calorieValue: { fontSize: 36, fontWeight: '800', color: colors.text },
  calorieLabel: { fontSize: 13, color: colors.textMuted },
  calorieMeta: { alignItems: 'flex-end' },
  calorieMetaText: { fontSize: 12, color: colors.textMuted },
});
