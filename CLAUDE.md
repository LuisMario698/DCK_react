# CLAUDE.md

Guía para asistentes de IA que trabajan en este repositorio. El contexto completo está en
[`README.md`](./README.md) — léelo antes de cambios grandes. Para el **dominio de negocio**
(qué es un manifiesto, un "basurón", etc.) la mejor fuente es
[`Contexto-DCK/proyecto.md`](./Contexto-DCK/proyecto.md) y el §2 del README.

## Qué es

**SiMAR** — app Next.js 16 (App Router) + Supabase para digitalizar la gestión de residuos de
embarcaciones pesqueras en Puerto Peñasco, Sonora (formato MARPOL Anexo V). También aparece
nombrada como "CIAD" y "DCK" en el código; el nombre canónico es **SiMAR**.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000 → /es
npm run build
npm run lint      # ESLint (eslint-config-next); no hay tests
```

Requiere `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(son las **únicas** variables que lee el código).

## Convenciones del repositorio

- **Idioma: español** — código, comentarios, UI y documentación. Escribe en español.
- **No hay API routes.** Todo el acceso a datos pasa por `lib/services/*` (wrappers finos sobre
  Supabase). Reutiliza los servicios existentes; no metas queries sueltas en componentes.
- **`types/database.ts` es la fuente de tipos** de las filas de Supabase. Los tipos en
  `types/{embarcacion,persona,manifiesto,asociacion,usuario}.ts` son **legacy** (otra forma) y
  sólo los usa `lib/data.ts`; no los uses para código nuevo.
- **Cliente Supabase:** `lib/supabase/client.ts` en el navegador; `lib/supabase/server.ts` en
  Server Components. Varios servicios (`buques.ts`, `dashboard_stats.ts`, `landing_stats.ts`)
  aceptan un `SupabaseClient` inyectado para usarse desde RSC.
- **Rutas:** todo cuelga de `app/[locale]/` y lleva prefijo `/es` o `/en` (`localePrefix:
  'always'`). El layout real (providers, `<html>`) es `app/[locale]/layout.tsx`, no
  `app/layout.tsx`.
- **Tema oscuro por defecto**; Tailwind v4 con modo oscuro por clase `.dark` (config en
  `app/globals.css`, no hay `tailwind.config`).
- **i18n parcial:** sólo `Sidebar`, `personas`, `embarcaciones` y `manifiesto` usan
  `useTranslations`. El resto está en español hardcodeado. Si tocas esas 4, mantén
  `messages/es.json` y `messages/en.json` sincronizados.
- El repo no usa Prettier configurado; sigue el estilo del archivo que edites.
- Git: rama principal `main`, despliega `online` (Vercel). No hagas commit/push salvo que se
  pida; si estás en `main`, crea rama antes.

## No asumas

- **`lib/mock/*` NO es real.** Todo `/dashboard-recolector` y `/dashboard/asociaciones`
  funcionan con datos ficticios (`lib/mock/recolector.ts`, `lib/mock/asociaciones.ts`); las
  acciones se simulan con `toast`. `asociaciones_recolectoras` tiene tabla y servicio reales,
  pero la UI aún no los usa.
- **No hay RBAC.** El middleware sólo comprueba que exista sesión Supabase y protege cualquier
  ruta que contenga `/dashboard`. El rol `admin`/`recolector` es la cookie de cliente
  `dck_user_role`, sólo sirve para elegir el redirect post-login.
- **Recharts** se usa en un solo archivo (`dashboard-recolector/impacto/page.tsx`); el resto de
  "gráficas" son divs/SVG a mano. **Leaflet** en un solo componente
  (`components/recolector/PortMap.tsx`); el mapa de la landing es SVG puro.
- Dependencias instaladas pero **sin usar**: `html2canvas`, `react-leaflet`,
  `react-time-picker`, `react-time-picker-input`, `browser-image-compression`.
- Algunos `select` en `lib/services/manifiestos.ts` y `manifiesto_basuron.ts` piden tablas
  **eliminadas** (`tipos_residuos`, `usuarios_sistema`) — esas consultas fallan.
- El esquema real vive en `estructura_completa.sql` (pg_dump). El mismo Supabase contiene tablas
  de un sistema POS ajeno (`tenants`, `users`, `products`, `orders`, ...) — ignóralas.
- `components/simple/SimpleBasuronForm.tsx` está vacío.
- La pantalla real de manifiestos es `app/[locale]/dashboard/manifiesto/page.tsx` (~2250
  líneas), que duplica lógica de `components/manifiestos/CreateManifiestoModal.tsx`.

## PDF

`lib/utils/pdfGenerator.ts` (manifiesto MARPOL) y `pdfGeneratorBasuron.ts` (recibo relleno
sanitario). Sólo jsPDF, en el cliente. Firmas capturadas con `components/ui/SignaturePad.tsx`
(canvas → data URL base64 PNG). Los PDF e imágenes se suben a buckets de Supabase Storage
(`manifiestos_img`, `manifiestos_pdf`, `manifiestos_basuron_pdf`, `manifiestos-no-firmados`); el
logo SEMARNAT se lee del bucket público `images`.
