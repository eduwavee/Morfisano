import type {
  BarcodeProduct,
  ExerciseEntry,
  FoodEntry,
  PhotoAnalysisResult,
  ProfileResponse,
  UserProfile,
  WaterEntry,
} from '../types';
import { supabase } from '../lib/supabase';

// Apuntá esto a tu backend (Railway/Render) una vez desplegado.
// En desarrollo local con Expo Go, usá la IP de tu máquina en la red, no "localhost".
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** La API devuelve los errores como `{ error: "mensaje" }`; saca ese mensaje para mostrarlo tal cual. */
function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // el body no era JSON, se usa crudo
  }
  return body;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // getSession() devuelve la sesión guardada y la refresca sola si el access
  // token está vencido, así que alcanza con pedirla antes de cada request.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, extractErrorMessage(body) || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  profile: {
    // Devuelve el perfil guardado y sus metas diarias. Tira ApiError 404 si el
    // usuario todavía no completó el onboarding.
    get: () => request<ProfileResponse>('/api/profile'),
    save: (profile: Omit<UserProfile, 'id'>) =>
      request<ProfileResponse>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  },
  foods: {
    list: (date: string) => request<FoodEntry[]>(`/api/foods?date=${date}`),
    create: (entry: Omit<FoodEntry, 'id'>) =>
      request<FoodEntry>('/api/foods', { method: 'POST', body: JSON.stringify(entry) }),
    remove: (id: string) => request<void>(`/api/foods/${id}`, { method: 'DELETE' }),
  },
  exercises: {
    list: (date: string) => request<ExerciseEntry[]>(`/api/exercises?date=${date}`),
    create: (entry: Omit<ExerciseEntry, 'id'>) =>
      request<ExerciseEntry>('/api/exercises', { method: 'POST', body: JSON.stringify(entry) }),
    remove: (id: string) => request<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
  },
  water: {
    list: (date: string) => request<WaterEntry[]>(`/api/water?date=${date}`),
    create: (entry: Omit<WaterEntry, 'id'>) =>
      request<WaterEntry>('/api/water', { method: 'POST', body: JSON.stringify(entry) }),
    remove: (id: string) => request<void>(`/api/water/${id}`, { method: 'DELETE' }),
  },
  photo: {
    // Le manda la foto (base64) al backend, que la analiza con un modelo de visión
    // y cruza los ingredientes detectados contra la base de datos nutricional.
    analyze: (imageBase64: string) =>
      request<PhotoAnalysisResult>('/api/analyze-photo', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      }),
  },
  barcode: {
    // Resuelve un EAN/UPC contra Open Food Facts. Tira ApiError 404 si el
    // producto no está en la base.
    lookup: (code: string) => request<BarcodeProduct>(`/api/barcode/${encodeURIComponent(code)}`),
  },
};
