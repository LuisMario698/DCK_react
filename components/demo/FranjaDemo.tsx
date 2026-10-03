'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Presentation, RotateCcw } from 'lucide-react';
import type { VistaDemo } from '@/lib/demo/config';
import { iniciarRecorrido } from '@/lib/demo/estadoRecorrido';

/**
 * Franja de arriba en cada pantalla de la demostración: recuerda que son datos de ejemplo y que nada se
 * guarda, y deja repetir el recorrido o cambiar de vista. Tarjeta blanca con el ícono en su círculo
 * suave y las acciones en azul (DISEÑO_SIMAR.md: destacar sin salirse del estilo).
 */
export function FranjaDemo({ vista }: { vista: VistaDemo }) {
    const locale = usePathname().split('/')[1] || 'es';
    const otra = vista === 'puerto' ? { vista: 'empresa', texto: 'Ver como empresa' } : { vista: 'puerto', texto: 'Ver como el puerto' };

    return (
        <div className="simar-aparece max-w-[1600px] mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar px-4 py-3 movil:mb-3 movil:px-3 movil:py-2.5 movil:gap-x-2.5">
            <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-8 movil:h-8">
                <Presentation className="w-5 h-5 movil:w-[18px] movil:h-[18px]" />
            </span>
            <p className="flex-1 min-w-[200px] text-[17px] text-simar-texto leading-snug movil:min-w-0 movil:text-[14px]">
                <strong className="font-bold text-simar-marea-tinta">Demostración</strong>
                <span className="text-simar-texto-2"> · Datos de ejemplo. Puedes tocar todo: nada se guarda.</span>
            </p>
            <div className="flex items-center gap-1 movil:basis-full movil:-ml-2 movil:-mt-1">
                <button
                    type="button"
                    onClick={() => {
                        window.scrollTo({ top: 0 });
                        iniciarRecorrido(vista);
                    }}
                    className="min-h-[44px] px-3 rounded-xl inline-flex items-center gap-2 whitespace-nowrap text-[17px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave transition-colors movil:min-h-[38px] movil:px-2 movil:text-[14px]"
                >
                    <RotateCcw className="w-5 h-5 movil:w-4 movil:h-4" />
                    Repetir recorrido
                </button>
                <Link
                    href={`/${locale}/demo?vista=${otra.vista}`}
                    className="min-h-[44px] px-3 rounded-xl inline-flex items-center whitespace-nowrap text-[17px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave transition-colors movil:min-h-[38px] movil:px-2 movil:text-[14px]"
                >
                    {otra.texto}
                </Link>
            </div>
        </div>
    );
}
