'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * «Nueva» en las noticias publicadas después de la última visita de esta persona a la landing.
 * La fecha de la visita se guarda en este navegador (localStorage; nada sale de él). En la primera
 * visita, o si el navegador no deja guardar, cuentan como nuevas las de los últimos 3 días (más
 * días y casi todas saldrían marcadas, y la marca dejaría de decir algo).
 *
 * Todas las marcas de la página leen la misma fecha (la de la visita ANTERIOR): se lee una vez, al
 * pintar, y se queda en memoria; `RecordarVisita` guarda la de hoy (en su efecto, después de pintar)
 * para la próxima vez.
 */

const CLAVE = 'simar:noticias-vistas-hasta';
const DIAS_PRIMERA_VISITA = 3;

let anterior: string | null | undefined;

/** AAAA-MM-DD en la hora local */
function dia(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function visitaAnterior(): string {
    if (anterior === undefined) {
        try {
            anterior = window.localStorage.getItem(CLAVE);
        } catch {
            anterior = null;
        }
    }
    if (anterior) return anterior;
    const hace = new Date();
    hace.setDate(hace.getDate() - DIAS_PRIMERA_VISITA);
    return dia(hace);
}

const sinCambios = () => () => {};

/** La visita anterior (en el servidor, nada: las marcas aparecen ya en el navegador) */
function useVisitaAnterior(): string | null {
    return useSyncExternalStore(sinCambios, visitaAnterior, () => null);
}

export function MarcaNueva({ fecha }: { fecha: string }) {
    const desde = useVisitaAnterior();
    // Las fechas AAAA-MM-DD se comparan como texto
    if (!desde || !(fecha > desde)) return null;
    return (
        <span className="simar-aparece inline-flex items-center min-h-[28px] px-2.5 rounded-full bg-simar-coral-suave text-simar-coral text-[14px] font-extrabold">
            Nueva
        </span>
    );
}

/** «N notas nuevas desde tu última visita», con la misma regla que las marcas (nada si no hay) */
export function ContadorNuevas({ fechas }: { fechas: string[] }) {
    const desde = useVisitaAnterior();
    const cuantas = desde ? fechas.filter((f) => f > desde).length : 0;
    if (!cuantas) return null;
    return (
        <span className="simar-aparece inline-flex items-center gap-2 min-h-[34px] px-3.5 rounded-full bg-simar-coral-suave text-simar-coral text-[15px] font-extrabold">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-current" />
            {cuantas === 1 ? '1 nota nueva' : `${cuantas} notas nuevas`} desde tu última visita
        </span>
    );
}

/** Guarda la visita de hoy (después de que las marcas leyeron la anterior) */
export function RecordarVisita() {
    useEffect(() => {
        visitaAnterior();
        try {
            window.localStorage.setItem(CLAVE, dia(new Date()));
        } catch {
            // Sin almacenamiento (ventana privada): la próxima vez vuelven a contar los últimos 3 días
        }
    }, []);
    return null;
}
