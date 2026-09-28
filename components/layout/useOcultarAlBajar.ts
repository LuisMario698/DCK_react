'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve true mientras la persona baja por la página y false en cuanto sube o vuelve arriba.
 * Lo usan el encabezado móvil (se esconde) y la barra inferior (se minimiza) para dejar ver más
 * contenido al leer. El umbral evita que un temblor del dedo cambie el estado.
 */
export function useOcultarAlBajar(umbral = 8) {
    const [oculto, setOculto] = useState(false);
    useEffect(() => {
        let ultimo = window.scrollY;
        let pendiente = false;
        const alDesplazar = () => {
            if (pendiente) return;
            pendiente = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                const d = y - ultimo;
                if (y < 72) setOculto(false);
                else if (d > umbral) setOculto(true);
                else if (d < -umbral) setOculto(false);
                if (Math.abs(d) > umbral) ultimo = y;
                pendiente = false;
            });
        };
        window.addEventListener('scroll', alDesplazar, { passive: true });
        return () => window.removeEventListener('scroll', alDesplazar);
    }, [umbral]);
    return [oculto, setOculto] as const;
}
