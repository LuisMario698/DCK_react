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
        <div className="bg-simar-superficie border border-simar-borde rounded-2xl shadow-simar overflow-hidden h-[calc(100vh-190px)] min-h-[480px] flex flex-col">
            <header className="px-5 py-4 border-b border-simar-borde flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-simar-marea-suave flex items-center justify-center text-simar-marea-tinta">
                    <Anchor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-base font-bold text-simar-texto">Centro de acopio · {PUERTO_PENASCO.nombre}</p>
                    <p className="text-[15px] text-simar-texto-2">Coordina horarios, cantidades y documentación.</p>
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
