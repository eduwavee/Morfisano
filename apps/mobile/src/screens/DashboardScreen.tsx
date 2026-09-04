import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/Card';
import { MacroSummary } from '../components/MacroSummary';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';

export function DashboardScreen() {
  const { profile, goals, foods, exercises, water } = useAppState();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!goals) return null;

  const totalFoodCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const totalWater = water.reduce((sum, w) => sum + w.amountMl, 0);

  const consumed = {
    calories: Math.max(0, totalFoodCalories - totalBurned),
    proteinG: foods.reduce((sum, f) => sum + f.proteinG, 0),
    carbsG: foods.reduce((sum, f) => sum + f.carbsG, 0),
    fatG: foods.reduce((sum, f) => sum + f.fatG, 0),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola{profile ? `, ${profile.name}` : ''} 👋</Text>
      <Text style={styles.date}>
        {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <Card style={styles.card}>
        <MacroSummary goals={goals} consumed={consumed} />
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, styles.halfCard]}>
          <View style={styles.miniHeader}>
            <Ionicons name="water" size={18} color={colors.accentWater} />
            <Text style={styles.miniTitle}>Agua</Text>
          </View>
          <Text style={styles.miniValue}>
            {(totalWater / 1000).toFixed(1)} L
            <Text style={styles.miniTarget}> / {(goals.waterMl / 1000).toFixed(1)} L</Text>
          </Text>
        </Card>
        <Card style={[styles.card, styles.halfCard]}>
          <View style={styles.miniHeader}>
            <Ionicons name="flame" size={18} color={colors.accentFat} />
            <Text style={styles.miniTitle}>Quemadas</Text>
          </View>
          <Text style={styles.miniValue}>{totalBurned} kcal</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Comidas de hoy</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFood')}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {foods.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Todavía no registraste ninguna comida hoy.</Text>
        </Card>
      ) : (
        foods.map((food) => (
          <Card key={food.id} style={styles.foodRow}>
            <View style={styles.flex1}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodMeta}>
                {food.quantityLabel} · {food.mealType}
              </Text>
            </View>
            <Text style={styles.foodCalories}>{Math.round(food.calories)} kcal</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted, marginBottom: 16, textTransform: 'capitalize' },
  card: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfCard: { flex: 1, marginBottom: 0 },
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  miniTitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  miniValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  miniTarget: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyCard: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  foodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 12 },
  flex1: { flex: 1 },
  foodName: { fontSize: 15, fontWeight: '700', color: colors.text },
  foodMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  foodCalories: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
});
