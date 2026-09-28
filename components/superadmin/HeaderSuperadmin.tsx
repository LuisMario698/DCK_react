'use client';

import { usePathname } from 'next/navigation';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';

const TITLES: Record<string, { title: string; subtitle: string }> = {
    superadmin: { title: 'Resumen', subtitle: 'Estado general de cuentas, suscripciones e ingresos' },
    cuentas: { title: 'Cuentas', subtitle: 'Usuarios, roles, suspensiones e invitaciones' },
    suscripciones: { title: 'Suscripciones', subtitle: 'Planes contratados por las asociaciones y sus pagos' },
    planes: { title: 'Planes', subtitle: 'Catálogo de planes y precios (MXN)' },
    auditoria: { title: 'Auditoría', subtitle: 'Bitácora de cambios en la base de datos' },
    sistema: { title: 'Sistema', subtitle: 'Mantenimiento, avisos, reglas y uso de recursos' },
};

/** Encabezado del superadmin. En celular el menú se abre desde la barra inferior. */
export function HeaderSuperadmin() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'superadmin';
    const meta = TITLES[last] ?? TITLES.superadmin;

    return (
        <header className="sticky top-3 z-30 mx-4 mt-3 md:mx-6 lg:mx-0 lg:mt-6">
            <div className="simar-vidrio relative rounded-3xl min-h-[74px] flex items-center justify-between gap-3 pl-4 pr-2 sm:pr-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-extrabold text-simar-texto leading-tight truncate">{meta.title}</h1>
                    <p className="text-[15px] text-simar-texto-2 truncate">{meta.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-[15px] font-bold bg-simar-violeta-suave text-simar-violeta">
                        Sólo desarrollador
                    </span>
                    <BotonTemaIcono compacto className="lg:hidden" />
                </div>
            </div>
        </header>
    );
}
