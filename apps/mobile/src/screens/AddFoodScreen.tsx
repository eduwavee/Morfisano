import React, { useState } from 'react';
import {
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';
import type { MealType } from '../types';

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Merienda / Snack' },
];

export function AddFoodScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AddFood'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddFood'>>();
  const { addFood } = useAppState();

  const prefill = route.params?.prefill;

  const [mealType, setMealType] = useState<MealType>(route.params?.mealType ?? 'snack');
  const [name, setName] = useState(prefill?.name ?? '');
  const [quantityLabel, setQuantityLabel] = useState(prefill?.quantityLabel ?? '1 porción');
  const [calories, setCalories] = useState(prefill ? String(Math.round(prefill.calories)) : '');
  const [proteinG, setProteinG] = useState(prefill ? String(Math.round(prefill.proteinG)) : '');
  const [carbsG, setCarbsG] = useState(prefill ? String(Math.round(prefill.carbsG)) : '');
  const [fatG, setFatG] = useState(prefill ? String(Math.round(prefill.fatG)) : '');

  const canSubmit = name.trim().length > 0 && calories.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    await addFood({
      name: name.trim(),
      mealType,
      quantityLabel,
      calories: Number(calories) || 0,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
      source: prefill ? 'photo' : 'manual',
    });
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() => navigation.navigate('Camera', { mealType })}
        >
          <Ionicons name="camera" size={20} color={colors.white} />
          <Text style={styles.photoButtonText}>Sacar foto y analizar</Text>
        </TouchableOpacity>

        {prefill && (
          <View style={styles.photoBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primaryDark} />
            <Text style={styles.photoBadgeText}>Valores estimados por foto, podés ajustarlos</Text>
          </View>
        )}

        <Text style={styles.label}>Comida</Text>
        <View style={styles.segmentedRow}>
          {MEAL_OPTIONS.map((opt) => {
            const selected = opt.value === mealType;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.segment, selected && styles.segmentSelected]}
                onPress={() => setMealType(opt.value)}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Nombre del alimento</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Milanesa con puré" />

        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          style={styles.input}
          value={quantityLabel}
          onChangeText={setQuantityLabel}
          placeholder="Ej: 1 plato, 200 g"
        />

        <View style={styles.row}>
          <Field label="Calorías" value={calories} onChange={setCalories} style={styles.flex1} />
          <Field label="Proteína (g)" value={proteinG} onChange={setProteinG} style={styles.flex1} />
        </View>
        <View style={styles.row}>
          <Field label="Carbohidratos (g)" value={carbsG} onChange={setCarbsG} style={styles.flex1} />
          <Field label="Grasas (g)" value={fatG} onChange={setFatG} style={styles.flex1} />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  style,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  style?: object;
}) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" placeholder="0" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  photoButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  photoBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  photoBadgeText: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 },
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
  row: { flexDirection: 'row', gap: 10 },
  segmentedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: 12, color: colors.text, fontWeight: '600' },
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
