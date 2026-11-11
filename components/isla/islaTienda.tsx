'use client';

import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { volar } from './viaje';

/**
 * El estado compartido de la isla dinámica (IslaDinamica): qué gota está abierta, dónde se pintan
 * las gotas (su `destino`, para portales), qué botón abre cada una (su `ancla`: de ahí nace la gota)
 * y la ranura de actividad (la cápsula viva dentro de la isla, como la del reproductor).
 *
 * Va en un contexto con un almacén externo (useSyncExternalStore): así un componente lejos de la
 * barra —la nota que se escucha, por ejemplo— puede abrir una gota y pintar dentro de ella con un
 * portal, sin volver a dibujar la página. Si no hay isla arriba, los ganchos devuelven null y cada
 * componente usa su versión de siempre.
 */

export interface EstadoIsla {
    abierta: string | null;
    destinos: Record<string, HTMLElement | null>;
    anclas: Record<string, HTMLElement | null>;
    ranura: HTMLElement | null;
    /** Hay una actividad en la isla (la cápsula): en celular el enlace de volver se encoge */
    actividad: boolean;
}

export interface TiendaIsla {
    leer: () => EstadoIsla;
    suscribir: (avisar: () => void) => () => void;
    abrir: (id: string) => void;
    cerrar: (id?: string) => void;
    alternar: (id: string) => void;
    ponerDestino: (id: string, el: HTMLElement | null) => void;
    ponerAncla: (id: string, el: HTMLElement | null) => void;
    ponerRanura: (el: HTMLElement | null) => void;
    ponerActividad: (si: boolean) => void;
}

function crearTienda(): TiendaIsla {
    let estado: EstadoIsla = { abierta: null, destinos: {}, anclas: {}, ranura: null, actividad: false };
    const oyentes = new Set<() => void>();
    const cambiar = (siguiente: EstadoIsla) => {
        estado = siguiente;
        oyentes.forEach((avisar) => avisar());
    };
    return {
        leer: () => estado,
        suscribir: (avisar) => {
            oyentes.add(avisar);
            return () => oyentes.delete(avisar);
        },
        abrir: (id) => estado.abierta !== id && cambiar({ ...estado, abierta: id }),
        cerrar: (id) => {
            if (estado.abierta && (!id || estado.abierta === id)) cambiar({ ...estado, abierta: null });
        },
        alternar: (id) => cambiar({ ...estado, abierta: estado.abierta === id ? null : id }),
        ponerDestino: (id, el) => estado.destinos[id] !== el && cambiar({ ...estado, destinos: { ...estado.destinos, [id]: el } }),
        ponerAncla: (id, el) => estado.anclas[id] !== el && cambiar({ ...estado, anclas: { ...estado.anclas, [id]: el } }),
        ponerRanura: (el) => estado.ranura !== el && cambiar({ ...estado, ranura: el }),
        ponerActividad: (si) => estado.actividad !== si && cambiar({ ...estado, actividad: si }),
    };
}

const ContextoIsla = createContext<TiendaIsla | null>(null);

/** Envuelve la página (la barra y el contenido) para que todo hable con la misma isla */
export function IslaProveedor({ children }: { children: ReactNode }) {
    const [tienda] = useState(crearTienda);
    return <ContextoIsla.Provider value={tienda}>{children}</ContextoIsla.Provider>;
}

/** La tienda de la isla de arriba (o null si no hay) */
export function useTiendaIsla() {
    return useContext(ContextoIsla);
}

const VACIO: EstadoIsla = { abierta: null, destinos: {}, anclas: {}, ranura: null, actividad: false };
const nadaQueSuscribir = () => () => {};

/** El estado de la isla (si no hay isla, uno vacío) */
export function useEstadoIsla(): EstadoIsla {
    const tienda = useContext(ContextoIsla);
    return useSyncExternalStore(tienda?.suscribir ?? nadaQueSuscribir, tienda?.leer ?? (() => VACIO), () => VACIO);
}

/** El ancla de una gota; si todavía no existe (la cápsula del reproductor se monta al empezar), la espera un momento */
function esperarAncla(tienda: TiendaIsla, id: string, ms = 500): Promise<HTMLElement | null> {
    const ya = tienda.leer().anclas[id];
    if (ya) return Promise.resolve(ya);
    return new Promise((listo) => {
        let soltar = () => {};
        const tarde = window.setTimeout(() => {
            soltar();
            listo(null);
        }, ms);
        soltar = tienda.suscribir(() => {
            const el = tienda.leer().anclas[id];
            if (!el) return;
            window.clearTimeout(tarde);
            soltar();
            listo(el);
        });
    });
}

/** Lo que un botón necesita para abrir su gota: si está abierta, alternarla y registrarse como ancla */
export function useGota(id: string) {
    const tienda = useContext(ContextoIsla);
    const estado = useEstadoIsla();
    // Las funciones no cambian entre renders (la del ancla es una ref de callback: si cambiara, React
    // la soltaría y la volvería a poner en cada render, y eso volvería a avisar a la tienda)
    const acciones = useMemo(() => {
        /**
         * Abre la gota desde un botón. Si el botón está fuera de la isla (en la nota), primero una
         * gotita viaja de él a la isla (viaje.ts) y luego la gota cae de ahí; dentro de la isla, cae
         * directo. Con `aparece`, el ancla se esconde hasta que llega la gotita.
         */
        const abrirDesde = async (origen?: HTMLElement | null, opciones?: { aparece?: boolean }) => {
            if (!tienda) return;
            if (origen && !origen.closest('.isla')) {
                const ancla = await esperarAncla(tienda, id);
                if (ancla) await volar(origen, ancla, opciones);
            }
            tienda.abrir(id);
        };
        return {
            abrir: () => tienda?.abrir(id),
            cerrar: () => tienda?.cerrar(id),
            alternar: () => tienda?.alternar(id),
            abrirDesde,
            /** Como alternar, pero al abrir viaja desde el botón (ver abrirDesde) */
            alternarDesde: (origen?: HTMLElement | null) => (tienda?.leer().abierta === id ? tienda.cerrar(id) : abrirDesde(origen)),
            ancla: (el: HTMLElement | null) => tienda?.ponerAncla(id, el),
        };
    }, [tienda, id]);
    return { hayIsla: !!tienda, abierta: estado.abierta === id, destino: estado.destinos[id] ?? null, ...acciones };
}

/** La ranura de actividad de la isla (para pintar ahí una cápsula con un portal) y avisar que hay una */
export function useRanuraIsla() {
    const tienda = useContext(ContextoIsla);
    const estado = useEstadoIsla();
    return { ranura: estado.ranura, ponerActividad: (si: boolean) => tienda?.ponerActividad(si) };
}
