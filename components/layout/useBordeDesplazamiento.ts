'use client';

import { useEffect, useRef } from 'react';

/**
 * Para una lista con desplazamiento propio (el menú lateral): le pone `data-mas-arriba` /
 * `data-mas-abajo` mientras haya renglones escondidos de ese lado. Con la clase
 * `simar-borde-lista` esa orilla se desvanece, así la lista avisa que hay más en vez de cortar un
 * renglón a la mitad. Ver DISEÑO_SIMAR.md → "Vidrio".
 */
export function useBordeDesplazamiento<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const medir = () => {
            el.toggleAttribute('data-mas-arriba', el.scrollTop > 1);
            el.toggleAttribute('data-mas-abajo', el.scrollTop + el.clientHeight < el.scrollHeight - 1);
        };
        medir();
        el.addEventListener('scroll', medir, { passive: true });
        // También al cambiar el alto de la ventana o de la lista (menú angosto, secciones que aparecen)
        const observador = new ResizeObserver(medir);
        observador.observe(el);
        for (const hijo of el.children) observador.observe(hijo);
        return () => {
            el.removeEventListener('scroll', medir);
            observador.disconnect();
        };
    }, []);
    return ref;
}
