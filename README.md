# NutriApp — scaffold inicial

MVP de una app de alimentación sana y ejercicio (estilo Fitia/Macrofactor): calorías, macros, foto de comida analizada con IA, ejercicio y agua.

## Estructura

```
nutriapp/
├── apps/
│   ├── mobile/    → App React Native (Expo) + TypeScript
│   └── backend/   → API Node/Express + TypeScript + Prisma (Postgres)
└── README.md
```

## Qué incluye este scaffold

**Mobile (`apps/mobile`)**
- Navegación con tabs: Hoy (dashboard), Diario, Ejercicio, Agua, Perfil.
- Onboarding que calcula tus metas diarias (calorías, macros, agua) con la fórmula de Mifflin-St Jeor.
- Diario de comidas por tipo de comida (desayuno/almuerzo/cena/merienda), con carga manual o por foto.
- Pantalla de cámara que manda la foto al backend para analizarla y precarga el formulario con la estimación.
- Registro de ejercicio con actividades rápidas (caminata, running, musculación, fútbol, bici) y cálculo de calorías quemadas.
- Registro de agua con botones rápidos (200/330/500 ml) y barra de progreso contra la meta diaria.

**Backend (`apps/backend`)**
- API REST: `/api/foods`, `/api/exercises`, `/api/water`, `/api/profile`, `/api/analyze-photo`.
- Schema de Prisma con `User`, `FoodEntry`, `ExerciseEntry`, `WaterEntry`, `WeightLog`.
- Análisis de fotos: si configurás `ANTHROPIC_API_KEY`, usa Claude Vision para identificar los alimentos de la foto y estima porciones; después cruza cada ítem contra una base nutricional local (`src/services/nutritionLookup.ts`) para calcular calorías y macros. Sin la key, devuelve una estimación mock para que puedas seguir developeando sin depender de la IA.
- Auth: por ahora es un stub por header (`x-user-id`, con un usuario demo por default) para no bloquear el desarrollo. Hay que reemplazarlo por auth real antes de producción (ver Próximos pasos).

## Cómo correrlo

### Backend

```bash
cd apps/backend
cp .env.example .env        # completá DATABASE_URL (Railway/Render/Postgres local)
npm install
npx prisma generate         # descarga el motor de Prisma (necesita salir a internet)
npx prisma migrate dev --name init
npm run dev                 # http://localhost:4000
```

> Nota: en el sandbox donde armamos este scaffold no había salida a `binaries.prisma.sh`, así que `prisma generate` no se pudo terminar de correr ahí. Los tipos de TypeScript ya están generados y el proyecto tipa bien; correlo en tu máquina o en el pipeline de deploy para bajar el motor nativo antes de levantar el server.

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

Para que la app le pegue a tu backend local desde el celular (Expo Go), usá la IP de tu compu en la red local, no `localhost`:

```bash
# apps/mobile/.env (crealo)
EXPO_PUBLIC_API_URL=http://192.168.0.X:4000
```

## Próximos pasos (roadmap)

1. **Auth real**: reemplazar el stub de `x-user-id` por Supabase Auth o Clerk, y agregar pantallas de login/signup en mobile.
2. **Conectar el onboarding al backend**: hoy `completeOnboarding` calcula las metas en el cliente; falta pegarle a `PUT /api/profile` para persistir el perfil.
3. **Base nutricional real**: sumar Open Food Facts (código de barras + productos envasados) y/o USDA FoodData Central para no depender solo de la tabla local en `nutritionLookup.ts`.
4. **Pagos**: integrar RevenueCat para manejar suscripciones in-app (iOS/Android) y separar features free/premium.
5. **Deploy**: backend a Railway o Render (como ya venís laburando), base de datos Postgres gestionada, y build de mobile con EAS (`eas build`).
6. **Apartados nuevos sugeridos**: escaneo de código de barras, registro de peso corporal con gráfico de evolución, rutinas de entrenamiento con series/repeticiones, integración con Google Fit / Apple Health, racha y logros, timer de ayuno intermitente, recetas sugeridas, exportar reportes en PDF, panel admin web.
