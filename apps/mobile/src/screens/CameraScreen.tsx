import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';

export function CameraScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Camera'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Camera'>>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permissionText}>Necesitamos permiso de cámara para analizar tu comida.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || analyzing) return;
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (!photo?.base64) throw new Error('No se pudo capturar la foto');

      setAnalyzing(true);
      const result = await api.photo.analyze(photo.base64);
      const topItems = result.detectedItems.map((d) => d.name).join(', ');

      navigation.navigate('AddFood', {
        mealType: route.params?.mealType,
        prefill: {
          name: topItems || 'Comida analizada por foto',
          quantityLabel: '1 porción estimada',
          calories: result.estimated.calories,
          proteinG: result.estimated.proteinG,
          carbsG: result.estimated.carbsG,
          fatG: result.estimated.fatG,
          source: 'photo',
        },
      });
    } catch (e) {
      setError(
        'No pudimos analizar la foto (¿el backend de análisis está corriendo?). Podés cargar los valores a mano.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.flex} facing="back" />

      <View style={styles.overlay}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shutterButton} onPress={handleCapture} disabled={analyzing}>
            {analyzing ? <ActivityIndicator color={colors.white} /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>

          <View style={styles.closeButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  permissionText: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  permissionButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  permissionButtonText: { color: colors.white, fontWeight: '700' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40 },
  errorBanner: { backgroundColor: 'rgba(220,38,38,0.9)', margin: 16, padding: 12, borderRadius: 10 },
  errorText: { color: colors.white, fontSize: 12, textAlign: 'center' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white },
});
