'use client';

import { useEffect } from 'react';
import { TITULO_APP, tituloPantalla } from '@/lib/constants/titulo';

/** "(3) " al inicio del título: lo pone useInsigniaAvisos (avisos sin leer) y aquí se respeta */
const PREFIJO = /^\(\d+\) /;

/**
 * Pone el nombre de la pantalla en la pestaña ("Manifiesto · SiMAR"). Antes todas se llamaban igual
 * ("SiMAR — Sistema Integral…"): el lector de pantalla no anunciaba a dónde se llegó y en el
 * historial o con varias pestañas no se distinguían.
 *
 * Las pantallas de los paneles son de cliente y no pueden declarar metadatos, así que lo pone el
 * encabezado de cada área, que ya sabe en qué pantalla está. Al salir del área (a la landing) regresa
 * el título general.
 */
export function useTituloPestana(pantalla: string | null) {
    useEffect(() => {
        if (!pantalla) return;
        const deseado = tituloPantalla(pantalla);
        const aplicar = () => {
            const nuevo = (document.title.match(PREFIJO)?.[0] ?? '') + deseado;
            if (document.title !== nuevo) document.title = nuevo;
        };
        aplicar();
        // Next escribe el <title> de los metadatos un momento después (se transmite por partes) y pisaba
        // éste: si alguien lo cambia, se vuelve a poner (conservando el "(3) " de los avisos)
        const observador = new MutationObserver(aplicar);
        observador.observe(document.head, { subtree: true, childList: true, characterData: true });
        return () => {
            observador.disconnect();
            document.title = (document.title.match(PREFIJO)?.[0] ?? '') + TITULO_APP;
        };
    }, [pantalla]);
}
