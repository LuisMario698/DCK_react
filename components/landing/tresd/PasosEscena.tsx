'use client';

import { TIEMPOS, rampa, type Recorrido } from './comun';

/**
 * Los pasos de una escena fija (el mar de partículas y la laptop):
 *
 *  - `BarraPasos`: una barra de avance por partes, una por parada. Cada parte se llena al llegar a
 *    su parada, así se sabe cuánto falta, y al tocarla lleva a esa parada. Arriba en celular y
 *    vertical a la derecha en computadora. La escena la pinta en su requestAnimationFrame con
 *    `pintarPasos` (sin volver a renderizar React).
 *  - `ImanesPasos`: un imán (scroll-snap) por parada, sólo en pantallas táctiles: un deslizón deja
 *    el scroll a media lectura de la siguiente parada en vez de pasarse de largo.
 */

/** Dónde se detiene el imán de cada parada, dentro de su tramo (0–1) */
export type Imanes = number[];

export function BarraPasos({
    etiquetas,
    recorrido,
    imanes,
    tono,
    nombre,
}: {
    etiquetas: string[];
    recorrido: Recorrido;
    imanes: Imanes;
    tono: 'oscuro' | 'claro';
    /** Para el lector de pantalla: «Pasos de la historia» */
    nombre: string;
}) {
    const ir = (j: number, boton: HTMLElement) => {
        const seccion = boton.closest('section');
        if (!seccion) return;
        const arriba = seccion.getBoundingClientRect().top + window.scrollY;
        const destino = arriba + recorrido.avance(j + imanes[j]) * Math.max(0, seccion.offsetHeight - window.innerHeight);
        const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: destino, behavior: quieto ? 'auto' : 'smooth' });
    };
    const oscuro = tono === 'oscuro';

    return (
        <nav
            aria-label={nombre}
            className="absolute z-10 inset-x-5 top-[calc(env(safe-area-inset-top)+76px)] flex md:inset-x-auto md:top-1/2 md:-translate-y-1/2 md:right-4 md:flex-col"
        >
            {etiquetas.map((etiqueta, j) => (
                <button
                    key={etiqueta}
                    type="button"
                    data-paso={j}
                    onClick={(e) => ir(j, e.currentTarget)}
                    aria-label={`${j + 1} de ${etiquetas.length}: ${etiqueta}`}
                    className="group relative flex-1 h-[44px] flex items-center px-[3px] cursor-pointer md:flex-none md:w-[44px] md:h-[38px] md:px-0 md:py-[4px] md:justify-center focus-visible:outline-none"
                >
                    <span
                        className={`relative block w-full h-[4px] rounded-full overflow-hidden md:w-[4px] md:h-full transition-[box-shadow] group-focus-visible:ring-2 group-focus-visible:ring-offset-2 ${
                            oscuro
                                ? 'bg-white/20 group-focus-visible:ring-white group-focus-visible:ring-offset-simar-abismo'
                                : 'bg-simar-texto/15 group-focus-visible:ring-simar-golfo group-focus-visible:ring-offset-simar-superficie'
                        }`}
                    >
                        <span
                            data-relleno={j}
                            style={{ transform: j === 0 ? 'none' : 'scaleX(0)' }}
                            className={`absolute inset-0 rounded-full origin-left md:origin-top ${oscuro ? 'bg-white' : 'bg-simar-marea'}`}
                        />
                    </span>
                    {/* El nombre de la parada al pasar el puntero o enfocar (computadora) */}
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute right-full mr-1 top-1/2 -translate-y-1/2 hidden md:block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[15px] font-bold opacity-0 translate-x-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 ${
                            oscuro ? 'bg-white/12 text-white backdrop-blur-md border border-white/15' : 'bg-simar-superficie text-simar-texto border border-simar-borde shadow-simar'
                        }`}
                    >
                        {etiqueta}
                    </span>
                </button>
            ))}
        </nav>
    );
}

/** Los imanes van en la sección (no en el escenario fijo); `colocarImanes` los pone en su lugar */
export function ImanesPasos({ pasos }: { pasos: number }) {
    return (
        <>
            {Array.from({ length: pasos }, (_, j) => (
                <div key={j} data-iman={j} aria-hidden="true" className="t3-iman pointer-events-none absolute left-0 top-0 w-px h-px" />
            ))}
        </>
    );
}

export function colocarImanes(seccion: HTMLElement, recorrido: Recorrido, imanes: Imanes) {
    const scroll = Math.max(0, seccion.offsetHeight - window.innerHeight);
    seccion.querySelectorAll<HTMLElement>('[data-iman]').forEach((el) => {
        const j = Number(el.dataset.iman);
        el.style.top = `${Math.round(recorrido.avance(j + imanes[j]) * scroll)}px`;
    });
}

/** Llena la barra según la posición (j + t). Devuelve la parada actual */
export function pintarPasos(rellenos: HTMLElement[], botones: HTMLElement[], posicion: number, vertical: boolean) {
    let actual = 0;
    for (const el of rellenos) {
        const j = Number(el.dataset.relleno);
        const lleno = j === 0 ? 1 : rampa(posicion - (j - 1), TIEMPOS.viaje[0], TIEMPOS.viaje[1]);
        if (lleno >= 0.5) actual = Math.max(actual, j);
        el.style.transform = vertical ? `scaleY(${lleno.toFixed(3)})` : `scaleX(${lleno.toFixed(3)})`;
    }
    for (const b of botones) {
        if (Number(b.dataset.paso) === actual) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
    }
    return actual;
}
