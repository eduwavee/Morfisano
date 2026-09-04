import { lookupMacrosPer100g } from './nutritionLookup';

export interface DetectedItem {
  name: string;
  estimatedGrams: number;
  confidence: number;
}

export interface PhotoAnalysisResult {
  detectedItems: { name: string; confidence: number }[];
  estimated: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const VISION_MODEL = 'claude-sonnet-4-5';

const ANALYSIS_PROMPT = `Sos un nutricionista analizando una foto de un plato de comida.
Identificá cada alimento visible y estimá su peso en gramos según lo que se ve en el plato.
Respondé ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{"items":[{"name":"nombre del alimento en español","estimatedGrams":120,"confidence":0.8}]}`;

/**
 * Analiza una foto de comida y devuelve una estimación de calorías y macros.
 *
 * Con ANTHROPIC_API_KEY configurada, le manda la imagen a Claude Vision para
 * identificar los alimentos y estimar porciones, y cruza cada ítem contra la
 * base nutricional local (ver nutritionLookup.ts) para calcular las calorías.
 *
 * Sin la key configurada, devuelve una estimación mock para poder seguir
 * desarrollando y probando el resto del flujo sin depender de la IA.
 */
export async function analyzeFoodPhoto(imageBase64: string): Promise<PhotoAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const items = apiKey ? await detectItemsWithClaude(imageBase64, apiKey) : mockDetectedItems();

  const estimated = items.reduce(
    (acc, item) => {
      const per100g = lookupMacrosPer100g(item.name);
      const factor = item.estimatedGrams / 100;
      acc.calories += per100g.calories * factor;
      acc.proteinG += per100g.proteinG * factor;
      acc.carbsG += per100g.carbsG * factor;
      acc.fatG += per100g.fatG * factor;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  return {
    detectedItems: items.map((i) => ({ name: i.name, confidence: i.confidence })),
    estimated: {
      calories: Math.round(estimated.calories),
      proteinG: Math.round(estimated.proteinG),
      carbsG: Math.round(estimated.carbsG),
      fatG: Math.round(estimated.fatG),
    },
  };
}

async function detectItemsWithClaude(imageBase64: string, apiKey: string): Promise<DetectedItem[]> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API respondió ${res.status}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((c) => c.type === 'text');
  if (!textBlock?.text) throw new Error('Respuesta sin contenido de texto');

  const parsed = JSON.parse(textBlock.text) as { items: DetectedItem[] };
  return parsed.items;
}

function mockDetectedItems(): DetectedItem[] {
  console.warn(
    '[analyzeFoodPhoto] ANTHROPIC_API_KEY no configurada, devolviendo una estimación mock. Configurala en .env para usar el análisis real.'
  );
  return [
    { name: 'pollo a la plancha', estimatedGrams: 150, confidence: 0.5 },
    { name: 'arroz', estimatedGrams: 120, confidence: 0.5 },
    { name: 'ensalada', estimatedGrams: 80, confidence: 0.5 },
  ];
}
