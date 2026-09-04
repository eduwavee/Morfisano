type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -0.2,
  maintain: 0,
  gain: 0.15,
};

export interface DailyGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}

/** Tasa Metabólica Basal (Mifflin-St Jeor) */
export function calculateBMR(params: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateDailyGoals(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): DailyGoals {
  const bmr = calculateBMR(params);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[params.activityLevel];
  const calories = Math.round(tdee * (1 + GOAL_ADJUSTMENT[params.goal]));

  const proteinPerKg = params.goal === 'lose' ? 2.2 : 1.8;
  const proteinG = Math.round(params.weightKg * proteinPerKg);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const waterMl = Math.round(params.weightKg * 35);

  return { calories, proteinG, carbsG, fatG, waterMl };
}
