import {
    AdditiveBlending,
    BackSide,
    BufferAttribute,
    type BufferGeometry,
    CanvasTexture,
    Color,
    CylinderGeometry,
    DoubleSide,
    ExtrudeGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    NeutralToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Scene,
    ShaderMaterial,
    Shape,
    ShapeGeometry,
    SphereGeometry,
    SRGBColorSpace,
    TextureLoader,
    Vector3,
    WebGLRenderer,
    type Material,
    type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { crearAjustePixeles } from './comun';

/**
 * «SiMAR, en tus manos»: una laptop y un celular que muestran pantallas reales de la demostración.
 * La sección (ProductoEnEscena.tsx) le pasa en qué toma va (0–5) y aquí se mezcla entre la toma
 * anterior y la siguiente.
 *
 * Tomas: 0 laptop cerrada · 1 se abre (Panel) · 2 acercamiento al manifiesto · 3 a las firmas ·
 * 4 Estadísticas · 5 entra el celular con el portal de las empresas recolectoras.
 *
 * Los dispositivos se arman con geometría, sin modelos que bajar (0 KB extra): cuerpos de aluminio
 * con cantos redondos y sombreado suave, teclas en 3D (una sola malla), cristal que refleja, y un
 * estudio de luz propio (cajas de luz alrededor, como en una foto de producto) del que salen los
 * reflejos. Sólo se dibuja cuando algo cambia, y si los cuadros tardan baja la densidad de píxeles.
 */

export interface OpcionesDispositivos {
    movil: boolean;
    reducido: boolean;
    /** Pantallas de la laptop, en orden: panel, manifiesto, estadísticas, portal */
    pantallas: string[];
    /** Pantalla del celular */
    celular: string;
    /** El símbolo de SiMAR (va en la tapa) */
    logo?: string;
}

export interface MotorDispositivos {
    actualizar(etapa: number, dt: number): void;
    redimensionar(): void;
    destruir(): void;
}

// ── Medidas (unidades del mundo) ─────────────────────────────────────────────────────────────
const BASE = { ancho: 3.4, fondo: 2.3, grueso: 0.1, radio: 0.15, canto: 0.032 };
const TAPA = { ancho: 3.4, alto: 2.2, grueso: 0.05, radio: 0.15, canto: 0.02 };
const PANTALLA = { ancho: 3.2, alto: 2.0, subir: 0.035 };
const CEL = { ancho: 0.84, alto: 1.76, grueso: 0.082, radio: 0.135, canto: 0.03, marco: 0.032 };
/** La bisagra queda arriba de las teclas, así la tapa cerrada no las toca */
const ALTO_BISAGRA = BASE.grueso + 0.024;

interface Toma {
    cam: [number, number, number];
    mira: [number, number, number];
    tapa: number;
    giro: number;
    lap: [number, number, number];
    pantalla: number;
    cel: number;
}

function rectRedondeado(ancho: number, alto: number, r: number) {
    const s = new Shape();
    const x = -ancho / 2;
    const y = -alto / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + ancho - r, y);
    s.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
    s.lineTo(x + ancho, y + alto - r);
    s.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
    s.lineTo(x + r, y + alto);
    s.quadraticCurveTo(x, y + alto, x, y + alto - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

/**
 * Una losa de esquinas redondas (vista de arriba) y cantos redondos (de lado), centrada y con el
 * grueso en z. Los vértices se unen para que el sombreado sea suave (sin facetas en los reflejos)
 * y las caras planas guardan su normal exacta (sin manchas en el aluminio).
 */
function losa(ancho: number, alto: number, grueso: number, radio: number, canto: number) {
    const fondo = grueso - 2 * canto;
    const extruida = new ExtrudeGeometry(rectRedondeado(ancho - 2 * canto, alto - 2 * canto, Math.max(0.002, radio - canto)), {
        depth: fondo,
        bevelEnabled: true,
        bevelThickness: canto,
        bevelSize: canto,
        bevelSegments: 6,
        curveSegments: 20,
    });
    extruida.deleteAttribute('normal');
    extruida.deleteAttribute('uv');
    const g = mergeVertices(extruida, 1e-5);
    extruida.dispose();
    g.translate(0, 0, -fondo / 2);
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    const cara = grueso / 2 - 1e-5;
    for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        if (z >= cara) nor.setXYZ(i, 0, 0, 1);
        else if (z <= -cara) nor.setXYZ(i, 0, 0, -1);
    }
    nor.needsUpdate = true;
    return g;
}

function lienzo(ancho: number, alto: number, dibujar: (ctx: CanvasRenderingContext2D) => void) {
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = alto;
    const ctx = c.getContext('2d');
    if (ctx) dibujar(ctx);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
}

function trazoRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/**
 * Sombra de contacto: la silueta del aparato, difuminada en dos capas (una cerrada y oscura
 * pegada al piso y otra amplia y tenue). Con `shadowBlur`, que funciona en todos los navegadores.
 */
function texturaSombra(proporcion: number, radio: number, elipse = false) {
    const W = 512;
    const H = Math.round(W / proporcion);
    return lienzo(W, H, (ctx) => {
        const capa = (escala: number, desenfoque: number, alfa: number) => {
            const w = W * escala;
            const h = H * escala;
            ctx.save();
            // La figura se dibuja fuera del lienzo y sólo su sombra cae adentro
            ctx.shadowOffsetX = W * 2;
            ctx.shadowBlur = desenfoque;
            ctx.shadowColor = `rgba(11, 34, 54, ${alfa})`;
            ctx.fillStyle = '#000';
            if (elipse) {
                ctx.beginPath();
                ctx.ellipse(W / 2 - W * 2, H / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            } else {
                trazoRedondeado(ctx, (W - w) / 2 - W * 2, (H - h) / 2, w, h, radio * escala * W);
            }
            ctx.fill();
            ctx.restore();
        };
        // La silueta ocupa poco más de la mitad del lienzo: el difuminado nunca toca la orilla
        capa(0.6, W * 0.07, 0.34);
        capa(0.55, W * 0.02, 0.5);
    });
}

/** Las rejillas de las bocinas, a los lados del teclado */
function texturaRejilla() {
    return lienzo(64, 512, (ctx) => {
        ctx.fillStyle = '#16181c';
        for (let y = 6; y < 512; y += 11) {
            for (let x = 8; x < 64; x += 11) {
                ctx.beginPath();
                ctx.arc(x + ((y / 11) % 2) * 5, y, 2.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

/** La captura del celular recortada con las esquinas de la pantalla y la isla de arriba */
function texturaCelular(imagen: HTMLImageElement) {
    const W = 780;
    const H = Math.round((W * (CEL.alto - 2 * CEL.marco)) / (CEL.ancho - 2 * CEL.marco));
    return lienzo(W, H, (ctx) => {
        trazoRedondeado(ctx, 0, 0, W, H, 96);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        const escala = W / imagen.width;
        ctx.drawImage(imagen, 0, 34, W, imagen.height * escala);
        ctx.restore();
        ctx.fillStyle = '#000';
        trazoRedondeado(ctx, W / 2 - 105, 26, 210, 60, 30);
        ctx.fill();
    });
}

/**
 * El estudio: una esfera en degradado (piso oscuro, techo claro) con cajas de luz alrededor, como
 * en una foto de producto. No se ve: sólo da los reflejos del aluminio y del cristal.
 */
function crearEstudio() {
    const estudio = new Scene();
    const esfera = new SphereGeometry(30, 32, 16);
    const pos = esfera.getAttribute('position');
    const colores = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
        const t = Math.min(1, Math.max(0, (pos.getY(i) / 30 + 1) / 2));
        const v = 0.05 + 0.5 * Math.pow(t, 1.6);
        colores.set([v, v, v * 1.04], i * 3);
    }
    esfera.setAttribute('color', new BufferAttribute(colores, 3));
    const piezas: { geo: BufferGeometry; mat: Material }[] = [];
    const fondo = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
    estudio.add(new Mesh(esfera, fondo));
    piezas.push({ geo: esfera, mat: fondo });

    const caja = (w: number, h: number, intensidad: number, x: number, y: number, z: number) => {
        const geo = new PlaneGeometry(w, h);
        const mat = new MeshBasicMaterial({ color: new Color(intensidad, intensidad, intensidad), side: DoubleSide });
        const m = new Mesh(geo, mat);
        m.position.set(x, y, z);
        m.lookAt(0, 0.6, 0);
        estudio.add(m);
        piezas.push({ geo, mat });
    };
    caja(12, 5, 2.4, 0, 10, 1.5); // techo: el brillo grande de arriba
    caja(2, 8, 4.2, -9, 3.5, 4); // tira de la izquierda: la luz principal
    caja(1.6, 7, 2.2, 9, 3, 2.5); // tira de la derecha: relleno
    caja(10, 1.4, 3, 0, 3.5, -9); // contraluz: dibuja el canto de la tapa
    return {
        estudio,
        liberar: () => piezas.forEach(({ geo, mat }) => (geo.dispose(), mat.dispose())),
    };
}

const VERTICE_PANTALLA = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Dos capturas que se funden, el brillo que se enciende al abrir y las esquinas redondas de arriba
const FRAGMENTO_PANTALLA = /* glsl */ `
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uMezcla;
uniform float uBrillo;
varying vec2 vUv;
void main() {
    vec2 p = (vUv - 0.5) * vec2(1.6, 1.0);
    float r = vUv.y > 0.5 ? 0.022 : 0.006;
    vec2 q = abs(p) - (vec2(0.8, 0.5) - r);
    if (length(max(q, 0.0)) > r) discard;
    vec3 a = texture2D(tA, vUv).rgb;
    vec3 b = texture2D(tB, vUv).rgb;
    gl_FragColor = vec4(mix(a, b, uMezcla) * uBrillo, 1.0);
    #include <colorspace_fragment>
}
`;

function cargarImagen(src: string) {
    return new Promise<HTMLImageElement>((resolver, rechazar) => {
        const img = new Image();
        img.onload = () => resolver(img);
        img.onerror = rechazar;
        img.src = src;
    });
}

/** Las teclas: filas con sus anchos (en «teclas»), todas en una sola malla */
function geometriaTeclado(ancho: number, fondo: number) {
    const filas = [
        { alto: 0.55, teclas: Array(14).fill(1) },
        { alto: 1, teclas: [...Array(13).fill(1), 1.5] },
        { alto: 1, teclas: [1.5, ...Array(13).fill(1)] },
        { alto: 1, teclas: [1.8, ...Array(11).fill(1), 1.7] },
        { alto: 1, teclas: [2.3, ...Array(10).fill(1), 2.2] },
        { alto: 1, teclas: [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1] },
    ];
    const sep = 0.026;
    const altoTotal = filas.reduce((a, f) => a + f.alto, 0);
    const unidadFondo = (fondo - sep * (filas.length - 1)) / altoTotal;
    const piezas: BufferGeometry[] = [];
    let z = -fondo / 2;
    for (const fila of filas) {
        const d = fila.alto * unidadFondo;
        const total = fila.teclas.reduce((a, b) => a + b, 0);
        const unidad = (ancho - sep * (fila.teclas.length - 1)) / total;
        let x = -ancho / 2;
        for (const t of fila.teclas) {
            const w = t * unidad;
            const g = new RoundedBoxGeometry(w, 0.022, d, 2, 0.012);
            g.translate(x + w / 2, 0.011, z + d / 2);
            piezas.push(g);
            x += w + sep;
        }
        z += d + sep;
    }
    const unida = mergeGeometries(piezas);
    piezas.forEach((g) => g.dispose());
    return unida;
}

export async function crearMotorDispositivos(canvas: HTMLCanvasElement, o: OpcionesDispositivos): Promise<MotorDispositivos | null> {
    let renderer: WebGLRenderer;
    try {
        renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
        return null;
    }
    renderer.setClearColor(0x000000, 0);
    // El tono «neutral» de Khronos: respeta los colores reales (el aluminio no se vuelve amarillo)
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = SRGBColorSpace;

    const escena = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const { estudio, liberar: liberarEstudio } = crearEstudio();
    const ambiente = pmrem.fromScene(estudio, 0.02).texture;
    liberarEstudio();
    escena.environment = ambiente;

    const camara = new PerspectiveCamera(30, 1, 0.5, 60);

    // ── Texturas ────────────────────────────────────────────────────────────────────────────
    const cargador = new TextureLoader();
    const anisotropia = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const texturas: Texture[] = await Promise.all(
        o.pantallas.map(
            (src) =>
                new Promise<Texture>((resolver, rechazar) =>
                    cargador.load(
                        src,
                        (t) => {
                            t.colorSpace = SRGBColorSpace;
                            t.anisotropy = anisotropia;
                            resolver(t);
                        },
                        undefined,
                        rechazar
                    )
                )
        )
    ).catch(() => []);
    if (texturas.length === 0) {
        renderer.dispose();
        pmrem.dispose();
        ambiente.dispose();
        return null;
    }
    const [imagenCel, imagenLogo] = await Promise.all([
        cargarImagen(o.celular).catch(() => null),
        o.logo ? cargarImagen(o.logo).catch(() => null) : Promise.resolve(null),
    ]);

    // ── Materiales ──────────────────────────────────────────────────────────────────────────
    // Gris espacial: contrasta con el fondo claro de la sección y refleja las cajas de luz
    const aluminio = new MeshStandardMaterial({ color: new Color('#9a9fa7'), metalness: 1, roughness: 0.34 });
    // Las piezas planas sobre la cubierta llevan polygonOffset: vistas de lado no parpadean
    const aluminioPulido = new MeshStandardMaterial({ color: new Color('#959aa2'), metalness: 1, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const filo = new MeshStandardMaterial({ color: new Color('#6c7179'), metalness: 1, roughness: 0.42, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const vidrioNegro = new MeshStandardMaterial({ color: new Color('#030405'), metalness: 0, roughness: 0.2 });
    const plasticoTecla = new MeshStandardMaterial({ color: new Color('#1b1d21'), metalness: 0.1, roughness: 0.55 });
    const pozo = new MeshStandardMaterial({ color: new Color('#0e1013'), metalness: 0.2, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const marcoCel = new MeshStandardMaterial({ color: new Color('#5d6878'), metalness: 1, roughness: 0.24 });
    const bisagraMat = new MeshStandardMaterial({ color: new Color('#2a2d33'), metalness: 0.9, roughness: 0.4 });
    const rejilla = new MeshStandardMaterial({ map: texturaRejilla(), transparent: true, metalness: 0.4, roughness: 0.6, depthWrite: false });
    // El cristal: negro, liso y sumado encima: sólo aporta los reflejos (más en ángulos rasantes)
    const cristal = new MeshStandardMaterial({
        color: new Color('#000000'),
        metalness: 0,
        roughness: 0.05,
        envMapIntensity: 0.9,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
    });
    const pantallaMat = new ShaderMaterial({
        vertexShader: VERTICE_PANTALLA,
        fragmentShader: FRAGMENTO_PANTALLA,
        uniforms: {
            tA: { value: texturas[0] },
            tB: { value: texturas[0] },
            uMezcla: { value: 0 },
            uBrillo: { value: 0 },
        },
        toneMapped: false,
    });
    const sombraLap = new MeshBasicMaterial({
        map: texturaSombra(BASE.ancho / BASE.fondo, BASE.radio / BASE.ancho),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
    });
    const sombraCel = new MeshBasicMaterial({ map: texturaSombra(3, 0, true), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
    let texturaLogo: Texture | null = null;
    let logoMat: MeshStandardMaterial | null = null;
    if (imagenLogo) {
        texturaLogo = new CanvasTexture(imagenLogo);
        texturaLogo.colorSpace = SRGBColorSpace;
        texturaLogo.anisotropy = anisotropia;
        logoMat = new MeshStandardMaterial({ map: texturaLogo, transparent: true, metalness: 0.5, roughness: 0.22, depthWrite: false });
    }

    // ── Laptop ──────────────────────────────────────────────────────────────────────────────
    const laptop = new Group();
    escena.add(laptop);

    const geoBase = losa(BASE.ancho, BASE.fondo, BASE.grueso, BASE.radio, BASE.canto);
    geoBase.rotateX(-Math.PI / 2);
    geoBase.translate(0, BASE.grueso / 2, 0);
    laptop.add(new Mesh(geoBase, aluminio));
    const arriba = BASE.grueso + 0.0006;

    // Teclado: el hueco oscuro y encima las teclas en 3D
    const TECLADO = { ancho: 2.78, fondo: 1.1, z: -0.43 };
    const geoPozo = new ShapeGeometry(rectRedondeado(TECLADO.ancho + 0.07, TECLADO.fondo + 0.07, 0.05), 6);
    geoPozo.rotateX(-Math.PI / 2);
    const mPozo = new Mesh(geoPozo, pozo);
    mPozo.position.set(0, arriba, TECLADO.z);
    laptop.add(mPozo);
    const teclas = new Mesh(geometriaTeclado(TECLADO.ancho, TECLADO.fondo), plasticoTecla);
    teclas.position.set(0, arriba, TECLADO.z);
    laptop.add(teclas);
    for (const lado of [-1, 1]) {
        const geoRejilla = new PlaneGeometry(0.13, TECLADO.fondo + 0.04);
        geoRejilla.rotateX(-Math.PI / 2);
        const m = new Mesh(geoRejilla, rejilla);
        m.position.set(lado * (TECLADO.ancho / 2 + 0.16), arriba + 0.0004, TECLADO.z);
        laptop.add(m);
    }
    // Trackpad: un filo apenas más oscuro y adentro un aluminio un poco más liso
    const geoFilo = new ShapeGeometry(rectRedondeado(1.52, 0.88, 0.08), 8);
    geoFilo.rotateX(-Math.PI / 2);
    const mFilo = new Mesh(geoFilo, filo);
    mFilo.position.set(0, arriba + 0.0004, 0.63);
    laptop.add(mFilo);
    const geoTrack = new ShapeGeometry(rectRedondeado(1.5, 0.86, 0.07), 8);
    geoTrack.rotateX(-Math.PI / 2);
    const track = new Mesh(geoTrack, aluminioPulido);
    track.position.set(0, arriba + 0.0012, 0.63);
    laptop.add(track);

    const sombra = new Mesh(new PlaneGeometry(BASE.ancho * 1.8, BASE.fondo * 1.8), sombraLap);
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = -0.003;
    laptop.add(sombra);

    // La tapa gira en la bisagra (al fondo de la base, un poco arriba de las teclas)
    const bisagra = new Group();
    bisagra.position.set(0, ALTO_BISAGRA, -BASE.fondo / 2 + 0.07);
    laptop.add(bisagra);
    const cilindro = new Mesh(new CylinderGeometry(0.05, 0.05, TAPA.ancho - 0.62, 24), bisagraMat);
    cilindro.rotation.z = Math.PI / 2;
    cilindro.position.set(0, ALTO_BISAGRA - 0.035, -BASE.fondo / 2 + 0.07);
    laptop.add(cilindro);

    const geoTapa = losa(TAPA.ancho, TAPA.alto, TAPA.grueso, TAPA.radio, TAPA.canto);
    // Que su orilla de abajo quede en la bisagra y el frente (la pantalla) mire a +z, en z = 0
    geoTapa.translate(0, TAPA.alto / 2, -TAPA.grueso / 2);
    bisagra.add(new Mesh(geoTapa, aluminio));
    const geoFrente = new ShapeGeometry(rectRedondeado(TAPA.ancho - 0.03, TAPA.alto - 0.03, TAPA.radio - 0.015), 10);
    const frente = new Mesh(geoFrente, vidrioNegro);
    frente.position.set(0, TAPA.alto / 2, 0.0008);
    bisagra.add(frente);
    const pantalla = new Mesh(new PlaneGeometry(PANTALLA.ancho, PANTALLA.alto), pantallaMat);
    pantalla.position.set(0, TAPA.alto / 2 + PANTALLA.subir, 0.0016);
    bisagra.add(pantalla);
    // La cámara de arriba de la pantalla
    const geoLente = new ShapeGeometry(rectRedondeado(0.026, 0.026, 0.013), 6);
    const lente = new Mesh(geoLente, new MeshStandardMaterial({ color: new Color('#1d2733'), metalness: 0.3, roughness: 0.1 }));
    lente.position.set(0, TAPA.alto / 2 + PANTALLA.subir + PANTALLA.alto / 2 + (TAPA.alto / 2 - PANTALLA.subir - PANTALLA.alto / 2) / 2, 0.0016);
    bisagra.add(lente);
    const reflejoTapa = new Mesh(geoFrente, cristal);
    reflejoTapa.position.set(0, TAPA.alto / 2, 0.0026);
    bisagra.add(reflejoTapa);
    // El símbolo de SiMAR en la tapa (se ve con la laptop cerrada)
    if (logoMat) {
        const logo = new Mesh(new PlaneGeometry(0.56, 0.56), logoMat);
        logo.position.set(0, TAPA.alto / 2, -TAPA.grueso - 0.0008);
        logo.rotation.y = Math.PI;
        bisagra.add(logo);
    }

    // ── Celular ─────────────────────────────────────────────────────────────────────────────
    const celular = new Group();
    escena.add(celular);
    celular.add(new Mesh(losa(CEL.ancho, CEL.alto, CEL.grueso, CEL.radio, CEL.canto), marcoCel));
    const geoFrenteCel = new ShapeGeometry(rectRedondeado(CEL.ancho - 0.012, CEL.alto - 0.012, CEL.radio - 0.006), 12);
    const frenteCel = new Mesh(geoFrenteCel, vidrioNegro);
    frenteCel.position.z = CEL.grueso / 2 + 0.0006;
    celular.add(frenteCel);
    // Botones: volumen a la izquierda, encendido a la derecha
    const botones: [number, number, number][] = [
        [-1, 0.42, 0.13],
        [-1, 0.22, 0.13],
        [-1, 0.6, 0.07],
        [1, 0.32, 0.22],
    ];
    for (const [lado, y, largo] of botones) {
        const b = new Mesh(new RoundedBoxGeometry(0.02, largo, 0.03, 2, 0.008), marcoCel);
        b.position.set(lado * (CEL.ancho / 2 + 0.002), y, 0);
        celular.add(b);
    }
    let texturaCel: CanvasTexture | null = null;
    let matCel: MeshBasicMaterial | null = null;
    if (imagenCel) {
        texturaCel = texturaCelular(imagenCel);
        texturaCel.anisotropy = anisotropia;
        matCel = new MeshBasicMaterial({ map: texturaCel, transparent: true, toneMapped: false });
        const pantallaCel = new Mesh(new PlaneGeometry(CEL.ancho - 2 * CEL.marco, CEL.alto - 2 * CEL.marco), matCel);
        pantallaCel.position.z = CEL.grueso / 2 + 0.0012;
        celular.add(pantallaCel);
    }
    const reflejoCel = new Mesh(geoFrenteCel, cristal);
    reflejoCel.position.z = CEL.grueso / 2 + 0.002;
    celular.add(reflejoCel);
    const sombraDelCel = new Mesh(new PlaneGeometry(1.8, 0.6), sombraCel);
    sombraDelCel.rotation.x = -Math.PI / 2;
    escena.add(sombraDelCel);

    // ── Tomas ───────────────────────────────────────────────────────────────────────────────
    let movil = o.movil;
    const ABIERTA = -0.26;
    const CERRADA = Math.PI / 2 - 0.012;

    // Puntos de la pantalla (u, v) en el mundo con la laptop abierta y de frente
    const puntoPantalla = (u: number, v: number) => {
        laptop.position.set(0, 0, 0);
        laptop.rotation.set(0, 0, 0);
        bisagra.rotation.x = ABIERTA;
        laptop.updateMatrixWorld(true);
        return pantalla.localToWorld(new Vector3((u - 0.5) * PANTALLA.ancho, (v - 0.5) * PANTALLA.alto, 0));
    };
    const normalPantalla = () => {
        const n = new Vector3(0, 0, 1);
        n.applyAxisAngle(new Vector3(1, 0, 0), ABIERTA);
        return n;
    };
    /**
     * Encuadre: la cámara mira `foco` desde la dirección `dir` a `dist`, y lo baja en la pantalla
     * (`bajar`, en mitades de alto) para dejar libre la parte de arriba, donde va el título.
     */
    const encuadre = (foco: Vector3, dir: Vector3, dist: number, bajar: number): Pick<Toma, 'cam' | 'mira'> => {
        const c = foco.clone().add(dir.clone().normalize().multiplyScalar(dist));
        const sube = dist * Math.tan((camara.fov * Math.PI) / 360) * bajar;
        return { cam: [c.x, c.y, c.z], mira: [foco.x, foco.y + sube, foco.z] };
    };

    const armarTomas = (): Toma[] => {
        // En celular la pantalla es angosta: la cámara se aleja para que quepa el ancho
        const lejos = movil ? 1.4 : 1;
        const bajar = movil ? 0.38 : 0.42;
        const n = normalPantalla();
        const manifiesto = puntoPantalla(0.33, 0.5);
        const firmas = puntoPantalla(0.8, 0.5);
        return [
            { ...encuadre(new Vector3(0, 0.1, 0), new Vector3(0, 0.45, 1), 10.8 * lejos, bajar), tapa: 0, giro: -0.55, lap: [0, -0.1, 0], pantalla: 0, cel: 0 },
            { ...encuadre(new Vector3(0, 0.9, 0), new Vector3(0, 0.2, 1), 10.2 * lejos, bajar), tapa: 1, giro: 0, lap: [0, 0, 0], pantalla: 0, cel: 0 },
            { ...encuadre(manifiesto, n.clone().add(new Vector3(-0.14, 0.06, 0)), movil ? 5.6 : 6.0, bajar + 0.14), tapa: 1, giro: 0, lap: [0, 0, 0], pantalla: 1, cel: 0 },
            { ...encuadre(firmas, n.clone().add(new Vector3(0.16, 0.06, 0)), movil ? 5.2 : 5.6, bajar + 0.14), tapa: 1, giro: 0, lap: [0, 0, 0], pantalla: 1, cel: 0 },
            { ...encuadre(new Vector3(0, 0.9, 0), new Vector3(-0.1, 0.2, 1), 10.4 * lejos, bajar), tapa: 1, giro: 0.32, lap: [0, 0, 0], pantalla: 2, cel: 0 },
            {
                ...encuadre(new Vector3(movil ? 0.25 : 0.4, 0.85, 0.2), new Vector3(0.06, 0.2, 1), 10.4 * lejos, bajar),
                tapa: 1,
                giro: 0.38,
                lap: [movil ? -0.2 : -0.85, 0, -0.2],
                pantalla: 3,
                cel: 1,
            },
        ];
    };
    let tomas: Toma[] = [];

    const mira = new Vector3();
    const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
    const mezcla3 = (a: number[], b: number[], t: number) => [mezcla(a[0], b[0], t), mezcla(a[1], b[1], t), mezcla(a[2], b[2], t)] as const;

    // Si los cuadros tardan, baja la densidad de píxeles (no menos de 1.25: el texto de las
    // pantallas tiene que leerse)
    const ajuste = crearAjustePixeles(Math.min(window.devicePixelRatio || 1, 2), 1.25);
    let medida = '';
    let sucio = true;
    const redimensionar = () => {
        const r = canvas.getBoundingClientRect();
        const dpr = ajuste.dpr;
        // La barra del navegador del celular avisa «resize» al subir y bajar, pero el lienzo
        // (100svh) no cambia: sin esto se volvía a crear su memoria a cada rato
        const nueva = `${Math.round(r.width)}x${Math.round(r.height)}@${dpr}`;
        if (nueva === medida) return;
        medida = nueva;
        const ancho = Math.max(1, r.width);
        const alto = Math.max(1, r.height);
        renderer.setPixelRatio(dpr);
        renderer.setSize(ancho, alto, false);
        camara.aspect = ancho / alto;
        camara.fov = camara.aspect < 0.8 ? 38 : 30;
        camara.updateProjectionMatrix();
        movil = ancho < 768;
        // El encuadre depende del ancho y del fov: se rehace en cada cambio de tamaño
        tomas = armarTomas();
        sucio = true;
    };
    redimensionar();

    // Todo se prepara antes de llegar a la sección: los shaders se compilan (en paralelo, si el
    // navegador puede) y las cuatro capturas se suben a la tarjeta de video. Así, al hacer scroll,
    // ninguna toma se traba la primera vez que aparece.
    celular.visible = true;
    sombraDelCel.visible = true;
    try {
        if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(escena, camara);
        else renderer.compile(escena, camara);
    } catch {
        // Si no se puede por adelantado, se compila al dibujar
    }
    for (const t of texturas) renderer.initTexture(t);
    if (texturaCel) renderer.initTexture(texturaCel);

    let dibujada = Number.NaN;
    let anteriorDibujado = false;

    return {
        actualizar(objetivo, dt) {
            // La posición llega ya suavizada (la sección la sigue con un resorte); con «reducir
            // movimiento», de toma en toma
            const etapa = o.reducido ? Math.round(objetivo) : objetivo;
            // Sólo se dibuja si algo cambió: quieta, la escena no gasta batería ni le quita
            // tiempo al scroll
            if (!sucio && Math.abs(etapa - dibujada) < 1e-5) {
                anteriorDibujado = false;
                return;
            }
            if (anteriorDibujado && ajuste.medir(dt)) redimensionar();
            sucio = false;
            dibujada = etapa;
            anteriorDibujado = true;

            const k0 = Math.min(Math.floor(etapa), tomas.length - 1);
            const k1 = Math.min(k0 + 1, tomas.length - 1);
            const f = etapa - k0;
            const t = f * f * (3 - 2 * f);
            const a = tomas[k0];
            const b = tomas[k1];

            // La tapa se abre con su propio ritmo: empieza despacio y frena al final
            const tapaT = mezcla(a.tapa, b.tapa, t);
            bisagra.rotation.x = mezcla(CERRADA, ABIERTA, 1 - Math.pow(1 - tapaT, 2.2));
            laptop.rotation.y = mezcla(a.giro, b.giro, t);
            laptop.position.set(...mezcla3(a.lap, b.lap, t));

            // La pantalla se enciende al abrir y funde una captura con la siguiente
            const u = pantallaMat.uniforms;
            u.uBrillo.value = Math.min(1, Math.max(0, (tapaT - 0.55) / 0.4));
            u.tA.value = texturas[Math.min(a.pantalla, texturas.length - 1)];
            u.tB.value = texturas[Math.min(b.pantalla, texturas.length - 1)];
            u.uMezcla.value = a.pantalla === b.pantalla ? 0 : Math.min(1, Math.max(0, (t - 0.25) / 0.5));

            // El celular entra desde abajo a la derecha y se para junto a la laptop
            const c = mezcla(a.cel, b.cel, t);
            const ce = 1 - Math.pow(1 - c, 3);
            celular.visible = c > 0.001;
            sombraDelCel.visible = celular.visible;
            const destino = movil ? [0.9, 0.55, 1.5] : [1.85, 0.82, 1.15];
            celular.position.set(destino[0] + (1 - ce) * 2.4, destino[1] - (1 - ce) * 2.2, destino[2] + (1 - ce) * 1.2);
            celular.rotation.set(-0.06, -0.32 - (1 - ce) * 0.8, 0.02 + (1 - ce) * 0.25);
            // Su sombra en el piso, debajo de él, aparece cuando llega
            sombraDelCel.position.set(celular.position.x, 0.002, celular.position.z - 0.05);
            sombraDelCel.rotation.z = 0.32 + (1 - ce) * 0.8;
            sombraCel.opacity = Math.pow(ce, 3) * 0.9;

            const [cx, cy, cz] = mezcla3(a.cam, b.cam, t);
            camara.position.set(cx, cy, cz);
            mira.set(...mezcla3(a.mira, b.mira, t));
            camara.lookAt(mira);
            renderer.render(escena, camara);
        },
        redimensionar,
        destruir() {
            escena.traverse((obj) => {
                if (obj instanceof Mesh) {
                    obj.geometry.dispose();
                    const m = obj.material as Material;
                    m.dispose();
                }
            });
            texturas.forEach((t) => t.dispose());
            [texturaCel, texturaLogo, sombraLap.map, sombraCel.map, rejilla.map].forEach((t) => t?.dispose());
            ambiente.dispose();
            pmrem.dispose();
            renderer.dispose();
        },
    };
}
