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

Requiere `.env.local` con `NEXT_PUBLIC_SB_URL` y `NEXT_PUBLIC_SB_ANON_KEY`
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

- **Roles en BD:** `profiles.rol` ∈ `admin` / `recolector` / `pendiente` (+ `asociacion_id`).
  El middleware lee ese rol (RPC `mi_acceso`) y manda a cada uno a su área; la cookie
  `simar_user_role` sólo recuerda la opción del modal de login. RLS usa `is_admin()`,
  `get_my_role()` y `get_my_asociacion_id()`. Ver `Contexto-DCK/fase1-asociaciones.md`.
- **Superadmin** no es un rol: es `profiles.es_superadmin` (siempre con rol `admin`) y abre
  `/[locale]/superadmin` (cuentas, suscripciones, planes, auditoría, mantenimiento). Las RPC
  `sa_*` validan `is_superadmin()`. Una cuenta con `suspendido_at` pierde el acceso en todas las
  funciones de RLS. Las suscripciones son de las **asociaciones recolectoras** y el cobro es
  manual (MXN). Un superadmin puede además vincularse a una asociación y usar el portal
  recolector a su nombre: por eso **las consultas del portal filtran siempre por
  `asociacion.id`** (no confíes sólo en RLS ahí). Ver `Contexto-DCK/panel-superadmin.md`.
- **Solicitudes de recolección sólo se escriben por RPC** (`crear_solicitud`,
  `aprobar_solicitud`, `rechazar_solicitud`, `cancelar_solicitud`, `completar_solicitud`); la
  tabla no tiene políticas de escritura. No hagas `insert`/`update` directos.
- **Migraciones nuevas** van en `supabase/migrations/` (idempotentes). Los `.sql` de la raíz son
  históricos. El catálogo de residuos está duplicado a propósito: dominio `tipo_residuo` en SQL y
  `lib/constants/residuos.ts`; si cambias uno, cambia el otro.
- **Recharts** se usa en un solo archivo (`dashboard-recolector/impacto/page.tsx`); el resto de
  "gráficas" son divs/SVG a mano. El mapa del portal recolector usa **MapLibre GL JS +
  react-map-gl** con teselas de OpenFreeMap, sin API key (`components/recolector/MapaMapLibre.tsx`).
  Mantén `maplibre-gl` en v5: la v6 no carga su worker con Turbopack. El mapa de la landing es
  SVG puro.
- Los factores de CO₂e de `lib/constants/impacto.ts` son **provisionales** (sin validar).
- Dependencias instaladas pero **sin usar**: `html2canvas`, `react-time-picker`,
  `react-time-picker-input`, `browser-image-compression`.
- `estructura_completa.sql` (pg_dump) está **desactualizado**: aún trae tablas de un POS ajeno
  (`tenants`, `users`, `products`, ...) y RLS apagado, que ya no existen en el proyecto Supabase
  real (`SiMAR`). Encima de ese esquema se aplican las migraciones de `supabase/migrations/`.
- `components/simple/SimpleBasuronForm.tsx` está vacío.
- La pantalla real de manifiestos es `app/[locale]/dashboard/manifiesto/page.tsx` (~2250
  líneas), que duplica lógica de `components/manifiestos/CreateManifiestoModal.tsx`.

## PDF

`lib/utils/pdfGenerator.ts` (manifiesto MARPOL) y `pdfGeneratorBasuron.ts` (recibo relleno
sanitario). Sólo jsPDF, en el cliente. Firmas capturadas con `components/ui/SignaturePad.tsx`
(canvas → data URL base64 PNG). Los PDF e imágenes se suben a buckets de Supabase Storage
(`manifiestos_img`, `manifiestos_pdf`, `manifiestos_basuron_pdf`, `manifiestos-no-firmados`); el
logo SEMARNAT se lee del bucket público `images`.
