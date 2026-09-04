export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Lo setea el backend; queda opcional para el perfil recién armado en el cliente. */
  isPremium?: boolean;
}

/** Respuesta de GET/PUT /api/profile: el perfil persistido más sus metas calculadas. */
export interface ProfileResponse {
  profile: UserProfile;
  goals: DailyGoals;
}

export interface DailyGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}

export interface MacroBreakdown {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry extends MacroBreakdown {
  id: string;
  name: string;
  mealType: MealType;
  quantityLabel: string;
  loggedAt: string;
  source: 'manual' | 'photo' | 'barcode';
  photoUri?: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  durationMin: number;
  caloriesBurned: number;
  loggedAt: string;
}

export interface WaterEntry {
  id: string;
  amountMl: number;
  loggedAt: string;
}

export interface PhotoAnalysisResult {
  detectedItems: { name: string; confidence: number }[];
  estimated: MacroBreakdown;
}
