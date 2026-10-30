/**
 * Física para jalar una hoja hacia abajo, como en iOS. La usan `HojaInferior` y las ventanas que en
 * celular suben como hoja (`arrastrarVentana`, desde `useVentanaAccesible`). Ver DISEÑO_SIMAR.md →
 * "Versión móvil".
 */

/** Frenado con el que se proyecta un tirón: el mismo del desplazamiento de iOS */
const DESACELERACION = 0.998;
/** Si la hoja quedaría (con el impulso del dedo) más abajo que esto, se cierra. Nunca más de media hoja */
export const CIERRE = 100;
/** Lo que el dedo baja antes de que cuente como arrastre (un toque sigue siendo toque) */
export const HOLGURA = 8;
/** Resorte sin rebote para soltar la hoja: llega en ~0.3 s */
const RIGIDEZ = ((2 * Math.PI) / 0.3) ** 2;
const AMORTIGUAMIENTO = 2 * Math.sqrt(RIGIDEZ);

/** Dónde quedaría la hoja si siguiera a esa velocidad (px/s) y frenara como el desplazamiento de iOS */
export function proyectar(velocidad: number) {
    return ((velocidad / 1000) * DESACELERACION) / (1 - DESACELERACION);
}

/** Más allá del tope la hoja resiste: cuanto más se jala, menos sigue al dedo (como iOS) */
export function resistir(exceso: number, alto: number) {
    return (exceso * alto * 0.55) / (alto + 0.55 * exceso);
}

/** ¿Se cierra al soltarla? Se decide con a dónde va (la posición más el impulso), no sólo con dónde está */
export function seCierra(posicion: number, velocidad: number, alto: number) {
    return posicion + proyectar(velocidad) > Math.min(alto / 2, CIERRE);
}

/** Las últimas posiciones del dedo (de los últimos 100 ms), para saber a qué velocidad iba */
export class Muestras {
    private lista: { y: number; t: number }[] = [];
    agregar(y: number) {
        const t = performance.now();
        this.lista.push({ y, t });
        while (this.lista.length > 2 && t - this.lista[0].t > 100) this.lista.shift();
    }
    /** px/s, positiva hacia abajo */
    velocidad() {
        const primera = this.lista[0];
        const ultima = this.lista[this.lista.length - 1];
        return primera && ultima.t > primera.t ? ((ultima.y - primera.y) / (ultima.t - primera.t)) * 1000 : 0;
    }
}

/**
 * Si la hoja (o su velo) todavía va entrando, la toma desde donde va y no desde su lugar final: la
 * animación de CSS deja su valor de ese momento y se detiene. Devuelve el desplazamiento de la hoja.
 */
export function tomarDesdeDondeVa(hoja: HTMLElement, ...otros: (HTMLElement | null | undefined)[]) {
    for (const el of [hoja, ...otros]) {
        el?.getAnimations().forEach((a) => {
            a.commitStyles();
            a.cancel();
        });
    }
    return new DOMMatrixReadOnly(getComputedStyle(hoja).transform).m42;
}

/**
 * Devuelve la hoja y su velo a lo que dice su clase (en su lugar, con su transición): quita lo que
 * se les puso a mano mientras los movía el dedo (o lo que dejó `tomarDesdeDondeVa`)
 */
export function soltarEstilos(hoja: HTMLElement | null | undefined, velo: HTMLElement | null | undefined) {
    hoja?.style.removeProperty('transform');
    hoja?.style.removeProperty('transition');
    velo?.style.removeProperty('opacity');
    velo?.style.removeProperty('background-color');
    velo?.style.removeProperty('transition');
}

/**
 * Mueve la hoja con un resorte sin rebote que arranca a la velocidad del dedo (sin costura entre
 * arrastrar y soltar). `terminar` decide en cada cuadro si ya llegó (y pinta el final). Devuelve
 * una función para detenerlo.
 */
export function animarResorte(
    desde: number,
    velocidad: number,
    meta: number,
    pintar: (y: number) => void,
    terminar: (y: number, v: number) => boolean
) {
    let x = desde;
    let v = velocidad;
    let antes = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
        const dt = Math.min(0.032, Math.max(0, (ahora - antes) / 1000)) / 4;
        antes = ahora;
        for (let i = 0; i < 4; i++) {
            v += (-RIGIDEZ * (x - meta) - AMORTIGUAMIENTO * v) * dt;
            x += v * dt;
        }
        if (terminar(x, v)) return;
        pintar(x);
        cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
}

/**
 * Dónde las ventanas suben como hoja (globals.css, "Ventanas en celular"). Las que son `fixed` ellas
 * mismas (la tarjeta del recorrido de la demo, que además se desliza de lado entre pasos) no se jalan
 */
const SELECTOR_HOJA = ':is(.simar-compacto, .simar-landing) .fixed > .simar-ventana:not(.fixed)';
/** Desde dónde se puede jalar una ventana: la franja de su agarradera */
const FRANJA = 44;

/**
 * En celular las ventanas (`.fixed > .simar-ventana`) suben como hoja; esto les da el mismo gesto que
 * `HojaInferior`: jalarlas hacia abajo las cierra como Escape (`cerrar`, que da `undefined` si esa
 * ventana no se cierra con Escape o no es la de arriba). Sólo se toman desde la franja de arriba
 * (44 px, donde va la agarradera) y con la ventana hasta arriba: así, al desplazar un formulario, un
 * jalón de más no lo cierra. Si al soltar la ventana no se cierra (p. ej. está guardando), regresa.
 * Se escucha en `raiz` (la ventana o el fondo que la contiene). Devuelve la limpieza.
 */
export function arrastrarVentana(raiz: HTMLElement, cerrar: () => (() => void) | undefined) {
    let hoja: HTMLElement | null = null;
    let velo: HTMLElement | null = null;
    let fondo: number[] | null = null;
    let inicio: number | null = null;
    let gesto: { desde: number; dedo: number; muestras: Muestras } | null = null;
    let posicion = 0;
    let detener = () => {};
    const reducir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pintar = (y: number) => {
        posicion = y;
        if (!hoja) return;
        if (y === 0) {
            soltarEstilos(hoja, velo);
            return;
        }
        // Mientras la mueve el dedo (o el resorte) sin la transición de su clase, que la retrasaría
        hoja.style.transition = 'none';
        hoja.style.transform = `translateY(${y}px)`;
        // El velo (el fondo oscuro que la contiene) se aclara conforme baja
        if (velo && fondo) {
            // Sólo su color (sin transición en su clase); su opacidad no, que es la de toda la ventana
            const f = Math.min(1, Math.max(0, 1 - y / hoja.offsetHeight));
            velo.style.backgroundColor = `rgba(${fondo[0]}, ${fondo[1]}, ${fondo[2]}, ${(fondo[3] ?? 1) * f})`;
        }
    };

    const regresar = (velocidad: number) => {
        if (reducir()) return pintar(0);
        detener = animarResorte(posicion, velocidad, 0, pintar, (y, v) => {
            if (Math.abs(y) < 0.5 && Math.abs(v) < 20) {
                pintar(0);
                return true;
            }
            return false;
        });
    };

    const soltar = () => {
        const g = gesto;
        gesto = null;
        if (!g || !hoja) return;
        const el = hoja;
        const velocidad = g.muestras.velocidad();
        const alto = el.offsetHeight;
        const accion = seCierra(posicion, velocidad, alto) ? cerrar() : undefined;
        if (!accion) return regresar(velocidad);
        accion();
        // Se ve en los siguientes cuadros si de verdad se cerró: o ya no está, o está saliendo
        let intentos = 3;
        const revisar = () => {
            if (!el.isConnected) return;
            if (el.classList.contains('simar-ventana-sale')) {
                // Sigue a la velocidad del dedo hasta salir (su salida de CSS arrancaría desde cero)
                el.getAnimations().forEach((a) => a.cancel());
                if (reducir()) return pintar(alto);
                detener = animarResorte(posicion, velocidad, alto * 1.15, pintar, (y) => {
                    if (y < alto) return false;
                    pintar(alto);
                    return true;
                });
                return;
            }
            if (--intentos > 0) requestAnimationFrame(revisar);
            else regresar(0);
        };
        requestAnimationFrame(revisar);
    };

    const alTocar = (e: TouchEvent) => {
        inicio = null;
        if (e.touches.length !== 1 || !window.matchMedia('(max-width: 639px)').matches) return;
        const objetivo = e.target as Element | null;
        const candidata = objetivo?.closest<HTMLElement>('.simar-ventana');
        if (!candidata || !raiz.contains(candidata) || !candidata.matches(SELECTOR_HOJA)) return;
        if (candidata.scrollTop > 0 || objetivo?.closest('input, textarea, select, canvas, .simar-desliza')) return;
        const y = e.touches[0].clientY;
        if (y - candidata.getBoundingClientRect().top > FRANJA || !cerrar()) return;
        hoja = candidata;
        velo = candidata.parentElement;
        inicio = y;
    };

    const alMover = (e: TouchEvent) => {
        if (inicio === null || !hoja) return;
        const y = e.touches[0].clientY;
        if (!gesto) {
            if (y < inicio || hoja.scrollTop > 0) {
                inicio = null;
                return;
            }
            if (e.cancelable) e.preventDefault();
            if (y - inicio < HOLGURA) return;
            detener();
            // Sólo la ventana: el fundido del velo (que es su contenedor) sigue solo
            const desde = tomarDesdeDondeVa(hoja);
            const color = velo ? getComputedStyle(velo).backgroundColor.match(/[\d.]+/g) : null;
            fondo = color && color.length >= 3 ? color.map(Number) : null;
            gesto = { desde, dedo: y, muestras: new Muestras() };
        }
        if (e.cancelable) e.preventDefault();
        gesto.muestras.agregar(y);
        const crudo = gesto.desde + y - gesto.dedo;
        pintar(crudo >= 0 ? crudo : -resistir(-crudo, hoja.offsetHeight));
    };

    const alSoltar = () => {
        inicio = null;
        soltar();
    };

    // Sólo la que se cierra con Escape se puede jalar: ésa lleva la agarradera (globals.css)
    const jalable = !!cerrar();
    if (jalable) raiz.setAttribute('data-jalable', '');
    raiz.addEventListener('touchstart', alTocar, { passive: true });
    raiz.addEventListener('touchmove', alMover, { passive: false });
    raiz.addEventListener('touchend', alSoltar);
    raiz.addEventListener('touchcancel', alSoltar);
    return () => {
        detener();
        if (jalable) raiz.removeAttribute('data-jalable');
        raiz.removeEventListener('touchstart', alTocar);
        raiz.removeEventListener('touchmove', alMover);
        raiz.removeEventListener('touchend', alSoltar);
        raiz.removeEventListener('touchcancel', alSoltar);
    };
}
