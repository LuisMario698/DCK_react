# MANUAL TÉCNICO PROFUNDO EXTENDIDO
## Sistema de Gestión de Residuos - DCK Conciencia y Cultura

**Versión**: 2.1 (Profundidad Técnica)
**Fecha**: 08 de Diciembre de 2025

Este documento desglosa la arquitectura del sistema punto por punto, profundizando en la responsabilidad de cada archivo y módulo.

---

### 1. Stack Tecnológico (Núcleo)

*   **Framework Principal**: Next.js 16 (Arquitectura App Router)
    *   *Uso*: Renderizado híbrido (Server Components para datos, Client Components para interactividad).
*   **Lenguaje**: TypeScript 5
    *   *Uso*: Tipado estático estricto para prevenir errores de tiempo de ejecución en gestión de datos.
*   **Estilos**: Tailwind CSS 4
    *   *Uso*: Estilizado atómico mediante clases utilitarias directamente en JSX.
*   **Base de Datos**: Supabase (PostgreSQL)
    *   *Uso*: Persistencia relacional, autenticación de usuarios y Row Level Security (RLS).
*   **Almacenamiento**: Supabase Storage
    *   *Uso*: Buckets para guardar firmas digitales (PNG) y documentos PDF generados.

---

### 2. Estructura Detallada del Proyecto (Lista de Archivos)

A continuación se describe la función específica de cada directorio y archivo crítico en el sistema.

#### A. Directorio Raíz (`/`)
*   **`.env.local`**: Contiene las llaves de acceso a Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
*   **`middleware.ts`**: Intercepta las peticiones para manejar el enrutamiento base.
*   **`tailwind.config.ts`**: Define la paleta de colores personalizada (ej. colores institucionales de DCK) y extensiones del tema.
*   **`next.config.ts`**: Configuración del compilador, incluyendo dominios permitidos para imágenes externas (ej. buckes de Supabase).

#### B. Directorio de Aplicación (`/app`)
Este directorio maneja el enrutamiento. Cada carpeta es una ruta en la URL.

*   **`page.tsx` (Root)**: Pantalla de inicio de sesión (Login/Landing).
*   **`layout.tsx` (Root)**: Define el marco global HTML, fuentes (Inter/Roboto) y Proveedores de Contexto (ThemeContext).
*   **`/dashboard`**: Contenedor principal de la aplicación privada.
    *   **`layout.tsx`**: Renderiza la estructura persistente:
        *   Barra Lateral (`Sidebar`) izquierda.
        *   Cabecera (`Header`) superior.
        *   Área de contenido dinámico (`children`).
    *   **`page.tsx`**: Panel de Resumen. Carga métricas rápidas (total manifiestos hoy, alertas).
    *   **`/manifiesto`**:
        *   **`page.tsx`**: Contiene la lógica del "Formulario Inline" para crear manifiestos y la tabla de historial. Maneja estados complejos de carga y validación.
    *   **`/manifiesto-basuron`**:
        *   **`page.tsx`**: Módulo de pesaje. Incluye lógica matemática para calcular `entrada - salida` y validación de tickets abiertos.
    *   **`/estadisticas`**:
        *   **`page.tsx`**: Dashboard visual. Importa librerías de gráficos para renderizar volúmenes de residuos por mes/buque.
    *   **`/personas` y `/embarcaciones`**:
        *   **`page.tsx`**: Pantallas CRUD (Crear, Leer, Actualizar, Borrar) para los catálogos base.

#### C. Librería de Servicios (`/lib/services`)
Aquí reside la lógica de negocio pura. Los componentes de UI importan estos archivos para interactuar con los datos.

*   **`supabase.ts`**: Instancia Singleton del cliente Supabase. Asegura una única conexión para toda la app.
*   **`manifiestos.ts`**:
    *   *Método `create`*: Ejecuta una transacción (RPC o inserciones secuenciales) para guardar cabecera (`manifiestos`) y detalles (`manifiestos_residuos`).
    *   *Método `getById`*: Realiza un `join` con buques y personas para traer nombres legibles.
*   **`manifiesto_basuron.ts`**:
    *   *Método `registrarEntrada`*: Crea un nuevo ticket con peso de báscula.
    *   *Método `cerrarTicket`*: Busca un ticket por ID, actualiza peso salida y cierra estado a 'Completado'.
*   **`dashboard_stats.ts`**:
    *   Contiene funciones optimizadas que agrupan datos (SQL `GROUP BY`) para alimentar las gráficas sin procesar miles de filas en el cliente.
*   **`storage.ts`**:
    *   Maneja la conversión de `Base64` (del canvas de firma) a `Blob` y su subida al Bucket de Supabase. Retorna la URL pública del archivo.
*   **`reportes.ts`**:
    *   Genera archivos descargables (Excel/CSV) a partir de los datos mostrados en tablas.

#### D. Componentes de Interfaz (`/components`)

*   **`/layout`**:
    *   **`Sidebar.tsx`**: Menú de navegación principal. Controla el estado "colapsado/expandido" y resalta la ruta activa.
    *   **`ThemeToggle.tsx`**: Controla el cambio entre modo claro y oscuro (persistencia en localStorage).
*   **`/ui`**:
    *   **`Table.tsx`**: Componente de tabla genérico estilizado con Tailwind. Soporta cabeceras y filas dinámicas.
    *   **`CreateManifiestoModal.tsx`**: Modal complejo que orquesta el flujo de creación: Selección de Buque -> Ingreso de Residuos -> Captura de Firma.
    *   **`FirmaCanvas.tsx`**: Wrapper de React para un elemento `<canvas>` HTML5 que permite dibujar trazos (firmas) táctiles o con mouse.

#### E. Definiciones de Tipos (`/types`)

*   **`database.ts`**: Archivo crítico que define las interfaces de TypeScript. Debe mantenerse sincronizado con la base de datos.
    *   Define `interface Manifiesto { id: number, ... }`
    *   Define `interface Buque { ... }`

---

### 3. Profundización en Flujos Críticos

#### 3.1 Creación de Manifiesto (Paso a Paso)
1.  **Inicio**: Usuario abre modal. El sistema carga catálogos de `buques` y `personas` en segundo plano.
2.  **Captura de Datos**: Se validan campos numéricos (no negativos) para residuos.
3.  **Firma**: El componente `FirmaCanvas` captura coordenadas X/Y. Al guardar, exporta a imagen PNG (DataURL).
4.  **Generación Documental**:
    *   Se toma la imagen de la firma.
    *   Se usa `jspdf` para construir un PDF en memoria con el formato oficial.
5.  **Persistencia**:
    *   Sube firma a Storage -> Obtiene URL.
    *   Sube PDF a Storage -> Obtiene URL.
    *   Inserta registro en BD con ambas URLs y volúmenes de residuos.

#### 3.2 Lógica de Basurón (Relleno Sanitario)
El sistema previene inconsistencias lógicas en el pesaje:
*   **Entrada**: Se registra `peso_entrada`. Estado = 'En Proceso'. `peso_salida` = NULL.
*   **Salida**: El usuario busca un ticket abierto. Ingresa `peso_salida`.
*   **Cálculo**: El sistema ejecuta `dif = peso_entrada - peso_salida`.
    *   *Validación*: Si `dif < 0` (Salida mayor a entrada), bloquea la operación y alerta error de captura.
    *   *Éxito*: Guarda `total_depositado` y cambia estado a 'Completado'.

---

### 4. Modelo de Datos (Esquema Relacional)

La base de datos utiliza un modelo relacional estricto para garantizar integridad.

*   **Tabla `buques`**:
    *   Relación: Un buque puede tener N manifiestos.
    *   Constraint: No se puede borrar un buque si tiene historial (ON DELETE RESTRICT).
*   **Tabla `manifiestos`**:
    *   Es la tabla central ("Hechos"). Conecta `buque`, `responsable` (Capitán) y `detalles`.
*   **Tabla `manifiestos_residuos`**:
    *   Almacena las métricas. Se separó de la tabla padre para permitir flexibilidad si se agregan nuevos tipos de residuos en el futuro sin alterar la estructura principal.
*   **Tabla `usuarios` / `auth.users`**:
    *   Supabase gestiona los usuarios. La tabla pública `usuarios` extiende la información del perfil (rol, permisos) vinculada por `uuid`.

---

### 5. Medidas de Seguridad Implementadas

1.  **Row Level Security (RLS)**:
    *   Aunque la API Key es pública, la base de datos rechaza cualquier consulta que no cumpla las políticas SQL definidas (ej. "Solo usuarios autenticados pueden ver datos").
2.  **Validación de Tipos**:
    *   TypeScript asegura que el código frontend no intente enviar cadenas de texto en campos numéricos, previniendo errores de formato antes de llegar al servidor.
3.  **Sanitización**:
    *   React escapa automáticamente el contenido renderizado, protegiendo contra inyecciones XSS básicas.
