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
- Auth: **Supabase Auth**. El mobile hace login/signup con `supabase-js` y manda el access token en `Authorization: Bearer`; el backend valida la firma contra el JWKS público del proyecto. Supabase firma con **ES256** (clave asimétrica), así que el backend solo necesita la clave pública: no hay ningún secreto compartido entre las dos apps. El `sub` del token es el `User.id`.
- Código de barras: `/api/barcode/:code` resuelve productos envasados contra **Open Food Facts** y devuelve los macros por 100 g. El mobile escanea con la cámara (EAN-13/8, UPC-A/E) y deja ajustar los gramos, recalculando calorías y macros en vivo.

## Cómo correrlo

### Backend

```bash
cd apps/backend
cp .env.example .env        # completá DATABASE_URL y DIRECT_URL
npm install
npx prisma generate
npx prisma migrate deploy   # o `migrate dev` si vas a cambiar el schema
npm run dev                 # http://localhost:4000
```

La base es Postgres en **Supabase** (proyecto `Morfisano`, región `sa-east-1`). Prisma necesita dos URLs y las dos van por el pooler:

| Variable | Pooler | Puerto | Para qué |
|---|---|---|---|
| `DATABASE_URL` | transaction | `6543` | la app en runtime (lleva `?pgbouncer=true`) |
| `DIRECT_URL` | session | `5432` | `prisma migrate` |

Las migraciones no pueden ir por el pooler en modo transaction porque pgbouncer no soporta los prepared statements que usan. Y conviene que `DIRECT_URL` sea el pooler en modo session y no la conexión directa `db.<ref>.supabase.co`, porque esa última es **IPv6 only** en el plan free y falla desde redes IPv4.

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

1. ~~**Conectar el onboarding al backend**~~ ✅ El perfil se persiste con `PUT /api/profile`; al arrancar, la app hace `GET /api/profile` y saltea el onboarding si ya está hecho.
2. ~~**Auth real**~~ ✅ Supabase Auth con login/signup por mail y validación del JWT contra el JWKS del proyecto.
3. ~~**Código de barras**~~ ✅ Escaneo con la cámara + Open Food Facts. Falta sumar USDA FoodData Central para comida no envasada.
4. **Pagos**: integrar RevenueCat para manejar suscripciones in-app (iOS/Android) y separar features free/premium.
5. **Deploy**: backend a Railway o Render (como ya venís laburando), base de datos Postgres gestionada, y build de mobile con EAS (`eas build`).

### Antes de salir a producción

- **SMTP propio.** El mail de confirmación de cuenta sale hoy por el servidor de Supabase, que está limitado a unos pocos envíos por hora y no es para producción. Hay que configurar un SMTP propio (Resend, Postmark, SES) en Auth → Emails.
- **`DEV_AUTH_USER_ID` sin setear.** Es una escotilla de desarrollo que saltea la autenticación entera. Se ignora si `NODE_ENV=production`, pero conviene no tenerla en el `.env` del server.
6. **Apartados nuevos sugeridos**: escaneo de código de barras, registro de peso corporal con gráfico de evolución, rutinas de entrenamiento con series/repeticiones, integración con Google Fit / Apple Health, racha y logros, timer de ayuno intermitente, recetas sugeridas, exportar reportes en PDF, panel admin web.
