'use client';

import { Anchor } from 'lucide-react';
import { PUERTO_PENASCO } from '@/lib/constants/residuos';
import { Conversacion } from '@/components/asociaciones/Conversacion';
import { Cargando } from '@/components/asociaciones/ui';
import { useRecolector } from '@/components/recolector/RecolectorContext';

export default function MensajesPage() {
    const { asociacion, cargando, recargarContadores, esSuperadmin } = useRecolector();

    if (cargando) return <Cargando />;
    if (!asociacion) {
        return <p className="text-base text-simar-texto-2">Tu usuario no está vinculado a una asociación.</p>;
    }

    return (
        <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden h-[calc(100vh-190px)] min-h-[480px] flex flex-col">
            <header className="px-5 sm:px-6 py-5 border-b border-simar-borde flex items-center gap-4">
                <span className="w-14 h-14 flex-shrink-0 rounded-full bg-simar-marea-suave flex items-center justify-center text-simar-marea-tinta">
                    <Anchor className="w-7 h-7" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                    <p className="text-[21px] font-extrabold leading-tight text-simar-texto">Centro de acopio · {PUERTO_PENASCO.nombre}</p>
                    <p className="text-base text-simar-texto-2">Coordina horarios, cantidades y documentación.</p>
                </div>
            </header>
            <Conversacion
                asociacionId={asociacion.id}
                miRol="recolector"
                comoAsociacion={esSuperadmin}
                acento="emerald"
                onLeidos={recargarContadores}
                vacio="Escribe tu primer mensaje al centro de acopio."
            />
        </div>
    );
}
