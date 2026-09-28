'use client';

import { useSyncExternalStore } from 'react';

// Mismo corte que la variante movil: de app/globals.css (DISEÑO_SIMAR.md → "Versión móvil")
const CONSULTA_CELULAR = '(max-width: 639px)';

function suscribirCelular(avisar: () => void) {
    const consulta = window.matchMedia(CONSULTA_CELULAR);
    consulta.addEventListener('change', avisar);
    return () => consulta.removeEventListener('change', avisar);
}

/**
 * ¿La pantalla es de celular (menos de 640 px)? false en el servidor.
 * Sólo para cuando en celular se dibuja otra cosa (p. ej. no montar un mapa escondido); para cambiar
 * el acomodo basta la variante movil: en las clases.
 */
export function useEsCelular() {
    return useSyncExternalStore(
        suscribirCelular,
        () => window.matchMedia(CONSULTA_CELULAR).matches,
        () => false
    );
}
