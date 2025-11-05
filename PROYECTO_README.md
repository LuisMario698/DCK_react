# 🚢 CIAD - Sistema de Gestión de Embarcaciones

Sistema administrativo completo para gestionar embarcaciones, personas, manifiestos y asociaciones recolectoras.

## 📁 Estructura del Proyecto

```
my_app_react_ejemplo/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── embarcaciones/
│   │   │   └── page.tsx                # Gestión de embarcaciones
│   │   ├── personas/
│   │   │   └── page.tsx                # Gestión de personas
│   │   ├── manifiesto/
│   │   │   └── page.tsx                # Gestión de manifiestos
│   │   ├── asociaciones/
│   │   │   └── page.tsx                # Asociaciones recolectoras
│   │   ├── reutilizacion/
│   │   │   └── page.tsx                # Reutilización de residuos
│   │   └── usuarios/
│   │       └── page.tsx                # Usuarios del sistema
│   ├── page.tsx                        # Página principal (redirige a /dashboard)
│   ├── layout.tsx                      # Layout raíz
│   └── globals.css                     # Estilos globales
├── components/
│   ├── ui/
│   │   ├── Button.tsx                  # Componente de botón reutilizable
│   │   └── Table.tsx                   # Componentes de tabla (Table, TableHeader, etc.)
│   ├── layout/
│   │   ├── Sidebar.tsx                 # Menú lateral de navegación
│   │   └── DashboardLayout.tsx         # Layout del dashboard
│   └── embarcaciones/
│       ├── EmbarcacionesTable.tsx      # Tabla de embarcaciones
│       └── Pagination.tsx              # Componente de paginación
├── lib/
│   └── data.ts                         # Funciones y datos de ejemplo
├── types/
│   └── embarcacion.ts                  # Tipos TypeScript
└── public/                             # Archivos estáticos
```

## 🚀 Comandos

### Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo en http://localhost:3000

### Producción
```bash
npm run build    # Construir para producción
npm start        # Iniciar servidor de producción
```

### Linting
```bash
npm run lint
```

## 🎨 Características

### ✅ Implementado

- **Dashboard principal** con tarjetas de estadísticas
- **Gestión de embarcaciones** con tabla completa
  - Visualización de embarcaciones
  - Botones de editar y eliminar
  - Paginación funcional
- **Sidebar de navegación** con:
  - Menú principal (Panel, Personas, Embarcaciones, Manifiesto)
  - Sección Externos (Asociaciones, Reutilización)
  - Sección Sistema (Usuarios)
  - Resaltado de ruta activa
- **Componentes reutilizables**:
  - Button (con variantes: primary, secondary, danger)
  - Table (con componentes: TableHeader, TableBody, TableRow, etc.)
  - Pagination
- **Hot Reload** - Los cambios se ven instantáneamente
- **Responsive Design** con Tailwind CSS
- **TypeScript** para type safety

### 🚧 En desarrollo (placeholders creados)

- Gestión de Personas
- Gestión de Manifiestos
- Asociaciones recolectoras
- Reutilización de residuos
- Usuarios del sistema

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Build Tool**: Turbopack
- **Node**: v20+

## 📱 Rutas

- `/` → Redirige a `/dashboard`
- `/dashboard` → Panel principal
- `/dashboard/embarcaciones` → Gestión de embarcaciones (funcional)
- `/dashboard/personas` → Gestión de personas (placeholder)
- `/dashboard/manifiesto` → Manifiestos (placeholder)
- `/dashboard/asociaciones` → Asociaciones recolectoras (placeholder)
- `/dashboard/reutilizacion` → Reutilización de residuos (placeholder)
- `/dashboard/usuarios` → Usuarios del sistema (placeholder)

## 💡 Próximos pasos

1. Conectar con backend/API para datos reales
2. Implementar formularios de crear/editar embarcaciones
3. Agregar autenticación de usuarios
4. Completar módulos de Personas, Manifiestos, etc.
5. Agregar búsqueda y filtros en tablas
6. Implementar gestión de estado global (Zustand/Redux)

## 🎯 Uso

1. Inicia el servidor: `npm run dev`
2. Abre http://localhost:3000
3. Navega por el menú lateral
4. Prueba la sección de **Embarcaciones** (completamente funcional)
5. Modifica cualquier archivo y verás los cambios instantáneamente

---

**Desarrollado con ❤️ usando Next.js + React + TypeScript + Tailwind CSS**
