'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SidebarRecolector } from '@/components/recolector/SidebarRecolector';
import { HeaderRecolector } from '@/components/recolector/HeaderRecolector';
import { RecolectorProvider, useRecolector } from '@/components/recolector/RecolectorContext';

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
                        <AvisoEstado />
                        <div className="max-w-[100vw] overflow-x-hidden">{children}</div>
                    </main>
                </div>
            </div>
        </RecolectorProvider>
    );
}

function AvisoEstado() {
    const { asociacion, bloqueada } = useRecolector();
    if (!bloqueada || !asociacion) return null;
    return (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
                Tu asociación está <strong>{asociacion.estado.toLowerCase()}</strong>. Puedes consultar tu historial y
                escribir al centro de acopio, pero no crear nuevas solicitudes de recolección.
            </p>
        </div>
    );
}
