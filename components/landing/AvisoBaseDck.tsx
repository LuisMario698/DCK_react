'use client';

import { Database } from 'lucide-react';
import { useVolverASimar } from '@/components/layout/BaseDatos';

// En desarrollo, a un lado del indicador de Next (abajo a la izquierda)
const ladoAviso = process.env.NODE_ENV === 'development' ? 'left-[76px]' : 'left-4 max-sm:left-3';

/**
 * En la landing, con la base de DCK elegida (sólo el navegador del superadmin): las cifras son de esa
 * base. Flota abajo a la izquierda (los avisos salen a la derecha) con la salida a la mano.
 */
export function AvisoBaseDck() {
    const volver = useVolverASimar();
    return (
        <div
            role="status"
            className={`simar-vidrio-fuerte fixed bottom-4 z-[90] max-w-[calc(100vw-32px)] rounded-[22px] pl-4 pr-2 py-2 flex items-center gap-3 text-simar-texto max-sm:bottom-3 ${ladoAviso}`}
        >
            <Database className="w-5 h-5 flex-shrink-0 text-simar-violeta" />
            <p className="text-[15px] leading-snug">
                <strong className="font-bold">Cifras de la base de DCK</strong>
                <span className="text-simar-texto-2 max-sm:hidden"> · sólo consulta</span>
            </p>
            <button
                type="button"
                onClick={volver}
                className="min-h-[44px] px-3 rounded-xl whitespace-nowrap text-[15px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave transition-colors"
            >
                Volver a SiMAR
            </button>
        </div>
    );
}
