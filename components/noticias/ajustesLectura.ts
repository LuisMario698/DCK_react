'use client';

import { useSyncExternalStore } from 'react';
import { CLAVE_AJUSTES as CLAVE, NIVELES_LETRA } from './ajustesLecturaBase';

export { NIVELES_LETRA, NOMBRE_NIVEL } from './ajustesLecturaBase';

/**
 * Los ajustes de lectura de Noticias (el botón «Lectura» de la barra): tamaño, contraste, espacio
 * entre renglones, movimiento y enlaces subrayados. Se guardan en este dispositivo (localStorage) y
 * se aplican en <html> como atributos `data-n-*` y la variable `--n-zoom`; las reglas están en
 * globals.css («Ajustes de lectura») y sólo valen dentro de `.n-pagina` (la página de Noticias y
 * sus artículos). `SCRIPT_AJUSTES` (ajustesLecturaBase.ts) los aplica antes de pintar (app/[locale]/noticias/layout.tsx),
 * así una persona que pidió letra grande no ve primero la chica.
 */

export interface AjustesLectura {
    /** Índice de NIVELES_LETRA */
    letra: number;
    contraste: 'normal' | 'alto';
    interlineado: 'normal' | 'amplio';
    movimiento: 'normal' | 'quieto';
    enlaces: 'normal' | 'subrayados';
}

export const AJUSTES_BASE: AjustesLectura = { letra: 1, contraste: 'normal', interlineado: 'normal', movimiento: 'normal', enlaces: 'normal' };

/** Lo guardado, sin valores raros (una versión vieja o editado a mano) */
function sano(crudo: unknown): AjustesLectura {
    const a = { ...AJUSTES_BASE, ...(crudo && typeof crudo === 'object' ? crudo : {}) } as AjustesLectura;
    return {
        letra: Number.isInteger(a.letra) && a.letra >= 0 && a.letra < NIVELES_LETRA.length ? a.letra : AJUSTES_BASE.letra,
        contraste: a.contraste === 'alto' ? 'alto' : 'normal',
        interlineado: a.interlineado === 'amplio' ? 'amplio' : 'normal',
        movimiento: a.movimiento === 'quieto' ? 'quieto' : 'normal',
        enlaces: a.enlaces === 'subrayados' ? 'subrayados' : 'normal',
    };
}

/** Lo mismo que hace SCRIPT_AJUSTES, para cuando se cambia un ajuste */
function aplicar(a: AjustesLectura) {
    const html = document.documentElement;
    html.style.setProperty('--n-zoom', String(NIVELES_LETRA[a.letra]));
    html.dataset.nContraste = a.contraste;
    html.dataset.nInterlineado = a.interlineado;
    html.dataset.nMovimiento = a.movimiento;
    html.dataset.nEnlaces = a.enlaces;
}

let actual: AjustesLectura | null = null;
const oyentes = new Set<() => void>();

function leer(): AjustesLectura {
    if (actual) return actual;
    try {
        actual = sano(JSON.parse(localStorage.getItem(CLAVE) ?? '{}'));
    } catch {
        actual = AJUSTES_BASE;
    }
    return actual;
}

export function cambiarAjustes(cambio: Partial<AjustesLectura>) {
    actual = sano({ ...leer(), ...cambio });
    try {
        localStorage.setItem(CLAVE, JSON.stringify(actual));
    } catch {
        // Sin almacenamiento (modo privado): vale mientras la página siga abierta
    }
    aplicar(actual);
    oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
    oyentes.add(avisar);
    return () => oyentes.delete(avisar);
}

/** Los ajustes actuales (en el servidor, los de siempre) */
export function useAjustesLectura() {
    return useSyncExternalStore(suscribir, leer, () => AJUSTES_BASE);
}

/** «Sin animaciones»: lo pidió en los ajustes o lo tiene el sistema */
export function movimientoQuieto() {
    if (typeof window === 'undefined') return false;
    return document.documentElement.dataset.nMovimiento === 'quieto' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
