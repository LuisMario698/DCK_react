> **Obsoleto.** Este documento describe el diseño anterior. El lenguaje de diseño vigente está en
> [`DISEÑO_SIMAR.md`](./DISEÑO_SIMAR.md).

# 🎨 LENGUAJE DE DISEÑO - CIAD SYSTEM

## Versión: 2.0 (Glassmorphism Refinado)
Último actualizado: Noviembre 10, 2025

---

## 📋 ÍNDICE
1. [Filosofía de Diseño](#filosofía)
2. [Paleta de Colores](#paleta-de-colores)
3. [Tipografía](#tipografía)
4. [Componentes Core](#componentes-core)
5. [Patrones de Interacción](#patrones-de-interacción)
6. [Espaciado y Layout](#espaciado-y-layout)
7. [Animaciones](#animaciones)
8. [Efectos y Sombras](#efectos-y-sombras)

---

## 🎭 FILOSOFÍA DE DISEÑO {#filosofía}

### Concepto Principal: **Glassmorphism Elegante**
Un diseño moderno que utiliza transparencia, blur y bordes sutiles para crear una sensación de **profundidad**, **ligereza** e **introspección**.

### Principios Clave:
1. **Transparencia Controlada** - No opaco, pero legible
2. **Blur Contextual** - 12-24px según jerarquía
3. **Minimalismo Refinado** - Menos es más
4. **Contraste Inteligente** - Gris + blanco + azul
5. **Micro-interacciones** - Feedback visual suave
6. **Movilidad Fluida** - Transiciones naturales

---

## 🎨 PALETA DE COLORES {#paleta-de-colores}

### Colores Primarios

#### **Gris Neutro (Base)**
```
Sidebar & Fondos:
  - rgba(17, 24, 39, 0.08) → Gris ultra-claro (8% opacidad)
  - rgba(240, 240, 245, 0.25) → Gris claro (25% opacidad) *Para contenedores
  - #f3f4f6 → Gris muy claro (para áreas deshabilitadas)
  
Texto:
  - #111827 → Gris oscuro fuerte (headings)
  - #374151 → Gris oscuro (cuerpo)
  - #6b7280 → Gris medio (secundario)
  - #9ca3af → Gris claro (deshabilitado)
```

#### **Azul Principal**
```
Acciones e Indicadores:
  - #3b82f6 → Azul vibrante (botones, links)
  - #2563eb → Azul más oscuro (hover)
  - #1d4ed8 → Azul profundo (active)
  
Gradiente Pastilla Sidebar:
  - De: rgba(59, 130, 246, 0.18) → Azul 18% opacidad
  - A:  rgba(37, 99, 235, 0.25) → Azul más oscuro 25% opacidad
  - Border: rgba(255, 255, 255, 0.3-0.5) → Blanco semi-transparente
```

#### **Colores Funcionales**
```
Éxito: #10b981 (verde)
Peligro: #ef4444 (rojo)
Advertencia: #f97316 (naranja)
Info: #06b6d4 (cyan)
```

---

## 📝 TIPOGRAFÍA {#tipografía}

### Jerarquía de Textos

| Nivel | Tamaño | Peso | Uso | Ejemplo |
|-------|--------|------|-----|---------|
| H1 | 32px | Bold (700) | Títulos página | "Panel principal" |
| H2 | 24px | Semibold (600) | Subtítulos | "Gestión de Personas" |
| H3 | 20px | Semibold (600) | Secciones | "Tipos de Persona" |
| H4 | 16px | Semibold (600) | Subtítulos menores | "Nombre del Buque" |
| Body | 14px | Regular (400) | Texto cuerpo | Descripciones |
| Small | 12px | Regular (400) | Etiquetas, IDs | "ID: 12" |
| Tiny | 11px | Regular (400) | Paginación, hints | "Mostrando del..." |

### Font Family
```
Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
Fallback: Arial, Helvetica, sans-serif
```

### Espaciado de Líneas
```
Headings: 1.2 (120%)
Body: 1.5 (150%)
Tight: 1 (100%)
```

---

## 🧩 COMPONENTES CORE {#componentes-core}

### 1. **Sidebar (Navegación Principal)**

```typescript
// Contenedor Base
background: 'rgba(17, 24, 39, 0.08)'  // 8% gris oscuro
backdropFilter: 'blur(24px)'
border: '2px solid rgba(255, 255, 255, 0.4)'
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
borderRadius: '12px' (rounded-lg)

// Pill Indicator (Link Activo)
background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.25) 100%)'
backdropFilter: 'blur(12px)'
border: '1px solid rgba(255, 255, 255, 0.3)'
boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
borderRadius: '8px' (rounded)
transition: 'all 0.2s linear' ⚡ 200ms smooth

// Item Inactivo
color: rgba(255, 255, 255, 0.6)
hover: rgba(255, 255, 255, 0.8)
transition: 'color 0.2s'

// Item Activo (en la pastilla)
color: rgba(255, 255, 255, 0.95)
fontWeight: 500
```

**Características:**
- ✅ Hamburger toggle animado
- ✅ Slide izquierda/derecha 200ms
- ✅ Estado persistente (localStorage)
- ✅ Indicador sigue al scroll

---

### 2. **Modales (Formularios)**

```typescript
// Overlay Background
background: 'rgba(0, 0, 0, 0.2)' // 20% negro translúcido
backdropFilter: 'blur(8px)' // Blur sutil
position: 'fixed inset-0'
zIndex: 50

// Modal Container
background: '#ffffff'
borderRadius: '12px' (rounded-xl)
boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.9)'
padding: '24px' (p-6)
maxWidth: '448px' (max-w-md)

// Inputs
background: '#ffffff'
border: '1px solid #e5e7eb' (border-gray-200)
color: '#111827' (text-gray-900)
borderRadius: '8px' (rounded-lg)
focus: 'ring-2 ring-blue-500'
padding: '12px' (py-2 px-3)
```

**Características:**
- ✅ Cierre con X o Esc
- ✅ Overlay clickeable para cerrar
- ✅ Transición suave de entrada
- ✅ Textos siempre legibles (bg-white)

---

### 3. **Contenedores Glassmorphism (TiposPersonaManager)**

```typescript
// Contenedor Principal
background: 'rgba(240, 240, 245, 0.25)' // Gris muy claro 25%
backdropFilter: 'blur(16px) saturate(180%)' // Blur + saturación
border: '1px solid rgba(255, 255, 255, 0.5)' // Borde blanco notorio
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.6)'
borderRadius: '12px' (rounded-xl)
padding: '24px' (p-6)

// Efecto Visual
- Sensación de "cristal esmerilado"
- Contrasta claramente con fondo
- Permite ver contenido detrás (sutilmente)
```

**Ubicaciones:**
- TiposPersonaManager (Personas)
- Futuros contenedores principales

---

### 4. **Cards (Tarjetas de Contenido)**

```typescript
// Card Blanca (Por defecto)
background: '#ffffff'
border: '1px solid #e5e7eb' (border-gray-200)
borderRadius: '8px' (rounded-lg)
padding: '16px' (p-4)
boxShadow: 'none' (hover: '0 4px 12px rgba(0, 0, 0, 0.05)')
transition: 'all 0.2s'

// Hover State
boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
borderColor: '#d1d5db' (border-gray-300)

// Dentro de Glassmorphism Container
- Mantiene blanco limpio
- Mejor contraste sobre fondo transparente
```

---

### 5. **Botones**

```typescript
// Primary (Azul)
background: '#3b82f6' (bg-blue-500)
color: '#ffffff'
padding: '12px 24px' (px-6 py-2)
borderRadius: '8px' (rounded-lg)
fontWeight: 600 (semibold)
hover: background-color: '#2563eb' (bg-blue-600)
active: background-color: '#1d4ed8' (bg-blue-700)
transition: 'all 0.2s'

// Secondary (Gris)
background: '#f3f4f6' (bg-gray-100)
color: '#374151' (text-gray-700)
border: '1px solid #d1d5db' (border-gray-300)
hover: background-color: '#e5e7eb'

// Tamaños
Large: 'py-3 px-6' (formularios importantes)
Normal: 'py-2 px-4' (botones estándar)
Small: 'py-1 px-3' (acciones menores)
Tiny: 'py-1 px-2' (paginación)
```

---

### 6. **Paginación**

```typescript
// Contenedor
display: 'flex gap-2'
fontSize: '12px' (text-xs)
fontWeight: '400' (normal)

// Texto "Mostrando del..."
color: '#4b5563' (text-gray-700)

// Selector Items
border: '1px solid #d1d5db'
borderRadius: '4px' (rounded)
padding: '8px 6px' (py-1 px-2)
fontSize: '12px'
color: '#374151' (text-gray-700)
background: '#ffffff'

// Botones (Primero, Anterior, Siguiente, Último)
border: '1px solid #d1d5db'
borderRadius: '4px'
padding: '8px 6px'
color: '#6b7280' (text-gray-600)
background: '#ffffff'
hover: background-color: '#f9fafb'
disabled: opacity: '0.4'

// Número de Página Actual
background: '#3b82f6' (bg-blue-500)
color: '#ffffff'
minWidth: '36px'
borderRadius: '4px'
fontWeight: '500' (medium)
```

**Características:**
- ✅ Muy compacta y discreta
- ✅ No compite con contenido principal
- ✅ Clara pero elegante

---

## 🎯 PATRONES DE INTERACCIÓN {#patrones-de-interacción}

### Hover States
```
Subtle Hover:
- Cambio suave de color (0.2s)
- Ligero aumento de sombra
- +5-10% más claro/oscuro

Elementos Deshabilitados:
- opacity: 0.4-0.5
- cursor: not-allowed
- Sin cambios en hover
```

### Focus States
```
Inputs Focused:
- ring-2 ring-blue-500
- border-color: #2563eb
- outline: none

Botones Focused:
- ring-2 ring-blue-500 ring-offset-2
```

### Loading States
```
Spinner:
- w-4 h-4 border-2 border-white border-t-transparent
- animate-spin (1s rotation)
- Usado en: Botones enviando, tablas cargando

Skeleton:
- background: #f3f4f6
- animate-pulse suave
```

---

## 📐 ESPACIADO Y LAYOUT {#espaciado-y-layout}

### Sistema de Espaciado (Tailwind)
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
```

### Márgenes Típicos
```
Página Principal: p-6 (padding 24px)
Sections: space-y-6 (24px entre secciones)
Grid Items: gap-4 (16px entre items)
Cards: gap-3 (12px entre elementos)
Inline: gap-2 (8px entre inline items)
```

### Breakpoints
```
Mobile: < 640px (sm)
Tablet: 640px-1024px (md, lg)
Desktop: > 1024px (xl, 2xl)

Sidebar:
- Cerrado: width-0
- Abierto: width-64 (256px)
- Mobile: full width con overlay
```

---

## ⚡ ANIMACIONES {#animaciones}

### Duraciones Estándar
```
Rápido: 150ms (micro-interacciones)
Normal: 200ms (transiciones generales)
Lento: 300ms (modales, overlays)
Fluido: 500ms+ (scroll, transiciones grandes)
```

### Tipos de Animaciones

#### **Fade In (Entrada de Elementos)**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
duration: 0.2s
timing: ease-in-out
```

#### **Slide Indicator (Pastilla Sidebar)**
```typescript
// Transición smooth del indicador
transition: 'top 0.2s linear, height 0.2s linear'
// Sigue la posición del link activo con precisión
```

#### **Slide Modal (Entrada de Modales)**
```typescript
// Overlay fade in
opacity: 0 → 1 (0.2s)
backdropFilter: blur(0px) → blur(8px)

// Modal scale up suave
transform: scale(0.95) → scale(1)
opacity: 0 → 1
```

#### **Button Hover (Retroalimentación)**
```typescript
// Color change
background-color change: 0.2s ease
// Shadow increase
box-shadow increase: 0.2s ease
```

---

## 💡 EFECTOS Y SOMBRAS {#efectos-y-sombras}

### Sistema de Sombras

#### **Sombra Interna (Glassmorphism)**
```
inset 0 1px 0 rgba(255, 255, 255, 0.3-0.6)
// Crea brillo interno, efecto 3D sutil
```

#### **Sombra Externa (Profundidad)**
```
Nivel 1 (Sutil):
0 1px 2px rgba(0, 0, 0, 0.05)

Nivel 2 (Normal):
0 4px 6px rgba(0, 0, 0, 0.1)

Nivel 3 (Fuerte):
0 10px 15px rgba(0, 0, 0, 0.15)

Nivel 4 (Muy Fuerte):
0 20px 25px rgba(0, 0, 0, 0.1)

// Modales: Combinan dos niveles
0 20px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.9)
```

### Blur Effects
```
Sutil: blur(8px) - Overlays ligeros
Moderado: blur(12px) - Pills, componentes
Fuerte: blur(16-24px) - Sidebars, fondos
Saturación: saturate(180%) - Intensifica colores detrás
```

---

## 🔄 APLICACIÓN EN CONTEXTOS {#aplicación}

### Sidebar (Navegación)
```
✅ Glassmorphism base: rgba(17, 24, 39, 0.08)
✅ Blur: 24px (máximo)
✅ Pill activo: Gradiente azul semi-transparente
✅ Animaciones: 200ms suave
✅ Bordes: Sutiles blancos
```

### Modales (Formularios)
```
✅ Overlay: bg-black/20 con blur-8px
✅ Modal: Blanco puro con shadow fuerte
✅ Inputs: Blanco con borde gris
✅ Transición: Fade + scale 200ms
```

### Contenedores (Secciones)
```
✅ Glassmorphism: rgba(240, 240, 245, 0.25)
✅ Blur: 16px saturate(180%)
✅ Borde: Blanco notorio rgba(255, 255, 255, 0.5)
✅ Sensación: Cristal esmerilado, premium
```

### Tarjetas (Cards)
```
✅ Background: Blanco limpio
✅ Border: Gris 200 sutil
✅ Shadow: Ninguno (hover: sutil)
✅ Dentro de glassmorphism: Mejor contraste
```

### Botones
```
✅ Primarios: Azul vibrante con hover oscuro
✅ Secundarios: Gris claro con borde
✅ Tamaños: Escalables según contexto
✅ Hover: Cambio suave 200ms
```

### Paginación
```
✅ Tamaño: Tiny (12px, compacta)
✅ Estilo: Minimal, no invasivo
✅ Indicador: Azul pero más sutil
✅ Hover: Muy sutil
```

---

## 🎓 GUÍA DE USO PARA CAMBIOS FUTUROS

### Cuando pidas cambios, especifica:

1. **Componente**: ¿Cuál elemento? (sidebar, modal, card, etc.)
2. **Aspecto**: ¿Qué cambiar? (color, tamaño, blur, etc.)
3. **Dirección**: ¿Más o menos? (más transparente, más visible, etc.)
4. **Contexto**: ¿Dónde afecta? (solo aquí o global?)

### Ejemplos de Requests Efectivos:

```
❌ "Hazlo más bonito"
✅ "Aumenta el blur del sidebar a 28px para más profundidad"

❌ "Cambia los colores"
✅ "Hace la pastilla del sidebar más translúcida, como 15% opacidad"

❌ "Mejora la paginación"
✅ "Reduce el tamaño de paginación a 11px y haz más gris los botones"

❌ "Modifica los modales"
✅ "Aumenta la saturación del backdrop filter a 200% para ver mejor"
```

---

## 📊 MATRIZ DE DECISIONES

### ¿Qué color usar?
```
Azul → Acciones, botones primarios, indicadores
Gris → Fondos, textos secundarios, bordes
Blanco → Modales, cards, espacios limpios
Verde/Rojo → Solo funcionales (éxito/error)
```

### ¿Qué blur usar?
```
8px → Overlays muy sutiles
12px → Pills, indicadores
16px → Contenedores importantes
24px → Sidebars, áreas grandes
```

### ¿Qué sombra usar?
```
Interna → Glassmorphism, profundidad
Externa Sutil → Cards normales
Externa Fuerte → Modales, dropdowns
Combinada → Componentes importantes
```

### ¿Qué tamaño de texto?
```
12px → Etiquetas, IDs, paginación
14px → Cuerpo, descripciones
16px → Títulos menores
20px+ → Headings principales
```

---

## 🎯 CHECKLIST DE DISEÑO

Antes de cada cambio, verifica:

- [ ] ¿Mantiene la consistencia glassmorphism?
- [ ] ¿El contraste es suficiente (WCAG AA mínimo)?
- [ ] ¿Las transiciones son 200ms o menos?
- [ ] ¿Usa la paleta de colores establecida?
- [ ] ¿El blur es apropiado para la profundidad?
- [ ] ¿Los espacios (padding/margin) son múltiplos de 4?
- [ ] ¿Es responsive en mobile/tablet/desktop?
- [ ] ¿Las sombras agregan profundidad sin exceso?

---

## 📝 NOTAS FINALES

**Este lenguaje de diseño es:**
- ✅ Moderno y elegante (glassmorphism)
- ✅ Accesible y legible
- ✅ Escalable y consistente
- ✅ Responsivo y móvil-first
- ✅ Performante (blur GPU-accelerated)

**Próximos pasos sugeridos:**
1. Crear componentes reutilizables con este sistema
2. Documentar excepciones cuando existan
3. Iterar según feedback del usuario
4. Mantener la consistencia en nuevas páginas

---

**¿Preguntas sobre el lenguaje de diseño? ¡Pregunta sin dudas!**
