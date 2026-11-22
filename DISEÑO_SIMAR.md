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
| `simar-coral` / `-suave` | `#A63F0E` / `#FBEADF` | **Falta, requerido, pendiente, sin leer** (6.3:1) | "Requerido", ícono y texto de "Eliminar" |
| `simar-coral-solido` / `-hover` | `#A63F0E` / `#8C340B`, igual en oscuro | Fondo coral con **letra blanca** (en oscuro, `simar-coral` es claro y no sirve de fondo) | Contadores, "Rechazada", botón "Eliminar" |
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
- **Interletrado según el tamaño**, como en la tipografía de Apple: el texto grande se cierra un
  poco (las letras se ven separadas al crecer) y el muy chico se abre. Atkinson ya es una letra
  abierta, así que nunca más cerrado que −0.02 em. Los `h1` y `h2` ya lo traen (capa base de
  `app/globals.css`; una utilidad `tracking-*` le gana); un título grande que no sea encabezado
  lleva su `tracking-[…]` (como el de las tarjetas de acción del Panel).

  | Tamaño | Interletrado | Dónde |
  |---|---|---|
  | 36–52 px | −0.02 em | Títulos `h2` de la landing |
  | 26–38 px | −0.015 em | `h1` (títulos de pantalla, saludo), títulos de tarjeta de acción |
  | 20–28 px | −0.01 em | `h2` (títulos de tarjeta y de sección) |
  | 15–19 px | 0 | Texto, botones, campos |
  | 13 px o menos | +0.01 em | Palabras de la barra inferior |

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
- Con **"aumentar contraste"** (`prefers-contrast: more`, en Accesibilidad del iPhone y la Mac),
  como pide Apple: vidrio y cristal sólidos con borde de 2 px `simar-campo-borde` (sin refracción),
  los bordes de tarjeta pasan a `simar-campo-borde` (3:1), los placeholders a `simar-texto-2` y
  la gota de la barra se marca más.

**Bordes de desplazamiento.** Donde el contenido pasa por debajo de algo que flota, o una lista se
corta, la orilla se desvanece en vez de cortar en seco (como iOS 26):

- `simar-borde-barra` (lo pone `BarraInferior`, sólo bajo 1024 px): franja fija al pie de la
  pantalla que desenfoca y funde con el papel lo que pasa bajo la barra inferior y la barra de
  guardar, así sus palabras no compiten con las de la página. Va encima del contenido y debajo de
  las barras pegadas abajo (`z-20`) y de la barra (`z-30`); baja con la barra minimizada. Con
  "reducir transparencia", sin desenfoque. Un elemento de la página con `z-index` de 20 o más
  quedaría encima de ella.
- `simar-borde-lista` + `useBordeDesplazamiento()` (`components/layout/`): en una lista con
  desplazamiento propio (la del menú lateral de los tres paneles), la orilla de arriba o de abajo
  se desvanece mientras haya renglones escondidos de ese lado. En una laptop de 768 px de alto
  el menú no cabe completo y así avisa que hay más.

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
| `simar-velo` / `simar-ventana` | El fondo se funde y el panel sube 14 px (0.34 s). **Se pueden interrumpir:** donde hay `@starting-style` (Chrome 117, Safari 17.5, Firefox 129) son transiciones, que parten de lo que está en pantalla: si se cierra mientras entra, se regresa desde donde iba (antes brincaba a completa y luego se iba). En navegadores más viejos quedan las animaciones. Lo mismo `simar-hoja` | Toda ventana modal: `simar-velo` en el fondo oscuro, `simar-ventana` en el panel |
| `simar-velo-sale` / `simar-ventana-sale` | La salida, más rápida (0.18 s) | Con `usePresencia` (ver 8.2) |
| `simar-crece-y` / `simar-crece-x` | La barra crece desde su base / desde la izquierda | Barras de gráficas hechas a mano. Escalonar con `animationDelay` |
| `simar-dibuja` | Dibuja un trazo SVG. El `<path>` lleva `pathLength={1}`, así sirve para cualquier largo. Duración con la variable `--simar-trazo-dur` | La línea de marea, la palomita, las curvas de profundidad del hero |
| `simar-confirma` | Aparece con una leve escala, 0.35 s | Insignias de "Firmado" y avisos de éxito |
| `simar-presiona` | El botón se hunde 1 px al presionarlo | Ya lo lleva `Button`; úsalo en botones principales hechos a mano |
| `simar-tarjeta-accion` | Sube 3 px con sombra al pasar el cursor y baja al presionarla | Sólo tarjetas que llevan a otra pantalla (Panel, KPIs del portal) |
| `simar-esqueleto` | Bloque con un brillo lento | Sólo esqueletos de carga (es un indicador de carga, por eso puede repetirse) |
| `simar-hoja` / `simar-hoja-sale` | Sube desde abajo (0.36 s) / baja (0.2 s). Si se jala la hoja, la animación se detiene donde va y la mueve el dedo (y al soltar, un resorte; ver 16.2) | Hojas inferiores de celular (`HojaInferior`); las ventanas de la zona móvil la usan solas (ver 16) |
| `simar-desplegable` | Baja 6 px desde el campo y aparece (0.2 s); si se abrió arriba del campo, sube | Panel flotante del selector de fecha y hora en computadora (`Desplegable`) |
| `simar-resalta` | La fila se ilumina en azul suave y se apaga sola (2.6 s, empieza a los 0.3 s). Con "reducir movimiento" se queda iluminada un momento, sin transición | La fila a la que se llega desde un aviso o el Panel (Solicitudes, `?solicitud=ID`), para que la vista la encuentre |
| `simar-recorrido-velo` / `simar-recorrido-late` | El velo oscurece poco y desenfoca la pantalla, con un hueco nítido (máscara SVG) que se desliza al cambiar de paso y frena al llegar; con "reducir transparencia", sin desenfoque. El aro de lo que se puede tocar en "Pruébalo tú" late dos veces al llegar (y otra vez si se toca fuera), nunca en bucle. Con "reducir movimiento" nada se desliza ni late | Sólo el recorrido guiado de la demostración (`components/demo/Recorrido.tsx`) |
| `simar-encabezado-movil` | Con `data-oculto="true"` sube y se desvanece | Encabezado móvil del recinto: se esconde al bajar y vuelve al subir (`useOcultarAlBajar`) |
| `simar-trazo` | Trazo con `stroke-dasharray: 420` | Heredada; para trazos nuevos usa `simar-dibuja` |

Curvas: `--simar-frena` (sale rápido y frena suave, para lo que entra) y `--simar-acelera` (para
lo que se va). **Ojo:** `--simar-curva` no es una curva de animación, es el color de las líneas
de profundidad.

### 8.2 Piezas (`components/ui/movimiento.tsx`)

| Pieza | Para qué |
|---|---|
| `NumeroAnimado` | Un número que cuenta al aparecer y pasa del valor anterior al nuevo (al cambiar de período). Cuenta sólo la primera vez que se abre la pantalla: al regresar a ella sale ya completo. El lector de pantalla oye sólo el valor final. `TarjetaDato` y `Kpi` ya lo usan cuando el valor es un número |
| `PalomitaAnimada` | Palomita que se dibuja (con círculo, o sólo la marca con `circulo={false}`). "Firmado", "¡Guardado!", avisos de éxito |
| `usePresencia(abierto)` | Deja montada una ventana mientras hace su salida: `{ montado, saliendo }` |
| `Esqueleto`, `EsqueletoPantalla` | Esqueletos para los `loading.tsx` (esperan 0.15 s antes de verse, para no parpadear) |
| `usePrefiereMenosMovimiento()` | Si el sistema pide reducir movimiento (p. ej. el carrusel no avanza solo) |
| `LineaMarea` (`components/layout/LineaMarea.tsx`) | La ola bajo la sección activa; se dibuja al llegar |
| `DeslizarParaActualizar` (`components/layout/`) | Sólo con SiMAR instalada como app: arriba del todo, al jalar hacia abajo baja un círculo de vidrio cuya flecha gira con el tirón, con resistencia progresiva (la de iOS: cada vez sigue menos al dedo, sin tope en seco); pasado el umbral (se pone azul y, en Android, vibra 10 ms) y al soltar, la página se recarga. No se activa con una hoja o ventana abierta ni en filas que se deslizan de lado. En una pestaña normal no hace nada |

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
- El cambio de tema abre el tema nuevo en círculo desde el botón (View Transitions). Con "reducir
  movimiento" nada se mueve, pero el tema nuevo aparece con un fundido de 200 ms: de papel a azul
  noche en un solo cuadro sería un salto de brillo. En navegadores sin soporte o en WebKit (Safari
  y todos los navegadores de iPhone/iPad) cambia al instante: WebKit toma mal la "foto" de la transición, el vidrio
  (`backdrop-filter`) sale sin desenfoque y lo fijo se pierde con la página desplazada, y se ve
  un parpadeo en el encabezado y la barra inferior (`esWebKit()` en `ThemeContext`).

### 8.4 Landing: el enfoque

El gesto de la landing es **enfocar**: las cosas llegan difuminadas y se aclaran, como una cámara
que enfoca. Sólo en la landing (`components/landing/`); dentro de los paneles no se usa.

| Pieza | Qué hace | Dónde |
|---|---|---|
| `reveal` (+ `useScrollReveal`) | **Atado al scroll, como las páginas de Apple**: el estado depende de la posición, no del tiempo. Asoma por abajo transparente y 28 px abajo (**sin `blur`**: animar `filter` repintaba la capa en cada cuadro y la página larga se trababa), y queda en su lugar al recorrer el 26 % de su paso por la pantalla (`animation-timeline: view()`, `animation-range: cover 0% cover 26%`), o sea en el tercio de abajo. Al bajar rápido todo llega ya nítido; al subir se revierte. `data-delay` (ms) se vuelve un rango que empieza más arriba (650 ms ≈ 16 %). `data-direction="left"/"right"` entra de lado | Antetítulos, párrafos, tarjetas de cada sección |
| `reveal` + `data-efecto="foto"` | Aparece y crece de 95 % a 100 % (rango hasta 30 %), sin desenfoque | Fotos de El proyecto y Don Francisco, el mapa de puertos |
| `reveal reveal-palabras` + `TextoEnfoca` | El título no se mueve: cada palabra aparece y sube 0.4 em según su posición, cada una 2 % después que la anterior. El lector de pantalla oye la frase entera una vez (`sr-only`) | Títulos `h2` de las secciones y el llamado final |
| `simar-enfoca` | Lo mismo, al cargar (animación, 1.1 s). Escalonar con `animationDelay` | Contenido del hero |
| `simar-enfoca-simbolo` | El símbolo se enfoca, crece y gira 50° hasta su lugar: las flechas cierran el ciclo | Símbolo grande del hero |
| `simar-enfoca-palabras` + `TextoEnfoca` | Palabras en cascada al cargar; el inicio va en `--retraso` | Subtítulo del hero |
| `simar-hero-foto` (`data-estado="activa"/"anterior"`) | Fotos de fondo: la nueva se funde encima y se asienta (de 106 % a 100 %, sin desenfoque: es de pantalla completa); la anterior queda debajo. Sólo está en la página la primera; las demás se agregan en reposo y una antes de su turno | Fondo del hero |
| `simar-hero-tinte` / `simar-hero-velo` | Tinte azul marea (`mix-blend-mode: color`) para que todas las fotos queden en la misma gama; velo `simar-abismo` más oscuro al centro y al pie | Fondo del hero |
| `simar-hero-sale` | Al bajar, el contenido del hero se desvanece y se encoge un poco (a 97 %, sin desenfoque), atado al scroll (`view-timeline`). Sólo donde el navegador lo soporta y sin "reducir movimiento" | Contenido del hero |

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

### 8.5 Las otras landings (retiradas)

Hasta el 2026-11-17 convivían tres landings (`?landing=actual|nueva|3d`, con un selector flotante).
Se quedó sólo la Actual (§8.7); la «Nueva» (escenas con Motion) y la «3D» (página de producto con
three.js hecho a mano) se borraron y viven en el historial de git. De la 3D queda `.t3-enfoca` en
`globals.css`, que usan las secciones de Noticias.

### 8.6 Noticias: una página informativa aparte

`/[locale]/noticias` y `/[locale]/noticias/[slug]`
leen `lib/constants/noticias.ts` (sin base de datos). La landing lleva su franja de noticias
(`NoticiasPortada`, ver §8.7) y el enlace del menú.

- **Es un medio, no una demo** (Jesus, 2026-11-05: «son noticias y tiene que inspirar
  profesionalismo y credibilidad»): fotos reales con su crédito, letra de periódico en los
  titulares, fuentes y autores a la vista y noticias reales de otros medios. Nada de dibujos
  infantiles donde puede ir una foto. Se puede usar cualquier herramienta (Motion, three.js, CSS).
- La página (`app/[locale]/noticias/page.tsx`) es **muy visual, poco texto a la vez y casi todo
  se ve con sólo bajar**. La barra de arriba lleva una fila con las secciones (`NavSecciones`,
  marca la que se lee) y, de arriba abajo:
  0. **La portada** (`PortadaEditorial`), como la de un periódico: un filete grueso, la fecha y
     el lugar («Jueves, 5 de noviembre de 2026 · Puerto Peñasco, Sonora») con «Actualizado a las
     13:50 h», la cabecera **Noticias *del* Mar** en `font-titular`, la línea de qué es y tres
     cifras (notas, medios, fuentes), y un filete doble. Debajo, **«Al momento»**: una cinta con los
     titulares más nuevos de SiMAR y de los otros medios (se detiene con el cursor, el foco o su
     botón; con «reducir movimiento» es una fila que se desliza a mano). Luego la **nota principal**
     (la más reciente de `recientes()`) con su foto grande (se descubre al cargar y se mueve un
     poco al bajar, con CSS atado al scroll: `n-paralaje`), su crédito, tema, titular, entrada y «Redacción SiMAR · fecha ·
     minutos»; a un lado, **«Lo último»**: las cuatro siguientes, numeradas, con miniatura.
     Las entradas de la portada son CSS (`n-filete`, `n-palabra`, `n-sube`, `n-descubre-ya`,
     `n-acerca-ya`) y no Motion: así se ven desde el primer cuadro, sin esperar a JavaScript.
  1. **Otros medios** (`OtrosMedios`, fondo `superficie`): lo que publican sobre el mar medios con
     licencia abierta, leído de sus canales RSS/Atom en el servidor y guardado una hora
     (`lib/services/noticias_externas.ts`, `unstable_cache`). Hoy: **Mongabay Latam** (CC BY-NC-ND
     4.0), **Agencia SINC** (CC BY 4.0), **Noticias ONU** (material de noticias, con crédito) y **The
     Conversation** (CC BY-ND 4.0). Se quedan las que hablan del mar, la costa, la pesca o los
     residuos (palabras con peso; lo de México primero y marcado), sin repetidas y a lo más cuatro
     por medio (ninguno es la mayoría, como pide SINC). De cada una: el titular, el resumen de su
     propio canal, autor, hora y «Leer en {medio}» (abre el original). **No se copian el texto
     completo ni las fotos** (en varios medios las fotos son de agencias). Pestañas por medio y, al
     final, quién es cada medio con el enlace a su licencia. Si no hay notas, la sección no sale.
  2. **En cifras** (oscuro, `CifrasMar`): los cuatro `TEMAS` a la vista, sin pestañas. Cada tarjeta
     lleva **una foto real** con su crédito (el aceite, el plástico en la playa, la tortuga en la red,
     la vaquita y su cría), la cifra en `font-titular` que sube al verse (`CifraAnimada`), una
     línea y dos artículos. La del mar pinta las vaquitas que quedan (`FilaVaquitas`).
  3. **En el mapa** (`MapaHistoria`, contado con el scroll): un **mapa real** (`MapaInteractivo`:
     MapLibre GL + OpenFreeMap, sin clave; *positron* en los dos temas, nombres en español, sin
     carreteras numeradas, aeropuertos ni trenes; en claro con el papel y el agua de SiMAR y **en oscuro
     repintado capa por capa con su azul marino** (`PALETA_OSCURA`: tierra azul, mar más oscuro y una
     línea de costa fina; el *dark* de OpenFreeMap se veía casi negro y con franjas en el mar) se queda fijo (a un lado en computadora, arriba en celular) y cada
     capítulo de `LUGARES` lo hace **volar** a su vista (`VISTAS`: el golfo, Puerto Peñasco, el Alto
     Golfo, Sonora y Sinaloa, todo México y el mundo; con «reducir movimiento» o «Sin animaciones»,
     salta). Cada lugar tiene su marca con el número de noticias (botón: baja a su capítulo); la del
     capítulo que se lee se enciende en amarillo y muestra su nombre (las otras, sólo el número; el
     nombre al pasar el cursor), y de muy lejos se esconden. **La zona de la vaquita** va marcada con
     un círculo punteado y dice «(aprox.)»: no es el límite legal. Se puede mover y acercar (Ctrl +
     rueda, dos dedos o los botones + y −: `cooperativeGestures`, así la rueda sigue bajando la
     página). Los créditos del mapa van plegados (ⓘ). El mapa real **sólo baja cuando la sección se
     acerca** (`next/dynamic` + IntersectionObserver) y entra sobre **el dibujado** (`MapaGolfo`, de
     servidor), que se ve mientras tanto y se queda si el aparato no puede mostrar mapas (sin WebGL).
     Cada capítulo es una tarjeta con **la foto del lugar** y su crédito, su nombre en `font-titular`,
     de qué trata y sus noticias (de servidor). Toda noticia debe estar en un lugar.
  4. **El proyecto**: la foto, SiMAR en tres ideas, con quién se hizo y la historia
     (`HistoriaProyecto`: una línea que se llena al bajar, los años en zigzag y cada uno se enciende
     al llegar; sin clics).
  5. **Todas, el archivo** (`ListaNoticias`): arriba, cuántas hay (se anuncia al cambiar: «4 notas
     con «vaquita» de Océanos») y el buscador (sin acentos ni mayúsculas; resalta lo encontrado con
     `n-encontrada`; Esc lo borra). Abajo, una barra de vidrio que **se queda pegada** bajo la de
     arriba (en celular no): los temas como control segmentado (`role="tablist"`, flechas, Inicio y
     Fin; el número de cada tema sigue a la búsqueda) y la vista, **cuadrícula** (`TarjetaEditorial`)
     o **lista por mes** (fecha grande, tema, título, resumen y miniatura; en celular, sólo íconos y
     junto al conteo). Las primeras seis y «Mostrar N más» con su avance («Ves 6 de 14»). Sin
     resultados, sugerencias para buscar. El tema y la búsqueda viven en la dirección
     (`?tema=…&q=…`, con `replaceState`): la página los lee en el servidor, así un enlace abre el
     archivo ya filtrado (el hueco «Ver todas» de la landing lleva al tema elegido). **Glosario** (`GlosarioTarjetas`: una tarjeta por palabra con su ícono;
     Manifiesto y Red fantasma llevan foto; en celular, carrusel) y **fuentes** (quién las
     publica, de un vistazo, la lista entera en un `<details>` y otro con los créditos de las fotos).
  6. **Cierre**: la foto de la flota de Puerto Peñasco al atardecer, con su crédito, y «Ver cómo
     funciona».
  Cada sección lleva su número en el encabezado («01 — Otros medios», `EncabezadoSeccion`, en
  `font-titular`), como el índice de una revista; el número sale del orden de las secciones.
- **La letra de los titulares** es Newsreader (`components/noticias/letraTitular.ts`, OFL, hecha
  para titulares de periódico en pantalla), con la clase `font-titular` dentro de un contenedor con
  `letraTitular.variable` (la página, el artículo). Sólo titulares, cifras y la cabecera; el texto
  sigue en Atkinson (la más legible para la gente mayor).
- **Fotos**: las de SiMAR o las de `lib/constants/fotos.ts` (`FOTOS`), todas de Wikimedia Commons
  con licencia libre: dominio público (NOAA, NASA, USFWS), CC0, CC BY o CC BY-SA. Están en
  `public/assets/noticias/fotos` (WebP, a lo más 2000 px). **Toda foto ajena lleva su crédito**
  junto a ella (`textoCredito`: «Foto: Paula Olson, NOAA · Dominio público»; con CC BY-SA,
  «(adaptada)») con enlace a su página, y la lista completa está en Fuentes. Una nota toma su foto
  con `deFoto(FOTOS.x, alt, posicion)`. Nunca uses una foto sin licencia libre ni la de una nota de
  otro medio.
  **El movimiento**: lo de la portada, en CSS (también la foto principal al bajar, `n-paralaje`, que
  se queda quieta con «sin animaciones»); Motion sólo para las tarjetas de otros medios (entran escalonadas y se reacomodan al cambiar de medio). Lo editorial (el
  archivo, las tarjetas, la barra):
  - `--n-resorte`: un resorte sin rebote escrito como curva `linear()` (lo que se desliza: las
    píldoras de `NavSecciones`, de los temas y de la vista, medidas con `useIndicador` y movidas
    con `.n-indicador`); `--n-frena` para lo que entra.
  - Atado al scroll (`animation-timeline: view()`, donde el navegador puede; si no, ya visible):
    `n-entra` (encabezados: suben y se enfocan), `n-entra-hijos` (escalona un mosaico) y
    `n-descubre` (la portada de una tarjeta se descubre de arriba abajo mientras se acerca).
  - Al pasar el cursor: la tarjeta se levanta, la portada se acerca y el título se subraya de
    izquierda a derecha (`n-subraya`).
  - Al filtrar, cambiar de vista o mostrar más, **View Transitions** (`startViewTransition` +
    `flushSync`): cada nota tiene su `view-transition-name` y clase `n-nota`, así se desliza a su
    lugar (de tarjeta a renglón al cambiar de vista); las que entran suben y las que salen se
    encogen. Sin View Transitions, el cambio es inmediato.
  - **Carga**: `loading.tsx` en `/noticias` y en cada nota (`Esqueletos.tsx`): la barra ya está y
    abajo **la forma exacta de lo que llega** en huesos con brillo (`n-hueso`): la cabecera del
    periódico con sus filetes y sus cifras, la cinta «Al momento», la nota principal y «Lo último»;
    en una nota, el tema, el titular, la firma con sus tres botones, la foto a lo ancho, la letra
    capital, «El dato» y los párrafos. El brillo va escalonado (cada hueso con su retraso), como una
    ola. Aparecen tras un instante (`n-esqueleto`) y empiezan arriba (si no, heredan el scroll de la
    landing). Mientras llega una foto, el brillo `simar-cargando` va debajo.
  - El artículo entra por tiempo, no por scroll (ya está a la vista): el encabezado sube en escalón
    (`n-llega`). **La foto no se descubre ni salta**: queda en el mismo lugar del esqueleto y llega
    con `FotoNota`: al instante se ve su vista previa (20 px, difuminada, de
    `lib/constants/previas.ts`, con sus colores) y, cuando la foto de verdad terminó de llegar (no
    antes), se enfoca encima: aparece y se asienta de 103 % a 100 %. Sólo opacidad y transform; sin
    JavaScript, a los 3 s se ve de todos modos. El pie llega un poco después. Antes el cuadro de
    carga se borraba y volvía a aparecer de arriba abajo, y la foto entraba de golpe al terminar de
    bajar: se veía raro. Las tarjetas, la portada y «Lo último» usan la misma `FotoNota`.
  Todo sólo corre con «sin preferencia» de movimiento y, con «reducir movimiento», cada cosa
  se queda quieta en un lugar donde se ve. `PausaFuera` pausa cada escena fuera de la pantalla
  (`data-quieta`) y marca la primera vez que se ve (`data-visto`) para lo que se anima una vez.
  Nada de partículas ni animaciones abstractas. A los
  componentes de cliente sólo les llegan resúmenes (`resumenDe`, `datosEditorial`), nunca el texto
  de los artículos.
- Hay dos clases de artículo: noticias (lo que pasó, con su fecha) y los que explican el problema
  (`explica: true`, no caducan): éstos van en En cifras y no en la portada. El orden lo da
  la fecha (`POR_FECHA`, `recientes()`).
- Cada artículo lleva fecha, categoría (SiMAR, Mar de Cortés, Océanos, Normativa, Conciencia),
  resumen, cuerpo en párrafos y **fuentes** con enlace. Opcionales: `imagen`, `galeria`, `dato` (la
  cifra clave, resaltada después del primer párrafo) e `ilustracion`. Todo dato lleva su fuente.
- **Sin foto (sólo si no hay una con licencia), la portada se dibuja** (`components/noticias/ilustraciones.tsx`): ilustraciones
  planas de trazo limpio, sin puntos (`mapa`, `altogolfo`, `carta`, `gota`, `hojas`, `simbolo`,
  `red`, `globo`, `costa`, `botella`, `horizonte`). Los mapas salen de `components/noticias/golfo.ts`
  (Natural Earth, dominio público). Si la noticia no dice cuál, sale la de su categoría
  (`ILUSTRACION_DE`). Cada dibujo usa `useId` para sus degradados: la misma noticia puede salir dos
  veces en una página (una oculta) y con ids repetidos la visible no se pinta. No inventes fotos.
- **La nota** (`app/[locale]/noticias/[slug]/page.tsx`), para leer con calma: el tema (lleva al
  archivo de ese tema) y si es «Noticia» o «Para entender» (`explica`), el titular en
  `font-titular`, la entrada y **la firma** (Redacción SiMAR con su logo, fecha, Puerto Peñasco y
  minutos) con tres botones: **Escuchar** (`LeerEnVoz`), **Letra** (los ajustes de lectura) y
  **Compartir** (`navigator.share` o copia el enlace). La foto a lo ancho (en celular, de orilla a
  orilla) con lo que se ve y su crédito. El texto en una columna de ~65 caracteres con **letra
  capital** (`n-capital`), «El dato» con filete azul y la cifra grande, un cuadrito azul al final,
  **«Fuentes de esta nota»** numeradas y **«Sobre esta nota»** (quién la escribió y con qué). Luego
  Anterior / Siguiente (titulares en `font-titular`) y «Sigue leyendo» (`TarjetaEditorial`; en
  celular, dos). Al bajar, **el tema y el título pasan a la barra** (`TituloAlLeer`).
- **Escuchar la nota** (`LeerEnVoz`): la voz del navegador (`speechSynthesis`, nada de fuera) lee
  lo marcado con `data-leer` dentro de `#nota` (título, entrada, el dato y cada párrafo), en
  español de México si el aparato la tiene. Mientras lee, **el reproductor vive en la isla
  dinámica** (abajo): una **cápsula viva** en la barra (ondas que se mueven mientras habla, «3/6» y
  pausar) y, debajo, **su gota** con la frase que dice como subtítulo (en `font-titular`), una barra
  con **un segmento por párrafo** (tocar uno salta ahí), desde el inicio, anterior, **pausar /
  seguir** (el botón grande), siguiente, repetir, la velocidad (lenta, normal, rápida), guardar en
  la isla (sube la gota y queda la cápsula) y cerrar. Sin isla, la misma tarjeta va abajo. **El texto se sigue solo** (centra cada párrafo); si la persona baja o sube por su cuenta,
  deja de seguirlo y aparece «Volver a donde va». **Tocar un párrafo lo lee desde ahí.** Marca el
  párrafo (`n-leyendo`) y, más fuerte, **la frase que dice** (CSS Custom Highlight API,
  `::highlight(n-frase)`; donde no existe, sólo el párrafo). Dice frase por frase; pausar es callar y
  recordar la frase (pause() no sirve en Android), y cada frase lleva un turno para ignorar avisos
  viejos al saltar. Mientras está abierto, la nota deja espacio abajo (`n-con-reproductor`). Sin
  voz en el navegador, el botón no sale.
- **Ajustes de lectura** (el botón «Lectura» de la barra y «Letra» en la nota; `PanelLectura`):
  **tamaño** con A− / A+ en cinco niveles (90 %, 100 %, 112 %, 125 %, 140 %), **contraste alto**,
  **renglones amplios**, **tema** claro u oscuro, **animaciones** sí/no y **subrayar enlaces**, más
  «Volver a como estaba». Se ve al momento, se guarda en el dispositivo
  (`localStorage` `simar:noticias-lectura`) y un punto azul en el botón avisa que hay ajustes. Se
  aplican en `<html>` (`--n-zoom`, `data-n-contraste`, `data-n-interlineado`,
  `data-n-movimiento`, `data-n-enlaces`) con un script en `app/[locale]/noticias/layout.tsx`
  **antes de pintar** (quien pidió letra grande no ve primero la chica). Las reglas («Ajustes de
  lectura» en `globals.css`) sólo valen dentro de `.n-pagina` (la página, la nota y sus
  esqueletos): el tamaño es `zoom` en `<main>` (crece como el zoom del navegador; la barra no),
  por eso lo pegado y las alturas con `svh` se dividen entre `var(--n-zoom,1)`; el contraste alto
  redefine los tokens `simar-*` (texto casi negro o blanco, bordes visibles); «sin animaciones»
  quita animaciones y transiciones, las View Transitions y el movimiento de Motion
  (`reducedMotion="always"`). El panel va en un portal, con `useVentanaAccesible` (Esc lo cierra y el
  foco regresa) y en celular sale como hoja desde abajo.
- **Un solo botón de tema**: el flotante de `ThemeToggle` no sale en Noticias (ya está en su barra,
  junto a «Lectura»); antes salían los dos encimados.

**La isla dinámica del portal público** (`components/isla/`): la barra de arriba de Noticias y de la
landing Actual es una isla, como la Dynamic Island, en vidrio líquido.
- **La isla** (`IslaDinamica`) es la barra de siempre (`simar-vidrio-fuerte`, o `simar-vidrio`
  arriba de la landing) con material propio (`isla-cristal`): un brillo arriba, un borde de luz que
  baja (más brillante arriba, un reflejo abajo), una línea fina que la separa de una página blanca y
  una sombra en dos capas (cerca y lejos). Al desplazar la página, **un reflejo la cruza** (la luz que
  se mueve sobre el vidrio: `animation-timeline: scroll(root)`, debajo del contenido).
- **Un solo material, de principio a fin.** Mientras una gota vive, la isla y el líquido toman el mismo
  color sólido (`--isla-liquido`: casi blanco en claro, azul noche en oscuro) y la gota lleva el
  mismo borde de luz y brillo que la isla. Nada se vuelve sólido al terminar (antes la gota salía
  translúcida y al detenerse se encendía un vidrio esmerilado: se notaba el cambio).
- **Las gotas salen de la isla, por su orilla de abajo, justo bajo el botón que las abre**, y
  regresan por el mismo lugar. Tres tiempos: (1) la orilla se abomba (**el brote**) y de ella cuelga
  una **gotita**; (2) la gotita **se hincha** hacia abajo hasta ser el panel, colgada de su borde de
  arriba (que casi no se mueve: crece desde la isla, no aparece en medio de la página); (3) el brote
  regresa, **el cuello se corta** y el panel queda flotando 12 px abajo. Al cerrar: el panel se
  encoge a gotita colgando, el brote sale a recogerla y **la isla se la sorbe**. La capa líquida va
  encima de la isla pero recortada en su orilla: lo de adentro no se ve, así que el líquido de verdad
  sale de ella; una franja escondida (el labio) hace que la orilla se curve hacia el brote. El
  contenido aparece cuando el panel ya casi creció. Abre en ~0.4 s y cierra en ~0.4 s.
- **Lo de adentro llega renglón por renglón** (`isla-escalon` con `--i`): cuando el panel ya casi
  creció, cada renglón sube 12 px y aparece un poco después del anterior (Lectura, el menú de
  secciones, el reproductor).
- **El menú de letras («Lectura») es líquido y responde al presionar**:
  - los selectores (Contraste, Renglones, Tema…) son `SelectorLiquido`: una **lente** oscura se desliza
    a la opción elegida; el borde de adelante llega primero y el de atrás lo alcanza (se estira y se
    recoge, y se aplasta un poco), y el texto cambia de color justo donde pasa (la lente lleva su copia
    de las etiquetas). Al presionar otra opción la lente ya se asoma hacia ella; si el dedo se va sin
    soltar, regresa. Siempre parte de donde se ve: se puede cambiar a media animación sin saltos;
  - el tamaño: cada barra **se llena desde abajo** con un rebote chico y su nombre («Grande 115 %»)
    entra desde abajo al subir y desde arriba al bajar;
  - el tema se abre en círculo **desde la opción que se tocó**; «Volver a como estaba» gira su flecha;
  - los botones se hunden al tocar y regresan con un rebote chico (`isla-pulsa`, resorte
    `--isla-rebote`: amortiguamiento 0.72, respuesta 0.42 s).
- **El viaje** (`viaje.ts`, `useGota().abrirDesde` / `alternarDesde`): si el botón está **fuera**
  de la isla (en la nota: «Escuchar», «Letra»), una gotita del color del botón sale de él, sube en
  curva y **entra a la isla por abajo** donde vive lo que abrió (la cápsula del reproductor, el botón
  «Lectura»); la isla la recibe con un pulso y de ahí cae la gota. Así se entiende adónde se fue. La
  cápsula del reproductor llega con la gotita (se esconde mientras viaja) y la voz empieza ya con el
  reproductor abierto. Sólo transform y opacidad (WAAPI); con «reducir movimiento», no viaja.
- Hoy hay gotas en «Lectura» (los ajustes de lectura), el reproductor de «Escuchar» y el menú de
  secciones de la landing (bajo 1280 px). Una a la vez (si se abre otra mientras una se cierra,
  conviven un momento, cada una en su columna); Esc, un clic afuera o su botón la cierran y el foco
  entra y regresa (`useVentanaAccesible`). Un botón fuera de la isla que abre la misma gota lleva
  `data-isla-abre="id"` (el clic afuera no la cierra antes de que él la alterne). La del reproductor
  es `libre`: no atrapa el foco ni se cierra al tocar la nota (tocar un párrafo lo lee).
- **La ranura de actividad** (`RanuraActividad`): la cápsula viva de lo que está pasando (el
  reproductor) entra a la isla con un resorte; en celular el enlace de volver se reduce a la flecha.
- **La isla saca las secciones de Noticias** (`isla-con-fila`, en la página de Noticias): al llegar,
  la isla está compacta (sólo su renglón) y se alarga hacia abajo como la Dynamic Island cuando se
  abre (un `clip-path` con sus mismas esquinas que baja; el lugar ya está apartado, así la página no
  se mueve). Luego la línea se dibuja desde el centro, las secciones salen de la isla una tras otra
  (45 ms entre cada una, con rebote chico), la píldora de la sección que se lee aparece en su lugar
  y llega la sombra. Antes las secciones sólo aparecían. Unos 0.8 s en total; con «reducir
  movimiento», quieta.
- **Estado compartido** (`islaTienda.tsx`, `IslaProveedor` + `useGota(id)` + `useRanuraIsla()`):
  cualquier parte de la página abre una gota o pinta en ella con un portal (`destino`).
- **El líquido** es [liquid-gooey](https://www.npmjs.com/package/liquid-gooey) (MIT): una silueta
  SVG con el filtro «goo» debajo del contenido real, que queda nítido; funciona en Safari.
- **Vidrio vivo en todo el portal público** (`VidrioVivo` + `data-vidrio`, globals.css «Vidrio vivo»):
  en los botones con `data-vidrio` (los azules, «Conocer el proyecto», los de espuma, tema, menú,
  «Lectura», «Escuchar», los renglones del menú de secciones) **un reflejo sigue al cursor** y, al
  presionar, se abre y se aviva desde donde se tocó mientras el botón se hunde y regresa con rebote.
  `data-vidrio="claro"` en botones claros (luz azul tenue). Un solo oyente para toda la página, una
  vez por cuadro; sólo se repinta el fondo del botón. En la isla de la landing (1280 px o más), **una
  lente sigue al cursor de un enlace a otro** (`useLenteSobre`, la misma lente líquida); las leyendas
  de vidrio sobre las fotos y los controles de las fotos reciben **un destello al entrar a la
  pantalla** (`vidrio-destello`, atado al scroll); los puntos de las fotos crecen con rebote y el ícono
  del tema entra girando. Con «reducir movimiento», nada se mueve (la luz sigue, sin hundirse).
- **Rápido y sin trabas** (es lo primero): la capa líquida **sólo existe mientras una gota vive** y
  sólo en su columna (no en toda la barra); su código (`CapaGota.tsx`, con liquid-gooey) no viaja
  con la página: `IslaDinamica` lo pide en reposo, antes de la primera gota (los tipos compartidos
  están en `tipos.ts`); va encima de la isla, así la isla no vuelve a difuminar su
  fondo mientras el líquido se mueve; el filtro es el mínimo (desenfoque + contraste); el borde de luz
  y la sombra van en CSS; nada de `backdrop-filter` en la gota (es sólida); el contenido sólo se
  desvanece y sus renglones suben unos px. liquid-gooey anima con `requestAnimationFrame` (escribe el mismo
  transform en la caja y en su silueta), mide cada gota al montarla y no al moverla (por eso cambia de
  `key` si su lugar cambia) y anima desde donde estaba: la gota se mide al montarse (el alto de 0 de
  un portal vacío no cuenta) y se vuelve a montar una vez al conocer su alto, para no salir del lugar
  calculado con el alto supuesto.
- Las fechas de las tarjetas son relativas con el día del puerto (`cuandoFue`: «Hoy», «Ayer»,
  «Hace 3 días» y, desde una semana, la fecha corta); el reloj lleva la fecha larga en `title`.
- `MetaNoticia` (tema · fecha · minutos) recorta el punto que separa cuando una parte baja de
  renglón: ningún renglón empieza con «·».

### 8.7 Landing Actual: la laptop 3D y las noticias

La landing Actual (`VariantCinematic`) suma dos piezas para volverla portal: «Así funciona SiMAR»
(después de «El proyecto») y «Lo último del mar» (después de la laptop).

**Así funciona SiMAR** (`components/landing/escena-equipos/`): una escena fija mientras se baja
(pista de 400svh, escenario `sticky`). Una laptop y un celular **realistas** (modelos CC BY 4.0 de
Sketchfab: «macbook pro M3 16 inch 2024» de jackbaeten y «Apple iPhone 15 Pro Max Black» de
Polyman_3D; el crédito va en el pie de la landing), sin logotipos ni fondos de pantalla, comprimidos
a `public/assets/landing/3d/modelos/` (texturas webp de 1024 px, mallas meshopt). three.js con
`await import()`, como en la landing 3D.

| Pieza | Qué hace |
|---|---|
| Avance | Sigue al scroll con un resorte sin rebote (~0.3 s): la rueda del ratón no da saltos |
| Laptop | Cerrada y un poco en el aire, gira hacia el frente, baja al piso y la tapa se abre sobre su bisagra (el pivote sube lo que la orilla de la tapa baja dentro del hueco, para que cerrada quede encima de la base). Al final se hace a un lado y se vuelve hacia el celular |
| Pantallas | Panel → manifiesto → Estadísticas → portal. **Sin desvanecido:** la nueva entra desde la derecha y empuja a la anterior (que se va más lento y se oscurece), con sombra en la orilla, como al navegar en la app; el avance lo da el scroll |
| Celular | Llega desde la derecha (en celular, desde abajo a la derecha), un poco en el aire y ladeado, y **se posa frenando** junto a la laptop, vuelto hacia ella. Antes salía de debajo del piso. Su pantalla lleva barra de estado (hora, señal, batería) a los lados de la isla, la app completa y la barra de inicio |
| Toma final | Los dos equipos **nunca se tocan**: en pantallas anchas van lado a lado con aire entre ellos; en angostas (celular de pie, tableta vertical) se **apilan**, la laptop atrás y el celular delante, mirados desde más arriba (42°) para que el celular quede debajo de la laptop. Antes las posiciones eran fijas y a 1024 px o en celular el teléfono quedaba pegado a la esquina de la laptop |
| Encuadre | Cada toma dice desde dónde se mira y qué se enseña; **la distancia y el centrado se calculan para la pantalla** (`medir`): todo cabe entre el recuadro de las frases y los puntos de abajo (`reserva`, que pasa la sección), en cualquier ancho. En celular la laptop ya no se corta en la orilla |
| Sombras | La **huella de cada equipo** difuminada sobre el piso: una de contacto (nítida) y una ambiental (suave), más una tenue detrás de la tapa abierta. En el aire se aclaran y se abren; van en su propio grupo, siempre en el piso. Antes era un degradado redondo que, visto casi de lado, se volvía una franja gris de orilla a orilla |
| Frases | Una por paso, arriba. Tampoco se desvanecen: la nueva sube desde abajo y empuja a la anterior fuera del recuadro |
| Pantallas en el modelo | Un `ShaderMaterial` propio (`materialPantalla`) sin tono ni reflejos (el reflejo del cuarto las deslavaba) que hace el cambio de pantalla en la tarjeta de video: recibe las dos capturas y el avance, y dibuja el empuje, el velo y la sombra de la orilla. Antes se redibujaba un lienzo de 1600 × 1035 y se volvía a subir en cada cuadro del cambio (eso trababa). Cada motor crea su propio lienzo: dos motores en el mismo lienzo (React monta el efecto dos veces en desarrollo) se pisan el contexto WebGL |
| Títulos | La letra sigue al ancho **y al alto** de la pantalla (`min(4.4vw, 5.6svh)`): con sólo el ancho, en 1280 × 800 los títulos de dos renglones no cabían en su recuadro y se cortaban |

**Carga sin trabas** (es lo que más pesaba al abrir la landing):

- Los modelos se **unen y se simplifican** (laptop 2.1 → 1.5 MB, 47 piezas; celular 1.4 → 1.05 MB,
  40 piezas): menos piezas = menos llamadas de dibujo por cuadro. Se decodifican con meshopt **en
  dos workers**, fuera del hilo principal.
- La escena **no empieza al cargar la página**: espera al evento `load` y a que la sección esté a una
  pantalla. Mientras tanto, en reposo (`cuandoEnReposo`, `lib/utils/reposo.ts`), se piden con
  prioridad baja los modelos y las capturas, para que al llegar ya estén.
- Los sombreadores se compilan con `compileAsync` (sin congelar la página) y las texturas se suben
  **una por cuadro** antes de enseñar el lienzo; densidad de píxeles hasta 1.5 y GPU «default»
  (no pide la dedicada: en laptops con dos tarjetas la encendía sólo por esta escena).
- Sólo escucha el scroll mientras la sección está cerca; el paso cambia el estado de React sólo
  cuando cambia de verdad (no en cada cuadro).

Con «reducir movimiento» no hay recorrido: se ve la toma final, quieta. Si WebGL falla, queda la
captura del Panel. Para volver a comprimir un modelo: `gltf-transform` con `dedup` **sin
materiales** y `prune` con `keepAttributes` (si no, la pantalla pierde su nombre o sus UV); para
unir piezas, `joinPrimitives` sólo entre las que comparten material y **nunca** la malla de la
pantalla (el material de la pantalla se busca por su nombre).

**Noticias del Mar en la landing** (`NoticiasPortada` de servidor → `NoticiasDiario` de cliente):
**la misma portada que la página de Noticias**, como la hoja de un periódico sobre la franja
`bg-simar-abismo` (con olas arriba y abajo, para que no se confunda con la escena de arriba). Quien
entra a Noticias llega a lo mismo que ya vio. Antes era un mosaico de tarjetas con pestañas por
tema: parecía hecho por IA y no se parecía a Noticias.

| Pieza | Qué hace |
|---|---|
| La hoja | `bg-simar-papel` (en oscuro, `simar-superficie`), esquinas de 36 px y sombra larga; sube al entrar a la pantalla (`n-hoja`, atada al scroll). **Sólo sube** (transform): con opacidad y escala, toda la hoja con sus fotos se componía aparte en cada cuadro y la llegada se trababa |
| Cabecera | `CabeceraDiario` de la portada de Noticias, como h2 y un poco más chica (`compacta`): fecha y lugar, «Actualizado el…» con el punto en vivo, «N notas nuevas desde tu última visita», «Noticias del Mar» en Newsreader palabra por palabra, la línea de qué es, las cifras y los filetes que se dibujan |
| Nota principal | `NotaPrincipal`: la foto grande se descubre y se mueve un poco al bajar, con su crédito; tema, titular en Newsreader que se subraya al pasar el cursor, resumen y firma |
| Lo último | `LoUltimo`: las cuatro siguientes numeradas, con su foto chica; «Ver todas» lleva al archivo de Noticias |
| Que se note la sección | Arriba, junto a las cifras, **«Ver la sección completa»** (píldora con borde, ícono de periódico y flecha). Al pie, **un banner oscuro** que lleva a Noticias: «Una sección entera», «Hay mucho más en Noticias del Mar» en Newsreader, lo que hay adentro (notas, cifras, mapa, glosario y fuentes) y un botón espuma «Abrir la sección»; a la izquierda, un **abanico de tres fotos** de otras notas que se abre al pasar el cursor. Todo el banner es el enlace (blanco grande, para gente mayor), con la luz de vidrio vivo |
| Entradas | Las de Noticias (`n-filete`, `n-palabra`, `n-sube`, `n-descubre-ya`), que **esperan a que la hoja se vea**: la hoja sale del servidor en pausa (`n-espera` + `data-visto="no"`) y el atributo se cambia directo en el DOM, sin estado de React (volver a dibujar la hoja en ese cuadro trababa). Antes salía sin pausa: las entradas corrían fuera de la pantalla mientras cargaba la página y al llegar unas veces ya habían terminado y otras se reanudaban a medias. Sin JavaScript no hay pausa (`@media (scripting: enabled)`) |
| Descubrir la foto | Ya no es `clip-path` (Chrome lo anima en el hilo principal y repintaba la foto en cada cuadro): dentro de un marco que recorta, la capa baja desde arriba y su contenido sube lo mismo (`n-descubre-ya` + `n-descubre-ya-contra`; atado al scroll, `n-descubre` + `n-descubre-contra`). Son dos `translate` que mueve la tarjeta gráfica y la foto no se mueve. Marco y capa recortan con `overflow: clip` |
| Fotos | `FotoNota`: difuminadas al instante, se enfocan al llegar, **ya decodificadas** (`img.decode()`; si no, se decodificaban en el cuadro en que aparecían). Enfocada la foto, la previa difuminada deja de pintarse |
| «Nueva» | `MarcaNueva` / `ContadorNuevas`: lo publicado después de la visita anterior de esa persona (fecha guardada en su navegador, `simar:noticias-vistas-hasta`; la primera vez, los últimos 3 días). Insignia coral suave |

**El correo del mes** (`CorreoMensual`, al pie de la franja de noticias; datos armados en
`NoticiasPortada`): «El mar, una vez al mes, en tu correo.», una línea de qué trae y el formulario
(campo grande con su etiqueta, botón espuma «Quiero recibirlo»). A un lado, **cómo se verá el
correo**: la edición de este mes al frente (remitente, fecha del próximo envío —el primer lunes del
mes que sigue—, asunto, la cabecera de Noticias del Mar, dos cifras de siempre y los tres titulares
más nuevos) y las dos anteriores detrás, que se abren al entrar a la pantalla (`correo-hoja`, sólo
transform). Por ahora es **sólo diseño**: valida y responde en pantalla, pero el correo no se guarda
en ningún lado; por eso lleva «Muy pronto» y el aviso de «listo» dice que el envío todavía no empieza
(nunca le digas a alguien que quedó suscrito si no es cierto). Error con anillo y punto coral sólido
sobre la franja oscura; el aviso recibe el foco. Cuando exista la tabla de suscriptores, sólo cambian
`enviar` y ese aviso.

La letra de los titulares (Newsreader) sólo se pide en esta sección y en Noticias. En la landing va
**sin precarga** (`letraTitularDiferida`, en su propio archivo: en el mismo que `letraTitular` Next
precargaba las dos y cada archivo bajaba dos veces). Las entradas de la hoja y la foto que se mueve
al bajar son **CSS atado al scroll** (`n-paralaje`), sin Motion. Con «reducir movimiento», nada se
mueve.

**Lo que se baja al abrir la landing** (medido en producción, `next start`): JavaScript inicial de
~1.4 MB a ~780 KB. Lo que se quitó del arranque: las otras dos landings y Motion (entonces se cargaban
desde un componente de cliente: un `next/dynamic` en la página de servidor **no** parte el
código; hoy ya no existen, §8.5), el cliente de Supabase del `AuthProvider` (llega en reposo, o en el acto si hay una sesión
guardada), liquid-gooey (`CapaGota.tsx` llega aparte, antes de la primera gota) y las fotos 2 a 5 del
hero (se piden en reposo y una antes de que toque). Las fotos del hero van con calidad 60
(`images.qualities` en `next.config.ts`) y ninguna animación de la landing usa `filter: blur`
(repintaba toda la capa en cada cuadro): las entradas son sólo opacidad y movimiento.

---

## 9. Modo claro y oscuro

- **Claro por defecto.** `ThemeContext` arranca en `light` si el usuario no ha elegido otro; si
  ya eligió, se respeta lo guardado en `localStorage.theme`.
- El modo oscuro funciona con la clase `.dark` en `<html>`. Los tokens `--simar-*` se
  redefinen ahí, así que una pantalla hecha con tokens funciona en los dos modos sin más.
- **Sin esperar al JavaScript.** `SCRIPT_TEMA` (en el `<head>` de `app/[locale]/layout.tsx`) pone `.dark`
  antes de pintar, así la página se ve desde el primer cuadro y sin destello claro. No vuelvas a
  ocultar el contenido hasta que cargue React: en celular la pantalla tardaba segundos en aparecer y
  todo se montaba dos veces. `.dark` lleva `color-scheme: dark` (barras de desplazamiento y `<select>`
  en oscuro) y la barra del navegador (`theme-color`) sigue al tema de SiMAR, no al del teléfono.
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
una línea de descripción. La tarjeta es `@container` y el título mide
`min(32px, 100cqi / 7.2)` desde tableta: en una laptop con el menú abierto las tres tarjetas se
angostan y "Estadísticas" se partía a media palabra; así se achica con su tarjeta y nunca se corta.

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

**El Panel del recinto** (`components/dashboard/PanelInicio.tsx`; los datos, en
`lib/services/panel_recinto.ts` → `getResumenPanel`) sigue siendo un menú, pero dice lo que va del
día y lo que falta, sin gráficas:

- **Saludo con contexto** (el logo grande a la izquierda sólo desde `xl`; más angosto le
  quitaba espacio a la frase): la fecha ("Miércoles 30 de septiembre"), "Buenos días / Buenas tardes /
  Buenas noches" según la hora de Puerto Peñasco (el servidor corre en UTC: `saludoPuerto` y
  `fechaHoyPuerto` en `lib/utils/fechas.ts`) y una línea: "Hoy van **3 manifiestos** y **1 recibo
  del basurón**." Los números cuentan (`NumeroAnimado`). Sin registros: "Aún no hay registros de hoy."
- **Por atender:** sólo aparece si hay algo, con el contador coral junto al título. Una tarjeta por
  tarea, con las piezas de siempre (blanca, ícono de 56 px en círculo suave del tono): arriba, lo que
  pide escrito en su tono (`text-[15px] font-bold`, §10.6: "Hoy" en azul, "Requiere tu respuesta" o
  "Ya pasó su fecha" en coral); el título con el número ("1 solicitud por revisar"); el detalle; y el
  botón **azul** de lo que hay que hacer ("Ver", "Revisar", "Abrir chat"). Nada de fondos de color
  completos, franjas gruesas ni botones coral o verdes: se probó y se salía del lenguaje (la acción
  siempre es azul; el tono va en el ícono y en la palabra). En este orden: **recolecciones para hoy**
  (azul) o **atrasadas** (coral), solicitudes **por revisar** (coral) y **mensajes sin leer**
  (azul). Cada tarjeta lleva a donde se resuelve: Empresas recolectoras (ruta `asociaciones`) con `?ver=por-recolectar` (Solicitudes en "Por recolectar"),
  `?solicitud=ID` si es una sola (abre en su filtro y la fila se ilumina con `simar-resalta`) o
  `?ver=mensajes&empresa=ID` (esa conversación). Si es una sola, el detalle la dice completa
  ("Reciclados del Golfo · 200 L de aceite usado · hoy"). El número entra con `simar-confirma`
  cada vez que cambia.
- **Próximas recolecciones:** las aprobadas de los próximos días (después de hoy; las de hoy van en
  Por atender), como una agenda: el día en un cuadro azul suave ("Sáb 3 oct"), la empresa, el
  residuo y "Mañana / En 4 días". Tarjeta blanca; con Por atender, lado a lado desde `lg`.
  `getResumenPanel` → `proximas`.
- **Todo al día / Nada pendiente:** sin pendientes, una insignia verde con `PalomitaAnimada` (como
  "Firmado") en el saludo. Si la campana tiene avisos sin leer dice "Nada pendiente" (los avisos
  son historial, no tareas; "Todo al día" junto a una campana con número se leía como
  contradicción). `InsigniaCalma` sigue a la campana en vivo. En celular así el Panel cabe en una
  pantalla.
- **Un vistazo, debajo de las tarjetas grandes** (`getVistazoPanel`; si falla, lo de arriba
  sigue): **Lo último registrado** (los 5 movimientos más recientes entre manifiestos, recibos del
  basurón y recolecciones: título de qué es, detalle con la cantidad primero y luego quién —si no
  cabe se corta el nombre—, y la hora; cada uno lleva a su pantalla, la recolección a su solicitud)
  y **En el centro de acopio** (el inventario con cantidad, cada residuo con su color, la cantidad
  grande y su unidad escrita: litros, piezas, kg; "Sin publicar" si las empresas no lo ven; sin
  barras, porque kg, L y piezas no se comparan). Lado a lado sólo desde `xl` (columnas
  `minmax(0,…)`, si no se desbordaban a 1100 px); más angosto, uno debajo del otro. Es lo último
  del Panel. Cada renglón de "Lo último registrado" **abre ese registro**: `manifiesto?ver=ID` y
  `manifiesto-basuron?ver=ID` abren su ventana de detalle en cuanto carga la lista.
- **Sin "Otras secciones":** Embarcaciones, Personas y Empresas ya están en el menú (en celular, en
  "Más"); repetirlas al pie del Panel sólo lo alargaba.
- **Un dato vivo por tarjeta**, en una pastilla bajo la descripción (`clasePastilla` en
  `components/dashboard/pastilla.ts`): "Último: hace 2 h" (Manifiesto y Basurón) y "34 manifiestos en 30 días" (el mismo número que Estadísticas en "1 mes"). En una
  tarjeta angosta pasa a dos renglones; por eso sus esquinas son de 16 px y no de píldora. Si en
  el equipo quedó un **manifiesto sin terminar** (ver 10.8), la de Manifiesto lo dice en blanco con
  un lápiz: "Sin terminar: Don Chuy II" (`PastillaManifiesto`).
- **En vivo:** `PanelEnVivo` vuelve a pedir el Panel (`router.refresh`) cuando cambia una solicitud,
  llega un mensaje o se regresa a la app después de un minuto; lo de pantalla se queda y los
  números pasan del valor anterior al nuevo. Si la consulta falla, el Panel queda como menú sin datos.

### 10.4 Campo de formulario

Etiqueta arriba (nunca sólo placeholder), caja de 60 px con borde de 2 px que se vuelve azul al
enfocar. Si el dato tiene unidad, la unidad va escrita dentro, a la derecha.

```tsx
<label htmlFor="aceite" className="block mb-2 text-[17px] font-bold text-simar-texto">Aceite usado</label>
<div className={`simar-caja flex items-center gap-2.5 min-h-[60px] px-4 rounded-[14px] border-2 bg-simar-superficie transition-colors ${activo ? 'border-simar-marea-tinta' : 'border-simar-campo-borde'}`}>
  <input id="aceite" type="number" inputMode="decimal" enterKeyHint="next" placeholder="0"
    onWheel={(e) => e.currentTarget.blur()}
    className="flex-1 min-w-0 self-stretch bg-transparent focus:outline-none text-[22px] font-extrabold text-simar-texto placeholder:text-simar-texto-3" />
  <span className="text-[17px] font-bold text-simar-texto-2">litros</span>
</div>
```

- Caja con ícono o unidad: lleva `simar-caja` (el anillo de foco rodea la caja, no el texto) y el
  `input` lleva `self-stretch` (se puede tocar en todo el alto de la caja, no sólo en el renglón).
- Números: `inputMode="decimal"` (litros, kg) o `"numeric"` (piezas) para que el celular abra el
  teclado de números, y `onWheel` que lo desenfoca para que la rueda del ratón no cambie la cifra.

- Error: borde `border-simar-coral` y debajo `text-[15px] font-bold text-simar-coral` con el
  motivo ("* Requerido").
- Opcional: se dice en la etiqueta con peso normal: `Observaciones <span className="font-normal">(opcional)</span>`.
- Sugerencias desplegables: usa `CampoConSugerencias` (`components/ui/`). Ya trae el patrón
  combobox (el lector de pantalla oye cuántas hay y cuál está resaltada), ↑ ↓ Enter Escape, y el
  aspecto: `rounded-2xl border border-simar-borde bg-simar-superficie`, opciones de `text-lg` con
  `px-4 py-3`, la resaltada en `bg-simar-marea-suave`. Si el campo no tiene `<label>`, pásale
  `etiqueta` ("Nombre del motorista").

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

Contador (mensajes, notificaciones): `min-w-[26px] h-[26px] px-1.5 rounded-full bg-simar-coral-solido text-white text-[13px] font-bold`.
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
la derecha, el botón secundario y el principal. Entra con `simar-aparece` después de las tarjetas
(retraso de 0.24 s en Manifiesto): sin entrada se veía sola sobre la pantalla vacía.

**Manifiesto sin terminar** (`lib/utils/manifiestoSinTerminar.ts`): mientras se captura un
manifiesto, lo escrito (datos, residuos, nombres y firmas) se guarda solo en ese equipo, un momento
después de la última tecla, por usuario. Si al volver a la pantalla había uno, arriba del
formulario sale un aviso informativo (azul suave, ícono de lápiz): "Tienes un manifiesto sin
terminar · Don Chuy II · 1 firma · hace 20 min" con **Empezar de nuevo** (pide confirmación) y
**Continuar** (llena todo otra vez). Si en vez de elegir se empieza a escribir otro, el nuevo
reemplaza al anterior. Se borra al guardar el manifiesto; caduca a los 7 días. El archivo adjunto
no se guarda: si había uno, junto a "Adjuntar documento" sale en coral "Vuelve a adjuntar «…»". No
es el "Descargar borrador" de la misma pantalla (el PDF para firmar a mano).

**Los mismos responsables que la vez pasada:** al elegir una embarcación que ya entregó, y si aún
no se escribió ningún responsable, debajo del campo sale en azul suave "La vez pasada (12 sep):
Juan Pérez (motorista) · … [Usar los mismos]". El botón llena nombres e identificaciones del último
manifiesto de ese barco; las firmas no, ésas siempre se hacen de nuevo. La validación de
"embarcación" acepta un nombre escrito aunque no se haya elegido de la lista ("* Escribe o elige la
embarcación"), y cada campo del formulario tiene su etiqueta ligada (`htmlFor`/`id`).

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
- Botón de cerrar de 52 px arriba a la derecha con `aria-label="Cerrar"`. Escape también cierra.
- **En celular también se cierra jalándola hacia abajo**, como `HojaInferior`, si se cierra con
  Escape (`alEscape`): `useVentanaAccesible` le pone `arrastrarVentana`
  (`components/ui/arrastreHoja.ts`, misma física que la hoja). Sólo desde la franja de arriba
  (44 px, donde dibuja la agarradera con `data-jalable`) y con la ventana hasta arriba: así, al
  desplazar un formulario, un jalón de más no lo cierra. Si al soltar no se cierra (p. ej. está
  guardando y su `alEscape` no hace nada), regresa a su lugar. Las que son `fixed` ellas mismas
  (la tarjeta del recorrido) no se jalan.
- **Teclado y lector de pantalla:** `role="dialog"` y `aria-modal="true"` van en el **panel** (no en
  el velo), con `tabIndex={-1}` y `outline-none`. `useVentanaAccesible(ref, abierto)`
  (`components/ui/useVentanaAccesible.ts`) pone el foco adentro al abrir (respeta el `autoFocus`
  de un campo), no deja que Tab se salga y al cerrar lo regresa al botón que la abrió (aunque
  adentro haya un `autoFocus`, y también con el doble montaje de React en desarrollo). Con
  `{ alEscape: cerrar }` Escape la cierra; si hay una ventana encima de otra (una confirmación sobre
  un formulario), sólo la de arriba. Ya lo usan
  el `Modal` de `components/asociaciones/ui.tsx`, `ConfirmationModal`, `UserProfileModal`, las
  ventanas de Personas, Embarcaciones y Basurón, el visor y la firma del manifiesto, la ventana de
  acceso de la landing y `HojaInferior` (con `{ enfocar: false }`: la hoja ya maneja su foco).
- **Preguntar antes de borrar o deshacer:** `await confirmar({ titulo, mensaje, accion, peligro })`
  (`components/ui/Confirmar.tsx`), nunca `window.confirm()`: la cajita del navegador no sigue el
  diseño, no crece con la letra y en celular parece un error. Con `peligro` el botón va en coral y
  el foco empieza en "Cancelar". `<Confirmador />` va montado una vez en `app/[locale]/layout.tsx`.
- Si el componente vive dentro del menú lateral (que tiene `transform`), monta la ventana con
  `createPortal(…, document.body)`.

### 10.12 Avisos

`components/layout/AvisoGlobal.tsx` y los avisos del portal recolector:
`rounded-2xl p-5 text-base text-simar-texto` + fondo suave del tono + ícono de 24 px del tono.
Informativo = marea, advertencia = coral, crítico = coral con borde, superadmin/mantenimiento =
violeta.

**Avisos breves** (lo que acaba de pasar: "Manifiesto guardado", "No se pudo guardar…"): `toast`
de sonner, con frase de tú y el siguiente paso en `description`. Nunca `alert()`. Los errores no
muestran el mensaje crudo de Supabase: para leerlo en un `catch` sin `any` usa
`detalleDe(causa)` (`lib/utils/errores.ts`).

**Sesión por inactividad** (`AuthProvider`): a los 29 minutos sin actividad sale un aviso con
"Sigo aquí"; a los 30 se cierra la sesión y, ya en la entrada, un aviso dice por qué ("Cerramos tu
sesión tras 30 minutos sin actividad"). Se mide con la hora de la última actividad (un reloj de 15 s
y al volver a la pestaña), no con un temporizador que el teléfono pausa.

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
| `components/ui/Confirmar.tsx` | `confirmar()` (pregunta como función, devuelve `Promise<boolean>`) y `<Confirmador />`. Ver 10.11 |
| `components/ui/ImpactoEquivalencias.tsx` | Tarjeta "Impacto ambiental · Estimado" con sus equivalencias y "¿Cómo se calcula?" (Estadísticas y portal). Ver 10.18 y 10.20 |
| `components/asociaciones/LineaDeTiempo.tsx` | Seguimiento de una solicitud (Enviada → Aprobada → Recolectada). Ver 10.20 |
| `components/ui/useVentanaAccesible.ts` | Foco adentro, Tab que no se sale y foco de regreso en cualquier ventana. Ver 10.11 |
| `components/layout/useTituloPestana.ts` + `lib/constants/titulo.ts` | Título de la pestaña del navegador: `tituloPantalla('Personas')` → "Personas · SiMAR". Conserva el "(3) " de avisos sin leer y lo vuelve a poner si Next reescribe el `<title>` |
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
| Rechazada | `simar-coral-solido` con texto blanco |
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
  **"PDF del período"** y **"Reporte del mes"** a la derecha (en celular, en su propia fila de dos
  debajo de los botones del período); un **titular de una
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
- **PDF del período** (`components/dashboard/pdfEstadisticas.ts`, jsPDF, se carga al tocar): hoja
  A4 con el símbolo, el período y sus fechas, el titular, las cuatro cifras, dos gráficas de barras
  (basura en kg y aceite en L), las embarcaciones (que más entregan y sin entregar), a dónde se fue y
  el impacto con su nota de factores provisionales; pie con número de hoja. Usa los mismos textos y
  equivalencias que la pantalla. Las fuentes de jsPDF no traen "₂" ni "−": ahí se escribe "CO2" y "-".
- **Reporte del mes** (`ReporteDelMes.tsx` → `lib/services/reporte_mensual.ts` →
  `pdfReporteMensual.ts`), para entregar a SEMARNAT: no depende del período. Una ventana con los
  últimos 12 meses en cuadros de dos o tres columnas (el que va en curso dice "en curso"; del 25 en
  adelante viene elegido el mes que termina y antes, el pasado) y "Descargar septiembre 2026". El
  PDF (`SiMAR_reporte_2026-09.pdf`, mismo estilo que el del período): una frase con el mes, cinco
  cifras (manifiestos, basura, aceite, filtros con su desglose, basurón), la tabla de **cada
  manifiesto** (fecha, folio, embarcación, motorista, basura kg, aceite L, filtros) con renglón de
  total, los **viajes al basurón** (con la nota de que no se suman a la basura de arriba), las
  **entregas a empresas** y renglones para firmar (Elaboró / Recibió). El encabezado de cada tabla
  se repite al cambiar de hoja; lo que no cabe en su columna se corta con "...".
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
  (`lib/constants/impacto.ts`); la etiqueta "Estimado" va junto al título.
- **Una sola forma de calcular el impacto** (`lib/utils/equivalencias.ts`: `aguaProtegidaL`,
  `co2EvitadoKg`, `equivalenciaAgua/CO2/Basura`): la usan Estadísticas, su PDF y la landing, así
  que la misma cifra dice lo mismo en todos lados. 1 L de aceite contamina **1,000,000 L** de agua; el
  aceite evita **1.0 kg de CO₂e por litro** (el mismo factor que el portal de empresas). La basura
  que se cuenta es la de los **manifiestos**: el basurón es esa misma basura camino al relleno y
  sumarlas la contaba dos veces. En celular cada cuadro
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

### 10.20 Portal de empresas

Lo que la empresa recolectora ve (`app/[locale]/dashboard-recolector/`). Cada material siempre en su
unidad: el aceite en litros, los reciclables en kilos y los filtros en piezas, nunca sumados.

- **Inicio**, de lo más importante a lo que acompaña (piezas en
  `components/recolector/LoImportante.tsx`):
  1. **Saludo** con la hora y el día del puerto (`saludoPuerto`, `fechaHoyPuerto`), una frase que
     resume sin repetir la tarjeta de abajo ("Tienes una recolección agendada y 1 solicitud en
     revisión.", o lo disponible) y "Ver residuos y solicitar".
  2. **Lo importante**, lado a lado desde `xl` (`1.6fr` / `1fr`, la misma altura): la **próxima
     recolección** como la tarjeta principal del Panel (azul sólido, ícono en círculo blanco, el día
     en grande, pastillas "Mañana" y "Recién aprobada", "Ver solicitud" en blanco y "Cómo llegar"
     abajo; las demás agendadas debajo; si ya pasó su fecha, tarjeta blanca con "Ya pasó su fecha"
     en coral y "Escribir") y **Avisos**.
  3. **Disponible ahora** con "Solicitar" en cada renglón (abre `SolicitarModal`, la misma ventana
     que Residuos; "Lo recolectas" en lo que la empresa eligió en su perfil) y **Tu resumen** a un
     lado: solicitudes activas, recolecciones, "Lo que has recolectado" por unidad ("100 L · 250
     kg") y el CO₂e, uno por renglón, cada uno lleva a su pantalla.

  Sin recolección agendada, "Disponible ahora" sube junto a Avisos y Tu resumen va a lo ancho (cuatro
  columnas). En celular, uno debajo del otro en ese orden. El mapa grande se quitó del Inicio: siempre
  era el mismo punto; sigue en Residuos.
- **Avisos** (una sola tarjeta blanca): el contador coral junto al título, los **mensajes nuevos**
  y los últimos avisos, primero los que no ha visto, **tres renglones** como máximo y "Ver todos los
  avisos" abajo. Cada renglón: el ícono del aviso (`NotifIcon`), el título y "Nueva" si no lo ha
  visto (fondo azul suave, como en Notificaciones), y la hora con el detalle en una línea. Tocarlo lo
  marca como visto y abre su solicitud. Antes cada aviso era una tarjeta de color completo con "Ver"
  y "Entendido", más el aviso azul de mensajes y el renglón de lo que espera revisión: con dos o
  tres avisos se juntaba un bulto, y además se repetían abajo en "Actividad reciente" (ya no existe).
- **Mis solicitudes**: las aprobadas en azul suave con franja azul y su día ("Sábado 3 de octubre ·
  Mañana"); las rechazadas con franja coral y el motivo a la vista. Es el patrón de "No leído"
  (§10.19).
- **Solicitar**: si la cantidad o la fecha no sirven lo dice debajo del campo ("Sólo hay 400 litros
  disponibles."), no sólo apaga el botón.
- **Avisos que abren su solicitud**: en Notificaciones y en el Inicio cada aviso lleva a
  `solicitudes?ver=ID` (la ventana de esa solicitud abierta) o a Residuos si es un residuo nuevo
  (`destinoDelAviso`). Los avisos no guardan el id: `solicitudDelAviso` lo encuentra entre las
  solicitudes ya cargadas por la hora del cambio y, si la solicitud cambió después, por el residuo
  y el estado.
- **Seguimiento** (`components/asociaciones/LineaDeTiempo.tsx`, también en el detalle del recinto):
  Enviada → Aprobada → Recolectada (o Rechazada con su motivo / Cancelada), con fechas. Hecho =
  palomita verde; lo que sigue = anillo azul y "· Ahora"; lo que falta = círculo vacío. El título de
  la ventana dice qué es ("Aceite usado · 100 litros") y el número va abajo ("Solicitud n.º 5").
- **Impacto**: la gráfica muestra un material a la vez (Aceite · Reciclables · Filtros, el mismo
  selector que la tendencia de Estadísticas) y empieza por el que la empresa sí recolecta. El
  impacto es la misma tarjeta de Estadísticas (`components/ui/ImpactoEquivalencias.tsx`) con las
  mismas cuentas (`lib/utils/equivalencias.ts`): agua protegida por el aceite, CO₂e y los kilos
  reciclados ("bolsas de basura que se reciclaron en vez de ir al relleno").
- **Suscripción** (`components/recolector/MiSuscripcion.tsx`): "Tu suscripción" en Perfil (plan,
  estado, cuándo vence y qué hacer) y, una semana antes de que venza, un aviso coral arriba de cada
  pantalla con "Ver detalles". El cobro es manual: "comunícate con el equipo de SiMAR".
- **Constancia del año** (Historial → `ConstanciaAnual` → `pdfConstancia.ts`): se elige un año con
  recolecciones y sale un PDF con la frase "Se hace constar que…", el total por residuo, cada
  recolección con su folio y firmas del centro de acopio y de la empresa. Usa los datos del
  Historial (sin otra consulta).
- **Estado de la empresa** en femenino en toda la interfaz (`ESTADO_EMPRESA_LABEL`: Activa, Inactiva,
  Suspendida); en la base sigue "Activo / Inactivo / Suspendido".

**Tarjetas de empresa del recinto** (Empresas recolectoras → Empresas): lo que se ha llevado en cada
unidad, "Última recolección: hace 12 días" y lo que tiene abierto ("1 por revisar" en coral, "1 por
recolectar" en azul). Sin giro del ícono ni barra al pasar el cursor (sección 8); nombre de 17 px.

---

## 11. Textos

- Español, frases cortas, de tú: "Selecciona una opción", "Escribe el nombre del barco…". (Hay
  textos viejos de usted, como "Dibuje su firma"; al tocarlos pásalos a tú.)
- Títulos que digan la tarea: "Manifiesto de entrega-recepción", no "Módulo de gestión".
- Unidades siempre visibles: litros, piezas, kg.
- Nada de jerga técnica en la interfaz (ni "registro creado en BD", ni códigos de error crudos).
- Mensajes de estado en positivo y con el siguiente paso: "Aún no hay firmas. También puedes
  adjuntar el documento firmado."
- **Nombres fijos** (así se dicen en toda la interfaz; en el código y la base de datos siguen los
  nombres de siempre):
  - **Basurón** para el recibo del relleno sanitario ("Recibo del basurón", "Recibos del basurón"),
    no "manifiesto basurón".
  - **Empresas recolectoras** (o "empresa") para quienes se llevan los residuos, no "asociaciones".
    La ruta sigue siendo `/dashboard/asociaciones` y las tablas `asociaciones_recolectoras`.
  - **Embarcación**, no "buque" (también en filtros y encabezados de Excel).
- Fechas con `toLocaleDateString('es-MX', …)`, no `es-ES`. Cantidades con `formatCantidad`.
- Sin "exitosamente": "Persona guardada", no "Persona creada exitosamente".
- **Sin conexión:** si la petición no llegó, se dice `MENSAJE_SIN_CONEXION` ("No hay conexión con SiMAR. Revisa
  tu internet e inténtalo de nuevo."; `esErrorDeRed` en `lib/utils/errores.ts`, ya lo usan el acceso y
  `mensajeError`). Nunca el texto del navegador: "Failed to fetch", "Load failed".
- El título de la pestaña del navegador dice la pantalla: "Manifiesto · SiMAR" (`tituloPantalla`).

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
(Resumen, Cuentas, Suscripciones, Planes, Auditoría, Sistema), Acceso pendiente y Mantenimiento.
El modo simple (`/dashboard/simple`) se borró: nadie lo usaba y duplicaba el Panel.

**Se quedaron como estaban, a propósito:**

- El dibujo del mapa de puertos de la landing (`MapaSilueta.tsx`, `MapaMapLibrePuertos.tsx`) vive
  en una banda oscura y tiene su propio estilo. Su panel (`SeccionMapaPuertos.tsx`: cifras, ficha
  del puerto, leyenda y botones) ya sigue la escala SiMAR: 15 px o más, sin mayúsculas, botones de
  48 px.
- El código que ninguna pantalla importaba (`CreateManifiestoModal`, `SidebarVariantD`,
  `LanguageSwitcher`, `TiposPersonaManager`, `DashboardBackground`, `components/simple/`) se borró
  el 2026-09-30, junto con las dependencias que nadie usaba.

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
mínimos de tacto y lectura. **Desde oct-2026 esos mínimos son 15 px de letra y 44 px para todo lo
que se toca** (antes 13–14 px y 38–42 px; los subió la auditoría de pantallas). **Tableta y escritorio
conservan la escala grande de las secciones 4 y 5.** Hoy lo tienen los tres paneles con las mismas
reglas —el recinto (`DashboardLayout`), el portal de empresas (`dashboard-recolector/layout.tsx`) y
el superadmin (`superadmin/layout.tsx`)— y la landing.

### 16.1 Dos herramientas (en `app/globals.css`)

| Qué | Cómo | Para qué |
|---|---|---|
| Escala compacta automática | Clase `simar-compacto` en el contenedor del panel (ya la pone `DashboardLayout`) | Baja de una vez `--spacing` (p-6, gap-5, w-6… al 87.5 %), los tamaños con nombre (`text-lg`, `rounded-2xl`…) y los tamaños fijos del lenguaje: 13/14/17→15, 19→16, 22/23→18, 28→21 px (`text-xs`, `text-sm` y `text-base` quedan en 15); controles 64→50, 60→46, 56/54/52/48/44→44 px; esquinas 28→20, 18→14, 14→12 px |
| Piso de toque | Automático dentro de `simar-compacto` | Todo botón, enlace suelto, `select`, `summary`, pestaña o `role="button"` mide al menos 44 px de alto (y de ancho, si es sólo ícono con `aria-label`). Le gana a un `movil:min-h-[40px]` escrito a mano. Sólo sube: lo que trae su propia altura mínima de 44 px o más (una clase `min-h-*`, la barra de abajo de 58 px) se queda con la suya. Para una excepción justificada, clase `simar-toque-libre` |
| Variante `movil:` | `movil:grid-cols-2`, `movil:hidden`, `movil:text-[15px]`… | Cambiar el **acomodo** en celular: columnas, ocultar, deslizar, pestañas. Funciona dentro de `.simar-compacto` y de `.simar-landing`. Un valor `movil:` es **exacto**: le gana a la escala automática |

- Un `movil:text-[…]` para algo que se lee va de **15 px para arriba**. Las únicas excepciones
  son las que traen su propio apoyo: el número de un contador redondo (12 px en un círculo de
  20 px), las marcas de los ejes de las gráficas y el mes chico bajo el día de un calendario
  (11 px), y la palabra bajo el ícono en la barra de abajo y en las secciones de Empresas
  recolectoras (se ajusta al ancho, 10–14 px), como en las apps del teléfono.
- Un campo dentro de una caja con ícono o unidad lleva `simar-caja` en la caja y `self-stretch`
  en el campo: así se toca en todo el alto de la caja (§10.4).

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
  conservan su encabezado con el título, salvo Inicio del portal: ahí el saludo es el título (`h1`)
  y la barra repetía el nombre de la empresa.
- **Barra inferior** (`BarraInferior`): cápsula de **cristal líquido** plano (16.4) flotante a 10 px del
  borde (respeta la zona segura del teléfono). Cuatro secciones + un botón al final. Palabras de
  9.5–12 px: `BarraInferior` mide la palabra más larga con la fuente real y el ancho que tendrá
  cada botón en ese teléfono, y elige el mayor tamaño con el que todas caben dentro de la gota
  (variable `--barra-letra`; se recalcula al cambiar el ancho o al cargar la fuente). Si ni a
  9.5 px cabe (teléfonos de ~330 px o menos), la barra queda sólo con íconos, como minimizada. **Todos los botones miden lo mismo** (`flex-1`, sin huecos
  entre ellos) y la gota también. La palabra activa no cambia de peso (sólo de color) para que no
  salte cuando llega la gota. **Nombres cortos:** la palabra más larga fija el tamaño de todas, así
  que la barra usa nombres cortos y la pantalla conserva su título: en el recinto "Reportes" lleva a
  Estadísticas (con "Estadísticas" todas quedaban en 10 px; con "Reportes", en 12 px a 375 px).
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
  - **Al presionar** un botón, su ícono y su palabra se hunden (90 %) en cuanto el dedo toca; la
    sección se abre al soltar. Arrastrando la gota no se hunden.
  - La sección activa, además de la gota, lleva ícono y palabra en `simar-marea-tinta` y negritas
    (el color nunca va solo).
- **Hoja "Más"** (`HojaMas` sobre `HojaInferior`): en el recinto el último botón abre una hoja
  desde abajo con el perfil, las otras secciones en mosaico de tres, los accesos de superadmin,
  el tema y cerrar sesión. Se cierra con el fondo, con Escape, jalándola hacia abajo o al
  elegir una sección; bloquea el desplazamiento de atrás y devuelve el foco al botón. **Cómo se
  jala** (`HojaInferior`, igual en avisos y en el selector de fecha y hora): desde la agarradera
  (zona de 44 px) o desde el contenido cuando está hasta arriba; sigue al dedo 1:1, aunque todavía
  vaya entrando (se toma desde donde va); el velo se aclara conforme baja; hacia arriba resiste en
  vez de frenarse en seco. Al soltarla decide con la velocidad del dedo, como iOS: se proyecta a
  dónde llegaría con ese impulso (frenado de 0.998) y se cierra si eso pasa de 100 px (o de media
  hoja, si es más baja); así un tirón corto y rápido la cierra y uno lento de 60 px no. Después la
  lleva un resorte sin rebote que arranca a la velocidad del dedo, sin costura. Con "reducir
  movimiento" va directo a su lugar o se cierra. El portal
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
| Ventanas como hoja inferior | Todas las ventanas `fixed › simar-ventana` del recinto y del portal, y el acceso de la landing | Automático (CSS): a todo lo ancho, esquinas sólo arriba, sube con `simar-hoja`, máximo 92 % del alto. Si se cierra con Escape, lleva agarradera y se cierra jalándola desde arriba (10.11) |
| Burbuja flotante | Personas, Embarcaciones, Asociaciones (Nueva asociación), Inventario (Agregar residuo), Mis solicitudes del portal (Nueva solicitud, lleva a Residuos) y el superadmin (Invitar cuenta, Nuevo plan) | `BotonFlotante`: la acción principal de la lista flota a la derecha, encima de la barra inferior. Extendida (ícono + palabra) arriba de la página; al bajar se encoge a un círculo de 56 px y baja con la barra minimizada. En la pantalla, la acción del encabezado lleva `accionesClassName="movil:hidden"` (en tableta y escritorio sigue ahí) |
| Pestañas con su aviso | Asociaciones | En celular las tarjetas de conteo se ocultan. Las cuatro secciones en una fila (ícono arriba, palabra abajo) y **sólo los avisos** van en la esquina del ícono, en coral con un aro del color de fondo (pendientes, sin leer), como en las apps del teléfono. Un número que no pide nada (asociaciones activas) no va en la pestaña: va dentro de su sección ("3 activas de 4 registradas") |
| Jerarquía de navegación | Asociaciones | Tres niveles que no se parecen: la **barra inferior** (cristal), las **secciones** de la pantalla (pastilla azul rellena, el único azul) y los **filtros** de cada sección (`ControlSegmentado`: canal gris y la opción elegida en blanco). Dos niveles con el mismo azul relleno se leen como uno solo |
| Filtro segmentado de pocas opciones | Asociaciones → Solicitudes y Asociaciones; portal: Mis solicitudes e Impacto (periodo) | `ControlSegmentado` (`components/asociaciones/ui.tsx`): una fila sin deslizar, palabra de `clamp(12px, 3.6vw, 14px)`. Va dentro de una tarjeta blanca (su canal gris no se ve sobre el fondo de la página). Si hay muchas opciones, se agrupan y se afinan con un selector nativo ("Mostrar: Completadas (3)"): en el recinto **Pendientes · Por recolectar · Historial** (lo que hay que atender primero, con su número; coral si hay pendientes); en el portal **Todas · Activas · Terminadas** ("Activas" como en su Inicio). En tableta y escritorio, Solicitudes del recinto usa el mismo control con `vista="computadora"` (a todo lo ancho de la tabla, las opciones repartidas parejo; si en su contenedor no caben en una fila —laptop con el menú abierto, tableta—, dos filas de tres con `@container`, nunca deslizándose; botones de 48 px y letra de 17 px) y sus seis opciones con su número (coral / azul en lo que hay que atender, gris en lo demás), alineado con la primera columna de la tabla; antes eran pestañas subrayadas sobre una franja beige que se veían desfasadas. Las demás pantallas siguen con su selector o sus fichas |
| Renglón de solicitud | Asociaciones → Solicitudes | Nombre en hasta dos líneas (`movil:line-clamp-2`) con la fecha de recolección debajo; estado a la derecha (etiqueta angosta en celular); residuo y cantidad; la acción principal **con su palabra** (Aprobar, Rechazar, Completar, Comprobante) a la izquierda y las de ícono a la derecha |
| Formulario en ventana, no en la fila | Asociaciones → Inventario (agregar y editar residuo) | No se edita dentro del renglón en ningún tamaño: se abre un `Modal` (ventana al centro en computadora; en celular sube como hoja inferior) como el de "Nueva asociación". El tipo se elige tocando cuadros de dos columnas (color del material y su unidad escrita: "en litros", "en piezas", "en kg"), la unidad va dentro del campo de cantidad y "Publicado" es un interruptor que ocupa toda la fila. Al editar en computadora el cursor ya está en la cantidad (en celular no, abriría el teclado). Antes, en tableta y escritorio se editaba en la fila con una lista desplegable, un campo chico y una casilla |
| Filtros que se abren | Superadmin → Auditoría | Con cinco filtros o más, en celular van detrás de un botón **Filtros** (con cuántos hay activos y "Limpiar" al lado) que los despliega en dos columnas; a la vista ocuparían media pantalla antes del primer registro |
| Mucha información por renglón | Superadmin: Cuentas, Suscripciones, Pagos, Auditoría | La primera celda junta en líneas de 13 px lo de las columnas ocultas (rol y asociación; plan, precio y vigencia; método y referencia; registro, fecha y usuario). En Auditoría la fecha va antes del correo: si no cabe, que se corte el correo y no la hora |
| Gráfica de 12 meses | Superadmin → Resumen (ingresos) | En celular el eje X lleva sólo la inicial del mes (E F M A…): "ene", "feb" no caben en columnas de ~22 px; el mes completo sale al tocar la columna |
| Chat al alto de la pantalla | Asociaciones → Mensajes; Mensajes del portal | La caja del chat mide `100dvh` menos lo de arriba y la barra (deja 8 px de respiro). En el portal lo de arriba cambia (aviso de superadmin o de suscripción), así que la pantalla mide dónde empieza la caja y lo pasa como `--arriba`: el campo para escribir siempre queda arriba de la barra. Sin la ayuda de teclado. En una columna (< 768 px) primero se ve la lista de conversaciones, salvo que se llegue con "Abrir chat"; para volver, botón de flecha junto al nombre |
| "Leer más" | Landing: El proyecto, Don Francisco | En celular sólo el primer párrafo; el botón muestra el resto |
| Carrusel de tarjetas | Landing: Conciencia Azul | Clase `simar-carrusel`: se desliza de lado con imán, cada tarjeta al 84 % del ancho |
| Avisos del recinto | Recinto: campana en la píldora de arriba (celular y tableta) y renglón "Avisos" en el menú lateral (computadora) | `components/layout/AvisosRecinto.tsx`. Número coral de sin leer que entra con un pulso (`simar-confirma`) cada vez que cambia. La lista sube como hoja en celular y flota junto al menú en computadora; sin leer en negritas con fondo azul suave y punto coral; "Marcar todo como leído". La lista va por días (**Hoy**, **Ayer**, **Antes**; `agruparPorDia` en `lib/utils/fechas.ts`, también en Notificaciones del portal). Cada aviso abre **su** solicitud (`?solicitud=ID`: su filtro y la fila iluminada); los avisos no guardan el id, se encuentra por la hora exacta (`buscarSolicitudDeAviso`). Lo nuevo llega en vivo y también sale como mensaje emergente con "Ver". El número de sin leer también va en el título de la pestaña ("(3) SiMAR — …") y en el ícono de la app instalada (`useInsigniaAvisos`; en el portal, sus notificaciones) |

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
- Imágenes con `next/image` y el tamaño con que se ven (`sizes` del ancho de su columna, o `width`/`height`):
  un `<img>` suelto baja completo aunque esté oculto con `hidden`. En la landing el logo del ITSPP (264 KB)
  y dos fotos de 1200–1600 px bajaban así en celular; con eso la página pasó de 1.5 MB a 0.8 MB.
