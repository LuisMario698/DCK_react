'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import { elegirBase, type BaseDatos } from '@/lib/supabase/baseDatos';

/**
 * La base que eligió el superadmin para este navegador (ver lib/supabase/baseDatos.ts), leída en el
 * servidor (layout del recinto) para que la pantalla salga igual en el servidor y en el navegador.
 */
const Contexto = createContext<BaseDatos>('simar');

export function BaseDatosProvider({ base, children }: { base: BaseDatos; children: ReactNode }) {
    return <Contexto.Provider value={base}>{children}</Contexto.Provider>;
}

/**
 * ¿El recinto se ve con la base de DCK? Entonces sólo se consulta: lo que guarda, y lo que la base de
 * DCK no tiene (empresas, solicitudes, inventario, avisos), se oculta.
 */
export function useSoloConsulta() {
    return useContext(Contexto) === 'dck';
}

/** Vuelve este navegador a SiMAR y recarga lo que se ve */
export function useVolverASimar() {
    const router = useRouter();
    return () => {
        elegirBase('simar');
        router.refresh();
    };
}

/**
 * Franja de arriba en el recinto con la base de DCK: que nadie confunda esos registros con los de
 * SiMAR, y la salida a la mano. Tarjeta blanca como la de la demostración (DISEÑO_SIMAR.md).
 */
export function FranjaDck() {
    const volver = useVolverASimar();
    return (
        <div
            role="status"
            className="simar-aparece max-w-[1600px] mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar px-4 py-3 movil:mb-3 movil:px-3 movil:py-2.5 movil:gap-x-2.5"
        >
            <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-violeta-suave text-simar-violeta flex items-center justify-center movil:w-8 movil:h-8">
                <Database className="w-5 h-5 movil:w-[18px] movil:h-[18px]" />
            </span>
            <p className="flex-1 min-w-[200px] text-[17px] text-simar-texto leading-snug movil:min-w-0 movil:text-[14px]">
                <strong className="font-bold text-simar-violeta">Base de DCK</strong>
                <span className="text-simar-texto-2"> · Sólo consulta: ves los registros de la base anterior y no se pueden cambiar.</span>
            </p>
            <button
                type="button"
                onClick={volver}
                className="min-h-[44px] px-3 rounded-xl inline-flex items-center whitespace-nowrap text-[17px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave transition-colors movil:min-h-[38px] movil:px-2 movil:text-[14px]"
            >
                Volver a SiMAR
            </button>
        </div>
    );
}
