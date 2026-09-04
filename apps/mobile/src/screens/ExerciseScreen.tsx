import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';

const QUICK_ACTIVITIES = [
  { name: 'Caminata', caloriesPerMin: 4 },
  { name: 'Trote / running', caloriesPerMin: 10 },
  { name: 'Musculación', caloriesPerMin: 6 },
  { name: 'Fútbol', caloriesPerMin: 9 },
  { name: 'Bici', caloriesPerMin: 7 },
];

export function ExerciseScreen() {
  const { exercises, addExercise } = useAppState();
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(QUICK_ACTIVITIES[0]);
  const [duration, setDuration] = useState('30');

  const totalBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);

  async function handleAdd() {
    const minutes = Number(duration) || 0;
    await addExercise({
      name: selected.name,
      durationMin: minutes,
      caloriesBurned: Math.round(minutes * selected.caloriesPerMin),
    });
    setModalVisible(false);
    setDuration('30');
  }

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Calorías quemadas hoy</Text>
        <Text style={styles.summaryValue}>{totalBurned} kcal</Text>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actividades</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={exercises}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Todavía no cargaste ejercicio hoy.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.durationMin} min</Text>
            </View>
            <Text style={styles.itemCalories}>-{item.caloriesBurned} kcal</Text>
          </Card>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar actividad</Text>

            <View style={styles.chipsRow}>
              {QUICK_ACTIVITIES.map((act) => {
                const isSelected = act.name === selected.name;
                return (
                  <TouchableOpacity
                    key={act.name}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelected(act)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{act.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Duración (minutos)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />

            <Text style={styles.estimate}>
              ≈ {Math.round((Number(duration) || 0) * selected.caloriesPerMin)} kcal quemadas
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  flex1: { flex: 1 },
  summaryCard: { marginBottom: 20, alignItems: 'center', paddingVertical: 24 },
  summaryLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 32, fontWeight: '800', color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  list: { paddingBottom: 40 },
  emptyCard: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemCalories: { fontSize: 14, fontWeight: '700', color: colors.accentFat },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  chipTextSelected: { color: colors.white },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  estimate: { fontSize: 13, color: colors.textMuted, marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: colors.background },
  cancelButtonText: { fontWeight: '700', color: colors.text },
  saveButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, backgroundColor: colors.primary },
  saveButtonText: { fontWeight: '700', color: colors.white },
});
