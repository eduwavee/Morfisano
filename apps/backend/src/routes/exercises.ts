import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { dayRange, parseDateParam } from '../utils/dateRange';
import { asyncHandler } from '../utils/asyncHandler';

export const exercisesRouter = Router();

exercisesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const date = parseDateParam(req.query.date);
    if (!date) return res.status(400).json({ error: 'Query param "date" (YYYY-MM-DD) es requerido' });

    const { start, end } = dayRange(date);
    const entries = await prisma.exerciseEntry.findMany({
      where: { userId: req.userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'desc' },
    });
    res.json(entries);
  })
);

exercisesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, durationMin, caloriesBurned, loggedAt } = req.body;

    if (!name || durationMin == null || caloriesBurned == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos: name, durationMin, caloriesBurned' });
    }

    const entry = await prisma.exerciseEntry.create({
      data: {
        userId: req.userId,
        name,
        durationMin,
        caloriesBurned,
        loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      },
    });
    res.status(201).json(entry);
  })
);

exercisesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.exerciseEntry.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.status(204).end();
  })
);
