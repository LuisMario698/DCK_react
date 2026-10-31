/**
 * Piezas comunes de la landing 3D: cuentas del scroll y el aviso de "reducir movimiento".
 */
export { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';

/** 0 antes de `a`, 1 después de `b` y una recta entre los dos */
export function rampa(x: number, a: number, b: number) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    return (x - a) / (b - a);
}

/** Sale y llega despacio (smoothstep sobre 0–1) */
export function suave(t: number) {
    return t * t * (3 - 2 * t);
}

/** Número con separador de miles a la mexicana */
export const cifra = (n: number, decimales = 0) =>
    n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/* ── El recorrido de una escena fija ────────────────────────────────────────────────────────
 *
 * Cada escena (el mar de partículas y la laptop) es una sección alta con un escenario pegado
 * arriba. Su scroll se reparte en paradas; cada parada tiene un peso (cuánto scroll le toca) y,
 * dentro de su tramo (de 0 a 1):
 *
 *   0 ─────────── lectura ─────────── 0.56 · 0.6 ─── viaje ─── 0.93 · 1
 *   el texto se lee quieto            se va    la figura viaja a la siguiente;
 *                                              al final llega el texto siguiente
 *
 * La «posición» es j + t (parada j, t dentro de su tramo). En celular, un imán (scroll-snap) por
 * parada deja el scroll a media lectura, así un deslizón lleva a la siguiente y no se pasa de largo.
 */

/** Scroll (vh) por cada unidad de peso de una parada */
export const VH_POR_PASO = 85;

/** Dentro del tramo de una parada */
export const TIEMPOS = {
    /** El texto de la parada se va */
    sale: [0.56, 0.68] as const,
    /** La figura viaja a la siguiente parada */
    viaje: [0.6, 0.93] as const,
    /** El texto de la siguiente parada llega (al final de este tramo) */
    entra: [0.86, 0.98] as const,
};

export interface Recorrido {
    pasos: number;
    /** Alto de la sección (CSS) */
    alto: string;
    /** De avance (0–1 del scroll de la sección) a posición (j + t) */
    posicion(avance: number): number;
    /** De posición a avance */
    avance(posicion: number): number;
}

export function crearRecorrido(pesos: number[]): Recorrido {
    const total = pesos.reduce((a, b) => a + b, 0);
    const inicios: number[] = [];
    let suma = 0;
    for (const p of pesos) {
        inicios.push(suma / total);
        suma += p;
    }
    return {
        pasos: pesos.length,
        alto: `calc(${(total * VH_POR_PASO).toFixed(1)}vh + 100svh)`,
        posicion(avance) {
            const a = Math.min(1, Math.max(0, avance));
            let j = pesos.length - 1;
            while (j > 0 && inicios[j] > a) j--;
            const t = (a - inicios[j]) / (pesos[j] / total);
            return j + Math.min(1, t);
        },
        avance(posicion) {
            const j = Math.min(pesos.length - 1, Math.max(0, Math.floor(posicion)));
            const t = Math.min(1, Math.max(0, posicion - j));
            return inicios[j] + (t * pesos[j]) / total;
        },
    };
}

/**
 * Cuánto scroll (px) tiene una sección fija: su alto menos el del escenario pegado
 * (`[data-escenario]`, 100svh). Se mide con el escenario y no con `innerHeight` porque en el
 * celular la barra del navegador sube y baja al hacer scroll: `innerHeight` cambia y la escena
 * brincaba; el alto del escenario no cambia.
 */
export function scrollDe(seccion: HTMLElement) {
    const escenario = seccion.querySelector<HTMLElement>('[data-escenario]');
    return Math.max(1, seccion.offsetHeight - (escenario?.offsetHeight ?? window.innerHeight));
}

/** Avance (0–1) de una sección fija: qué tanto de su scroll ya pasó */
export function avanceDe(seccion: HTMLElement, scroll = scrollDe(seccion)) {
    const r = seccion.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / scroll));
}

/* ── El seguimiento del scroll ──────────────────────────────────────────────────────────────
 *
 * La escena no copia el scroll tal cual: lo sigue con un resorte amortiguado (el SmoothDamp de
 * Unity, «Game Programming Gems 4», cap. 1.10). Así:
 *  - con scroll lento va pegada al dedo (se atrasa unos 0.15 s, no se nota);
 *  - con un deslizón rápido no brinca: alcanza al dedo con su propia curva, sin pasarse, y con
 *    un límite de velocidad para que las figuras no se atropellen;
 *  - al soltar, llega frenando, sin rebote.
 * Textos, barras y figuras leen la misma posición seguida: siempre van juntos.
 */
export interface Seguidor {
    readonly valor: number;
    /** Paradas por segundo (con signo) */
    readonly velocidad: number;
    seguir(objetivo: number, dt: number): number;
    saltar(valor: number): void;
}

export function crearSeguidor(tiempo = 0.16, velocidadMaxima = 6.5): Seguidor {
    let valor = Number.NaN;
    let velocidad = 0;
    return {
        get valor() {
            return valor;
        },
        get velocidad() {
            return velocidad;
        },
        saltar(v) {
            valor = v;
            velocidad = 0;
        },
        seguir(objetivo, dt) {
            if (Number.isNaN(valor) || dt <= 0) {
                if (Number.isNaN(valor)) valor = objetivo;
                return valor;
            }
            const omega = 2 / tiempo;
            const x = omega * dt;
            const factor = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
            const maximo = velocidadMaxima * tiempo;
            const cambio = Math.min(maximo, Math.max(-maximo, valor - objetivo));
            const destino = valor - cambio;
            const temp = (velocidad + omega * cambio) * dt;
            velocidad = (velocidad - omega * temp) * factor;
            let salida = destino + (cambio + temp) * factor;
            // Nunca se pasa del objetivo
            if (objetivo - valor > 0 === salida > objetivo) {
                salida = objetivo;
                velocidad = 0;
            }
            valor = salida;
            return valor;
        },
    };
}

/**
 * Con un deslizón rápido los textos de las paradas que se cruzan no deben parpadear: «prisa»
 * va de 0 (lectura) a 1 (pasando de largo) según la velocidad, y baja despacio al frenar para
 * que el texto donde se llega aparezca con calma.
 */
export function crearPrisa() {
    let prisa = 0;
    return (velocidad: number, dt: number) => {
        const objetivo = rampa(Math.abs(velocidad), 1.4, 2.8);
        // Sube rápido (se apaga al acelerar) y baja más despacio (se enciende al frenar)
        const k = objetivo > prisa ? 14 : 6;
        prisa += (objetivo - prisa) * (1 - Math.exp(-dt * k));
        return prisa;
    };
}

/** Etapa de la figura (0 a pasos − 1) en una posición */
export function etapaEn(posicion: number, pasos: number) {
    if (posicion >= pasos - 1) return pasos - 1;
    const j = Math.floor(posicion);
    return j + suave(rampa(posicion - j, TIEMPOS.viaje[0], TIEMPOS.viaje[1]));
}

/** Cuánto se ve el texto de la parada j: [llega, se va] (1 = del todo) */
export function textoEn(posicion: number, j: number, pasos: number): [number, number] {
    const entra = j === 0 ? 1 : rampa(posicion, j - 1 + TIEMPOS.entra[0], j - 1 + TIEMPOS.entra[1]);
    const sale = j === pasos - 1 ? 1 : 1 - rampa(posicion, j + TIEMPOS.sale[0], j + TIEMPOS.sale[1]);
    return [entra, sale];
}

/**
 * Calidad que se ajusta sola. Si los cuadros tardan (un celular modesto, o con ahorro de
 * batería), baja un escalón la densidad de píxeles del lienzo hasta `minimo`: se ve un poco menos
 * nítido pero el scroll sigue fluido. Nunca la vuelve a subir, para que no oscile.
 */
export function crearAjustePixeles(maximo: number, minimo = 1) {
    let dpr = Math.max(minimo, maximo);
    let suma = 0;
    let cuadros = 0;
    // Los primeros cuadros no cuentan: ahí se compilan los shaders y se suben las texturas
    let calentando = 60;
    return {
        get dpr() {
            return dpr;
        },
        /** Cuenta un cuadro dibujado justo después de otro; true si hay que bajar la calidad */
        medir(dt: number) {
            if (dt <= 0 || dt > 0.2) return false;
            if (calentando > 0) {
                calentando--;
                return false;
            }
            suma += dt;
            cuadros++;
            if (cuadros < 45) return false;
            const promedio = suma / cuadros;
            suma = 0;
            cuadros = 0;
            // Menos de ~45 cuadros por segundo: un escalón abajo
            if (promedio > 1 / 45 && dpr > minimo) {
                dpr = Math.max(minimo, dpr - 0.25);
                return true;
            }
            return false;
        },
    };
}
