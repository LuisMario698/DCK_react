'use client';

import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRecolector } from './RecolectorContext';

interface HeaderRecolectorProps {
    onOpenSidebar: () => void;
}

const TITLES: Record<string, { title: string; subtitle: string }> = {
    'dashboard-recolector': { title: 'Inicio', subtitle: 'Resumen de tu actividad' },
    mapa: { title: 'Residuos disponibles', subtitle: 'Inventario publicado por el centro de acopio' },
    solicitudes: { title: 'Mis solicitudes', subtitle: 'Estado de tus recolecciones' },
    historial: { title: 'Historial', subtitle: 'Recolecciones completadas y comprobantes' },
    impacto: { title: 'Impacto ambiental', subtitle: 'Tu contribución al reciclaje' },
    mensajes: { title: 'Mensajes', subtitle: 'Conversación con el centro de acopio' },
    perfil: { title: 'Perfil', subtitle: 'Datos de tu empresa' },
    notificaciones: { title: 'Notificaciones', subtitle: 'Actividad reciente' },
};

/** Encabezado del portal de empresas: vidrio flotante (ver DISEÑO_SIMAR.md). */
export function HeaderRecolector({ onOpenSidebar }: HeaderRecolectorProps) {
    const pathname = usePathname();
    const { notificacionesNoLeidas, asociacion } = useRecolector();
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'es';
    const last = segments[segments.length - 1] || 'dashboard-recolector';
    const meta = TITLES[last] ?? TITLES['dashboard-recolector'];

    return (
        <header className="sticky top-3 z-30 mx-3 mt-3 lg:mx-0 lg:mt-6">
            <div className="simar-vidrio relative rounded-3xl min-h-[74px] flex items-center justify-between gap-3 px-2.5 sm:pl-4 lg:pr-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onOpenSidebar}
                        className="lg:hidden w-[52px] h-[52px] rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center flex-shrink-0"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl font-extrabold text-simar-texto leading-tight">{meta.title}</h1>
                        <p className="text-[15px] text-simar-texto-2 truncate">{meta.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {asociacion && (
                        <span className="hidden md:inline text-[17px] font-bold text-simar-texto truncate max-w-[260px]">
                            {asociacion.nombre_asociacion}
                        </span>
                    )}
                    <Link
                        href={`/${locale}/dashboard-recolector/notificaciones`}
                        className="relative w-[52px] h-[52px] rounded-2xl bg-white/60 dark:bg-white/10 text-simar-texto flex items-center justify-center"
                        aria-label={`Notificaciones${notificacionesNoLeidas ? ` (${notificacionesNoLeidas} sin leer)` : ''}`}
                    >
                        <Bell className="w-6 h-6" />
                        {notificacionesNoLeidas > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold flex items-center justify-center">
                                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
