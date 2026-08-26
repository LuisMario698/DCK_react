# SiMAR — Sistema de Manejo Ambiental de Residuos Marinos

Plataforma web para **digitalizar la gestión de los residuos generados por embarcaciones
pesqueras** en el recinto portuario de **Puerto Peñasco, Sonora**. Sustituye los manifiestos en
papel del centro de acopio (formato **MARPOL 73/78 – Anexo V**) por registros en base de datos,
con generación de PDF, firmas digitales, control de embarcaciones y personas, y un panel de
estadísticas de impacto ambiental.

El proyecto nació como **residencia profesional del Instituto Tecnológico Superior de Puerto
Peñasco (ITSPP)** para la asociación **DCK (Dayanara, Coral y Karitza — "Conciencia y Cultura")**,
bajo supervisión de **SEMARNAT** y del comisionado de líquidos y sólidos del centro de acopio,
Francisco Javier Bojórquez Ochoa ("Don Francisco").

> **Sobre el nombre.** En el código conviven tres nombres para el mismo sistema:
> **SiMAR** (el más visible: landing, login, sidebars, hub del dashboard — es el nombre
> canónico), **CIAD** (metadata de la app: `"CIAD - Sistema de Manifiestos"`, `SidebarVariantD`,
> parte de la documentación antigua) y **DCK/CDK** (nombre del repositorio, de la asociación y de
> los logos). Conviene unificar a **SiMAR**. Este README usa SiMAR.

---

## Índice

1. [Contexto y objetivo](#1-contexto-y-objetivo)
2. [Glosario del dominio](#2-glosario-del-dominio)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura](#4-arquitectura)
5. [Estructura de carpetas](#5-estructura-de-carpetas)
6. [Rutas de la aplicación](#6-rutas-de-la-aplicación)
7. [Autenticación y roles](#7-autenticación-y-roles)
8. [Modelo de datos (Supabase / PostgreSQL)](#8-modelo-de-datos-supabase--postgresql)
9. [Capa de servicios](#9-capa-de-servicios-libservices)
10. [Generación de PDF y firmas](#10-generación-de-pdf-y-firmas)
11. [Internacionalización (i18n)](#11-internacionalización-i18n)
12. [Tema y sistema de diseño](#12-tema-y-sistema-de-diseño)
13. [Puesta en marcha](#13-puesta-en-marcha)
14. [Despliegue](#14-despliegue)
15. [Estado del proyecto, limitaciones y deuda técnica](#15-estado-del-proyecto-limitaciones-y-deuda-técnica)
16. [Mapa de documentación del repositorio](#16-mapa-de-documentación-del-repositorio)
17. [Créditos](#17-créditos)

---

## 1. Contexto y objetivo

La pesca es una de las principales actividades de Puerto Peñasco y genera grandes volúmenes de
**aceite usado, filtros de diésel/aceite/aire, plásticos y basura general**. Históricamente, la
entrega de estos residuos al centro de acopio se documentaba a mano, con formatos físicos que se
acumulan y deterioran (más de 5,000 reportes desde 2014), lo que impide la trazabilidad y la
generación de reportes confiables.

SiMAR resuelve eso con:

- **Registro digital de manifiestos** de entrega-recepción de residuos por embarcación.
- **Recibos de relleno sanitario** ("manifiesto basurón") para el traslado de basura al relleno
  municipal.
- **Catálogos** de embarcaciones (buques), personas (tripulación) y asociaciones recolectoras.
- **Generación de PDF** con el formato oficial del centro de acopio y **firmas digitales**.
- **Panel de estadísticas** con KPIs, gráficas, comparativas por período y equivalencias de
  impacto ambiental (CO₂ evitado, agua protegida, etc.).
- **Landing pública** con las cifras acumuladas del programa y contenido de concientización.

Marco normativo de referencia: MARPOL 73/78 Anexo V, LGPGIR, NOM-001-SEMARNAT-2021, ODS 14.1.

---

## 2. Glosario del dominio

Entender estos términos es imprescindible para trabajar en el código. Hay **dos documentos muy
distintos** que ambos se llaman "manifiesto"; no confundirlos.

| Término | Qué significa en SiMAR |
|---|---|
| **Manifiesto** (de residuos / de entrega-recepción) | Documento central. Registra que **una embarcación entregó** sus residuos acumulados al centro de acopio. Formato legal: *"MANIFIESTO DE ENTREGA-RECEPCIÓN — Basura y Residuos Aceitosos (MARPOL Anexo V)"*. Tablas: `manifiestos` + `manifiestos_residuos` (1:1). Folio (`numero_manifiesto`) con formato **`MAN` + `ddmmaaaa` + secuencia de 3 dígitos** (p. ej. `MAN25082026001`), generado por `generarNumeroManifiesto()`. |
| **Manifiesto basurón** / **"Recibo Relleno Sanitario"** | Documento **separado y más simple**: el *ticket de báscula* que se produce cuando el camión del centro de acopio lleva la basura acumulada al relleno sanitario municipal ("basurón"). **No es un registro por embarcación.** Campos: fecha, hora de entrada/salida, `peso_entrada` (camión cargado), `peso_salida` (camión vacío), `total_depositado = peso_entrada − peso_salida`, `recibimos_de`, `direccion`, `recibido_por`. Tabla: `manifiesto_basuron`. Etiqueta en la UI/i18n: **"Recibo Relleno Sanitario"**. Estados: `En Proceso` / `Completado` / `Cancelado`. |
| **Embarcación / Buque** | Barco pesquero. "Embarcación" en la UI, `buque`/`buques` en la BD y los servicios (se usan como sinónimos). Un registro completo lleva nombre, matrícula, tipo, tonelaje y propietario. Puede **auto-crearse** desde un manifiesto con `registro_completo = false`. |
| **Persona** | Integrante de la tripulación involucrado en una entrega. Campos: `nombre`, `tipo_persona_id`, `info_contacto` (texto libre: teléfono/correo), `registro_completo`. También puede auto-crearse desde un manifiesto. |
| **Tipo de Persona** | Catálogo de roles (`tipos_persona`). En el alta de personas se filtra a **Motorista, Cocinero y Responsable de Líquidos** (los tres que firman un manifiesto). El código y la i18n también mencionan Capitán, Tripulante, Administrativo, Inspector. |
| **Roles que firman un manifiesto** | (a) **Motorista** = `responsable_principal_id`; (b) **Cocinero** = `responsable_secundario_id`; (c) **Responsable de entrega de líquidos (aceite usado)** = `responsable_liquidos_id`; (d) **Oficial / Comisionado** que **recibe** los residuos en el puerto (se imprime con el nombre de Don Francisco). |
| **Las 5 categorías de residuo** de un manifiesto | `aceite_usado` (litros), `filtros_aceite` (piezas), `filtros_diesel` (piezas), `filtros_aire` (piezas), `basura` (kg). Tipo `ManifiestoResiduo` en `types/database.ts`. |
| **Asociación recolectora** | Empresa externa autorizada para recolectar y disponer flujos de residuos reciclables (plástico, aceite, cartón, chatarra, vidrio, orgánico). Tabla `asociaciones_recolectoras` + servicio CRUD **existen**, pero la pantalla actual (`/dashboard/asociaciones`) funciona con **datos mock**. |
| **Recolector** (rol de app) | La contraparte: una **empresa recolectora** que entra a `/dashboard-recolector` para ver un mapa de puertos con residuos disponibles, enviar solicitudes de recolección, seguir su estado y ver su impacto. **Todo ese portal es un prototipo con datos mock.** |
| **Digitalización** | Proceso de convertir los reportes en papel a filas de BD. `estado_digitalizacion` en un manifiesto: `pendiente` / `en_proceso` / `completado` (el tipo TS también admite `aprobado` / `rechazado`, pero el `CHECK` de la BD no). |

---

## 3. Stack tecnológico

| Categoría | Tecnología | Versión (`package.json`) | Notas |
|---|---|---|---|
| Framework | **Next.js** (App Router) | `^16.2.4` | `next dev` / `next build` sin Turbopack explícito |
| UI | **React** | `19.2.0` | |
| Lenguaje | **TypeScript** | `^5` | `strict: true`, alias `@/*` → raíz del repo |
| Estilos | **Tailwind CSS v4** | `^4` | `@tailwindcss/postcss`; **no hay `tailwind.config`**, la config vive en `app/globals.css` |
| Backend | **Supabase** | `@supabase/ssr ^0.7`, `@supabase/supabase-js ^2.80` | PostgreSQL + Auth + Storage |
| i18n | **next-intl** | `^4.5` | Locales `es` (default) y `en`; prefijo de locale siempre |
| PDF | **jsPDF** | `^3` | Generación 100% en el cliente |
| Gráficas | **Recharts** | `^3.5` | Usado en **un solo archivo** (`dashboard-recolector/impacto`) |
| Mapas | **Leaflet** | `^1.9` | Usado en **un solo componente** (`recolector/PortMap`) |
| Fechas | **date-fns** | `^4` | + `react-datepicker ^8` |
| Iconos | **lucide-react** | — | + set SVG propio en `components/ui/Icons.tsx` |
| Toasts | **sonner** | `^2` | |
| Excel | **xlsx** (SheetJS) | `^0.18` | Export de reportes |

**Dependencias instaladas pero NO utilizadas** (candidatas a eliminar): `html2canvas`,
`react-leaflet`, `react-time-picker`, `react-time-picker-input`, `browser-image-compression`,
`@types/react-datepicker` es necesario pero `react-datepicker` se usa parcialmente.

- **Node.js**: 20+ (`@types/node ^20`).
- El campo `name` de `package.json` sigue siendo `my_app_react_ejemplo` (resto del andamiaje
  de `create-next-app`).

---

## 4. Arquitectura

```
Navegador
   │
   ▼
middleware.ts ──► updateSession()            (utils/supabase/middleware.ts)
   │              · refresca la sesión Supabase (cookies)
   │              · si NO hay usuario y la ruta contiene "/dashboard" → redirect /login
   │              · si HAY usuario y la ruta contiene "/login" → redirect a
   │                /dashboard  ó  /dashboard-recolector  (según cookie dck_user_role)
   │
   ├──► si updateSession devolvió un redirect → se respeta y termina
   │
   ▼
next-intl middleware   · fuerza prefijo de locale (/es, /en)
   │
   ▼
app/[locale]/layout.tsx
   <html> → ThemeProvider → AuthProvider → NextIntlClientProvider → children + <ThemeToggle/>
   │
   ▼
Página (Server Component ó Client Component)
   │
   ▼
lib/services/*   ·  wrappers finos sobre Supabase (no hay API routes)
   │                pattern: `const { data, error } = await supabase...; if (error) throw error`
   ▼
Supabase  (PostgreSQL · Auth · Storage)
   ·  algunas estadísticas se calculan con funciones RPC (get_reporte_detallado, ...)
   ·  numeración de tickets y bitácora vía triggers
```

Puntos clave:

- **`app/layout.tsx` sólo hace `return children`.** Todo el `<html>`, los providers y la
  metadata están en **`app/[locale]/layout.tsx`**.
- **No hay API routes** (`app/**/api/**/route.ts` no existe). Toda la lógica de datos vive en
  `lib/services/*` y se llama desde Client Components o Server Components.
- **Cuatro formas de crear el cliente Supabase**, según el contexto:
  | Archivo | Uso | Detalle |
  |---|---|---|
  | `lib/supabase/client.ts` | Navegador | `createBrowserClient`. Lo usan casi todos los servicios y componentes cliente. |
  | `lib/supabase/server.ts` | Server Components | `createServerClient` **sólo lectura de cookies**. Lo usan `app/[locale]/page.tsx` y `estadisticas/page.tsx`. |
  | `utils/supabase/server.ts` | Server Components / handlers | `createServerClient` con `getAll`/`setAll`. Presente (según docs de Supabase) pero **no lo referencia ninguna página**. |
  | `utils/supabase/middleware.ts` | Edge middleware | `updateSession(request)`. |
  Todos usan **únicamente la `anon key`**; no hay `service_role` en el código.
- **`AuthProvider`** expone `useAuth()` (`user`, `session`, `signOut`, `loading`), se suscribe a
  `onAuthStateChange` y hace **cierre de sesión automático tras 30 min de inactividad**.

---

## 5. Estructura de carpetas

```
DCK_react/
├── app/
│   ├── layout.tsx                     # sólo `return children`
│   ├── globals.css                    # entrada de Tailwind v4 + variables de tema + keyframes
│   └── [locale]/
│       ├── layout.tsx                 # layout real: <html> + providers + metadata
│       ├── page.tsx                   # landing (Server, revalidate 3600)
│       ├── login/page.tsx             # selector de rol + LoginForm
│       ├── dashboard/                 # área "Administrador Portuario"
│       │   ├── layout.tsx             # monta <DashboardLayout> (Sidebar + Header)
│       │   ├── page.tsx               # hub con 3 tarjetas
│       │   ├── manifiesto/page.tsx    # ⭐ pantalla núcleo (~2250 líneas)
│       │   ├── manifiesto-basuron/page.tsx
│       │   ├── estadisticas/page.tsx  # → <DashboardClient>
│       │   ├── personas/page.tsx
│       │   ├── embarcaciones/page.tsx
│       │   ├── asociaciones/page.tsx  # MOCK  (+ page.tsx.bak = versión real anterior)
│       │   └── simple/page.tsx        # "modo simple" para usuarios no técnicos
│       └── dashboard-recolector/      # área "Empresa Recolectora" — 100% MOCK
│           ├── layout.tsx             # layout propio (no usa DashboardLayout)
│           ├── page.tsx  · mapa/ · solicitudes/ · historial/
│           ├── impacto/  · notificaciones/ · perfil/ · configuracion/
│
├── components/
│   ├── ui/            # Button, Table, ConfirmationModal, Icons, SignaturePad, TimePicker
│   ├── layout/        # DashboardLayout, Sidebar, Header, *Context, ThemeToggle,
│   │   └── sidebars/  #   LanguageSwitcher (no montado), UserProfileModal, SidebarVariantD
│   ├── auth/          # LoginForm (5 vistas)
│   ├── landing/       # VariantCinematic, InteractiveMexicoMap (SVG), CountUpNumber, useScrollReveal
│   ├── dashboard/     # DashboardClient (~1700 líneas), DashboardBackground
│   ├── manifiestos/   # CreateManifiestoModal, CreateManifiestoBasuronModal, ManifiestoBasuronDetails
│   ├── personas/      # PersonasTable, CreatePersonaModal, TiposPersonaManager
│   ├── embarcaciones/ # EmbarcacionesTable, CreateEmbarcacionModal, Pagination (reusado)
│   ├── asociaciones/  # ChatTab, EmpresasTab, InventarioTab, SolicitudesTab (mock)
│   ├── recolector/    # SidebarRecolector, HeaderRecolector, PortMap (único uso de Leaflet)
│   └── simple/        # SimpleManifiestoForm, SimpleEstadisticas, SimpleBasuronForm (VACÍO)
│
├── lib/
│   ├── supabase/      # client.ts (browser), server.ts (RSC solo-lectura)
│   ├── services/      # capa de datos (ver §9)
│   ├── utils/         # pdfGenerator.ts, pdfGeneratorBasuron.ts
│   ├── mock/          # recolector.ts, asociaciones.ts  ← datos ficticios AÚN EN USO
│   └── data.ts        # datos demo legacy (en desuso)
│
├── types/             # database.ts (autoritativo) + dashboard.ts + tipos legacy
├── utils/supabase/    # server.ts, middleware.ts (updateSession)
├── messages/          # es.json, en.json  (next-intl)
├── i18n.ts            # config de next-intl (estilo archivo único)
├── middleware.ts      # updateSession + next-intl
├── Contexto-DCK/      # documentación de dominio + logos usados por el código
│   ├── proyecto.md    # ⭐ reporte de residencia — mejor documento de dominio
│   ├── contesto-actual.md, guia.md
│   └── logo_DCK.png, escudo_mexico.png, logo_ITSPP.png, logo_ICS.png
├── *.sql              # ~20 archivos: esquema, buckets, RLS, migraciones (ver §8 y §16)
└── *.md               # ~15 documentos de diseño / guías / bitácora (ver §16)
```

---

## 6. Rutas de la aplicación

Todas cuelgan de `app/[locale]/` y **siempre** llevan prefijo de locale (`/es/...` o `/en/...`);
`/` redirige a `/es`.

| Ruta | Tipo | Qué hace | Fuente de datos |
|---|---|---|---|
| `/[locale]` | Server (`revalidate = 3600`) | **Landing** `VariantCinematic`: hero cinemático, secciones de concientización ("Conciencia Azul"), mapa SVG de México con puertos, equivalencias ambientales con cifras vivas, modal de login con selector de rol. | **Supabase real** — `getLandingStats()` |
| `/[locale]/login` | Client | Selector de rol (**Administrador Portuario** / **Empresa Recolectora**) → guarda cookie `dck_user_role` → `LoginForm` con `redirectTo` según el rol. | — |
| `/[locale]/dashboard` | Server (`force-dynamic`) | Hub con 3 tarjetas grandes (Manifiesto / Basurón / Estadísticas) + accesos rápidos. | Estático |
| `/[locale]/dashboard/manifiesto` | Client (~2250 líneas) | **Pantalla núcleo.** Alta/lista/edición de manifiestos de embarcación; autocompletado y **auto-creación** de buque/persona/tipo; 4 firmas en `<canvas>` (motorista/cocinero/oficial/líquidos) + modal flotante de firma; subida de imagen del manifiesto físico; genera y sube el PDF; botones "Descargar borrador" e "Imprimir"; filtros (buque, motorista, cocinero, fecha, número) y paginación (15/pág). | **Supabase real** — `buques`, `personas`, `manifiestos`, `storage`, `pdfGenerator` |
| `/[locale]/dashboard/manifiesto-basuron` | Client | **"Recibo Relleno Sanitario"**: lista + búsqueda (ticket/fecha/total) + paginación + modal de alta + vista de detalle + descarga de PDF. | **Supabase real** — `manifiesto_basuron`, `buques`, `pdfGeneratorBasuron` |
| `/[locale]/dashboard/estadisticas` | Server (`force-dynamic`) | `<DashboardClient>`: KPIs, gráficas **hechas a mano** (barras CSS, donut SVG), comparación contra el período anterior, panel de "Impacto Ambiental" y pestaña **Reportes** (RPC `get_reporte_detallado` → export CSV / Excel / PDF impreso). | **Supabase real** — `dashboard_stats`, `buques` |
| `/[locale]/dashboard/personas` | Client | CRUD de personas: `PersonasTable`, `CreatePersonaModal`, búsqueda, filtro por tipo, alerta de "registro incompleto", borrado con manejo de violación de FK. | **Supabase real** — `personas`, `tipos_persona` |
| `/[locale]/dashboard/embarcaciones` | Client | CRUD de buques: `EmbarcacionesTable`, `CreateEmbarcacionModal`, búsqueda, filtro por estado, alerta de registro incompleto. | **Supabase real** — `buques` |
| `/[locale]/dashboard/asociaciones` | Client | UI de 4 pestañas: **Inventario** / **Solicitudes** / **Empresas** / **Chat**. | ⚠️ **MOCK** — `lib/mock/asociaciones.ts`. `page.tsx.bak` al lado es la versión real anterior (usaba `lib/services/asociaciones`). |
| `/[locale]/dashboard/simple` | Client | **"Modo simple"** para usuarios no técnicos (Don Francisco): botones grandes, `SimpleManifiestoForm` + `SimpleEstadisticas`, navbar propia. El botón "Basurón" hace `router.push('/dashboard/manifiesto-basuron')` (sin prefijo de locale — el middleware lo re-prefija). | **Supabase real** vía componentes `simple/` |
| `/[locale]/dashboard-recolector` | Client, **layout propio** | Portal de la empresa recolectora. Sub-rutas: `page` (home con KPIs + `PortMap`), `mapa` (mapa Leaflet con filtros), `solicitudes`, `historial`, `impacto` (gráficas Recharts), `notificaciones`, `perfil`, `configuracion`. | ⚠️ **100% MOCK** — `lib/mock/recolector.ts`; las acciones se "simulan" con `toast`. |

**Resumen:** el área de administración es real (Supabase) **excepto `asociaciones` (mock)**; el
**portal recolector completo es un prototipo con datos ficticios**.

---

## 7. Autenticación y roles

- **Supabase Auth** con correo + contraseña y OTP. `components/auth/LoginForm.tsx` es un único
  componente con 5 vistas: `login`, `register` (guarda `full_name` en metadata), `verify` (OTP
  de alta), `forgot_password`, `reset_password` (OTP de recuperación + `updateUser`).
- Al iniciar sesión se ejecuta `onSuccess?.()` y `router.push(redirectTo); router.refresh()`.
- El trigger `handle_new_user()` crea una fila en `profiles` a partir de `auth.users`.

### Los dos "roles" de la aplicación

| Rol | Nombre en la UI | Destino |
|---|---|---|
| `admin` | Administrador Portuario | `/dashboard` |
| `recolector` | Empresa Recolectora | `/dashboard-recolector` |

⚠️ **No es un control de acceso real (RBAC).**

- El rol lo **elige el propio usuario** en `/login` (o en el modal de la landing).
- Se guarda **sólo** en la cookie `dck_user_role` (no `httpOnly`, `SameSite=Lax`, 1 año) y en
  `localStorage`. **Nunca se guarda ni se valida contra Supabase.**
- `updateSession()` (en `utils/supabase/middleware.ts`) **sólo comprueba que exista un `user`**
  de Supabase, y protege **cualquier ruta cuyo pathname contenga la subcadena `/dashboard`**
  (cubre tanto `/dashboard` como `/dashboard-recolector`).
- La cookie de rol **sólo decide el destino del redirect** tras el login. Cualquier usuario
  autenticado puede entrar a ambas áreas y la cookie es trivialmente modificable.

### RLS

Las políticas de Row Level Security en la práctica son **muy permisivas**: `manifiestos`,
`manifiestos_residuos` y `manifiesto_basuron` usan `USING (true)`; `buques`, `personas`,
`asociaciones_recolectoras` y `tipos_persona` sólo exigen `auth.role() = 'authenticated'` para
`SELECT`. Varios `fix_*_rls.sql` / `debug_*.sql` en la raíz abrieron los buckets y políticas
durante el desarrollo.

---

## 8. Modelo de datos (Supabase / PostgreSQL)

**Fuente de verdad del esquema** (de mayor a menor autoridad):

| Archivo | Contenido |
|---|---|
| `estructura_completa.sql` (74 KB, ago-2026) | `pg_dump` completo: tablas + funciones + triggers + RLS + FKs. Incluye `responsable_liquidos_id`, `audit_log`, `backups`, y **un sistema POS/restaurante ajeno**. |
| `ESQUEMA_BD_COMPLETO.sql` (abr-2026) | Esquema DCK curado + auth + POS. Sin `responsable_liquidos_id`. |
| `Base_de_datos.sql` | Sólo tablas DCK, para contexto rápido. |
| `ESQUEMA_COMPLETO_BASE_DATOS.sql`, `zTablas.sql` | Diseño **original**, con tablas ya eliminadas. **Obsoletos.** |
| `LIMPIAR_TABLAS_INNECESARIAS.sql` | Elimina `tipos_residuos`, `usuarios_sistema`, `cumplimiento`, `residuos`, `reutilizacion_residuos`. |
| Migraciones sueltas | `ACTUALIZAR_MANIFIESTOS*.sql`, `AGREGAR_CAMPO_REGISTRO_COMPLETO.sql`, `add_pdf_column*.sql`, `adapt_basuron_standalone.sql`. |
| Auth / Storage | `supabase_auth_setup.sql`, `manifiestos_bucket.sql`, `manifiestos_basuron_bucket.sql`, `CREAR_BUCKET_MANIFIESTOS*.sql`. |

### Tablas vigentes del dominio (esquema `public`)

| Tabla | Columnas clave | Relaciones / notas |
|---|---|---|
| `tipos_persona` | `id`, `nombre_tipo` (unique), `descripcion` | Catálogo de roles de persona. |
| `personas` | `id`, `nombre`, `tipo_persona_id`, `info_contacto`, `registro_completo` | `tipo_persona_id` → `tipos_persona` (`ON DELETE SET NULL`). `registro_completo = false` ⇒ auto-creada desde un manifiesto. |
| `buques` | `id`, `nombre_buque` (unique), `tipo_buque`, `propietario_id`, `matricula` (unique), `puerto_base`, `capacidad_toneladas`, `estado`, `registro_completo` | `propietario_id` → `personas`. `estado` ∈ `Activo` / `Inactivo` / `En Mantenimiento`. |
| `asociaciones_recolectoras` | `id`, `nombre_asociacion` (unique), `tipo_asociacion`, `contacto_asociacion`, `email`, `telefono`, `direccion`, `certificaciones[]`, `especialidad[]`, `estado` | `estado` ∈ `Activo` / `Inactivo` / `Suspendido`. **Servicio CRUD existe; la UI usa mock.** |
| `manifiestos` | `id`, `numero_manifiesto` (unique), `fecha_emision`, `buque_id`, `responsable_principal_id`, `responsable_secundario_id`, `responsable_liquidos_id`, `imagen_manifiesto_url`, `pdf_manifiesto_url`, `estado_digitalizacion`, `digitalizador_id`, `fecha_digitalizacion`, `observaciones` | `buque_id` → `buques`; los `responsable_*_id` → `personas`. `responsable_principal` = motorista, `responsable_secundario` = cocinero, `responsable_liquidos` = responsable de líquidos (sólo en `estructura_completa.sql`). `estado_digitalizacion` ∈ `pendiente` / `en_proceso` / `completado`. |
| `manifiestos_residuos` | `id`, `manifiesto_id` (unique), `aceite_usado` (num, litros), `filtros_aceite` (int), `filtros_diesel` (int), `filtros_aire` (int), `basura` (num, kg), `observaciones` | **1:1** con `manifiestos` (`ON DELETE CASCADE`). Todos los valores `CHECK >= 0`. |
| `manifiesto_basuron` | `id`, `fecha`, `hora_entrada`, `hora_salida`, `peso_entrada`, `peso_salida`, `total_depositado` (**GENERATED** = `peso_entrada − COALESCE(peso_salida,0)`), `buque_id`, `recibimos_de`, `direccion`, `recibido_por`, `nombre_usuario`, `pdf_manifiesto_url`, `observaciones` | `buque_id` → `buques` (opcional, `ON DELETE CASCADE`). Variantes del esquema añaden `estado` (`En Proceso`/`Completado`/`Cancelado`) y `numero_ticket` (`TKT-YYYYMMDD-NNNNNN` por trigger). |
| `manifiestos_no_firmados` | `id`, `manifiesto_id`, `nombre_archivo`, `ruta_archivo`, `url_descarga`, `numero_manifiesto`, `fecha_generacion`, `estado`, `descargado_en/por`, `firmado_en` | Metadatos de PDFs generados pendientes de firma física. `estado` ∈ `pendiente`/`descargado`/`firmado`/`cancelado`. **El servicio existe pero ninguna página lo usa.** |
| `bitacora` | `id`, `fecha_registro`, `id_embarcacion`, `usuario_email`, `accion` | Log. Poblada por trigger al crear un buque + función `registrar_bitacora_embarcacion(...)`. |
| `profiles` | `id` (uuid, = `auth.users.id`), `email`, `full_name`, `avatar_url` | 1:1 con `auth.users`. Trigger `handle_new_user()`. |
| `audit_log` | `tabla`, `operacion`, `registro_id`, `datos_ant` (jsonb), `datos_nue` (jsonb), `usuario_email` | Poblada por `audit_trigger_fn()` en las 7 tablas del dominio. |
| `backups`, `backup_schedules` | — | Metadatos de respaldos. |

### Tablas que **NO** son de SiMAR

En el mismo proyecto Supabase conviven las tablas de un **sistema POS / restaurante** ajeno:
`tenants`, `users`, `categories`, `products`, `orders`, `order_items`. **Ignorarlas.**

### Tablas eliminadas todavía referenciadas por el código

`tipos_residuos` y `usuarios_sistema` fueron eliminadas, pero algunos `select` embebidos en
`lib/services/manifiestos.ts` (`getManifiestoResiduos`) y `lib/services/manifiesto_basuron.ts`
(`getManifiestoBasuronByTicket`, filtros por fecha/rango) todavía las piden — esas consultas
fallan o devuelven vacío contra la BD actual.

### Funciones RPC de PostgreSQL

| Función | Uso |
|---|---|
| `get_reporte_detallado(p_fecha_inicio, p_fecha_fin, p_buque_id, p_estado)` | **Usada por `dashboard_stats.getReporteComplejo`** — reporte detallado (UNION de aceite, 3× filtros, basura, tickets de basurón). |
| `get_dashboard_kpis()` | Sólo la usa el script suelto `debug_dashboard_data.ts`. |
| `get_monthly_waste_stats(months_limit)` | Ídem. |
| `get_chart_data(p_year, p_month)`, `get_top_buques_waste(limit_count)` | Definidas; sin llamada directa en `lib/`. |
| Triggers | `generar_numero_ticket()`, `handle_new_user()`, `handle_new_buque_bitacora()`, `audit_trigger_fn()`, varios `*_updated_at`. |

### Buckets de Supabase Storage

| Bucket | Público | Contenido | Usado por |
|---|---|---|---|
| `manifiestos_img` | Sí | Fotos / escaneos del manifiesto físico | `lib/services/storage.ts` |
| `manifiestos_pdf` | Sí (los `fix_*` lo dejan público; empieza en 5 MB, `application/pdf`) | PDF del manifiesto (generado o escaneado) | `lib/services/storage.ts` |
| `manifiestos_basuron_pdf` | Sí | Escaneo + PDF final del recibo de relleno sanitario | `lib/services/manifiesto_basuron.ts` |
| `manifiestos-no-firmados` (con guiones) | No | PDFs generados pendientes de firma; **signed URLs** (1 h); carpeta por año | `lib/services/manifiestos_no_firmados.ts` |
| `images` | Sí | Contiene `logoSemarnat.png`, que leen los generadores de PDF | `lib/utils/pdfGenerator*.ts` |

---

## 9. Capa de servicios (`lib/services/*`)

Wrappers finos sobre Supabase. Patrón general: `const { data, error } = await supabase...; if
(error) throw error; return data`.

| Archivo | Funciones principales |
|---|---|
| `buques.ts` | `getBuques(supabase?)` (acepta cliente inyectado para RSC), `getBuqueById`, `createBuque`, `updateBuque`, `deleteBuque`, `searchBuques` (nombre \| matrícula), `getBuquesByEstado`, **`createBuqueAutomatico(nombre)`** (crea el buque referido en un manifiesto si no existe), `getBuquesIncompletos`. |
| `personas.ts` | CRUD + `searchPersonas`, `getPersonasByTipo`, **`createPersonaAutomatica(nombre, tipoId)`** (`registro_completo = false`), `getPersonasIncompletas`, **`getOrCreateTipoPersona(nombreTipo)`**. |
| `tipos_persona.ts` | CRUD de `tipos_persona`. |
| `manifiestos.ts` | **`generarNumeroManifiesto(fecha)`** → `MAN<ddmmaaaa><NNN>`; `getManifiestos()` (filas → relaciones embebidas → join en JS con `manifiestos_residuos`); `getManifiestoById`; **`createManifiesto(manifiesto, residuos?, archivo?, pdfFile?, numeroPredefinido?)`** (resuelve el folio, sube imagen/PDF a los buckets en paralelo, inserta `manifiestos` + `manifiestos_residuos`, marca `estado_digitalizacion = 'completado'` si hubo archivo); `updateManifiesto` (upsert de residuos `onConflict: 'manifiesto_id'`); `deleteManifiesto`; `getManifiestosByEstado`, `getManifiestosByBuque`. |
| `manifiesto_basuron.ts` | CRUD; **`completarManifiestoBasuron(id, pesoSalida)`** (fija `peso_salida`, `estado = 'Completado'`, genera y sube el PDF final); filtros por buque / fecha / rango / ticket; `getManifiestosEnProceso`; `getEstadisticasManifiestosBasuron` (agrega totales en JS). |
| `manifiestos_no_firmados.ts` | CRUD + flujo de estados (`marcarComoDescargado`, `marcarComoFirmado`) + `uploadPDFToStorage` (carpeta por año) + `getDownloadURL` (signed 1 h). **Sin consumidores.** |
| `storage.ts` | `uploadManifiestoImage` (`manifiestos_img`), `uploadManifiestoPDF` (`manifiestos_pdf`), `deleteManifiestoImage`, `getManifiestoImageUrl`. |
| `dashboard_stats.ts` | Recibe `supabase` como argumento. `calcularRangoFechas(periodo, ...)`; `getDashboardKPIs` (usa `count exact head` + suma en JS con `limit(100_000)` para saltar el tope de 1000 filas de Supabase); `getDashboardKPIsFiltered`; `getComparacionPeriodoAnterior`; `getDashboardStats` (residuos por mes, top buques, distribución por tipo); **`getReporteComplejo`** → RPC `get_reporte_detallado`. `PeriodoFiltro = semana \| mes \| trimestre \| anio \| todo \| personalizado`. |
| `landing_stats.ts` | `getLandingStats(supabase)` — totales históricos para la landing (`totalManifiestos`, `totalAceiteUsado`, `totalBasura`, `totalBasuron`, `filtrosAceite/Diesel/Aire`). |
| `reportes.ts` | `getReporteResiduosPorFechas`, `getTotalesGenerales`. ⚠️ **`saveFirmaDigital(...)` es un stub sin efecto** — no existe la columna correspondiente en la BD. |
| `asociaciones.ts` | CRUD de `asociaciones_recolectoras`. **Sólo lo referencia `asociaciones/page.tsx.bak`.** |

### Tipos (`types/`)

- **`types/database.ts` es el autoritativo** (forma exacta de las filas de Supabase, lo usan
  todos los servicios): `Buque`, `Persona` / `PersonaConTipo`, `TipoPersona`, `Manifiesto` /
  `ManifiestoConRelaciones`, `ManifiestoResiduo`, `ManifiestoBasuron` / `...ConRelaciones`,
  `AsociacionRecolectora`, `ManifiestoNoFirmado` / `...ConRelaciones`.
- `types/dashboard.ts` — KPIs, `DashboardStats`, `ReporteDetalladoItem`, `Comparaciones`, etc.
- **Tipos legacy** con otra forma, usados por `lib/data.ts` (mock) y pantallas antiguas:
  `embarcacion.ts`, `persona.ts`, `manifiesto.ts`, `asociacion.ts`. `usuario.ts` no lo usa
  nadie. `images.d.ts` tipa los `import` de PNG.

### Datos mock todavía activos

- `lib/mock/recolector.ts` — **alimenta todo `/dashboard-recolector`** (9 puertos con lat/lng,
  solicitudes, historial, notificaciones, KPIs, perfil de empresa; `TipoResiduo = plastico |
  aceite | carton | chatarra | vidrio | organico`). Cabecera del archivo: *"Reemplazar por
  queries a Supabase cuando el modelo esté disponible."*
- `lib/mock/asociaciones.ts` — **alimenta la UI de `/dashboard/asociaciones`** (inventario,
  empresas, solicitudes entrantes, conversaciones de chat).
- `lib/data.ts` — datos demo antiguos (embarcaciones/personas/manifiestos); en desuso.

---

## 10. Generación de PDF y firmas

- **Sólo jsPDF**, en el cliente (`doc.output('blob')`). `html2canvas` está instalado pero **no
  se usa**.
- **`lib/utils/pdfGenerator.ts`** → `generarPDFManifiesto(manifiesto, firmas?)`. Reproduce el
  formato físico *"MANIFIESTO DE ENTREGA-RECEPCIÓN — Basura y Residuos Aceitosos (MARPOL Anexo
  V)"* del centro de acopio. Logos: SEMARNAT (desde el bucket `images`), DCK
  (`@/Contexto-DCK/logo_DCK.png`), escudo de México como marca de agua al 5 %
  (`@/Contexto-DCK/escudo_mexico.png`). `FirmasManifiesto` = `{ motorista, cocinero, oficial,
  liquidos }` (nombre + imagen). Las firmas llegan como **data URLs base64 PNG** desde
  `SignaturePad` / el `<canvas>` propio de la pantalla, y se insertan con `doc.addImage`.
  Nombre del archivo: `manifiesto_{numero}_{YYYY-MM-DD}.pdf`.
- **`lib/utils/pdfGeneratorBasuron.ts`** → `generarPDFBasuron(manifiesto)`. Ticket de báscula;
  la línea de firma va **vacía** (sin imagen). Nombre: `Manifiesto_Basuron_{id}_{YYYY-MM-DD}.pdf`.
- **`components/ui/SignaturePad.tsx`** — captura de firma en `<canvas>` (resolución interna
  600×N), soporta **mouse y touch**, `forwardRef` que expone `{ clear(), isEmpty(), toDataURL()
  }`. Lo usan `CreateManifiestoModal` (3 firmas) y `SimpleManifiestoForm` (1). La pantalla
  grande `app/[locale]/dashboard/manifiesto/page.tsx` implementa **su propia** lógica de firma
  en canvas (motorista/cocinero/oficial/líquidos) con un modal flotante, en lugar de reutilizar
  `SignaturePad`.
- La pestaña **Reportes** de `DashboardClient` genera un "PDF" abriendo una ventana HTML y
  llamando `window.print()` (no jsPDF).
- Guías detalladas en la raíz: `GUIA_PDF_MANIFIESTOS.md`, `GUIA_IMAGENES_MANIFIESTOS.md`,
  `MANIFIESTOS_OPTIMIZATION_SUMMARY.md`.

---

## 11. Internacionalización (i18n)

- `i18n.ts` en la raíz (estilo de archivo único de next-intl; **sin** `routing.ts` /
  `navigation.ts`). Locales: `['es', 'en']`, `defaultLocale = 'es'`, `localePrefix: 'always'`.
- `middleware.ts` combina `updateSession` (auth) con el middleware de next-intl.
- `messages/es.json` y `messages/en.json` — misma forma, **5 namespaces**: `Sidebar`,
  `Dashboard`, `Personas`, `Embarcaciones`, `Manifiestos` (~130-140 claves cada uno).
- **Cobertura parcial**: sólo `components/layout/Sidebar.tsx` y las páginas `personas`,
  `embarcaciones` y `manifiesto` llaman `useTranslations`. La landing, el login, `estadisticas`,
  `manifiesto-basuron`, `asociaciones` y **todo el portal recolector están en español
  hardcodeado**.
- **`components/layout/LanguageSwitcher.tsx` existe pero no está montado en ninguna parte** — no
  hay forma de cambiar de idioma desde la UI.
- `messages/es.json` tiene una **clave `"logout"` duplicada** dentro de `Sidebar.menu`.

---

## 12. Tema y sistema de diseño

- **Tema por defecto: oscuro.** `components/layout/ThemeContext.tsx` mantiene `theme` (`light` /
  `dark`), lo persiste en `localStorage.theme` y alterna la clase `.dark` en
  `document.documentElement`. Si no hay nada guardado, fuerza oscuro.
- `app/globals.css` (Tailwind v4) define el modo oscuro **por selector**:
  `@variant dark (&:is(.dark *))`, más variables de tema, estilos personalizados para
  `react-datepicker` y varios keyframes (incluida una sección "LANDING PAGE": `ken-burns`,
  `fade-in-up`, `map-ping`, etc.). Respeta `prefers-reduced-motion`.
- `components/layout/ThemeToggle.tsx` es un botón flotante global (arriba a la derecha), **oculto
  en la landing**.
- Lenguaje visual: **"Glassmorphism elegante"** (transparencia + blur + bordes sutiles), paleta
  azul / gris / blanco, transiciones ≤ 200 ms, espaciado en múltiplos de 4. Documentado en
  `DESIGN_SYSTEM.md` (v2.0), `DESIGN_REFERENCE.md`, `DESIGN_SUMMARY.md`,
  `RESPONSIVE_DESIGN_CHANGES.md`.

---

## 13. Puesta en marcha

### Requisitos

- Node.js **20+**
- Un proyecto **Supabase** (o el existente: `lbdurpdzavrkaxixiprq.supabase.co`)

### Instalación

```bash
npm install
```

### Variables de entorno

Crear `.env.local` en la raíz (el repo ignora `.env*`). El código **sólo lee** dos variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

> El `.env` que hay en la raíz también define `DATABASE_URL` y `SESSION_SECRET`, pero **ningún
> archivo del código las referencia** — son restos del andamiaje inicial.

### Desarrollo

```bash
npm run dev      # http://localhost:3000  → redirige a /es
```

### Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servir el build |
| `npm run lint` | ESLint (`eslint-config-next`) |

### Preparar un Supabase nuevo desde cero

1. Ejecutar el esquema: **`estructura_completa.sql`** (el más completo) en el SQL Editor de
   Supabase. Alternativa mínima DCK: `ESQUEMA_BD_COMPLETO.sql` + `supabase_auth_setup.sql`.
2. Crear los buckets de Storage: `manifiestos_bucket.sql`, `manifiestos_basuron_bucket.sql`,
   `CREAR_BUCKET_MANIFIESTOS.sql`, `CREAR_BUCKET_MANIFIESTOS_NO_FIRMADOS.sql`, y aplicar
   `fix_storage_rls.sql` / `fix_policies.sql` para las políticas.
3. Crear el bucket público **`images`** y subir `logoSemarnat.png` (lo necesitan los generadores
   de PDF).
4. Verificar que las funciones RPC (`get_reporte_detallado`, ...) quedaron creadas.

---

## 14. Despliegue

- Plataforma: **Vercel** (framework Next.js).
- Repositorio: `github.com/LuisMario698/DCK_react`.
- Rama principal: `main`. **Rama que despliega: `online`.**
- Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el panel de Vercel.
- Costos recurrentes del ecosistema (ver `ESTRUCTURA_DE_COSTOS.md`): Supabase (plan Pro),
  Vercel (plan Pro comercial) y el dominio. El resto del stack es open source sin costo de
  licencia.

---

## 15. Estado del proyecto, limitaciones y deuda técnica

Según `BITACORA_PRUEBAS.md` (2026-05-01): **77 procesos probados** (67 backend / 10 frontend),
**74 funcionales**, 3 pendientes. El sistema está operativo para su uso en el centro de acopio.

### Pendientes conocidos

- **`saveFirmaDigital`** (firma del Responsable de Líquidos guardada en el PDF) — pendiente en
  BD y en el módulo de PDF; el servicio es un *stub*.
- **Pantalla de Asociaciones Recolectoras** — el backend (`lib/services/asociaciones.ts` + tabla
  `asociaciones_recolectoras`) está completo, pero la UI corre con **datos mock**.

### Deuda técnica / cosas a saber antes de tocar el código

- **`/dashboard-recolector` completo y `/dashboard/asociaciones` son prototipos con datos mock**
  (`lib/mock/*`), sin persistencia. Las acciones se "simulan" con `toast`.
- **No hay RBAC** — la protección de rutas sólo verifica que haya sesión Supabase; el rol
  `admin`/`recolector` es una cookie de cliente (ver §7).
- **`components/simple/SimpleBasuronForm.tsx` está vacío** (0 bytes).
- **`app/[locale]/dashboard/manifiesto/page.tsx`** (~2250 líneas) es la pantalla real de
  producción y **duplica** buena parte de `components/manifiestos/CreateManifiestoModal.tsx`
  (incluida su propia lógica de firma en canvas).
- **Recharts se usa en un único archivo** (`dashboard-recolector/impacto/page.tsx`); todo lo
  demás son gráficas hechas a mano con divs/SVG. **Leaflet se usa en un único componente**
  (`components/recolector/PortMap.tsx`); el mapa de la landing es SVG puro.
- **Dependencias sin usar**: `html2canvas`, `react-leaflet`, `react-time-picker`,
  `react-time-picker-input`, `browser-image-compression`.
- **Servicios que consultan tablas eliminadas** (`tipos_residuos`, `usuarios_sistema`) — ver §8.
- **Nombres de marca inconsistentes** (SiMAR / CIAD / DCK / CDK) en toda la UI.
- Algunos `router.push` omiten el prefijo de locale (p. ej. en `dashboard/simple`) y dependen
  del middleware para re-prefijar.
- `dashboard/manifiesto-basuron/page.tsx` importa `DashboardLayout` aunque el segmento ya tiene
  layout (doble layout anidado).
- Archivos sueltos en la raíz: `nuevoDiseño.tsx`, `debug_dashboard_data.ts` (script no
  conectado), `app/[locale]/dashboard/asociaciones/page.tsx.bak`.

---

## 16. Mapa de documentación del repositorio

### Vigente y útil

| Archivo | Para qué sirve |
|---|---|
| **`Contexto-DCK/proyecto.md`** | ⭐ Reporte de residencia completo. **El mejor documento de dominio** (problema, marco legal, entrevista con Don Francisco en el Anexo 2, tipos de residuo, campos del manifiesto físico). |
| `Contexto-DCK/contesto-actual.md` | "Archivo vivo" del estado del proyecto (actualizado dic-2025). |
| `Contexto-DCK/guia.md` | Guía de usuario final: cómo crear personas/embarcaciones/asociaciones y el flujo paso a paso del manifiesto. |
| `BITACORA_PRUEBAS.md` | Bitácora de pruebas — lista los 77 procesos backend/frontend y su estado. |
| `DESIGN_SYSTEM.md` | Lenguaje de diseño (glassmorphism, paleta, tipografía, animaciones). |
| `SUPABASE_SERVICES.md` | Ejemplos de uso de la capa de servicios. |
| `ESTRUCTURA_DE_COSTOS.md` | Ecosistema tecnológico y costos recurrentes. |
| `estructura_completa.sql` | `pg_dump` completo — fuente de verdad del esquema. |
| `GUIA_PDF_MANIFIESTOS.md`, `GUIA_IMAGENES_MANIFIESTOS.md`, `MANIFIESTOS_OPTIMIZATION_SUMMARY.md` | Detalle de generación de PDF y manejo de imágenes. |
| `DESIGN_REFERENCE.md`, `DESIGN_SUMMARY.md`, `RESPONSIVE_DESIGN_CHANGES.md` | Complementos de diseño. |

### Obsoleto (no seguir)

| Archivo | Por qué |
|---|---|
| `PROYECTO_README.md` | Estructura antigua sin `[locale]`, módulos descritos como "placeholder". Sustituido por este README. |
| `ESQUEMA_COMPLETO_BASE_DATOS.sql`, `zTablas.sql` | Diseño original con tablas ya eliminadas. |
| `ANALISIS_DISENO_CDK.txt`, `ANALISIS_TABLAS_INNECESARIAS.md`, `RESUMEN_LIMPIEZA_CODIGO.md`, `REDISEÑO_MANIFIESTO.md`, `nuevoDiseño.tsx` | Notas de análisis puntuales ya aplicadas. |
| `GUIA_ACTUALIZACION_MANIFIESTOS*.md` | Guías de migraciones ya ejecutadas. |

### Scripts SQL de mantenimiento (raíz)

Buckets: `manifiestos_bucket.sql`, `manifiestos_basuron_bucket.sql`, `CREAR_BUCKET_MANIFIESTOS*.sql`,
`manifiestos_basuron_bucket.sql`. RLS / debug: `fix_policies.sql`, `fix_storage_rls.sql`,
`fix_basuron_rls.sql`, `debug_policies.sql`, `debug_storage_rls.sql`. Migraciones:
`ACTUALIZAR_MANIFIESTOS*.sql`, `AGREGAR_CAMPO_REGISTRO_COMPLETO.sql`, `add_pdf_column*.sql`,
`adapt_basuron_standalone.sql`, `LIMPIAR_TABLAS_INNECESARIAS.sql`, `EJECUTAR_EN_SUPABASE.sql`.

---

## 17. Créditos

**Sistema desarrollado como residencia profesional del Instituto Tecnológico Superior de Puerto
Peñasco (ITSPP)**, para **DCK — Conciencia y Cultura** y **SEMARNAT**, en el centro de acopio del
recinto portuario de Puerto Peñasco, Sonora.

| Rol | Persona |
|---|---|
| Asesor externo | Francisco Javier Bojórquez Ochoa — SEMARNAT, Puerto Peñasco |
| Asesora interna | Diana Elizabeth López Chacón — ITSPP |
| Estudiante | Quintero Aldana Jesús Manuel |
| Estudiante | Sabori Fernández Miguel Rogelio |
| Estudiante | Suárez Gutiérrez Luis Mario |
| Estudiante | Zamudio Martín Alexa Merary |


