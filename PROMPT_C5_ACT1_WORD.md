# Prompt para Claude Cowork — C5-ACT1 Respaldo y Recuperación (Word)

Copia y pega este prompt en Claude Cowork para generar el documento Word (.docx):

---

## PROMPT

Necesito que generes un documento Word (.docx) para una actividad académica de la materia **Administración de Bases de Datos** del Instituto Tecnológico Superior de Puerto Peñasco (ITSPP).

---

### Datos del documento:

**Materia:** Administración de Bases de Datos (ABD)
**Actividad:** C5-ACT1 — Respaldo y Recuperación
**Institución:** Instituto Tecnológico Superior de Puerto Peñasco (ITSPP)
**Proyecto Integrador:** Sistema web para el registro de datos y visualización de estadísticas de residuos marinos en embarcaciones de Puerto Peñasco, Sonora (DCK / SEMARNAT)
**Fecha:** 2026-05-05

**Equipo:**
| Estudiante | No. Control |
|---|---|
| Quintero Aldana Jesús Manuel | — |
| Sabori Fernández Miguel Rogelio | — |
| Suárez Gutiérrez Luis Mario | — |
| Zamudio Martín Alexa Merary | — |

---

### Estructura del documento (4 secciones obligatorias):

---

## SECCIÓN 1 — Método de seguridad elegido

**Título:** Row Level Security (RLS) con autenticación JWT — Supabase/PostgreSQL

**Contenido a redactar:**

El método de seguridad de base de datos que se aplica en el proyecto integrador DCK_React es **Row Level Security (RLS)**, implementado en Supabase sobre PostgreSQL. Este mecanismo permite controlar, a nivel de fila, qué usuarios pueden leer, insertar, actualizar o eliminar datos, directamente desde la base de datos — sin depender únicamente del código de la aplicación.

En el proyecto, RLS se implementa en dos capas:

**Capa 1 — Tablas de datos:**
Las tablas de perfiles de usuario (`profiles`) tienen RLS habilitado con políticas que garantizan que cada usuario solo pueda ver y modificar su propia información, validado mediante `auth.uid()` (token JWT de Supabase Auth).

**Capa 2 — Storage de archivos (buckets):**
Los buckets donde se almacenan los PDFs de manifiestos de residuos y manifiestos de basurón (`manifiestos_pdf`, `manifiestos_basuron_pdf`) están protegidos con políticas RLS diferenciadas:

| Operación | Quién puede ejecutarla |
|---|---|
| SELECT (descargar/ver PDF) | Cualquier persona (público, necesario para links descargables) |
| INSERT (subir PDF) | Solo usuarios autenticados |
| UPDATE (reemplazar PDF) | Solo usuarios autenticados |
| DELETE (eliminar PDF) | Solo usuarios autenticados |

Adicionalmente, las operaciones de escritura sobre los datos del sistema (registros de manifiestos, embarcaciones, personas) requieren sesión activa con token JWT válido emitido por Supabase Auth.

---

## SECCIÓN 2 — Requerimientos de software y hardware

**Título:** Requerimientos para implementar RLS en el proyecto DCK_React

### Requerimientos de Software:

| Componente | Tecnología / Versión | Rol en la seguridad |
|---|---|---|
| Base de datos | PostgreSQL 15+ (gestionado por Supabase) | Motor que ejecuta las políticas RLS |
| Plataforma BaaS | Supabase (cloud) | Gestiona auth, RLS, storage y API automáticamente |
| Autenticación | Supabase Auth (basado en JWT / OAuth 2.0) | Emite tokens de sesión que RLS valida |
| Framework frontend | Next.js 14+ con App Router | Consume la API protegida de Supabase |
| Librería cliente | @supabase/supabase-js v2 | Envía el token JWT en cada petición |
| Lenguaje | TypeScript | Tipado seguro en los servicios de datos |
| Middleware | next-intl + middleware.ts de Next.js | Protege rutas del dashboard a nivel de aplicación |
| Sistema de archivos | Supabase Storage (S3-compatible) | Almacena PDFs con políticas RLS propias |

### Requerimientos de Hardware:

Dado que el proyecto utiliza **Supabase como servicio en la nube (BaaS)**, la infraestructura de hardware es gestionada por Supabase/AWS. Los requerimientos mínimos del lado del equipo de desarrollo son:

| Componente | Mínimo recomendado |
|---|---|
| Computadora de desarrollo | Procesador de 4 núcleos, 8 GB RAM |
| Almacenamiento local | 20 GB libres (proyecto + dependencias npm) |
| Conexión a internet | 10 Mbps estable (para consumir la API de Supabase) |
| Servidor en producción | Gestionado por Supabase (plan gratuito soporta el proyecto) |
| Almacenamiento de archivos | Bucket Supabase Storage (hasta 1 GB en plan gratuito) |

> **Nota:** No se requiere servidor físico propio. Supabase opera en infraestructura de AWS con disponibilidad 99.9%, lo que incluye respaldo automático de la base de datos cada 24 horas en el plan gratuito.

---

## SECCIÓN 3 — Forma de mantener la seguridad en la base de datos

**Título:** Estrategia de mantenimiento de seguridad con RLS

Describe los siguientes puntos en párrafos:

**3.1 Revisión periódica de políticas RLS:**
Las políticas RLS deben revisarse cada vez que se agrega una nueva tabla o bucket al sistema. En el proyecto DCK_React, al crear un nuevo módulo (por ejemplo, Asociaciones Recolectoras), se ejecuta `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY` y se definen las políticas correspondientes antes de exponer el endpoint.

**3.2 Principio de mínimo privilegio:**
Cada política solo otorga los permisos estrictamente necesarios. Por ejemplo, la lectura pública de PDFs se permite únicamente en los buckets de manifiestos (no en tablas de datos sensibles). Las operaciones de escritura siempre requieren `auth.uid()` válido.

**3.3 Monitoreo con logs de Supabase:**
Supabase provee un panel de logs en tiempo real donde se pueden detectar intentos de acceso no autorizado, errores de políticas RLS (`42501 - insufficient_privilege`) y consultas anómalas. Se recomienda revisar los logs semanalmente.

**3.4 Rotación de claves API:**
Las claves `anon key` y `service_role key` de Supabase se almacenan como variables de entorno (`.env.local`) y nunca se exponen en el repositorio público. Se recomienda rotar las claves si se detecta una fuga.

**3.5 Respaldo automático:**
Supabase realiza backups automáticos diarios de la base de datos PostgreSQL. Para el proyecto, se complementa con exportaciones manuales del esquema SQL (`ESQUEMA_BD_COMPLETO.sql`) almacenadas en el repositorio como documentación de recuperación ante desastres.

**3.6 Autenticación multifactor (futuro):**
Como mejora propuesta, se podría habilitar MFA (Multi-Factor Authentication) en Supabase Auth para los administradores del sistema, añadiendo una capa adicional de protección al acceso del panel de control.

---

## SECCIÓN 4 — Descripción del procedimiento para implementar RLS

**Título:** Procedimiento de implementación de Row Level Security en el proyecto DCK_React

Redacta esto como una descripción paso a paso del procedimiento (no se requiere interfaz gráfica nueva, se describe el proceso en Supabase Dashboard):

**Paso 1 — Habilitar RLS en la tabla:**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Paso 2 — Crear política de lectura (SELECT):**
```sql
CREATE POLICY "Perfiles visibles para todos"
ON profiles FOR SELECT
USING (true);
```

**Paso 3 — Crear política de inserción (INSERT):**
```sql
CREATE POLICY "Usuarios insertan su propio perfil"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

**Paso 4 — Crear política de actualización (UPDATE):**
```sql
CREATE POLICY "Usuarios actualizan su propio perfil"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Paso 5 — Configurar políticas en Storage para manifiestos PDF:**
```sql
-- Lectura pública (para links descargables)
CREATE POLICY "Public Select Manifiestos PDF"
ON storage.objects FOR SELECT
USING (bucket_id = 'manifiestos_pdf');

-- Solo autenticados pueden subir/modificar/eliminar
CREATE POLICY "Auth Insert Manifiestos PDF"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manifiestos_pdf');

CREATE POLICY "Auth Update Manifiestos PDF"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'manifiestos_pdf');

CREATE POLICY "Auth Delete Manifiestos PDF"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'manifiestos_pdf');
```

**Paso 6 — Verificar políticas activas:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

**Paso 7 — Configurar variables de entorno en Next.js:**
```
NEXT_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

**Paso 8 — Inicializar cliente Supabase en el frontend (TypeScript):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

A partir de este punto, todas las peticiones al servidor incluyen automáticamente el token JWT del usuario, y PostgreSQL aplica las políticas RLS para filtrar o restringir el acceso a los datos según el usuario autenticado.

**Diagrama de flujo del procedimiento (incluir en el documento como figura):**

Describe o dibuja el siguiente flujo:
```
Usuario → Login (Supabase Auth) → Token JWT
    ↓
Petición a la API (con JWT en header)
    ↓
Supabase verifica auth.uid()
    ↓
PostgreSQL aplica política RLS
    ↓
¿Cumple la política? → SÍ → Devuelve datos
                     → NO  → Error 403 (insufficient_privilege)
```

---

### Estilos Word solicitados:

- **Fuente:** Calibri 11pt (texto) / 13pt (títulos de sección)
- **Encabezados de sección:** Azul oscuro (#003366), negrita
- **Bloques de código SQL:** fuente monoespaciada (Courier New 10pt), fondo gris claro
- **Tablas:** bordes grises, encabezados con fondo azul claro (#D6E4F0)
- **Márgenes:** 2.54 cm todos los lados
- **Interlineado:** 1.5 líneas
- **Saltos de página:** antes de cada sección numerada

### Archivo de salida:

Nombre: `C5_ACT1_RLS_Respaldo_Recuperacion.docx`
Listo para imprimir y entregar.

---

## FIN DEL PROMPT

Pega esto completo en Claude Cowork y solicítale que genere el archivo Word.
