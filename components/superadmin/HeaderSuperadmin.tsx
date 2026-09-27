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
        <header className="sticky top-3 z-30 mx-3 mt-3 lg:mx-0 lg:mt-6">
            <div className="simar-vidrio relative rounded-3xl min-h-[74px] flex items-center justify-between gap-3 px-2.5 sm:px-4">
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
                        <p className="hidden sm:block text-[15px] text-simar-texto-2 truncate">{meta.subtitle}</p>
                    </div>
                </div>
                <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-[15px] font-bold bg-simar-violeta-suave text-simar-violeta">
                    Sólo desarrollador
                </span>
            </div>
        </header>
    );
}
