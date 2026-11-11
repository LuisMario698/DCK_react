'use client';

import { useEffect } from 'react';

/**
 * Vidrio vivo: la luz de los botones con `data-vidrio` sigue al cursor y nace donde se presiona
 * (globals.css, «Vidrio vivo»). Un solo oyente para toda la página: al mover el cursor, una vez por
 * cuadro, le dice al botón que está debajo dónde está (--vx, --vy); al presionar, en el acto (con el
 * dedo también: la luz se abre desde donde se tocó). Sin cursor fino no hay luz que seguir: sólo la
 * de la presión. No pinta nada: se monta una vez en la página (la landing, Noticias).
 */
export function VidrioVivo() {
    useEffect(() => {
        let cuadro = 0;
        let ultimo: PointerEvent | null = null;
        const poner = (e: PointerEvent) => {
            const el = (e.target as Element | null)?.closest?.('[data-vidrio]') as HTMLElement | null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--vx', `${Math.round(e.clientX - r.left)}px`);
            el.style.setProperty('--vy', `${Math.round(e.clientY - r.top)}px`);
        };
        const pintar = () => {
            cuadro = 0;
            if (ultimo) poner(ultimo);
        };
        const mover = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            ultimo = e;
            if (!cuadro) cuadro = requestAnimationFrame(pintar);
        };
        const presionar = (e: PointerEvent) => poner(e);
        document.addEventListener('pointermove', mover, { passive: true });
        document.addEventListener('pointerdown', presionar, { passive: true });
        return () => {
            document.removeEventListener('pointermove', mover);
            document.removeEventListener('pointerdown', presionar);
            cancelAnimationFrame(cuadro);
        };
    }, []);
    return null;
}
