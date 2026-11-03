'use client';

import { useEffect, useRef } from 'react';

/** Cuánto falta de leer: una línea en la orilla de abajo de la barra (como en la landing 3D) */
export function ProgresoLectura() {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        let cuadro = 0;
        const pintar = () => {
            cuadro = 0;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            if (ref.current) ref.current.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total).toFixed(4) : 0})`;
        };
        const alMover = () => {
            if (!cuadro) cuadro = requestAnimationFrame(pintar);
        };
        pintar();
        window.addEventListener('scroll', alMover, { passive: true });
        window.addEventListener('resize', alMover);
        return () => {
            cancelAnimationFrame(cuadro);
            window.removeEventListener('scroll', alMover);
            window.removeEventListener('resize', alMover);
        };
    }, []);
    return (
        <span aria-hidden="true" className="pointer-events-none absolute left-6 right-6 bottom-0 h-[2px] rounded-full overflow-hidden">
            <span ref={ref} className="absolute inset-0 origin-left bg-simar-golfo" style={{ transform: 'scaleX(0)' }} />
        </span>
    );
}
