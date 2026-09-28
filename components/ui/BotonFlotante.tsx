'use client';

import type { LucideIcon } from 'lucide-react';
import { useOcultarAlBajar } from '@/components/layout/useOcultarAlBajar';

/**
 * Burbuja flotante con la acción principal de una lista (Nueva persona, Nueva embarcación…).
 * SÓLO en celular (variante movil:): flota a la derecha, justo encima de la barra inferior, al
 * alcance del pulgar. Arriba de la página va extendida (ícono + palabra); al bajar se encoge a un
 * círculo con el ícono y vuelve a extenderse al subir. Baja junto con la barra cuando ésta se
 * minimiza (html[data-barra-mini]). En tableta y escritorio no aparece: ahí la acción sigue en el
 * encabezado de la pantalla (con `movil:hidden`).
 *
 * Deja además un espacio al final de la página para que la burbuja no tape lo último de la lista.
 * Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function BotonFlotante({
    icono: Icono,
    etiqueta,
    onClick,
    disabled = false,
    title,
}: {
    icono: LucideIcon;
    etiqueta: string;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
}) {
    const [bajando] = useOcultarAlBajar();
    return (
        <>
            <div aria-hidden="true" className="hidden movil:block h-16" />
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={etiqueta}
                title={title ?? etiqueta}
                data-encogida={bajando || undefined}
                className="simar-flotante simar-presiona hidden movil:flex fixed right-3 z-30 items-center justify-center rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Icono className="w-6 h-6 flex-shrink-0" strokeWidth={2.4} />
                <span className="simar-flotante-etiqueta text-[15px] whitespace-nowrap">{etiqueta}</span>
            </button>
        </>
    );
}
