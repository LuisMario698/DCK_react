# Contexto Actual del Proyecto (DCK / CIAD)

> **Archivo Vivo**: Este documento refleja el estado actual del proyecto y debe actualizarse con cada cambio significativo.

---

## 1. Visión General
**Nombre del Proyecto**: DCK - Sistema de Manifiestos (CIAD)
**Objetivo**: Plataforma para la gestión de manifiestos marítimos, control de embarcaciones, personas, residuos y asociaciones recolectoras.
**Estado Actual**: En desarrollo activo. Se ha implementado la estructura base, autenticación (via Supabase), y módulos CRUD principales.

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.0.1 |
| **Lenguaje** | TypeScript | 5.x |
| **Estilos** | Tailwind CSS | 4.x |
| **Backend / DB** | Supabase (PostgreSQL) | @supabase/ssr |
| **Internacionalización** | next-intl | 4.x |
| **Gráficos** | Recharts | 3.x |
| **Utilidades** | Lucide React, Date-fns, jsPDF | Varios |

---

## 3. Estructura de Directorios Clave

- **`/app/[locale]`**: Rutas principales de la aplicación. Utiliza enrutamiento dinámico para el idioma (ej. `/es/dashboard`, `/en/dashboard`).
- **`/components`**:
  - `layout/`: Componentes estructurales (Sidebar, Header, DashboardLayout).
  - `ui/`: Componentes base reutilizables (Botones, Inputs, Iconos).
  - `dashboard/`: Componentes específicos de las vistas del panel.
  - `landing/`: Variantes de la página de inicio.
- **`/lib`**: Lógica de negocio y configuración.
  - `services/`: Funciones para interactuar con Supabase (ej. `dashboard_stats.ts`).
  - `utils/`: Utilidades generales.
- **`/types`**: Definiciones de tipos TypeScript (`database.ts`, `dashboard.ts`, etc.).
- **`/Contexto-DCK`**: Documentación del proyecto y guías de usuario.

---

## 4. Módulos y Funcionalidades Principales

### Panel Principal (Dashboard)
- **Ruta**: `/dashboard`
- **Contenido**: Estadísticas generales, KPIs, Gráficos de actividad reciente.

### Gestión de Entidades (CRUD)
1.  **Personas**: Registro y consulta de usuarios/personal.
2.  **Embarcaciones**: Gestión de la flota.
3.  **Asociaciones**: Entidades recolectoras de residuos.
4.  **Manifiestos**:
    - Generación de reportes de residuos.
    - Flujo: Selección de embarcación -> Residuos -> Personas -> Documentos -> Firma -> Carga de evidencia.

### Interfaz (UI/UX)
- **Diseño**: Responsivo con soporte móvil.
- **Temas**: Diseño adaptativo con Tailwind 4.
- **Navegación**: Sidebar lateral colapsable (Estado actual: Versión previa al rediseño "Enterprise").

---

## 5. Base de Datos (Supabase)
- **Tablas Principales**: `personas`, `embarcaciones`, `asociaciones`, `manifiestos`, `manifiesto_basuron`.
- **Funciones RPC**: Utilizadas para estadísticas complejas en el dashboard.

---

## 6. Próximos Pasos / Tareas Pendientes
- [ ] Restaurar/Re-implementar mejoras de UI en Sidebar (si se requiere tras el reset).
- [ ] Validar flujos de formularios complejos.
- [ ] Optimización de imágenes y carga de archivos a Buckets.

---
*Última actualización: 07 de Diciembre, 2025*
