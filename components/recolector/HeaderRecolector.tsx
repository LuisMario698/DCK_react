'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderRecolectorProps {
    onOpenSidebar: () => void;
}

const TITLES: Record<string, { title: string; subtitle: string }> = {
    'dashboard-recolector': { title: 'Inicio', subtitle: 'Resumen de tu actividad' },
    mapa: { title: 'Mapa de puertos', subtitle: 'Residuos disponibles cerca de ti' },
    solicitudes: { title: 'Mis solicitudes', subtitle: 'Estado de tus recolecciones' },
    historial: { title: 'Historial', subtitle: 'Recolecciones completadas' },
    impacto: { title: 'Impacto ambiental', subtitle: 'Tu contribución al planeta' },
    perfil: { title: 'Perfil', subtitle: 'Datos de tu empresa' },
    notificaciones: { title: 'Notificaciones', subtitle: 'Actividad reciente' },
    configuracion: { title: 'Configuración', subtitle: 'Plan y preferencias' },
};

export function HeaderRecolector({ onOpenSidebar }: HeaderRecolectorProps) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'dashboard-recolector';
    const meta = TITLES[last] ?? TITLES['dashboard-recolector'];

    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenSidebar}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{meta.title}</h1>
                        <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">{meta.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 w-72">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar puerto, residuo..."
                            className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none flex-1"
                        />
                    </div>
                    <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                    </button>
                </div>
            </div>
        </header>
    );
}
