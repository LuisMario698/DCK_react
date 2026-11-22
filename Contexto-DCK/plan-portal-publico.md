# Plan del portal público (landing Actual)

> Hoy: miércoles 11 de noviembre de 2026. Congelamiento: martes 17 de noviembre. Nacional de InnovaTecNM: martes 24 de noviembre, en Puebla.
> Archivo principal: `components/landing/VariantCinematic.tsx` (1,194 líneas). Producción (main en Vercel) no se toca, y no hay commit ni push hasta que lo pidas.
> Comparé dos propuestas. **A** pone primero la experiencia: una historia de 8 paradas con dos escenas 3D. **B** pone primero el riesgo y el rendimiento: CSS antes que WebGL, y el globo para después del nacional. Revisé contra el código lo que estaba en duda. Abajo queda lo que decidí.

---

## 1. Resumen

1. La landing pasa de 9 secciones y unas 870 palabras a 7 secciones y unas 400. Cada pantalla dice una sola cosa, cada cifra sale una vez con su fuente, y se van los ceros, el «Datos reales» de la demostración y los datos sin respaldo («2,000+ especies», «12 años», «11,122 km», «más de 5,000 reportes»).
2. Antes de agregar, se quita lo que hoy traba: el carrusel del inicio redibuja toda la landing cada 6 s, la entrada usa `blur`, el mapa repinta sin parar con SMIL y `backdrop-blur`, y hay 12 contadores que actualizan React en cada cuadro.
3. La profundidad se hace con capas CSS atadas al scroll (sólo `transform` y `opacity`). El 3D va sólo donde explica algo que el texto no puede: un tambo real que hace ver qué son 1,000,000 L de agua, y la Tierra con texturas de la NASA que gira hasta Puerto Peñasco y luego enseña los puertos que pueden sumarse.
4. El cierre deja de ser «Iniciar sesión» y ofrece tres puertas para volver: el correo del mes, Noticias del Mar y probar SiMAR. El pie se vuelve mapa del sitio, «Hecho en Puerto Peñasco» y créditos.
5. Se trabaja en este mismo worktree, con hasta 3 agentes escribiendo a la vez en archivos distintos y un solo proceso pesado a la vez en tu máquina (7.4 GB de RAM). Cada escena 3D tiene una fecha límite y un respaldo en 2D ya hecho.

---

## 2. Principios del portal público

- **Una idea por pantalla:** como máximo 25 palabras visibles. La única excepción es la cita de Don Francisco (≤ 45 en esa pantalla).
- **Cada cifra una vez y con su fuente.** Sin datos no hay ceros: la parte con cifras se esconde. En la demostración, la insignia dice «Datos de demostración».
- **Capas con distinta velocidad, sólo en la landing:** como máximo 3 capas, sólo `transform`/`opacity`, atadas a `view()`, envueltas en `overflow-clip` (nunca `overflow-hidden`). Para descubrir algo se usan dos `translate` opuestos, no `clip-path`. Nada de `filter: blur` animado, nada que se mueva solo en bucle y nunca se mueve el texto que la persona está leyendo. Esto se agrega a DISEÑO_SIMAR §8.3 como excepción de la landing, porque hoy esa sección prohíbe el parallax.
- **3D sólo con objetos reales, con licencia libre y con su crédito.** Nunca hay más de **2 lienzos WebGL vivos** a la vez y sólo uno pinta. La escena de equipos se queda como está. Los motores nuevos se arman a una pantalla de distancia y se **liberan solos** (`dispose` + `forceContextLoss`) cuando quedan a más de 1.5 pantallas.
- **Lo pesado espera:** three.js con `await import()`, después de `load` y cerca de la sección. Los archivos se piden en reposo (`cuandoEnReposo`). La página tiene una sola imagen con `fetchPriority="high"`: la del LCP.
- **Para usuarios mayores:** letra ≥ 17 px (los créditos pueden ir a 15 px), botones ≥ 52 px (≥ 44 px en celular), sólo colores `var(--simar-*)`. Con «reducir movimiento» todo queda quieto. **Cada archivo CSS nuevo pone sus animaciones dentro de `@media (prefers-reduced-motion: no-preference)` y `@supports (animation-timeline: view())`**, como `.reveal` en `globals.css`: la regla global que acorta la duración no detiene una animación atada al scroll.
- **Los mismos nombres en toda la página:** «Iniciar sesión», «Probar la demostración», «embarcación», «Empresas recolectoras». Fechas en `es-MX` y con la hora del puerto (America/Hermosillo).
- **Una razón para volver:** «N nuevas» en la portada, Noticias del Mar, el correo del mes y «Cifras al…».

---

## 3. Nuevo orden de la landing

| # | Sección (ancla) | Qué es | Estado |
|---|---|---|---|
| 1 | Portada (`#top`) | SiMAR y una frase, sobre la flota de Puerto Peñasco en capas | Rehacer |
| 2 | Cómo funciona (`#como-funciona`) | Escena de la laptop y el celular (primer lienzo WebGL) | Ya hecha, no se toca |
| 3 | Noticias del Mar (`#noticias`) + correo del mes (`#correo-del-mes`) | La hoja del periódico y el correo | Ya hecha, sólo se agrega el `id` |
| 4 | Impacto «Un litro» (`#impacto`; alias `#equivalencias` y `#conciencia`) | El tambo 3D: 1 L de aceite = 1,000,000 L de agua, y la cifra real del puerto | Rehacer (junta 3 secciones) |
| 5 | Don Francisco (`#don-francisco`) | «Para él se hizo SiMAR» y la hoja que se vuelve dato | Rehacer |
| 6 | Dónde (`#mapa`) | La Tierra 3D (NASA) gira hasta Puerto Peñasco y luego enseña los 8 puertos que pueden sumarse | Rehacer (respaldo: el mapa SVG corregido) |
| 7 | Tres puertas (`#participa`) | Correo del mes, Noticias, probar SiMAR | Rehacer |
| 8 | Pie (`#proyecto` en su banda) | «Hecho en Puerto Peñasco», Explorar / Participar / Fuentes, créditos | Rehacer |

- **Menú de la isla (`NAV_LINKS`), en el orden de la página:** Cómo funciona · Noticias · Impacto · Don Francisco · Puertos. Así la línea de marea sólo avanza; hoy salta hacia atrás.
- **Lienzos WebGL:** el de equipos (2) y el de «Un litro» (4) los separa Noticias; el de «Un litro» (4) y el de la Tierra (6) los separa Don Francisco (≈ 2.5 pantallas). Con la regla de armar a 1 pantalla y liberar a 1.5, nunca hay más de 2 vivos.

---

## 4. Por sección

### Veredicto rápido

| Sección | Decisión | Base | Lo que se toma de la otra | Lo que se descarta y por qué |
|---|---|---|---|---|
| Portada | Rehacer | B (la foto de la flota, una pantalla) | A: la insignia «N nuevas», el crédito visible, la ola al frente | La foto satelital de fondo (A): en el archivo, Puerto Peñasco queda en el 11 % de arriba, bajo la isla, y no se puede «llegar» a él |
| Proyecto | Pasa al pie | A (banda «Hecho en Puerto Peñasco») | B: los logos con `next/image` y su `alt` | img3 en «Quiénes» (B): es la ceremonia de la CONANP, no el equipo; ponerla bajo «Quiénes lo hacen» engaña |
| Don Francisco | Rehacer (2 pantallas) | A (la hoja que se vuelve dato, atada al scroll) | B: la cifra de manifiestos va aquí, una vez | Reusar `ComparadorHojas` (B): no va atado al scroll y anima `clip-path` |
| Conciencia | Fusionar | Las dos | B: la biodiversidad, con la cifra de la UNESCO, pasa al mapa | — |
| Equivalencias e Impacto | Rehacer como «Un litro» | A (4 pasos y el tambo 3D) | B: primero la versión 2D con fotos, que sirve de respaldo; sin contadores; `id="impacto"`; la insignia honesta | Contar con `@property` + `counter()` (A): `counter()` no pone comas de miles |
| Mapa | Rehacer | A (el globo 3D con fecha límite y respaldo SVG) | B: los arreglos del SVG antes; UNESCO; «desde 2026» | El acercamiento CSS sobre la foto satelital (B): para centrar Peñasco habría que ampliar 4.5× una foto de 2000 px |
| Llamado final | Rehacer | A (tres puertas) | B: el símbolo y las olas con `view()` | — |
| Pie | Rehacer | A (columnas y créditos en `<details>`) | B: «Acceso desarrollador» se queda, discreto | Quitar «Acceso desarrollador» (A): el equipo lo usa y no es parte del rediseño |

Además se descarta de A la regla «un solo lienzo», que obligaba a reescribir el ciclo de vida de `EscenaEquipos`, ya terminada. Hoy su motor sólo se libera al desmontar, y rearmarlo al subir trabaría. Se queda la regla de **≤ 2 vivos, uno pintando**: lo cumplen los motores nuevos solos.

---

### 4.1 Portada (`#top`): rehacer

**La única idea:** SiMAR registra lo que las embarcaciones de Puerto Peñasco entregan en el muelle, para que no termine en el mar.

**Texto:** antes 41 palabras y 6 ideas; después **≈ 33 palabras** más el crédito.

- **Antes:** «Puerto Peñasco · Sonora · México» · símbolo + «SiMAR» · «Sistema Integral de Manejo Ambiental de Residuos» · «Transformando la gestión de residuos marinos con trazabilidad digital y compromiso con el Mar de Cortés.» · «Acceder a la plataforma» · «Conocer el proyecto» · «¿Sin cuenta? Prueba la demostración» · un carrusel de 5 fotos con píldoras y pausa.
- **Después:**
  - Antetítulo: «Puerto Peñasco · Sonora»
  - h1: el símbolo y el logo SiMAR (`alt="SiMAR"`), y debajo, en un renglón de 20–24 px, «Sistema Integral de Manejo Ambiental de Residuos»
  - Frase (22 px): «Lo que las embarcaciones entregan en el muelle queda registrado y lejos del mar.»
  - Botón principal (≥ 64 px): «Lo último del mar», que lleva a `#noticias`, con la insignia «N nuevas» sólo si hay notas desde la última visita (misma lógica y clave que `ContadorNuevas`). Con `MODO_DEMO`, el botón principal es «Probar la demostración».
  - Botón secundario: «Cómo funciona», que lleva a `#como-funciona`
  - Crédito (15 px, abajo a la izquierda): «Foto: David Noll · CC BY-SA 2.0 (adaptada)»
- **Se va:** el párrafo «Transformando…»; «Acceder a la plataforma» («Iniciar sesión» queda en la isla y en las tres puertas); el enlace a la demostración (pasa a las tres puertas); el carrusel con su píldora, sus puntos y su pausa; «Desliza».

**Movimiento y técnica:**
- **Al cargar, sin `blur`:** opacidad y 12 px de `translateY` en 0.6 s, escalonados de 0 a 0.5 s. La portada completa se ve en menos de 1.2 s (hoy tarda 2.5–3 s). El símbolo conserva su giro de −50° con `rotate` + `scale(.9→1)`, sin desenfoque. Las dos curvas SVG se trazan una vez.
- **Tres capas atadas al `view-timeline` `--simar-hero`, que ya existe:**
  - Fondo: la foto baja más lento que la página (`translateY` 0→14 %, `scale` 1.06→1).
  - Medio: el contenido se va con `simar-hero-sale`, como hoy.
  - Frente: una ola SVG (como `OlaSeparador`) sube más rápido (0 → −8svh).
- **Se quitan:** el estado del carrusel en el componente raíz con su temporizador, el tinte con `mix-blend-mode`, la píldora con `backdrop-filter` y `vidrio-destello`, y los otros dos `fetchPriority="high"` (símbolo y nombre).
- **Costo:** 1 foto de 1920 px a calidad 60 (~150–220 KB), 3 capas compuestas, 0 KB de JS nuevo, ningún render de React al bajar. La insignia recibe del servidor sólo las fechas de las notas (no importa `noticias.ts` en el cliente) y se pinta después de montar.
- **Con «reducir movimiento»:** quieta. **Sin `view()`** (Firefox, Safari < 26): quieta y legible.

**Activos:** `public/assets/noticias/fotos/flota-de-puerto-penasco.webp` (2000×1335, 213 KB; `FOTOS.flotaDePuertoPenasco`, David Noll, CC BY-SA 2.0, de Wikimedia Commons), con `objectPosition` ≈ `50% 72%` para que se vean los barcos. Logos `simbolo-grande.png` y `nombre-grande-oscuro.png`, que ya están. No hay descargas. img1, img2, img3 e img5 salen de la portada; img4 pasa a Don Francisco.

**Esfuerzo:** M.

**Riesgo:** medio, porque es lo primero que ve el jurado.
- El naranja del atardecer junto al azul de la marca: se resuelve con el velo `simar-abismo` que ya existe.
- Los nombres de los barcos se leen en la foto: el velo los baja; si estorban, se sube el `objectPosition`.
- El LCP no debe empeorar: se mide contra la línea base de la etapa 0.

**Criterios de aceptación:**
- A 1280×800 y a 375×812 se ven el h1, la frase y los dos botones sin bajar: el pie del último botón queda a ≤ `innerHeight − 24 px`.
- ≤ 35 palabras visibles, sin contar el crédito.
- Toda la página tiene una sola imagen con `fetchpriority="high"` (la foto), y al abrir se pide una sola foto del inicio.
- En `components/landing` no quedan `currentIndex`, `SEGUNDOS_POR_FOTO` ni `simar-hero-tinte` (`rg`). Ningún `@keyframes` del inicio anima `filter`.
- React Profiler, 20 s con la portada a la vista sin tocar nada: 0 commits.
- Con `next start` en tu máquina, el LCP es ≤ 2.0 s y no peor que la línea base.
- Con «reducir movimiento», `document.querySelector('#top').getAnimations({subtree:true})` no tiene animaciones corriendo.

---

### 4.2 Proyecto (`#proyecto`): fusionar en la banda del pie

**La única idea:** lo hicieron aquí: DCK y el ITSPP, con el respaldo de la SEMARNAT.

**Texto:** antes 118 palabras y 6 ideas, con «Leer más» en celular; después **29 palabras**.

- **Antes:** «Tecnología al servicio del mar.» · quiénes · qué hace · el papel deteriorado · «3 Instituciones / N Manifiestos / 1 Puerto pionero» · el pie del Alto Golfo sobre una foto (img3) que no corresponde.
- **Después** (una banda arriba del pie, que conserva `id="proyecto"`):
  - Antetítulo: «Hecho en Puerto Peñasco»
  - Línea: «SiMAR lo crearon DCK Conciencia y Cultura —Dayanara, Coral y Karitza— y el Instituto Tecnológico Superior de Puerto Peñasco, con el respaldo de la SEMARNAT.»
  - Logos grandes (≥ 64 px de alto) de DCK e ITSPP; ICS si el equipo confirma que va.
  - Opcional, sólo si el equipo lo confirma: «Segundo lugar en la etapa regional de InnovaTecNM 2026.»
- **Se va:** el lema, el párrafo de qué hace (lo cuenta la escena de equipos), el del papel (lo cuenta Don Francisco), la fila 3 / N / 1, la foto img3 (sigue en su nota de Noticias, con su `alt` correcto) y el «Leer más».

**Movimiento y técnica:** `reveal` con `view()`. Los logos llegan del fondo (`scale` 0.92→1 y 20 px), la línea con 28 px. Se quitan el contador de manifiestos y el `backdrop-filter` del pie de foto. Costo casi cero.

**Activos:** `public/assets/landing/logo-dck.webp`, `public/assets/logo_ITSPP.png` y `public/assets/logo_ICS.png`, ya en el repo, con `next/image` y su `alt`. El logo de la SEMARNAT no se usa: sólo se nombra.

**Esfuerzo:** S.

**Riesgo:** que el jurado no encuentre quién lo hizo. Por eso va visible (no en un `<details>`) y está en «Explorar» del pie. «Respaldo de la SEMARNAT» es lo que hoy dice la página: si el equipo no lo puede sostener, se quita.

**Criterios de aceptación:**
- `#proyecto` lleva a la banda.
- En la landing no queda «Leer más» ni contenido escondido sólo en celular.
- La landing Actual ya no usa img3.
- La banda tiene ≤ 35 palabras y sus logos miden ≥ 64 px de alto.

---

### 4.3 Don Francisco (`#don-francisco`): rehacer en 2 pantallas

**La única idea:** SiMAR se hizo para él: lo que anotaba a mano ahora no se pierde.

**Texto:** antes 124 palabras, con «Leer más», las cajas «2014 / SEMARNAT» y una frase que mezclaba las hojas en papel con los manifiestos digitales; después **44 + 28 palabras**.

- **Pantalla 1, la persona (44 palabras):**
  - Antetítulo: «Quién los recibe» (sigue a «ya se entregaron N litros» de Impacto)
  - h2: «Para él se hizo SiMAR.»
  - Retrato de frente (img4), con `alt` «Francisco Javier Bojórquez Ochoa con su reconocimiento de la CONANP, en Puerto Peñasco»
  - Cita: «Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.»
  - Firma: «Francisco Javier Bojórquez Ochoa»
  - Cifra: «25 años», con «al frente del centro de acopio. Reconocimiento de la CONANP, 2025.»
  - Enlace (≥ 52 px): «Lee su historia», que lleva a `/{locale}/noticias/conanp-reconoce-25-anios-del-centro-de-acopio`
- **Pantalla 2, «La hoja que se vuelve dato» (28 palabras con datos, 23 sin ellos):**
  - Sobre la hoja en papel: «Antes, cada entrega se anotaba a mano.»
  - Cuando aparece el manifiesto digital: «Ahora es un dato que no se borra.»
  - Sólo si `stats.totalManifiestos > 0`: «Ya son {N} manifiestos así.» Es el **único** lugar de la página donde sale el total de manifiestos, con el número exacto y sin «+».
  - «Hecho con él: letra grande y pasos claros.»
- **Se va:** los 3 párrafos, «experiencia de décadas», «más de N / 5,000 reportes históricos», las cajas «2014 · Histórico desde» y «SEMARNAT · Respaldo institucional», el pie «SEMARNAT · Puerto Peñasco» (el reconocimiento es de la CONANP), «La tecnología solo sirve si…», el «Leer más» e img5.

**Movimiento y técnica:**
- **Pantalla 1, tres capas con `view()`:**
  - El retrato, al fondo, sube despacio (`translateY` +6 % → −6 %) dentro de un marco con `overflow-clip`.
  - La cita y la firma entran de lado (`reveal`, `data-direction="right"`).
  - «25 años» sale del fondo (`scale` 0.9→1 y opacidad).
- **Pantalla 2:** pista de 150svh (130svh en celular) con escenario `sticky`. Abajo va el manifiesto digital, quieto. Encima, la hoja en papel dentro de un envoltorio con `overflow-clip`: el envoltorio se corre a la izquierda (`translateX` 0 → −100 %) y la imagen de adentro a la derecha lo mismo (el patrón `n-descubre` de `globals.css`). La hoja no se mueve: sólo se descubre. En la orilla va una barra con sombra. Las dos frases se empujan como en `EscenaEquipos` (la nueva sube y saca a la anterior). Cero JS, salvo el `IntersectionObserver` de respaldo para navegadores sin `view()`.
- **Con «reducir movimiento»:** la hoja y el manifiesto lado a lado (uno debajo del otro en celular), quietos.

**Activos:** `public/assets/images/img4.jpeg` (propia, 1080×1440, ~80 KB a `sizes` 600 px). `public/assets/landing/antes-hoja.webp` (ilustración propia) y `despues-manifiesto.webp` (captura propia con datos de la demostración), ya en el repo. La nota con fuente ya existe en `lib/constants/noticias.ts`. No hay descargas.

**Esfuerzo:** M.

**Riesgo:**
- La cita no dice cuándo ni dónde la dijo: va sólo con su nombre.
- img4 es vertical: en celular se recorta con `object-position` para que la cita quede arriba del pliegue.
- La pista de 150svh no debe sentirse larga: si cansa al probarla, baja a 120svh.

**Criterios de aceptación:**
- Pantalla 1 ≤ 45 palabras y pantalla 2 ≤ 30. Cada una cabe en 1280×800 y en 375×812.
- `rg` sin coincidencias en `components/landing/actual` para `SEMARNAT · Puerto Peñasco`, `5,000`, `experiencia de décadas`, `Leer más`, `img5` y `deterior`.
- El total de manifiestos aparece una sola vez en la landing.
- El CSS de la escena no usa `clip-path` y su marco recorta con `overflow: clip`.
- «Lee su historia» responde 200 y mide ≥ 52 px.
- Con «reducir movimiento» todo queda quieto y legible.

---

### 4.4 Conciencia Azul (`#conciencia`): fusionar

**La única idea:** (se reparte) el aceite se cuenta en «Un litro» y la biodiversidad, ahora con fuente, en el mapa.

**Texto:** antes 185 palabras, una introducción y 4 tarjetas; en celular, un carrusel horizontal. Después **0 palabras propias**.
- El aceite (1 L → 1,000,000 L) se dice una sola vez, en «Un litro», con la EPA como fuente.
- La biodiversidad pasa al paso 1 del mapa, con fuente: «Ahí vive el 39 % de las especies de mamíferos marinos del planeta (UNESCO).»
- MARPOL y la economía circular salen de la landing: los cuentan la nota «MARPOL Anexo V…» de Noticias y la escena de equipos.
- **Se va:** «¿Por qué importan los datos del mar?», «Detrás de cada cifra hay un ecosistema…», las 4 tarjetas, «2,000+ especies» (sin fuente), «buques», «Desliza para ver las 4».

**Movimiento y técnica:** desaparecen 2 `NumeroAnimado`, el carrusel con `scroll-snap` y el `role="region"` con `tabIndex` que no desplazaba nada. Queda un `<span id="conciencia">` dentro de Impacto para los enlaces viejos.

**Activos:** ninguno. **Esfuerzo:** S. **Riesgo:** bajo. MARPOL queda a un clic, en la hoja de Noticias.

**Criterios de aceptación:**
- En `components/landing/actual` no quedan `AWARENESS_PANELS`, `simar-carrusel` ni `buque` (`rg -i`).
- «2,000+» no aparece.
- La cifra de especies que queda (39 %) cita a la UNESCO junto a ella.

---

### 4.5 Equivalencias → Impacto «Un litro» (`#impacto`): rehacer

**La única idea:** un litro de aceite usado puede contaminar un millón de litros de agua, y en Puerto Peñasco ya se entregaron {N} litros.

**Texto:** antes, entre equivalencias, conciencia e impacto, ≈ 430 palabras: 3 encabezados apilados, 6 tarjetas, 12 contadores y una nota de 38 palabras; 1 L = 1,000,000 L se decía 3 veces. Después **≈ 100 palabras en 5 tramos (≈ 20 por pantalla)**.

- h2 sólo para lector de pantalla: «Lo que vale un litro de aceite». Antetítulo fijo arriba de la escena: «Por qué importa».
- **Paso 1:** «Un litro de aceite usado…»
- **Paso 2:** «…puede contaminar un millón de litros de agua.» Debajo: «Es un cubo de agua de 10 metros por lado. Estimación de la EPA.» Enlace: «De dónde sale la cifra», que lleva a `/{locale}/noticias/un-litro-de-aceite-un-millon-de-litros-de-agua`.
- **Paso 3, con datos:** «En Puerto Peñasco ya se entregaron» + la cifra grande «{aceite} litros» + «de aceite usado en el centro de acopio.» **Sin datos:** «Cada litro que llega al muelle es uno menos en el mar.»
- **Paso 4, sólo con datos:** «Es el agua de {X} {albercas olímpicas} que no se contaminó.» La unidad y la cantidad salen de `equivalenciaAgua`: si no llega a una alberca, dice tinacos.
- **Franja «Lo que ya no está en el mar»** (estática, sólo con datos):
  - «{N} {camiones recolectores} llenos de basura», de `equivalenciaBasura(totalBasura)`, nunca sumada al Basurón
  - «{N} filtros de motor», la suma de `filtrosAceite + filtrosDiesel + filtrosAire`
  - «{N} árboles absorberían en un año el CO₂ que se evitó (estimado)», de `equivalenciaCO2`
- **Línea:** «Cifras al {12 de noviembre de 2026, 10:00}, hora de Puerto Peñasco.» Se calcula en el servidor (`page.tsx`) y llega como prop, para no causar error de hidratación. Al lado, el botón «¿Cómo se calculan?» (≥ 52 px) abre una ventana con `useVentanaAccesible` y los factores: 1 L de aceite = 1,000,000 L de agua (EPA) · alberca olímpica = 2,500,000 L · camión = 8,000 kg · un árbol absorbe 21 kg de CO₂ al año · 1.0 kg CO₂e por litro de aceite · 0.5 kg CO₂e por kg en el Basurón · «Son factores provisionales.»
- **Insignia:** con `MODO_DEMO`, «Datos de demostración»; con datos reales, «Con los manifiestos registrados en SiMAR»; sin datos no hay insignia, ni pasos 3 y 4, ni franja, ni línea.
- **Se va:** «Datos reales de nuestra base de datos», «¿Cuánto es cuánto?», «Equivalencias que te van a sorprender», el párrafo de introducción, las tarjetas «Filtros de motor» (con su falso «Basado en N manifiestos»), «Tiempo liberado» (25 min sin fuente) e «Historia viva» (2014), la nota de 38 palabras, los 12 contadores, toda la sección «Impacto medible» (con «2014 – 2026 · 12 años de datos ambientales preservados» y el «+»), y las constantes `ANIO_INICIO_HISTORICO`, `MINUTOS_POR_MANIFIESTO` y `buildEquivalencias`.

**Movimiento y técnica:**
- **Pista:** 300svh (240svh en celular), escenario `sticky` con `overflow-clip` y su propio `view-timeline`.
- **Versión 2D (primero, y se queda como respaldo y versión quieta):**
  - Tres capas de fotos reales (aceite de motor → gota en el agua → mar abierto) que se funden y se acercan (`scale` 1.08→1 y opacidad) con rangos `contain`.
  - Las frases suben, se quedan quietas mientras se leen y se van.
  - Las cifras **no cuentan**: llegan quietas con su frase. Nada de `setState` por cuadro.
- **Versión 3D (encima, en la capa media):**
  - Un tambo metálico de 200 L, real, llega del fondo, se inclina 25° y suelta una gota ámbar (una esfera).
  - La cámara se aleja unas 30 veces y junto al tambo aparece un cubo de agua de 10 m por lado: `MeshStandardMaterial` translúcido con las aristas claras, sin `transmission` y sin sombras reales (una sombra de contacto falsa). Opcional: una silueta humana plana de 1.7 m para dar la escala.
  - En los pasos 3 y 4 el lienzo queda quieto.
  - El avance usa el mismo resorte sin rebote de `EscenaEquipos` y sólo escucha el scroll cuando la sección está cerca. React sólo se entera al cambiar de paso.
  - Va en `components/landing/actual/escena-litro/` con `motorLitro.ts`, que copia el patrón de `motorEquipos.ts` sin tocarlo, y en `actual/escena3d/comun.ts`: crear el renderer con DPR ≤ 1.5 y `powerPreference: 'default'`, meshopt en 2 workers, `compileAsync`, subir una textura por cuadro y `liberar()` con `forceContextLoss`.
  - Se arma después de `load` y a 1 pantalla; el modelo se pide en reposo con prioridad baja. **Se libera a 1.5 pantallas** y se rearma al volver (el modelo ya está en caché). No pinta fuera de su tramo.
- **Con «reducir movimiento», si WebGL falla y mientras se arma:** se ven las fotos. Con «reducir movimiento», además, no hay pista: los pasos van uno debajo de otro.
- **Costo:** glb ≤ 700 KB bajado en reposo, unos 15–20 MB de GPU y un segundo lienzo vivo sólo en este tramo. El JS de three ya está en el chunk de la escena de equipos.

**Activos:**
- **2D:** `FOTOS.aceiteDeMotor` (SIGAUS, CC BY-SA 4.0), `FOTOS.gotaEnElAgua` (Davide Restivo, CC BY-SA 2.0) y `FOTOS.olaMarAbierto` (Austin Schmid, CC0), ya en `public/assets/noticias/fotos/`, con su crédito visible (`textoCredito`).
- **3D:** un tambo metálico de 200 L **realista con texturas PBR** (los low-poly no combinan con la laptop).
  - Dónde buscar, en orden: Poly Haven (CC0); Sketchfab con «Downloadable» y licencia CC0 o CC BY 4.0, hasta 30 k triángulos y ≤ 5 MB de origen; Poly Pizza sólo si es realista.
  - Compresión con `npx @gltf-transform/cli`: meshopt, texturas webp de 1024 px, `dedup` sin materiales y `prune`, hasta ≤ 700 KB, en `public/assets/landing/3d/modelos/tambo.glb`.
  - El crédito (título, autor, licencia, «modificado») va en el pie y en DISEÑO_SIMAR.
  - **La descarga necesita tu permiso**, con nombre, fuente y tamaño.

**Esfuerzo:** L.

**Riesgo:**
- Alto en el 3D (encontrar el modelo, su licencia, la compresión y un segundo contexto en la GPU integrada).
- Bajo en el 2D: se hace primero y funciona sola.
- **Fecha límite: sábado 14 a las 12:00.** Si para entonces el tambo no está aprobado, comprimido a ≤ 700 KB y sin trabas al medirlo, sale la versión 2D y el 3D queda para después del nacional.
- Los factores de CO₂ son provisionales y la ventana lo dice.

**Criterios de aceptación:**
- «1,000,000» / «un millón de litros» y la EPA aparecen **una sola vez** en la landing, fuera de la hoja de Noticias.
- Con datos hay 4 pasos de una frase cada uno. Con `stats` null o 0 manifiestos se ven sólo los pasos 1 y 2 y la frase de referencia, sin ningún «0» ni «—».
- Con `NEXT_PUBLIC_MODO_DEMO=1` la insignia dice «Datos de demostración». En toda la landing no queda «Datos reales».
- Toda cifra sale de `lib/utils/equivalencias.ts`: el componente no tiene factores propios y nada suma basura con Basurón.
- Sin `NumeroAnimado` en la sección. En React Profiler sólo hay commits al cambiar de paso.
- 3D: `tambo.glb` ≤ 700 KB, pedido después de `load` con prioridad baja.
- Recorriendo toda la página, `document.querySelectorAll('canvas').length` es ≤ 2 en todo momento. El motor no pinta a más de 1 pantalla.
- En Performance, con la CPU 4× más lenta, no hay tareas de más de 100 ms fuera de la creación del motor. En tu máquina, ningún cuadro pasa de 50 ms y el p95 es ≤ 20 ms.
- Con «reducir movimiento», o si WebGL falla, se ven las fotos y las frases quietas.
- «¿Cómo se calculan?»: el foco entra a la ventana, Esc cierra y el foco regresa al botón.

---

### 4.6 Impacto (la sección vieja): fusionar

**La única idea:** (se fusiona) sus cifras viven en el paso 3 de «Un litro» (aceite) y en Don Francisco (manifiestos).

**Texto:** antes 44 palabras que repetían cifras; después 0. `id="impacto"` pasa a «Un litro»; dentro de ella quedan `<span id="equivalencias">` y `<span id="conciencia">` como alias para los enlaces viejos.

**Movimiento:** se quitan 2 `NumeroAnimado` y 4 `reveal`. **Activos:** ninguno. **Esfuerzo:** S.

**Riesgo:** dejar `NAV_LINKS` en el orden real. La isla lee esas anclas.

**Criterios de aceptación:**
- Un solo `id="impacto"` en la página.
- No quedan «2014 – 2026», «12 años», «Nuestro avance» ni un «+» junto a cifras exactas.
- Al bajar toda la página, la línea de marea de la isla sólo avanza hacia la derecha.

---

### 4.7 Dónde (`#mapa`): rehacer

**La única idea:** hoy, un puerto; mañana, los que se sumen.

**Texto:** antes 85 palabras y 5 ideas («Dónde estamos, a dónde vamos.», el párrafo de escalar, una leyenda con «Expansión», fichas con coordenadas y descripciones sin fuente, «11,122 km de litoral»); después **≈ 30 palabras** más el nombre de cada puerto.

- Antetítulo: «Dónde»
- **Paso 1** (la Tierra entera gira hasta que se ve México): «El Mar de Cortés.» + «Ahí vive el 39 % de las especies de mamíferos marinos del planeta (UNESCO).»
- **Paso 2** (la cámara baja al Alto Golfo y Puerto Peñasco late dos veces): «Aquí empezó SiMAR: Puerto Peñasco.»
- **Paso 3** (la cámara se aleja a unos 3 radios y aparecen una por una las 8 marcas, con su nombre y «Puede sumarse»: Guaymas, Ensenada, La Paz, Mazatlán, Manzanillo, Acapulco, Veracruz y Progreso): «Mañana, 8 puertos más pueden sumarse.»
- Crédito: «La Tierra: NASA, Blue Marble (dominio público).»
- **Respaldo SVG** (también en el plan B): h2 «Hoy, un puerto. Mañana, los que se sumen.» · leyenda «Activo (1)» · «Puede sumarse (8)» · la ficha sólo con el nombre y el estado. En Puerto Peñasco, «Con SiMAR desde 2026»: `puertos.ts` dice hoy «desde 2024», que choca con «Nace SiMAR, 2026» de `HITOS`.
- **Se va:** «11,122 km de litoral», las coordenadas, las descripciones («Candidato prioritario…», «Puerto más antiguo…»), «Expansión» / «En expansión» (se pasan `nombreFuturos="Puede sumarse"` y `resumenFuturos="Pueden sumarse"`, que ya existen), el párrafo de escalar y el selector «Comparar mapas» en producción.

**Movimiento y técnica:**
- **El globo:** pista de 300svh (240svh en celular), escenario `sticky` con `overflow-clip`. Va en `components/landing/actual/escena-tierra/` (`EscenaTierra.tsx`, `motorTierra.ts`, `tierra.css`) y usa `escena3d/comun.ts` de «Un litro».
  - `SphereGeometry(1, 128, 64)` con una textura base de 2048×1024.
  - **Un parche de detalle de México** (lon −120 a −84, lat 12 a 34, unos 2048×1250 px a ~60 px por grado) sobre una porción de esfera un poco más alta, para que los pasos 2 y 3 se vean nítidos.
  - El terminador es suave, con un `ShaderMaterial` simple y sin sombras. La atmósfera es un halo fresnel (esfera trasera aditiva).
  - Las marcas son elementos del DOM proyectados (letra ≥ 17 px), que sólo se recalculan cuando cambia el avance y se esconden cuando quedan detrás del globo.
  - El pulso de Peñasco es CSS (`transform: scale`) y late 2 veces al llegar, no en bucle.
  - Mismo resorte y mismo ciclo de vida que «Un litro»: arma a 1 pantalla y libera a 1.5.
- **Arreglos del SVG**, que se hacen antes, en la etapa 2, y sirven en cualquier caso:
  - Cambiar los `<animate>` SMIL por una clase CSS que respete «reducir movimiento».
  - Quitar `backdrop-blur` de la leyenda (ya tiene fondo `#06121E` al 85 %).
  - Rutas que se trazan una sola vez, no `mapa-flujo` sin fin.
  - Elegir puerto con clic o foco, no con `onMouseEnter`.
  - Botones de puerto de ≥ 52 px (≥ 44 px en celular).
  - El selector «Comparar mapas» sólo con `process.env.NODE_ENV === 'development'`.
- **Plan B** (si «Un litro» no estaba cerrada el sábado 14 a las 12:00): no se hace el globo. Sobre la silueta SVG van tres capas a distinta velocidad con `view()`: la retícula al fondo, lenta; México en medio; las rutas al frente, que se trazan una vez atadas al scroll.
- **Con «reducir movimiento», si WebGL falla y mientras se arma:** la silueta SVG corregida, quieta.

**Activos:**
- Textura de la Tierra **Blue Marble Next Generation**, de la NASA (dominio público; crédito «NASA Visible Earth» o «NASA GIBS»). Camino preferido: pedirla ya recortada al tamaño exacto al servicio GIBS de la NASA, con un WMS `GetMap` en EPSG:4326. Así se bajan dos archivos chicos (la base mundial de 2048×1024 y el recorte de México de ~2048×1250) y no hay que abrir en tu máquina un archivo de 21,600 px (un mosaico de 21,600×21,600 sin comprimir pesa ~1.4 GB de RAM).
- El lector verifica la URL exacta, la capa y el tamaño. **La descarga necesita tu permiso.**
- Conversión a WebP q70 con `sharp`, que ya está en `node_modules`: base ~300–400 KB y parche ~400–600 KB, en `public/assets/landing/3d/tierra/`.
- La silueta y los vecinos ya están (Natural Earth, dominio público).

**Esfuerzo:** L (el globo) + S (los arreglos del SVG).

**Riesgo:**
- Es lo más arriesgado del plan; por eso va después de «Un litro», reutiliza su base y tiene plan B.
- `MapaSilueta` y `SeccionMapaPuertos` también los usan la landing nueva y la 3D. Los arreglos son compatibles, pero se verifican las 3.
- Las coordenadas de `puertos.ts` son aproximadas: no se enseñan.

**Criterios de aceptación:**
- Cada paso tiene ≤ 15 palabras. No aparecen «11122», «11,122», coordenadas, «expansión» ni «desde 2024».
- `rg '<animate' components/landing/mapa` da 0. El CSS del mapa no tiene animaciones `infinite`. `SeccionMapaPuertos` no usa `backdrop-blur`.
- Ningún `onMouseEnter` elige un puerto. Los botones de puerto miden ≥ 52 px.
- Con `next start` y `?mapa=globo`, el selector no aparece.
- Las texturas se piden después de `load`. Nunca hay más de 2 lienzos vivos.
- En el paso 2, la marca de Peñasco cae a ±20 px de su lugar en la costa.
- El crédito de la NASA se ve en la escena y en el pie.
- Se abren `?landing=nueva` y `?landing=3d` y su mapa sigue bien.

---

### 4.8 Llamado final → Tres puertas (`#participa`): rehacer

**La única idea:** elige por dónde seguir: recibir el correo, leer o probar SiMAR.

**Texto:** antes 24 palabras y un solo botón, «Iniciar sesión», que ya salía en la isla y en la portada con otros nombres; después **≈ 48 palabras**.

- El símbolo de SiMAR, que vuelve desde la portada.
- h2: «Cada dato cuenta. Cada mar lo agradece.» (se queda)
- Línea: «Elige por dónde seguir.»
- **Puerta 1** (ícono de sobre): «Recibe el correo del mes» · «Lo nuevo del puerto, una vez al mes.» Lleva a `#correo-del-mes`.
- **Puerta 2** (ícono de periódico): «Lee las Noticias del Mar» · «Notas, cifras y mapas, con sus fuentes.» Lleva a `/{locale}/noticias`.
- **Puerta 3:** «Prueba SiMAR» · «Con tu cuenta o sin registrarte.» Tiene dos botones: «Iniciar sesión» (abre el acceso) y «Probar la demostración» (`rutaDemo`). Con `MODO_DEMO`, sólo «Probar la demostración»; sin `rutaDemo`, sólo «Iniciar sesión».
- **Nombres unificados en toda la página:** «Iniciar sesión» y «Probar la demostración». Sólo la isla en celular puede abreviar a «Probar la demo» por espacio.
- **Se va:** «Accede a la plataforma y sé parte del cambio…».

**Movimiento y técnica:**
- El fondo `simar-abismo` continúa el final del mapa; una ola lo separa (ya no es una franja con un `border-t` de 1 px).
- El símbolo entra con `view()`: `rotate(−50°→0)`, `scale(.84→1)` y opacidad, sin blur. Las dos curvas se trazan una vez.
- Dos capas de ola suben a distinta velocidad (−24 px y −56 px).
- Las puertas entran con `reveal` escalonado y conservan `data-vidrio`.
- Sin Motion. Costo casi cero. Con «reducir movimiento», todo en su lugar.

**Activos:** `simbolo-grande.png`, `OlaSeparador` y los íconos de lucide (`Mail`, `Newspaper`, `PlayCircle`), ya en el repo. En `NoticiasPortada.tsx` hay que envolver `<CorreoMensual>` con `id="correo-del-mes"` (una línea, cuando termine el trabajo del correo).

**Esfuerzo:** S. **Riesgo:** bajo; depende del `id` del correo.

**Criterios de aceptación:**
- Cada puerta completa es el enlace, con ≥ 52 px de alto (≥ 54 en celular) y letra ≥ 17 px.
- `rg "Acceder a la plataforma|sé parte del cambio"` da 0 en `components/landing/actual`.
- La puerta 1 llega al bloque del correo, `/es/noticias` responde 200 y la puerta 3 abre el acceso.
- Las animaciones sólo usan `transform`/`opacity`. Con «reducir movimiento» nada se mueve.
- No se importa `motion/react` en la landing Actual.

---

### 4.9 Pie: rehacer

**La única idea:** quién lo hizo, a dónde ir después y de quién es cada imagen.

**Texto:** antes 52 palabras sin ningún enlace, los créditos 3D en una oración de 14 px y las instituciones sólo como texto; después ≈ 70 palabras (casi todas son enlaces) más los créditos cerrados.

- **Banda «Hecho en Puerto Peñasco»** (`id="proyecto"`; ver 4.2) + «SiMAR: Sistema Integral de Manejo Ambiental de Residuos.»
- **Explorar:** Cómo funciona · Noticias del Mar · Impacto · Don Francisco · Puertos · Hecho en Puerto Peñasco
- **Participar:** Recibe el correo del mes · Probar la demostración · Registra tu empresa recolectora (`abrirAcceso('recolector')`, como en la landing 3D) · Iniciar sesión
- **Fuentes:** Glosario (`/es/noticias#glosario`) · Fuentes (`/es/noticias#fuentes`) · ¿Cómo se calculan las cifras? (la misma ventana de «Un litro»)
- **«Créditos de imágenes y modelos»** (`<details>` cerrado, una línea por recurso, desde una constante `CREDITOS` en `actual/creditos.ts`):
  - Laptop: «macbook pro M3 16 inch 2024», jackbaeten, CC BY 4.0, modificado
  - Celular: «Apple iPhone 15 Pro Max Black», Polyman_3D, CC BY 4.0, modificado
  - Tambo: {título}, {autor}, {licencia}, modificado (si entra)
  - La Tierra: NASA, Blue Marble (dominio público) (si entra)
  - Flota de Puerto Peñasco: David Noll, CC BY-SA 2.0 (adaptada)
  - Fotos de «Un litro»: SIGAUS (CC BY-SA 4.0), Davide Restivo (CC BY-SA 2.0), Austin Schmid (CC0)
  - Contorno de México: Natural Earth (dominio público)
- Última línea: «© 2026 SiMAR · DCK / ITSPP» y, en el mismo renglón y discreto, «Acceso desarrollador».

**Movimiento:** ninguno; sólo `transition-colors`. `<details>` nativo, sin JS.

**Activos:** logos y créditos que ya están (`lib/constants/fotos.ts` trae autor y licencia de cada foto). **Esfuerzo:** S.

**Riesgo:** bajo. «Acceso desarrollador» se queda porque el equipo lo usa; si prefieres que no lo vea el jurado, se quita en una línea (el superadmin entra por `/es/superadmin`).

**Criterios de aceptación:**
- Los enlaces del pie miden ≥ 52 px de alto con letra ≥ 17 px; los créditos, ≥ 15 px. La excepción a propósito es «Acceso desarrollador».
- Cada recurso de terceros de la landing tiene su línea en «Créditos».
- Los enlaces de «Explorar» siguen el orden real y todos llevan a un `id` que existe.

---

## 5. Etapas y fechas

| Etapa | Cuándo | Qué | Al terminar |
|---|---|---|---|
| **0. Base** | Mié 11, tarde y noche (cuando termine el correo mensual) | Separar `VariantCinematic` en un archivo por sección sin cambiar nada visible. Buscar los activos y verificar sus licencias. Medir la línea base | La página se ve igual; tienes una lista de descargas para aprobar en un solo mensaje |
| **1. Una cosa por pantalla** | Jue 12 | Portada, Don Francisco (las 2 pantallas), Tres puertas, Pie con «Hecho en Puerto Peñasco», quitar Proyecto, Conciencia e Impacto, nuevo orden, `NAV_LINKS`, nombres unificados, arreglo provisional de Equivalencias (sin las 3 tarjetas falsas ni «Datos reales») | **La landing ya se puede publicar**, aunque fallara todo lo demás |
| **2. «Un litro»** | Vie 13 y sáb 14 hasta las 12:00 | La versión 2D completa (vie), el tambo 3D (vie noche y sáb) y los arreglos del mapa SVG | **Puerta del sábado a las 12:00:** ¿el tambo entra o se queda la 2D? ¿Hay globo o plan B? |
| **3. Dónde** | Sáb 14 por la tarde y dom 15 | El globo de la Tierra (o el plan B CSS sobre el SVG) | El recorrido completo, con ≤ 2 lienzos |
| **4. Pulir y medir** | Lun 16 | Revisión de accesibilidad y textos, arreglos, limpieza de CSS muerta en `globals.css`, `next build` + `next start`, medición, DISEÑO_SIMAR §8.3/§8.7 y CLAUDE.md | Listo para congelar |
| **Congelado** | Mar 17 | Sólo se corrigen errores | Commit y push sólo si lo pides |
| **Ensayo** | 18 al 23 | Probar en la laptop de la presentación, con y sin red. Producción sólo si lo pides | — |

**Después del nacional (desde el 25-nov):** la panga 3D que llega al muelle (quizá como primera toma de la escena de equipos); el globo, si no entró; guardar correos y mandar el correo del mes (tabla de suscriptores y envío); «Este mes en el puerto» (necesita una RPC nueva en Supabase); validar los factores de CO₂; decidir sobre «Acceso desarrollador»; inglés; llevar lo que sirva a las landings nueva y 3D.

---

## 6. Despliegue de agentes en tu máquina

**Tu máquina:** Ryzen 5 5500U (6 núcleos / 12 hilos), 7.4 GB de RAM con ~1.5 GB libres, gráficos integrados, Windows 11 y 150 GB libres en disco.

**La idea clave:** los agentes piensan en la nube y casi no gastan RAM. **Lo que gasta son los procesos que corren en tu máquina.** Por eso puede haber varios agentes, pero un solo proceso pesado a la vez.

| Proceso local | RAM aprox. | Quién lo corre | Cuándo |
|---|---|---|---|
| Agente que lee o escribe archivos | ~0 | Cualquiera | Siempre |
| `npx tsc --noEmit` | 0.5–1 GB | Sólo la integradora | Al cerrar cada tanda |
| `npx eslint <archivos tocados>` | 0.5–1 GB | Sólo la integradora | Después de tsc, nunca a la vez |
| `next dev` (Turbopack) + panel del navegador | 2–4 GB | Sólo la integradora | En una ventana de verificación de 30–45 min; luego se apaga |
| `next build` | 2–3 GB (más sus workers) | Sólo la integradora | Etapa 0 (línea base) y etapa 4 |
| `next start` | 0.3–0.6 GB | Sólo la integradora | Para medir |
| `npx @gltf-transform/cli` | 0.3–0.5 GB | Sólo la integradora | Etapa 2, con el servidor apagado |
| `sharp` (texturas) | 0.2–0.5 GB | Sólo la integradora | Etapa 3, con el servidor apagado |

### Reglas

1. **Un solo proceso pesado a la vez** (tsc, eslint, dev, build, start, gltf-transform o sharp), y siempre lo corre la sesión principal (la «integradora»).
2. **El servidor apagado mientras los agentes escriben.** Con `next dev` encendido, cada archivo guardado hace recompilar a Turbopack y la RAM y la CPU se disparan.
3. **Los escritores no corren `npm`, `npx`, `next` ni el navegador.** Sólo leen y editan sus archivos.
4. **Cada archivo tiene un solo dueño por etapa.** `VariantCinematic.tsx` (que queda como cascarón), `app/[locale]/page.tsx`, `NoticiasPortada.tsx` y la documentación son de la integradora. `app/globals.css` tiene un solo dueño por etapa. El CSS nuevo va en un archivo propio por sección (`actual/portada.css`, `don-francisco.css`, `un-litro.css`, `cierre.css`, `tierra.css`, `mapa.css`), importado por su componente (como ya se hace con `maplibre-gl.css`), con prefijo propio y tokens `var(--simar-*)`.
5. **No se crean worktrees nuevos.** Todos trabajan en este (`landing-page-redesign-0171ec`). Cada worktree nuevo necesita su propio `node_modules` (un `npm install` de varios minutos y más de 1 GB de RAM) y su propio servidor, y en worktrees Turbopack ya dio 404 tras reiniciar. **El único caso en que convendría uno:** un experimento largo después del nacional (la panga 3D), que no necesite servidor mientras corre lo demás.
6. **Antes de encender `next dev` o `next build`, medir la RAM libre** con `[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,1)` (GB). Para `dev` hacen falta ≥ 3 GB libres; para `build`, ≥ 3.5 GB con el navegador y el servidor cerrados. Si no alcanza, cierra pestañas de Chrome y apps pesadas. Si Windows empieza a usar el disco como memoria, todo funciona pero lento y **las mediciones de rendimiento no valen**.
7. **Revisar que no haya otro servidor encendido** (el tuyo en :3000 o el del correo) con `preview_list` antes de abrir uno. Si sale un 404 después de reiniciar o el CSS no recompila: apagar y borrar `.next`.
8. **Con el panel del navegador oculto no corre `IntersectionObserver`:** para probar las escenas, el panel debe estar a la vista o hay que tomar capturas mientras se baja.
9. **Las descargas** (tambo y texturas) van a una carpeta nueva y vacía fuera del repo, sólo con tu permiso (un solo mensaje con nombre, fuente, licencia y tamaño), y se procesan con un script que vive en otra carpeta.

### Reparto por etapa

| Etapa | A la vez | Lectores (nube) | Escritores (dueños de) | Procesos locales (en serie) |
|---|---|---|---|---|
| 0 | 2 | **L1:** activos. 3 candidatos de tambo realista (URL, autor, licencia, triángulos, tamaño); la URL y la capa de GIBS o Visible Earth para la base y el recorte de México; confirmar en Commons los créditos de la flota y de las fotos de «Un litro». No descarga nada | **S (solo):** mover cada sección a `components/landing/actual/` (`Portada.tsx`, `DonFrancisco.tsx`, `Conciencia.tsx`, `Equivalencias.tsx`, `Impacto.tsx`, `Mapa.tsx`, `TresPuertas.tsx`, `PieActual.tsx`, `comun.tsx` con `TextoEnfoca`) sin cambiar textos ni clases. El carrusel queda en su propio componente | Capturas «antes» → tsc → eslint → `next build` + `next start` (la línea base: LCP, KB de JS inicial, fotos al abrir, p95 de cuadros) → capturas «después», que deben ser iguales → apagar |
| 1 | 3 escritores + 1 lector al final | **R1:** revisa el diff contra DISEÑO_SIMAR y la honestidad de las cifras | **A:** portada. **B:** Don Francisco. **C:** tres puertas, pie y arreglo de Equivalencias (ver el ejemplo abajo) | tsc → eslint → `next dev` (1280×800, 375×812, claro y oscuro, «reducir movimiento») → apagar |
| 2 | 3 escritores + 1 lector | **R2:** las cifras salen sólo de `equivalencias.ts`, nada suma basura con Basurón, sin datos y con `MODO_DEMO` | **A:** `actual/escena3d/comun.ts`, `actual/escena-litro/motorLitro.ts`. **B:** `actual/UnLitro.tsx`, `actual/un-litro.css` (pista, frases, fotos 2D, franja, insignia, ventana; debe funcionar sola el viernes). **C:** `mapa/MapaSilueta.tsx`, `mapa/SeccionMapaPuertos.tsx`, `mapa/puertos.ts`, `mapa/mapa.css` (arreglos del SVG) | Descarga aprobada → `gltf-transform` (servidor apagado) → tsc → eslint → `next dev`: contar lienzos, Performance con la CPU 4× más lenta, `stats` null y `MODO_DEMO` → apagar |
| 3 | 2 escritores | — | **A:** `actual/escena-tierra/*` y `actual/Mapa.tsx` (o, en el plan B, las capas CSS en `mapa.css`). **B:** pulido de lo que encontraron R1 y R2, en archivos que A no toca | Descarga aprobada → script de `sharp` (servidor apagado) → tsc → eslint → `next dev`: recorrido completo con ≤ 2 lienzos → apagar |
| 4 | 2 lectores, luego 2 escritores | **R3:** accesibilidad y DISEÑO_SIMAR. **R4:** textos (palabras por pantalla, repeticiones, fuentes, nombres) | **E1** y **E2** arreglan lo encontrado, cada uno en archivos distintos. Un único dueño de `globals.css` borra el CSS muerto (`simar-hero-tinte`, `simar-avance`, `vidrio-destello` si ya no se usa, `simar-carrusel`, `mapa-flujo`). La integradora escribe DISEÑO_SIMAR §8.3 y §8.7 y CLAUDE.md (three.js también en `actual/escena-litro` y `actual/escena-tierra`; la carpeta `actual/`) | Cerrar todo → `next build` → `next start` → Lighthouse móvil y escritorio, recorrido con Performance, las 3 landings → apagar. Arreglos → repetir **una sola vez** |

### Ejemplo de reparto: la etapa 1 (jueves 12)

Antes de lanzar a los escritores, la integradora fija los props para que nadie adivine:
- `Portada({ fechasNotas, rutaDemo, alProbar })`
- `DonFrancisco({ totalManifiestos, locale })`
- `TresPuertas({ alEntrar, rutaDemo, locale })`
- `PieActual({ locale, alEntrar, alRegistrarEmpresa, alAccesoDesarrollador, rutaDemo, creditos })`

| Agente | Tipo | Archivos de los que es dueño | Encargo en una línea | No toca | Corre algo local |
|---|---|---|---|---|---|
| Integradora (sesión principal) | Escribe y verifica | `VariantCinematic.tsx` (cascarón), `app/[locale]/page.tsx`, `NoticiasPortada.tsx` (sólo el `id="correo-del-mes"`), DISEÑO_SIMAR §8.3 (excepción de capas) | Nuevo orden, `NAV_LINKS`, nombres en la isla, quitar Proyecto/Conciencia/Impacto, pasar `fechasNotas` y `actualizado` (hora del puerto) desde el servidor, el selector del mapa sólo en desarrollo | `actual/*` de los demás | **Sí**: tsc → eslint → `next dev`, uno a la vez y al final |
| A: Portada | Escribe | `actual/Portada.tsx`, `app/globals.css` (sólo el bloque del inicio, ~l.1625–1729 y 926–934) | Una pantalla sobre la flota en 3 capas, sin carrusel, tinte, píldora ni blur; insignia «N nuevas» | Todo lo demás | No |
| B: Don Francisco | Escribe | `actual/DonFrancisco.tsx`, `actual/HojaDato.tsx`, `actual/don-francisco.css` | Retrato con cita y «25 años» (CONANP); la hoja que se vuelve dato con dos `translate`; «Ya son N manifiestos así» | `globals.css`, `ComparadorHojas` | No |
| C: Cierre y pie | Escribe | `actual/TresPuertas.tsx`, `actual/PieActual.tsx`, `actual/cierre.css`, `actual/creditos.ts`, `actual/Equivalencias.tsx` (arreglo provisional) | Tres puertas; pie con la banda, columnas y créditos; en Equivalencias, quitar «Filtros/Tiempo/Historia», «Datos reales» y los ceros | `globals.css`, el mapa | No |
| R1: Revisor | Lee | — (lee todo el diff al final) | ≥ 17 px, ≥ 52 px, tokens, sin blur animado, `overflow-clip`, «reducir movimiento», sin «buque», cifras honestas | — | No |

**Resultado en tu máquina ese día:** durante 4–5 horas, 0 procesos (sólo ediciones); después, unos 15 minutos de tsc y eslint de uno en uno y una ventana de 30–45 minutos con `next dev` y el panel. El pico es de unos 3–4 GB, y una sola vez.

---

## 7. Riesgos y cómo evitarlos

| Riesgo | Cómo se evita |
|---|---|
| No alcanza el tiempo para dos escenas 3D | La etapa 1 deja la landing publicable. «Un litro» se hace primero en 2D. La puerta del sábado a las 12:00 decide el tambo y el globo; el plan B del mapa es CSS |
| Varios lienzos WebGL en la GPU integrada | ≤ 2 vivos y uno pintando. Los motores nuevos se liberan a 1.5 pantallas y Don Francisco separa los dos nuevos. Se cuentan los `canvas` en todo el recorrido |
| No aparece un tambo realista con licencia libre | Tres candidatos desde la etapa 0 y una búsqueda en orden (Poly Haven → Sketchfab CC0/CC BY → Poly Pizza realista). Si no hay, queda la versión 2D con fotos reales y todo lo demás sale igual |
| Archivos de la NASA enormes | Pedir a GIBS el recorte al tamaño exacto. Nunca abrir mosaicos de 21,600 px en tu máquina |
| Sin RAM a media verificación | Un proceso a la vez, medir la RAM antes, servidor apagado mientras se escribe, build sólo con todo cerrado |
| Agentes que se pisan | Primero se separa el archivo. Un dueño por archivo. `globals.css` con un solo dueño por etapa. Props fijados antes |
| El mapa es compartido con otras 2 landings | Cambios compatibles y verificación de `?landing=nueva` y `?landing=3d` |
| Cifras que el jurado puede cuestionar | Cada cifra una vez y con su fuente. «Datos de demostración» en la demo. Sin ceros. Fuera «2014 – 2026», «más de 5,000» y «+». Factores provisionales declarados |
| Licencias CC BY / CC BY-SA | Una lista `CREDITOS`, «(adaptada)» en las CC BY-SA y el crédito visible junto a cada foto |
| «Reducir movimiento» no detiene lo atado al scroll | Cada CSS nuevo pone sus animaciones en `@media (prefers-reduced-motion: no-preference)` |
| Safari < 26 o Firefox sin `view()` | Todo se ve quieto y legible; `reveal` con `IntersectionObserver` |
| Error de hidratación por la fecha | La fecha se calcula en el servidor con la hora del puerto |
| Pistas largas que cansan | Pistas cortas (portada 100svh, hoja 150, «Un litro» 300, mapa 300) y más cortas en celular; se ajustan al probarlas |
| LCP o JS inicial que empeoran | Una sola imagen con `fetchPriority="high"`; three.js con `await import()`; se compara contra la línea base |
| Turbopack en el worktree (404, CSS que no recompila) | Apagar y borrar `.next` |
| Tocar producción por error | No hay commit ni push sin que lo pidas; `main` y Vercel no se tocan |

---

## 8. Fuera de alcance

- Guardar correos y mandar el correo del mes de verdad: el bloque sigue siendo sólo diseño.
- «Este mes en el puerto» (cifras por mes): necesita una RPC o migración nueva en Supabase.
- La panga 3D que llega al muelle.
- El globo y el tambo 3D, si no pasan la puerta del sábado 14 a las 12:00.
- Cambios a `EscenaEquipos` y `motorEquipos`, a la isla (salvo sus textos y su lista de secciones), a la hoja «Noticias del Mar» (salvo el `id` del correo) y a la página `/noticias`.
- Un motor WebGL compartido entre escenas.
- Las landings nueva y 3D (sólo heredan los arreglos compatibles del mapa) y las variantes MapLibre `?mapa=globo|red`.
- MapLibre o teselas de la NASA en vivo (dependen de la red el día de la presentación).
- Validar o agregar factores de CO₂ en `lib/constants/impacto.ts`.
- Traducir la landing al inglés.
- Worktrees nuevos y dos procesos de Node a la vez.
- Producción (`main` en Vercel) y la base de DCK.
