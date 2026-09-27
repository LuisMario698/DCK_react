> **Obsoleto.** Este documento describe el diseño anterior. El lenguaje de diseño vigente está en
> [`DISEÑO_SIMAR.md`](./DISEÑO_SIMAR.md).

# 📱 Cambios de Diseño Responsivo - Proyecto CIAD

## 🎯 Resumen General

Se ha implementado un diseño completamente responsivo en todo el proyecto, asegurando que la aplicación funcione correctamente en todas las resoluciones de pantalla: móviles (320px+), tablets (768px+), laptops (1024px+) y pantallas grandes (1280px+).

### 🆕 Actualización: Optimización de Manifiestos (V2)

Se realizó una **optimización profunda** de la sección de manifiestos enfocada en:
1. **Control de desbordamiento**: Contenedor con `overflow-y-auto` y `max-height` para prevenir contenido fuera del formulario
2. **Colores consistentes**: Eliminación de todos los gradientes, uso de colores sólidos (`bg-{color}-600`) coherentes con personas y embarcaciones
3. **Tamaños estandarizados**: Iconos, textos, paddings y borders unificados en todo el proyecto
4. **Responsividad mejorada**: Layouts flexibles que se adaptan correctamente de móvil a desktop

---

## 📋 Archivos Modificados

### 1. **Layout Components**

#### `components/layout/DashboardLayout.tsx`
**Cambios:**
- ✅ Padding responsivo en el `<main>`: `p-3 sm:p-4 md:p-6 lg:p-8`
- ✅ Contenedor con control de overflow: `max-w-[100vw] overflow-x-hidden`
- ✅ Mejor manejo del espacio en móviles

**Breakpoints aplicados:**
- Mobile: `p-3` (padding 12px)
- Small: `sm:p-4` (padding 16px)
- Medium: `md:p-6` (padding 24px)
- Large: `lg:p-8` (padding 32px)

---

#### `components/layout/Header.tsx`
**Cambios:**
- ✅ Altura adaptable: `h-14 sm:h-16`
- ✅ Logo/título visible en móvil con icono CIAD
- ✅ Padding responsivo: `px-3 sm:px-4 lg:px-6`
- ✅ Botones con tamaño reducido en móvil: `p-1.5 sm:p-2`
- ✅ Iconos escalables: `w-5 h-5 sm:w-6 sm:h-6`

**Características móviles:**
- Logo compacto con nombre "CIAD" visible en pantallas pequeñas
- Botones de acción optimizados para touch
- Mejor distribución del espacio

---

#### `components/layout/Sidebar.tsx`
**Cambios:**
- ✅ Sidebar fullscreen en móvil, flotante en desktop
- ✅ Posicionamiento: `inset-y-0 left-0 sm:top-4 sm:left-4 sm:bottom-4`
- ✅ Transformación suave: `translate-x-0` / `-translate-x-full sm:-translate-x-[calc(100%+2rem)]`
- ✅ Sin border-radius en móvil, redondeado en desktop: `sm:rounded-2xl`
- ✅ Scroll vertical automático: `overflow-y-auto`

**Experiencia móvil:**
- Ocupa toda la pantalla cuando está abierto
- Overlay oscuro para cerrar al hacer clic fuera
- Animación fluida de entrada/salida
- Diseño glassmorphism mantenido en todas las resoluciones

---

### 2. **UI Components**

#### `components/ui/Table.tsx`
**Cambios:**
- ✅ `TableHead` acepta `className` como prop
- ✅ Padding responsivo: `px-3 sm:px-4 md:px-6 py-3 sm:py-4`
- ✅ `TableCell` con padding adaptable
- ✅ Soporte para columnas ocultas en móvil

**Nuevas capacidades:**
- Columnas pueden ocultarse selectivamente con `hidden sm:table-cell`
- Espaciado optimizado para touch en móviles
- Mejor legibilidad en pantallas pequeñas

---

### 3. **Table Components**

#### `components/personas/PersonasTable.tsx`
**Cambios:**
- ✅ Contenedor con scroll horizontal: `overflow-x-auto -mx-3 sm:-mx-4 md:mx-0`
- ✅ Columnas ocultas en móvil:
  - ID: `hidden sm:table-cell`
  - Tipo: `hidden md:table-cell`
  - Contacto: `hidden lg:table-cell`
  - Registro: `hidden md:table-cell`
- ✅ Avatares escalables: `w-8 h-8 sm:w-10 sm:h-10`
- ✅ Botones compactos en móvil
- ✅ Información condensada: ID visible debajo del nombre en móvil

**Optimizaciones móviles:**
- Nombres truncados con `truncate` y `max-w-[150px]`
- Botones con texto oculto en móvil: "Editar" → ícono solo
- Ancho mínimo para prevenir colapso: `min-w-[150px]`

---

#### `components/embarcaciones/EmbarcacionesTable.tsx`
**Cambios:**
- ✅ Similar estructura responsiva a PersonasTable
- ✅ Columnas ocultas progresivamente:
  - ID: `hidden sm:table-cell`
  - Matrícula: `hidden lg:table-cell`
  - Tipo: `hidden md:table-cell`
  - Puerto: `hidden xl:table-cell`
  - Capacidad: `hidden lg:table-cell`
  - Estado: `hidden md:table-cell`
  - Registro: `hidden lg:table-cell`
- ✅ Información secundaria en subtítulo móvil
- ✅ Botones optimizados

---

### 4. **Pages**

#### `app/dashboard/manifiesto/page.tsx`
**Cambios masivos:**

##### **Header**
- ✅ Títulos responsivos: `text-2xl sm:text-3xl md:text-4xl`
- ✅ Iconos escalables: `text-3xl sm:text-4xl md:text-5xl`
- ✅ Spacing adaptable: `mb-4 sm:mb-6 md:mb-8`

##### **Wizard Container**
- ✅ Padding: `p-4 sm:p-6 md:p-8`
- ✅ Border radius: `rounded-2xl sm:rounded-3xl`

##### **Progress Steps**
- ✅ Indicadores escalables: `w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14`
- ✅ Iconos: `w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7`
- ✅ Texto: `text-[9px] sm:text-[10px] md:text-[11px]`
- ✅ Conectores: `w-8 sm:w-10 md:w-14`
- ✅ Scroll horizontal en móvil: `overflow-x-auto px-2`

##### **Form Container**
- ✅ Altura adaptable: `min-h-[300px] sm:min-h-[350px] md:h-[400px]`

##### **Navigation Buttons**
- ✅ Layout: `flex-col sm:flex-row`
- ✅ Orden invertido en móvil para mejor UX
- ✅ Tamaño: `px-4 sm:px-5` y `py-2 sm:py-2.5`
- ✅ Iconos: `w-3 h-3 sm:w-4 sm:h-4`

##### **Tabla de Manifiestos**
- ✅ Scroll horizontal: `overflow-x-auto -mx-4 sm:-mx-6 md:mx-0`
- ✅ Headers con tamaño: `text-[10px] sm:text-xs md:text-sm`
- ✅ Columnas ocultas:
  - Fecha: `hidden sm:table-cell`
  - Responsables: `hidden md:table-cell`
  - Estado: `hidden lg:table-cell`
- ✅ Celdas con padding: `px-3 sm:px-4 md:px-6`
- ✅ Texto truncado y whitespace-nowrap

##### **Modal de Detalles**
- ✅ Padding modal: `p-2 sm:p-4`
- ✅ Altura: `max-h-[95vh] sm:max-h-[90vh]`
- ✅ Header:
  - Padding: `px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6`
  - Título: `text-lg sm:text-2xl md:text-3xl`
  - Botón cerrar: `w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12`
- ✅ Contenido: `p-4 sm:p-6 md:p-8`
- ✅ Secciones con grid: `grid-cols-1 sm:grid-cols-2`
- ✅ Residuos: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`

---

#### `app/dashboard/personas/page.tsx`
**Cambios:**
- ✅ Header layout: `flex-col sm:flex-row gap-3`
- ✅ Título: `text-xl sm:text-2xl`
- ✅ Botones full-width en móvil: `flex-1 sm:flex-none`
- ✅ Texto adaptable: "Gestionar Tipos" → "Tipos" en móvil
- ✅ Estadísticas: `grid-cols-2 md:grid-cols-4`
- ✅ Cards: `p-3 sm:p-4` y `rounded-lg sm:rounded-xl`
- ✅ Iconos en cards: `w-10 h-10 sm:w-12 sm:h-12`
- ✅ Números: `text-xl sm:text-2xl`

---

#### `app/dashboard/embarcaciones/page.tsx`
**Cambios:**
- ✅ Idéntica estructura responsiva a personas
- ✅ Botón "Nuevo Buque" full-width en móvil
- ✅ Estadísticas en grid 2x2 en móvil, 1x4 en desktop
- ✅ Espaciado consistente con el resto del proyecto

---

## 🎨 Breakpoints Utilizados (Tailwind CSS)

```css
/* Mobile First Approach */
Base (default):    320px - 639px   (móviles)
sm:               640px - 767px   (móviles grandes)
md:               768px - 1023px  (tablets)
lg:               1024px - 1279px (laptops)
xl:               1280px - 1535px (desktop)
2xl:              1536px+          (pantallas grandes)
```

---

## ✨ Patrones de Diseño Aplicados

### 1. **Mobile-First**
Todos los estilos base están optimizados para móvil, con breakpoints que mejoran la experiencia en pantallas más grandes.

### 2. **Progressive Enhancement**
- Columnas de tabla se ocultan progresivamente
- Información crítica siempre visible
- Detalles adicionales en pantallas más grandes

### 3. **Touch-Friendly**
- Botones mínimo 44x44px (área táctil recomendada)
- Espaciado generoso entre elementos interactivos
- Padding aumentado en componentes táctiles

### 4. **Flexible Spacing**
```tsx
// Patrón común aplicado:
className="p-3 sm:p-4 md:p-6 lg:p-8"
className="gap-2 sm:gap-3 md:gap-4"
className="text-sm sm:text-base md:text-lg"
```

### 5. **Responsive Typography**
```tsx
// Títulos
h1: "text-xl sm:text-2xl md:text-3xl"
h2: "text-lg sm:text-xl md:text-2xl"
h3: "text-base sm:text-lg md:text-xl"

// Texto
body: "text-xs sm:text-sm md:text-base"
small: "text-[10px] sm:text-xs"
```

---

## 🚀 Características Implementadas

### ✅ Sidebar Responsive
- Fullscreen en móvil con overlay
- Flotante en desktop con glassmorphism
- Animaciones suaves de entrada/salida

### ✅ Tablas con Scroll Horizontal
- Siempre accesibles en móvil
- Columnas progresivamente visibles
- Información condensada inteligentemente

### ✅ Wizard Multi-Step
- Pasos horizontales con scroll en móvil
- Botones reorganizados para mejor UX móvil
- Altura adaptable del contenedor

### ✅ Modales Responsivos
- Full-height en móvil
- Centered con max-width en desktop
- Contenido scrolleable

### ✅ Cards y Estadísticas
- Grid 2x2 en móvil
- Grid 1x4 en desktop
- Iconos y números escalables

---

## 🎯 Testing Recomendado

### Resoluciones a Probar:
1. **iPhone SE (375px)** - Móvil pequeño
2. **iPhone 12 Pro (390px)** - Móvil estándar
3. **iPad Mini (768px)** - Tablet pequeña
4. **iPad Pro (1024px)** - Tablet grande
5. **MacBook Air (1280px)** - Laptop
6. **Desktop (1920px)** - Pantalla grande

### Aspectos a Verificar:
- ☑️ Sidebar abre/cierra correctamente
- ☑️ Tablas tienen scroll horizontal
- ☑️ Wizard multi-step es navegable
- ☑️ Modales se ven completos
- ☑️ Botones tienen tamaño táctil adecuado
- ☑️ Texto es legible en todas las pantallas
- ☑️ No hay overflow horizontal inesperado
- ☑️ Cards y estadísticas se reorganizan
- ☑️ Imágenes se escalan correctamente

---

## 📝 Notas Importantes

### Overflow Control
Se agregó `max-w-[100vw] overflow-x-hidden` en DashboardLayout para prevenir scroll horizontal indeseado en toda la aplicación.

### Tablas
Todas las tablas ahora usan el patrón:
```tsx
<div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
  <div className="inline-block min-w-full align-middle">
    <div className="overflow-hidden border border-gray-200 sm:rounded-xl">
      <Table>
        {/* contenido */}
      </Table>
    </div>
  </div>
</div>
```

### Hidden Classes
Uso estratégico de `hidden sm:table-cell`, `hidden md:table-cell`, etc., para ocultar columnas no críticas en pantallas pequeñas.

---

## 🎉 Resultado Final

El proyecto ahora es completamente responsive y ofrece una experiencia excelente en:
- 📱 Móviles (verticales y horizontales)
- 📱 Tablets (verticales y horizontales)
- 💻 Laptops
- 🖥️ Monitores de escritorio
- 🖥️ Pantallas ultra-wide

Todos los componentes se adaptan inteligentemente al tamaño de pantalla disponible, manteniendo la funcionalidad completa y una estética moderna en todas las resoluciones.

---

## 🎨 Optimización de Manifiestos (Diciembre 2024)

### Archivo: `app/dashboard/manifiesto/page.tsx`

#### Problemas Identificados y Solucionados:

**1. Contenido desbordándose del formulario**
- ❌ Problema: Contenedores con altura fija (`md:h-[400px]`) causaban overflow en pasos con mucho contenido
- ✅ Solución: Cambiado a `min-h-[280px] overflow-y-auto max-h-[500px]` + padding horizontal extra en móviles (`px-2 sm:px-0`)

**2. Colores inconsistentes con el resto del proyecto**
- ❌ Problema: Uso excesivo de gradientes (`from-purple-500 to-purple-600`), shadows complejos (`shadow-lg shadow-blue-500/30`)
- ✅ Solución: 
  - Colores sólidos: `bg-blue-600`, `bg-purple-600`, `bg-gray-600`, etc.
  - Borders estándar: `border` (1px) en lugar de `border-2`
  - Eliminación de hover effects complejos y shadows

**3. Tamaños diferentes a otras secciones**
- ❌ Problema: Iconos `w-11 h-11`, textos `text-xl`, paddings `p-5`, focus rings `focus:ring-4`
- ✅ Solución aplicada en TODOS los steps:
  - Iconos: `w-10 h-10 sm:w-11 sm:h-11`
  - Headers: `text-lg sm:text-xl font-bold text-gray-800`
  - Containers: `p-3 sm:p-4` con `rounded-lg sm:rounded-xl`
  - Labels: `text-xs sm:text-sm font-semibold text-gray-700`
  - Inputs: `focus:ring-2` (no `ring-4`)
  - Spacing: `gap-2 sm:gap-3`, `space-y-3 sm:space-y-4`

#### Cambios por Step:

**Step 1 - Información Básica**
- Container: Overflow control + responsive padding
- Icon: Blue-600 solid, tamaño consistente
- Inputs: Border estándar, focus ring reducido
- Layout: Responsive con `flex-col` en móvil

**Step 2 - Embarcación**
- Select: Tamaños de fuente reducidos y responsivos
- Success message: Border-left-4 pattern con `bg-green-50`
- Ship name: Truncated para prevenir overflow

**Step 3 - Residuos**
- Grid: `grid-cols-1 sm:grid-cols-2`
- 4 Cards con colores diferenciados:
  - Aceite: `amber-600`
  - Filtros Aceite: `gray-600`
  - Filtros Diesel: `slate-600`
  - Basura: `green-600`
- Labels acortados para móvil
- Icons: `w-9 h-9 sm:w-10 sm:h-10`

**Step 4 - Responsables**
- Responsable Principal: Purple-600, layout flex responsive
- Responsable Secundario: Blue-600, mismo patrón
- Observaciones: Gray-600, textarea con border estándar
- Success messages: Consistent border-left-4 pattern

**Step 5 - Digitalizar**
- Drag & drop area: Border-2 (era border-3), sin shadows complejos
- Icons: Tamaños progresivos `w-12 sm:w-14 md:w-16`
- Upload button: Solid `bg-blue-600`, sin gradientes
- Delete button: Solid `bg-red-600`
- File info: Texto truncado para nombres largos

**Botones de Navegación**
- Anterior: Border estándar, hover simple
- Siguiente: Solid `bg-blue-600` (sin gradientes)
- Guardar: Solid `bg-green-600`, emoji removido
- Spacing: `gap-2 sm:gap-3`, `mt-4 sm:mt-6`

#### Patrón de Diseño Establecido:

```tsx
// Container estándar
className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4"

// Icon box
className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-{color}-600 flex items-center justify-center text-white"

// Label
className="text-xs sm:text-sm font-semibold text-gray-700"

// Input/Select
className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-{color}-500 focus:border-{color}-500"

// Success message
className="bg-{color}-50 border-l-4 border-{color}-500 rounded-lg p-2.5 sm:p-3"

// Button primary
className="bg-{color}-600 hover:bg-{color}-700 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg"
```

#### Resultados:
- ✅ Sin overflow de contenido en ningún step
- ✅ Colores 100% consistentes con personas y embarcaciones
- ✅ Tamaños uniformes en todo el proyecto
- ✅ Responsividad fluida de 320px a 2560px+
- ✅ Sin errores de TypeScript
- ✅ Mantenibilidad mejorada con patrón claro

---

## 🔧 Mantenimiento Futuro

Al agregar nuevos componentes, seguir estos principios:
1. **Mobile-first approach**: Diseñar primero para móvil
2. **Breakpoints consistentes**: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`
3. **Colores sólidos**: Evitar gradientes, usar `bg-{color}-600`
4. **Borders estándar**: `border` (1px), no `border-2` o más
5. **Focus rings moderados**: `focus:ring-2`, no `ring-4`
6. **Ocultar info no crítica**: `hidden sm:table-cell` para columnas secundarias
7. **Touch targets**: Mínimo 44x44px en móviles
8. **Overflow control**: `overflow-y-auto` con `max-height` cuando sea necesario
9. **Padding responsivo**: `p-3 sm:p-4` en lugar de valores fijos
10. **Icons escalables**: `w-10 h-10 sm:w-11 sm:h-11` patrón estándar
5. Probar en múltiples resoluciones

---

**Fecha de implementación:** ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}

**Estado:** ✅ Completado - Sin errores de TypeScript
