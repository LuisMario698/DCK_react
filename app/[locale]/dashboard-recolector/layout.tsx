'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ShieldCheck, Unlink } from 'lucide-react';
import { SidebarRecolector } from '@/components/recolector/SidebarRecolector';
import { HeaderRecolector } from '@/components/recolector/HeaderRecolector';
import { RecolectorProvider, useRecolector } from '@/components/recolector/RecolectorContext';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';
import { ESTADO_SUSCRIPCION_LABEL } from '@/lib/constants/suscripciones';

export default function DashboardRecolectorLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <RecolectorProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <SidebarRecolector
                    isOpen={isOpen}
                    isCollapsed={isCollapsed}
                    onClose={() => setIsOpen(false)}
                    onToggleCollapse={() => setIsCollapsed((c) => !c)}
                />
                <div className={`flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-20' : 'pl-0 lg:pl-64'}`}>
                    <HeaderRecolector onOpenSidebar={() => setIsOpen(true)} />
                    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
                        <AvisoGlobal />
                        <AvisoSuperadmin />
                        <AvisoEstado />
                        <div className="max-w-[100vw] overflow-x-hidden">
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
        <div className="max-w-md mx-auto mt-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mb-4">
                <Unlink className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">Tu usuario no está vinculado a una asociación</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
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
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10 px-4 py-3 text-sm text-violet-800 dark:text-violet-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 min-w-[220px]">
                <strong>Modo superadmin:</strong> usas el portal como <strong>{asociacion.nombre_asociacion}</strong>. Las
                solicitudes y mensajes que envíes quedan a nombre de esta asociación.
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold">
                <Link href={`/${locale}/superadmin?elegir_asociacion=1`} className="hover:underline">
                    Cambiar asociación
                </Link>
                <Link href={`/${locale}/superadmin`} className="hover:underline">
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
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
