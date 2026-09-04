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
import type { MacroBreakdown, MealType } from '../types';

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Merienda / Snack' },
];

/** Escala los valores por 100 g a la cantidad que cargó el usuario. */
function scaleFrom100g(per100g: MacroBreakdown, grams: number): MacroBreakdown {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    proteinG: Math.round(per100g.proteinG * factor),
    carbsG: Math.round(per100g.carbsG * factor),
    fatG: Math.round(per100g.fatG * factor),
  };
}

export function AddFoodScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AddFood'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddFood'>>();
  const { addFood } = useAppState();

  const prefill = route.params?.prefill;
  const per100g = prefill?.per100g;

  const [mealType, setMealType] = useState<MealType>(route.params?.mealType ?? 'snack');
  const [name, setName] = useState(prefill?.name ?? '');
  const [quantityLabel, setQuantityLabel] = useState(prefill?.quantityLabel ?? '1 porción');
  const [calories, setCalories] = useState(prefill ? String(Math.round(prefill.calories)) : '');
  const [proteinG, setProteinG] = useState(prefill ? String(Math.round(prefill.proteinG)) : '');
  const [carbsG, setCarbsG] = useState(prefill ? String(Math.round(prefill.carbsG)) : '');
  const [fatG, setFatG] = useState(prefill ? String(Math.round(prefill.fatG)) : '');

  // Solo para productos de código de barras, donde conocemos los valores por 100 g
  // y podemos recalcular todo cuando cambia la cantidad.
  const [grams, setGrams] = useState(() => {
    if (!per100g) return '';
    const parsed = parseInt(prefill?.quantityLabel ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '100';
  });

  const canSubmit = name.trim().length > 0 && calories.trim().length > 0;

  function handleGramsChange(next: string) {
    setGrams(next);
    if (!per100g) return;

    const value = Number(next);
    if (!Number.isFinite(value) || value <= 0) return;

    const scaled = scaleFrom100g(per100g, value);
    setCalories(String(scaled.calories));
    setProteinG(String(scaled.proteinG));
    setCarbsG(String(scaled.carbsG));
    setFatG(String(scaled.fatG));
    setQuantityLabel(`${value} g`);
  }

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
      source: prefill?.source ?? 'manual',
    });
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.sourceRow}>
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => navigation.navigate('Camera', { mealType })}
          >
            <Ionicons name="camera" size={20} color={colors.white} />
            <Text style={styles.sourceButtonText}>Sacar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => navigation.navigate('BarcodeScanner', { mealType })}
          >
            <Ionicons name="barcode-outline" size={20} color={colors.white} />
            <Text style={styles.sourceButtonText}>Escanear código</Text>
          </TouchableOpacity>
        </View>

        {prefill?.source === 'photo' && (
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color={colors.primaryDark} />
            <Text style={styles.badgeText}>Valores estimados por foto, podés ajustarlos</Text>
          </View>
        )}

        {prefill?.source === 'barcode' && (
          <View style={styles.badge}>
            <Ionicons name="barcode-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.badgeText}>
              {prefill.brand ? `${prefill.brand} · ` : ''}Datos de Open Food Facts
            </Text>
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

        {per100g ? (
          <>
            <Text style={styles.label}>Cantidad (g)</Text>
            <TextInput
              style={styles.input}
              value={grams}
              onChangeText={handleGramsChange}
              keyboardType="numeric"
              placeholder="100"
            />
            <Text style={styles.helper}>
              Cada 100 g: {per100g.calories} kcal · {per100g.proteinG}P / {per100g.carbsG}C /{' '}
              {per100g.fatG}G
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Cantidad</Text>
            <TextInput
              style={styles.input}
              value={quantityLabel}
              onChangeText={setQuantityLabel}
              placeholder="Ej: 1 plato, 200 g"
            />
          </>
        )}

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
  sourceRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  badge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  badgeText: { flex: 1, fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 },
  helper: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
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
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
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
