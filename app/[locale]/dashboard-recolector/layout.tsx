'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ClipboardList, LayoutGrid, Map as MapIcon, ShieldCheck, Unlink } from 'lucide-react';
import { BarraInferior } from '@/components/layout/BarraInferior';
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
                    <HeaderRecolector />
                    {/* Abajo deja lugar a la barra inferior en celular (y a la zona segura del teléfono) */}
                    <main className="flex-1 px-4 pt-4 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-6 md:pt-6 lg:py-8 lg:pr-10 lg:pl-8">
                        <AvisoGlobal />
                        <AvisoSuperadmin />
                        <AvisoEstado />
                        {/* Cada pantalla entra con un fundido corto (simar-pagina) */}
                        <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-hidden">
                            <Contenido>{children}</Contenido>
                        </div>
                    </main>
                </div>
                <BarraPortal onAbrirMenu={() => setIsOpen(true)} />
            </div>
        </RecolectorProvider>
    );
}

/** Barra inferior del portal (celular y tableta): lo que más se usa, y "Menú" para lo demás. */
function BarraPortal({ onAbrirMenu }: { onAbrirMenu: () => void }) {
    const pathname = usePathname();
    const { mensajesNoLeidos } = useRecolector();
    const base = `/${pathname.split('/')[1] || 'es'}/dashboard-recolector`;
    const items = [
        { label: 'Inicio', href: base, icon: LayoutGrid, activo: pathname === base || pathname === `${base}/` },
        { label: 'Residuos', href: `${base}/mapa`, icon: MapIcon, activo: pathname.startsWith(`${base}/mapa`) },
        { label: 'Solicitudes', href: `${base}/solicitudes`, icon: ClipboardList, activo: pathname.startsWith(`${base}/solicitudes`) },
    ];
    // Los mensajes sin leer viven en el menú: el contador va en "Menú" para que se note
    return <BarraInferior items={items} onAbrirMenu={onAbrirMenu} contadorMenu={mensajesNoLeidos} />;
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
