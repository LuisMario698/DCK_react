import { CAJA_GOLFO, PUERTO_PENASCO, TIERRA_GOLFO } from './golfo';

/**
 * Las figuras que forman las partículas del «Mar de partículas», una tras otra al bajar:
 *
 *   0 el mar · 1 la gota · 2 la mancha (mismas posiciones que el mar; el color lo pone el
 *   shader según el radio de la mancha) · 3 las hojas de papel · 4 el Golfo de California ·
 *   5 el símbolo de SiMAR.
 *
 * Cada figura es un Float32Array de n × 4: x, y, z y un cuarto valor que cada figura usa a su
 * modo (brillo, sombreado o una marca). Todo sale de un generador con semilla: la misma
 * pantalla dibuja siempre lo mismo.
 */

export interface Disposicion {
    /** Celular: las figuras van arriba y más chicas, el texto abajo */
    movil: boolean;
}

export interface Formas {
    n: number;
    mar: Float32Array;
    gota: Float32Array;
    papel: Float32Array;
    golfo: Float32Array;
    logo: Float32Array;
    /** Color de cada partícula en el símbolo (el de su pixel en el logo) */
    colorLogo: Float32Array;
    /** azar (para escalonar), tamaño, fase y otro azar */
    azar: Float32Array;
    /** Dónde cae la gota (sobre el mar) */
    impacto: [number, number, number];
    /** Dónde queda Puerto Peñasco en el mapa */
    puerto: [number, number, number];
}

/** Altura del mar (y) */
export const ALTURA_MAR = -1.4;

/** Generador con semilla (mulberry32) */
function generador(semilla: number) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Centro y escala de las figuras: a la derecha en computadora, arriba en celular */
function centro({ movil }: Disposicion) {
    return movil ? { cx: 0, cy: 1.05, escala: 0.56 } : { cx: 2.35, cy: 0.05, escala: 1 };
}

/** Pixeles encendidos de un dibujo en canvas: [x, y, r, g, b] de cada uno */
function pixelesDe(ancho: number, alto: number, dibujar: (ctx: CanvasRenderingContext2D) => void, umbral = 128) {
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { puntos: new Float32Array(0), cuantos: 0 };
    dibujar(ctx);
    const datos = ctx.getImageData(0, 0, ancho, alto).data;
    const lista: number[] = [];
    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            const i = (y * ancho + x) * 4;
            if (datos[i + 3] >= umbral && datos[i] + datos[i + 1] + datos[i + 2] > 30) {
                lista.push(x, y, datos[i] / 255, datos[i + 1] / 255, datos[i + 2] / 255);
            }
        }
    }
    return { puntos: new Float32Array(lista), cuantos: lista.length / 5 };
}

// ── 0 · El mar ──────────────────────────────────────────────────────────────────────────────
function crearMar(n: number, azar: () => number) {
    const f = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
        // Más cerca de la cámara hay menos (la perspectiva ya junta las de lejos)
        const z = -17 + Math.pow(azar(), 0.85) * 22;
        f[i * 4] = (azar() * 2 - 1) * (11 + Math.max(0, -z) * 0.55);
        f[i * 4 + 1] = ALTURA_MAR;
        f[i * 4 + 2] = z;
        f[i * 4 + 3] = 0.35 + 0.65 * azar();
    }
    return f;
}

// ── 1 · La gota ─────────────────────────────────────────────────────────────────────────────
function crearGota(n: number, azar: () => number, d: Disposicion) {
    const f = new Float32Array(n * 4);
    const { cx, cy, escala } = centro(d);
    const R = 1.22 * escala;
    const ALTO = 1.32 * escala;
    const perfil = (t: number) => R * Math.sin(t) * ((1 - Math.cos(t)) / 2);
    // Luz desde arriba a la izquierda y un poco al frente; el brillo especular sale de ahí
    const L = normalizar([-0.55, 0.75, 0.62]);
    const H = normalizar([L[0], L[1], L[2] + 1]);
    for (let i = 0; i < n; i++) {
        let t = 0;
        // Muestreo por área: más puntos donde la gota es más ancha
        for (let k = 0; k < 12; k++) {
            t = azar() * Math.PI;
            if (azar() * 0.66 * R < perfil(t)) break;
        }
        const r = perfil(t);
        const phi = azar() * Math.PI * 2;
        const dentro = azar() < 0.1;
        const rr = dentro ? r * Math.sqrt(azar()) * 0.92 : r;
        const x = rr * Math.cos(phi);
        const z = rr * Math.sin(phi);
        const y = Math.cos(t) * ALTO;
        // Normal aproximada: hacia afuera y un poco según la altura
        const nrm = normalizar([Math.cos(phi), (y / ALTO + 0.25) * 0.75, Math.sin(phi)]);
        const difusa = Math.max(0, punto(nrm, L));
        const especular = Math.pow(Math.max(0, punto(nrm, H)), 28);
        const borde = Math.pow(1 - Math.abs(nrm[2]), 3) * 0.35;
        f[i * 4] = cx + x;
        f[i * 4 + 1] = cy + 0.35 * escala + y;
        f[i * 4 + 2] = z;
        f[i * 4 + 3] = dentro ? 0.18 : 0.2 + 0.7 * difusa + borde + 1.3 * especular;
    }
    return f;
}

// ── 3 · Las hojas de papel ──────────────────────────────────────────────────────────────────
function dibujarHoja(ctx: CanvasRenderingContext2D, ancho: number, alto: number, semilla: number, rota: boolean) {
    const azar = generador(semilla);
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Orilla
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, ancho - 12, alto - 12);
    // Encabezado: un sello y dos renglones
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(34, 36, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(58, 30);
    ctx.lineTo(ancho * 0.72, 30);
    ctx.moveTo(58, 44);
    ctx.lineTo(ancho * 0.5, 44);
    ctx.stroke();
    // Tabla de residuos
    const t0 = 70;
    const filas = 6;
    const altoFila = 22;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(16, t0, ancho - 32, filas * altoFila);
    for (let f = 1; f < filas; f++) {
        ctx.beginPath();
        ctx.moveTo(16, t0 + f * altoFila);
        ctx.lineTo(ancho - 16, t0 + f * altoFila);
        ctx.stroke();
    }
    for (const c of [0.42, 0.62, 0.8]) {
        ctx.beginPath();
        ctx.moveTo(ancho * c, t0);
        ctx.lineTo(ancho * c, t0 + filas * altoFila);
        ctx.stroke();
    }
    // Letra a mano: renglones ondulados de largo distinto
    ctx.lineWidth = 2.2;
    for (let f = 0; f < filas; f++) {
        const y = t0 + f * altoFila + altoFila * 0.55;
        const largo = 0.18 + azar() * 0.16;
        ctx.beginPath();
        for (let x = 24; x < ancho * largo + 24; x += 3) {
            const yy = y + Math.sin(x * 0.45 + f) * 2.2 + Math.sin(x * 0.13) * 1.2;
            if (x === 24) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        for (const c of [0.47, 0.67, 0.85]) {
            if (azar() < 0.25) continue;
            ctx.beginPath();
            const x0 = ancho * c;
            for (let x = x0; x < x0 + 12 + azar() * 14; x += 3) {
                const yy = y + Math.sin(x * 0.6) * 2;
                if (x === x0) ctx.moveTo(x, yy);
                else ctx.lineTo(x, yy);
            }
            ctx.stroke();
        }
    }
    // Observaciones y dos firmas
    const y1 = t0 + filas * altoFila + 26;
    ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(18, y1 + r * 16);
        ctx.lineTo(ancho - 18 - azar() * 60, y1 + r * 16);
        ctx.stroke();
    }
    const yf = alto - 34;
    ctx.lineWidth = 1.8;
    for (const x0 of [24, ancho / 2 + 10]) {
        ctx.beginPath();
        ctx.moveTo(x0, yf);
        ctx.lineTo(x0 + ancho / 2 - 44, yf);
        ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
            const s = k / 40;
            const x = x0 + 6 + s * (ancho / 2 - 60);
            const y = yf - 10 + Math.sin(s * 14 + x0) * 7 * (1 - s * 0.5) - s * 4;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1.8;
    }
    // La hoja de enfrente está gastada: le falta la esquina de abajo
    if (rota) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(ancho, alto * 0.7);
        let x = ancho;
        let y = alto * 0.7;
        while (y < alto) {
            x -= 6 + azar() * 10;
            y += 6 + azar() * 9;
            ctx.lineTo(x + (azar() - 0.5) * 8, y);
        }
        ctx.lineTo(ancho, alto);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

function crearPapel(n: number, azar: () => number, d: Disposicion) {
    const f = new Float32Array(n * 4);
    const { cx, cy, escala } = centro(d);
    const ANCHO = 220;
    const ALTO = 290;
    const hojas = [
        { x: -0.75, y: 0.32, z: -0.9, rz: 0.16, ry: -0.32, parte: 0.27, rota: false },
        { x: 0.0, y: 0.05, z: -0.25, rz: -0.04, ry: -0.3, parte: 0.31, rota: false },
        { x: 0.62, y: -0.28, z: 0.45, rz: -0.14, ry: -0.26, parte: 0.42, rota: true },
    ];
    const anchoMundo = 2.05 * escala;
    const altoMundo = anchoMundo * (ALTO / ANCHO);
    let i = 0;
    hojas.forEach((h, k) => {
        const { puntos, cuantos } = pixelesDe(ANCHO, ALTO, (ctx) => dibujarHoja(ctx, ANCHO, ALTO, 11 + k * 7, h.rota));
        const cuota = k === hojas.length - 1 ? n - i : Math.floor(n * h.parte);
        const cr = Math.cos(h.rz);
        const sr = Math.sin(h.rz);
        const cy2 = Math.cos(h.ry);
        const sy2 = Math.sin(h.ry);
        for (let c = 0; c < cuota && i < n; c++, i++) {
            let u: number;
            let v: number;
            let brillo: number;
            if (azar() < 0.12 || cuantos === 0) {
                // Un velo tenue en toda la hoja: se ve el plano del papel
                u = azar();
                v = azar();
                if (h.rota && u + (1 - v) * 0.6 > 1.25) {
                    u *= 0.7;
                }
                brillo = 0.12 + azar() * 0.12;
            } else {
                const p = Math.floor(azar() * cuantos) * 5;
                u = (puntos[p] + azar()) / ANCHO;
                v = (puntos[p + 1] + azar()) / ALTO;
                brillo = 0.55 + azar() * 0.45;
            }
            // Coordenadas en la hoja, con una curva leve como papel de verdad
            let x = (u - 0.5) * anchoMundo;
            let y = (0.5 - v) * altoMundo;
            let z = Math.sin(u * Math.PI) * 0.08 * escala + (v - 0.5) * 0.06 * escala;
            // Gira en z y luego en y
            const xr = x * cr - y * sr;
            const yr = x * sr + y * cr;
            x = xr * cy2 + z * sy2;
            z = -xr * sy2 + z * cy2;
            y = yr;
            f[i * 4] = cx + h.x * escala + x;
            f[i * 4 + 1] = cy + h.y * escala + y;
            f[i * 4 + 2] = h.z * escala + z;
            f[i * 4 + 3] = brillo;
        }
    });
    return f;
}

// ── 4 · El Golfo de California ──────────────────────────────────────────────────────────────
function crearGolfo(n: number, azar: () => number, d: Disposicion) {
    const f = new Float32Array(n * 4);
    const { cx, cy, escala } = centro(d);
    const { oeste, este, sur, norte } = CAJA_GOLFO;
    const kLat = Math.cos(((sur + norte) / 2) * (Math.PI / 180));
    const ANCHO = 460;
    const ALTO = Math.round((ANCHO * (norte - sur)) / ((este - oeste) * kLat));
    const aPx = (lon: number, lat: number) => [((lon - oeste) / (este - oeste)) * ANCHO, ((norte - lat) / (norte - sur)) * ALTO];
    // El mar en blanco y la tierra encima en negro: quedan sólo los pixeles de mar
    const { puntos, cuantos } = pixelesDe(ANCHO, ALTO, (ctx) => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, ANCHO, ALTO);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        for (const anillo of TIERRA_GOLFO) {
            ctx.beginPath();
            for (let k = 0; k < anillo.length; k += 2) {
                const [x, y] = aPx(anillo[k], anillo[k + 1]);
                if (k === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
    });
    const anchoMundo = (d.movil ? 3.4 : 4.3) * escala;
    const altoMundo = anchoMundo * (ALTO / ANCHO);
    // El mapa se inclina hacia atrás: se lee como una mesa vista desde arriba
    const inclina = -0.28;
    const ci = Math.cos(inclina);
    const si = Math.sin(inclina);
    const desplazaY = d.movil ? 0.15 : 0.1;
    const aMundo = (px: number, py: number): [number, number, number] => {
        const x = (px / ANCHO - 0.5) * anchoMundo;
        const y0 = (0.5 - py / ALTO) * altoMundo;
        return [cx + x, cy + desplazaY + y0 * ci, y0 * si];
    };
    const [ppx, ppy] = aPx(PUERTO_PENASCO.lon, PUERTO_PENASCO.lat);
    const puerto = aMundo(ppx, ppy);
    // Centro del golfo: lo más brillante
    const [gx, gy] = aPx(-111.6, 28.6);
    // La tierra, con puntos muy tenues: así se lee la costa por los dos lados
    const tierra = pixelesDe(ANCHO, ALTO, (ctx) => {
        ctx.fillStyle = '#fff';
        for (const anillo of TIERRA_GOLFO) {
            ctx.beginPath();
            for (let k = 0; k < anillo.length; k += 2) {
                const [x, y] = aPx(anillo[k], anillo[k + 1]);
                if (k === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
    });
    const nPuerto = Math.floor(n * 0.03);
    const nAnillo = Math.floor(n * 0.012);
    const nTierra = tierra.cuantos > 0 ? Math.floor(n * 0.14) : 0;
    for (let i = 0; i < n; i++) {
        let p: [number, number, number];
        let w: number;
        if (i < nPuerto) {
            // Puerto Peñasco: un punto de luz apretado
            const r = Math.abs(gauss(azar)) * 0.035 * escala;
            const a = azar() * Math.PI * 2;
            p = [puerto[0] + Math.cos(a) * r, puerto[1] + Math.sin(a) * r * ci, puerto[2] + Math.sin(a) * r * si];
            w = 3;
        } else if (i < nPuerto + nAnillo) {
            // Un aro alrededor
            const a = azar() * Math.PI * 2;
            const r = 0.2 * escala * (0.96 + azar() * 0.08);
            p = [puerto[0] + Math.cos(a) * r, puerto[1] + Math.sin(a) * r * ci, puerto[2] + Math.sin(a) * r * si];
            w = 2.4;
        } else if (i < nPuerto + nAnillo + nTierra) {
            const k = Math.floor(azar() * tierra.cuantos) * 5;
            p = aMundo(tierra.puntos[k] + azar(), tierra.puntos[k + 1] + azar());
            w = 1.6 + azar() * 0.3;
        } else {
            const k = cuantos > 0 ? Math.floor(azar() * cuantos) * 5 : 0;
            const px = (cuantos > 0 ? puntos[k] : azar() * ANCHO) + azar();
            const py = (cuantos > 0 ? puntos[k + 1] : azar() * ALTO) + azar();
            p = aMundo(px, py);
            const dist = Math.hypot((px - gx) / ANCHO, (py - gy) / ALTO);
            w = Math.max(0.22, 1 - dist * 1.05) * (0.75 + azar() * 0.25);
        }
        f[i * 4] = p[0];
        f[i * 4 + 1] = p[1];
        f[i * 4 + 2] = p[2];
        f[i * 4 + 3] = w;
    }
    return { golfo: f, puerto };
}

// ── 5 · El símbolo de SiMAR ─────────────────────────────────────────────────────────────────
function crearLogo(n: number, azar: () => number, d: Disposicion, imagen: HTMLImageElement | null) {
    const f = new Float32Array(n * 4);
    const color = new Float32Array(n * 3);
    const { cx, cy, escala } = centro(d);
    const LADO = 240;
    const { puntos, cuantos } = pixelesDe(
        LADO,
        LADO,
        (ctx) => {
            if (imagen) ctx.drawImage(imagen, 0, 0, LADO, LADO);
        },
        150
    );
    const tam = (d.movil ? 3.3 : 3.15) * escala;
    for (let i = 0; i < n; i++) {
        if (cuantos === 0) {
            // Sin imagen: un círculo
            const a = azar() * Math.PI * 2;
            f[i * 4] = cx + Math.cos(a) * tam * 0.45;
            f[i * 4 + 1] = cy + Math.sin(a) * tam * 0.45;
            f[i * 4 + 2] = 0;
            f[i * 4 + 3] = 1;
            color.set([0.13, 0.7, 0.77], i * 3);
            continue;
        }
        const k = Math.floor(azar() * cuantos) * 5;
        f[i * 4] = cx + ((puntos[k] + azar()) / LADO - 0.5) * tam;
        f[i * 4 + 1] = cy + (0.5 - (puntos[k + 1] + azar()) / LADO) * tam;
        f[i * 4 + 2] = (azar() - 0.5) * 0.12 * escala;
        f[i * 4 + 3] = 0.75 + azar() * 0.25;
        color[i * 3] = puntos[k + 2];
        color[i * 3 + 1] = puntos[k + 3];
        color[i * 3 + 2] = puntos[k + 4];
    }
    return { logo: f, colorLogo: color };
}

/** Arma todas las figuras para n partículas */
export function crearFormas(n: number, d: Disposicion, imagenLogo: HTMLImageElement | null): Formas {
    const azar = generador(20261031);
    const mar = crearMar(n, azar);
    const gota = crearGota(n, azar, d);
    const papel = crearPapel(n, azar, d);
    const { golfo, puerto } = crearGolfo(n, azar, d);
    const { logo, colorLogo } = crearLogo(n, azar, d, imagenLogo);
    const extra = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
        extra[i * 4] = azar();
        extra[i * 4 + 1] = 0.6 + azar() * 0.8;
        extra[i * 4 + 2] = azar() * Math.PI * 2;
        extra[i * 4 + 3] = azar();
    }
    const { cx } = centro(d);
    return { n, mar, gota, papel, golfo, logo, colorLogo, azar: extra, impacto: [cx, ALTURA_MAR, -1.6], puerto };
}

function normalizar(v: number[]) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
}
function punto(a: number[], b: number[]) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function gauss(azar: () => number) {
    return Math.sqrt(-2 * Math.log(azar() + 1e-9)) * Math.cos(2 * Math.PI * azar());
}
