'use client';

import { useRef, type ReactNode } from 'react';
import { useScroll, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';

/**
 * Piezas de movimiento de la landing nueva, con Motion (motion.dev). Las escenas van atadas al
 * scroll como en las páginas de Apple: su estado depende de dónde va la página, no del tiempo. Donde
 * el navegador tiene ScrollTimeline, Motion las corre fuera del hilo principal; donde no, con un
 * listener de scroll. Ver DISEÑO_SIMAR.md §8.5.
 */

/** La curva de SiMAR para lo que entra: sale rápido y frena suave (--simar-frena en globals.css) */
export const FRENA = [0.22, 1, 0.36, 1] as const;

/** Resorte sin rebote para lo que se toca (Apple: amortiguamiento 1, respuesta 0.4 s) */
export const RESORTE = { type: 'spring', bounce: 0, duration: 0.45 } as const;

/**
 * Una escena fija: el bloque es alto y adentro el escenario va con `position: sticky`. El progreso
 * va de 0 (el bloque toca el borde de arriba) a 1 (su final toca el de abajo).
 */
export function useEscena<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
    return [ref, scrollYProgress] as const;
}

/**
 * `useTransform` del progreso de una escena, con el rango completado hasta 0 y 1. Con ScrollTimeline,
 * Motion pasa el rango tal cual a una animación nativa, y si no empieza en 0 y acaba en 1 el
 * navegador completa los extremos con el valor base del elemento: el título volvía a verse al final
 * de la escena y la gota regresaba arriba.
 */
export function useRango<T>(p: MotionValue<number>, entradas: number[], salidas: T[], opciones?: { ease?: (t: number) => number }) {
    const e = [...entradas];
    const s = [...salidas];
    if (e[0] > 0) {
        e.unshift(0);
        s.unshift(s[0]);
    }
    if (e[e.length - 1] < 1) {
        e.push(1);
        s.push(s[s.length - 1]);
    }
    return useTransform(p, e, s, opciones);
}

/**
 * Opacidad de un tramo de la escena: aparece entre `a` y `b`, se queda y se va entre `c` y `d`.
 * Con `a = b = 0` empieza visible (lo primero que se ve, también antes de que cargue el JavaScript);
 * con `c = d = 1` se queda hasta el final.
 */
export function useTramo(p: MotionValue<number>, [a, b, c, d]: [number, number, number, number]) {
    // Los puntos repetidos se quitan: Motion necesita una entrada que siempre crezca
    const entra = a < b;
    const sale = c < d;
    const puntos = [...(entra ? [a, b] : [b]), ...(sale ? [c, d] : [c])];
    const opacity = useRango(p, puntos, [...(entra ? [0, 1] : [1]), ...(sale ? [1, 0] : [1])]);
    // Sube un poco al llegar y sigue subiendo al irse; mientras se lee, quieto
    const transform = useRango(
        p,
        puntos,
        [...(entra ? [28, 0] : [0]), ...(sale ? [0, -28] : [0])].map((v) => `translateY(${v}px)`)
    );
    return { opacity, transform };
}

/**
 * Un título que se va encendiendo palabra por palabra al bajar (como en las páginas de Apple). Las
 * palabras apagadas quedan a la mitad de opacidad, así el título grande siempre cumple el contraste
 * de 3:1 para texto grande. El lector de pantalla oye la frase entera una sola vez.
 */
export function TextoQueSeEnciende({ texto, className = '' }: { texto: string; className?: string }) {
    // Con "reducir movimiento" el título se ve entero desde el principio
    const reducir = usePrefiereMenosMovimiento();
    if (reducir) return <span className={className}>{texto}</span>;
    return <TextoEncendido texto={texto} className={className} />;
}

function TextoEncendido({ texto, className }: { texto: string; className: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'end 0.6'] });
    const palabras = texto.split(' ');
    return (
        <span ref={ref} className={className}>
            <span className="sr-only">{texto}</span>
            <span aria-hidden="true">
                {palabras.map((palabra, i) => (
                    <Palabra key={i} progreso={scrollYProgress} desde={i / palabras.length} hasta={(i + 1) / palabras.length}>
                        {palabra}
                    </Palabra>
                ))}
            </span>
        </span>
    );
}

function Palabra({ progreso, desde, hasta, children }: { progreso: MotionValue<number>; desde: number; hasta: number; children: ReactNode }) {
    const opacity = useRango(progreso, [desde, hasta], [0.5, 1]);
    return (
        <>
            <m.span style={{ opacity }}>{children}</m.span>{' '}
        </>
    );
}
