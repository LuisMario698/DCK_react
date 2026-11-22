'use client';

import { usePathname } from 'next/navigation';
import { History, Sparkles } from 'lucide-react';
import { MODO_DEMO } from '@/lib/demo/config';
import './switch-version.css';

export type VersionLanding = 'nueva' | 'anterior';

/** `?version=anterior` muestra la landing de antes del rediseño (sólo en la demo) */
export const PARAM_VERSION = 'version';

/**
 * Cambia entre la landing nueva y la anterior (la que estaba en producción antes del rediseño).
 * Sólo existe en el despliegue de la demo: en producción no se pinta y el parámetro se ignora.
 * Es un enlace normal (recarga la página): cada versión baja sólo lo suyo y arranca desde arriba.
 */
export function SwitchVersionLanding({ actual, vidrio = false }: { actual: VersionLanding; vidrio?: boolean }) {
    const ruta = usePathname();
    if (!MODO_DEMO) return null;

    const aAnterior = actual === 'nueva';
    const Icono = aAnterior ? History : Sparkles;
    const href = aAnterior ? `${ruta}?${PARAM_VERSION}=anterior` : ruta;
    const titulo = aAnterior ? 'Ver la versión anterior de esta página' : 'Ver la versión nueva de esta página';

    return (
        <a
            href={href}
            title={titulo}
            aria-label={titulo}
            data-vidrio={vidrio ? 'claro' : undefined}
            className="sv-switch simar-presiona min-h-[54px] md:min-h-[58px] min-w-[54px] md:min-w-[58px] px-3 md:px-4 flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto hover:bg-white/80 dark:hover:bg-white/10 flex items-center justify-center gap-2 whitespace-nowrap text-[15px] md:text-base font-bold transition-colors movil:min-h-[46px] movil:min-w-[46px] movil:px-0 movil:rounded-[15px]"
        >
            <Icono className="w-5 h-5 flex-shrink-0" strokeWidth={2.2} aria-hidden="true" />
            {/* El texto se esconde donde la barra no tiene lugar: bajo 1024 px y de 1280 a 1535 px
                (ahí entran los logos o los enlaces de las secciones; medido en las dos versiones) */}
            <span className="hidden min-[1024px]:inline min-[1280px]:hidden min-[1536px]:inline">
                {aAnterior ? 'Versión anterior' : 'Versión nueva'}
            </span>
        </a>
    );
}
