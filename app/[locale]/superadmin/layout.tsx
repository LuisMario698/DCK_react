'use client';

import { useState } from 'react';
import { SidebarSuperadmin } from '@/components/superadmin/SidebarSuperadmin';
import { HeaderSuperadmin } from '@/components/superadmin/HeaderSuperadmin';
import { AvisoGlobal } from '@/components/layout/AvisoGlobal';

/**
 * Panel del desarrollador / superadmin. El middleware sólo deja entrar a
 * cuentas con `profiles.es_superadmin`; además cada RPC `sa_*` lo verifica
 * en la base de datos.
 */
export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <SidebarSuperadmin
                isOpen={isOpen}
                isCollapsed={isCollapsed}
                onClose={() => setIsOpen(false)}
                onToggleCollapse={() => setIsCollapsed((c) => !c)}
            />
            <div className={`flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0 lg:pl-20' : 'pl-0 lg:pl-64'}`}>
                <HeaderSuperadmin onOpenSidebar={() => setIsOpen(true)} />
                <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
                    <AvisoGlobal mostrarMantenimiento />
                    <div className="max-w-[100vw] overflow-x-hidden">{children}</div>
                </main>
            </div>
        </div>
    );
}
