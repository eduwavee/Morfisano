/**
 * Base nutricional mínima para el MVP (macros por 100 g).
 *
 * TODO (producción): reemplazar/complementar esto con una base de datos real:
 * - USDA FoodData Central (gratis, buena cobertura genérica): https://fdc.nal.usda.gov/
 * - Open Food Facts (gratis, fuerte en productos envasados + código de barras): https://world.openfoodfacts.org/
 * - Nutritionix o Edamam (de pago, mejor cobertura de comida latina/argentina)
 */
export interface MacrosPer100g {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const FOOD_DB: Record<string, MacrosPer100g> = {
  'pollo a la plancha': { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  'carne vacuna': { calories: 250, proteinG: 26, carbsG: 0, fatG: 17 },
  arroz: { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  'papa / pure': { calories: 87, proteinG: 2, carbsG: 20, fatG: 0.1 },
  'pan / facturas': { calories: 265, proteinG: 9, carbsG: 49, fatG: 3.2 },
  ensalada: { calories: 20, proteinG: 1.2, carbsG: 4, fatG: 0.2 },
  huevo: { calories: 155, proteinG: 13, carbsG: 1.1, fatG: 11 },
  fideos: { calories: 158, proteinG: 5.8, carbsG: 31, fatG: 0.9 },
  milanesa: { calories: 250, proteinG: 20, carbsG: 15, fatG: 12 },
  'queso / fiambre': { calories: 350, proteinG: 22, carbsG: 2, fatG: 28 },
  fruta: { calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 },
  yogur: { calories: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.3 },
};

const DEFAULT_MACROS: MacrosPer100g = { calories: 150, proteinG: 6, carbsG: 18, fatG: 6 };

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

function normalize(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '').trim();
}

/** Busca el ítem más parecido en la base local por coincidencia parcial de texto. */
export function lookupMacrosPer100g(ingredientName: string): MacrosPer100g {
  const query = normalize(ingredientName);
  for (const [key, macros] of Object.entries(FOOD_DB)) {
    if (normalize(key).includes(query) || query.includes(normalize(key))) {
      return macros;
    }
  }
  return DEFAULT_MACROS;
}
