import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppState } from '../context/AppStateContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddFoodScreen } from '../screens/AddFoodScreen';
import { CameraScreen } from '../screens/CameraScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Diario: 'restaurant',
  Ejercicio: 'barbell',
  Agua: 'water',
  Perfil: 'person',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof TabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Hoy' }} />
      <Tab.Screen name="Diario" component={DiaryScreen} options={{ title: 'Diario' }} />
      <Tab.Screen name="Ejercicio" component={ExerciseScreen} options={{ title: 'Ejercicio' }} />
      <Tab.Screen name="Agua" component={WaterScreen} options={{ title: 'Agua' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { profile, loading } = useAppState();

  // Mientras se consulta el perfil guardado no sabemos si corresponde el
  // onboarding o las tabs: sin esto, el onboarding aparecería un instante
  // aunque el usuario ya lo tenga completo.
  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!profile ? (
        <OnboardingScreen />
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddFood"
            component={AddFoodScreen}
            options={{ presentation: 'modal', title: 'Agregar comida' }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
