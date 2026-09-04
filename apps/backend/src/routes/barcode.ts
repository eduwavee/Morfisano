import { Router } from 'express';
import { lookupBarcode } from '../services/openFoodFacts';
import { asyncHandler } from '../utils/asyncHandler';

export const barcodeRouter = Router();

// Los códigos EAN/UPC son numéricos de 8 a 14 dígitos. Validamos antes de salir
// a la red para no gastar un request de Open Food Facts en algo que no puede existir.
const BARCODE_RE = /^\d{8,14}$/;

barcodeRouter.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const code = req.params.code.trim();

    if (!BARCODE_RE.test(code)) {
      return res.status(400).json({ error: 'Código de barras inválido' });
    }

    try {
      const product = await lookupBarcode(code);
      if (!product) {
        return res
          .status(404)
          .json({ error: 'No encontramos ese producto en Open Food Facts. Cargalo a mano.' });
      }
      res.json(product);
    } catch (err) {
      // Que Open Food Facts esté caído o lento no es culpa del cliente, pero
      // tampoco es un bug nuestro: 502 y que el mobile ofrezca la carga manual.
      console.error('[barcode] Open Food Facts falló:', err);
      res.status(502).json({ error: 'No pudimos consultar la base de productos en este momento' });
    }
  })
);
