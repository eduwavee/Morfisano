import { Router } from 'express';
import { analyzeFoodPhoto } from '../services/visionAnalysis';

export const analyzePhotoRouter = Router();

analyzePhotoRouter.post('/', async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Falta el campo requerido: imageBase64' });
  }

  try {
    const result = await analyzeFoodPhoto(imageBase64);
    res.json(result);
  } catch (err) {
    console.error('[analyze-photo] error analizando la foto:', err);
    res.status(502).json({ error: 'No se pudo analizar la foto en este momento' });
  }
});
