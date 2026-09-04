import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';
import type { FoodEntry, MealType } from '../types';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda / Snack',
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function DiaryScreen() {
  const { foods, removeFood } = useAppState();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const grouped = useMemo(() => {
    const map = new Map<MealType, FoodEntry[]>();
    MEAL_ORDER.forEach((m) => map.set(m, []));
    foods.forEach((f) => map.get(f.mealType)?.push(f));
    return map;
  }, [foods]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={MEAL_ORDER}
      keyExtractor={(m) => m}
      renderItem={({ item: mealType }) => {
        const items = grouped.get(mealType) ?? [];
        const totalCalories = items.reduce((sum, f) => sum + f.calories, 0);
        return (
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
              <View style={styles.mealHeaderRight}>
                <Text style={styles.mealCalories}>{Math.round(totalCalories)} kcal</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddFood', { mealType })}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>Sin registros</Text>
            ) : (
              items.map((food) => (
                <Card key={food.id} style={styles.foodCard}>
                  <View style={styles.flex1}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMeta}>
                      {food.quantityLabel} · {Math.round(food.calories)} kcal · P {Math.round(food.proteinG)}g · C{' '}
                      {Math.round(food.carbsG)}g · G {Math.round(food.fatG)}g
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFood(food.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  mealSection: { marginBottom: 22 },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  mealCalories: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  emptyText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  foodCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '700', color: colors.text },
  foodMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
