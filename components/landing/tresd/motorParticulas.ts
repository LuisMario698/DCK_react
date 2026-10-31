import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    Vector3,
    WebGLRenderer,
} from 'three';
import { crearFormas, type Formas } from './formas';
import { RUIDO_GLSL } from './ruido';

/**
 * El «Mar de partículas»: miles de puntos de luz que cambian de figura según cuánto se ha bajado.
 * Este archivo no sabe nada de React: la sección (MarDeParticulas.tsx) le pasa el avance y él
 * dibuja. Se carga con import() sólo cuando la sección existe, así three.js no pesa en la carga.
 *
 * Etapas (uEtapa, de 0 a 5): mar → gota → mancha → papel → golfo → símbolo. Entre una y otra cada
 * partícula viaja con un pequeño retraso propio y un remolino de ruido, así la figura se deshace y
 * se rehace como agua. El avance llega en bruto y aquí se suaviza (la figura sigue al scroll con un
 * leve arrastre, nunca brinca).
 */

export interface OpcionesMotor {
    movil: boolean;
    /** "Reducir movimiento": sin olas, sin remolinos, cambios directos */
    reducido: boolean;
    imagenLogo: HTMLImageElement | null;
}

export interface EstadoMotor {
    /** Puerto Peñasco en la pantalla (px CSS dentro del canvas) */
    puertoX: number;
    puertoY: number;
}

export interface MotorParticulas {
    /** etapa 0–5 y mancha 0–1, en bruto; dt en segundos */
    actualizar(etapa: number, mancha: number, dt: number): EstadoMotor;
    puntero(x: number | null, y: number | null): void;
    redimensionar(): void;
    /** Vuelve a leer los colores de SiMAR (al cambiar entre tema claro y oscuro) */
    leerColores(): void;
    destruir(): void;
}

const VERTICE = /* glsl */ `
uniform float uEtapa;
uniform float uTiempo;
uniform float uMancha;
uniform vec3 uImpacto;
uniform float uEscalaPx;
uniform vec3 uPuntero;
uniform float uFuerzaPuntero;
uniform float uMovimiento;
uniform vec3 cMarea;
uniform vec3 cGolfo;
uniform vec3 cEspuma;
uniform vec3 cAceite;
uniform vec3 cAceiteOscuro;
uniform vec3 cPapel;

attribute vec4 aMar;
attribute vec4 aGota;
attribute vec4 aPapel;
attribute vec4 aGolfo;
attribute vec4 aLogo;
attribute vec3 aColorLogo;
attribute vec4 aAzar;

varying vec3 vColor;
varying float vAlfa;

${RUIDO_GLSL}

float radioMancha() {
    return 0.06 * pow(140.0, uMancha);
}

// Olas: se calman donde hay aceite (de verdad: la película de aceite aplana el oleaje)
vec3 olear(vec3 p, float conMancha) {
    float calma = 1.0;
    if (conMancha > 0.5) {
        float s = length(p.xz - uImpacto.xz) / radioMancha();
        calma = mix(0.25, 1.0, smoothstep(0.85, 1.1, s));
    }
    float t = uTiempo * uMovimiento;
    float y = sin(p.x * 0.55 + t * 0.7) * cos(p.z * 0.42 + t * 0.5) * 0.2
            + sin(p.x * 1.3 - p.z * 1.1 + t * 1.2) * 0.07
            + snoise(vec3(p.xz * 0.35, t * 0.12)) * 0.12;
    return vec3(p.x, p.y + y * calma, p.z);
}

vec3 posicionDe(float k) {
    if (k < 0.5) return olear(aMar.xyz, 0.0);
    if (k < 1.5) return aGota.xyz;
    if (k < 2.5) return olear(aMar.xyz, 1.0);
    if (k < 3.5) return aPapel.xyz;
    if (k < 4.5) return aGolfo.xyz;
    return aLogo.xyz;
}

vec3 colorMar(vec3 p) {
    float alto = clamp((p.y - aMar.y) * 3.0 + 0.45, 0.0, 1.0);
    vec3 c = mix(cMarea, cGolfo, 0.3 + 0.7 * alto);
    c = mix(c, cEspuma, alto * alto * 0.75);
    return c * (0.6 + 0.8 * aMar.w);
}

vec3 colorDe(float k, vec3 p) {
    if (k < 0.5) return colorMar(p);
    if (k < 1.5) {
        float s = aGota.w;
        vec3 c = mix(cAceiteOscuro, cAceite, clamp(s, 0.0, 1.0));
        return c + vec3(1.0, 0.93, 0.8) * max(0.0, s - 1.0) * 0.8;
    }
    if (k < 2.5) {
        float d = length(p.xz - uImpacto.xz);
        float s = d / radioMancha();
        // La película de aceite: oscura y dorada, con un tornasol leve, y la orilla encendida
        vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + d * 0.5 + snoise(p * 0.45) * 0.35));
        vec3 pelicula = mix(cAceite * 0.85, irid * 0.9, 0.38) * (0.6 + 0.6 * aMar.w);
        float dentro = 1.0 - smoothstep(0.9, 1.0, s);
        float borde = exp(-pow((s - 0.96) * 11.0, 2.0));
        return mix(colorMar(p), pelicula, dentro) + cAceite * borde * 1.1;
    }
    if (k < 3.5) return cPapel * aPapel.w;
    if (k < 4.5) {
        if (aGolfo.w > 2.8) return mix(cEspuma, vec3(1.0), 0.45) * 1.5;
        if (aGolfo.w > 2.0) return cEspuma * 0.9;
        if (aGolfo.w > 1.5) return mix(cMarea, cEspuma, 0.3) * 0.22;
        return mix(cMarea, cGolfo, aGolfo.w) * (0.45 + 1.0 * aGolfo.w);
    }
    return aColorLogo * aLogo.w * 1.1;
}

float tamanoDe(float k) {
    if (k < 0.5) return 1.0;
    if (k < 1.5) return 1.05;
    if (k < 2.5) {
        float s = length(aMar.xz - uImpacto.xz) / radioMancha();
        return 1.0 + 0.45 * (1.0 - smoothstep(0.85, 1.0, s));
    }
    if (k < 3.5) return 0.95;
    if (k < 4.5) return aGolfo.w > 2.8 ? 2.0 : (aGolfo.w > 2.0 ? 1.3 : 0.95);
    return 1.1;
}

// Cuánto brilla cada figura (la gota y el símbolo juntan muchas partículas: van más tenues)
float intensidadDe(float k) {
    if (k < 0.5) return 1.1;
    if (k < 1.5) return 0.8;
    if (k < 2.5) return 1.15;
    if (k < 3.5) return 1.0;
    if (k < 4.5) return 1.15;
    return 0.85;
}

vec3 bezier(vec3 a, vec3 c, vec3 b, float t) {
    float u = 1.0 - t;
    return u * u * a + 2.0 * u * t * c + t * t * b;
}

void main() {
    float k0 = floor(uEtapa);
    float k1 = min(k0 + 1.0, 5.0);
    float fr = uEtapa - k0;
    float azar = aAzar.x;

    vec3 a = posicionDe(k0);
    vec3 b = posicionDe(k1);
    float t;
    vec3 p;

    if (k0 > 0.5 && k0 < 1.5) {
        // La gota cae y salpica: primero baja entera, luego cada partícula sale disparada a su
        // lugar en el mar, las de cerca del impacto primero
        float cae = smoothstep(0.0, 0.42, fr);
        cae = cae * cae * cae;
        vec3 a2 = a + vec3(0.0, (uImpacto.y - (a.y - 1.0)) * cae * 0.82, 0.0);
        float lejos = clamp(length(b.xz - uImpacto.xz) / 14.0, 0.0, 1.0);
        float ini = 0.34 + lejos * 0.18 + azar * 0.12;
        t = smoothstep(ini, ini + 0.36, fr);
        vec3 control = uImpacto + vec3(0.0, 0.35 + azar * 0.9, 0.0);
        p = bezier(a2, control, b, t);
    } else {
        float retraso = azar * 0.38;
        t = smoothstep(retraso, retraso + 0.62, fr);
        vec3 control = mix(a, b, 0.5);
        if (k0 < 0.5) {
            // Del mar sube a la gota: se junta desde abajo
            control = vec3(mix(a.x, b.x, 0.75), uImpacto.y + 0.2, mix(a.z, b.z, 0.75));
        }
        p = bezier(a, control, b, t);
        float giro = sin(t * 3.14159) * uMovimiento;
        vec3 q = p * 0.32 + vec3(0.0, 0.0, uTiempo * 0.05);
        p += vec3(snoise(q), snoise(q + 31.7), snoise(q + 63.1)) * giro * 0.65;
    }

    // Respira un poco cuando está quieto
    vec3 r = p * 0.6 + vec3(uTiempo * 0.08, 0.0, 0.0);
    p += vec3(snoise(r + 11.0), snoise(r + 23.0), snoise(r + 47.0)) * 0.018 * uMovimiento;

    // El puntero aparta las partículas, como un dedo en el agua
    vec2 dir = p.xy - uPuntero.xy;
    float d2 = dot(dir, dir);
    p.xy += normalize(dir + 1e-5) * uFuerzaPuntero * 0.32 * exp(-d2 * 2.4);

    vec3 color = mix(colorDe(k0, a), colorDe(k1, b), t) * mix(intensidadDe(k0), intensidadDe(k1), t);
    float tam = mix(tamanoDe(k0), tamanoDe(k1), t) * aAzar.y;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float prof = -mv.z;
    gl_PointSize = clamp(tam * uEscalaPx / prof, 1.0, 34.0);
    gl_Position = projectionMatrix * mv;

    // Lo lejano se apaga (niebla) y lo muy cercano también (no tapa el texto)
    vAlfa = clamp(1.25 - (prof - 9.0) * 0.06, 0.12, 1.0) * smoothstep(1.2, 3.6, prof);
    vColor = color;
}
`;

const FRAGMENTO = /* glsl */ `
varying vec3 vColor;
varying float vAlfa;
void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.05, d);
    a *= a;
    gl_FragColor = vec4(vColor * a * vAlfa, 1.0);
}
`;

/** Cámara por etapa: [posición y, mirar a y, distancia] */
const CAMARAS: [number, number, number][] = [
    [0.6, 0.62, 9.2],
    [0.1, 0.15, 8.6],
    [1.5, -0.35, 9.0],
    [0.0, 0.0, 8.6],
    [-0.2, 0.1, 8.4],
    [0.0, 0.05, 8.8],
];

/** Lee un color de las variables de SiMAR (así sigue los tokens de app/globals.css) */
function colorCss(variable: string, respaldo: string) {
    const valor = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    try {
        return new Color(valor || respaldo);
    } catch {
        return new Color(respaldo);
    }
}

export function crearMotorParticulas(canvas: HTMLCanvasElement, opciones: OpcionesMotor): MotorParticulas | null {
    let renderer: WebGLRenderer;
    try {
        renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch {
        return null;
    }
    renderer.setClearColor(colorCss('--simar-abismo', '#0B2236'), 1);

    const escena = new Scene();
    const camara = new PerspectiveCamera(40, 1, 0.1, 80);
    camara.position.set(0, 0, 9);

    let movil = opciones.movil;
    const nParticulas = () => {
        if (movil) return 9000;
        const nucleos = navigator.hardwareConcurrency || 4;
        return nucleos <= 4 ? 13000 : 20000;
    };

    const geometria = new BufferGeometry();
    let formas: Formas;
    const cargarFormas = () => {
        formas = crearFormas(nParticulas(), { movil }, opciones.imagenLogo);
        geometria.setAttribute('position', new BufferAttribute(formas.mar.slice(0, formas.n * 4).filter((_, i) => i % 4 !== 3), 3));
        geometria.setAttribute('aMar', new BufferAttribute(formas.mar, 4));
        geometria.setAttribute('aGota', new BufferAttribute(formas.gota, 4));
        geometria.setAttribute('aPapel', new BufferAttribute(formas.papel, 4));
        geometria.setAttribute('aGolfo', new BufferAttribute(formas.golfo, 4));
        geometria.setAttribute('aLogo', new BufferAttribute(formas.logo, 4));
        geometria.setAttribute('aColorLogo', new BufferAttribute(formas.colorLogo, 3));
        geometria.setAttribute('aAzar', new BufferAttribute(formas.azar, 4));
        // Las partículas se mueven en el shader: la esfera de recorte no sirve
        geometria.boundingSphere = null;
        material.uniforms.uImpacto.value.set(...formas.impacto);
    };

    const material = new ShaderMaterial({
        vertexShader: VERTICE,
        fragmentShader: FRAGMENTO,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
            uEtapa: { value: 0 },
            uTiempo: { value: 0 },
            uMancha: { value: 0 },
            uImpacto: { value: new Vector3() },
            uEscalaPx: { value: 30 },
            uPuntero: { value: new Vector3(99, 99, 0) },
            uFuerzaPuntero: { value: 0 },
            uMovimiento: { value: opciones.reducido ? 0 : 1 },
            cMarea: { value: colorCss('--simar-marea', '#1B5FC9') },
            cGolfo: { value: colorCss('--simar-golfo', '#20B2C4') },
            cEspuma: { value: colorCss('--simar-espuma', '#7FE0D6') },
            cAceite: { value: colorCss('--simar-aceite', '#F2C14E') },
            cAceiteOscuro: { value: new Color('#4A2508') },
            cPapel: { value: new Color('#EFE8DA') },
        },
    });
    cargarFormas();

    const puntos = new Points(geometria, material);
    puntos.frustumCulled = false;
    escena.add(puntos);

    // Estado suavizado
    let etapa = 0;
    let mancha = 0;
    let tiempo = 0;
    let fuerza = 0;
    const objetivoPuntero = new Vector3(99, 99, 0);
    let hayPuntero = false;
    let ancho = 1;
    let alto = 1;
    const mirar = new Vector3();
    const puertoMundo = new Vector3();

    const redimensionar = () => {
        const rect = canvas.getBoundingClientRect();
        ancho = Math.max(1, rect.width);
        alto = Math.max(1, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.75 : 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(ancho, alto, false);
        camara.aspect = ancho / alto;
        // En pantallas angostas la cámara se aleja para que quepa el ancho
        camara.fov = camara.aspect < 0.8 ? 52 : 40;
        camara.updateProjectionMatrix();
        material.uniforms.uEscalaPx.value = alto * dpr * 0.052 * (movil ? 0.9 : 1);
        const ahoraMovil = ancho < 768;
        if (ahoraMovil !== movil) {
            movil = ahoraMovil;
            cargarFormas();
        }
    };
    redimensionar();

    const camaraEn = (e: number) => {
        const k0 = Math.floor(e);
        const k1 = Math.min(k0 + 1, CAMARAS.length - 1);
        const f = e - k0;
        const s = f * f * (3 - 2 * f);
        const a = CAMARAS[Math.min(k0, CAMARAS.length - 1)];
        const b = CAMARAS[k1];
        return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
    };

    return {
        actualizar(etapaObjetivo, manchaObjetivo, dt) {
            if (opciones.reducido) {
                // Sin viaje: cada parada cambia de golpe
                etapa = Math.round(etapaObjetivo);
                mancha = etapa === 2 ? 1 : 0;
            } else {
                const k = 1 - Math.exp(-dt * 4.2);
                etapa += (etapaObjetivo - etapa) * k;
                mancha += (manchaObjetivo - mancha) * (1 - Math.exp(-dt * 3.2));
                if (Math.abs(etapaObjetivo - etapa) < 0.0004) etapa = etapaObjetivo;
                tiempo += dt;
            }
            fuerza += ((hayPuntero ? 1 : 0) - fuerza) * (1 - Math.exp(-dt * 3));
            const u = material.uniforms;
            u.uEtapa.value = etapa;
            u.uMancha.value = mancha;
            u.uTiempo.value = tiempo;
            u.uFuerzaPuntero.value = opciones.reducido ? 0 : fuerza;
            (u.uPuntero.value as Vector3).lerp(objetivoPuntero, 1 - Math.exp(-dt * 8));

            const [py, my, dist] = camaraEn(etapa);
            // Un giro leve con el puntero: se siente el volumen
            const px = hayPuntero && !opciones.reducido ? objetivoPuntero.x * 0.04 : 0;
            camara.position.set(px, py, dist);
            mirar.set(0, my, 0);
            camara.lookAt(mirar);
            renderer.render(escena, camara);

            puertoMundo.set(...formas.puerto).project(camara);
            return { puertoX: (puertoMundo.x * 0.5 + 0.5) * ancho, puertoY: (0.5 - puertoMundo.y * 0.5) * alto };
        },
        puntero(x, y) {
            if (x === null || y === null) {
                hayPuntero = false;
                return;
            }
            hayPuntero = true;
            // Del pixel al plano z = 0
            const v = new Vector3((x / ancho) * 2 - 1, -(y / alto) * 2 + 1, 0.5).unproject(camara);
            const dir = v.sub(camara.position).normalize();
            const t = -camara.position.z / dir.z;
            objetivoPuntero.copy(camara.position).add(dir.multiplyScalar(t));
        },
        redimensionar,
        leerColores() {
            renderer.setClearColor(colorCss('--simar-abismo', '#0B2236'), 1);
            const u = material.uniforms;
            (u.cMarea.value as Color).copy(colorCss('--simar-marea', '#1B5FC9'));
            (u.cGolfo.value as Color).copy(colorCss('--simar-golfo', '#20B2C4'));
            (u.cEspuma.value as Color).copy(colorCss('--simar-espuma', '#7FE0D6'));
        },
        destruir() {
            geometria.dispose();
            material.dispose();
            renderer.dispose();
        },
    };
}
