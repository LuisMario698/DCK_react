'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, { title: string; subtitle: string }> = {
    superadmin: { title: 'Resumen', subtitle: 'Estado general de cuentas, suscripciones e ingresos' },
    cuentas: { title: 'Cuentas', subtitle: 'Usuarios, roles, suspensiones e invitaciones' },
    suscripciones: { title: 'Suscripciones', subtitle: 'Planes contratados por las asociaciones y sus pagos' },
    planes: { title: 'Planes', subtitle: 'Catálogo de planes y precios (MXN)' },
    auditoria: { title: 'Auditoría', subtitle: 'Bitácora de cambios en la base de datos' },
    sistema: { title: 'Sistema', subtitle: 'Mantenimiento, avisos, reglas y uso de recursos' },
};

export function HeaderSuperadmin({ onOpenSidebar }: { onOpenSidebar: () => void }) {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'superadmin';
    const meta = TITLES[last] ?? TITLES.superadmin;

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
                <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    Sólo desarrollador
                </span>
            </div>
        </header>
    );
}
