import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { assertAuthConfig, requireUser } from './middleware/auth';
import { foodsRouter } from './routes/foods';
import { exercisesRouter } from './routes/exercises';
import { waterRouter } from './routes/water';
import { profileRouter } from './routes/profile';
import { analyzePhotoRouter } from './routes/analyzePhoto';
import { barcodeRouter } from './routes/barcode';

// Antes de escuchar: si no hay forma de autenticar, mejor no arrancar.
assertAuthConfig();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // fotos en base64 pesan más que un JSON típico

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(requireUser);
app.use('/api/foods', foodsRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/water', waterRouter);
app.use('/api/profile', profileRouter);
app.use('/api/analyze-photo', analyzePhotoRouter);
app.use('/api/barcode', barcodeRouter);

// Middleware de errores: recibe lo que los handlers async derivan vía asyncHandler.
// Va último, después de todas las rutas, y necesita los 4 parámetros para que
// Express lo reconozca como error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api] error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`NutriApp backend escuchando en http://localhost:${port}`);
});
