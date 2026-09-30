'use client';

/**
 * "Desliza hacia abajo para actualizar", sólo con SiMAR instalada como app (PWA): abierta desde
 * la pantalla de inicio no hay barra del navegador ni botón de recargar, y en iPhone tampoco el
 * gesto del navegador. En una pestaña normal no hace nada (el navegador ya tiene el suyo).
 *
 * Arriba del todo, al jalar hacia abajo baja un círculo de vidrio cuya flecha gira con el tirón;
 * al soltar pasado el umbral la página se recarga. No se activa si hay una hoja o ventana abierta
 * (la página está bloqueada) ni dentro de filas que se deslizan de lado.
 */
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

/** Tirón (ya con resistencia) que hay que pasar para recargar */
const UMBRAL = 64;

function esAppInstalada() {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function DeslizarParaActualizar() {
    const [tiron, setTiron] = useState(0);
    const [recargando, setRecargando] = useState(false);

    useEffect(() => {
        if (!esAppInstalada()) return;
        let inicio: number | null = null;
        let actual = 0;

        const alTocar = (e: TouchEvent) => {
            inicio = null;
            if (window.scrollY > 0 || e.touches.length !== 1) return;
            if (document.documentElement.style.overflow === 'hidden') return; // hoja o ventana abierta
            if ((e.target as Element | null)?.closest('[role="dialog"], .simar-desliza, .simar-carrusel, input, textarea, select, canvas')) return;
            inicio = e.touches[0].clientY;
            actual = 0;
        };
        const alMover = (e: TouchEvent) => {
            if (inicio === null) return;
            const dy = e.touches[0].clientY - inicio;
            if (dy <= 0 || window.scrollY > 0) {
                if (actual) {
                    actual = 0;
                    setTiron(0);
                }
                return;
            }
            // Resistencia: el círculo avanza la mitad que el dedo y se detiene en 110 px
            actual = Math.min(110, dy * 0.5);
            setTiron(actual);
        };
        const alSoltar = () => {
            if (inicio === null) return;
            inicio = null;
            if (actual >= UMBRAL) {
                setRecargando(true);
                setTiron(UMBRAL);
                window.location.reload();
            } else {
                setTiron(0);
            }
            actual = 0;
        };

        window.addEventListener('touchstart', alTocar, { passive: true });
        window.addEventListener('touchmove', alMover, { passive: true });
        window.addEventListener('touchend', alSoltar);
        window.addEventListener('touchcancel', alSoltar);
        return () => {
            window.removeEventListener('touchstart', alTocar);
            window.removeEventListener('touchmove', alMover);
            window.removeEventListener('touchend', alSoltar);
            window.removeEventListener('touchcancel', alSoltar);
        };
    }, []);

    if (!tiron && !recargando) return null;
    const progreso = Math.min(1, tiron / UMBRAL);
    return (
        <div
            className="fixed left-1/2 top-0 z-[70] pointer-events-none"
            style={{ transform: `translate(-50%, ${tiron - 40}px)`, transition: tiron === 0 ? 'transform 0.2s var(--simar-acelera)' : undefined }}
        >
            <span role="status" className="sr-only">
                {recargando ? 'Actualizando…' : ''}
            </span>
            <span
                aria-hidden="true"
                className="simar-cristal w-11 h-11 rounded-full flex items-center justify-center text-simar-texto"
                style={{ opacity: 0.35 + progreso * 0.65 }}
            >
                <RotateCw
                    className={`w-[22px] h-[22px] ${recargando ? 'animate-spin' : ''} ${progreso >= 1 ? 'text-simar-marea-tinta' : ''}`}
                    strokeWidth={2.4}
                    style={recargando ? undefined : { transform: `rotate(${progreso * 270}deg)` }}
                />
            </span>
        </div>
    );
}
