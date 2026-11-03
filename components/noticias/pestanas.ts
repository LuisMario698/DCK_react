import type { KeyboardEvent } from 'react';

/**
 * Teclado de las pestañas de Noticias (patrón de pestañas de WAI-ARIA): las flechas pasan a la
 * siguiente o a la anterior (dan la vuelta), Inicio y Fin van a la primera y a la última. La
 * pestaña nueva se elige y recibe el foco.
 */
export function moverConTeclas(e: KeyboardEvent<HTMLElement>, actual: number, total: number, ir: (i: number) => void) {
    let i: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (actual + 1) % total;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (actual - 1 + total) % total;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = total - 1;
    if (i === null) return;
    e.preventDefault();
    ir(i);
    const pestanas = e.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]');
    pestanas?.[i]?.focus();
}

/** ¿El usuario pidió menos movimiento? */
export const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
