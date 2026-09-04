export type TabParamList = {
  Dashboard: undefined;
  Diario: undefined;
  Ejercicio: undefined;
  Agua: undefined;
  Perfil: undefined;
};

export type MealTypeParam = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface AddFoodParams {
  mealType?: MealTypeParam;
  prefill?: {
    name: string;
    quantityLabel: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    source: 'photo';
  };
}

export type RootStackParamList = {
  Tabs: undefined;
  AddFood: AddFoodParams | undefined;
  Camera: { mealType?: MealTypeParam } | undefined;
  AddExercise: undefined;
};
