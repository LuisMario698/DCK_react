'use client';

/**
 * La lente líquida: una pastilla que se desliza entre opciones (el selector de «Lectura», los enlaces
 * de la isla) como una gota de vidrio. No es un rectángulo que viaja: el borde de adelante llega
 * primero y el de atrás lo alcanza, así se estira en el camino y se encoge al llegar, y se aplasta un
 * poco (como el vidrio líquido de Apple cuando se mueve).
 *
 * La lente es una capa del ancho de su pista recortada con `clip-path: inset(... round)`: así la
 * pastilla siempre conserva sus puntas redondas (escalarla las deformaría) y, si la capa lleva otra
 * copia de las etiquetas en otro color, el texto cambia de color justo donde pasa la lente.
 *
 * Siempre parte de lo que se ve en pantalla (el recorte calculado a media animación): si se cambia de
 * opción mientras se mueve, sigue desde ahí sin saltos (Apple: interrumpible). Web Animations API,
 * sin React a media animación.
 */

/** Cuánto se recorta a la izquierda y a la derecha (en px, dentro de la capa) */
export interface Tramo {
    izq: number;
    der: number;
}

/** El recorte que se ve ahora (a media animación, el de ese instante) */
export function tramoActual(el: HTMLElement): Tramo | null {
    const recorte = getComputedStyle(el).clipPath;
    if (!recorte.startsWith('inset(')) return null;
    const n = recorte.slice(6).split('round')[0].trim().split(/\s+/).map(parseFloat);
    if (n.some(Number.isNaN)) return null;
    const [arriba, der = arriba, , izq = der] = n;
    return { izq, der };
}

const recorte = (t: Tramo, v: number, radio: number) => `inset(${v}px ${t.der.toFixed(1)}px ${v}px ${t.izq.toFixed(1)}px round ${radio}px)`;

/**
 * Mueve la lente al tramo `hasta`. `parcial` (0–1) la lleva sólo un poco hacia allá (al presionar,
 * antes de soltar: responde en el instante en que se toca).
 */
export function moverLente(
    el: HTMLElement,
    hasta: Tramo,
    { vertical = 4, radio = 999, quieto = false, aplastar = 0.92, ms = 440 }: { vertical?: number; radio?: number; quieto?: boolean; aplastar?: number; ms?: number } = {},
) {
    const desde = tramoActual(el);
    el.getAnimations().forEach((a) => a.cancel());
    el.style.clipPath = recorte(hasta, vertical, radio);
    if (!desde || quieto) return;
    if (Math.abs(desde.izq - hasta.izq) < 0.5 && Math.abs(desde.der - hasta.der) < 0.5) return;
    // El borde de adelante va primero; el de atrás, después (se estira y luego se recoge)
    const aDerecha = hasta.izq > desde.izq;
    const adelante = 0.82;
    const atras = 0.2;
    const medio: Tramo = aDerecha
        ? { izq: desde.izq + (hasta.izq - desde.izq) * atras, der: desde.der + (hasta.der - desde.der) * adelante }
        : { izq: desde.izq + (hasta.izq - desde.izq) * adelante, der: desde.der + (hasta.der - desde.der) * atras };
    el.animate(
        [
            { clipPath: recorte(desde, vertical, radio), transform: 'scale(1, 1)' },
            { clipPath: recorte(medio, vertical, radio), transform: `scale(1, ${aplastar})`, offset: 0.42 },
            { clipPath: recorte(hasta, vertical, radio), transform: 'scale(1, 1)' },
        ],
        { duration: ms, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' },
    );
}

/** El tramo que ocupa `objetivo` dentro de `capa` (con `holgura` px de más a cada lado) */
export function tramoDe(capa: HTMLElement, objetivo: HTMLElement, holgura = 0): Tramo {
    const c = capa.getBoundingClientRect();
    const o = objetivo.getBoundingClientRect();
    // Las medidas en pantalla incluyen transformaciones (la gota que crece): se pasan a la escala de la capa
    const escala = capa.offsetWidth ? c.width / capa.offsetWidth : 1;
    return {
        izq: (o.left - c.left) / escala - holgura,
        der: (c.right - o.right) / escala - holgura,
    };
}
