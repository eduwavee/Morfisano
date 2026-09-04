import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export function ProgressBar({ label, current, target, unit, color }: Props) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(current)}
          <Text style={styles.unit}> / {Math.round(target)} {unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 13, color: colors.text, fontWeight: '700' },
  unit: { fontSize: 12, color: colors.textMuted, fontWeight: '400' },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 8 },
});
