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

export function HeaderRecolector({ onOpenSidebar }: HeaderRecolectorProps) {
    const pathname = usePathname();
    const { notificacionesNoLeidas, asociacion } = useRecolector();
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] || 'es';
    const last = segments[segments.length - 1] || 'dashboard-recolector';
    const meta = TITLES[last] ?? TITLES['dashboard-recolector'];

    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            {/* pr extra: el botón flotante de tema (ThemeToggle) ocupa la esquina superior derecha */}
            <div className="flex items-center justify-between h-16 pl-4 sm:pl-6 lg:pl-8 pr-20 sm:pr-24">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onOpenSidebar}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{meta.title}</h1>
                        <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate">{meta.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {asociacion && (
                        <span className="hidden md:inline text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[240px]">
                            {asociacion.nombre_asociacion}
                        </span>
                    )}
                    <Link
                        href={`/${locale}/dashboard-recolector/notificaciones`}
                        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                        aria-label={`Notificaciones${notificacionesNoLeidas ? ` (${notificacionesNoLeidas} sin leer)` : ''}`}
                    >
                        <Bell className="w-5 h-5" />
                        {notificacionesNoLeidas > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
