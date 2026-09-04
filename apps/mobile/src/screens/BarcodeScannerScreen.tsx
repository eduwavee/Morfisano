import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import type { RootStackParamList } from '../navigation/types';

// Formatos que traen los productos envasados. Dejamos afuera QR y compañía para
// que la cámara no dispare con cualquier cosa que aparezca en el encuadre.
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export function BarcodeScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'BarcodeScanner'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BarcodeScanner'>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La cámara dispara onBarcodeScanned muchas veces por segundo mientras el
  // código esté en cuadro. Este ref corta las repeticiones sin esperar a que
  // el estado se re-renderice, que llegaría tarde.
  const handledRef = useRef(false);

  const handleScan = useCallback(
    async (result: BarcodeScanningResult) => {
      if (handledRef.current) return;
      handledRef.current = true;

      setError(null);
      setLooking(true);
      try {
        const product = await api.barcode.lookup(result.data);

        // Si el producto declara una porción usamos esa; si no, 100 g, que es
        // como vienen normalizados los valores de Open Food Facts.
        const grams = product.servingSizeG ?? 100;
        const factor = grams / 100;

        navigation.replace('AddFood', {
          mealType: route.params?.mealType,
          prefill: {
            name: product.name,
            brand: product.brand ?? undefined,
            quantityLabel: `${grams} g`,
            calories: Math.round(product.per100g.calories * factor),
            proteinG: Math.round(product.per100g.proteinG * factor),
            carbsG: Math.round(product.per100g.carbsG * factor),
            fatG: Math.round(product.per100g.fatG * factor),
            source: 'barcode',
            per100g: product.per100g,
          },
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setError('Ese producto no está en Open Food Facts. Podés cargarlo a mano.');
        } else if (e instanceof ApiError && e.status === 401) {
          setError('Tu sesión venció. Volvé a entrar.');
        } else {
          setError('No pudimos consultar el producto. Revisá la conexión o cargalo a mano.');
        }
        setLooking(false);
        // Habilitamos otro intento: puede ser un código mal leído.
        handledRef.current = false;
      }
    },
    [navigation, route.params?.mealType]
  );

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="barcode-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permissionText}>
          Necesitamos permiso de cámara para escanear el código de barras.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Dar permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textButton} onPress={() => navigation.goBack()}>
          <Text style={styles.textButtonLabel}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={looking ? undefined : handleScan}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.reticleWrap} pointerEvents="none">
          <View style={styles.reticle} />
          <Text style={styles.hint}>
            {looking ? 'Buscando el producto…' : 'Apuntá al código de barras del envase'}
          </Text>
          {looking && <ActivityIndicator color={colors.white} style={styles.spinner} />}
        </View>

        <View style={styles.footer}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() =>
              navigation.replace('AddFood', { mealType: route.params?.mealType })
            }
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.manualButtonText}>Cargar a mano</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  permissionText: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permissionButtonText: { color: colors.white, fontWeight: '700' },
  textButton: { paddingVertical: 10 },
  textButtonLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: { paddingTop: 50, paddingHorizontal: 20 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleWrap: { alignItems: 'center', gap: 16 },
  reticle: {
    width: '75%',
    height: 150,
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  spinner: { marginTop: 4 },
  footer: { paddingBottom: 40, paddingHorizontal: 20, gap: 12 },
  errorBanner: { backgroundColor: 'rgba(220,38,38,0.92)', padding: 12, borderRadius: 10 },
  errorText: { color: colors.white, fontSize: 12, textAlign: 'center' },
  manualButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  manualButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
