import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppStateProvider } from './src/context/AppStateContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* AuthProvider va afuera: AppStateProvider necesita saber quién está
          logueado para traer (y limpiar) los datos de ese usuario. */}
      <AuthProvider>
        <AppStateProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AppStateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
