import type { ActivityLevel, DailyGoals, Goal, Sex } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -0.2, // déficit del 20%
  maintain: 0,
  gain: 0.15, // superávit del 15%
};

/** Tasa Metabólica Basal (Mifflin-St Jeor) */
export function calculateBMR(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/** Calcula las metas diarias de calorías, macros y agua a partir del perfil del usuario */
export function calculateDailyGoals(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): DailyGoals {
  const bmr = calculateBMR(params);
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[params.goal]));

  // Reparto de macros: proteína en base al peso corporal, resto entre carbos y grasas
  const proteinPerKg = params.goal === 'lose' ? 2.2 : 1.8;
  const proteinG = Math.round(params.weightKg * proteinPerKg);
  const fatG = Math.round((calories * 0.25) / 9);
  const proteinCalories = proteinG * 4;
  const fatCalories = fatG * 9;
  const carbsG = Math.max(0, Math.round((calories - proteinCalories - fatCalories) / 4));

  // Recomendación de agua: ~35 ml por kg de peso corporal
  const waterMl = Math.round(params.weightKg * 35);

  return { calories, proteinG, carbsG, fatG, waterMl };
}

export function macroCaloriesFromGrams(proteinG: number, carbsG: number, fatG: number): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}
