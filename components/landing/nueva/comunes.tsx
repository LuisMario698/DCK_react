'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Qué tanto se ha recorrido un bloque con el scroll, de 0 a 1. No vuelve a dibujar el componente en
 * cada cuadro: el valor va en la variable CSS `--ln-progreso` del propio bloque (para moverlo con
 * calc()) y sólo cambia el estado cuando cambia el paso activo.
 *
 * - `fijo`: el bloque es alto y lo de adentro va con position: sticky. 0 cuando su borde de arriba
 *   llega al de la pantalla, 1 cuando su borde de abajo llega al de abajo.
 * - `centro`: 0 cuando el bloque llega a la mitad de la pantalla, 1 cuando la deja atrás.
 *
 * `reparto` dice cómo se vuelve paso: `tramos` parte el recorrido en partes iguales (cada parada del
 * mar ocupa un tercio); `estaciones` toma la más cercana (la gota que viaja por un camino).
 */
export function useProgresoScroll<T extends HTMLElement>(
    pasos: number,
    modo: 'fijo' | 'centro',
    reparto: 'tramos' | 'estaciones' = 'tramos'
) {
    const ref = useRef<T>(null);
    const [activo, setActivo] = useState(0);

    useEffect(() => {
        let cuadro = 0;
        const medir = () => {
            cuadro = 0;
            const el = ref.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            // Oculto en este tamaño de pantalla (la otra versión del bloque es la que se ve)
            if (r.height === 0) return;
            const alto = window.innerHeight;
            const v = modo === 'fijo' ? -r.top / Math.max(1, r.height - alto) : (alto * 0.5 - r.top) / r.height;
            const p = Math.min(1, Math.max(0, v));
            el.style.setProperty('--ln-progreso', p.toFixed(4));
            setActivo(reparto === 'estaciones' ? Math.round(p * (pasos - 1)) : Math.min(pasos - 1, Math.floor(p * pasos)));
        };
        const pedir = () => {
            if (!cuadro) cuadro = requestAnimationFrame(medir);
        };
        medir();
        window.addEventListener('scroll', pedir, { passive: true });
        window.addEventListener('resize', pedir);
        return () => {
            cancelAnimationFrame(cuadro);
            window.removeEventListener('scroll', pedir);
            window.removeEventListener('resize', pedir);
        };
    }, [pasos, modo, reparto]);

    return [ref, activo] as const;
}

/**
 * Antetítulo, título y texto de una sección. `oscuro` para las franjas Abismo y de mar.
 * Los títulos nunca se desenfocan ni se ocultan al entrar (regla de la landing nueva).
 */
export function Encabezado({
    antetitulo,
    titulo,
    texto,
    oscuro = false,
    centrado = false,
    className = '',
}: {
    antetitulo: string;
    titulo: ReactNode;
    texto?: ReactNode;
    oscuro?: boolean;
    centrado?: boolean;
    className?: string;
}) {
    return (
        <div className={`max-w-3xl ${centrado ? 'mx-auto text-center' : ''} ${className}`}>
            <p className={`text-lg font-bold movil:text-[15px] ${oscuro ? 'text-simar-espuma' : 'text-simar-marea-tinta'}`}>{antetitulo}</p>
            <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]">{titulo}</h2>
            {texto && (
                <p
                    className={`mt-4 text-lg md:text-[21px] leading-relaxed movil:mt-3 movil:text-[16px] ${
                        oscuro ? 'text-simar-franja-texto-2' : 'text-simar-texto-2'
                    }`}
                >
                    {texto}
                </p>
            )}
        </div>
    );
}

/** Número con separador de miles a la mexicana y los decimales que pida */
export const cifra = (n: number, decimales = 0) =>
    n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
