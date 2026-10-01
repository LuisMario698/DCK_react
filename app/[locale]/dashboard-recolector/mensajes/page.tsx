'use client';

import { useLayoutEffect, useRef } from 'react';
import { Anchor } from 'lucide-react';
import { PUERTO_PENASCO } from '@/lib/constants/residuos';
import { Conversacion } from '@/components/asociaciones/Conversacion';
import { Cargando } from '@/components/asociaciones/ui';
import { useRecolector } from '@/components/recolector/RecolectorContext';

export default function MensajesPage() {
    const { asociacion, cargando, recargarContadores, esSuperadmin } = useRecolector();

    // Celular y tableta: el chat mide lo que queda entre lo de arriba y la barra de navegación (los 100 px
    // que el layout ya reserva abajo), así el campo para escribir siempre queda arriba de la barra y la
    // página no se desplaza. Lo de arriba cambia (aviso de superadmin, de suscripción), por eso se mide
    // dónde empieza la caja (--arriba) en vez de adivinarlo
    const cajaRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const medir = () => {
            const el = cajaRef.current;
            if (el) el.style.setProperty('--arriba', `${Math.round(el.getBoundingClientRect().top + window.scrollY)}px`);
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, [cargando, asociacion]);

    if (cargando) return <Cargando />;
    if (!asociacion) {
        return <p className="text-base text-simar-texto-2">Tu usuario no está vinculado a una empresa.</p>;
    }

    return (
        <div
            ref={cajaRef}
            className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden h-[calc(100vh-190px)] min-h-[480px] flex flex-col max-lg:h-[calc(100dvh-var(--arriba,190px)-100px-env(safe-area-inset-bottom))] movil:min-h-[340px]"
        >
            <header className="px-5 sm:px-6 py-5 border-b border-simar-borde flex items-center gap-4 movil:px-4 movil:py-3 movil:gap-3">
                <span className="w-14 h-14 flex-shrink-0 rounded-full bg-simar-marea-suave flex items-center justify-center text-simar-marea-tinta movil:w-10 movil:h-10">
                    <Anchor className="w-7 h-7 movil:w-5 movil:h-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                    <p className="text-[21px] font-extrabold leading-tight text-simar-texto">Centro de acopio · {PUERTO_PENASCO.nombre}</p>
                    <p className="text-base text-simar-texto-2 movil:text-[13px] movil:leading-snug">Coordina horarios, cantidades y documentación.</p>
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
