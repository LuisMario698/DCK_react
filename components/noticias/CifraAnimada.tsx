'use client';

import { useEffect, useRef } from 'react';
import { sinMovimiento } from './movimiento';

/**
 * La cifra sube de cero cuando se ve (sólo si empieza con un número: «1,000,000 L», «11 millones
 * t»; «7 a 10» se queda como está). Los lectores de pantalla leen la cifra final; con «reducir
 * movimiento» no se anima.
 */
export function CifraAnimada({ texto }: { texto: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        const partes = texto.match(/^([\d,]+)(\D*)$/);
        if (!el || !partes || sinMovimiento()) return;
        const fin = Number(partes[1].replace(/,/g, ''));
        const resto = partes[2];
        const formato = (n: number) => Math.round(n).toLocaleString('es-MX') + resto;
        el.textContent = formato(0);
        let cuadro = 0;
        let inicio = 0;
        const paso = (t: number) => {
            if (!inicio) inicio = t;
            const p = Math.min(1, (t - inicio) / 1400);
            el.textContent = formato(fin * (1 - Math.pow(1 - p, 3)));
            if (p < 1) cuadro = requestAnimationFrame(paso);
        };
        const vista = new IntersectionObserver(
            ([entrada]) => {
                if (!entrada.isIntersecting) return;
                vista.disconnect();
                cuadro = requestAnimationFrame(paso);
            },
            { threshold: 0.6 },
        );
        vista.observe(el);
        return () => {
            vista.disconnect();
            cancelAnimationFrame(cuadro);
            el.textContent = texto;
        };
    }, [texto]);
    return (
        <>
            <span ref={ref} aria-hidden="true">
                {texto}
            </span>
            <span className="sr-only">{texto}</span>
        </>
    );
}
