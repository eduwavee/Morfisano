import type { MacroBreakdown } from '../types';

export type TabParamList = {
  Dashboard: undefined;
  Diario: undefined;
  Ejercicio: undefined;
  Agua: undefined;
  Perfil: undefined;
};

export type MealTypeParam = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodPrefill {
  name: string;
  quantityLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'photo' | 'barcode';
  /**
   * Valores por 100 g, cuando la fuente los conoce (código de barras). Con esto
   * la pantalla de carga puede recalcular los macros al cambiar los gramos.
   */
  per100g?: MacroBreakdown;
  brand?: string;
}

export interface AddFoodParams {
  mealType?: MealTypeParam;
  prefill?: FoodPrefill;
}

export type RootStackParamList = {
  Tabs: undefined;
  AddFood: AddFoodParams | undefined;
  Camera: { mealType?: MealTypeParam } | undefined;
  BarcodeScanner: { mealType?: MealTypeParam } | undefined;
  AddExercise: undefined;
};
