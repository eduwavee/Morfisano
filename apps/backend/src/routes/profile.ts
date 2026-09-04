import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { calculateDailyGoals } from '../utils/nutrition';
import { asyncHandler } from '../utils/asyncHandler';

export const profileRouter = Router();

const SEXES = ['male', 'female'] as const;
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
const GOALS = ['lose', 'maintain', 'gain'] as const;

type Sex = (typeof SEXES)[number];
type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
type Goal = (typeof GOALS)[number];

interface ProfileInput {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

/**
 * Valida el body del perfil antes de tocar Prisma. Sin esto, un enum inválido
 * (por ejemplo `sex: "otro"`) revienta con un error de Prisma en vez de un 400.
 */
function parseProfileInput(body: unknown): { data: ProfileInput } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' };
  const b = body as Record<string, unknown>;

  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) return { error: 'El nombre es requerido' };

  if (!SEXES.includes(b.sex as Sex)) {
    return { error: `"sex" debe ser uno de: ${SEXES.join(', ')}` };
  }
  if (!ACTIVITY_LEVELS.includes(b.activityLevel as ActivityLevel)) {
    return { error: `"activityLevel" debe ser uno de: ${ACTIVITY_LEVELS.join(', ')}` };
  }
  if (!GOALS.includes(b.goal as Goal)) {
    return { error: `"goal" debe ser uno de: ${GOALS.join(', ')}` };
  }

  const numbers: { key: 'age' | 'heightCm' | 'weightKg'; min: number; max: number; label: string }[] = [
    { key: 'age', min: 13, max: 120, label: 'La edad' },
    { key: 'heightCm', min: 80, max: 250, label: 'La altura' },
    { key: 'weightKg', min: 25, max: 400, label: 'El peso' },
  ];

  const parsed: Record<string, number> = {};
  for (const { key, min, max, label } of numbers) {
    const value = Number(b[key]);
    if (!Number.isFinite(value) || value < min || value > max) {
      return { error: `${label} tiene que ser un número entre ${min} y ${max}` };
    }
    parsed[key] = value;
  }

  return {
    data: {
      name,
      sex: b.sex as Sex,
      activityLevel: b.activityLevel as ActivityLevel,
      goal: b.goal as Goal,
      age: Math.round(parsed.age),
      heightCm: parsed.heightCm,
      weightKg: parsed.weightKg,
    },
  };
}

profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Perfil no encontrado, completá el onboarding primero' });
    }

    res.json({ profile: user, goals: calculateDailyGoals(user) });
  })
);

profileRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = parseProfileInput(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });

    // El email sale del token de Supabase, no del body: es el usuario quien lo
    // verificó al registrarse, y no queremos que el cliente pueda mandar otro.
    const email = req.userEmail ? { email: req.userEmail } : {};

    const user = await prisma.user.upsert({
      where: { id: req.userId },
      update: { ...parsed.data, ...email },
      create: { id: req.userId, ...parsed.data, ...email },
    });

    // El peso del perfil es también un punto del historial, así el gráfico de
    // evolución arranca con un dato desde el onboarding. Solo se registra si
    // cambió respecto del último, para no llenar la tabla al editar el perfil.
    const lastLog = await prisma.weightLog.findFirst({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
    });
    if (lastLog?.weightKg !== parsed.data.weightKg) {
      await prisma.weightLog.create({
        data: { userId: user.id, weightKg: parsed.data.weightKg },
      });
    }

    res.json({ profile: user, goals: calculateDailyGoals(user) });
  })
);
