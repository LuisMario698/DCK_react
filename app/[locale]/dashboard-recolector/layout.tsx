'use client';

import { useState } from 'react';
import { SidebarRecolector } from '@/components/recolector/SidebarRecolector';
import { HeaderRecolector } from '@/components/recolector/HeaderRecolector';

export default function DashboardRecolectorLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
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
                    <div className="max-w-[100vw] overflow-x-hidden">{children}</div>
                </main>
            </div>
        </div>
    );
}
