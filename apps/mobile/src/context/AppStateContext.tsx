import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '../api/client';
import { calculateDailyGoals } from '../utils/nutrition';
import type {
  DailyGoals,
  ExerciseEntry,
  FoodEntry,
  UserProfile,
  WaterEntry,
} from '../types';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function localId(): string {
  return `local-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

interface AppState {
  profile: UserProfile | null;
  goals: DailyGoals | null;
  foods: FoodEntry[];
  exercises: ExerciseEntry[];
  water: WaterEntry[];
  loading: boolean;
  /** true cuando el backend no respondió y la app está laburando solo con estado local. */
  offline: boolean;
  completeOnboarding: (profile: Omit<UserProfile, 'id'>) => Promise<void>;
  addFood: (entry: Omit<FoodEntry, 'id' | 'loggedAt'>) => Promise<void>;
  addExercise: (entry: Omit<ExerciseEntry, 'id' | 'loggedAt'>) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
  removeFood: (id: string) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [water, setWater] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Al arrancar trae el perfil guardado (para saltear el onboarding si ya está
  // hecho) y lo cargado hoy. Si el backend no está desplegado o no hay conexión,
  // arranca con el día en blanco en modo local.
  useEffect(() => {
    const date = todayKey();

    async function bootstrap() {
      try {
        const saved = await api.profile.get();
        setProfile(saved.profile);
        setGoals(saved.goals);
      } catch (err) {
        // 404 = el usuario todavía no completó el onboarding: no es un error,
        // el navigator muestra la pantalla de onboarding. Cualquier otra cosa
        // (red caída, backend abajo) sí deja la app en modo local.
        if (!(err instanceof ApiError && err.status === 404)) {
          setOffline(true);
          console.warn('[NutriApp] Sin conexión con el backend, arrancando en modo local.');
          return;
        }
      }

      try {
        const [f, e, w] = await Promise.all([
          api.foods.list(date),
          api.exercises.list(date),
          api.water.list(date),
        ]);
        setFoods(f);
        setExercises(e);
        setWater(w);
      } catch {
        setOffline(true);
        console.warn('[NutriApp] No se pudo traer el día desde el backend.');
      }
    }

    bootstrap().finally(() => setLoading(false));
  }, []);

  // Persiste el perfil en el backend y usa las metas que devuelve. Si el backend
  // no responde, cae a las metas calculadas en el cliente para no trabar el
  // onboarding (mismo criterio que el resto de los registros).
  const completeOnboarding = useCallback(async (data: Omit<UserProfile, 'id'>) => {
    try {
      const saved = await api.profile.save(data);
      setProfile(saved.profile);
      setGoals(saved.goals);
      setOffline(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) throw err; // datos inválidos: lo muestra la pantalla
      setOffline(true);
      setProfile({ id: localId(), ...data });
      setGoals(calculateDailyGoals(data));
    }
  }, []);

  const addFood = useCallback(async (entry: Omit<FoodEntry, 'id' | 'loggedAt'>) => {
    const loggedAt = new Date().toISOString();
    const optimistic: FoodEntry = { ...entry, id: localId(), loggedAt };
    setFoods((prev) => [optimistic, ...prev]);
    try {
      const saved = await api.foods.create({ ...entry, loggedAt });
      setFoods((prev) => [saved, ...prev.filter((f) => f.id !== optimistic.id)]);
    } catch {
      // Se queda con la versión local; se puede sincronizar más adelante.
    }
  }, []);

  const addExercise = useCallback(async (entry: Omit<ExerciseEntry, 'id' | 'loggedAt'>) => {
    const loggedAt = new Date().toISOString();
    const optimistic: ExerciseEntry = { ...entry, id: localId(), loggedAt };
    setExercises((prev) => [optimistic, ...prev]);
    try {
      const saved = await api.exercises.create({ ...entry, loggedAt });
      setExercises((prev) => [saved, ...prev.filter((e) => e.id !== optimistic.id)]);
    } catch {
      // modo local
    }
  }, []);

  const addWater = useCallback(async (amountMl: number) => {
    const loggedAt = new Date().toISOString();
    const optimistic: WaterEntry = { id: localId(), amountMl, loggedAt };
    setWater((prev) => [optimistic, ...prev]);
    try {
      const saved = await api.water.create({ amountMl, loggedAt });
      setWater((prev) => [saved, ...prev.filter((w) => w.id !== optimistic.id)]);
    } catch {
      // modo local
    }
  }, []);

  const removeFood = useCallback(async (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
    try {
      await api.foods.remove(id);
    } catch {
      // ya se sacó de la UI, se ignora el error de red
    }
  }, []);

  const value = useMemo<AppState>(
    () => ({
      profile,
      goals,
      foods,
      exercises,
      water,
      loading,
      offline,
      completeOnboarding,
      addFood,
      addExercise,
      addWater,
      removeFood,
    }),
    [profile, goals, foods, exercises, water, loading, offline, completeOnboarding, addFood, addExercise, addWater, removeFood]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return ctx;
}
