'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, X } from 'lucide-react';

export type VersionLanding = 'actual' | 'nueva';

export const VERSIONES_LANDING: { id: VersionLanding; nombre: string }[] = [
    { id: 'actual', nombre: 'Actual' },
    { id: 'nueva', nombre: 'Nueva' },
];

/**
 * Botón flotante para comparar las dos landings mientras se decide con cuál quedarse: abajo a la
 * izquierda en celular y abajo a la derecha en computadora (a la izquierda tapaba el camino de "El
 * viaje"). Cambia ?landing= en la URL, así cada versión se puede compartir con su enlace. En celular
 * empieza como un botón redondo y se abre al tocarlo, para no tapar los botones del inicio. Al
 * elegir una versión, se quita este botón y la otra landing.
 * `sobreAviso`: en celular sube para no tapar el aviso de la base de DCK (AvisoBaseDck, abajo a la
 * izquierda); en computadora ya va del otro lado.
 */
export function SelectorVersionLanding({ version, sobreAviso = false }: { version: VersionLanding; sobreAviso?: boolean }) {
    const [abierto, setAbierto] = useState(false);

    return (
        <nav
            aria-label="Versión de la landing"
            className={`simar-vidrio-fuerte fixed z-[60] left-3 md:left-auto md:right-6 rounded-full p-1.5 flex items-center gap-1 text-simar-texto ${
                sobreAviso ? 'bottom-[84px] md:bottom-6' : 'bottom-[max(12px,env(safe-area-inset-bottom))] md:bottom-6'
            }`}
        >
            <button
                type="button"
                onClick={() => setAbierto((a) => !a)}
                aria-expanded={abierto}
                aria-label={abierto ? 'Cerrar' : 'Comparar las dos versiones de la landing'}
                className="md:hidden w-11 h-11 rounded-full flex items-center justify-center hover:bg-simar-texto/10"
            >
                {abierto ? <X className="w-5 h-5" /> : <Layers className="w-[22px] h-[22px]" />}
            </button>
            <span className="hidden md:inline-flex items-center gap-2 pl-3 pr-1.5 text-[15px] font-bold text-simar-texto-2">
                <Layers className="w-5 h-5" />
                Landing
            </span>
            {VERSIONES_LANDING.map((v) => {
                const activa = v.id === version;
                return (
                    <Link
                        key={v.id}
                        href={`?landing=${v.id}`}
                        aria-current={activa ? 'page' : undefined}
                        className={`${abierto ? 'inline-flex' : 'hidden'} md:inline-flex min-h-[44px] md:min-h-[48px] px-4 md:px-5 rounded-full items-center text-[15px] md:text-[17px] font-bold transition-colors ${
                            activa ? 'bg-simar-marea text-white' : 'hover:bg-simar-texto/10'
                        }`}
                    >
                        {v.nombre}
                    </Link>
                );
            })}
        </nav>
    );
}
