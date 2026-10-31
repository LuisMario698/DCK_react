import {
    ACESFilmicToneMapping,
    CanvasTexture,
    Color,
    DoubleSide,
    ExtrudeGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Scene,
    ShaderMaterial,
    Shape,
    SRGBColorSpace,
    TextureLoader,
    Vector3,
    WebGLRenderer,
    type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * «SiMAR, en tus manos»: una laptop y un celular hechos con geometría (sin modelos que bajar) que
 * muestran pantallas reales de la demostración. La sección (ProductoEnEscena.tsx) le pasa en qué
 * toma va (0–5) y aquí se mezcla entre la toma anterior y la siguiente.
 *
 * Tomas: 0 laptop cerrada · 1 se abre (Panel) · 2 acercamiento al manifiesto · 3 a las firmas ·
 * 4 Estadísticas · 5 entra el celular con el portal de las empresas recolectoras.
 */

export interface OpcionesDispositivos {
    movil: boolean;
    reducido: boolean;
    /** Pantallas de la laptop, en orden: panel, manifiesto, estadísticas, portal */
    pantallas: string[];
    /** Pantalla del celular */
    celular: string;
}

export interface MotorDispositivos {
    actualizar(etapa: number, dt: number): void;
    redimensionar(): void;
    destruir(): void;
}

// ── Medidas (unidades del mundo) ─────────────────────────────────────────────────────────────
const BASE = { ancho: 3.4, fondo: 2.3, grueso: 0.07 };
const TAPA = { ancho: 3.4, alto: 2.2, grueso: 0.045 };
const PANTALLA = { ancho: 3.2, alto: 2.0 };
const CEL = { ancho: 0.84, alto: 1.76, grueso: 0.075 };

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

/** El teclado y el trackpad, dibujados en la cubierta */
function texturaTeclado() {
    return lienzo(1024, 692, (ctx) => {
        ctx.fillStyle = '#c9ccd1';
        ctx.fillRect(0, 0, 1024, 692);
        const zonaX = 86;
        const zonaY = 52;
        const zonaW = 852;
        const filas = 6;
        const altoTecla = 46;
        const sep = 9;
        ctx.fillStyle = '#9da1a8';
        trazoRedondeado(ctx, zonaX - 10, zonaY - 10, zonaW + 20, filas * (altoTecla + sep) + 12, 14);
        ctx.fill();
        for (let f = 0; f < filas; f++) {
            const y = zonaY + f * (altoTecla + sep);
            const teclas = f === 0 ? 14 : f === 5 ? 9 : 13;
            const h = f === 0 ? altoTecla * 0.6 : altoTecla;
            let x = zonaX;
            const anchoBase = (zonaW - sep * (teclas - 1)) / teclas;
            for (let t = 0; t < teclas; t++) {
                let w = anchoBase;
                if (f === 5 && t === 4) w = anchoBase * 4.2;
                if (f === 5 && t > 4) w = (zonaW - (x - zonaX) - sep * (teclas - 1 - t)) / (teclas - t);
                ctx.fillStyle = '#2a2d33';
                trazoRedondeado(ctx, x, y, w, h, 6);
                ctx.fill();
                x += w + sep;
            }
        }
        // Trackpad
        ctx.fillStyle = '#bfc2c8';
        trazoRedondeado(ctx, 512 - 190, 420, 380, 236, 18);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

/** Sombra suave bajo los dispositivos */
function texturaSombra() {
    return lienzo(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
        g.addColorStop(0, 'rgba(11,34,54,0.55)');
        g.addColorStop(0.55, 'rgba(11,34,54,0.18)');
        g.addColorStop(1, 'rgba(11,34,54,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
    });
}

/** La captura del celular recortada con las esquinas de la pantalla y la isla de arriba */
function texturaCelular(imagen: HTMLImageElement) {
    const W = 780;
    const H = Math.round((W * (CEL.alto - 0.08)) / (CEL.ancho - 0.08));
    return lienzo(W, H, (ctx) => {
        trazoRedondeado(ctx, 0, 0, W, H, 92);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        // Cubre el alto; si sobra, se recorta abajo
        const escala = W / imagen.width;
        ctx.drawImage(imagen, 0, 34, W, imagen.height * escala);
        ctx.restore();
        ctx.fillStyle = '#000';
        trazoRedondeado(ctx, W / 2 - 110, 24, 220, 62, 31);
        ctx.fill();
    });
}

const VERTICE_PANTALLA = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Dos capturas que se funden, el brillo que se enciende al abrir y un reflejo leve de vidrio
const FRAGMENTO_PANTALLA = /* glsl */ `
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uMezcla;
uniform float uBrillo;
varying vec2 vUv;
void main() {
    vec3 a = texture2D(tA, vUv).rgb;
    vec3 b = texture2D(tB, vUv).rgb;
    vec3 c = mix(a, b, uMezcla) * uBrillo;
    float reflejo = smoothstep(0.55, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.15)) * 0.05;
    gl_FragColor = vec4(c + reflejo, 1.0);
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

export async function crearMotorDispositivos(canvas: HTMLCanvasElement, o: OpcionesDispositivos): Promise<MotorDispositivos | null> {
    let renderer: WebGLRenderer;
    try {
        renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
        return null;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = SRGBColorSpace;

    const escena = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    const ambiente = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    escena.environment = ambiente;

    const camara = new PerspectiveCamera(30, 1, 0.1, 100);

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
        return null;
    }
    const imagenCel = await cargarImagen(o.celular).catch(() => null);

    // ── Materiales ──────────────────────────────────────────────────────────────────────────
    const aluminio = new MeshStandardMaterial({ color: new Color('#c6cad0'), metalness: 0.85, roughness: 0.32 });
    const vidrioNegro = new MeshStandardMaterial({ color: new Color('#050608'), metalness: 0.2, roughness: 0.12 });
    const titanio = new MeshStandardMaterial({ color: new Color('#3a3f47'), metalness: 0.9, roughness: 0.28 });
    const teclado = new MeshStandardMaterial({ map: texturaTeclado(), metalness: 0.55, roughness: 0.45 });
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
    const sombraMat = new MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false, opacity: 0.5 });

    // ── Laptop ──────────────────────────────────────────────────────────────────────────────
    const laptop = new Group();
    escena.add(laptop);

    const geoBase = new ExtrudeGeometry(rectRedondeado(BASE.ancho, BASE.fondo, 0.16), {
        depth: BASE.grueso,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.018,
        bevelSegments: 3,
        curveSegments: 12,
    });
    geoBase.rotateX(-Math.PI / 2);
    geoBase.translate(0, 0.018, 0);
    const base = new Mesh(geoBase, aluminio);
    laptop.add(base);
    const arriba = BASE.grueso + 0.036;

    const cubierta = new Mesh(new PlaneGeometry(BASE.ancho - 0.1, BASE.fondo - 0.1), teclado);
    cubierta.rotation.x = -Math.PI / 2;
    cubierta.position.y = arriba + 0.0015;
    laptop.add(cubierta);

    const sombra = new Mesh(new PlaneGeometry(BASE.ancho * 1.6, BASE.fondo * 1.6), sombraMat);
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = -0.002;
    laptop.add(sombra);

    // La tapa gira en la bisagra (al fondo de la base)
    const bisagra = new Group();
    bisagra.position.set(0, arriba, -BASE.fondo / 2 + 0.06);
    laptop.add(bisagra);
    const geoTapa = new ExtrudeGeometry(rectRedondeado(TAPA.ancho, TAPA.alto, 0.16), {
        depth: TAPA.grueso,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 3,
        curveSegments: 12,
    });
    // Que su orilla de abajo quede en la bisagra y el frente (la pantalla) mire a +z
    geoTapa.translate(0, TAPA.alto / 2, -TAPA.grueso);
    const tapa = new Mesh(geoTapa, aluminio);
    bisagra.add(tapa);
    const frente = new Mesh(new PlaneGeometry(TAPA.ancho - 0.05, TAPA.alto - 0.05), vidrioNegro);
    frente.position.set(0, TAPA.alto / 2, 0.0135);
    bisagra.add(frente);
    const pantalla = new Mesh(new PlaneGeometry(PANTALLA.ancho, PANTALLA.alto), pantallaMat);
    pantalla.position.set(0, TAPA.alto / 2 + 0.035, 0.015);
    bisagra.add(pantalla);

    // ── Celular ─────────────────────────────────────────────────────────────────────────────
    const celular = new Group();
    escena.add(celular);
    const geoCel = new ExtrudeGeometry(rectRedondeado(CEL.ancho, CEL.alto, 0.13), {
        depth: CEL.grueso,
        bevelEnabled: true,
        bevelThickness: 0.014,
        bevelSize: 0.014,
        bevelSegments: 3,
        curveSegments: 14,
    });
    geoCel.translate(0, 0, -CEL.grueso / 2);
    celular.add(new Mesh(geoCel, titanio));
    const frenteCel = new Mesh(new PlaneGeometry(CEL.ancho - 0.02, CEL.alto - 0.02), vidrioNegro);
    frenteCel.position.z = CEL.grueso / 2 + 0.0145;
    celular.add(frenteCel);
    let texturaCel: CanvasTexture | null = null;
    let matCel: MeshBasicMaterial | null = null;
    if (imagenCel) {
        texturaCel = texturaCelular(imagenCel);
        texturaCel.anisotropy = anisotropia;
        matCel = new MeshBasicMaterial({ map: texturaCel, transparent: true, toneMapped: false, side: DoubleSide });
        const pantallaCel = new Mesh(new PlaneGeometry(CEL.ancho - 0.08, CEL.alto - 0.08), matCel);
        pantallaCel.position.z = CEL.grueso / 2 + 0.016;
        celular.add(pantallaCel);
    }

    // ── Tomas ───────────────────────────────────────────────────────────────────────────────
    let movil = o.movil;
    const ABIERTA = -0.26;
    const CERRADA = Math.PI / 2 - 0.035;

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
        const lejos = movil ? 1.5 : 1;
        const bajar = movil ? 0.22 : 0.42;
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
                lap: [movil ? -0.35 : -0.85, 0, -0.2],
                pantalla: 3,
                cel: 1,
            },
        ];
    };
    let tomas: Toma[] = [];

    let etapa = 0;
    const mira = new Vector3();
    const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
    const mezcla3 = (a: number[], b: number[], t: number) => [mezcla(a[0], b[0], t), mezcla(a[1], b[1], t), mezcla(a[2], b[2], t)] as const;

    let ancho = 1;
    let alto = 1;
    const redimensionar = () => {
        const r = canvas.getBoundingClientRect();
        ancho = Math.max(1, r.width);
        alto = Math.max(1, r.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(ancho, alto, false);
        camara.aspect = ancho / alto;
        camara.fov = camara.aspect < 0.8 ? 38 : 30;
        camara.updateProjectionMatrix();
        movil = ancho < 768;
        // El encuadre depende del ancho y del fov: se rehace en cada cambio de tamaño
        if (listo) tomas = armarTomas();
    };
    let listo = false;
    redimensionar();
    listo = true;
    tomas = armarTomas();

    return {
        actualizar(objetivo, dt) {
            if (o.reducido) etapa = Math.round(objetivo);
            else {
                etapa += (objetivo - etapa) * (1 - Math.exp(-dt * 5));
                if (Math.abs(objetivo - etapa) < 0.0004) etapa = objetivo;
            }
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
            const destino = movil ? [0.95, 0.55, 1.5] : [1.85, 0.82, 1.15];
            celular.position.set(destino[0] + (1 - ce) * 2.4, destino[1] - (1 - ce) * 2.2, destino[2] + (1 - ce) * 1.2);
            celular.rotation.set(-0.06, -0.32 - (1 - ce) * 0.8, 0.02 + (1 - ce) * 0.25);

            const [cx, cy, cz] = mezcla3(a.cam, b.cam, t);
            camara.position.set(cx, cy, cz);
            mira.set(...mezcla3(a.mira, b.mira, t));
            camara.lookAt(mira);
            renderer.render(escena, camara);
        },
        redimensionar,
        destruir() {
            escena.traverse((obj) => {
                if (obj instanceof Mesh) obj.geometry.dispose();
            });
            [aluminio, vidrioNegro, titanio, teclado, pantallaMat, sombraMat, matCel].forEach((m) => m?.dispose());
            texturas.forEach((t) => t.dispose());
            texturaCel?.dispose();
            ambiente.dispose();
            pmrem.dispose();
            renderer.dispose();
        },
    };
}
