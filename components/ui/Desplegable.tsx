'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { HojaInferior } from '@/components/layout/HojaInferior';
import { useEsCelular } from '@/components/layout/useEsCelular';

const MARGEN = 8;

/**
 * Panel que se abre desde un campo (calendario, reloj). Ver DISEÑO_SIMAR.md → "Selector de fecha y hora".
 *
 * - Computadora y tableta: flota pegado al campo (debajo, o arriba si no cabe) y por encima de las
 *   ventanas. Se cierra tocando fuera o con Escape (sin cerrar la ventana de atrás) y el foco vuelve
 *   al campo.
 * - Celular: sube como hoja desde abajo (HojaInferior), al alcance del pulgar, con su título arriba.
 *
 * Va por portal al <body>: dentro de una ventana (Modal) quedaría recortado por su desplazamiento, y
 * fuera de la zona compacta del panel; por eso el contenido recibe `enHoja` para elegir sus tamaños
 * en vez de usar la variante movil:.
 */
export function Desplegable({
    abierto,
    onCerrar,
    ancla,
    etiqueta,
    children,
}: {
    abierto: boolean;
    onCerrar: () => void;
    /** El campo que lo abre: de ahí se mide la posición y ahí vuelve el foco */
    ancla: RefObject<HTMLElement | null>;
    /** Título para el lector de pantalla (y visible arriba de la hoja en celular) */
    etiqueta: string;
    children: (enHoja: boolean) => ReactNode;
}) {
    // En el servidor useEsCelular da false y cerrado no se dibuja nada: el portal sólo se crea en el navegador
    const esCelular = useEsCelular();

    if (esCelular) {
        return createPortal(
            <HojaInferior abierto={abierto} onCerrar={onCerrar} etiqueta={etiqueta}>
                <p className="px-1 pb-3 text-[17px] font-extrabold text-simar-texto">{etiqueta}</p>
                {children(true)}
            </HojaInferior>,
            document.body
        );
    }
    if (!abierto) return null;
    return createPortal(
        <Flotante onCerrar={onCerrar} ancla={ancla} etiqueta={etiqueta}>
            {children(false)}
        </Flotante>,
        document.body
    );
}

function Flotante({
    onCerrar,
    ancla,
    etiqueta,
    children,
}: {
    onCerrar: () => void;
    ancla: RefObject<HTMLElement | null>;
    etiqueta: string;
    children: ReactNode;
}) {
    const panel = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number; arriba: boolean } | null>(null);
    const cerrarRef = useRef(onCerrar);
    useEffect(() => {
        cerrarRef.current = onCerrar;
    }, [onCerrar]);

    useLayoutEffect(() => {
        // Debajo del campo y alineado a su izquierda; si no cabe abajo y sí arriba, arriba. Nunca fuera de la pantalla.
        const colocar = () => {
            const a = ancla.current?.getBoundingClientRect();
            const p = panel.current;
            if (!a || !p) return;
            const { offsetWidth: ancho, offsetHeight: alto } = p;
            const cabeAbajo = a.bottom + MARGEN + alto <= window.innerHeight - MARGEN;
            const cabeArriba = a.top - MARGEN - alto >= MARGEN;
            const arriba = !cabeAbajo && cabeArriba;
            const top = arriba ? a.top - MARGEN - alto : Math.min(a.bottom + MARGEN, Math.max(MARGEN, window.innerHeight - MARGEN - alto));
            const left = Math.min(Math.max(MARGEN, a.left), window.innerWidth - MARGEN - ancho);
            setPos({ top, left, arriba });
        };
        colocar();
        const observador = new ResizeObserver(colocar);
        if (panel.current) observador.observe(panel.current);
        // Sigue al campo si la página o la ventana de atrás se desplazan
        window.addEventListener('scroll', colocar, true);
        window.addEventListener('resize', colocar);
        return () => {
            observador.disconnect();
            window.removeEventListener('scroll', colocar, true);
            window.removeEventListener('resize', colocar);
        };
    }, [ancla]);

    useEffect(() => {
        const campo = ancla.current;
        const cerrar = (devolverFoco: boolean) => {
            cerrarRef.current();
            if (devolverFoco) campo?.focus({ preventScroll: true });
        };
        // En captura y sin propagar: Escape cierra este panel, no la ventana (Modal) de atrás
        const alTeclear = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            e.preventDefault();
            cerrar(true);
        };
        const alTocar = (e: PointerEvent) => {
            const blanco = e.target as Node;
            if (panel.current?.contains(blanco) || campo?.contains(blanco)) return;
            cerrar(false);
        };
        window.addEventListener('keydown', alTeclear, true);
        document.addEventListener('pointerdown', alTocar, true);
        return () => {
            window.removeEventListener('keydown', alTeclear, true);
            document.removeEventListener('pointerdown', alTocar, true);
        };
    }, [ancla]);

    return (
        <div
            ref={panel}
            role="dialog"
            aria-label={etiqueta}
            data-arriba={pos?.arriba || undefined}
            className="simar-desplegable fixed z-[70] rounded-[22px] border border-simar-borde bg-simar-superficie p-3 shadow-[0_18px_50px_-18px_rgba(11,34,54,0.45)]"
            // Hasta medir se dibuja transparente en la esquina, para saber su tamaño (con opacidad y no
            // visibility: así el calendario ya puede recibir el foco al abrirse)
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, opacity: 0, pointerEvents: 'none' }}
        >
            {children}
        </div>
    );
}
