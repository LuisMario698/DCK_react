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

Requiere `.env.local` con `NEXT_PUBLIC_SB_URL` y `NEXT_PUBLIC_SB_ANON_KEY`. Las demás son del
**modo demostración** (`NEXT_PUBLIC_MODO_DEMO`, `NEXT_PUBLIC_URL_DEMO`, `NEXT_PUBLIC_DEMO_*`):
su despliegue apunta a otro proyecto Supabase con datos inventados y de sólo lectura, con entrada
sin cuenta (`/[locale]/demo`) y recorrido guiado. Ver [`supabase/demo/README.md`](./supabase/demo/README.md);
nunca pongas `NEXT_PUBLIC_MODO_DEMO=1` apuntando al Supabase de producción.
`NEXT_PUBLIC_SB_DCK_URL` y `SB_DCK_ANON_KEY` (**sin** `NEXT_PUBLIC_`: sólo el servidor) apuntan a la
**base anterior de DCK** (proyecto Supabase "CIAD", `tggvwdjdioyzoftzwneb`), que se puede ver sólo
para consultar (abajo).

## Convenciones del repositorio

- **Idioma: español** — código, comentarios, UI y documentación. Escribe en español.
- **No hay API routes** (salvo `app/api/dck`, el intermediario de la base de DCK). Todo el acceso a datos pasa por `lib/services/*` (wrappers finos sobre
  Supabase). Reutiliza los servicios existentes; no metas queries sueltas en componentes.
- **Listas completas:** Supabase corta cada respuesta en 1,000 filas. Si una lista puede pasar de
  ahí, léela con `traerTodas` (`lib/supabase/paginar.ts`) y un `.order('id')` de desempate.
- **`types/database.ts` es la fuente de tipos** de las filas de Supabase. Los tipos en
  `types/{embarcacion,persona,manifiesto,asociacion,usuario}.ts` son **legacy** (otra forma) y
  sólo los usa `lib/data.ts`; no los uses para código nuevo.
- **Cliente Supabase:** `lib/supabase/client.ts` en el navegador; `lib/supabase/server.ts` en
  Server Components. Varios servicios (`buques.ts`, `dashboard_stats.ts`, `landing_stats.ts`)
  aceptan un `SupabaseClient` inyectado para usarse desde RSC. El `AuthProvider` (envuelve todas
  las páginas) pide el cliente con `import()` aparte: en el acto si hay cookie de sesión, si no en
  reposo; así la landing y Noticias no bajan Supabase al abrir.
- **Rutas:** todo cuelga de `app/[locale]/` y lleva prefijo `/es` o `/en` (`localePrefix:
  'always'`). El layout real (providers, `<html>`) es `app/[locale]/layout.tsx`, no
  `app/layout.tsx`.
- **Diseño: sigue [`DISEÑO_SIMAR.md`](./DISEÑO_SIMAR.md)** (usuarios mayores: letra ≥ 17 px,
  botones ≥ 52 px, colores sólo con tokens `simar-*`, vidrio sólo en lo que flota, sin emojis).
  **Tema claro por defecto**; Tailwind v4 con modo oscuro por clase `.dark` (config y tokens en
  `app/globals.css`, no hay `tailwind.config`).
- **Nada de `alert()` ni `window.confirm()`:** avisos con `toast` (sonner) y preguntas con
  `await confirmar({...})` (`components/ui/Confirmar.tsx`). Toda ventana usa
  `useVentanaAccesible` (foco adentro, Tab atrapado, foco de regreso). El título de la pestaña
  sale de `tituloPantalla()` / `useTituloPestana`. En un `catch`, `detalleDe(causa)` en vez de
  `any`. Ver DISEÑO_SIMAR.md §10.11, §10.12 y §11.
- **Nombres en la interfaz:** "Basurón" (recibo del relleno), "Empresas recolectoras" (en código y
  BD siguen siendo `asociacion*`) y "embarcación" (no "buque"). Fechas con `es-MX`. El estado de una
  empresa se muestra con `ESTADO_EMPRESA_LABEL` ("Activa"; en BD "Activo").
- **Portal de empresas:** ver DISEÑO_SIMAR.md §10.20. La tarjeta de impacto
  (`components/ui/ImpactoEquivalencias.tsx`) y la línea de tiempo de una solicitud
  (`components/asociaciones/LineaDeTiempo.tsx`) son las mismas en el recinto y en el portal.
- **La "hora de hoy" es la del puerto** (`hoyPuerto()` en `lib/utils/fechas.ts`,
  `America/Hermosillo`): el servidor de Vercel corre en UTC.
- **i18n parcial:** sólo `Sidebar`, `personas`, `embarcaciones` y `manifiesto` usan
  `useTranslations`. El resto está en español hardcodeado. Si tocas esas 4, mantén
  `messages/es.json` y `messages/en.json` sincronizados. El `NextIntlClientProvider` está en
  `app/[locale]/dashboard/layout.tsx`, no en el de `[locale]` (así la landing y el portal no bajan
  ese código): fuera del recinto, `useTranslations` necesita su propio provider.
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
- **Base de DCK (sólo consulta):** CIAD tiene los registros reales de DCK (742 manifiestos,
  abr–may 2026) con el esquema viejo (sin roles, empresas, inventario ni solicitudes) y RLS
  apagado. **No se toca** (ni migraciones ni ajustes). Un superadmin la elige para *su navegador*
  en Superadmin → Sistema (cookie `simar_base=dck`); sólo cambia la landing y el recinto
  (`rutaConBaseElegible`). `lib/supabase/dck.ts` enruta tabla por tabla: la sesión, `profiles` y
  `configuracion_*` siguen en SiMAR; los registros, sus RPC de lectura y Storage salen de CIAD, y
  su `fetch` detiene cualquier escritura. **La llave de CIAD nunca va al navegador** (con RLS
  apagado da acceso a todo): el navegador pasa por `app/api/dck` (la única ruta API: sólo
  lecturas, sólo superadmins, pone la llave) y el servidor usa `lib/supabase/dckServidor.ts`, que
  no se importa desde código del navegador. Las pantallas usan `useSoloConsulta()`
  (`components/layout/BaseDatos.tsx`) para ocultar lo que guarda o lo que CIAD no tiene; en el
  servidor, `createServerClient({ conBaseElegida: true })` y `baseElegida()`. Una tabla nueva
  que no exista en CIAD falla en modo DCK en vez de mezclar datos: ocúltala ahí.
- **Recharts** se usa en un solo archivo (`dashboard-recolector/impacto/page.tsx`); el resto de
  "gráficas" son divs/SVG a mano. El mapa del portal recolector usa **MapLibre GL JS +
  react-map-gl** con teselas de OpenFreeMap, sin API key (`components/recolector/MapaMapLibre.tsx`).
  Mantén `maplibre-gl` en v5: la v6 no carga su worker con Turbopack. El mapa de la landing es
  SVG puro; el de Noticias («En el mapa») es MapLibre directo (`components/noticias/MapaInteractivo.tsx`,
  estilo positron de OpenFreeMap, repintado en oscuro con la paleta de SiMAR), cargado con `next/dynamic` sólo cuando la sección se acerca.
  **Motion** (motion.dev) se usa sólo en la landing nueva (`components/landing/nueva/`, escenas
  atadas al scroll; ver DISEÑO_SIMAR.md §8.5) y en «Otros medios» de Noticias: no lo lleves a los
  paneles ni a la landing Actual (sus noticias y la foto de la portada de Noticias se mueven con CSS
  atado al scroll, `n-paralaje`). Las fotos de Noticias llegan con `FotoNota` y su vista previa
  difuminada de `lib/constants/previas.ts`: si agregas una foto, agrega su previa.
  **three.js** se usa sólo en las landings: la 3D (`components/landing/tresd/`, `?landing=3d`; ver
  DISEÑO_SIMAR.md §8.6) y la escena de la laptop de la Actual (`components/landing/escena-equipos/`,
  §8.7), cargado con `await import()`: no lo importes arriba de un archivo. La escena de la Actual
  arranca después de `load` y cerca de la sección; lo que no urge se pide con `cuandoEnReposo`
  (`lib/utils/reposo.ts`).
  **Carga de la landing** (DISEÑO_SIMAR.md §8.7): las landings nueva y 3D se importan desde
  `components/landing/LandingsAlternas.tsx` (de cliente). Un `next/dynamic` en `page.tsx` (de
  servidor) **no** parte el código: sus componentes de cliente bajaban igual con la Actual. Por lo
  mismo, en la página de servidor no importes arriba componentes que sólo se usan en otra versión.
  Las fotos con calidad distinta de 75 deben estar en `images.qualities` (`next.config.ts`).
  **Animaciones atadas al scroll (`animation-timeline: view()`):** todo lo que las rodea recorta con
  `overflow-clip`, nunca `overflow-hidden`. Un overflow hidden vuelve a la caja un contenedor de scroll
  y la animación se mide contra ella, que no se mueve: se queda fija (así estuvieron sin funcionar el
  paralaje de la portada de Noticias y el descubrir de sus tarjetas). Para descubrir o recortar algo
  que se anima, usa `transform`/`translate` (dos traslados opuestos, ver `n-descubre` en
  `globals.css`), no `clip-path`, que Chrome repinta en el hilo principal.
- La barra del **portal público** (Noticias y la landing Actual) es una **isla dinámica**
  (`components/isla/`, DISEÑO_SIMAR.md §8.6): sus paneles salen como gotas por la orilla de abajo de
  la isla, bajo el botón que los abre (liquid-gooey); un botón fuera de la isla los abre con
  `useGota().abrirDesde(boton)` (una gotita viaja a la isla primero). Para que no se trabe, la capa
  líquida sólo existe mientras una gota vive y sólo en su columna; no le pongas sombras ni brillos al
  filtro (van en CSS) ni la dejes montada siempre. La gota es sólida (`--isla-liquido`), sin
  `backdrop-filter`. En el portal público, los selectores son `SelectorLiquido` (lente que se desliza,
  `components/isla/lente.ts`) y los botones llevan `data-vidrio` (luz bajo el cursor; `VidrioVivo` se
  monta una vez por página). Nada de eso va en el recinto.
- Las **noticias** son una página informativa aparte (`/[locale]/noticias`: portada bajo el mar,
  lo último, en cifras, en el mapa, el proyecto, todas, glosario y fuentes; muy visual y casi todo
  se ve con sólo bajar) y salen de `lib/constants/noticias.ts`, no de Supabase; todo dato lleva su
  fuente y toda noticia, su lugar en `LUGARES`. Es un producto editorial: debe verse como un medio
  serio (fotos reales con su crédito y licencia, tipografía de periódico, fuentes visibles). Ahí se
  puede usar cualquier herramienta (Motion, three.js con `await import()`, MapLibre, CSS nativo);
  lo de siempre: con «reducir movimiento», quieto. «Otros medios» sale de
  `lib/services/noticias_externas.ts` (RSS públicos de Mongabay Latam, SINC, ONU y The Conversation,
  leídos en el servidor cada hora): sólo titular, resumen, autor y enlace al original, nunca el
  texto completo ni sus fotos. Las fotos ajenas están en `lib/constants/fotos.ts` (licencia libre,
  con crédito visible junto a la foto). Noticias tiene **ajustes de lectura** (tamaño, contraste, renglones,
  tema, animaciones, enlaces: `components/noticias/ajustesLectura.ts` + `PanelLectura.tsx`) que sólo
  valen dentro de `.n-pagina`; el tamaño es `zoom` en `<main>`: lo pegado y las alturas con `svh`
  van divididos entre `var(--n-zoom,1)`. Las clases `n-*` de `globals.css` y
  `MarAnimado.tsx` son la base anterior (DISEÑO_SIMAR.md §8.6, «Noticias»). Sin foto, la portada se dibuja
  (`components/noticias/ilustraciones.tsx`, ilustraciones planas, sin puntos). La landing 3D sólo
  lleva un adelanto: `SeccionNoticias`, de servidor, llega a `LandingTresD` como prop (ver
  DISEÑO_SIMAR.md §8.6).
- Los factores de CO₂e de `lib/constants/impacto.ts` son **provisionales** (sin validar). Las
  cifras de impacto (agua, CO₂, basura) salen **sólo** de `lib/utils/equivalencias.ts`, que usan
  Estadísticas, su PDF y la landing: 1 L de aceite = 1,000,000 L de agua; 1.0 kg CO₂e por litro. La
  basura del basurón es la misma de los manifiestos: **nunca sumes basura + basurón**.
- Las fechas y horas usan `components/ui/SelectorFecha` y `SelectorHora`, propios (sin librería;
  ver DISEÑO_SIMAR.md).
- `estructura_completa.sql` (pg_dump) está **desactualizado**: aún trae tablas de un POS ajeno
  (`tenants`, `users`, `products`, ...) y RLS apagado, que ya no existen en el proyecto Supabase
  real (`SiMAR`). Encima de ese esquema se aplican las migraciones de `supabase/migrations/`.
- La pantalla real de manifiestos es `app/[locale]/dashboard/manifiesto/page.tsx` (~2400
  líneas). Con `?ver=ID` abre ese manifiesto (igual `manifiesto-basuron?ver=ID`); así llega "Lo
  último registrado" del Panel.
- En la raíz queda `nuevoDiseño.tsx`, una nota vieja que no se importa (da 3 errores de lint).

## PDF

`lib/utils/pdfGenerator.ts` (manifiesto MARPOL) y `pdfGeneratorBasuron.ts` (recibo relleno
sanitario). En Estadísticas, `components/dashboard/pdfEstadisticas.ts` (resumen del período) y
`pdfReporteMensual.ts` (reporte del mes para SEMARNAT; datos de `lib/services/reporte_mensual.ts`).
Sólo jsPDF, en el cliente. Los generadores se cargan con `await import()` justo al hacer el PDF,
nunca con un `import` arriba del archivo: jsPDF pesa ~130 KB y se bajaría en cada pantalla (igual
con lo pesado que sólo se usa al pedirlo, como el formulario de acceso o la ventana del perfil, que
van con `next/dynamic`). Firmas capturadas con `components/ui/SignaturePad.tsx`
(canvas → data URL base64 PNG). Los PDF e imágenes se suben a buckets de Supabase Storage
(`manifiestos_img`, `manifiestos_pdf`, `manifiestos_basuron_pdf`, `manifiestos-no-firmados`); el
logo SEMARNAT se lee del bucket público `images`.
