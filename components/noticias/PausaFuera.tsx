'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Envuelve una escena animada (clase `n-escena`, globals.css): fuera de la pantalla la pone en
 * pausa (data-quieta) y la primera vez que entra le pone data-visto, para lo que se anima una
 * sola vez (la costa del mapa, la fila de vaquitas). Lo de adentro puede ser de servidor.
 */
export function PausaFuera({ children, className = '', oculto = false }: { children: ReactNode; className?: string; oculto?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const vista = new IntersectionObserver(
            ([entrada]) => {
                el.dataset.quieta = entrada.isIntersecting ? 'false' : 'true';
                if (entrada.isIntersecting) el.dataset.visto = 'true';
            },
            { rootMargin: '60px 0px' },
        );
        vista.observe(el);
        return () => vista.disconnect();
    }, []);
    return (
        <div ref={ref} className={`n-escena ${className}`} aria-hidden={oculto || undefined}>
            {children}
        </div>
    );
}
