// El polyfill de URL tiene que cargarse antes que supabase-js: el runtime de
// React Native no trae una implementación completa y el cliente la necesita.
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_KEY. Revisá apps/mobile/.env ' +
      '(acordate de reiniciar Expo después de tocarlo).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // La sesión vive en AsyncStorage, así el usuario no vuelve a loguearse
    // cada vez que abre la app.
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // No hay OAuth por deep link todavía; en RN no hay URL que inspeccionar.
    detectSessionInUrl: false,
  },
});

// supabase-js refresca el token con un timer. Si la app queda en background el
// timer se frena y podés volver con un token vencido, así que lo atamos al
// ciclo de vida: refresca mientras la app está activa y para cuando no.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
