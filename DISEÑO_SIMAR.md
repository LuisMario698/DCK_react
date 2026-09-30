# Lenguaje de diseño SiMAR

Guía para diseñar y programar pantallas de SiMAR con el mismo aspecto y la misma intención.
Léela antes de crear o rediseñar una pantalla. Si algo no está aquí, copia cómo lo resuelve
**Manifiesto** (`app/[locale]/dashboard/manifiesto/page.tsx`), que es la pantalla de referencia.

- Tokens y utilidades: `app/globals.css` (bloques "LENGUAJE DE DISEÑO SiMAR").
- Referencia visual (lienzo de diseño con Panel, Manifiesto, Recolector, Landing, Acceso y
  Sistema): <https://claude.ai/artifact/57BkZ8FUd7c2sXrir4JHWN>. Es privado: pide a quien lo
  creó que lo comparta.
- Este documento reemplaza a `DESIGN_SYSTEM.md`, `DESIGN_REFERENCE.md` y `DESIGN_SUMMARY.md`
  (el "glassmorphism" anterior).

---

## 1. Para quién diseñamos

Quienes usan SiMAR a diario en el centro de acopio suelen ser **personas mayores**, con poca
costumbre de usar computadoras, que llenan manifiestos con prisa entre la llegada de un barco y
otro. Todo sale de ahí:

1. **Una tarea por pantalla.** Cada pantalla dice arriba qué es y sólo tiene lo que hace falta
   para esa tarea. Nada de paneles con diez widgets.
2. **Grande y claro antes que bonito.** Letra de 17 px o más, botones de 52 px o más, contraste
   alto. Si hay que escoger entre elegancia y legibilidad, gana legibilidad.
3. **Poco estímulo.** Pocos colores a la vez, casi nada de movimiento, nada que parpadee.
4. **Fiel al programa.** No se inventan secciones, datos ni botones. El diseño viste las
   funciones que existen; nunca les cambia la lógica.
5. **Identidad propia, no plantilla.** SiMAR es del Mar de Cortés: papel cálido, azul de marea,
   líneas de profundidad (batimetría) y la ola del logo. Nada de degradados morados ni emojis.

---

## 2. Reglas de oro (resumen)

| Sí | No |
|---|---|
| Clases `simar-*` (`bg-simar-superficie`, `text-simar-texto`…) | Colores sueltos de Tailwind (`bg-blue-600`, `text-gray-500`) |
| Texto de 17–20 px; mínimo 15 px en textos de apoyo | Textos de 11–13 px |
| Botones y campos de 52–64 px de alto | Botones de 32 px |
| Mayúscula sólo al inicio ("Guardar manifiesto") | TODO EN MAYÚSCULAS o `tracking-widest` |
| Íconos de `lucide-react` (trazo 2) | Emojis en la interfaz |
| Vidrio sólo en lo que flota | Vidrio en formularios, tablas o tarjetas |
| Un color para un significado (azul = acción, verde = listo, coral = falta) | Color como único indicador (siempre va con texto) |
| Movimiento que informa: `simar-aparece` al abrir, `simar-ventana` en ventanas, `PalomitaAnimada` al confirmar, `NumeroAnimado` en conteos | Rebotes, parallax, animaciones en bucle |

---

## 3. Color

Los colores son variables CSS `--simar-*` en `app/globals.css`, expuestas a Tailwind como
`bg-simar-*`, `text-simar-*`, `border-simar-*`, etc. **Cambian solas entre modo claro y
oscuro**: no escribas `dark:` para colores de la paleta.

### Neutros

| Token (clase) | Claro | Oscuro | Uso |
|---|---|---|---|
| `simar-papel` | `#E9E4D9` | `#081624` | Fondo de la app, fondo de zonas secundarias dentro de tarjetas |
| `simar-superficie` | `#FFFFFF` | `#132D45` | Tarjetas, formularios, listas, ventanas |
| `simar-borde` | `#D6CEBD` | `#294B68` | Borde de tarjetas |
| `simar-borde-suave` | `#E6E0D4` | `#1E3B56` | Separadores dentro de una tarjeta |
| `simar-campo-borde` | `#9C927D` | `#57789A` | Borde de campos y botones secundarios (2 px). **3:1** contra la tarjeta (WCAG 1.4.11): el campo se ve sin tener que adivinarlo |
| `simar-texto` | `#0B2236` (Abismo) | `#EEF3F7` | Texto principal: 16:1 sobre papel |
| `simar-texto-2` | `#3E5163` (Pizarra) | `#B7C4D0` | Texto de apoyo: 8:1 |
| `simar-texto-3` | `#6B7785` | `#8FA3B4` | Sólo placeholders e íconos decorativos |

### Con significado

| Token | Claro | Significa | Ejemplos |
|---|---|---|---|
| `simar-marea` | `#1B5FC9` | **Acción principal** (texto blanco encima, 6:1) | "Guardar manifiesto", tarjeta Manifiesto, chip activo |
| `simar-marea-hover` | `#154DA6` | Hover del botón principal | |
| `simar-marea-tinta` | `#1B5FC9` / oscuro `#8AB4F8` | Enlaces, íconos azules, borde del campo activo | "Firmar", "¿Olvidaste tu contraseña?" |
| `simar-marea-suave` | `#EAF1FB` | Fondo de círculos de ícono y avisos informativos | |
| `simar-arrecife` / `-tinta` / `-suave` | `#127A5D` / `#0E6A50` / `#E3F2EC` | **Listo, firmado, guardado, completado** (5.3:1) | "Firmado", archivo adjunto, Basurón |
| `simar-coral` / `-suave` | `#A63F0E` / `#FBEADF` | **Falta, requerido, pendiente, sin leer** (6.3:1) | "Requerido", contadores, "Eliminar" |
| `simar-violeta` / `-suave` | `#5B3FA8` / `#EEEAF8` | Estadísticas y todo lo de **superadmin** | Tarjeta Estadísticas, aviso "Modo superadmin" |
| `simar-golfo` | `#20B2C4` | Decorativo: la línea de marea bajo la sección activa | Nunca para texto |
| `simar-abismo` | `#0B2236` | Bandas oscuras de la landing | |
| `simar-espuma` | `#7FE0D6` | Acento sobre fondo oscuro (landing) | |

### Sombra de tarjeta

`shadow-simar` (variable `--simar-sombra`, también cambia con el tema). Toda tarjeta lleva
**fondo `simar-superficie` + borde `simar-borde` + `shadow-simar`**: el papel y la tarjeta se
parecen en luminosidad (1.27:1), así que el borde y la sombra son los que separan la tarjeta del
fondo. No uses sombras más fuertes ni `shadow-2xl` salvo en ventanas modales.

Reglas:

- **El color nunca va solo.** "Requerido" se escribe; "Firmado" lleva palomita y texto; un
  contador lleva número.
- En los avisos, el texto va en `text-simar-texto`; el tono va en el fondo (`-suave`) y en el ícono.
- Verde, coral y violeta son escasos: si una pantalla tiene los tres a la vez, sobra algo.
- Transparencias blancas (`bg-white/60`) sólo sobre vidrio, y con su par oscuro
  (`dark:bg-white/10`). Es el único caso donde se escribe `dark:`.

---

## 4. Tipografía

**Atkinson Hyperlegible Next** (Braille Institute), hecha para personas con baja visión:
distingue bien `I l 1`, `O 0`, `rn m`. Se carga con `next/font/google` en
`app/[locale]/layout.tsx` (variable `--font-atkinson`) y ya es la fuente por defecto (`font-sans`).
No agregues otras familias.

| Uso | Tamaño | Peso | Clase de ejemplo |
|---|---|---|---|
| Saludo del Panel | 38 px (30 móvil) | 800 | `text-3xl md:text-[38px] font-extrabold` |
| Título de pantalla | 34 px (28 móvil) | 800 | `text-[28px] md:text-[34px] font-extrabold` |
| Título de tarjeta de acción | 32 px | 800 | `text-[32px] font-extrabold` |
| Título de tarjeta / sección | 22–26 px | 800 | `text-[23px] font-extrabold` |
| Número dentro de un campo | 22 px | 800 | `text-[22px] font-extrabold` |
| Texto normal, menú, botones | 17–19 px | 400–700 | `text-lg`, `text-[17px] font-bold` |
| Etiqueta de campo | 17 px | 700 | `text-[17px] font-bold` |
| Texto de apoyo, insignias | 15 px (mínimo) | 400–700 | `text-[15px]` |

- Sin MAYÚSCULAS sostenidas y sin `tracking-wider`/`tracking-widest`: cuestan más de leer.
  Encabezados de tabla incluidos (`text-[15px] font-bold text-simar-texto-2`).
- Mayúscula sólo al inicio: "Manifiestos registrados", "Guardar firma".
- Interlineado: `leading-tight` en títulos, el normal en párrafos.

---

## 5. Tamaños, esquinas y espacio

| Elemento | Alto mínimo | Esquinas |
|---|---|---|
| Botón principal ("Guardar manifiesto", "Iniciar sesión") | 60–64 px | `rounded-[18px]` |
| Campo de formulario | 60 px | `rounded-[14px]` |
| Botón secundario, chip, ítem de menú | 48–56 px | `rounded-2xl` / `rounded-full` |
| Botón de ícono (cerrar, menú, campana) | 52 px (44 px en tablas) | `rounded-2xl` / `rounded-xl` |
| Tarjeta de contenido | — | `rounded-[28px]` |
| Tarjeta grande (encabezado del Panel, menú lateral) | — | `rounded-[30px]` |

- Relleno de tarjetas: `p-6 md:p-7`. Separación entre tarjetas: `gap-5`/`gap-6`.
- Separación entre campos: `gap-4`. Etiqueta → campo: `mb-2`.
- Ancho de contenido: todo el espacio disponible hasta `max-w-[1600px]` (en pantallas anchas no
  se deja una franja vacía a la derecha; en ultra anchas el contenido no se estira de más).
- No se reserva espacio a la derecha: el botón de tema vive en el menú lateral (ver 10.2), así que
  el contenido llega hasta el margen normal de la pantalla.
- **Acomodo "a escuadra":** si hay dos columnas, las dos tarjetas terminan a la misma altura
  (la cuadrícula estira; el último campo de la columna más corta crece con `flex-1`, como
  Observaciones en Manifiesto). Lo que no pertenece a una columna va en una franja a lo ancho
  debajo de ambas (como "Adjuntar documento"); nunca un bloque suelto colgando bajo una sola
  columna.

---

## 6. Fondo

`components/layout/FondoSimar.tsx`: papel con dos manchas de luz muy suaves y cuatro curvas de
profundidad detrás del menú lateral. Es decorativo (`aria-hidden`, sin clics) y existe para que
el vidrio del menú tenga algo que difuminar. Ya lo ponen `DashboardLayout` y el layout del
portal recolector; una pantalla nueva dentro de esos layouts no tiene que hacer nada.

- No pongas fotos, degradados ni patrones de fondo en las pantallas de trabajo.
- El contenido va sobre tarjetas `bg-simar-superficie`, nunca directo sobre las curvas.
- No le pongas `z-index` al contenedor del contenido: crearía un contexto de apilamiento y las
  ventanas modales (`fixed z-50`) quedarían debajo del menú lateral.

---

## 7. Vidrio (efecto "liquid glass")

Dos utilidades en `app/globals.css`:

- `.simar-vidrio`: blanco al 56 % con desenfoque de 22 px, borde y brillo de luz.
- `.simar-vidrio-fuerte`: igual pero al 82 %. Úsalo cuando lleva texto sobre fotos o en ventanas.

**Dónde sí** (sólo lo que *flota* sobre el contenido):

- Menú lateral (`Sidebar`, `SidebarRecolector`).
- Botón de tema flotante (`ThemeToggle`), sólo en páginas sin menú lateral (acceso pendiente,
  mantenimiento). En los paneles el botón está dentro del menú (`BotonTema`).
- Encabezado móvil (`Header`) y encabezado del portal (`HeaderRecolector`).
- Barra de guardar del Manifiesto (`sticky bottom-4`).
- Ventana de acceso de la landing y etiquetas sobre fotos.
- Botón de cerrar sobre el visor de detalles.

**Dónde no:** formularios, campos, tablas, tarjetas de contenido, listas. Ahí el fondo es sólido
(`bg-simar-superficie`) para que el texto se lea siempre igual.

Requisitos:

- El elemento necesita `position` (`relative`, `fixed`, `sticky` o `absolute`) porque el borde de
  luz es un `::after` absoluto.
- Si el sistema pide menos transparencia (`prefers-reduced-transparency`), el vidrio se vuelve
  sólido solo. No lo desactives a mano.

```tsx
<div className="simar-vidrio sticky bottom-4 z-20 rounded-[28px] p-3 md:pl-7 flex flex-wrap items-center gap-3">
  …
</div>
```

---

## 8. Movimiento

**Dentro de los paneles el movimiento sólo informa**: algo entró, creció, se guardó, se firmó o
está cargando. Nunca adorna ni se repite solo. **La landing** (la vitrina pública) puede ser un
poco más expresiva, con las mismas prohibiciones. Clases en `app/globals.css` (bloques
"movimiento funcional" y "LANDING"); piezas de React en `components/ui/movimiento.tsx`.

### 8.1 Clases

| Clase | Qué hace | Cuándo |
|---|---|---|
| `simar-aparece` | Entra 8 px desde abajo con opacidad, 0.4 s, sin rebote | Encabezados y tarjetas al abrir una pantalla. Escalonar con `style={{ animationDelay: '0.06s' }}` (pasos de 0.04–0.06 s) |
| `simar-pagina` | Fundido de 0.28 s | Ya lo ponen `DashboardLayout` y los layouts del portal y del superadmin en cada cambio de ruta; no lo repitas |
| `simar-velo` / `simar-ventana` | El fondo se funde y el panel sube 14 px (0.34 s) | Toda ventana modal: `simar-velo` en el fondo oscuro, `simar-ventana` en el panel |
| `simar-velo-sale` / `simar-ventana-sale` | La salida, más rápida (0.18 s) | Con `usePresencia` (ver 8.2) |
| `simar-crece-y` / `simar-crece-x` | La barra crece desde su base / desde la izquierda | Barras de gráficas hechas a mano. Escalonar con `animationDelay` |
| `simar-dibuja` | Dibuja un trazo SVG. El `<path>` lleva `pathLength={1}`, así sirve para cualquier largo. Duración con la variable `--simar-trazo-dur` | La línea de marea, la palomita, las curvas de profundidad del hero |
| `simar-confirma` | Aparece con una leve escala, 0.35 s | Insignias de "Firmado" y avisos de éxito |
| `simar-presiona` | El botón se hunde 1 px al presionarlo | Ya lo lleva `Button`; úsalo en botones principales hechos a mano |
| `simar-tarjeta-accion` | Sube 3 px con sombra al pasar el cursor y baja al presionarla | Sólo tarjetas que llevan a otra pantalla (Panel, KPIs del portal) |
| `simar-esqueleto` | Bloque con un brillo lento | Sólo esqueletos de carga (es un indicador de carga, por eso puede repetirse) |
| `simar-hoja` / `simar-hoja-sale` | Sube desde abajo (0.36 s) / baja (0.2 s) | Hojas inferiores de celular (`HojaInferior`); las ventanas de la zona móvil la usan solas (ver 16) |
| `simar-desplegable` | Baja 6 px desde el campo y aparece (0.2 s); si se abrió arriba del campo, sube | Panel flotante del selector de fecha y hora en computadora (`Desplegable`) |
| `simar-encabezado-movil` | Con `data-oculto="true"` sube y se desvanece | Encabezado móvil del recinto: se esconde al bajar y vuelve al subir (`useOcultarAlBajar`) |
| `simar-trazo` | Trazo con `stroke-dasharray: 420` | Heredada; para trazos nuevos usa `simar-dibuja` |

Curvas: `--simar-frena` (sale rápido y frena suave, para lo que entra) y `--simar-acelera` (para
lo que se va). **Ojo:** `--simar-curva` no es una curva de animación, es el color de las líneas
de profundidad.

### 8.2 Piezas (`components/ui/movimiento.tsx`)

| Pieza | Para qué |
|---|---|
| `NumeroAnimado` | Un número que cuenta al aparecer y pasa del valor anterior al nuevo (al cambiar de período). El lector de pantalla oye sólo el valor final. `TarjetaDato` y `Kpi` ya lo usan cuando el valor es un número |
| `PalomitaAnimada` | Palomita que se dibuja (con círculo, o sólo la marca con `circulo={false}`). "Firmado", "¡Guardado!", avisos de éxito |
| `usePresencia(abierto)` | Deja montada una ventana mientras hace su salida: `{ montado, saliendo }` |
| `Esqueleto`, `EsqueletoPantalla` | Esqueletos para los `loading.tsx` (esperan 0.15 s antes de verse, para no parpadear) |
| `usePrefiereMenosMovimiento()` | Si el sistema pide reducir movimiento (p. ej. el carrusel no avanza solo) |
| `LineaMarea` (`components/layout/LineaMarea.tsx`) | La ola bajo la sección activa; se dibuja al llegar |
| `DeslizarParaActualizar` (`components/layout/`) | Sólo con SiMAR instalada como app: arriba del todo, al jalar hacia abajo baja un círculo de vidrio cuya flecha gira con el tirón; pasado el umbral (se pone azul) y al soltar, la página se recarga. No se activa con una hoja o ventana abierta ni en filas que se deslizan de lado. En una pestaña normal no hace nada |

**Cambiar un dato en pantalla** (otro período, otro residuo): lo de antes se queda a la vista
atenuado con "Actualizando…" (no un círculo que gira ni la pantalla en blanco) y, al llegar lo
nuevo, los números cuentan y las barras pasan de su alto anterior al nuevo. La clave de cada barra
es su posición, así React la conserva y la transición de `height` hace el resto.

### 8.3 Reglas

- Transiciones de color: `transition-colors` (150–200 ms). No uses `transition-all` en elementos
  grandes ni `hover:scale-*` en tarjetas.
- Las entradas usan `animation-fill-mode: backwards`, **no `both`**: una animación de
  `transform`/`opacity` que se queda "aplicada" convierte al elemento en contenedor de las
  ventanas `fixed` de adentro, y quedarían debajo del menú lateral.
- Prohibido: rebotes, parallax, *ken burns*, cosas que se mueven solas en bucle (salvo los
  indicadores de carga) y mover algo que la persona está leyendo.
- Un carrusel que avanza solo necesita botón de pausa, se detiene al pasar el cursor o enfocarlo,
  y con "reducir movimiento" no avanza (landing). En el hero las fotos son el fondo de toda la
  franja: se detienen con el botón o al pasar el cursor / enfocar **sus controles** (si fuera
  sobre todo el hero casi nunca avanzarían).
- Con `prefers-reduced-motion` todo se vuelve instantáneo solo (regla al final del bloque de
  movimiento). No hace falta escribir `motion-safe:`.
- El cambio de tema abre el tema nuevo en círculo desde el botón (View Transitions). En
  navegadores sin soporte, con "reducir movimiento" o en WebKit (Safari y todos los navegadores
  de iPhone/iPad) cambia al instante: WebKit toma mal la "foto" de la transición, el vidrio
  (`backdrop-filter`) sale sin desenfoque y lo fijo se pierde con la página desplazada, y se ve
  un parpadeo en el encabezado y la barra inferior (`esWebKit()` en `ThemeContext`).

### 8.4 Landing: el enfoque

El gesto de la landing es **enfocar**: las cosas llegan difuminadas y se aclaran, como una cámara
que enfoca. Sólo en la landing (`components/landing/`); dentro de los paneles no se usa.

| Pieza | Qué hace | Dónde |
|---|---|---|
| `reveal` (+ `useScrollReveal`) | **Atado al scroll, como las páginas de Apple**: el estado depende de la posición, no del tiempo. Asoma por abajo con `blur(10px)`, transparente y 28 px abajo, y queda nítido al recorrer el 26 % de su paso por la pantalla (`animation-timeline: view()`, `animation-range: cover 0% cover 26%`), o sea en el tercio de abajo. Al bajar rápido todo llega ya nítido; al subir se revierte. `data-delay` (ms) se vuelve un rango que empieza más arriba (650 ms ≈ 16 %). `data-direction="left"/"right"` entra de lado | Antetítulos, párrafos, tarjetas de cada sección |
| `reveal` + `data-efecto="foto"` | Más desenfoque (18 px) y crece de 95 % a 100 %: la foto "se enfoca" (rango hasta 30 %) | Fotos de El proyecto y Don Francisco, el mapa de puertos |
| `reveal reveal-palabras` + `TextoEnfoca` | El título no se mueve: cada palabra se enfoca según su posición, cada una 2 % después que la anterior. El lector de pantalla oye la frase entera una vez (`sr-only`) | Títulos `h2` de las secciones y el llamado final |
| `simar-enfoca` | Lo mismo, al cargar (animación, 1.1 s). Escalonar con `animationDelay` | Contenido del hero |
| `simar-enfoca-simbolo` | El símbolo se enfoca, crece y gira 50° hasta su lugar: las flechas cierran el ciclo | Símbolo grande del hero |
| `simar-enfoca-palabras` + `TextoEnfoca` | Palabras en cascada al cargar; el inicio va en `--retraso` | Subtítulo del hero |
| `simar-hero-foto` (`data-estado="activa"/"anterior"`) | Fotos de fondo: la nueva se funde y se enfoca encima; la anterior queda debajo, nítida | Fondo del hero |
| `simar-hero-tinte` / `simar-hero-velo` | Tinte azul marea (`mix-blend-mode: color`) para que todas las fotos queden en la misma gama; velo `simar-abismo` más oscuro al centro y al pie | Fondo del hero |
| `simar-hero-sale` | Al bajar, el contenido del hero se difumina y se desvanece (sin moverse), atado al scroll (`view-timeline`). Sólo donde el navegador lo soporta y sin "reducir movimiento" | Contenido del hero |

- Navegadores sin animaciones atadas al scroll (Safari de iOS anterior a 26, Firefox): el
  `reveal` entra con `IntersectionObserver` y una transición corta (0.55–0.65 s, retrasos al
  60 %), para que al bajar rápido nada se quede esperando.
- Dentro de un contenedor con scroll propio (el carrusel de Conciencia Azul en celular) no hay
  línea de tiempo vertical: ahí `reveal` va sin animación, ya visible.
- En `animation-range` no uses `var()`: si el valor no sirve, el navegador descarta todo el rango y
  el elemento se aclara hasta que sale por arriba. Por eso el escalonado va con números en línea
  (`useScrollReveal`) y el de las palabras con `:nth-of-type`.
- Un elemento con `simar-presiona` no lleva `reveal` (las dos definen `transition`): el `reveal`
  va en un envoltorio.
- El hero es oscuro a propósito (logo claro `nombre-grande-oscuro.png` sobre fotos). Las fotos con
  texto grande (reconocimientos) no van de fondo: pelean con el logo.
- Con "reducir movimiento" todo aparece ya nítido.

---

## 9. Modo claro y oscuro

- **Claro por defecto.** `ThemeContext` arranca en `light` si el usuario no ha elegido otro; si
  ya eligió, se respeta lo guardado en `localStorage.theme`.
- El modo oscuro funciona con la clase `.dark` en `<html>`. Los tokens `--simar-*` se
  redefinen ahí, así que una pantalla hecha con tokens funciona en los dos modos sin más.
- `.simar-claro` fuerza los valores claros dentro de un bloque. Lo usa la landing, que siempre
  se ve en claro.
- Las firmas y el lienzo para firmar son **siempre blancos** (`bg-white`), también en oscuro,
  porque la tinta es oscura.
- Revisa cada pantalla nueva en los dos modos con el botón "Modo oscuro / Modo claro" del pie
  del menú lateral.

---

## 10. Componentes

Copia estos patrones; ya están en el código.

### 10.1 Estructura de una pantalla

```tsx
<div className="max-w-[1600px] space-y-6">
  <div className="space-y-6">
    {/* Encabezado: ícono en círculo + título + una línea de contexto */}
    <header className="simar-aparece flex flex-wrap items-center gap-5">
      <span className="w-16 h-16 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center">
        <FileText className="w-[30px] h-[30px]" strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-[240px]">
        <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight text-simar-texto">Título de la tarea</h1>
        <p className="mt-1 text-lg md:text-[19px] text-simar-texto-2">Una línea que diga para qué es</p>
      </div>
    </header>

    {/* Tarjeta de contenido */}
    <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7" style={{ animationDelay: '0.06s' }}>
      <h2 className="text-[23px] font-extrabold text-simar-texto">Datos del manifiesto</h2>
      …
    </section>
  </div>
</div>
```

### 10.2 Ítem del menú lateral

`components/layout/Sidebar.tsx`. Ítem de 54 px, ícono de 24 px, texto de 18 px. El activo va
sobre `bg-simar-superficie`, en negritas, con la **línea de marea** (la ola del logo, en
`--simar-golfo`) bajo la palabra: es la firma visual de SiMAR, no la quites ni la copies en otros
lugares. Los grupos se titulan en 15 px negritas ("Externos"), sin mayúsculas. Los contadores
van en coral con número (`SidebarRecolector`).

**Pie del menú** (igual en recinto, portal de empresas y superadmin), de arriba abajo:

1. Tarjeta de perfil (avatar + nombre).
2. Fila con `BotonTema` ("Modo oscuro" / "Modo claro", de `components/layout/ThemeToggle.tsx`) y
   el botón de colapsar (sólo escritorio).
3. "Cerrar sesión" a lo ancho.

Con el menú colapsado los botones quedan sólo con ícono y `title`. En celular el tema está en el
encabezado móvil y en la hoja "Más" (ver 16.2).

### 10.3 Tarjeta de acción (Panel)

`app/[locale]/dashboard/page.tsx` → `ActionCard`. Máximo **tres** por pantalla; sólo una es
principal (fondo `simar-marea`). Ícono de 34 px en círculo de 72 px, título de 32 px abajo y
una línea de descripción.

```tsx
<Link href={href} style={{ animationDelay: '0.08s' }}
  className="simar-aparece simar-tarjeta-accion flex flex-col min-h-[230px] md:min-h-[250px] rounded-[28px] p-7 bg-simar-superficie border border-simar-borde shadow-simar text-simar-texto">
  <span className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-simar-arrecife-suave text-simar-arrecife-tinta">
    <Scale className="w-[34px] h-[34px]" strokeWidth={2} />
  </span>
  <span className="mt-auto pt-6 text-[32px] font-extrabold leading-tight">Basurón</span>
  <span className="mt-1 text-[19px] text-simar-texto-2">Pesar en relleno</span>
</Link>
```

Los accesos secundarios van como pastillas (`OtraSeccion`): 60 px, ícono azul y texto de 19 px.

### 10.4 Campo de formulario

Etiqueta arriba (nunca sólo placeholder), caja de 60 px con borde de 2 px que se vuelve azul al
enfocar. Si el dato tiene unidad, la unidad va escrita dentro, a la derecha.

```tsx
<label className="block mb-2 text-[17px] font-bold text-simar-texto">Aceite usado</label>
<div className={`flex items-center gap-2.5 min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activo ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
  <input type="number" placeholder="0"
    className="flex-1 min-w-0 bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3" />
  <span className="text-[17px] font-bold text-simar-texto-2">litros</span>
</div>
```

- Error: borde `border-simar-coral` y debajo `text-[15px] font-bold text-simar-coral` con el
  motivo ("* Requerido").
- Opcional: se dice en la etiqueta con peso normal: `Observaciones <span className="font-normal">(opcional)</span>`.
- Sugerencias desplegables: `rounded-2xl border border-simar-borde bg-simar-superficie`,
  opciones de `text-lg` con `px-4 py-3`, la resaltada en `bg-simar-marea-suave`.

### 10.5 Botones

| Tipo | Clases base |
|---|---|
| Principal (uno por pantalla) | `min-h-[60px] px-7 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[19px] font-extrabold` |
| Secundario | `min-h-[56px] px-5 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta` |
| Acción por hacer ("Firmar") | `min-h-[60px] rounded-[14px] border-2 border-dashed border-simar-campo-borde bg-simar-marea-suave/50 text-simar-marea-tinta text-lg font-bold` |
| Enlace de texto ("Editar") | `min-h-[44px] text-[15px] font-bold text-simar-marea-tinta hover:underline` |
| Peligro suave ("Borrar", "Eliminar") | `bg-simar-coral-suave text-simar-coral font-bold` o enlace `text-simar-coral hover:underline` |

- El texto del botón es un verbo con objeto: "Guardar manifiesto", "Ver registros", no "OK" ni
  "Enviar".
- Ícono a la izquierda del texto (22 px). Botones sólo-ícono llevan `aria-label` y `title`.
- Cargando: el botón se queda del mismo tamaño y cambia a indicador + "Guardando…".

### 10.6 Insignias y estados

```tsx
<span className="text-[15px] font-bold text-simar-coral">Requerido</span>
<span className="text-[15px] text-simar-texto-2">Opcional</span>
<span className="simar-confirma flex items-center gap-1 text-[15px] font-bold text-simar-arrecife-tinta">
  <PalomitaAnimada tamano={17} circulo={false} />Firmado
</span>
```

La palomita se dibuja cuando aparece la insignia: así se nota que la firma acaba de quedar.

Contador (mensajes, notificaciones): `min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold`.
Es el único texto de 13 px permitido.

### 10.7 Bloque de firma

Cada firmante en su renglón: nombre del rol en 18 px negritas + insignia (Requerido/Opcional) +
una línea de para qué firma. Abajo, el campo de nombre y el botón "Firmar". Ya firmado, se ve la
firma sobre blanco, "Firmado" en verde y los enlaces "Editar" / "Eliminar". Ver Manifiesto →
tarjeta "Firmas".

La ventana para firmar: superficie sólida, título de 22 px, lienzo blanco con "Firme aquí" y
línea de firma, botones de 56 px ("Borrar" a la izquierda; "Cancelar" y "Guardar firma" a la
derecha).

### 10.8 Barra de guardar

Cuando un formulario es largo, las acciones finales viven en una barra de vidrio pegada abajo
(`simar-vidrio sticky bottom-4`). A la izquierda, una frase con el estado ("2 firmas listas."); a
la derecha, el botón secundario y el principal.

### 10.9 Filtros

Chips de 48 px `rounded-full`: activo `bg-simar-marea text-white`; inactivo
`bg-simar-superficie border-2 border-simar-campo-borde text-simar-texto`. "Limpiar filtros" en
coral suave. El selector que abre un filtro va en una caja `bg-simar-papel rounded-2xl` con
etiqueta de 17 px y `select` de 56 px.

### 10.10 Tablas

- Contenedor `rounded-xl border border-simar-borde`, cabecera `bg-simar-papel`, dentro de una tarjeta con `shadow-simar`.
- Encabezados `text-[15px] font-bold text-simar-texto-2`, sin mayúsculas.
- Celdas `text-base`; el dato clave del renglón en negritas.
- Acciones de 44 px: "Ver" (secundario con texto), descargar (azul), eliminar (coral suave).
  Siempre con palabra: "Cancelar", "PDF", "Ver"; nunca sólo el ícono.
- En móvil se ocultan columnas (`hidden md:table-cell`) en vez de encoger el texto.
- **En celular los datos no se pierden:** las columnas que se ocultan (`hidden sm:table-cell`)
  reaparecen **debajo del dato principal** dentro de su celda (`sm:hidden`): cantidad · fecha y la
  insignia de estado bajo el residuo. Así la tabla nunca se corta a la derecha a 390 px. Ver
  `dashboard-recolector/solicitudes` e `historial`.
- Filtros y acción principal de la lista van en **la misma franja**, arriba de la tabla y dentro
  de la tarjeta: fichas de 48 px (`claseChip`) con su conteo en un círculo de 26 px, y a la
  derecha el botón principal ("Nueva solicitud").

### 10.11 Ventanas (modales)

- Fondo `bg-[rgba(11,34,54,0.55)]` (Abismo translúcido), no negro puro, con `simar-velo`.
- Panel `bg-simar-superficie rounded-[28px]` con `simar-ventana`; o `simar-vidrio-fuerte` si va
  sobre una foto (ventana de acceso de la landing).
- Para que también salga con animación, usa `usePresencia(abierto)` y cambia a
  `simar-velo-sale` / `simar-ventana-sale` mientras `saliendo` (así lo hacen `ConfirmationModal`,
  `UserProfileModal`, `CreatePersonaModal`, el `Modal` de `components/asociaciones/ui.tsx` y la
  ventana de acceso de la landing).
- Botón de cerrar de 52 px arriba a la derecha con `aria-label="Cerrar"`.
- Si el componente vive dentro del menú lateral (que tiene `transform`), monta la ventana con
  `createPortal(…, document.body)`.

### 10.12 Avisos

`components/layout/AvisoGlobal.tsx` y los avisos del portal recolector:
`rounded-2xl p-5 text-base text-simar-texto` + fondo suave del tono + ícono de 24 px del tono.
Informativo = marea, advertencia = coral, crítico = coral con borde, superadmin/mantenimiento =
violeta.

### 10.13 Estado vacío

Tarjeta centrada: ícono de 32 px en círculo de 64 px, título de 22 px en negritas y una o dos
líneas en `text-lg text-simar-texto-2` que digan **qué hacer** ("Pide al centro de acopio…").

### 10.14 Logo

`components/layout/LogoSimar.tsx`, con las imágenes en `public/assets/simar/`:

```tsx
<LogoSimar />                                  // símbolo + nombre (menús)
<LogoSimar variante="simbolo" tamano={64} />    // sólo la ola (menú colapsado, ventanas)
<LogoSimar variante="nombre" tamano={80} />     // sólo "SiMAR"
<LogoSimar tono="oscuro" />                     // forzar versión para fondo oscuro
```

El nombre cambia solo entre claro y oscuro. No uses `public/assets/logo_simar.png` directo ni
recolorees el logo.

### 10.15 Íconos

`lucide-react`, `strokeWidth={2}`, 24 px en menús y botones, 22 px dentro de botones con texto,
30–34 px en encabezados y tarjetas de acción. Los íconos grandes van dentro de un círculo con el
fondo `-suave` de su tono. Nada de emojis, ni en botones, ni en filtros, ni en datos.

### 10.16 Piezas listas para usar

No dibujes a mano lo que ya existe. Estas piezas ya siguen el lenguaje:

| Archivo | Piezas |
|---|---|
| `components/ui/simar.tsx` | `EncabezadoPantalla` (ícono + título + subtítulo + acciones), `Tarjeta`, `TarjetaDato` (conteo grande; si el valor es número, cuenta; `href` la vuelve enlace con flecha; `compacto` para textos largos), `Aviso` (info / advertencia), `CampoBusqueda` (56 px con lupa), `claseChip(activo)` (chips de filtro), `CargandoPantalla`, `EstadoVacio` |
| `components/ui/movimiento.tsx` | `NumeroAnimado`, `PalomitaAnimada`, `usePresencia`, `Esqueleto`, `EsqueletoPantalla`, `usePrefiereMenosMovimiento` (ver sección 8) |
| `app/[locale]/dashboard/loading.tsx` | Esqueleto mientras llega una pantalla del recinto (Estadísticas tiene el suyo) |
| `components/ui/Button.tsx` | `variant`: `primary` (marea), `secondary` (borde 2 px), `danger` (coral sólido); `size`: `sm` 44 px, `md` 52 px, `lg` 60 px |
| `components/ui/ConfirmationModal.tsx` | Confirmación de borrado |
| `components/ui/Table.tsx` | `Table`, `TableHeader`, `TableHead`, `TableRow`, `TableCell` |
| `components/embarcaciones/Pagination.tsx` | Paginación de 44 px |
| `components/asociaciones/ui.tsx` | `Modal`, `Campo` + `inputCls`, `BotonPrimario`, `BotonSecundario`, `EstadoSolicitudBadge`, `ResiduoBadge`, `Cargando`, `ErrorCarga` |
| `components/superadmin/ui.tsx` | `Tarjeta`, `Kpi`, `Pestanas`, `Interruptor`, `BotonIcono`, `ModalConfirmar`, `EstadoVacio` |
| `components/ui/simar.tsx` → `PestanasMovil` | Pestañas que sólo existen en celular ("Nuevo" / "Registros"). Ver 16 |
| `components/layout/BarraInferior.tsx`, `HojaInferior.tsx`, `HojaMas.tsx` | Barra de navegación inferior, hoja que sube desde abajo y el menú "Más" del recinto. Ver 16 |

Ejemplo de pantalla de lista (así están Embarcaciones y Personas):

```tsx
<div className="max-w-[1600px] space-y-6">
  <EncabezadoPantalla icono={Ship} titulo="Gestión de embarcaciones" subtitulo="…"
    acciones={<Button size="lg" onClick={…}><Plus className="w-[22px] h-[22px]" />Nueva embarcación</Button>} />
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <TarjetaDato etiqueta="Activos" valor={activos} icono={CheckCircle2} tono="arrecife" />
  </div>
  <Tarjeta className="p-5 flex flex-col md:flex-row md:items-center gap-4">
    <CampoBusqueda className="flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
    {estados.map((e) => <button key={e} onClick={() => setEstado(e)} className={claseChip(estado === e)}>{e}</button>)}
  </Tarjeta>
  <EmbarcacionesTable … />
</div>
```

### 10.17 Estados de una solicitud

Los mismos colores en toda la app (`EstadoSolicitudBadge` y `NotifIcon`), siempre con ícono y texto:

| Estado | Color |
|---|---|
| Pendiente | coral suave (falta que alguien actúe) |
| Aprobada | marea suave (en curso) |
| Completada | arrecife suave (listo) |
| Rechazada | coral sólido `#A63F0E` con texto blanco |
| Cancelada | papel con texto de apoyo |

### 10.18 Colores de categoría y gráficas

Los tipos de residuo (plástico, aceite, cartón…) tienen su propio color en
`lib/constants/residuos.ts` (`TIPO_RESIDUO_COLOR` para insignias, `TIPO_RESIDUO_HEX` para
gráficas y mapa). Son la **única** excepción a "sólo tokens": sirven para distinguir categorías y
siempre van con su nombre escrito. En gráficas propias usa la familia SiMAR: aceite coral,
basura marea, basurón arrecife.

- **Franja de color por residuo:** en listas de residuos el color de la categoría va en una franja
  a la izquierda (`border-l-[6px]` + `style={{ borderLeftColor: TIPO_RESIDUO_HEX[tipo] }}`) y la
  cantidad en `text-simar-texto` (en color no se leía). Ver "Residuos disponibles".
- **Gráficas con Recharts:** trazos y ejes con variables (`stroke="var(--simar-arrecife)"`,
  `tick={{ fontSize: 15, fill: 'var(--simar-texto-2)' }}`, rejilla `var(--simar-borde)`), así
  cambian solas en modo oscuro. Periodo actual = arrecife, línea continua con relleno suave;
  periodo anterior = `--simar-marea-tinta`, punteada (`strokeDasharray="6 5"`) y sin relleno. La
  leyenda se dibuja igual que las líneas (muestra de línea, no cuadritos) y el globo es oscuro con
  texto blanco. Ver `dashboard-recolector/impacto`.
- Barras hechas a mano: colores sólidos (`bg-simar-marea`, `bg-simar-coral`…), nunca los `-suave`
  (sobre blanco casi no se ven).
- **Nunca se suman unidades distintas.** Basura y basurón en kg, aceite en L, filtros en piezas:
  cada uno en su cifra, su barra y su comparación. Una barra apilada "kg + L" o una dona con
  "kg total" que incluye litros es un error, no un resumen.
- **Pantalla Estadísticas** (`components/dashboard/EstadisticasGenerales.tsx`): todo sale del
  mismo período (`getEstadisticasPeriodo`). Se acomoda en el orden en que se lee: qué entró →
  cómo cambia → quién → a dónde se fue → qué se logró. De arriba abajo: el período, con
  **"Descargar PDF"** a la derecha (en celular, junto a "Período"); un **titular de una
  línea** con lo más importante ("Más basura +36 % y más aceite +23 % que el mes anterior"; sin
  período anterior, "10,760 kg de basura y 653 L de aceite en el último mes"), con una línea violeta
  a la izquierda y el botón **"Leer resumen"**, que despliega la frase completa ("En el último mes
  se recibieron … en 36 manifiestos de 16 embarcaciones.") con la fila de la cuadrícula pasando de
  `0fr` a `1fr`. Cerrado por defecto: una frase larga al entrar se sentía como "mucho texto de la
  nada" y repetía las cifras de abajo. Abierto o cerrado se recuerda en el navegador
  (`localStorage`, `useSyncExternalStore`); cerrado, el texto es `inert`. Luego cuatro cifras
  (basura, aceite, basurón, manifiestos) con su comparación
  **neutra** (flecha y porcentaje en color de texto: más o menos no es bueno ni malo por sí solo);
  la **tendencia** de un residuo a la vez (control de tres opciones; por día, semana, mes o año
  según el período; eje Y con números redondos; promedio punteado; la lectura de arriba dice el
  valor de la barra señalada o el promedio) junto a **Embarcaciones** (un tercio): dos vistas con
  control de dos opciones, "Más entregas" (llevan a Reportes con esa embarcación y el período) y
  "Sin entregar" (activas con más de 60 días sin manifiesto, o que nunca han entregado; su número
  va en coral en la pestaña cuando hay alguna; no depende del período); **"¿A dónde se fue?"** a
  todo lo ancho; y el **impacto estimado** a todo lo ancho, como cierre. Los filtros de motor ya no
  tienen tarjeta propia: su desglose va en su renglón de "¿A dónde se fue?".
- **¿A dónde se fue?** (`DestinoResiduos.tsx`): la trazabilidad que promete SiMAR. Tres tarjetas
  (una columna en celular y tableta, tres en computadora): aceite (L) y filtros (piezas) con su
  recorrido — recibido → a reciclaje (verde suave, lo importante) → en acopio hoy — la barra de
  "% de lo recibido ya salió a reciclaje" (explicada en palabras si salió más de lo recibido o nada)
  y "Se lo llevaron: empresa (cantidad)". El recorrido **se acomoda al ancho de su tarjeta**, no al
  de la pantalla (la tarjeta es `@container`): desde 20rem por dentro va en fila, con la cifra
  escalada al ancho (`cqi`); más angosta (tres tarjetas en una laptop de 1280–1440 con el menú
  abierto, o celular) va de arriba abajo, etiqueta a la izquierda y cantidad a la derecha, porque
  en fila ahí se cortaban las cantidades. "Materiales reciclables" (plástico, cartón,
  chatarra, vidrio, orgánico, en kg) no lleva "recibido" ni porcentaje: en los manifiestos sólo hay
  "basura" en general. Salidas = tabla `recolecciones` del período; en acopio = `inventario_residuos`
  de hoy.
- **Descargar PDF** (`components/dashboard/pdfEstadisticas.ts`, jsPDF, se carga al tocar): hoja
  A4 con el símbolo, el período y sus fechas, el titular, las cuatro cifras, dos gráficas de barras
  (basura en kg y aceite en L), las embarcaciones (que más entregan y sin entregar), a dónde se fue y
  el impacto con su nota de factores provisionales; pie con número de hoja. Usa los mismos textos y
  equivalencias que la pantalla. Las fuentes de jsPDF no traen "₂" ni "−": ahí se escribe "CO2" y "-".
- **Impacto estimado:** tarjeta blanca como las demás (antes un bloque verde sólido con cuatro
  cuadros cuyas equivalencias sólo salían al pasar el cursor), a todo lo ancho. **Lo grande es la
  equivalencia en algo conocido**, no la
  cifra técnica: tres cuadros verdes suaves (`bg-simar-arrecife-suave`) con el número de la
  equivalencia en 44 px y su nombre en verde ("1.2 **albercas olímpicas**", "416 **árboles**", "1.5
  **camiones recolectores**"), una línea que dice qué es ("de agua que no se contaminó con
  aceite", "absorberían en un año el CO₂ que se evitó", "llenos de basura que no terminó en el
  mar") y abajo, como dato de apoyo, la cifra técnica ("2.9 millones de litros de agua"). La
  equivalencia cambia con el tamaño para no decir "0.1 albercas": albercas de 2.5 millones de L o
  tinacos de 1,100 L; camiones de 8 t o bolsas de 10 kg; árboles o, con muy poco CO₂, km en auto.
  "¿Cómo se calcula?" despliega las fórmulas y que los factores son provisionales
  (`lib/constants/impacto.ts`); la etiqueta "Estimado" va junto al título. En celular cada cuadro
  es un renglón con el ícono a la izquierda.
- En el eje X de celular: los meses con su inicial y, si no caben, una etiqueta cada tantas barras.

### 10.19 Cosas que se descubrieron migrando

- **Nunca esconder acciones hasta pasar el cursor** (`opacity-0 group-hover:opacity-100`): una
  persona mayor no las encuentra y en pantalla táctil no existen. Los botones Editar/Eliminar se
  ven siempre.
- **Globos oscuros** (tooltips, ventanas de "esto equivale a…"): `bg-simar-abismo` (oscuro en los
  dos temas) con texto `text-white` y `text-white/80`. No uses `bg-simar-texto`: en modo oscuro
  se vuelve claro.
- **Blanco translúcido** (`bg-white/10`, `bg-white/20`) sólo sobre un fondo de color (la tarjeta
  verde de impacto, un botón azul). Se queda blanco; no lo cambies a `bg-simar-superficie/…`.
- **Firmas y lienzos de firma siempre en `bg-white`**, también en modo oscuro (la tinta es oscura).
- **La acción principal siempre es azul (marea)**, también en el portal de empresas. El verde
  (arrecife) significa "listo / disponible", no "botón".
- **Superadmin** usa el mismo menú de vidrio con acento violeta (ícono activo y etiqueta
  "Superadmin").
- **Textos cortos y claros** en controles: "1 mes, 3 meses" en vez de "1m, 3m"; "Ver" junto al
  ícono del ojo.
- **Fechas y horas** siempre con `SelectorFecha` y `SelectorHora` (`components/ui/`), nunca con
  `<input type="date">` / `type="time"` (se ven distinto en cada teléfono) ni con librerías. Ver
  "Selector de fecha y hora" en la sección 16.
- **Editar / Guardar / Cancelar** en una ficha de datos son botones de 52 px, no enlaces
  subrayados: "Editar" secundario (borde 2 px); al editar, "Cancelar" secundario y "Guardar"
  principal (marea). Los campos en edición usan `inputCls` (borde de 2 px). Ver
  `dashboard-recolector/perfil`.
- **Elegir varias opciones** (tipos de residuo): fichas de 48 px con `claseChip(activa)` y una
  palomita en la elegida (`aria-pressed`), no sólo el cambio de color.
- **No leído** (notificaciones): franja azul a la izquierda (`border-l-[5px]
  border-l-simar-marea-tinta`) y la palabra "Nueva" en una insignia; nunca sólo un punto de color.
  "Marcar todas como leídas" es un botón de 48 px.
- **Tarjetas de datos que llevan a otra pantalla:** `TarjetaDato` con `href` (toda la tarjeta es
  el enlace, con flecha a la derecha y `simar-tarjeta-accion`). Para valores de texto largos
  ("Puerto Peñasco", "Hace 1 día") usa `compacto`.
- **`LogoSimar` con visibilidad por tamaño:** si le pasas `hidden` / `lg:inline-flex` en
  `className`, el componente ya no agrega su propio `inline-flex` (chocaban y en celular salían
  dos logos con el menú colapsado).

---

## 11. Textos

- Español, frases cortas, de tú: "Selecciona una opción", "Escribe el nombre del barco…". (Hay
  textos viejos de usted, como "Dibuje su firma"; al tocarlos pásalos a tú.)
- Títulos que digan la tarea: "Manifiesto de entrega-recepción", no "Módulo de gestión".
- Unidades siempre visibles: litros, piezas, kg.
- Nada de jerga técnica en la interfaz (ni "registro creado en BD", ni códigos de error crudos).
- Mensajes de estado en positivo y con el siguiente paso: "Aún no hay firmas. También puedes
  adjuntar el documento firmado."

---

## 12. Lo que SiMAR no usa

- Emojis en la interfaz.
- Degradados de fondo (azul→morado, "glow", neones) y texto con degradado.
- Colores de Tailwind sueltos (`blue-600`, `gray-400`, `indigo-*`…) en pantallas migradas.
- Mayúsculas sostenidas y letras espaciadas.
- Texto menor de 15 px (salvo el número de los contadores).
- Vidrio sobre contenido o formularios.
- Tarjetas que crecen (`hover:scale`), rebotes, parallax, *ken burns*, carruseles que se mueven
  rápido.
- Métricas decorativas o datos inventados para "llenar" una pantalla.
- Íconos sin texto como única forma de entender una acción principal.

---

## 13. Lista para una pantalla nueva

- [ ] ¿La pantalla hace **una** tarea y el título lo dice?
- [ ] ¿Cada tarjeta lleva `bg-simar-superficie border border-simar-borde shadow-simar`?
- [ ] ¿Las columnas terminan a la misma altura y no hay bloques sueltos bajo una sola columna?
- [ ] ¿Todos los colores son `simar-*`? (`grep -n "gray-\|blue-\|slate-" archivo.tsx` debe dar 0)
- [ ] ¿Letra de 17 px o más en lo principal y nunca menos de 15 px?
- [ ] ¿Botones y campos de 52 px o más; el principal de 60 px?
- [ ] ¿Cada campo tiene etiqueta visible?
- [ ] ¿El color siempre va acompañado de texto o ícono?
- [ ] ¿Sin emojis ni mayúsculas sostenidas?
- [ ] ¿Vidrio sólo en lo que flota?
- [ ] ¿Sólo movimiento de la sección 8 (entrar, crecer, dibujar, confirmar, cargar) y nada en bucle?
- [ ] ¿Las ventanas llevan `simar-velo` + `simar-ventana`? ¿Se ve igual con "reducir movimiento"?
- [ ] ¿Se ve bien en claro, oscuro y a 390 px de ancho? ¿En celular cabe lo principal sin bajar
      mucho (sección 16)?
- [ ] ¿Se puede recorrer con el teclado y el foco se ve?
- [ ] ¿Las acciones se ven sin pasar el cursor?
- [ ] ¿La lógica quedó igual? (`python3 scripts/comparar-manejadores.py archivo.tsx` → "iguales")

---

## 14. Estado de la migración

**Todas las pantallas en uso ya tienen el lenguaje nuevo:** landing y acceso, Panel, Manifiesto,
Recibo relleno sanitario (Basurón), Embarcaciones, Personas, Estadísticas, Asociaciones (con sus
cuatro pestañas), perfil de usuario, el portal de empresas completo (Inicio, Residuos disponibles,
Mis solicitudes, Historial, Impacto, Mensajes, Notificaciones, Perfil), el panel de superadmin
(Resumen, Cuentas, Suscripciones, Planes, Auditoría, Sistema), Acceso pendiente, Mantenimiento y
el modo simple (`/dashboard/simple`).

**Se quedaron como estaban, a propósito:**

- El dibujo del mapa de puertos de la landing (`MapaSilueta.tsx`, `MapaMapLibrePuertos.tsx`) vive
  en una banda oscura y tiene su propio estilo. Su panel (`SeccionMapaPuertos.tsx`: cifras, ficha
  del puerto, leyenda y botones) ya sigue la escala SiMAR: 15 px o más, sin mayúsculas, botones de
  48 px.
- Código que ninguna pantalla importa: `components/manifiestos/CreateManifiestoModal.tsx`,
  `components/layout/sidebars/SidebarVariantD.tsx`, `components/layout/LanguageSwitcher.tsx`. Si
  alguno vuelve a usarse, mígralo primero.

### Cómo migrar una pantalla (o una nueva que llegue con estilos viejos)

1. `python3 scripts/simarizar.py ruta/archivo.tsx` — convierte colores, tamaños, etiquetas,
   campos y botones de cerrar (lee la explicación al inicio del script).
2. A mano: encabezado con `EncabezadoPantalla`, conteos con `TarjetaDato`, búsqueda con
   `CampoBusqueda` + `claseChip`, acomodo "a escuadra", botones de ícono a 44 px, textos.
3. Revisa claro, oscuro y 390 px de ancho. Revisa que las firmas sigan en blanco.
4. `python3 scripts/comparar-manejadores.py ruta/archivo.tsx` → debe decir "iguales" (no cambió
  ningún `onClick`, `onChange` ni `ref`).

---

## 15. Notas técnicas

- Tailwind v4 sin `tailwind.config`: los tokens nuevos se agregan en `:root`, en `.dark`, en
  `.simar-claro` y en `@theme inline` de `app/globals.css` (los cuatro lugares). Los colores van
  como `--color-simar-*` y la sombra como `--shadow-simar`.
- Instala dependencias respetando `package-lock.json` (`npm install`, no `npm update`). Con
  versiones más nuevas que las del lockfile (Next 16.3 / Tailwind 4.3) el build falla al leer
  `globals.css` con "Invalid dangling combinator in selector", aun sin cambios nuestros.
- La fuente usa `adjustFontFallback: false` porque Next no tiene métricas de Atkinson
  Hyperlegible Next; así el build no avisa.

---

## 16. Versión móvil

En celular (menos de 640 px) SiMAR es **compacto**: se ve más en cada pantalla y se baja menos.
Es una decisión del proyecto (sep-2026): en teléfono el espacio manda, pero nada baja de los
mínimos de tacto y lectura (botones ≥ 38–46 px, texto ≥ 13–14 px). **Tableta y escritorio
conservan la escala grande de las secciones 4 y 5.** Hoy lo tienen los tres paneles con las mismas
reglas —el recinto (`DashboardLayout`), el portal de empresas (`dashboard-recolector/layout.tsx`) y
el superadmin (`superadmin/layout.tsx`)— y la landing.

### 16.1 Dos herramientas (en `app/globals.css`)

| Qué | Cómo | Para qué |
|---|---|---|
| Escala compacta automática | Clase `simar-compacto` en el contenedor del panel (ya la pone `DashboardLayout`) | Baja de una vez `--spacing` (p-6, gap-5, w-6… al 87.5 %), los tamaños con nombre (`text-lg`, `rounded-2xl`…) y los tamaños fijos del lenguaje: 15→14, 17→15, 19→16, 22/23→18, 28→21 px; controles 64→50, 60→46, 56→44, 52→42, 48/44→38 px; esquinas 28→20, 18→14, 14→12 px |
| Variante `movil:` | `movil:grid-cols-2`, `movil:hidden`, `movil:text-[15px]`… | Cambiar el **acomodo** en celular: columnas, ocultar, deslizar, pestañas. Funciona dentro de `.simar-compacto` y de `.simar-landing`. Un valor `movil:` es **exacto**: le gana a la escala automática |

- Para portar otro panel a la versión móvil basta con poner `simar-compacto` en su contenedor y
  luego ajustar el acomodo con `movil:`.
- La landing no lleva la escala automática (sus títulos son expresivos): sólo usa `movil:`.
- Lo que se oculta en celular con `movil:hidden` debe estar en otro lado (pestaña, hoja, "Leer
  más") o ser un texto de apoyo repetido. Nunca se pierde una función.
- Si en celular la pantalla es **otra** (no sólo otro acomodo) y esconderla con CSS dejaría algo
  pesado montado de balde, como un mapa, la pantalla elige con `useEsCelular()`
  (`components/layout/useEsCelular.ts`, mismo corte de 640 px). Hoy sólo Residuos del portal.

### 16.2 Navegación

- **Encabezado móvil** (`Header`): píldora de vidrio de 56 px con el logo (lleva al Panel), el tema
  y el perfil. Se esconde al bajar y vuelve al subir o al recibir el foco. En el portal
  (`HeaderRecolector`, menos de 1024 px) es la misma píldora con la campana de notificaciones en
  lugar del perfil; como sus pantallas no traen título propio, `TituloPantallaRecolector` pone uno
  con `EncabezadoPantalla` (salvo en Inicio, que tiene su saludo, y en Mensajes, donde manda el chat).
  En el superadmin (`HeaderSuperadmin`) la píldora lleva la marca violeta "Superadmin" y el tema, y
  `TituloPantallaSuperadmin` pone el título (tono violeta). En escritorio el portal y el superadmin
  conservan su encabezado con el título.
- **Barra inferior** (`BarraInferior`): cápsula de **cristal líquido** plano (16.4) flotante a 10 px del
  borde (respeta la zona segura del teléfono). Cuatro secciones + un botón al final. Palabras de
  9.5–12 px: `BarraInferior` mide la palabra más larga con la fuente real y el ancho que tendrá
  cada botón en ese teléfono, y elige el mayor tamaño con el que todas caben dentro de la gota
  (variable `--barra-letra`; se recalcula al cambiar el ancho o al cargar la fuente). Si ni a
  9.5 px cabe (teléfonos de ~330 px o menos), la barra queda sólo con íconos, como minimizada. **Todos los botones miden lo mismo** (`flex-1`, sin huecos
  entre ellos) y la gota también; así "Estadísticas" cabe en 360 px. La palabra activa no cambia de
  peso (sólo de color) para que no salte cuando llega la gota.
  - **Se minimiza al bajar** (`data-mini`): las palabras se cierran, baja de 70 a 56 px y se
    angosta a sólo íconos; al subir, al volver arriba o al abrir "Más" regresa. Lo que va pegado
    abajo (`simar-pegada-abajo`) baja con ella (`html[data-barra-mini]`).
  - **La gota** (`simar-gota`) marca la sección activa: un tinte plano y translúcido (gris suave en
    claro, blanco suave en oscuro, sin brillos ni sombras) en forma de **cápsula**. Con la barra
    completa sobresale 3 px por lado de su botón (`GOTA_EXTRA`) para que su curva no corte las
    letras; la barra reserva ese margen a los lados (`padding: 4px 7px`), así la gota de la
    primera y la última sección queda **centrada** en su botón y concéntrica con la curva de la
    barra, y nunca toca la palabra del vecino. Minimizada mide lo mismo que el botón. Se desliza con física de resorte (la orilla de adelante tira, la de atrás la sigue: se estira, se aplana y se
    asienta con un vaivén corto). Se va a la sección en cuanto se toca, sin esperar a que cargue.
  - **Arrastrar**: deslizar el dedo de lado sobre la barra levanta la gota, que sigue al dedo; al
    soltar abre la sección que quedó debajo. Un toque normal sigue funcionando igual.
  - La sección activa, además de la gota, lleva ícono y palabra en `simar-marea-tinta` y negritas
    (el color nunca va solo).
- **Hoja "Más"** (`HojaMas` sobre `HojaInferior`): en el recinto el último botón abre una hoja
  desde abajo con el perfil, las otras secciones en mosaico de tres, los accesos de superadmin,
  el tema y cerrar sesión. Se cierra con el fondo, con Escape, arrastrando la agarradera o al
  elegir una sección; bloquea el desplazamiento de atrás y devuelve el foco al botón. El portal
  tiene la suya (`HojaMasRecolector`): la empresa arriba (lleva a su perfil), Historial, Impacto y
  Notificaciones (con su aviso) en mosaico, accesos de superadmin, tema y cerrar sesión; su barra es
  Inicio · Residuos · Solicitudes · Mensajes (con los sin leer) + "Más", y su menú lateral sólo existe
  en escritorio. El superadmin igual (`HojaMasSuperadmin`): quién eres, Planes y Auditoría en
  mosaico, los accesos a los otros paneles, tema y cerrar sesión; su barra es Resumen · Cuentas ·
  **Cobros** · Sistema + "Más" ("Suscripciones" no cabe en cinco botones ni a 9.5 px: una palabra
  que no cabe deja la barra entera sin palabras, así que la barra usa un nombre corto y la pantalla
  conserva su título). "Elegir / cambiar asociación" desde la hoja abre su ventana en el layout
  (`EnlacesPaneles` → `onElegirAsociacion`): dentro de la hoja quedaría debajo de ella.
- Contenido: `pb-[calc(100px+env(safe-area-inset-bottom))]` en `main` para que la barra no tape
  lo último. Las barras pegadas abajo usan `simar-pegada-abajo` (quedan encima de la barra).

### 16.3 Patrones de pantalla

| Patrón | Dónde | Cómo |
|---|---|---|
| Pestañas "Nuevo / Registros" | Manifiesto, Basurón | `PestanasMovil` + `movil:hidden` en la parte que no toca. En tableta y escritorio se ve todo como siempre |
| Campos cortos en dos columnas | Residuos del manifiesto, fecha y hora del recibo | `movil:grid-cols-2`; el último impar con `movil:col-span-2` |
| Firmar al lado del nombre | Firmas del manifiesto | `movil:grid-cols-[1fr_auto]`; ya firmado, la firma ocupa el renglón (`movil:col-span-2`) |
| Barra de guardar en una fila | Manifiesto, Basurón | Estado corto a la izquierda ("Aún no hay firmas.") y el botón a la derecha |
| Fila de chips que se desliza | Filtros, accesos rápidos, pesos rápidos, puertos | `simar-desliza` + `movil:flex-nowrap movil:overflow-x-auto movil:-mx-4 movil:px-4`, chips con `flex-shrink-0 whitespace-nowrap` |
| Renglón de lista con acciones arriba | Registros de manifiestos y recibos | La celda de acciones va `movil:absolute` a la derecha de la primera línea; ahorra una línea por registro |
| Tabla que se vuelve bloques | Inventario y Solicitudes (Asociaciones); Mis solicitudes e Historial (portal); Cuentas, Invitaciones, Suscripciones, Pagos, Auditoría y Buckets (superadmin) | `movil:block` en tabla y tbody, `movil:hidden` en thead y `movil:grid` en cada fila con celdas colocadas |
| Conteos en fila | Personas, Embarcaciones, Inventario; Inicio e Impacto (portal) | `TarjetaDato apilada`: ícono y número en la primera línea, etiqueta debajo; tres por fila (dos si llevan flecha o comparación, como en el portal) |
| KPI compacto | Estadísticas; indicadores del superadmin (`Kpi`: Resumen, Suscripciones, Sistema) | Ícono y título en una línea, número debajo; dos por fila. Si el detalle es largo, en celular una versión corta ("1 por vencer · 0 pendiente(s)") |
| Lo que se usa, primero | Portal: Inicio | En celular el mapa (sólo muestra dónde está el centro de acopio) baja con `movil:order-2`: primero la actividad reciente |
| Pantalla para pedir | Portal: Residuos disponibles | Vista propia en celular (`ResiduosCelular`). Arriba, el centro de acopio en una tarjeta corta: foto de 68 px, nombre y cuántos residuos hay, con **Ver mapa** (el mapa sube en una hoja con "Cómo llegar", que abre Google Maps) y **Escribir** (Mensajes). Debajo, los residuos en renglones de una sola tarjeta: círculo con el color y el ícono del material, nombre, cantidad en texto oscuro, notas y **Solicitar** a la derecha ("Agotado" si no hay). Si la empresa eligió sus materiales, `ControlSegmentado` "Todos · Los que recolecto". Las cuatro tarjetas de datos de escritorio no están: el número de residuos va en la tarjeta del centro y "Actualizado hace…" en la de la lista. La hoja de solicitar no abre el teclado sola y su botón principal lleva el ancho sobrante |
| Ventanas como hoja inferior | Todas las ventanas `fixed › simar-ventana` del recinto y del portal, y el acceso de la landing | Automático (CSS): a todo lo ancho, esquinas sólo arriba, sube con `simar-hoja`, máximo 92 % del alto |
| Burbuja flotante | Personas, Embarcaciones, Asociaciones (Nueva asociación), Inventario (Agregar residuo), Mis solicitudes del portal (Nueva solicitud, lleva a Residuos) y el superadmin (Invitar cuenta, Nuevo plan) | `BotonFlotante`: la acción principal de la lista flota a la derecha, encima de la barra inferior. Extendida (ícono + palabra) arriba de la página; al bajar se encoge a un círculo de 56 px y baja con la barra minimizada. En la pantalla, la acción del encabezado lleva `accionesClassName="movil:hidden"` (en tableta y escritorio sigue ahí) |
| Pestañas con su aviso | Asociaciones | En celular las tarjetas de conteo se ocultan. Las cuatro secciones en una fila (ícono arriba, palabra abajo) y **sólo los avisos** van en la esquina del ícono, en coral con un aro del color de fondo (pendientes, sin leer), como en las apps del teléfono. Un número que no pide nada (asociaciones activas) no va en la pestaña: va dentro de su sección ("3 activas de 4 registradas") |
| Jerarquía de navegación | Asociaciones | Tres niveles que no se parecen: la **barra inferior** (cristal), las **secciones** de la pantalla (pastilla azul rellena, el único azul) y los **filtros** de cada sección (`ControlSegmentado`: canal gris y la opción elegida en blanco). Dos niveles con el mismo azul relleno se leen como uno solo |
| Filtro segmentado de pocas opciones | Asociaciones → Solicitudes y Asociaciones; portal: Mis solicitudes e Impacto (periodo) | `ControlSegmentado` (`components/asociaciones/ui.tsx`): una fila sin deslizar, palabra de `clamp(12px, 3.6vw, 14px)`. Va dentro de una tarjeta blanca (su canal gris no se ve sobre el fondo de la página). Si hay muchas opciones, se agrupan y se afinan con un selector nativo ("Mostrar: Completadas (3)"): en el recinto **Pendientes · Por recolectar · Historial** (lo que hay que atender primero, con su número; coral si hay pendientes); en el portal **Todas · Activas · Terminadas** ("Activas" como en su Inicio). En tableta y escritorio siguen las pestañas de siempre |
| Renglón de solicitud | Asociaciones → Solicitudes | Nombre en hasta dos líneas (`movil:line-clamp-2`) con la fecha de recolección debajo; estado a la derecha (etiqueta angosta en celular); residuo y cantidad; la acción principal **con su palabra** (Aprobar, Rechazar, Completar, Comprobante) a la izquierda y las de ícono a la derecha |
| Formulario en hoja, no en la fila | Asociaciones → Inventario (agregar y editar residuo) | En celular no se edita dentro del renglón: se abre un `Modal` (que ya sube como hoja inferior) como el de "Nueva asociación". El tipo se elige tocando cuadros de dos columnas (color del material y su unidad), la unidad va dentro del campo de cantidad y "Publicado" es un interruptor que ocupa toda la fila. La pantalla decide al abrir con `matchMedia('(max-width: 639px)')`; en tableta y escritorio sigue la edición en la fila |
| Filtros que se abren | Superadmin → Auditoría | Con cinco filtros o más, en celular van detrás de un botón **Filtros** (con cuántos hay activos y "Limpiar" al lado) que los despliega en dos columnas; a la vista ocuparían media pantalla antes del primer registro |
| Mucha información por renglón | Superadmin: Cuentas, Suscripciones, Pagos, Auditoría | La primera celda junta en líneas de 13 px lo de las columnas ocultas (rol y asociación; plan, precio y vigencia; método y referencia; registro, fecha y usuario). En Auditoría la fecha va antes del correo: si no cabe, que se corte el correo y no la hora |
| Gráfica de 12 meses | Superadmin → Resumen (ingresos) | En celular el eje X lleva sólo la inicial del mes (E F M A…): "ene", "feb" no caben en columnas de ~22 px; el mes completo sale al tocar la columna |
| Chat al alto de la pantalla | Asociaciones → Mensajes; Mensajes del portal | La caja del chat mide `100dvh` menos lo de arriba y la barra (deja 8 px de respiro). En el portal lo de arriba cambia (aviso de superadmin o de suscripción), así que la pantalla mide dónde empieza la caja y lo pasa como `--arriba`: el campo para escribir siempre queda arriba de la barra. Sin la ayuda de teclado. En una columna (< 768 px) primero se ve la lista de conversaciones, salvo que se llegue con "Abrir chat"; para volver, botón de flecha junto al nombre |
| "Leer más" | Landing: El proyecto, Don Francisco | En celular sólo el primer párrafo; el botón muestra el resto |
| Carrusel de tarjetas | Landing: Conciencia Azul | Clase `simar-carrusel`: se desliza de lado con imán, cada tarjeta al 84 % del ancho |
| Avisos del recinto | Recinto: campana en la píldora de arriba (celular y tableta) y renglón "Avisos" en el menú lateral (computadora) | `components/layout/AvisosRecinto.tsx`. Número coral de sin leer que entra con un pulso (`simar-confirma`) cada vez que cambia. La lista sube como hoja en celular y flota junto al menú en computadora; sin leer en negritas con fondo azul suave y punto coral; "Marcar todo como leído". Cada aviso lleva a Asociaciones (abre en Solicitudes). Lo nuevo llega en vivo y también sale como mensaje emergente con "Ver" |

### 16.4 Cristal líquido

`components/ui/vidrioLiquido.tsx` + clase `simar-cristal`. Es el vidrio de la barra inferior, su
gota y el encabezado móvil (sólo lo que flota, sección 7).

- **Plano, como iOS 26.** Vidrio translúcido parejo, una línea fina de borde y una sombra suave.
  Nada de brillos, degradados, sombras internas ni reflejos: se ve "3D" y no es el estilo.
- **Con refracción sutil.** `useRefraccion()` dibuja en un `<canvas>` un mapa de
  desplazamiento del tamaño exacto del elemento (rectángulo redondeado: fuerte en el canto, nada en
  el centro) y lo usa en un filtro SVG (`feDisplacementMap`) como `backdrop-filter`. El fondo se
  dobla un poco en la orilla, como en un cristal grueso; el centro lleva un desenfoque moderado
  (4 px) para que las palabras se lean sobre cualquier contenido.
- **Sólo Chromium** (Chrome, Edge, Android) sabe aplicar filtros SVG al fondo. En Safari/iPhone y
  Firefox queda el vidrio de la clase, **igual de transparente** (50 % de blanco, 46 % en oscuro;
  `blur(4px) saturate(160%)`, los mismos valores del filtro): sólo le falta la lente del canto.
  Antes era esmerilado (62 %, 18 px) y en iPhone se veía lechoso. Con "reducir transparencia" es
  sólido. El elemento lleva `data-refraccion` cuando la refracción está activa.
- El hook devuelve `[ref, { filtro, estilo, activo }]`: la ref va al elemento, `filtro` (el `<svg>`)
  se dibuja junto a él y `estilo` lleva el `backdrop-filter`.
- Los hijos del cristal van con `z-index: 1` para quedar encima de la gota.
- **Excepción al movimiento (sección 8):** el vaivén de la gota es el único "rebote" permitido en
  los paneles. Es corto (< 0.5 s), sólo ocurre cuando la persona cambia de sección y con "reducir
  movimiento" la gota salta directo.

### 16.5 Selector de fecha y hora

`SelectorFecha` y `SelectorHora` (`components/ui/`) sobre `Desplegable`. Reemplazan a
`react-datepicker`, al `TimePicker` de dos listas y a los `<input type="date">` del navegador.
Trabajan con cadenas: `'YYYY-MM-DD'` (como las columnas `date`) y `'HH:MM'` (24 horas).

- **Dónde se abren.** En computadora y tableta, un panel que flota pegado al campo (debajo, o arriba
  si no cabe; si no cabe en ningún lado, se recorre para verse completo) y por encima de las
  ventanas. En celular, una hoja inferior con su título. Van por portal al `<body>`: dentro de una
  ventana no se recortan, y la ventana de atrás no se cierra al tocar fuera ni con Escape.
- **El campo.** `variante="campo"`: el campo SiMAR (borde de 2 px, 56 px, ícono y, si es
  `borrable`, una X). Se ajusta a su propio ancho (`@container`): angosto pierde el ícono y luego
  la X, para que "28 sep 2026" siempre quepa; en celular nunca lleva X (borrar está en el
  calendario). `variante="incrustado"`: sólo el texto, dentro de un recuadro de la pantalla
  (Manifiesto, Basurón), que con `onAbrir`/`onCerrar` resalta su borde.
- **Calendario.** La semana empieza en domingo (México). Días de 42 px (46 en la hoja); hoy con aro
  azul, el elegido relleno de azul, los de otro mes en gris y fuera de `min`/`max` apagados. Con
  `rango` (filtros "desde / hasta") se sombrean los días entre ambas fechas. Tocar el mes abre
  meses en cuadrícula de 3 × 4 con el año a los lados (nada de listas desplegables). Pie: "Hoy" y,
  si es borrable, "Borrar fecha". Teclado: flechas día a día, Inicio/Fin de la semana,
  RePág/AvPág mes (con Mayús, año), Enter elige, Escape cierra y el foco vuelve al campo.
- **Reloj.** Cuadrículas, no carátula: son más fáciles de atinar y de leer para personas mayores.
  Arriba la hora grande (hora y minutos se tocan por separado o se cambian con ↑ ↓) y cómo se lee
  ("2:30 de la tarde"); abajo las 24 horas (la actual con aro) y, al elegir una, los minutos de 5 en
  5 con ajuste fino ±1. Pie: "Ahora" (pone la hora actual y cierra) y "Listo".
- La fecha necesita más ancho que la hora: si van juntas, `grid-cols-[1.4fr_1fr]` (Basurón).

### 16.6 Cuidado

- No uses `overflow-x-hidden` en un contenedor que tenga barras `sticky` adentro: lo vuelve
  contenedor de desplazamiento y la barra deja de flotar. Usa `overflow-x-clip`.
- Una cuadrícula que tiene una fila deslizable adentro necesita columnas con `minmax(0, 1fr)`
  (`grid-cols-1`); si no, crece al ancho de todos los chips.
- Revisa cada pantalla a 390 px **y** a 360 px, en claro y en oscuro.
