'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings2, Users } from 'lucide-react';
import { SidebarSuperadmin } from '@/components/superadmin/SidebarSuperadmin';
import { HeaderSuperadmin } from '@/components/superadmin/HeaderSuperadmin';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { BarraInferior } from '@/components/layout/BarraInferior';

/**
 * Panel del desarrollador / superadmin. El middleware sólo deja entrar a
 * cuentas con `profiles.es_superadmin`; además cada RPC `sa_*` lo verifica
 * en la base de datos.
 */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Barra inferior (celular y tableta): las secciones más usadas y "Menú" para lo demás
    const base = `/${pathname.split('/')[1] || 'es'}/superadmin`;
    const principales = [
        { label: 'Resumen', href: base, icon: LayoutDashboard, activo: pathname === base || pathname === `${base}/` },
        { label: 'Cuentas', href: `${base}/cuentas`, icon: Users, activo: pathname.startsWith(`${base}/cuentas`) },
        { label: 'Sistema', href: `${base}/sistema`, icon: Settings2, activo: pathname.startsWith(`${base}/sistema`) },
    ];

    return (
        <div className="min-h-screen bg-simar-papel">
            <FondoSimar />
            <SidebarSuperadmin
                isOpen={isOpen}
                isCollapsed={isCollapsed}
                onClose={() => setIsOpen(false)}
                onToggleCollapse={() => setIsCollapsed((c) => !c)}
            />
            <div className={`relative flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-[120px]' : 'pl-0 lg:pl-[308px]'}`}>
                <HeaderSuperadmin />
                {/* Abajo deja lugar a la barra inferior en celular (y a la zona segura del teléfono) */}
                <main className="flex-1 px-4 pt-4 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-6 md:pt-6 lg:py-8 lg:pr-10 lg:pl-8">
                    <AvisoGlobal mostrarMantenimiento />
                    <div key={pathname} className="simar-pagina max-w-[100vw] overflow-x-hidden">{children}</div>
                </main>
            </div>
            <BarraInferior items={principales} onAbrirMenu={() => setIsOpen(true)} />
        </div>
    );
}
