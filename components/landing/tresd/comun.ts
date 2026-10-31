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

/** Avance (0–1) de una sección fija: qué tanto de su scroll ya pasó */
export function avanceDe(seccion: HTMLElement) {
    const r = seccion.getBoundingClientRect();
    const recorrido = Math.max(1, r.height - window.innerHeight);
    return Math.min(1, Math.max(0, -r.top / recorrido));
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
