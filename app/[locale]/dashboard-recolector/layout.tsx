'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ShieldCheck, Unlink } from 'lucide-react';
import { SidebarRecolector } from '@/components/recolector/SidebarRecolector';
import { HeaderRecolector } from '@/components/recolector/HeaderRecolector';
import { RecolectorProvider, useRecolector } from '@/components/recolector/RecolectorContext';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { ESTADO_SUSCRIPCION_LABEL } from '@/lib/constants/suscripciones';

export default function DashboardRecolectorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RecolectorProvider>
            <div className="min-h-screen bg-simar-papel">
                <FondoSimar />
                <SidebarRecolector
                    isOpen={isOpen}
                    isCollapsed={isCollapsed}
                    onClose={() => setIsOpen(false)}
                    onToggleCollapse={() => setIsCollapsed((c) => !c)}
                />
                <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]'}`}>
                    <HeaderRecolector onOpenSidebar={() => setIsOpen(true)} />
                    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:py-8 lg:pr-10 lg:pl-8">
                        <AvisoGlobal />
                        <AvisoSuperadmin />
                        <AvisoEstado />
                        {/* Cada pantalla entra con un fundido corto (simar-pagina) */}
                        <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-hidden">
                            <Contenido>{children}</Contenido>
                        </div>
                    </main>
                </div>
            </div>
        </RecolectorProvider>
    );
}

/** Sin asociación vinculada no hay nada que mostrar (las páginas filtran por ella). */
function Contenido({ children }: { children: React.ReactNode }) {
    const { cargando, asociacion } = useRecolector();
    if (cargando || asociacion) return <>{children}</>;
    return (
        <div className="simar-aparece max-w-lg mx-auto mt-10 sm:mt-16 text-center bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-7 sm:p-9">
            <div className="mx-auto w-16 h-16 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center mb-5">
                <Unlink className="w-8 h-8" />
            </div>
            <p className="text-[22px] font-extrabold text-simar-texto leading-tight">Tu usuario no está vinculado a una asociación</p>
            <p className="text-lg text-simar-texto-2 mt-3">
                Pide al centro de acopio de Puerto Peñasco que vincule tu correo a tu empresa desde el módulo de Asociaciones.
            </p>
        </div>
    );
}

/** El superadmin usa el portal a nombre de su asociación: se le recuerda siempre. */
function AvisoSuperadmin() {
    const { esSuperadmin, asociacion } = useRecolector();
    const locale = usePathname().split('/')[1] || 'es';
    if (!esSuperadmin || !asociacion) return null;
    return (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-simar-violeta-suave px-5 py-4 text-base text-simar-texto">
            <ShieldCheck className="w-6 h-6 flex-shrink-0 text-simar-violeta" />
            <p className="flex-1 min-w-[220px]">
                <strong>Modo superadmin:</strong> usas el portal como <strong>{asociacion.nombre_asociacion}</strong>. Las
                solicitudes y mensajes que envíes quedan a nombre de esta asociación.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base font-bold text-simar-violeta">
                <Link href={`/${locale}/superadmin?elegir_asociacion=1`} className="min-h-[44px] inline-flex items-center underline-offset-4 hover:underline">
                    Cambiar asociación
                </Link>
                <Link href={`/${locale}/superadmin`} className="min-h-[44px] inline-flex items-center underline-offset-4 hover:underline">
                    Volver al panel de superadmin
                </Link>
            </div>
        </div>
    );
}

function AvisoEstado() {
    const { asociacion, motivoBloqueo, suscripcion } = useRecolector();
    if (!motivoBloqueo || !asociacion) return null;
    return (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-simar-coral-suave p-5 text-base text-simar-texto">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-simar-coral" />
            {motivoBloqueo === 'asociacion' ? (
                <p>
                    Tu asociación está <strong>{asociacion.estado.toLowerCase()}</strong>. Puedes consultar tu historial y
                    escribir al centro de acopio, pero no crear nuevas solicitudes de recolección.
                </p>
            ) : (
                <p>
                    {suscripcion?.estado ? (
                        <>
                            La suscripción de tu asociación está{' '}
                            <strong>{ESTADO_SUSCRIPCION_LABEL[suscripcion.estado].toLowerCase()}</strong>.
                        </>
                    ) : (
                        'Tu asociación no tiene una suscripción activa.'
                    )}{' '}
                    Puedes consultar tu historial y escribir al centro de acopio, pero no crear nuevas solicitudes hasta
                    renovarla.
                </p>
            )}
        </div>
    );
}
