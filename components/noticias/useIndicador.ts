'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * El indicador que se desliza bajo la opción elegida (pestañas del archivo, secciones de la barra):
 * mide la opción con `data-activo="true"` y le da al contenedor `--n-x` y `--n-w`, que mueven al
 * `.n-indicador` con el resorte de `--n-resorte` (globals.css). La primera medida va sin
 * transición (el contenedor nace con `n-sin-medir`: el indicador aparece donde va, no viaja desde
 * la orilla). El contenedor debe ser `position: relative`.
 * Mide en cada render (leer dos medidas es barato): así sigue bien aunque React le reponga la
 * clase `n-sin-medir` al contenedor. `clave` es lo que cambia la opción elegida.
 */
export function useIndicador<T extends HTMLElement>(clave: unknown) {
    const ref = useRef<T>(null);

    useLayoutEffect(() => {
        const caja = ref.current;
        if (caja) medir(caja);
    });

    // Si cambia el tamaño (otra ventana, la letra que termina de cargar), se vuelve a medir
    useEffect(() => {
        const caja = ref.current;
        if (!caja) return;
        const observador = new ResizeObserver(() => medir(caja));
        observador.observe(caja);
        return () => observador.disconnect();
    }, [clave]);

    return ref;
}

function medir(caja: HTMLElement) {
    const activo = caja.querySelector<HTMLElement>('[data-activo="true"]');
    if (!activo) {
        caja.classList.add('n-sin-medir');
        return;
    }
    caja.style.setProperty('--n-x', `${activo.offsetLeft}px`);
    caja.style.setProperty('--n-w', `${activo.offsetWidth}px`);
    if (caja.classList.contains('n-sin-medir')) requestAnimationFrame(() => caja.classList.remove('n-sin-medir'));
}
