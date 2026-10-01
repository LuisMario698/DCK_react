'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { usePresencia } from '@/components/ui/movimiento';

/**
 * Hoja que sube desde abajo (celular y tableta; desde 1024 px no se muestra). La usa el menú
 * "Más" de la barra inferior. Se cierra tocando el fondo, con Escape o arrastrando la
 * agarradera hacia abajo. Mientras está abierta la página de atrás no se desplaza y, al
 * cerrarse, el foco vuelve al botón que la abrió. Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function HojaInferior({
    abierto,
    onCerrar,
    etiqueta,
    children,
}: {
    abierto: boolean;
    onCerrar: () => void;
    /** Nombre de la hoja para el lector de pantalla ("Más opciones") */
    etiqueta: string;
    children: ReactNode;
}) {
    const { montado, saliendo } = usePresencia(abierto, 200);
    const panelRef = useRef<HTMLDivElement>(null);
    const cerrarRef = useRef(onCerrar);
    const inicioArrastre = useRef<number | null>(null);
    const [arrastre, setArrastre] = useState(0);
    const [arrastrando, setArrastrando] = useState(false);
    // Al volver a abrir, la hoja empieza en su lugar aunque se haya cerrado arrastrándola
    const [abiertoAntes, setAbiertoAntes] = useState(abierto);
    if (abierto !== abiertoAntes) {
        setAbiertoAntes(abierto);
        if (abierto) setArrastre(0);
    }

    useEffect(() => {
        cerrarRef.current = onCerrar;
    }, [onCerrar]);

    // Tab da la vuelta dentro de la hoja (el foco inicial y el regreso los hace el efecto de abajo). Va
    // antes de ese efecto para que al cerrar los dos regresen el foco al mismo botón
    useVentanaAccesible(panelRef, abierto, { enfocar: false, alEscape: () => cerrarRef.current() });

    // Al abrir: foco en la hoja y la página de atrás quieta (Escape lo maneja useVentanaAccesible)
    useEffect(() => {
        if (!abierto) return;
        const previo = document.activeElement as HTMLElement | null;
        const html = document.documentElement;
        const overflowPrevio = html.style.overflow;
        html.style.overflow = 'hidden';
        panelRef.current?.focus({ preventScroll: true });
        return () => {
            html.style.overflow = overflowPrevio;
            previo?.focus?.({ preventScroll: true });
        };
    }, [abierto]);

    if (!montado) return null;

    // Arrastrar la agarradera: la hoja sigue al dedo; si baja más de 90 px, se cierra
    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        inicioArrastre.current = e.clientY;
        setArrastrando(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const alMover = (e: PointerEvent<HTMLDivElement>) => {
        if (inicioArrastre.current === null) return;
        setArrastre(Math.max(0, e.clientY - inicioArrastre.current));
    };
    const alSoltar = () => {
        inicioArrastre.current = null;
        setArrastrando(false);
        if (arrastre > 90) onCerrar();
        else setArrastre(0);
    };

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div
                aria-hidden="true"
                onClick={onCerrar}
                className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} absolute inset-0 bg-[rgba(11,34,54,0.5)]`}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={etiqueta}
                tabIndex={-1}
                className={`${saliendo ? 'simar-hoja-sale' : 'simar-hoja'} absolute inset-x-0 bottom-0 mx-auto max-w-xl max-h-[88dvh] flex flex-col rounded-t-[28px] bg-simar-superficie shadow-[0_-24px_60px_-24px_rgba(11,34,54,0.55)] outline-none`}
                style={{
                    transform: arrastre ? `translateY(${arrastre}px)` : undefined,
                    transition: arrastrando ? 'none' : 'transform 0.25s var(--simar-frena)',
                }}
            >
                {/* Agarradera: también se puede arrastrar hacia abajo para cerrar */}
                <div
                    onPointerDown={alPresionar}
                    onPointerMove={alMover}
                    onPointerUp={alSoltar}
                    onPointerCancel={alSoltar}
                    className="flex-shrink-0 pt-2.5 pb-2 touch-none cursor-grab active:cursor-grabbing"
                >
                    <span aria-hidden="true" className="block mx-auto w-11 h-[5px] rounded-full bg-simar-borde" />
                </div>
                <div className="overflow-y-auto overscroll-contain px-4 pb-[max(18px,env(safe-area-inset-bottom))]">{children}</div>
            </div>
        </div>
    );
}
