'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** "(3) " al inicio del título de la pestaña */
const PREFIJO = /^\(\d+\) /;

type NavegadorConInsignia = Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
};

/**
 * Lleva el número de avisos sin leer (el mismo de la campana) fuera de la página:
 * - al título de la pestaña: "(3) SiMAR — …";
 * - al ícono de SiMAR instalada como app (Badging API). Funciona en Chrome y Edge de computadora;
 *   en Android e iPhone el sistema decide si lo muestra (en iPhone, sólo con permiso de
 *   notificaciones). Donde no existe, no hace nada.
 * Al salir del panel (cerrar sesión) quita las dos cosas.
 */
export function useInsigniaAvisos(n: number) {
    const pathname = usePathname();

    // El título se vuelve a poner al cambiar de pantalla, por si Next lo reescribió
    useEffect(() => {
        const limpio = document.title.replace(PREFIJO, '');
        document.title = n > 0 ? `(${n}) ${limpio}` : limpio;
        return () => {
            document.title = document.title.replace(PREFIJO, '');
        };
    }, [n, pathname]);

    useEffect(() => {
        const nav = navigator as NavegadorConInsignia;
        (n > 0 ? nav.setAppBadge?.(n) : nav.clearAppBadge?.())?.catch(() => {});
        return () => {
            nav.clearAppBadge?.()?.catch(() => {});
        };
    }, [n]);
}
