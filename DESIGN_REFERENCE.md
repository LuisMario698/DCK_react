# 🎨 LENGUAJE DE DISEÑO - GUÍA RÁPIDA DE REFERENCIA

## Paleta de Colores Implementada

### Gris (Base del Diseño)
```
rgba(17, 24, 39, 0.08)   ← Sidebar base (8% gris oscuro)
rgba(240, 240, 245, 0.25) ← Contenedores glassmorphism (gris claro 25%)
#111827                   ← Texto headings (casi negro)
#374151                   ← Texto body (gris oscuro)
#6b7280                   ← Texto secundario
#9ca3af                   ← Texto deshabilitado
#e5e7eb                   ← Borders sutiles
#f3f4f6                   ← Backgrounds claros
```

### Azul (Interacciones)
```
#3b82f6                                    ← Botones primarios, pills activas
#2563eb                                    ← Hover (más oscuro 20%)
#1d4ed8                                    ← Active/Pressed
rgba(59, 130, 246, 0.18)                  ← Gradiente pill (azul 18%)
rgba(37, 99, 235, 0.25)                   ← Gradiente pill (azul 25%)
```

---

## Componentes Clave con Código Real

### 1️⃣ SIDEBAR GLASSMORPHISM

**Ubicación:** `components/layout/Sidebar.tsx`

**CSS aplicado:**
```css
background: rgba(17, 24, 39, 0.08);
backdrop-filter: blur(24px);
border: 2px solid rgba(255, 255, 255, 0.4);
box-shadow: 
  0 8px 32px rgba(0, 0, 0, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.3);
border-radius: 12px;
```

**Características:**
- Ultra-transparente (8% gris)
- Blur máximo (24px)
- Efecto 3D con sombra interna
- Borde blanco sutil (40% opacidad)
- Animación suave: 200ms

**Pill Indicator (Link Activo):**
```css
background: linear-gradient(
  135deg,
  rgba(59, 130, 246, 0.18) 0%,
  rgba(37, 99, 235, 0.25) 100%
);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow:
  0 4px 16px rgba(59, 130, 246, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.3);
border-radius: 8px;
transition: all 0.2s linear;
```

---

### 2️⃣ MODALES (CreatePersonaModal, CreateEmbarcacionModal)

**Ubicación:** `components/personas/CreatePersonaModal.tsx`, `components/embarcaciones/CreateEmbarcacionModal.tsx`

**Overlay:**
```css
background: rgba(0, 0, 0, 0.2);
backdrop-filter: blur(8px);
position: fixed inset-0;
```

**Modal Container:**
```css
background: #ffffff;
border-radius: 12px;
box-shadow:
  0 20px 25px rgba(0, 0, 0, 0.1),
  0 0 0 1px rgba(255, 255, 255, 0.9);
padding: 24px;
max-width: 448px;
```

**Inputs/Textareas:**
```css
background: #ffffff;
border: 1px solid #e5e7eb;
color: #111827;
border-radius: 8px;
focus: ring-2 ring-blue-500;
padding: 8px 12px;
```

---

### 3️⃣ CONTENEDORES GLASSMORPHISM (TiposPersonaManager)

**Ubicación:** `app/dashboard/personas/page.tsx`

**CSS aplicado:**
```css
background: rgba(240, 240, 245, 0.25);
backdrop-filter: blur(16px) saturate(180%);
WebkitBackdropFilter: blur(16px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.5);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.1),
  0 1px 2px rgba(0, 0, 0, 0.05),
  inset 0 0 0 1px rgba(255, 255, 255, 0.6);
border-radius: 12px;
padding: 24px;
overflow: hidden;
```

**Características:**
- Gris claro 25% opacidad
- Blur moderado (16px)
- Saturación (180%) para vibración
- Efecto cristal esmerilado
- Cards blancas adentro para contraste

---

### 4️⃣ PAGINACIÓN

**Ubicación:** `components/embarcaciones/Pagination.tsx`

**Características:**
- Tamaño: `text-xs` (12px)
- Texto info: `text-gray-700` (discreto)
- Selector items: `border text-xs px-2 py-1`
- Botones: `text-gray-600 border hover:bg-gray-50`
- Indicador actual: `bg-blue-500 text-white`
- Espaciado compacto: `gap-2`

---

### 5️⃣ ANIMACIONES GLOBALES

**Ubicación:** `app/globals.css`

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.2s ease-in-out;
```

**Transiciones Sutiles:**
```css
transition: all 0.2s ease;
```

---

## Matriz de Decisiones Rápida

| Necesidad | Solución | Ejemplos |
|-----------|----------|----------|
| Fondo transparente con profundidad | Glassmorphism (blur + rgba) | Sidebar, Contenedores |
| Overlay oscuro | bg-black/20 + blur-8px | Modales |
| Elementos blancos destacados | #ffffff con shadow | Cards, Modales |
| Acciones principales | #3b82f6 con hover #2563eb | Botones, Pills |
| Texto secundario | #6b7280 o #9ca3af | Labels, Descriptions |
| Separaciones sutiles | #e5e7eb borders | Dividers |
| Efecto 3D | Sombras múltiples + inset | Pills, Cards |

---

## Ejemplos de Requests de Diseño

### Request: "Aumentar contraste del glassmorphism"
**Cambios a hacer:**
```
- Aumentar opacidad blanca: rgba(255, 255, 255, 0.5) → 0.6
- Aumentar blur: blur(16px) → blur(18px)
- Intensificar saturación: saturate(180%) → saturate(200%)
```

### Request: "Sidebar más sutil"
**Cambios a hacer:**
```
- Reducir opacidad gris: rgba(17, 24, 39, 0.08) → 0.05
- Reducir blur: blur(24px) → blur(20px)
- Reducir borde: rgba(255, 255, 255, 0.4) → 0.3
```

### Request: "Pills más vibrantes"
**Cambios a hacer:**
```
- Aumentar opacidades: 18% → 25%, 25% → 35%
- Aumentar saturación: No aplica aquí
- Añadir más brillo: Aumentar borde blanco
```

### Request: "Modales menos invasivos"
**Cambios a hacer:**
```
- Overlay más claro: bg-black/20 → bg-black/10
- Blur overlay: blur(8px) → blur(4px)
- Modal más suave: shadow-2xl → shadow-lg
```

---

## Checklist Para Cambios Futuros

Cuando recibas cambios de diseño, verifica:

```
[ ] ¿Está alineado con glassmorphism?
[ ] ¿Usa colores de la paleta?
[ ] ¿La duración es 200ms o menos?
[ ] ¿Hay suficiente contraste?
[ ] ¿El blur es lógico (8-24px)?
[ ] ¿Los espacios son múltiplos de 4px?
[ ] ¿Funciona en mobile?
[ ] ¿Las sombras agregan profundidad?
```

---

## Archivos Clave a Revisar

```
1. components/layout/Sidebar.tsx              ← Glassmorphism + Animations
2. components/personas/CreatePersonaModal.tsx ← Modal styling
3. app/dashboard/personas/page.tsx            ← Container glassmorphism
4. components/embarcaciones/Pagination.tsx    ← Paginación compacta
5. app/globals.css                            ← Animaciones globales
```

---

## Próximas Mejoras Sugeridas

1. **Hover effects más elaborados** - Micro-interactions
2. **Dark mode** - Invertir glassmorphism
3. **Transiciones page-to-page** - Más fluidez
4. **Scrollbar styling** - Siguiendo el theme
5. **Toast notifications** - Con efecto glassmorphism

---

**Este documento es tu referencia para pedir cambios de diseño con precisión.**
**Úsalo para describir qué quieres que cambie y cómo.**
