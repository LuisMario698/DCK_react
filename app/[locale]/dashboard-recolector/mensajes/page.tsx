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
        return <p className="text-sm text-gray-500 dark:text-gray-400">Tu usuario no está vinculado a una asociación.</p>;
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-190px)] min-h-[480px] flex flex-col">
            <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <Anchor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Centro de acopio · {PUERTO_PENASCO.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Coordina horarios, cantidades y documentación.</p>
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
