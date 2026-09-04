import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { dayRange, parseDateParam } from '../utils/dateRange';
import { asyncHandler } from '../utils/asyncHandler';

export const waterRouter = Router();

waterRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const date = parseDateParam(req.query.date);
    if (!date) return res.status(400).json({ error: 'Query param "date" (YYYY-MM-DD) es requerido' });

    const { start, end } = dayRange(date);
    const entries = await prisma.waterEntry.findMany({
      where: { userId: req.userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: 'desc' },
    });
    res.json(entries);
  })
);

waterRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { amountMl, loggedAt } = req.body;

    if (!amountMl) {
      return res.status(400).json({ error: 'Falta el campo requerido: amountMl' });
    }

    const entry = await prisma.waterEntry.create({
      data: {
        userId: req.userId,
        amountMl,
        loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      },
    });
    res.status(201).json(entry);
  })
);

waterRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.waterEntry.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.status(204).end();
  })
);
