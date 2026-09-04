import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { dayRange, parseDateParam } from '../utils/dateRange';
import { asyncHandler } from '../utils/asyncHandler';

export const foodsRouter = Router();

foodsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const date = parseDateParam(req.query.date);
    if (!date) return res.status(400).json({ error: 'Query param "date" (YYYY-MM-DD) es requerido' });

    const { start, end } = dayRange(date);
    const entries = await prisma.foodEntry.findMany({
      where: { userId: req.userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'desc' },
    });
    res.json(entries);
  })
);

foodsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, mealType, quantityLabel, calories, proteinG, carbsG, fatG, source, photoUrl, loggedAt } = req.body;

    if (!name || !mealType || calories == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos: name, mealType, calories' });
    }

    const entry = await prisma.foodEntry.create({
      data: {
        userId: req.userId,
        name,
        mealType,
        quantityLabel: quantityLabel ?? '',
        calories,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
        source: source ?? 'manual',
        photoUrl,
        loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      },
    });
    res.status(201).json(entry);
  })
);

foodsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.foodEntry.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.status(204).end();
  })
);
