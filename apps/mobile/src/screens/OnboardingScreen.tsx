import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import type { ActivityLevel, Goal, Sex } from '../types';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'light', label: 'Actividad ligera' },
  { value: 'moderate', label: 'Actividad moderada' },
  { value: 'active', label: 'Activo' },
  { value: 'very_active', label: 'Muy activo' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Bajar de peso' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain', label: 'Ganar masa muscular' },
];

export function OnboardingScreen() {
  const { completeOnboarding } = useAppState();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [saving, setSaving] = useState(false);

  const canSubmit = Boolean(name && age && heightCm && weightKg) && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        sex,
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        goal,
      });
    } catch (err) {
      // El contexto solo propaga los 400: datos que el backend rechazó.
      Alert.alert('Revisá tus datos', err instanceof Error ? err.message : 'No pudimos guardar el perfil.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Contanos sobre vos</Text>
        <Text style={styles.subtitle}>
          Con esto calculamos tus calorías, macros y agua recomendada por día.
        </Text>

        <Field label="Nombre">
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tu nombre" />
        </Field>

        <Field label="Sexo biológico">
          <SegmentedControl
            options={[
              { value: 'male', label: 'Masculino' },
              { value: 'female', label: 'Femenino' },
            ]}
            value={sex}
            onChange={(v) => setSex(v as Sex)}
          />
        </Field>

        <View style={styles.row}>
          <Field label="Edad" style={styles.flex1}>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="años"
            />
          </Field>
          <Field label="Altura (cm)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="cm"
            />
          </Field>
          <Field label="Peso (kg)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              placeholder="kg"
            />
          </Field>
        </View>

        <Field label="Nivel de actividad">
          <SegmentedControl options={ACTIVITY_OPTIONS} value={activityLevel} onChange={(v) => setActivityLevel(v as ActivityLevel)} vertical />
        </Field>

        <Field label="Objetivo">
          <SegmentedControl options={GOAL_OPTIONS} value={goal} onChange={(v) => setGoal(v as Goal)} />
        </Field>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Calcular mis metas</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  vertical,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  vertical?: boolean;
}) {
  return (
    <View style={vertical ? styles.segmentedVertical : styles.segmentedRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, selected && styles.segmentSelected, vertical && styles.segmentFullWidth]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  segmentedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentedVertical: { gap: 8 },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentFullWidth: { width: '100%' },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'center' },
  segmentTextSelected: { color: colors.white },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
