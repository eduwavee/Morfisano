/**
 * Consulta Open Food Facts para resolver un código de barras a información
 * nutricional. OFF es colaborativo, así que muchos productos vienen incompletos:
 * todo lo que devolvemos está normalizado por 100 g y puede tener macros en
 * cero si el producto no las tiene cargadas.
 */

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

// OFF pide identificar la app en el User-Agent; sin esto te terminan limitando.
const USER_AGENT = 'Morfisano/0.1 (https://github.com/eduwavee/Morfisano)';

// Pedimos solo los campos que usamos: la respuesta completa de OFF trae cientos
// de campos por producto y es varios cientos de KB.
const FIELDS = [
  'code',
  'product_name',
  'product_name_es',
  'generic_name_es',
  'brands',
  'quantity',
  'serving_size',
  'nutriments',
  'image_front_small_url',
].join(',');

export interface Macros100g {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string | null;
  /** Valores por 100 g, que es como OFF normaliza todo. */
  per100g: Macros100g;
  /** Gramos de una porción, si OFF los trae parseables. */
  servingSizeG: number | null;
  imageUrl: string | null;
  /** true si los macros vinieron vacíos y hay que cargarlos a mano. */
  incomplete: boolean;
}

interface OffNutriments {
  'energy-kcal_100g'?: number;
  'energy_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffResponse {
  status?: number;
  product?: {
    code?: string;
    product_name?: string;
    product_name_es?: string;
    generic_name_es?: string;
    brands?: string;
    quantity?: string;
    serving_size?: string;
    nutriments?: OffNutriments;
    image_front_small_url?: string;
  };
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * OFF guarda `serving_size` como texto libre ("30 g", "1 taza (240 ml)").
 * Sacamos los gramos solo cuando la unidad es explícitamente g/ml, porque
 * "1 taza" sin gramos no nos sirve para calcular macros.
 */
function parseServingSizeG(servingSize: string | undefined): number | null {
  if (!servingSize) return null;
  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i);
  if (!match) return null;
  const grams = Number(match[1].replace(',', '.'));
  return Number.isFinite(grams) && grams > 0 && grams <= 2000 ? grams : null;
}

function resolveCalories(nutriments: OffNutriments, macros: Omit<Macros100g, 'calories'>): number {
  const kcal = toNumber(nutriments['energy-kcal_100g']);
  if (kcal > 0) return Math.round(kcal);

  // Algunos productos solo traen la energía en kJ.
  const kj = toNumber(nutriments['energy_100g']);
  if (kj > 0) return Math.round(kj / 4.184);

  // Último recurso: reconstruir con Atwater a partir de los macros.
  return Math.round(macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9);
}

/** Devuelve null si OFF no conoce el código. */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const res = await fetch(`${OFF_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  // OFF devuelve 404 para códigos que no tiene.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`);

  const body = (await res.json()) as OffResponse;
  if (body.status !== 1 || !body.product) return null;

  const p = body.product;
  const nutriments = p.nutriments ?? {};

  const proteinG = toNumber(nutriments.proteins_100g);
  const carbsG = toNumber(nutriments.carbohydrates_100g);
  const fatG = toNumber(nutriments.fat_100g);
  const calories = resolveCalories(nutriments, { proteinG, carbsG, fatG });

  const name =
    p.product_name_es?.trim() ||
    p.product_name?.trim() ||
    p.generic_name_es?.trim() ||
    'Producto sin nombre';

  const brand = p.brands?.split(',')[0]?.trim() || null;

  return {
    barcode: p.code ?? barcode,
    name,
    brand,
    per100g: {
      calories,
      proteinG: Math.round(proteinG * 10) / 10,
      carbsG: Math.round(carbsG * 10) / 10,
      fatG: Math.round(fatG * 10) / 10,
    },
    servingSizeG: parseServingSizeG(p.serving_size),
    imageUrl: p.image_front_small_url ?? null,
    incomplete: calories === 0 && proteinG === 0 && carbsG === 0 && fatG === 0,
  };
}
