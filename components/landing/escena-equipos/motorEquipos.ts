import {
    ACESFilmicToneMapping,
    Box3,
    CanvasTexture,
    DirectionalLight,
    Group,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
    type Material,
    type Object3D,
    type Texture,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Motor de la escena «Así funciona SiMAR» de la landing: una laptop y un celular realistas
 * (modelos CC BY 4.0 de Sketchfab, sin logotipos; ver el crédito en el pie de la landing) con las
 * pantallas reales de la demostración. `pintar(p)` coloca todo según el avance del scroll (0 a 1)
 * y dibuja un cuadro; no hay bucle propio: la sección llama a `pintar` cuando cambia el avance.
 *
 *  0.00–0.42  la laptop cerrada (un poco en el aire) gira hacia el frente, baja y se abre en el Panel
 *  0.49–0.56  el manifiesto entra deslizándose · 0.63–0.70 Estadísticas · 0.81–0.88 el portal
 *  0.78–0.97  la laptop se hace a un lado y se vuelve hacia el celular
 *  0.82–1.00  el celular llega desde la derecha, un poco en el aire, y se asienta junto a ella
 *
 * Encuadre: cada toma dice desde dónde se mira y qué se enseña; la distancia y el centrado se
 * calculan para la pantalla (`medir`): todo cabe entre el título de arriba y los puntos de abajo, en
 * cualquier ancho. En pantallas angostas (celular de pie) la toma final los apila: la laptop atrás y
 * el celular delante, visto desde más arriba para que quede debajo de ella.
 * Las posiciones finales dejan aire entre los dos equipos: nunca se tocan.
 *
 * Sombras: la huella de cada equipo difuminada sobre el piso (una de contacto, nítida, y una
 * ambiental, suave); se aclaran y se abren cuando el equipo está en el aire. La tapa abierta deja
 * una sombra tenue detrás.
 *
 * Para que no se trabe (ni al cargar ni al bajar):
 *  - los modelos vienen con las piezas de cada parte unidas por material y la geometría
 *    simplificada (≈ 90 llamadas de dibujo en vez de ≈ 150) y se descomprimen en workers;
 *  - la preparación va en pedazos, cada uno en un rato libre del navegador (`ceder`): leer cada
 *    modelo, crear el contexto WebGL, el cuarto de los reflejos, cada captura, las sombras… Así,
 *    aunque se arme mientras se ve la portada, nunca hay un bloque largo en el hilo principal;
 *  - los .glb pueden llegar ya pedidos (`modelos`): la descarga empieza antes que three.js;
 *  - los shaders se compilan en segundo plano (compileAsync), las texturas suben a la GPU de a una
 *    por rato libre y se dibuja un cuadro de prueba fuera de la página (sube la geometría) antes de
 *    enseñar la escena: el primer cuadro visible no compila ni sube nada;
 *  - cada captura de la laptop sube una sola vez; el cambio de pantalla lo hace un shader que las
 *    desliza (antes se redibujaba un lienzo de 1600 × 1035 y se volvía a subir en cada cuadro);
 *  - la resolución se limita a 1.5× (1.25× en celulares y equipos modestos: `densidadMax`) y no se
 *    pide la GPU de alto rendimiento (en laptops con dos tarjetas, el cambio se notaba como tirón).
 */

export interface MotorEquipos {
    pintar: (p: number) => void;
    medir: () => void;
    liberar: () => void;
}

export interface OpcionesMotor {
    laptop: string;
    celular: string;
    /** Capturas de la laptop, en orden: Panel, manifiesto, Estadísticas, portal */
    pantallas: string[];
    capturaCelular: string;
    /** Los .glb ya pedidos (la descarga empieza antes de bajar three.js); si no, se piden aquí */
    modelos?: { laptop: Promise<ArrayBuffer>; celular: Promise<ArrayBuffer> };
    /** Densidad de píxeles máxima del lienzo (1.5 por omisión) */
    densidadMax?: number;
}

/** Lo que ocupa la página sobre el lienzo (px): arriba el título del paso, abajo los puntos */
export type Reserva = () => { arriba: number; abajo: number };

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const rampa = (p: number, a: number, b: number) => limitar((p - a) / (b - a));
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mezclar = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frena al llegar: para lo que se asienta (el celular al posarse) */
const frenar = (t: number) => 1 - Math.pow(1 - t, 3);
/**
 * Espera un rato libre del navegador (requestIdleCallback; a lo más 200 ms) antes del siguiente
 * pedazo pesado: entre pedazo y pedazo la página pinta sus cuadros y atiende el scroll
 */
const ceder = () =>
    new Promise<void>((listo) => {
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => listo(), { timeout: 200 });
        else window.setTimeout(listo, 32);
    });

/** Pide un archivo completo como ArrayBuffer (los .glb) */
function pedirArchivo(url: string, senal?: AbortSignal): Promise<ArrayBuffer> {
    return fetch(url, { signal: senal }).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.arrayBuffer();
    });
}

/** La carpeta de un archivo (para lo que el .glb pudiera traer aparte) */
const carpetaDe = (url: string) => url.slice(0, url.lastIndexOf('/') + 1);

// La geometría se descomprime en dos workers, fuera del hilo principal (una vez por página)
let decodificadorListo = false;
function prepararDecodificador() {
    if (decodificadorListo) return;
    decodificadorListo = true;
    // (por variable: el nombre empieza con «use» y el lint lo confunde con un gancho de React)
    const conWorkers = (MeshoptDecoder as { useWorkers?: (cuantos: number) => void }).useWorkers;
    conWorkers?.call(MeshoptDecoder, 2);
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img.decode().then(() => img);
}

type Componer = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void;

/** La captura cubre la pantalla, pegada arriba (lo importante de cada pantalla está arriba) */
const cubrir: Componer = (ctx, img, w, h) => {
    const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * escala;
    ctx.drawImage(img, (w - dw) / 2, 0, dw, img.naturalHeight * escala);
};

function rectanguloRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}

/**
 * La pantalla del celular como en un teléfono de verdad: arriba la barra de estado (hora, señal y
 * batería, a los lados de la isla de la cámara, que así no tapa la app), la captura completa en
 * medio y la barra de inicio abajo.
 */
function componerTelefono(fondo: string): Componer {
    return (ctx, img, w, h) => {
        ctx.fillStyle = fondo;
        ctx.fillRect(0, 0, w, h);
        const barra = Math.round(h * 0.066);
        const pie = Math.round(h * 0.028);
        const tinta = '#0B2236';
        const medio = barra * 0.56;
        ctx.fillStyle = tinta;
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.round(barra * 0.36)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.fillText('10:30', w * 0.11, medio);
        // Señal: cuatro barras que crecen
        const u = barra * 0.07;
        const xs = w * 0.665;
        for (let i = 0; i < 4; i++) {
            const alto = u * (1.6 + i * 0.9);
            rectanguloRedondo(ctx, xs + i * u * 1.6, medio + u * 2.2 - alto, u * 1.05, alto, u * 0.35);
        }
        // Batería: contorno, carga y el botoncito
        const bx = w * 0.79;
        const bw = u * 7.2;
        const bh = u * 3.6;
        ctx.strokeStyle = tinta;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = u * 0.55;
        ctx.beginPath();
        ctx.roundRect(bx, medio - bh / 2, bw, bh, u * 1.1);
        ctx.stroke();
        rectanguloRedondo(ctx, bx + bw + u * 0.5, medio - u * 0.8, u * 0.7, u * 1.6, u * 0.3);
        ctx.globalAlpha = 1;
        rectanguloRedondo(ctx, bx + u * 0.75, medio - bh / 2 + u * 0.75, (bw - u * 1.5) * 0.8, bh - u * 1.5, u * 0.6);
        // La app, completa, entre las dos barras
        const disponible = h - barra - pie;
        const escala = Math.min(w / img.naturalWidth, disponible / img.naturalHeight);
        const dw = img.naturalWidth * escala;
        ctx.drawImage(img, (w - dw) / 2, barra, dw, img.naturalHeight * escala);
        // Barra de inicio
        rectanguloRedondo(ctx, w * 0.34, h - pie * 0.55, w * 0.32, Math.max(5, h * 0.0045), h * 0.003);
    };
}

/** Una captura compuesta UNA vez en un lienzo del tamaño de la pantalla, como textura */
function texturaDeCaptura(img: HTMLImageElement, w: number, h: number, anisotropia: number, componer: Componer = cubrir) {
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    componer(ctx, img, w, h);
    const textura = new CanvasTexture(lienzo);
    textura.colorSpace = SRGBColorSpace;
    // Así vienen las UV de las pantallas de estos modelos
    textura.flipY = true;
    textura.anisotropy = anisotropia;
    return textura;
}

/**
 * La pantalla de la laptop: dos capturas y el avance del cambio. La nueva entra desde la derecha y
 * empuja a la anterior (que se va más lento y se oscurece, con una sombra en la orilla de la que
 * entra), como al navegar en la app. Todo en el shader: al cambiar, sólo cambian tres uniformes.
 */
function materialPantalla() {
    return new ShaderMaterial({
        name: 'pantalla',
        toneMapped: false,
        uniforms: {
            mapaA: { value: null as Texture | null },
            mapaB: { value: null as Texture | null },
            avance: { value: 0 },
        },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D mapaA;
            uniform sampler2D mapaB;
            uniform float avance;
            varying vec2 vUv;
            // #0B2236 (la tinta de SiMAR) en lineal
            const vec3 TINTA = vec3(0.0037, 0.0123, 0.0368);
            void main() {
                float borde = 1.0 - avance;
                vec4 color;
                if (avance > 0.0005 && vUv.x >= borde) {
                    color = texture2D(mapaB, vec2(vUv.x - borde, vUv.y));
                } else {
                    color = texture2D(mapaA, vec2(vUv.x + avance * 0.3, vUv.y));
                    float velo = 0.22 * avance;
                    float sombra = avance > 0.0005 ? smoothstep(borde - 0.03, borde, vUv.x) * 0.22 : 0.0;
                    color.rgb = mix(color.rgb, TINTA, velo + sombra * (1.0 - velo));
                }
                gl_FragColor = vec4(color.rgb, 1.0);
                #include <colorspace_fragment>
            }`,
    });
}

/**
 * Una sombra sobre el piso: la huella del equipo (un rectángulo redondeado de `ancho` × `fondo`)
 * difuminada `desenfoque` unidades, dibujada una vez en un lienzo. Antes era un degradado redondo y
 * grande que, visto casi de lado, se volvía una franja gris de orilla a orilla de la pantalla.
 * El difuminado es la sombra del 2D (shadowBlur), que funciona en todos los navegadores: la figura
 * se dibuja fuera del lienzo y sólo entra su sombra. El plano no escribe profundidad.
 */
function crearHuella(ancho: number, fondo: number, radio: number, desenfoque: number, opacidad: number) {
    const margen = desenfoque * 2.6;
    const anchoP = ancho + margen * 2;
    const fondoP = fondo + margen * 2;
    const escala = 384 / Math.max(anchoP, fondoP);
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(8, Math.ceil(anchoP * escala));
    lienzo.height = Math.max(8, Math.ceil(fondoP * escala));
    const ctx = lienzo.getContext('2d')!;
    const fuera = lienzo.width + 64;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = desenfoque * escala * 2;
    ctx.shadowOffsetX = fuera;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(margen * escala - fuera, margen * escala, ancho * escala, fondo * escala, Math.min(radio, ancho / 2, fondo / 2) * escala);
    ctx.fill();
    const malla = new Mesh(
        new PlaneGeometry(anchoP, fondoP),
        new MeshBasicMaterial({ map: new CanvasTexture(lienzo), color: 0x000000, transparent: true, depthWrite: false, opacity: opacidad, toneMapped: false })
    );
    malla.rotation.x = -Math.PI / 2;
    return malla;
}

const opacidadDe = (malla: Mesh) => malla.material as MeshBasicMaterial;

/** Pone `material` en la malla de la pantalla (la del material «pantalla»). Sin luz ni reflejos:
 *  el reflejo del cuarto sobre el vidrio deslavaba la captura casi a blanco */
function encenderPantalla(raiz: Object3D, material: Material): Mesh | null {
    let malla: Mesh | null = null;
    raiz.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || Array.isArray(m.material) || m.material.name !== 'pantalla') return;
        m.material.dispose();
        m.material = material;
        malla = m;
    });
    return malla;
}

/** Escala el modelo para que su medida mayor en el piso sea `medida` y lo deja centrado sobre y = 0 */
function asentar(envoltura: Group, medida: number, eje: 'ancho' | 'alto') {
    envoltura.updateMatrixWorld(true);
    let caja = new Box3().setFromObject(envoltura);
    const tam = caja.getSize(new Vector3());
    const base = eje === 'ancho' ? Math.max(tam.x, tam.z) : tam.y;
    envoltura.scale.multiplyScalar(medida / base);
    envoltura.updateMatrixWorld(true);
    caja = new Box3().setFromObject(envoltura);
    const centro = caja.getCenter(new Vector3());
    envoltura.position.x -= centro.x;
    envoltura.position.z -= centro.z;
    envoltura.position.y -= caja.min.y;
    envoltura.updateMatrixWorld(true);
}

/**
 * Cada motor crea su propio lienzo dentro de `contenedor` (y lo quita al liberarse): dos motores
 * sobre el mismo lienzo compartirían el contexto WebGL y se pisarían el estado, como pasa cuando
 * React monta el efecto dos veces en desarrollo. `vivo()` dice si todavía hace falta (si no, se
 * deja de preparar a medio camino). `reserva` dice cuánto ocupa la página arriba y abajo del lienzo.
 */
export async function crearMotorEquipos(
    contenedor: HTMLElement,
    opciones: OpcionesMotor,
    vivo: () => boolean = () => true,
    reserva: Reserva = () => ({ arriba: 0, abajo: 0 })
): Promise<MotorEquipos> {
    prepararDecodificador();
    // Lo que haya que soltar si ya no hace falta a medio camino (crece conforme se arma)
    let liberar: () => void = () => {};
    /** Cede el hilo hasta un rato libre y, si la sección ya no está, suelta todo y se detiene */
    const seguir = async () => {
        await ceder();
        if (!vivo()) {
            liberar();
            throw new Error('cancelado');
        }
    };

    // 1. Los archivos, todos a la vez: los modelos (si no llegaron ya pedidos) y las capturas
    const modelos = opciones.modelos ?? { laptop: pedirArchivo(opciones.laptop), celular: pedirArchivo(opciones.celular) };
    const pedidasLap = Promise.all(opciones.pantallas.map(cargarImagen));
    const pedidaCel = cargarImagen(opciones.capturaCelular);
    // (si algo falla mientras se espera otra cosa, no queda como «rechazo sin atender»: el error
    // llega igual al esperarla)
    const pendientes: Promise<unknown>[] = [modelos.laptop, modelos.celular, pedidasLap, pedidaCel];
    for (const pr of pendientes) pr.catch(() => {});

    // 2. Cada modelo se lee en su propio rato libre (el análisis del glTF corre en el hilo principal;
    // la geometría se descomprime en los workers)
    const cargador = new GLTFLoader();
    cargador.setMeshoptDecoder(MeshoptDecoder);
    const datosLap = await modelos.laptop;
    await seguir();
    const gltfLaptop = await cargador.parseAsync(datosLap, carpetaDe(opciones.laptop));
    const datosCel = await modelos.celular;
    await seguir();
    const gltfCelular = await cargador.parseAsync(datosCel, carpetaDe(opciones.celular));
    const [imagenes, imagenCel] = await Promise.all([pedidasLap, pedidaCel]);
    await seguir();

    // 3. El contexto WebGL (crearlo cuesta: va en su propio rato)
    const lienzo = document.createElement('canvas');
    lienzo.setAttribute('aria-hidden', 'true');
    lienzo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    const renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'default' });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    const escena = new Scene();
    const luz = new DirectionalLight(0xffffff, 1.4);
    luz.position.set(3, 6, 5);
    escena.add(luz);
    const camara = new PerspectiveCamera(30, 1, 0.1, 200);
    let ambiente: Texture | undefined;
    let pmrem: PMREMGenerator | undefined;

    liberar = () => {
        const texturas = new Set<Texture>();
        escena.traverse((o) => {
            const malla = o as Mesh;
            if (malla.geometry) malla.geometry.dispose();
            const m = malla.material as Material | Material[] | undefined;
            if (!m) return;
            for (const mat of Array.isArray(m) ? m : [m]) {
                for (const v of Object.values(mat)) if (v && (v as Texture).isTexture) texturas.add(v as Texture);
                if ((mat as ShaderMaterial).uniforms) {
                    for (const u of Object.values((mat as ShaderMaterial).uniforms)) if (u.value && (u.value as Texture).isTexture) texturas.add(u.value as Texture);
                }
                mat.dispose();
            }
        });
        texturas.forEach((t) => t.dispose());
        ambiente?.dispose();
        pmrem?.dispose();
        renderer.dispose();
        lienzo.remove();
    };
    await seguir();

    // 4. El cuarto que se refleja en el aluminio y el vidrio (compila sus shaders: su propio rato)
    pmrem = new PMREMGenerator(renderer);
    const cuarto = new RoomEnvironment();
    ambiente = pmrem.fromScene(cuarto, 0.04).texture;
    cuarto.dispose();
    escena.environment = ambiente;
    const anisotropia = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    await seguir();

    // ── Laptop ────────────────────────────────────────────────────────────────
    // `laptop` lo mueve la animación; `ajusteLap` (adentro) escala y centra el modelo para que el
    // origen de `laptop` quede en el piso, al centro de la base
    const laptop = new Group();
    const ajusteLap = new Group();
    ajusteLap.add(gltfLaptop.scene);
    laptop.add(ajusteLap);
    escena.add(laptop);
    asentar(ajusteLap, 3.2, 'ancho');

    const tapa = gltfLaptop.scene.getObjectByName('tapa');
    const base = gltfLaptop.scene.getObjectByName('base');
    // El frente es +z: si la base queda detrás de la tapa, se gira media vuelta
    if (tapa && base) {
        const zTapa = new Box3().setFromObject(tapa).getCenter(new Vector3()).z;
        const zBase = new Box3().setFromObject(base).getCenter(new Vector3()).z;
        if (zBase < zTapa) {
            gltfLaptop.scene.rotation.y += Math.PI;
            asentar(ajusteLap, 3.2, 'ancho');
        }
    }
    // La tapa gira sobre la bisagra: abajo y al frente de la tapa abierta
    const pivote = new Group();
    let anguloCerrada = 0;
    let pivoteY = 0;
    // Abierta, la orilla de la tapa baja dentro del hueco de la bisagra; cerrada debe quedar encima de
    // la base, así que el pivote sube esa diferencia conforme se cierra
    let subirCerrada = 0;
    if (tapa) {
        laptop.updateMatrixWorld(true);
        const caja = new Box3().setFromObject(tapa);
        const bisagra = new Vector3((caja.min.x + caja.max.x) / 2, caja.min.y, caja.max.z);
        ajusteLap.add(pivote);
        pivote.position.copy(ajusteLap.worldToLocal(bisagra.clone()));
        pivoteY = pivote.position.y;
        if (base) subirCerrada = (new Box3().setFromObject(base).max.y - caja.min.y + 0.004) / ajusteLap.scale.y;
        laptop.updateMatrixWorld(true);
        pivote.attach(tapa);
        anguloCerrada = Math.atan2(caja.max.y - caja.min.y, caja.min.z - caja.max.z) - 0.01;
    }

    // Las cuatro capturas de la laptop, compuestas una vez (mismo aspecto que su pantalla); cada una
    // en su rato libre: dibujar 1600 × 1035 en un lienzo no es gratis en un equipo modesto
    const capturasLap: Texture[] = [];
    for (const img of imagenes) {
        await seguir();
        capturasLap.push(texturaDeCaptura(img, 1600, 1035, anisotropia));
    }
    const pantallaLap = materialPantalla();
    pantallaLap.uniforms.mapaA.value = capturasLap[0];
    pantallaLap.uniforms.mapaB.value = capturasLap[1];
    // En `laptop`, no en la escena del glTF: la tapa (con la pantalla) ya cuelga del pivote
    encenderPantalla(laptop, pantallaLap);

    // Sombras de la laptop: la huella de la base (contacto y ambiental) y, detrás de la bisagra, la
    // de la tapa abierta (la luz viene de arriba y de frente). Van en su propio grupo, fuera de la
    // laptop: así se quedan en el piso cuando ella está en el aire y no cuentan para el encuadre
    laptop.updateMatrixWorld(true);
    const huellaBase = new Box3().setFromObject(base ?? laptop);
    const tamBase = huellaBase.getSize(new Vector3());
    const cenBase = huellaBase.getCenter(new Vector3());
    const radioBase = Math.min(tamBase.x, tamBase.z) * 0.045;
    const sombrasLap = new Group();
    const ambienteLap = crearHuella(tamBase.x * 1.06, tamBase.z * 1.1, radioBase, 0.38, 0);
    const contactoLap = crearHuella(tamBase.x, tamBase.z, radioBase, 0.05, 0);
    const sombraTapa = crearHuella(tamBase.x * 0.9, tamBase.z * 0.16, radioBase, 0.2, 0);
    ambienteLap.position.set(cenBase.x, 0.0005, cenBase.z);
    contactoLap.position.set(cenBase.x, 0.001, cenBase.z);
    sombraTapa.position.set(cenBase.x, 0.0007, huellaBase.min.z - tamBase.z * 0.1);
    ambienteLap.renderOrder = contactoLap.renderOrder = sombraTapa.renderOrder = -1;
    sombrasLap.add(ambienteLap, sombraTapa, contactoLap);
    escena.add(sombrasLap);
    await seguir();

    // ── Celular ───────────────────────────────────────────────────────────────
    const celular = new Group();
    const ajusteCel = new Group();
    ajusteCel.add(gltfCelular.scene);
    celular.add(ajusteCel);
    escena.add(celular);
    {
        // De pie (su medida mayor en y) y con la pantalla hacia +z
        gltfCelular.scene.updateMatrixWorld(true);
        const tam = new Box3().setFromObject(gltfCelular.scene).getSize(new Vector3());
        if (tam.z > tam.y && tam.z > tam.x) gltfCelular.scene.rotation.x -= Math.PI / 2;
        else if (tam.x > tam.y) gltfCelular.scene.rotation.z += Math.PI / 2;
        asentar(ajusteCel, 1.55, 'alto');
        let mallaPantalla: Object3D | null = null;
        gltfCelular.scene.traverse((o) => {
            const m = (o as Mesh).material as Material | undefined;
            if (!mallaPantalla && m && !Array.isArray(m) && m.name === 'pantalla') mallaPantalla = o;
        });
        if (mallaPantalla) {
            const zP = new Box3().setFromObject(mallaPantalla).getCenter(new Vector3()).z;
            const zC = new Box3().setFromObject(celular).getCenter(new Vector3()).z;
            if (zP < zC) {
                gltfCelular.scene.rotation.y += Math.PI;
                asentar(ajusteCel, 1.55, 'alto');
            }
        }
    }
    // Mismo aspecto que la pantalla del modelo (7.13 × 15.40); el fondo es el papel de la app
    await seguir();
    const capturaCel = texturaDeCaptura(imagenCel, 1080, 2334, anisotropia, componerTelefono('#E8E3D8'));
    encenderPantalla(gltfCelular.scene, new MeshBasicMaterial({ map: capturaCel, toneMapped: false, name: 'pantalla' }));

    // Sombras del celular: de pie, su huella es una tira (el canto de abajo)
    celular.updateMatrixWorld(true);
    const tamCel = new Box3().setFromObject(celular).getSize(new Vector3());
    const sombrasCel = new Group();
    const ambienteCel = crearHuella(tamCel.x * 1.1, Math.max(tamCel.z * 3, 0.24), tamCel.z, 0.17, 0);
    const contactoCel = crearHuella(tamCel.x * 0.96, tamCel.z, tamCel.z * 0.45, 0.022, 0);
    // La ambiental, un poco detrás: la luz viene de frente
    ambienteCel.position.set(0, 0.0005, -tamCel.z * 0.8);
    contactoCel.position.set(0, 0.001, 0);
    ambienteCel.renderOrder = contactoCel.renderOrder = -1;
    sombrasCel.add(ambienteCel, contactoCel);
    escena.add(sombrasCel);

    // ── Poses ─────────────────────────────────────────────────────────────────
    // Dónde termina cada equipo. Con la laptop vuelta hacia el celular y él hacia ella, entre los dos
    // quedan ≥ 0.4 unidades de aire (la laptop mide 3.2 de ancho). En pantallas angostas van apilados:
    // la laptop atrás y el celular bien delante de ella, a un palmo de su orilla (ver la toma final)
    const FINAL = {
        ancho: { lap: { x: -1.0, z: -0.25, giro: 0.3 }, cel: { x: 1.66, z: 0.62, giro: -0.32, desdeX: 3.0, desdeZ: 0.5 } },
        angosto: { lap: { x: 0, z: -1.15, giro: 0.12 }, cel: { x: 0.62, z: 1.95, giro: -0.22, desdeX: 2.0, desdeZ: 1.4 } },
    };
    let angosto = false;

    /** Coloca los equipos para el avance `p` (sin dibujar) */
    const posar = (p: number) => {
        const fin = angosto ? FINAL.angosto : FINAL.ancho;
        // Laptop: gira hacia el frente, baja al piso, se abre y al final se hace a un lado
        const giro = suave(rampa(p, 0, 0.42));
        const apertura = suave(rampa(p, 0.18, 0.42));
        const lado = suave(rampa(p, 0.78, 0.97));
        pivote.rotation.x = anguloCerrada * (1 - apertura);
        pivote.position.y = pivoteY + subirCerrada * (1 - apertura);
        laptop.rotation.y = mezclar(-0.62, 0, giro) + lado * fin.lap.giro;
        laptop.position.set(lado * fin.lap.x, (1 - giro) * 0.15, lado * fin.lap.z);

        // Celular: llega desde la derecha, un poco en el aire y ladeado, y se posa frenando
        const t = rampa(p, 0.82, 1);
        const e = frenar(t);
        celular.visible = t > 0.001;
        celular.position.set(fin.cel.x + (1 - e) * fin.cel.desdeX, 0.6 * (1 - t) * (1 - t), fin.cel.z + (1 - e) * fin.cel.desdeZ);
        celular.rotation.set(0, fin.cel.giro - (1 - e) * 1.1, -0.2 * (1 - e));

        // Sombras: en el piso, bajo cada equipo; en el aire, más claras y más abiertas
        const alto = laptop.position.y;
        sombrasLap.position.set(laptop.position.x, 0, laptop.position.z);
        sombrasLap.rotation.y = laptop.rotation.y;
        opacidadDe(contactoLap).opacity = 0.72 * Math.pow(1 - alto / 0.15, 2);
        opacidadDe(ambienteLap).opacity = 0.42 * (1 - alto * 2.5);
        ambienteLap.scale.setScalar(1 + alto * 1.4);
        opacidadDe(sombraTapa).opacity = 0.22 * apertura;

        const altoCel = celular.position.y;
        const aparece = Math.min(1, t * 4);
        sombrasCel.visible = celular.visible;
        sombrasCel.position.set(celular.position.x, 0, celular.position.z);
        sombrasCel.rotation.y = celular.rotation.y;
        opacidadDe(contactoCel).opacity = 0.78 * aparece * Math.max(0, 1 - altoCel / 0.12);
        opacidadDe(ambienteCel).opacity = 0.42 * aparece * Math.max(0, 1 - altoCel * 1.3);
        ambienteCel.scale.setScalar(1 + altoCel * 1.6);

        return apertura;
    };

    // ── Encuadre ──────────────────────────────────────────────────────────────
    // Cada toma: desde dónde se mira (dirección), si se enseñan los dos equipos y cuánto aire se deja
    // alrededor (1 = llenan el espacio libre). La distancia y el centrado los calcula `encuadrar`
    interface Toma {
        p: number;
        dir: [number, number, number];
        ambos?: boolean;
        aire: number;
    }
    const tomasPara = (angostas: boolean): Toma[] => [
        { p: 0, dir: [0, 4.3, 9.4], aire: 1.32 },
        { p: 0.2, dir: [0, 3.3, 9.2], aire: 1.14 },
        { p: 0.42, dir: [0, 1.55, 8.8], aire: 1.02 },
        { p: 0.58, dir: [0, 1.2, 7.6], aire: 0.97 },
        { p: 0.78, dir: [0, 1.45, 8.4], aire: 1.02 },
        // Al final se mira un poco más desde arriba. En angostas, mucho más (42°, casi lo que la pantalla
        // abierta mira hacia arriba): el celular, que va delante, queda debajo de la laptop sin tocarla
        { p: 1, dir: angostas ? [0, 8.4, 9.4] : [0, 2.1, 9.4], ambos: true, aire: 1.05 },
    ];
    interface Encuadre {
        p: number;
        pos: Vector3;
        mira: Vector3;
        dx: number;
        dy: number;
    }
    let encuadres: Encuadre[] = [];
    let ancho = 1;
    let alto = 1;
    const puntos = Array.from({ length: 16 }, () => new Vector3());
    const caja = new Box3();
    const proyectado = new Vector3();
    const esquinas = (obj: Object3D, desde: number) => {
        caja.setFromObject(obj);
        for (let k = 0; k < 8; k++)
            puntos[desde + k].set(k & 1 ? caja.max.x : caja.min.x, k & 2 ? caja.max.y : caja.min.y, k & 4 ? caja.max.z : caja.min.z);
        return desde + 8;
    };
    /** Cuánto ocupan (en coordenadas de -1 a 1) los puntos vistos desde `pos` hacia `mira` */
    const huella = (n: number, pos: Vector3, mira: Vector3) => {
        camara.position.copy(pos);
        camara.lookAt(mira);
        camara.updateMatrixWorld();
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;
        for (let i = 0; i < n; i++) {
            proyectado.copy(puntos[i]).project(camara);
            x0 = Math.min(x0, proyectado.x);
            x1 = Math.max(x1, proyectado.x);
            y0 = Math.min(y0, proyectado.y);
            y1 = Math.max(y1, proyectado.y);
        }
        return [x0, x1, y0, y1] as const;
    };
    const encuadrar = (toma: Toma, libre: { izq: number; der: number; arriba: number; abajo: number }): Encuadre => {
        posar(toma.p);
        escena.updateMatrixWorld(true);
        let n = esquinas(laptop, 0);
        if (toma.ambos) n = esquinas(celular, n);
        const mira = new Box3().setFromPoints(puntos.slice(0, n)).getCenter(new Vector3());
        const dir = new Vector3(...toma.dir).normalize();
        const anchoMax = (2 * (ancho - libre.izq - libre.der)) / ancho / toma.aire;
        const altoMax = (2 * (alto - libre.arriba - libre.abajo)) / alto / toma.aire;
        // La distancia más corta a la que cabe (búsqueda binaria: más lejos, más chico)
        const pos = new Vector3();
        let cerca = 0.5;
        let lejos = 120;
        for (let i = 0; i < 28; i++) {
            const d = (cerca + lejos) / 2;
            const [x0, x1, y0, y1] = huella(n, pos.copy(mira).addScaledVector(dir, d), mira);
            if (x1 - x0 <= anchoMax && y1 - y0 <= altoMax) lejos = d;
            else cerca = d;
        }
        pos.copy(mira).addScaledVector(dir, lejos);
        const [x0, x1, y0, y1] = huella(n, pos, mira);
        // Y se corre la imagen para que quede al centro del espacio libre
        const centroX = ((libre.izq + (ancho - libre.izq - libre.der) / 2) / ancho) * 2 - 1;
        const centroY = 1 - ((libre.arriba + (alto - libre.arriba - libre.abajo) / 2) / alto) * 2;
        return { p: toma.p, pos, mira, dx: (-(centroX - (x0 + x1) / 2) * ancho) / 2, dy: ((centroY - (y0 + y1) / 2) * alto) / 2 };
    };

    let mostrado = 0;
    const medir = () => {
        ancho = contenedor.clientWidth || 1;
        alto = contenedor.clientHeight || 1;
        // 1.5× a lo más (1.25× en equipos modestos): nítido en pantallas de alta densidad y con la
        // mitad de píxeles que 2×
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opciones.densidadMax ?? 1.5));
        renderer.setSize(ancho, alto, false);
        angosto = ancho / alto < 0.9;
        camara.aspect = ancho / alto;
        camara.clearViewOffset();
        camara.updateProjectionMatrix();
        const { arriba, abajo } = reserva();
        const orilla = Math.max(16, ancho * (angosto ? 0.05 : 0.07));
        const libre = { izq: orilla, der: orilla, arriba: arriba + (angosto ? 20 : 28), abajo: Math.max(abajo, 64) };
        encuadres = tomasPara(angosto).map((t) => encuadrar(t, libre));
        posar(mostrado);
    };
    medir();

    // ── Preparar sin trabar: shaders en segundo plano y texturas de a una por rato libre ──
    await seguir();
    celular.visible = sombrasCel.visible = true;
    await renderer.compileAsync(escena, camara);
    const porSubir = new Set<Texture>([...capturasLap, capturaCel]);
    escena.traverse((o) => {
        const m = (o as Mesh).material as Material | undefined;
        if (!m || Array.isArray(m)) return;
        for (const v of Object.values(m)) if (v && (v as Texture).isTexture) porSubir.add(v as Texture);
    });
    for (const t of porSubir) {
        await seguir();
        renderer.initTexture(t);
    }
    await seguir();

    /** Qué capturas y cuánto avance del cambio, según el scroll */
    const capturas = (p: number): [number, number, number] => {
        if (p < 0.49) return [0, 1, 0];
        if (p < 0.56) return [0, 1, suave(rampa(p, 0.49, 0.56))];
        if (p < 0.63) return [1, 2, 0];
        if (p < 0.7) return [1, 2, suave(rampa(p, 0.63, 0.7))];
        if (p < 0.81) return [2, 3, 0];
        return [2, 3, suave(rampa(p, 0.81, 0.88))];
    };

    const objetivo = new Vector3();
    const pintar = (pEntrada: number) => {
        const p = limitar(pEntrada);
        mostrado = p;
        posar(p);

        // Pantallas: Panel → manifiesto → Estadísticas → portal, cada una empujando a la anterior
        const [a, b, t] = capturas(p);
        pantallaLap.uniforms.mapaA.value = capturasLap[a];
        pantallaLap.uniforms.mapaB.value = capturasLap[b];
        pantallaLap.uniforms.avance.value = t;

        // Cámara: entre las dos tomas que rodean a `p`, con su distancia y su centrado ya calculados
        let i = 0;
        while (i < encuadres.length - 2 && p > encuadres[i + 1].p) i++;
        const desde = encuadres[i];
        const hasta = encuadres[i + 1];
        const k = suave(rampa(p, desde.p, hasta.p));
        camara.position.lerpVectors(desde.pos, hasta.pos, k);
        objetivo.lerpVectors(desde.mira, hasta.mira, k);
        camara.lookAt(objetivo);
        camara.setViewOffset(ancho, alto, mezclar(desde.dx, hasta.dx, k), mezclar(desde.dy, hasta.dy, k), ancho, alto);

        renderer.render(escena, camara);
    };

    // Un cuadro de prueba fuera de la página, con los dos equipos a cuadro (la toma final): sube su
    // geometría a la GPU ahora y no en el primer cuadro que se ve
    pintar(1);
    await seguir();
    contenedor.appendChild(lienzo);

    return { pintar, medir, liberar };
}
