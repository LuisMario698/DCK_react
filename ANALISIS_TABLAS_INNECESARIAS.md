# Análisis de Tablas Innecesarias en la Base de Datos

Este documento detalla las tablas definidas en `zTablas.sql` que, tras un análisis del proyecto, se consideran innecesarias para el funcionamiento actual de la aplicación.

## Resumen

Las siguientes tablas han sido identificadas como candidatas para ser eliminadas:

1.  `tipos_residuos`
2.  `residuos`
3.  `usuarios_sistema`
4.  `cumplimiento`
5.  `reutilizacion_residuos`

A continuación se detalla el razonamiento para cada una.

---

## 1. Tabla `tipos_residuos`

**Definición en SQL:**
```sql
CREATE TABLE IF NOT EXISTS tipos_residuos (
    id BIGSERIAL PRIMARY KEY,
    nombre_tipo TEXT NOT NULL UNIQUE,
    metrica TEXT,
    -- ... otros campos
);
```

**Motivo para considerarla innecesaria:**

*   **Modelo de Datos Rígido y Eficiente:** El sistema evolucionó de un modelo dinámico de "tipos de residuos" a uno estático y más eficiente. La tabla `manifiestos_residuos` ahora tiene columnas fijas y predefinidas (`aceite_usado`, `filtros_aceite`, `filtros_diesel`, `basura`).
*   **Lógica de Frontend Simplificada:** Este cambio simplifica enormemente la lógica en el frontend. En lugar de tener que hacer una consulta extra para obtener los tipos de residuos y luego construir un formulario dinámico, el formulario ahora tiene campos fijos que se mapean directamente a las columnas de la tabla.
*   **Servicio Obsoleto:** El archivo `lib/services/tipos_residuos.ts` existe, pero no es importado ni utilizado en ninguna parte de la aplicación, confirmando que esta lógica ha sido abandonada.

**Conclusión:** La tabla `tipos_residuos` es la base de un modelo de datos que fue descartado en favor de una estructura más simple y directa en `manifiestos_residuos`.

---

## 2. Tabla `residuos`

**Definición en SQL:**
```sql
CREATE TABLE IF NOT EXISTS residuos (
    id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT REFERENCES buques(id),
    tipo_residuo_id BIGINT REFERENCES tipos_residuos(id),
    cantidad_generada NUMERIC(10, 2),
    -- ... otros campos
);
```

**Motivo para considerarla innecesaria:**

*   **Tabla Intermedia Obsoleta:** Esta tabla funcionaba como un punto intermedio para registrar cada tipo de residuo generado por un buque, vinculando `buques` con `tipos_residuos`.
*   **Reemplazada por `manifiestos_residuos`:** Toda esta funcionalidad ha sido absorbida y simplificada por la tabla `manifiestos_residuos`. En lugar de tener múltiples filas por manifiesto (una por cada tipo de residuo), ahora hay una única fila en `manifiestos_residuos` por cada manifiesto, con la cantidad de cada tipo de residuo en su propia columna.
*   **Página de Dashboard Inactiva:** La página `app/dashboard/residuos/page.tsx` existe pero, al igual que otras, es un marcador de posición sin funcionalidad real, y su servicio asociado (`residuos.ts`) no se utiliza.

**Conclusión:** La tabla `residuos` es el componente central del modelo de datos obsoleto y ya no tiene ninguna función en el sistema actual.

---

## 3. Tabla `usuarios_sistema`

**Definición en SQL:**
```sql
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario TEXT NOT NULL UNIQUE,
    rol TEXT DEFAULT 'Usuario' CHECK (rol IN ('Administrador', 'Usuario', 'Supervisor', 'Inspector')),
    email TEXT UNIQUE NOT NULL,
    hash_contraseña TEXT NOT NULL,
    -- ... otros campos
);
```

**Motivo para considerarla innecesaria:**

*   **Autenticación Delegada a Supabase Auth:** El proyecto ya utiliza el sistema de autenticación integrado de Supabase (`supabase.auth.users`). Este sistema gestiona de forma segura los usuarios, roles, emails, contraseñas y sesiones. Mantener una tabla `usuarios_sistema` separada es redundante, introduce complejidad y puede generar inconsistencias de seguridad.
*   **Ausencia de Lógica de Servicio:** No existe un archivo `lib/services/usuarios.ts` o similar que interactúe con esta tabla. Toda la lógica de autenticación y gestión de perfiles de usuario se maneja a través de las funciones de Supabase Auth y, en algunos casos, se vincula a la tabla `personas`.
*   **Complejidad Innecesaria:** Duplicar la gestión de usuarios obligaría a sincronizar manualmente los registros entre `auth.users` y `usuarios_sistema`, lo cual es propenso a errores.

**Conclusión:** La tabla `usuarios_sistema` es redundante y su funcionalidad es cubierta de manera más robusta y segura por el servicio de autenticación de Supabase.

---

## 4. Tabla `cumplimiento`

**Definición en SQL:**
```sql
CREATE TABLE IF NOT EXISTS cumplimiento (
    id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT REFERENCES buques(id),
    fecha_inspeccion DATE,
    observaciones TEXT,
    usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id),
    -- ... otros campos
);
```

**Motivo para considerarla innecesaria:**

*   **Sin Interfaz de Usuario:** Dentro de la estructura de la aplicación en `app/dashboard/`, no existe una sección, página o componente dedicado a la gestión de "Cumplimiento" o inspecciones. Las secciones actuales son: `asociaciones`, `embarcaciones`, `manifiesto`, `manifiesto-basuron`, `personas`, `residuos` y `reutilizacion`.
*   **Sin Lógica de Servicio Activa:** Aunque existe un archivo `lib/services/cumplimiento.ts`, una revisión del código revela que no está siendo importado ni utilizado en ninguna de las páginas principales de la aplicación. Parece ser un remanente de una funcionalidad planeada pero no implementada.
*   **Dependencia de Tabla Innecesaria:** La tabla `cumplimiento` tiene una clave foránea (`usuario_sistema_id`) que apunta a `usuarios_sistema`, otra tabla identificada como innecesaria.

**Conclusión:** La funcionalidad de `cumplimiento` no está implementada en la interfaz de usuario actual. La tabla y su servicio asociado no tienen un uso práctico en el estado actual del proyecto.

---

## 5. Tabla `reutilizacion_residuos`

**Definición en SQL:**
```sql
CREATE TABLE IF NOT EXISTS reutilizacion_residuos (
    id BIGSERIAL PRIMARY KEY,
    residuo_id BIGINT REFERENCES residuos(id),
    asociacion_id BIGINT REFERENCES asociaciones_recolectoras(id),
    fecha_reutilizacion DATE,
    cantidad_reutilizada NUMERIC(10, 2),
    -- ... otros campos
);
```

**Motivo para considerarla innecesaria:**

*   **Sin Interfaz de Usuario:** Al igual que con `cumplimiento`, no hay una sección en el dashboard para gestionar la "Reutilización de Residuos". La página `app/dashboard/reutilizacion/page.tsx` existe, pero su contenido es un marcador de posición y no implementa ninguna lógica para interactuar con esta tabla.
*   **Dependencia de Modelo de Datos Descartado:** Esta tabla depende de `residuos`, que, como bien mencionaste, es una tabla que ya no se ajusta al modelo actual. El sistema ahora registra los residuos directamente en `manifiestos_residuos` con columnas fijas (`aceite_usado`, `filtros_aceite`, etc.), en lugar de un modelo flexible de "tipos de residuo".
*   **Lógica de Servicio Aislada:** El archivo `lib/services/reutilizacion.ts` existe pero no es utilizado por ninguna página funcional, lo que confirma que esta característica no está activa.

**Conclusión:** La tabla `reutilizacion_residuos` está ligada a un modelo de datos (`residuos` y `tipos_residuos`) que ha sido reemplazado por una estructura más simple en `manifiestos_residuos`. Por lo tanto, ha quedado obsoleta.

---

## Tablas que **SÍ** se utilizan

Para confirmar, las siguientes tablas son **esenciales** para el funcionamiento de la aplicación y no deben ser eliminadas:

*   `tipos_persona`
*   `personas`
*   `buques`
*   `asociaciones_recolectoras`
*   `manifiestos`
*   `manifiestos_residuos`
*   `manifiesto_basuron`

Estas tablas tienen sus correspondientes servicios en `lib/services` y son utilizadas activamente en las diferentes secciones del dashboard.

---

## Análisis de la Tabla `manifiesto_basuron` (Actualizado)

Tras una revisión más detallada, se ha confirmado que la tabla `manifiesto_basuron` **SÍ está en uso**, pero su definición original en `zTablas.sql` era incorrecta y no se alineaba con las necesidades reales de la aplicación. 

### Diagnóstico de la Estructura Original

**Definición Original (Incorrecta):**
```sql
CREATE TABLE IF NOT EXISTS manifiesto_basuron (
    -- ...
    usuario_sistema_id BIGINT REFERENCES usuarios_sistema(id),
    tipo_residuo_id BIGINT REFERENCES tipos_residuos(id),
    -- ... y otras columnas innecesarias como hora_entrada, numero_ticket
);
```

**Problemas Identificados:**

1.  **Referencia Incorrecta a `usuario_sistema_id`:** Se aclaró que este campo no debía apuntar a una tabla de `usuarios_sistema`, sino a un **responsable** de la tabla `personas`.
2.  **Dependencia Obsoleta de `tipo_residuo_id`:** La tabla mantenía una relación con la tabla `tipos_residuos`, que ya ha sido identificada como innecesaria.
3.  **Campos Superfluos:** Columnas como `hora_entrada`, `hora_salida`, `numero_ticket` y `comprobante_url` no están siendo utilizadas en la interfaz actual y añaden complejidad innecesaria.
4.  **Falta la Columna `observaciones`:** La tabla no incluía el campo `observaciones`, que es necesario para registrar información adicional sobre cada depósito.

### Funcionalidad Actual:

*   **Página Activa:** `app/dashboard/manifiesto-basuron/page.tsx` está completamente desarrollada.
*   **Muestra Datos:** La página obtiene y muestra una tabla con los registros de pesaje.
*   **Lógica de Servicio:** El servicio `lib/services/manifiesto_basuron.ts` es funcional y se utiliza para leer y eliminar registros.
*   **Estadísticas:** La página presenta métricas como total de registros, completados, y peso total depositado.

### Conclusión y Acción Correctiva

*   **NO ELIMINAR:** La tabla es una parte funcional y necesaria de la aplicación.
*   **ACCIÓN - REFACTORIZAR:** La tabla debe ser corregida para alinearla con la lógica de negocio y el resto de la aplicación.

**Nueva Definición (Corregida):**

La estructura correcta, que refleja las necesidades reales de la aplicación, es la siguiente:

```sql
CREATE TABLE IF NOT EXISTS manifiesto_basuron (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE NOT NULL,
    peso_entrada NUMERIC(10, 2) NOT NULL CHECK (peso_entrada >= 0),
    peso_salida NUMERIC(10, 2) CHECK (peso_salida >= 0),
    total_depositado NUMERIC(10, 2) GENERATED ALWAYS AS (peso_entrada - COALESCE(peso_salida, 0)) STORED,
    buque_id BIGINT REFERENCES buques(id) ON DELETE CASCADE NOT NULL,
    responsable_id BIGINT REFERENCES personas(id) ON DELETE SET NULL, -- ✅ CORREGIDO: Apunta a personas
    observaciones TEXT, -- ✅ AÑADIDO: Campo necesario para notas adicionales
    estado TEXT DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completado', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_fecha ON manifiesto_basuron(fecha);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_buque ON manifiesto_basuron(buque_id);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_responsable ON manifiesto_basuron(responsable_id);
CREATE INDEX IF NOT EXISTS idx_manifiesto_basuron_estado ON manifiesto_basuron(estado);
```

**Resumen de Cambios:**

| Campo Original | Acción | Campo Corregido |
|---------------|--------|----------------|
| `usuario_sistema_id` | ❌ **Eliminado y reemplazado** | `responsable_id` → `personas(id)` |
| `tipo_residuo_id` | ❌ **Eliminado** | N/A (dependencia obsoleta) |
| `hora_entrada`, `hora_salida` | ❌ **Eliminado** | N/A (no se utilizan) |
| `numero_ticket` | ❌ **Eliminado** | N/A (no se utiliza) |
| `comprobante_url` | ❌ **Eliminado** | N/A (no se utiliza) |
| N/A | ✅ **Añadido** | `observaciones TEXT` |

Esta refactorización **soluciona los problemas de diseño** al:
1.  Establecer la relación correcta con la tabla `personas` para identificar al responsable del depósito.
2.  Eliminar la dependencia con las tablas obsoletas `usuarios_sistema` y `tipos_residuos`.
3.  Simplificar la tabla para que contenga solo los campos que realmente se necesitan.
4.  Añadir el campo `observaciones` que faltaba en el diseño original.

Este cambio es fundamental para la coherencia del modelo de datos y para poder implementar futuras funcionalidades (como la creación de nuevos registros) de forma correcta.
